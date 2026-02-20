// Ticket Age type
export interface TicketAge {
  days: number
  hours: number
  minutes: number
  formatted: string
}

// Ticket Types
export interface Ticket {
  id: number
  ticketNumber: string
  title: string
  typeId?: number | null
  typeName?: string | null
  priorityId?: number | null
  priorityName?: string | null
  priorityColor?: string | null
  queueId?: number | null
  queueName?: string | null
  stateId?: number | null
  stateName?: string | null
  stateColor?: string | null
  ownerId?: number | null
  ownerLogin?: string | null
  ownerFirstname?: string | null
  ownerLastname?: string | null
  companyId?: number | null
  companyName?: string | null
  slaId?: number | null
  slaName?: string | null
  age?: TicketAge
  createdAt?: string
  updatedAt?: string
  isActive?: boolean
}

// Ticket creation payload
export interface TicketCreate {
  ticketNumber?: string
  title: string
  typeId?: number | null
  priorityId?: number | null
  queueId?: number | null
  stateId?: number | null
  ownerId?: number | null
  companyId?: number | null
  slaId?: number | null
  isActive?: boolean
}

// Ticket update payload
export interface TicketUpdate {
  ticketNumber?: string
  title?: string
  typeId?: number | null
  priorityId?: number | null
  queueId?: number | null
  stateId?: number | null
  ownerId?: number | null
  companyId?: number | null
  slaId?: number | null
  isActive?: boolean
}
