const { simpleParser } = require('mailparser')
const ImapFlow = require('imapflow')
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

// Helper: retry with exponential backoff
async function retry(fn, maxRetries = 3, baseDelaySec = 5) {
  let lastErr
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try { return await fn() }
    catch (e) {
      lastErr = e
      console.warn('[MAIL-FETCHER] retry', attempt, '/', maxRetries, e && e.message)

      const delay = baseDelaySec * 1000 * 2 ** (attempt - 1)

      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw lastErr
}

// === Новые хелперы для обработки ответов на тикеты ===
function extractTicketIdFromSubject(subject) {
  if (!subject) return null
  // Паттерны: [TICKET-123], #123, Ticket #123, TICKET-123
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
      const t = await Tickets.findByExternalId(clean) // reuse externalId logic
      if (t) return t
      // Также можно искать по messageId в будущем
    }
  }
  return null
}

async function findRelatedTicket(parsed, subject) {
  // 1. По заголовкам reply
  let ticket = await findTicketByReplyHeaders(parsed)
  if (ticket) return ticket

  // 2. По номеру в теме
  const ticketNum = extractTicketIdFromSubject(subject)
  if (ticketNum) {
    const t = await Tickets.getByNumber ? await Tickets.getByNumber(`TICKET-${ticketNum}`) : null
    if (t) return t
    // fallback — поиск по id (если номер == id)
    try {
      const byId = await Tickets.getById(ticketNum)
      if (byId) return byId
    } catch {}
  }
  return null
}

class MailFetcherService {
  static async fetchAllAccounts() {
    // Новая рекомендуемая точка входа — по активным очередям
    return this.fetchForActiveQueues()
  }

