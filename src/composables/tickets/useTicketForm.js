import { $fetch } from 'ofetch'
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as ticketData from './useTicketData'

const API_BASE = import.meta.env.VITE_API_BASE_URL
const router = useRouter()

// Импортируем справочники
const {
  priorities,
  queues,
  states,
  types,
  categories,
  agents,
  agentGroups,
  customers,
  services,
  slaList,
  customerUsers,
} = ticketData

// Вычисляемые сервисы - фильтруются по компании если она выбрана
const filteredServices = computed(() => {
  // Если компания не выбрана - показываем все сервисы
  if (!ticket.companyId) {
    return services.value
  }
  // Фильтруем сервисы по компании
  return services.value.filter((s: any) => {
    // Сервис без компаний - показываем (глобальный)
    if (!s.customers || s.customers.length === 0) {
      return true
    }
    // Проверяем есть ли компания в списке компаний сервиса
    return s.customers.some((c: any) => c.id === ticket.companyId)
  })
})

// Вычисляемые категории - фильтруются по выбранному типу
const filteredCategories = computed(() => {
  if (!ticket.typeId) {
    return categories.value
  }
  const selectedType = types.value.find((t: any) => t.id === ticket.typeId)
  if (selectedType && selectedType.categoryIds && selectedType.categoryIds.length > 0) {
    return categories.value.filter((c: any) => selectedType.categoryIds.includes(c.id))
  }
  return categories.value
})

// Вычисляемые сотрудники - фильтруются по компании если она выбрана
const filteredCustomerUsers = computed(() => {
  if (!ticket.companyId) {
    return customerUsers.value
  }
  return customerUsers.value.filter((u: any) => u.customerId === ticket.companyId)
})

// Форма
const ticket = reactive({
  title: '',
  typeId: undefined as number | undefined,
  categoryId: undefined as number | undefined,
  priorityId: undefined as number | undefined,
  queueId: undefined as number | undefined,
  stateId: undefined as number | undefined,
  ownerId: undefined as number | undefined,
  executorAgentIds: [] as number[],
  executorGroupIds: [] as number[],
  companyId: undefined as number | undefined,
  serviceId: undefined as number | undefined,
  slaId: undefined as number | undefined,
  responseDeadline: undefined as string | undefined,
  resolutionDeadline: undefined as string | undefined,
})

const description = ref('')

// Состояние
const loading = ref(false)
const saving = ref(false)

// Вложения
const attachments = ref<any[]>([])
const newAttachments = ref<any[]>([])
const existingAttachments = ref<any[]>([])

// SLA расчет
const calculateSlaDeadlines = async () => {
  if (!ticket.slaId || !ticket.priorityId) {
    ticket.responseDeadline = undefined
    ticket.resolutionDeadline = undefined
    return
  }

  try {
    const data = await $fetch(`${API_BASE}/sla/${ticket.slaId}/calculate`, {
      method: 'POST',
      body: {
        priorityId: ticket.priorityId,
      },
    })

    ticket.responseDeadline = (data as any).responseDeadline
    ticket.resolutionDeadline = (data as any).resolutionDeadline
  }
  catch (err) {
    console.error('Error calculating SLA deadlines:', err)
  }
}

// Назначить на себя
const assignToMe = () => {
  const currentUser = JSON.parse(localStorage.getItem('userData') || '{}')
  if (!currentUser.login) return

  const currentAgent = agents.value.find((a: any) => a.login === currentUser.login)
  if (currentAgent) {
    if (!ticket.executorAgentIds.includes(currentAgent.id)) {
      ticket.executorAgentIds.push(currentAgent.id)
    }
    if (currentAgent.groups && currentAgent.groups.length > 0) {
      currentAgent.groups.forEach((g: any) => {
        if (!ticket.executorGroupIds.includes(g.id)) {
          ticket.executorGroupIds.push(g.id)
        }
      })
    }
  }
}

// Создание тикета
const createTicket = async () => {
  try {
    saving.value = true

    // Автоматическое назначение группы очереди если исполнители не заданы
    if (ticket.queueId && ticket.executorGroupIds.length === 0 && ticket.executorAgentIds.length === 0) {
      const selectedQueue = queues.value.find((q: any) => q.id === ticket.queueId)
      if (selectedQueue && selectedQueue.agentGroupId) {
        ticket.executorGroupIds = [selectedQueue.agentGroupId]
      }
    }

    const ticketData = {
      title: ticket.title,
      description: description.value,
      typeId: ticket.typeId,
      categoryId: ticket.categoryId,
      priorityId: ticket.priorityId,
      queueId: ticket.queueId,
      stateId: ticket.stateId,
      ownerId: ticket.ownerId,
      executorAgentIds: ticket.executorAgentIds,
      executorGroupIds: ticket.executorGroupIds,
      companyId: ticket.companyId,
      serviceId: ticket.serviceId,
      slaId: ticket.slaId,
      responseDeadline: ticket.responseDeadline,
      resolutionDeadline: ticket.resolutionDeadline,
    }

    const data = await $fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      body: ticketData,
    })

    const newTicket = data as any

    // Загружаем вложения
    if (newAttachments.value.length > 0) {
      await uploadAttachments(newTicket.id)
    }

    // Перенаправляем на созданный тикет
    router.push(`/apps/tickets/edit?id=${newTicket.id}`)
  }
  catch (err: any) {
    console.error('Error creating ticket:', err)
    throw err
  }
  finally {
    saving.value = false
  }
}

// Загрузка вложений
const uploadAttachments = async (ticketId: number) => {
  for (const attachment of newAttachments.value) {
    const formData = new FormData()
    formData.append('file', attachment.file)
    formData.append('filename', attachment.name)

    await $fetch(`${API_BASE}/ticketAttachments`, {
      method: 'POST',
      body: formData,
      headers: {
        'ticket-id': ticketId.toString(),
      },
    })
  }
}

// Watchers
watch(() => ticket.companyId, () => {
  // Очищаем сервис если он не доступен для новой компании
  if (ticket.serviceId && !filteredServices.value.find((s: any) => s.id === ticket.serviceId)) {
    ticket.serviceId = undefined
  }
  // Очищаем автора если он не из выбранной компании
  if (ticket.ownerId && !filteredCustomerUsers.value.find((u: any) => u.id === ticket.ownerId)) {
    ticket.ownerId = undefined
  }
})

watch(() => [ticket.slaId, ticket.priorityId], calculateSlaDeadlines)

export {
  // Справочники
  priorities,
  queues,
  states,
  types,
  categories,
  agents,
  agentGroups,
  customers,
  services,
  slaList,
  customerUsers,

  // Вычисляемые
  filteredServices,
  filteredCategories,
  filteredCustomerUsers,

  // Форма
  ticket,
  description,

  // Состояние
  loading,
  saving,

  // Вложения
  attachments,
  newAttachments,
  existingAttachments,

  // Функции
  calculateSlaDeadlines,
  assignToMe,
  createTicket,
  uploadAttachments,
}