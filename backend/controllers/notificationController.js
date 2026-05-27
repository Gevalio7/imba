const { pool } = require('../config/db')
const { asyncHandler } = require('../middleware/errorHandler')
const EmailSenderService = require('../services/EmailSenderService')

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

  // Реальная отправка через EmailSenderService (использует SMTP очереди)
  let sendResult = { success: false }
  if (queueId) {
    sendResult = await EmailSenderService.send({
      queueId,
      to: recipients,
      subject,
      html,
    })
  } else {
    // Если нет queueId — пока просто логируем (можно добавить системный SMTP позже)
    console.warn('[NOTIFICATION] Нет queueId — письмо не отправлено (только лог)')
  }

  // Дублируем лог для совместимости со старым кодом
  const logQuery = `
    INSERT INTO notification_delivery_logs 
    (event_type, template_id, queue_id, ticket_id, recipients, status, sent_at, error_message)
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)
  `
  await pool.query(logQuery, [
    eventType,
    templateId || null,
    queueId || null,
    ticketId || null,
    JSON.stringify(recipients),
    sendResult.success ? 'sent' : 'failed',
    sendResult.error || null,
  ])

  res.json({
    success: sendResult.success,
    message: sendResult.success ? 'Email sent successfully' : 'Email send failed (see logs)',
    recipients,
    messageId: sendResult.messageId,
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

/**
 * Получить логи (для админки)
 */
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
  getLogs,
}
