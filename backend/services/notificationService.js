const Templates = require('../models/templates')
const EmailNotificationQueueService = require('./EmailNotificationQueueService')
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

  const appUrl = process.env.APP_URL || 'localhost:5173'
  const ticket = data.ticket || {}
  const user = data.user || {}
  const status = data.status || {}
  const comment = data.comment || {}

  console.log(`[REPLACE-PLACEHOLDERS] Processing template with keys:`, Object.keys(data))
  console.log(`[REPLACE-PLACEHOLDERS] user.name=${user?.name}, ticket.number=${ticket?.number}, status.old=${status?.old}, status.new=${status?.new}`)

  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmed = key.trim()
    const parts = trimmed.split('.')
    let value

    if (parts[0] === 'ticket' && parts.length > 1) {
      const field = parts[1]
      if (field === 'url') return `${appUrl}/apps/tickets/view?id=${ticket.id || ''}`
      // Map common field aliases to actual database fields
      if (field === 'priority') value = ticket.priorityName || ticket.priority
      else if (field === 'type') value = ticket.typeName || ticket.typeId
      else if (field === 'category') value = ticket.categoryName || ticket.categoryId
      else if (field === 'queue') value = ticket.queueName || ticket.queueId
      else value = ticket[field]
    } else if (parts[0] === 'user' && parts.length > 1) {
      value = user[parts[1]]
    } else if (parts[0] === 'status' && parts.length > 1) {
      value = status[parts[1]]
    } else if (parts[0] === 'comment' && parts.length > 1) {
      value = comment[parts[1]]
    } else if (trimmed === 'ticketNumber') {
      value = ticket.ticketNumber || data.ticketNumber
    } else if (trimmed === 'ticketId') {
      value = ticket.id || data.ticketId
    } else if (trimmed === 'title') {
      value = ticket.title || data.title
    } else if (trimmed === 'description') {
      value = ticket.description || data.description
    } else if (trimmed === 'state') {
      value = ticket.stateName || data.state
    } else if (trimmed === 'oldState') {
      value = data.oldState
    } else if (trimmed === 'newState') {
      value = data.newState
    } else if (trimmed === 'ownerEmail') {
      value = data.ownerEmail
    } else if (trimmed === 'ownerName') {
      value = data.ownerName
    } else if (trimmed === 'executorName') {
      value = data.executorName
    } else if (trimmed === 'queueName') {
      value = data.queue?.name || data.queueName
    } else if (trimmed === 'createdAt') {
      value = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('ru-RU') : ''
    } else if (trimmed === 'updatedAt') {
      value = ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString('ru-RU') : ''
    } else {
      value = data[trimmed]
    }

    if (value !== undefined && value !== null && value !== '') return String(value)
    if (trimmed === 'date.now') return new Date().toLocaleString('ru-RU')
    if (trimmed === 'system.name') return 'DreamDesc'

    console.log(`[REPLACE-PLACEHOLDERS] Unresolved placeholder: ${trimmed}`)
    return match
  })
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

    console.log(`[NOTIFICATION] Found ${recipients.length} recipients for ticket ${ticket.id}:`, recipients.map(r => r.email).join(', '))

    // 3. Собираем полные данные для плейсхолдеров
    const ticketData = {
      ...ticket,
      number: ticket.ticketNumber || ticket.number,
    }

    let userData = {}
    if (ticket.ownerId) {
      try {
        const owner = await CustomerUsers.getById(ticket.ownerId)
        if (owner) {
          userData = {
            name: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.login,
            email: owner.email,
            login: owner.login,
            firstName: owner.firstName,
            lastName: owner.lastName,
          }
        } else {
          console.warn(`[NOTIFICATION] CustomerUsers.getById(${ticket.ownerId}) returned null/undefined`)
        }
      } catch (userErr) {
        console.warn(`[NOTIFICATION] Failed to load owner ${ticket.ownerId}:`, userErr.message)
      }
    } else {
      console.warn(`[NOTIFICATION] Ticket ${ticket.id} has no ownerId`)
    }

    let commentData = {}
    if (eventData?.comment) {
      const isCommentObject = typeof eventData.comment === 'object'
      commentData = isCommentObject
        ? eventData.comment
        : {
            text: eventData.comment,
            author: eventData.author || '',
            content: eventData.comment,
          }
    }

    const statusData = {
      old: eventData?.oldState || eventData?.oldStatus || '',
      new: eventData?.newState || eventData?.newStatus || '',
    }

    const data = {
      ticket: ticketData,
      queue,
      user: userData,
      comment: commentData,
      status: statusData,
      oldState: eventData?.oldState || '',
      newState: eventData?.newState || '',
      ...eventData,
    }

    // 4. Заменить плейсхолдеры
    const html = replacePlaceholders(template.message || '', data)
    const subject = replacePlaceholders(template.subject || template.name || 'Уведомление', data)

    // 5. Сохранить письмо в очередь, чтобы SMTP не блокировал PUT-запросы
    console.log(`[NOTIFICATION] Enqueuing email for ticket ${ticket.id}, queue ${queue?.id || 'no-queue'}`)
    const queued = await EmailNotificationQueueService.enqueue({
      eventType: eventData?.event || 'ticket_notification',
      templateId,
      queueId: queue.id,
      ticketId: ticket.id,
      recipients: recipients.map(r => r.email),
      subject,
      html,
    })

    console.log(`[NOTIFICATION] Email queued with id ${queued?.id || 'unknown'}`)
    return queued
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