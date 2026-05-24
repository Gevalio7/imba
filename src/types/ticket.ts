export interface TicketForm {
  id: number
  ticketNumber: string
  title: string
  typeId?: number
  categoryId?: number
  priorityId?: number
  queueId?: number
  stateId?: number
  ownerId?: number | null | string
  executorAgentIds: number[]
  executorGroupIds: number[]
  companyId?: number
  serviceId?: number
  slaId?: number
  responseDeadline?: string
  resolutionDeadline?: string
  observerAgentIds: number[]
  observerGroupIds: number[]
  escalationCount: number
  isEscalated: boolean
  initialExecutorAgentIds: number[]
  initialExecutorGroupIds: number[]
}

export interface WorkflowTransition {
  id: number
  name: string
  color?: string
}

export interface TicketComment {
  id: number
  ticketId: number
  content: string
  authorId: number
  authorName?: string
  authorAvatar?: string
  isInternal: boolean
  createdAt: string
}

export interface TicketAttachment {
  id: number
  filename: string
  originalName: string
  size: number
}

export interface TicketSchedule {
  id?: number
  ticketId: number
  scheduleType: 'daily' | 'weekly' | 'monthly'
  scheduleTime: string
  scheduleDays: number[]
  scheduleDayOfMonth: number
  startDate: string | null
  endDate: string | null
  isActive: boolean
  titlePrefix: string
  nextRunAt?: string
  lastRunAt?: string
}

export interface Article {
  id: number
  title: string
  content: string
}
