import { HttpResponse, http } from 'msw'

// Mock data for reference tables
const mockPriorities = [
  { id: 1, name: 'Низкий', color: '#00FF00' },
  { id: 2, name: 'Средний', color: '#FFFF00' },
  { id: 3, name: 'Высокий', color: '#FF0000' },
  { id: 4, name: 'Критический', color: '#FF00FF' },
]

const mockQueues = [
  { id: 1, name: 'Общая очередь' },
  { id: 2, name: 'Техническая поддержка' },
  { id: 3, name: 'Продажи' },
  { id: 4, name: 'Бухгалтерия' },
]

const mockStates = [
  { id: 1, name: 'Новый', color: '#0000FF' },
  { id: 2, name: 'В работе', color: '#FFFF00' },
  { id: 3, name: 'Закрыт', color: '#00FF00' },
  { id: 4, name: 'Отменен', color: '#FF0000' },
]

const mockTypes = [
  { id: 1, name: 'Вопрос' },
  { id: 2, name: 'Проблема' },
  { id: 3, name: 'Инцидент' },
  { id: 4, name: 'Запрос' },
]

const mockAgents = [
  { id: 1, firstName: 'Иван', lastName: 'Иванов', login: 'ivanov' },
  { id: 2, firstName: 'Петр', lastName: 'Петров', login: 'petrov' },
  { id: 3, firstName: 'Сидор', lastName: 'Сидоров', login: 'sidorov' },
]

const mockCustomers = [
  { id: 1, name: 'Компания А' },
  { id: 2, name: 'Компания Б' },
  { id: 3, name: 'Компания В' },
]

const mockSla = [
  { id: 1, name: 'Стандартный SLA' },
  { id: 2, name: 'Премиум SLA' },
  { id: 3, name: 'VIP SLA' },
]

export const handlerAppsTickets = [
  // Priorities
  http.get('http://localhost:3000/api/priorities', () => {
    return HttpResponse.json({ priorities: mockPriorities })
  }),

  // Queues
  http.get('http://localhost:3000/api/queues', () => {
    return HttpResponse.json({ queues: mockQueues })
  }),

  // States
  http.get('http://localhost:3000/api/states', () => {
    return HttpResponse.json({ states: mockStates })
  }),

  // Types
  http.get('http://localhost:3000/api/types', () => {
    return HttpResponse.json({ types: mockTypes })
  }),

  // Agents
  http.get('http://localhost:3000/api/agents', () => {
    return HttpResponse.json({ agents: mockAgents })
  }),

  // Customers
  http.get('http://localhost:3000/api/customers', () => {
    return HttpResponse.json({ customers: mockCustomers })
  }),

  // SLA
  http.get('http://localhost:3000/api/sla', () => {
    return HttpResponse.json({ sla: mockSla })
  }),

  // Tickets list
  http.get('http://localhost:3000/api/tickets', () => {
    return HttpResponse.json({
      tickets: [],
      total: 0
    })
  }),

  // Create ticket
  http.post('http://localhost:3000/api/tickets', async ({ request }) => {
    const body = await request.json() as Record<string, any>
    console.log('Creating ticket:', body)
    return HttpResponse.json({ id: 1, ticketNumber: '1000001', ...body })
  }),

  // Get ticket by id
  http.get('http://localhost:3000/api/tickets/:id', ({ params }) => {
    const id = params.id
    return HttpResponse.json({
      id: Number(id),
      ticketNumber: '1000001',
      title: 'Тестовый тикет',
      typeId: 1,
      priorityId: 1,
      queueId: 1,
      stateId: 1,
      ownerId: 1,
      companyId: 1,
      slaId: 1,
      isActive: true
    })
  }),

  // Update ticket
  http.put('http://localhost:3000/api/tickets/:id', async ({ request, params }) => {
    const id = params.id
    const body = await request.json() as Record<string, any>
    console.log('Updating ticket:', id, body)
    return HttpResponse.json({ id: Number(id), ...body })
  }),

  // Delete ticket
  http.delete('http://localhost:3000/api/tickets/:id', ({ params }) => {
    const id = params.id
    console.log('Deleting ticket:', id)
    return new HttpResponse(null, { status: 204 })
  }),
]
