const { pool } = require('../config/db')
const { asyncHandler } = require('../middleware/errorHandler')
const EmailNotificationQueueService = require('../services/EmailNotificationQueueService')

/**
 * Отправка уведомления (email)
 * В реальной реализации здесь подключается nodemailer + SMTP из system_configuration или очереди
 */
const sendNotification = asyncHandler(async (req, res) => {
  const { eventType, templateId, ticketId, queueId, subject, html, recipients } = req.body

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ message: 'recipients required' })
  }

  console.log(`[NOTIFICATION] Событие: ${eventType}, шаблон: ${templateId}, тикет: ${ticketId}`)
  console.log(`[NOTIFICATION] Получатели: ${recipients.join(', ')}`)
  console.log(`[NOTIFICATION] Тема: ${subject}`)

  const queued = await EmailNotificationQueueService.enqueue({
    eventType,
    templateId,
    queueId,
    ticketId,
    recipients,
    subject,
    html,
  })

  res.json({
    success: true,
    message: 'Email queued for delivery',
    queueId: queued.id,
    recipients,
  })
})

/**
 * Запись в лог (ручной вызов)
 */
const logDelivery = asyncHandler(async (req, res) => {
  const { eventType, templateId, ticketId, recipients, status = 'sent', errorMessage } = req.body

  const query = `
    INSERT INTO notification_delivery_logs 
    (event_type, template_id, ticket_id, recipients, status, error_message, sent_at)
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
  `
  await pool.query(query, [
    eventType,
    templateId,
    ticketId,
    JSON.stringify(recipients || []),
    status,
    errorMessage || null,
  ])

  res.status(201).json({ success: true })
})

const processQueue = asyncHandler(async (req, res) => {
  const result = await EmailNotificationQueueService.processPendingEmailNotifications({
    limit: Number.parseInt(req.query.limit || '10', 10),
  })
  res.json(result)
})

const getQueue = asyncHandler(async (req, res) => {
  const rows = await EmailNotificationQueueService.getQueue({
    limit: Number.parseInt(req.query.limit || '50', 10),
    offset: Number.parseInt(req.query.offset || '0', 10),
    status: req.query.status,
  })
  res.json({ queue: rows })
})

const getQueueStats = asyncHandler(async (req, res) => {
  res.json(await EmailNotificationQueueService.getQueueStats())
})

const getLogs = asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0, eventType, status } = req.query

  let where = 'WHERE 1=1'
  const params = []
  let i = 1

  if (eventType) {
    where += ` AND event_type = $${i++}`
    params.push(eventType)
  }
  if (status) {
    where += ` AND status = $${i++}`
    params.push(status)
  }

  const query = `
    SELECT * FROM notification_delivery_logs
    ${where}
    ORDER BY sent_at DESC
    LIMIT $${i++} OFFSET $${i++}
  `
  params.push(Number(limit), Number(offset))

  const { rows } = await pool.query(query, params)

  res.json({ logs: rows })
})

module.exports = {
  sendNotification,
  logDelivery,
  processQueue,
  getQueue,
  getQueueStats,
  getLogs,
}
