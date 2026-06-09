const { simpleParser } = require('mailparser')
const { ImapFlow } = require('imapflow')
const PostMasterMailAccounts = require('../models/postMasterMailAccounts')
const Queues = require('../models/queues')
const Tickets = require('../models/tickets')
const CustomerUsers = require('../models/customerUsers')
const SystemConfiguration = require('../models/systemConfiguration')
const MailFetchLogs = require('../models/mailFetchLogs')
const TicketAttachments = require('../models/ticketAttachments')
const TicketComments = require('../models/ticketComments')
const EmailSenderService = require('./EmailSenderService')
const Templates = require('../models/templates')

async function retry(fn, maxRetries = 3, baseDelaySec = 5) {
  let lastErr
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try { return await fn() }
    catch (e) {
      lastErr = e
      console.warn('[MAIL-FETCHER] retry', attempt, '/', maxRetries, e && e.message)
      const delay = baseDelaySec * 1000 * Math.pow(2, attempt - 1)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw lastErr
}

function extractTicketIdFromSubject(subject) {
  if (!subject) return null
  const patterns = [
    /\[TICKET-(\d+)\]/i,
    /#(\d+)/,
    /Ticket\s*#?(\d+)/i,
    /TICKET-(\d+)/i,
  ]
  for (const re of patterns) {
    const m = subject.match(re)
    if (m) return Number.parseInt(m[1], 10)
  }
  return null
}

async function findTicketByReplyHeaders(parsed) {
  const headers = parsed.headers || new Map()
  const inReplyTo = headers.get('in-reply-to') || headers.get('in-reply-to'.toLowerCase())
  const references = headers.get('references') || headers.get('references'.toLowerCase())

  const candidates = []
  if (inReplyTo) candidates.push(inReplyTo)
  if (references) {
    if (typeof references === 'string') candidates.push(...references.split(/\s+/))
    else if (Array.isArray(references)) candidates.push(...references)
  }

  for (const ref of candidates) {
    if (!ref) continue
    const clean = String(ref).trim().replace(/[<>]/g, '')
    if (clean) {
      const t = await Tickets.findByExternalId(clean)
      if (t) return t
    }
  }
  return null
}

async function findRelatedTicket(parsed, subject) {
  let ticket = await findTicketByReplyHeaders(parsed)
  if (ticket) return ticket

  const ticketNum = extractTicketIdFromSubject(subject)
  if (ticketNum) {
    const t = await Tickets.getByNumber ? await Tickets.getByNumber(`TICKET-${ticketNum}`) : null
    if (t) return t
  }
  return null
}

class MailFetcherService {
  static async fetchAllAccounts() {
    console.log('[MAIL-FETCHER] Starting fetchAllAccounts')
    return this.fetchForActiveQueues()
  }

  static async fetchForActiveQueues() {
    const startedAt = new Date()
    let checkedQueues = 0
    let emailsFound = 0
    let ticketsCreated = 0
    const errors = []

    console.log('[MAIL-FETCHER] Starting fetchForActiveQueues')

    let maxRetries = 3
    let baseDelaySec = 30
    let maxAttachmentMb = 25
    try {
      const cfg = await SystemConfiguration.getAll({ isActive: true })
      const all = cfg.systemConfiguration || []
      const r = all.find(c => c.key === 'mail_fetcher_max_retries' || c.name === 'mail_fetcher_max_retries')
      const d = all.find(c => c.key === 'mail_fetcher_retry_delay_seconds' || c.name === 'mail_fetcher_retry_delay_seconds')
      const m = all.find(c => c.key === 'mail_fetcher_max_attachment_size_mb' || c.name === 'mail_fetcher_max_attachment_size_mb')
      if (r && Number.parseInt(r.value, 10)) maxRetries = Number.parseInt(r.value, 10)
      if (d && Number.parseInt(d.value, 10)) baseDelaySec = Number.parseInt(d.value, 10)
      if (m && Number.parseInt(m.value, 10)) maxAttachmentMb = Number.parseInt(m.value, 10)
    } catch (cfgErr) {}

    const maxAttachmentBytes = maxAttachmentMb * 1024 * 1024

    try {
      const queuesRes = await Queues.getAll({ isActive: true })
      const activeQueues = (queuesRes.queues || []).filter(q => q.postMasterMailAccountId)

      console.log(`[MAIL-FETCHER] Found ${activeQueues.length} active queues with mail accounts`)
      console.log(`[MAIL-FETCHER] Active queues:`, activeQueues.map(q => ({ id: q.id, name: q.name, mailAccountId: q.postMasterMailAccountId })))

      if (activeQueues.length === 0) {
        console.log('[MAIL-FETCHER] No active queues with mail accounts found')
        await MailFetchLogs.create({
          mail_account_id: null,
          started_at: startedAt,
          finished_at: new Date(),
          emails_found: 0,
          tickets_created: 0,
          errors: JSON.stringify([{ message: 'No active queues with mail accounts found' }]),
        })
      }

      for (const queue of activeQueues) {
        checkedQueues++

        const account = await PostMasterMailAccounts.getById(queue.postMasterMailAccountId)
        console.log(`[MAIL-FETCHER] Processing queue ${queue.id}, account ${account?.id}, isActive: ${account?.isActive}`)
        if (!account || !account.isActive) {
          continue
        }

        const logEntry = {
          mail_account_id: account.id,
          started_at: new Date(),
          finished_at: null,
          emails_found: 0,
          tickets_created: 0,
          errors: null,
        }

        let client = null

        try {
          client = new ImapFlow({
            host: account.host,
            port: account.port || 993,
            secure: account.secure !== undefined ? !!account.secure : true,
            auth: {
              user: account.login,
              pass: account.password,
            },
          })

          await retry(() => client.connect(), maxRetries, baseDelaySec)
        }
        catch (connectErr) {
          errors.push({ accountId: account.id, message: connectErr.message })
          logEntry.finished_at = new Date()
          logEntry.errors = JSON.stringify([{ message: connectErr.message }])
          await MailFetchLogs.create(logEntry)
          if (client) {
            try { await client.logout() } catch (e) {}
          }
          continue
        }

        try {
          await retry(async () => {
            const lock = await client.getMailboxLock(account.imapFolder || 'INBOX')
            try {
              const searchCriteria = { unseen: true }
              const sequenceNumbers = await client.search(searchCriteria)
              console.log(`[MAIL-FETCHER] Found ${sequenceNumbers.length} UNSEEN messages, sequence numbers:`, sequenceNumbers.slice(0, 5))

              for (const seq of sequenceNumbers) {
                try {
                  const msg = await client.fetchOne(seq, { envelope: true, source: true })

                  if (msg.flags instanceof Set && msg.flags.has('\\Seen')) {
                    continue
                  }
                  else if (msg.flags && (msg.flags.includes ? msg.flags.includes('\\Seen') : false)) {
                    continue
                  }

                  emailsFound++
                  logEntry.emails_found++

                  let parsed
                  try {
                    const raw = msg.source
                    parsed = await simpleParser(raw)
                    console.log(`[MAIL-FETCHER] Processing message UID ${msg.uid}, subject: "${parsed.subject?.substring(0, 50)}"`)
                  } catch (parseErr) {
                    console.error('[MAIL-FETCHER] FAILED TO PARSE EMAIL:', parseErr.stack || parseErr.message)
                    logEntry.errors = JSON.stringify([{ message: `parse_failed: ${parseErr.message}`, stack: parseErr.stack }])
                    try { await client.messageFlagsAdd(seq, ['\\Seen']) } catch (e) {}
                    continue
                  }

                  const from = (parsed.from && parsed.from.value && parsed.from.value[0]) ? parsed.from.value[0].address : null
                  const subject = parsed.subject || '(без темы)'
                  const body = parsed.text || parsed.html || ''
                  const messageId = parsed.messageId || (parsed.headers && parsed.headers.get('message-id')) || null

                  if (messageId) {
                    console.log(`[MAIL-FETCHER] Checking duplicate for messageId: ${messageId}`)
                    try {
                      const existing = await Tickets.findByExternalId(messageId)
                      console.log(`[MAIL-FETCHER] findByExternalId result:`, existing ? `found ticket ${existing.id}` : 'not found')
                      if (existing) {
                        console.log(`[MAIL-FETCHER] Duplicate found, marking as Seen and skipping`)
                        try { await client.messageFlagsAdd(seq, ['\\Seen']) } catch (e) {}
                        continue
                      }
                    } catch (err) {
                      console.error('[MAIL-FETCHER] findByExternalId ERROR:', err.message)
                    }
                  }

                  console.log(`[MAIL-FETCHER] Checking if reply to existing ticket`)
                  const relatedTicket = await findRelatedTicket(parsed, subject)

                  if (relatedTicket) {
                    let commentCreated = false
                    try {
                      await TicketComments.create({
                        ticketId: relatedTicket.id,
                        content: body,
                        authorId: null,
                        isInternal: false,
                      })
                      console.log(`[MAIL-FETCHER] Ответ добавлен как комментарий в тикет #${relatedTicket.id}`)
                      commentCreated = true
                    } catch (commentErr) {
                      console.error('[MAIL-FETCHER] Ошибка создания комментария из email:', commentErr.message)
                      logEntry.errors = JSON.stringify([{ message: `comment_creation_failed: ${commentErr.message}` }])
                    } finally {
                      try { await client.messageFlagsAdd(seq, ['\\Seen']) } catch (e) {}
                    }
                    if (commentCreated) continue
                  }

                  console.log(`[MAIL-FETCHER] Looking for existing customer user by email: ${from}`)
                  let ownerId = null
                  if (from) {
                    const existingUser = await CustomerUsers.getByEmail(from)
                    if (existingUser) {
                      ownerId = existingUser.id
                    }
                    else {
                      const shouldCreate = await SystemConfiguration.getAll({}).then(r => (r.systemConfiguration || []).find(c => c.key === 'create_customer_user_by_email' || c.name === 'create_customer_user_by_email'))
                      const createFlag = shouldCreate ? (shouldCreate.value === 'true') : false
                      if (createFlag) {
                        const resetToken = require('crypto').randomBytes(32).toString('hex')
                        const resetExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

                        const crypto = require('crypto')
                        const randomPassword = crypto.randomBytes(16).toString('hex')
                        const hashedPassword = crypto.createHash('sha256').update(randomPassword).digest('base64')

                        console.log(`[MAIL-FETCHER] Creating new customer user for email: ${from}`)
                        const newUser = await CustomerUsers.create({
                          firstName: 'Авто',
                          lastName: 'Пользователь',
                          email: from,
                          login: from,
                          password: hashedPassword,
                          passwordResetToken: resetToken,
                          passwordResetExpires: resetExpires,
                        })

                        ownerId = newUser.id

                        if (queue.templateCustomerWelcomeId && resetToken) {
                          try {
                            const template = await Templates.getById(queue.templateCustomerWelcomeId)
                            if (template && template.isActive !== false) {
                              const resetLink = `${process.env.APP_URL || 'http://localhost:5050'}/reset-password?token=${resetToken}`
                              let welcomeHtml = (template.message || '').replace(/\{\{email\}\}/g, from)
                                .replace(/\{\{resetLink\}\}/g, resetLink)
                                .replace(/\{\{login\}\}/g, from)

                              await EmailSenderService.send({
                                queueId: queue.id,
                                to: from,
                                subject: template.name || 'Добро пожаловать в систему поддержки',
                                html: welcomeHtml,
                              })
                              console.log(`[MAIL-FETCHER] Welcome email отправлен новому клиенту ${from}`)
                            }
                          } catch (welcomeErr) {
                            console.warn('[MAIL-FETCHER] Не удалось отправить welcome email:', welcomeErr.message)
                          }
                        }
                      }
                    }
                  }

                  const ticketNumber = await Tickets.generateTicketNumber()
                  const ticketData = {
                    ticketNumber: ticketNumber,
                    title: subject,
                    description: body,
                    typeId: queue.typeId,
                    categoryId: queue.categoryId,
                    priorityId: queue.priorityId,
                    queueId: queue.id,
                    slaId: queue.slaId,
                    ownerId,
                    source: 'email',
                    externalId: messageId,
                  }

                  if (queue.assignee_id) {
                    ticketData.executorAgentIds = queue.assignee_type === 'user' ? [queue.assignee_id] : []
                    ticketData.executorGroupIds = queue.assignee_type === 'group' ? [queue.assignee_id] : []
                  }

                  console.log(`[MAIL-FETCHER] Creating new ticket from email`)
                  console.log(`[MAIL-FETCHER] ticketNumber: ${ticketNumber}, ownerId: ${ownerId}`)
                  try {
                    const created = await Tickets.create(ticketData)
                    ticketsCreated++
                    logEntry.tickets_created++

                    if (parsed.attachments && parsed.attachments.length) {
                      for (const att of parsed.attachments) {
                        try {
                          if (!att || !att.content) continue
                          if (att.size > maxAttachmentBytes) {
                            console.warn('[MAIL-FETCHER] attachment too large, skipping', att.filename, att.size)
                            continue
                          }

                          const fileObj = { buffer: att.content, originalname: att.filename || 'attachment' }
                          const storedFilename = await TicketAttachments.saveFile(fileObj)

                          await TicketAttachments.create({
                            ticketId: created.id,
                            filename: storedFilename,
                            originalName: storedFilename,
                            mimetype: att.contentType || 'application/octet-stream',
                            filesize: att.size || 0,
                            uploaderId: null,
                          })
                        } catch (attErr) {
                          console.warn('[MAIL-FETCHER] failed to save attachment', att.filename, attErr && attErr.message)
                        }
                      }
                    }

                    try {
                      const websocket = require('../websocket')
                      if (websocket && websocket.broadcast) {
                        websocket.broadcast('new_ticket', {
                          id: created.id,
                          subject: created.title,
                          status: created.stateName || null,
                          createdAt: new Date(),
                        })
                      }
                    } catch (wsErr) {}
                  } catch (createErr) {
                    console.error('[MAIL-FETCHER] FAILED TO CREATE TICKET:', createErr.stack || createErr.message)
                    errors.push({ accountId: account.id, message: 'Failed to create ticket', error: createErr.message })
                    logEntry.errors = JSON.stringify([{ message: createErr.message, stack: createErr.stack }])
                  } finally {
                    try { await client.messageFlagsAdd(seq, ['\\Seen']) } catch (e) {}
                  }
                } catch (fetchErr) {
                  console.error(`[MAIL-FETCHER] Error fetching message ${seq}:`, fetchErr.message)
                  continue
                }
              }
            } finally {
              try { lock.release() } catch (e) {}
            }
          }, maxRetries, baseDelaySec)
        } catch (mailboxErr) {
          errors.push({ accountId: account.id, message: mailboxErr.message })
          logEntry.finished_at = new Date()
          logEntry.errors = JSON.stringify([{ message: mailboxErr.message }])
          await MailFetchLogs.create(logEntry)
          if (client) {
            try { await client.logout() } catch (e) {}
          }
          continue
        }

        if (client) {
          try { await client.logout() } catch (e) {}
        }

        logEntry.finished_at = new Date()
        await MailFetchLogs.create(logEntry)
      }
    } catch (err) {
      errors.push({ message: err.message })
      console.error('[MAIL-FETCHER] Unexpected error:', err)
    }

    try {
      await MailFetchLogs.create({
        mail_account_id: null,
        started_at: startedAt,
        finished_at: new Date(),
        emails_found: emailsFound,
        tickets_created: ticketsCreated,
        errors: JSON.stringify(errors),
      })
      console.log('[MAIL-FETCHER] Overall log created')
    } catch (logErr) {
      console.error('[MAIL-FETCHER] Failed to create overall log:', logErr)
    }

    console.log('[MAIL-FETCHER] Completed:', { checkedQueues, emailsFound, ticketsCreated, errors: errors.length })

    return {
      checkedQueues,
      emailsFound,
      ticketsCreated,
      errors,
    }
  }
}

module.exports = MailFetcherService
