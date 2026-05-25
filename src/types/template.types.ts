export interface Template {
  id: number
  name: string
  message: string
  subject?: string
  cssStyles?: string
  eventType?: string
  placeholders?: string[] | any[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: number
  updatedBy?: number
  version: number
  usageCount: number
  previewImage?: string
  category?: string
  tags?: string[]
  lastTestedAt?: string
}

export interface NotificationEvent {
  eventType: 'open' | 'close' | 'confirm' | 'status_change' | 'comment' | 'ticket_open' | 'ticket_close' | string
  templateId: number
  ticketId: number
  recipients: string[]
  status: 'pending' | 'sent' | 'failed'
}

export interface Placeholder {
  key: string
  description: string
  example: string
}

export const DEFAULT_PLACEHOLDERS: Placeholder[] = [
  { key: '{{ticket.id}}', description: 'ID обращения', example: '123' },
  { key: '{{ticket.number}}', description: 'Номер обращения', example: 'T-2026-001' },
  { key: '{{ticket.title}}', description: 'Название', example: 'Проблема с принтером' },
  { key: '{{ticket.description}}', description: 'Описание', example: 'Не печатает...' },
  { key: '{{ticket.priority}}', description: 'Приоритет', example: 'Высокий' },
  { key: '{{ticket.url}}', description: 'Ссылка на обращение', example: 'https://.../tickets/123' },
  { key: '{{user.name}}', description: 'Имя пользователя', example: 'Иван Иванов' },
  { key: '{{user.email}}', description: 'Email', example: 'user@example.com' },
  { key: '{{status.old}}', description: 'Старый статус', example: 'Новый' },
  { key: '{{status.new}}', description: 'Новый статус', example: 'В работе' },
  { key: '{{comment.text}}', description: 'Текст комментария', example: 'Проблема решена' },
  { key: '{{comment.author}}', description: 'Автор комментария', example: 'Петр Петров' },
  { key: '{{date.now}}', description: 'Текущая дата', example: '24.05.2026 21:50' },
  { key: '{{system.name}}', description: 'Название системы', example: 'DreamDesc' },
]
