const nodemailer = require('nodemailer')
const PostMasterMailAccounts = require('../models/postMasterMailAccounts')
const Queues = require('../models/queues')
const { pool } = require('../config/db')

/**
 * EmailSenderService
 * Реальная отправка писем через SMTP аккаунта, привязанного к очереди.
 * Использует nodemailer.
 */
class EmailSenderService {
  /**
   * Отправить email от имени почтового ящика очереди
   * @param {Object} options
   * @param {number} options.queueId - ID очереди (для получения mailAccount + подписи)
   * @param {string|string[]} options.to - получатель(и)
   * @param {string} options.subject
   * @param {string} [options.html]
   * @param {string} [options.text]
   * @param {Object} [options.attachments] - nodemailer attachments
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  static async send(options) {
    const { queueId, to, subject, html, text, attachments } = options

    if (!queueId) {
      throw new Error('queueId обязателен для отправки через почтовый ящик очереди')
    }
    if (!to || (Array.isArray(to) ? to.length === 0 : !to)) {
      throw new Error('to обязателен')
    }

    try {
      const queue = await Queues.getById(queueId)
      if (!queue) throw new Error(`Queue ${queueId} not found`)
      if (!queue.postMasterMailAccountId) {
        console.warn(`[EmailSender] У очереди ${queueId} нет привязанного PostMasterMailAccount — используем fallback (не реализовано)`)
        // TODO: fallback на системный SMTP из system_configuration
        return { success: false, error: 'No mail account linked to queue' }
      }

      const account = await PostMasterMailAccounts.getById(queue.postMasterMailAccountId)
      if (!account) throw new Error('Mail account not found')

      // Собираем SMTP конфиг (приоритет — smtp_* поля)
      const smtpHost = account.smtpHost || account.host
      const smtpPort = account.smtpPort || (account.smtpSecure ? 465 : 587)
      const smtpUser = account.smtpUser || account.login
      const smtpPass = account.smtpPassword || account.password // уже расшифрован в модели

      if (!smtpHost || !smtpUser || !smtpPass) {
        throw new Error('Неполные SMTP-credentials в почтовом аккаунте')
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: !!account.smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        // Для некоторых корпоративных серверов:
        tls: {
          rejectUnauthorized: false,
        },
        // Таймауты для предотвращения бесконечного ожидания
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      })

      // Добавляем подпись если включена
      let finalHtml = html || ''
      if (queue.signatureEnabled && queue.signatureText) {
        finalHtml = `${finalHtml}<br><br>--<br>${queue.signatureText.replace(/\n/g, '<br>')}`
      }

      const mailOptions = {
        from: `"${account.name || smtpUser}" <${smtpUser}>`,
        to: Array.isArray(to) ? to.join(',') : to,
        subject,
        text: text || (html ? html.replace(/<[^>]+>/g, '') : ''),
        html: finalHtml || undefined,
        attachments,
      }

      const info = await transporter.sendMail(mailOptions)

      // Логируем успех
      await this.logDelivery({
        eventType: 'email_sent',
        queueId,
        recipients: Array.isArray(to) ? to : [to],
        status: 'sent',
        messageId: info.messageId,
      })

      console.log(`[EmailSender] Письмо отправлено: ${info.messageId} (queue ${queueId})`)

      return {
        success: true,
        messageId: info.messageId,
      }
    } catch (err) {
      console.error('[EmailSender] Ошибка отправки:', err.message)

      await this.logDelivery({
        eventType: 'email_sent',
        queueId,
        recipients: Array.isArray(to) ? to : [to],
        status: 'failed',
        errorMessage: err.message,
      })

      return {
        success: false,
        error: err.message,
      }
    }
  }

  /**
   * Логирование в notification_delivery_logs (таблица уже используется notificationController)
   */
  static async logDelivery({ eventType, queueId, ticketId, templateId, recipients, status, errorMessage, messageId }) {
    try {
      const query = `
        INSERT INTO notification_delivery_logs 
        (event_type, template_id, queue_id, ticket_id, recipients, status, error_message, sent_at, message_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8)
      `
      await pool.query(query, [
        eventType || 'email_sent',
        templateId || null,
        queueId || null,
        ticketId || null,
        JSON.stringify(recipients || []),
        status,
        errorMessage || null,
        messageId || null,
      ])
    } catch (e) {
      console.error('[EmailSender] Не удалось записать лог доставки:', e.message)
    }
  }
}

module.exports = EmailSenderService
