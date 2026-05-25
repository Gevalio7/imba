import { $api } from '@/utils/api'

export interface NotificationPayload {
  ticket?: any
  user?: any
  oldStatus?: any
  newStatus?: any
  comment?: any
  reason?: string
  [key: string]: any
}

export interface Template {
  id: number
  name: string
  message: string
  subject?: string
  cssStyles?: string
  eventType?: string
  isActive: boolean
  placeholders?: any[]
}

class NotificationService {
  /**
   * Главный метод отправки уведомления
   * @param eventType - тип события (open, close, status_change, comment и т.д.)
   * @param templateId - ID шаблона (опционально, если не передан - ищется в очереди)
   * @param data - данные для подстановки плейсхолдеров
   */
  async send(eventType: string, templateId: number | null | undefined, data: NotificationPayload): Promise<boolean> {
    try {
      if (!templateId) {
        // Пытаемся получить из очереди, если есть ticket.queueId
        if (data.ticket?.queueId) {
          templateId = await this.getTemplateFromQueue(data.ticket.queueId, eventType)
        }
      }

      if (!templateId) {
        console.log(`[NotificationService] Нет шаблона для события ${eventType}`)
        return false
      }

      // Загружаем шаблон
      const template: Template = await $api(`/templates/${templateId}`)
      if (!template || template.isActive === false) {
        console.warn(`[NotificationService] Шаблон ${templateId} неактивен или не найден`)
        return false
      }

      // Заменяем плейсхолдеры
      const subject = this.replacePlaceholders(template.subject || template.name, data)
      const htmlMessage = this.replacePlaceholders(template.message || '', data)

      // Собираем CSS + HTML
      let finalHtml = htmlMessage
      if (template.cssStyles) {
        finalHtml = `<style>${template.cssStyles}</style>\n${htmlMessage}`
      }

      // Определяем получателей
      const recipients = this.getRecipients(eventType, data.ticket)

      if (!recipients.length) {
        console.warn('[NotificationService] Нет получателей для уведомления')
        return false
      }

      // Отправляем через backend API
      await $api('/notifications/send', {
        method: 'POST',
        body: {
          eventType,
          templateId,
          ticketId: data.ticket?.id,
          queueId: data.ticket?.queueId,
          subject,
          html: finalHtml,
          recipients,
        },
      })

      // Логируем (бэкенд тоже логирует, но можно и здесь)
      await this.logDelivery(eventType, templateId, recipients, data.ticket?.id)

      console.log(`[NotificationService] Уведомление ${eventType} отправлено по шаблону ${templateId}`)
      return true
    } catch (error) {
      console.error('[NotificationService] Ошибка отправки:', error)
      // Логируем ошибку
      if (templateId) {
        await this.logDelivery(eventType, templateId, [], data.ticket?.id, 'failed', String(error))
      }
      return false
    }
  }

  /**
   * Получение ID шаблона из очереди по типу события
   */
  async getTemplateFromQueue(queueId: number, eventType: string): Promise<number | null> {
    try {
      const queue = await $api(`/queues/${queueId}`)
      if (!queue) return null

      // Маппинг eventType -> поле в очереди
      const mapping: Record<string, string> = {
        'open': 'templateOpenTicketId',
        'ticket_open': 'templateOpenTicketId',
        'close': 'templateCloseTicketId',
        'ticket_close': 'templateCloseTicketId',
        'confirm': 'templateConfirmTicketId',
        'request_approve': 'templateConfirmTicketId',
        'status_change': 'templateStatusChangeId',
        'comment': 'templateCommentTicketId',
        'comment_add': 'templateCommentTicketId',
      }

      const field = mapping[eventType] || 'templateId'
      return (queue as any)[field] || (queue as any).templateId || null
    } catch (e) {
      console.error('[NotificationService] getTemplateFromQueue error:', e)
      return null
    }
  }

  /**
   * Замена плейсхолдеров {{...}} на реальные значения из data
   */
  replacePlaceholders(text: string, data: NotificationPayload): string {
    if (!text) return ''

    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmed = key.trim()
      const value = this.getNestedValue(data, trimmed)
      if (value !== undefined && value !== null) {
        return String(value)
      }
      // Специальные плейсхолдеры
      if (trimmed === 'date.now') return new Date().toLocaleString('ru-RU')
      if (trimmed === 'system.name') return 'DreamDesc'
      if (trimmed === 'ticket.url') {
        const id = data.ticket?.id || data.ticket?.ticketNumber
        return id ? `${window.location.origin}/apps/tickets/${id}` : '#'
      }
      return match // не заменено
    })
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => (o ? o[p] : undefined), obj)
  }

  /**
   * Определение списка получателей email
   */
  getRecipients(eventType: string, ticket: any): string[] {
    if (!ticket) return []

    const emails: string[] = []

    // Автор (owner)
    if (ticket.owner?.email) emails.push(ticket.owner.email)
    if (ticket.ownerEmail) emails.push(ticket.ownerEmail)

    // Исполнители
    if (Array.isArray(ticket.executorAgents)) {
      ticket.executorAgents.forEach((a: any) => a.email && emails.push(a.email))
    }
    if (Array.isArray(ticket.executorAgentEmails)) emails.push(...ticket.executorAgentEmails)

    // Наблюдатели
    if (Array.isArray(ticket.observerAgents)) {
      ticket.observerAgents.forEach((a: any) => a.email && emails.push(a.email))
    }

    // Уникализируем
    return [...new Set(emails.filter(Boolean))]
  }

  /**
   * Отправка email (вызов бэкенда, реальная отправка на сервере)
   */
  async sendEmail(to: string[], subject: string, html: string): Promise<void> {
    // В реальности - POST на /api/notifications/send который использует SMTP
    // Здесь для совместимости просто вызываем через send
    console.log('[NotificationService] sendEmail called (delegated to backend):', { to, subject })
  }

  /**
   * Логирование доставки (можно расширить)
   */
  async logDelivery(
    eventType: string,
    templateId: number,
    recipients: string[],
    ticketId?: number,
    status = 'sent',
    errorMessage?: string,
  ): Promise<void> {
    try {
      await $api('/notifications/log', {
        method: 'POST',
        body: {
          eventType,
          templateId,
          ticketId,
          recipients,
          status,
          errorMessage,
        },
      })
    } catch (e) {
      console.warn('[NotificationService] logDelivery failed (non-critical):', e)
    }
  }
}

export const notificationService = new NotificationService()
export default notificationService
