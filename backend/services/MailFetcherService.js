const { simpleParser } = require('mailparser');
const ImapFlow = require('imapflow');
const PostMasterMailAccounts = require('../models/postMasterMailAccounts');
const Queues = require('../models/queues');
const Tickets = require('../models/tickets');
const CustomerUsers = require('../models/customerUsers');
const SystemConfiguration = require('../models/systemConfiguration');
const MailFetchLogs = require('../models/mailFetchLogs');

class MailFetcherService {
  static async fetchAllAccounts() {
    const startedAt = new Date();
    let checkedAccounts = 0;
    let emailsFound = 0;
    let ticketsCreated = 0;
    const errors = [];

    try {
      const accountsRes = await PostMasterMailAccounts.getAll({ isActive: true });
      const accounts = accountsRes.postMasterMailAccounts || [];
      for (const account of accounts) {
        checkedAccounts++;
        const logEntry = {
          mail_account_id: account.id,
          started_at: new Date(),
          finished_at: null,
          emails_found: 0,
          tickets_created: 0,
          errors: null,
        };

        try {
          const queue = account.queueId ? await Queues.getById(account.queueId) : null;
          if (!queue) {
            errors.push({ accountId: account.id, message: 'Queue not found' });
            logEntry.errors = JSON.stringify([{ message: 'Queue not found' }]);
            await MailFetchLogs.create(logEntry);
            continue;
          }

          // Connect to IMAP
          const client = new ImapFlow({
            host: account.host,
            port: 993,
            secure: true,
            auth: {
              user: account.login,
              pass: account.password,
            }
          });

          await client.connect();

          // Select mailbox
          const lock = await client.getMailboxLock(account.imapFolder || 'INBOX');
          try {
            // Search for unseen messages
            for await (let msg of client.fetch('1:*', { envelope: true, source: true, flags: true })) {
              // Process only unseen
              if (msg.flags && msg.flags.includes('\\Seen')) continue;

              emailsFound++;
              logEntry.emails_found++;

              const raw = msg.source;
              const parsed = await simpleParser(raw);
              const from = (parsed.from && parsed.from.value && parsed.from.value[0]) ? parsed.from.value[0].address : null;
              const subject = parsed.subject || '(без темы)';
              const body = parsed.text || parsed.html || '';
              const messageId = parsed.messageId || (parsed.headers && parsed.headers.get('message-id')) || null;

              // Duplicate check
              if (messageId) {
                const existing = await Tickets.findByExternalId(messageId);
                if (existing) {
                  // Mark as seen
                  await client.messageFlagsAdd(msg.uid, ['\\Seen']);
                  continue;
                }
              }

              // Determine author
              let ownerId = null;
              if (from) {
                const existingUser = await CustomerUsers.getByEmail(from);
                if (existingUser) {
                  ownerId = existingUser.id;
                } else {
                  const shouldCreate = await SystemConfiguration.getAll({}).then(r => (r.systemConfiguration || []).find(c => c.key === 'create_customer_user_by_email' || c.name === 'create_customer_user_by_email'));
                  const createFlag = shouldCreate ? (shouldCreate.value === 'true') : false;
                  if (createFlag) {
                    const newUser = await CustomerUsers.create({
                      firstName: 'Авто',
                      lastName: 'Пользователь',
                      email: from,
                      login: from,
                    });
                    ownerId = newUser.id;
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
                ownerId: ownerId,
                source: 'email',
                externalId: messageId,
              };

              if (queue.assignee_id) {
                ticketData.executorAgentIds = queue.assignee_type === 'user' ? [queue.assignee_id] : [];
                ticketData.executorGroupIds = queue.assignee_type === 'group' ? [queue.assignee_id] : [];
              }

              try {
                const created = await Tickets.create(ticketData);
                ticketsCreated++;
                logEntry.tickets_created++;

                // Notify via WebSocket broadcast if available
                try {
                  const websocket = require('../websocket');
                  if (websocket && websocket.broadcast) {
                    websocket.broadcast('new_ticket', {
                      id: created.id,
                      subject: created.title,
                      status: created.stateName || null,
                      createdAt: new Date(),
                    });
                  }
                } catch (wsErr) {
                  // ignore
                }

                // Mark message as seen
                await client.messageFlagsAdd(msg.uid, ['\\Seen']);

              } catch (createErr) {
                errors.push({ accountId: account.id, message: 'Failed to create ticket', error: createErr.message });
              }
            }
          } finally {
            lock.release();
            await client.logout();
          }

          logEntry.finished_at = new Date();
          await MailFetchLogs.create(logEntry);

        } catch (accountErr) {
          errors.push({ accountId: account.id, message: accountErr.message });
          logEntry.finished_at = new Date();
          logEntry.errors = JSON.stringify([{ message: accountErr.message }]);
          await MailFetchLogs.create(logEntry);
        }
      }
    } catch (err) {
      errors.push({ message: err.message });
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
      });
    } catch (logErr) {
      // ignore
    }

    return {
      checkedAccounts,
      emailsFound,
      ticketsCreated,
      errors,
    };
  }
}

module.exports = MailFetcherService;