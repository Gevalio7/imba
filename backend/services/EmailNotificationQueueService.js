const { pool } = require('../config/db')
const EmailSenderService = require('./EmailSenderService')

const QUEUE_TABLE = 'email_notification_queue'
let processing = false

function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function normalizeJob(row) {
  const job = {}
  for (const [key, value] of Object.entries(row)) {
    job[snakeToCamel(key)] = value
  }
  return job
}

async function ensureTables() {
  await pool.query(`
    ALTER TABLE notification_delivery_logs
    ADD COLUMN IF NOT EXISTS message_id TEXT;
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${QUEUE_TABLE} (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(100) NOT NULL,
      template_id INTEGER REFERENCES templates(id) ON DELETE SET NULL,
      queue_id INTEGER,
      ticket_id INTEGER,
      recipients JSONB NOT NULL,
      subject TEXT NOT NULL,
      html TEXT,
      text TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 8,
      next_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      attempt_at TIMESTAMP WITH TIME ZONE,
      last_error TEXT,
      sent_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_email_notification_queue_status_next ON ${QUEUE_TABLE}(status, next_attempt_at);
    CREATE INDEX IF NOT EXISTS idx_email_notification_queue_ticket ON ${QUEUE_TABLE}(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_email_notification_queue_created ON ${QUEUE_TABLE}(created_at);
  `)
}

async function enqueue(options) {
  await ensureTables()

  const {
    eventType,
    templateId,
    queueId,
    ticketId,
    recipients,
    subject,
    html,
    text,
    maxAttempts = 8,
  } = options

  if (!queueId) {
    throw new Error('queueId required')
  }
  if (!recipients || (Array.isArray(recipients) ? recipients.length === 0 : !recipients)) {
    throw new Error('recipients required')
  }

  const normalizedRecipients = Array.isArray(recipients) ? recipients : [recipients]
  const result = await pool.query(
    `
      INSERT INTO ${QUEUE_TABLE}
      (event_type, template_id, queue_id, ticket_id, recipients, subject, html, text, max_attempts)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `,
    [
      eventType || 'email_sent',
      templateId || null,
      queueId || null,
      ticketId || null,
      JSON.stringify(normalizedRecipients),
      subject || '',
      html || null,
      text || null,
      maxAttempts,
    ],
  )

  console.log(`[EMAIL-QUEUE] Queued email ${result.rows[0].id} for ticket ${ticketId || 'null'}`)
  return result.rows[0]
}

async function markStaleSendingAsPending() {
  const result = await pool.query(`
    UPDATE ${QUEUE_TABLE}
    SET status = 'pending',
        next_attempt_at = NOW(),
        updated_at = NOW(),
        last_error = COALESCE(last_error, 'worker stopped while sending')
    WHERE status = 'sending'
      AND attempt_at < NOW() - INTERVAL '15 minutes'
  `)

  if (result.rowCount > 0) {
    console.log(`[EMAIL-QUEUE] Requeued ${result.rowCount} stale sending emails`)
  }
}

function calculateRetryDelayMs(attempts) {
  const baseDelaySec = 30
  const maxDelaySec = 60 * 60
  const delaySec = Math.min(maxDelaySec, baseDelaySec * Math.pow(2, Math.max(0, attempts - 1)))
  return delaySec * 1000
}

async function logDelivery(job, status, error = null, messageId = null) {
  const recipients = typeof job.recipients === 'string' ? job.recipients : JSON.stringify(job.recipients)
  await pool.query(
    `
      INSERT INTO notification_delivery_logs
      (event_type, template_id, queue_id, ticket_id, recipients, status, error_message, sent_at, message_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8)
    `,
    [
      job.eventType || 'ticket_status_changed',
      job.templateId || null,
      job.queueId || null,
      job.ticketId || null,
      recipients,
      status,
      error || null,
      messageId || null,
    ],
  )
}

