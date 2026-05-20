const { simpleParser } = require('mailparser')
const ImapFlow = require('imapflow')
const PostMasterMailAccounts = require('../models/postMasterMailAccounts')
const Queues = require('../models/queues')
const Tickets = require('../models/tickets')
const CustomerUsers = require('../models/customerUsers')
const SystemConfiguration = require('../models/systemConfiguration')
const MailFetchLogs = require('../models/mailFetchLogs')
const TicketAttachments = require('../models/ticketAttachments')

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

class MailFetcherService {
  static async fetchAllAccounts() {
    const startedAt = new Date()
    let checkedAccounts = 0
    let emailsFound = 0
    let ticketsCreated = 0
    const errors = []

    // Read retry/attachment configs
    let maxRetries = 3
    let baseDelaySec = 5
    let maxAttachmentMb = 10
    try {
      const cfg = await SystemConfiguration.getAll({ isActive: true })
      const all = cfg.systemConfiguration || []
      const r = all.find(c => c.key === 'mail_fetcher_max_retries' || c.name === 'mail_fetcher_max_retries')
      const d = all.find(c => c.key === 'mail_fetcher_retry_delay_seconds' || c.name === 'mail_fetcher_retry_delay_seconds')
      const m = all.find(c => c.key === 'mail_fetcher_max_attachment_size_mb' || c.name === 'mail_fetcher_max_attachment_size_mb')
      if (r && Number.parseInt(r.value, 10))
        maxRetries = Number.parseInt(r.value, 10)
      if (d && Number.parseInt(d.value, 10))
        baseDelaySec = Number.parseInt(d.value, 10)
      if (m && Number.parseInt(m.value, 10))
        maxAttachmentMb = Number.parseInt(m.value, 10)
    }
    catch (cfgErr) {
      // ignore, use defaults
    }

    const maxAttachmentBytes = maxAttachmentMb * 1024 * 1024

    try {
      const accountsRes = await PostMasterMailAccounts.getAll({ isActive: true })
      const accounts = accountsRes.postMasterMailAccounts || []
      for (const account of accounts) {
        checkedAccounts++

        const logEntry = {
          mail_account_id: account.id,
          started_at: new Date(),
          finished_at: null,
          emails_found: 0,
          tickets_created: 0,
          errors: null,
        }

        try {
          const queue = account.queueId ? await Queues.getById(account.queueId) : null
          if (!queue) {
            errors.push({ accountId: account.id, message: 'Queue not found' })
            logEntry.errors = JSON.stringify([{ message: 'Queue not found' }])
            await MailFetchLogs.create(logEntry)
            continue
          }

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

                  // Determine author
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
                        const newUser = await CustomerUsers.create({
                          firstName: 'Авто',
                          lastName: 'Пользователь',
                          email: from,
                          login: from,
                        })

                        ownerId = newUser.id
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