  /**
   * Основной метод: сбор почты только для активных очередей (queue.isActive === true),
   * у которых есть привязанный почтовый аккаунт.
   */
  static async fetchForActiveQueues() {
    const startedAt = new Date()
    let checkedQueues = 0
    let emailsFound = 0
    let ticketsCreated = 0
    const errors = []

    // Глобальные настройки (fallback)
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
      // Берём активные очереди с привязанным почтовым аккаунтом
      const queuesRes = await Queues.getAll({ isActive: true })
      const activeQueues = (queuesRes.queues || []).filter(q => q.postMasterMailAccountId)

      for (const queue of activeQueues) {
        checkedQueues++

        const account = await PostMasterMailAccounts.getById(queue.postMasterMailAccountId)
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

        try {

          // Connect to IMAP with retries
          const client = new ImapFlow({
            host: account.host,
            port: account.port || 993,
            secure: account.secure !== undefined ? !!account.secure : true,
            auth: {
              user: account.login,
              pass: account.password,
            },
          })

          try {
            await retry(() => client.connect(), maxRetries, baseDelaySec)
          }
          catch (connectErr) {
            errors.push({ accountId: account.id, message: connectErr.message })
            logEntry.finished_at = new Date()
            logEntry.errors = JSON.stringify([{ message: connectErr.message }])
            await MailFetchLogs.create(logEntry)

            // ensure client closed
            try { await client.logout() }
            catch (e) {}
            continue
          }

          // mailbox operations (lock + fetch) wrapped in retry too
          try {
            await retry(async () => {
              const lock = await client.getMailboxLock(account.imapFolder || 'INBOX')
              try {
                // Search for all messages
                for await (const msg of client.fetch('1:*', { envelope: true, source: true, flags: true })) {
                  // Process only unseen
                  if (msg.flags && msg.flags.includes('\\Seen'))
                    continue

                  emailsFound++
                  logEntry.emails_found++

                  const raw = msg.source
                  const parsed = await simpleParser(raw)
                  const from = (parsed.from && parsed.from.value && parsed.from.value[0]) ? parsed.from.value[0].address : null
                  const subject = parsed.subject || '(без темы)'
                  const body = parsed.text || parsed.html || ''
                  const messageId = parsed.messageId || (parsed.headers && parsed.headers.get('message-id')) || null

                  // Duplicate check
                  if (messageId) {
                    const existing = await Tickets.findByExternalId(messageId)
                    if (existing) {
                      // Mark as seen
                      try { await client.messageFlagsAdd(msg.uid, ['\\Seen']) }
                      catch (e) {}
                      continue
                    }
                  }

                  // === НОВАЯ ЛОГИКА: проверка, является ли письмо ответом ===
                  const relatedTicket = await findRelatedTicket(parsed, subject)

                  if (relatedTicket) {
                    // Это ответ на существующий тикет → создаём комментарий
                    let commentCreated = false
                    try {
                      await TicketComments.create({
                        ticketId: relatedTicket.id,
                        content: body,
                        authorId: null, // система / из email
                        isInternal: false,
                      })
                      console.log(`[MAIL-FETCHER] Ответ добавлен как комментарий в тикет #${relatedTicket.id}`)
                      commentCreated = true
                    } catch (commentErr) {
                      console.error('[MAIL-FETCHER] Ошибка создания комментария из email:', commentErr.message)
                      // Логируем ошибку в mail_fetch_logs (приложится к общему логу аккаунта)
                      logEntry.errors = JSON.stringify([{ message: `comment_creation_failed: ${commentErr.message}` }])
                    } finally {
                      // ВСЕГДА помечаем как Seen (даже при ошибке, чтобы не зацикливалось)
                      try { await client.messageFlagsAdd(msg.uid, ['\\Seen']) } catch (e) {}
                    }
                    if (commentCreated) continue
                  }

                  // Determine author (с поддержкой авто-создания + welcome email через reset token)
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
                        // Генерируем одноразовый токен для сброса пароля вместо пароля в письме
                        const resetToken = require('crypto').randomBytes(32).toString('hex')
                        const resetExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 дней

                        const newUser = await CustomerUsers.create({
                          firstName: 'Авто',
                          lastName: 'Пользователь',
                          email: from,
                          login: from,
                          passwordResetToken: resetToken,
                          passwordResetExpires: resetExpires,
                        })

                        ownerId = newUser.id

                        // === Отправка welcome email с ссылкой сброса (если в очереди настроен шаблон) ===
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

                  // Prepare ticket data
                  const ticketData = {
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

                  try {
                    const created = await Tickets.create(ticketData)

                    ticketsCreated++
                    logEntry.tickets_created++

                    // Save attachments to disk and link via ticket_attachments
                    if (parsed.attachments && parsed.attachments.length) {
                      for (const att of parsed.attachments) {
                        try {
                          if (!att || !att.content)
                            continue
                          if (att.size > maxAttachmentBytes) {
                            // note: do not treat as fatal
                            console.warn('[MAIL-FETCHER] attachment too large, skipping', att.filename, att.size)
                            continue
                          }

                          // use TicketAttachments.saveFile to persist buffer
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
                        }
                        catch (attErr) {
                          console.warn('[MAIL-FETCHER] failed to save attachment', att.filename, attErr && attErr.message)
                        }
                      }
                    }

                    // Notify via WebSocket broadcast if available
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
                    }
                    catch (wsErr) {
                      // ignore
                    }

                    // Mark message as seen
                    try { await client.messageFlagsAdd(msg.uid, ['\\Seen']) }
                    catch (e) {}
                  }
                  catch (createErr) {
                    errors.push({ accountId: account.id, message: 'Failed to create ticket', error: createErr.message })
                  }
                }
              }
              finally {
                try { lock.release() }
                catch (e) {}
              }
            }, maxRetries, baseDelaySec)
          }
          catch (mailboxErr) {
            // mailbox-level failures after retries
            errors.push({ accountId: account.id, message: mailboxErr.message })
            logEntry.finished_at = new Date()
            logEntry.errors = JSON.stringify([{ message: mailboxErr.message }])
            await MailFetchLogs.create(logEntry)
            try { await client.logout() }
            catch (e) {}
            continue
          }

          // gracefully logout
          try { await client.logout() }
          catch (e) {}

          logEntry.finished_at = new Date()
          await MailFetchLogs.create(logEntry)
        }
        catch (accountErr) {
          errors.push({ accountId: account.id, message: accountErr.message })
          logEntry.finished_at = new Date()
          logEntry.errors = JSON.stringify([{ message: accountErr.message }])
          await MailFetchLogs.create(logEntry)
        }
      }
    }
    catch (err) {
      errors.push({ message: err.message })
    }

    // Save overall log
    try {
      await MailFetchLogs.create({
        mail_account_id: null,
        started_at: startedAt,
        finished_at: new Date(),
        emails_found: emailsFound,
        tickets_created: ticketsCreated,
        errors: JSON.stringify(errors),
      })
    }
    catch (logErr) {
      // ignore
    }

    return {
      checkedAccounts,
      emailsFound,
      ticketsCreated,
      errors,
    }
  }
}

module.exports = MailFetcherService