async function processJob(job) {
  try {
    console.log(`[EMAIL-QUEUE] Processing job ${job.id}: queue ${job.queueId}, to ${job.recipients?.length || 0} recipients`)
    const recipients = typeof job.recipients === 'string' ? JSON.parse(job.recipients) : job.recipients
    const result = await EmailSenderService.send({
      queueId: job.queueId,
      to: recipients,
      subject: job.subject,
      html: job.html,
      text: job.text,
    })

    if (result.success) {
      console.log(`[EMAIL-QUEUE] Job ${job.id} sent successfully: ${result.messageId}`)
      await logDelivery(job, 'sent', null, result.messageId || null)
      await pool.query(
        `
          UPDATE ${QUEUE_TABLE}
          SET status = 'sent',
              sent_at = NOW(),
              updated_at = NOW(),
              last_error = NULL
          WHERE id = $1
        `,
        [job.id],
      )
      console.log(`[EMAIL-QUEUE] Sent email queue item ${job.id}`)
      return { id: job.id, status: 'sent' }
    }

    const error = result.error || 'Email send failed'
    console.warn(`[EMAIL-QUEUE] Job ${job.id} failed: ${error}`)
    await logDelivery(job, 'failed', error, null)

    if (job.attempts >= job.maxAttempts) {
      await pool.query(
        `
          UPDATE ${QUEUE_TABLE}
          SET status = 'failed',
              updated_at = NOW(),
              last_error = $2
          WHERE id = $1
        `,
        [job.id, error],
      )
      console.warn(`[EMAIL-QUEUE] Email queue item ${job.id} failed permanently: ${error}`)
      return { id: job.id, status: 'failed', error }
    }

    const nextAttemptAt = new Date(Date.now() + calculateRetryDelayMs(job.attempts))
    await pool.query(
      `
        UPDATE ${QUEUE_TABLE}
        SET status = 'pending',
            next_attempt_at = $2,
            updated_at = NOW(),
            last_error = $3
        WHERE id = $1
      `,
      [job.id, nextAttemptAt, error],
    )
    console.warn(`[EMAIL-QUEUE] Email queue item ${job.id} will retry at ${nextAttemptAt.toISOString()}: ${error}`)
    return { id: job.id, status: 'pending', error }
  } catch (err) {
    const error = err.message || String(err)
    console.error(`[EMAIL-QUEUE] Job ${job.id} exception:`, error)
    await logDelivery(job, 'failed', error, null)

    if (job.attempts >= job.maxAttempts) {
      await pool.query(
        `
          UPDATE ${QUEUE_TABLE}
          SET status = 'failed',
              updated_at = NOW(),
              last_error = $2
          WHERE id = $1
        `,
        [job.id, error],
      )
      console.warn(`[EMAIL-QUEUE] Email queue item ${job.id} failed permanently: ${error}`)
      return { id: job.id, status: 'failed', error }
    }

    const nextAttemptAt = new Date(Date.now() + calculateRetryDelayMs(job.attempts))
    await pool.query(
      `
        UPDATE ${QUEUE_TABLE}
        SET status = 'pending',
            next_attempt_at = $2,
            updated_at = NOW(),
            last_error = $3
        WHERE id = $1
      `,
      [job.id, nextAttemptAt, error],
    )
    console.warn(`[EMAIL-QUEUE] Email queue item ${job.id} will retry at ${nextAttemptAt.toISOString()}: ${error}`)
    return { id: job.id, status: 'pending', error }
  }
}

async function processPendingEmailNotifications(options = {}) {
  if (processing && !options.force) {
    return { processed: 0, skipped: 1, message: 'worker is already processing' }
  }

  processing = true
  try {
    await ensureTables()
    await markStaleSendingAsPending()

    const limit = Math.max(1, Number.parseInt(options.limit || process.env.EMAIL_QUEUE_BATCH_SIZE || '10', 10))

    const jobsResult = await pool.query(
      `
        SELECT *
        FROM ${QUEUE_TABLE}
        WHERE status = 'pending'
          AND next_attempt_at <= NOW()
        ORDER BY created_at ASC
        LIMIT $1
      `,
      [limit],
    )

    if (jobsResult.rows.length === 0) {
      return { processed: 0, pending: 0 }
    }

    const results = []
    for (const row of jobsResult.rows) {
      const job = normalizeJob(row)
      const attempts = job.attempts + 1
      await pool.query(
        `
          UPDATE ${QUEUE_TABLE}
          SET status = 'sending',
              attempts = $2,
              attempt_at = NOW(),
              updated_at = NOW()
          WHERE id = $1
        `,
        [job.id, attempts],
      )

      results.push(await processJob({ ...job, attempts }))
    }

    const pendingResult = await pool.query(
      `
        SELECT COUNT(*) AS total
        FROM ${QUEUE_TABLE}
        WHERE status = 'pending'
      `,
    )

    return {
      processed: jobsResult.rows.length,
      pending: Number(pendingResult.rows[0].total),
      results,
    }
  } finally {
    processing = false
  }
}

let workerStarted = false
let workerTimer = null

function startWorker(options = {}) {
  if (workerStarted) return
  workerStarted = true

  const intervalMs = Number.parseInt(options.intervalMs || process.env.EMAIL_QUEUE_INTERVAL_MS || '15000', 10)
  const limit = Number.parseInt(options.limit || process.env.EMAIL_QUEUE_BATCH_SIZE || '10', 10)

  workerTimer = setInterval(() => {
    processPendingEmailNotifications({ limit }).catch(err => {
      console.error('[EMAIL-QUEUE] Worker error:', err.message)
    })
  }, intervalMs)

  workerTimer.unref?.()

  processPendingEmailNotifications({ limit }).catch(err => {
    console.error('[EMAIL-QUEUE] Initial worker error:', err.message)
  })

  console.log(`[EMAIL-QUEUE] Worker started with interval ${intervalMs}ms, batch ${limit}`)
}

async function getQueueStats() {
  await ensureTables()
  const result = await pool.query(
    `
      SELECT status, COUNT(*) AS count
      FROM ${QUEUE_TABLE}
      GROUP BY status
    `,
  )

  const stats = { total: 0 }
  for (const row of result.rows) {
    stats[row.status] = Number(row.count)
    stats.total += Number(row.count)
  }
  return stats
}

async function getQueue(options = {}) {
  await ensureTables()
  const limit = Math.max(1, Number.parseInt(options.limit || '50', 10))
  const offset = Math.max(0, Number.parseInt(options.offset || '0', 10))
  const status = options.status || undefined

  const where = status ? 'WHERE status = $1' : ''
  const params = status ? [status, limit, offset] : [limit, offset]

  const result = await pool.query(
    `
      SELECT *
      FROM ${QUEUE_TABLE}
      ${where}
      ORDER BY created_at DESC
      LIMIT $${status ? 2 : 1} OFFSET $${status ? 3 : 2}
    `,
    params,
  )

  return result.rows
}

module.exports = {
  ensureTables,
  enqueue,
  processPendingEmailNotifications,
  startWorker,
  getQueueStats,
  getQueue,
}
