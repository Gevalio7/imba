const Templates = require('../models/templates')
const EmailSenderService = require('./EmailSenderService')
const CustomerUsers = require('../models/customerUsers')
const Agents = require('../models/agents')

/**
 * Заменяет плейсхолдеры в шаблоне
 * @param {string} template - Текст шаблона
 * @param {Object} data - Данные для замены
 * @returns {string}
 */
function replacePlaceholders(template, data) {
  if (!template) return ''

  let result = template

  // Общие плейсхолдеры
  const placeholders = {
    '{{ticketNumber}}': data.ticket?.ticketNumber || data.ticketNumber || '',
    '{{ticketId}}': data.ticket?.id || data.ticketId || '',
    '{{title}}': data.ticket?.title || data.title || '',
    '{{description}}': data.ticket?.description || data.description || '',
    '{{state}}': data.ticket?.stateName || data.state || '',
    '{{oldState}}': data.oldState || '',
    '{{newState}}': data.newState || '',
    '{{comment}}': data.comment || '',
    '{{author}}': data.author || '',
    '{{ownerEmail}}': data.ownerEmail || '',
    '{{ownerName}}': data.ownerName || '',
    '{{executorName}}': data.executorName || '',
    '{{queueName}}': data.queue?.name || data.queueName || '',
    '{{createdAt}}': data.ticket?.createdAt ? new Date(data.ticket.createdAt).toLocaleString('ru-RU') : '',
    '{{updatedAt}}': data.ticket?.updatedAt ? new Date(data.ticket.updatedAt).toLocaleString('ru-RU') : '',
  }

  for (const [placeholder, value] of Object.entries(placeholders)) {
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
  }

  return result
}

/**
 * Получает список получателей для уведомления
 * @param {Object} ticket - Тикет
 * @param {Object} queue - Очередь
 * @param {Object} eventData - Данные события
 * @returns {Promise<Array<{email: string, name: string}>>}
 */
async function getRecipients(ticket, queue, eventData) {
  const recipients = []

  // Владелец тикета (customer user)
  if (ticket.ownerId) {
    const owner = await CustomerUsers.getById(ticket.ownerId)
    if (owner && owner.email) {
      recipients.push({ email: owner.email, name: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.login })
    }
  }

  // Исполнители (агенты)
  if (ticket.executorAgentIds && ticket.executorAgentIds.length > 0) {
    for (const agentId of ticket.executorAgentIds) {
      const agent = await Agents.getById(agentId)
      if (agent && agent.email) {
        recipients.push({ email: agent.email, name: `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.login })
      }
    }
  }

  // Группы исполнителей - можно добавить логику получения агентов из групп

  // Убираем дубликаты по email
  const uniqueRecipients = recipients.filter((recipient, index, self) =>
    index === self.findIndex(r => r.email === recipient.email)
  )

  return uniqueRecipients
}

/**
 * Отправляет уведомление по событию тикета
 * @param {Object} ticket - Тикет
 * @param {Object} queue - Очередь
 * @param {number} templateId - ID шаблона
 * @param {Object} eventData - Данные события
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendTicketNotification(ticket, queue, templateId, eventData) {
  if (!templateId) {
    return { success: false, error: 'Template ID not provided' }
  }

  try {
    // 1. Получить шаблон
    const template = await Templates.getById(templateId)
    if (!template || template.isActive === false) {
      console.warn(`[NOTIFICATION] Template ${templateId} not found or inactive`)
      return { success: false, error: 'Template not found or inactive' }
    }

    // 2. Получить получателей
    const recipients = await getRecipients(ticket, queue, eventData)
    if (recipients.length === 0) {
      console.warn(`[NOTIFICATION] No recipients for ticket ${ticket.id}`)
      return { success: false, error: 'No recipients' }
    }

    // 3. Заменить плейсхолдеры
    const html = replacePlaceholders(template.message || '', {
      ticket,
      queue,
      ...eventData,
    })

    const subject = replacePlaceholders(template.subject || template.name || 'Уведомление', {
      ticket,
      queue,
      ...eventData,
    })

    // 4. Отправить через EmailSenderService
    const result = await EmailSenderService.send({
      queueId: queue.id,
      to: recipients.map(r => r.email),
      subject,
      html,
    })

    return result
  }
  catch (err) {
    console.error('[NOTIFICATION] Error sending ticket notification:', err)
    return { success: false, error: err.message }
  }
}

module.exports = {
  sendTicketNotification,
  replacePlaceholders,
  getRecipients,
}