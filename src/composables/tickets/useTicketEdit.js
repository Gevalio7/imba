import { $fetch } from 'ofetch'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as ticketData from './useTicketData'
import { ticket } from './useTicketForm' // Используем общую форму

const API_BASE = import.meta.env.VITE_API_BASE_URL
const route = useRoute()
const router = useRouter()

// Параметры маршрута
const ticketId = computed(() => {
  const id = route.query.id as string
  return id ? Number(id) : null
})

// Данные тикета
const currentTicket = ref<any>(null)
const description = ref('')
const loading = ref(false)
const saving = ref(false)

// Автоматическое назначение
const autoAssignConfig = ref<any>(null)
const autoAssigned = ref(false)
const allowMultipleExecutorGroups = ref<any>(null)
const allowMultipleExecutors = ref<any>(null)

// История
const history = ref<any[]>([])
const comments = ref<any[]>([])
const attachments = ref<any[]>([])
const newAttachments = ref<any[]>([])
const existingAttachments = ref<any[]>([])

// Workflow
const currentWorkflow = ref<any>(null)
const availableStatuses = ref<any[]>([])

// Пользователь
const userData = computed(() => {
  if (process.client) {
    return JSON.parse(localStorage.getItem('userData') || '{}')
  }
  return {}
})

// Загрузка конфигураций
const fetchAutoAssignConfig = async () => {
  try {
    const data = await $fetch(`${API_BASE}/systemConfiguration?q=agent_auto_assign_as_executor`)
    autoAssignConfig.value = (data as any).systemConfiguration?.[0] || null
  }
  catch (err) { console.log('Error fetching auto assign config:', err) }
}

const fetchExecutorSettings = async () => {
  try {
    const [groupsData, executorsData] = await Promise.all([
      $fetch(`${API_BASE}/systemConfiguration?q=allow_multiple_executor_groups`),
      $fetch(`${API_BASE}/systemConfiguration?q=allow_multiple_executors`)
    ])
    allowMultipleExecutorGroups.value = (groupsData as any).systemConfiguration?.[0] || null
    allowMultipleExecutors.value = (executorsData as any).systemConfiguration?.[0] || null
  }
  catch (err) { console.log('Error fetching executor settings:', err) }
}

// Загрузка тикета
const fetchTicket = async () => {
  if (!ticketId.value) return

  try {
    loading.value = true
    const data = await $fetch(`${API_BASE}/tickets/${ticketId.value}`)
    const t = data as any
    ticket.id = t.id
    ticket.ticketNumber = t.ticketNumber || ''
    ticket.title = t.title || ''
    ticket.typeId = t.typeId || undefined
    ticket.categoryId = t.categoryId || undefined
    ticket.priorityId = t.priorityId || undefined
    ticket.queueId = t.queueId || undefined
    ticket.stateId = t.stateId || undefined
    if (t.ownerId) {
      const owner = ticketData.customerUsers.value.find((a: any) => a.value === t.ownerId)
      ticket.ownerId = owner || t.ownerId
    } else {
      ticket.ownerId = undefined
    }
    ticket.executorAgentIds = t.executorAgentIds || []
    ticket.executorGroupIds = t.executorGroupIds || []
    ticket.companyId = t.companyId || undefined
    ticket.slaId = t.slaId || undefined
    ticket.serviceId = t.serviceId || undefined
    ticket.responseDeadline = t.responseDeadline || undefined
    ticket.resolutionDeadline = t.resolutionDeadline || undefined
    description.value = t.description || ''

    // Загружаем вложения
    if (t.attachments) {
      existingAttachments.value = t.attachments
    }

    // Автоматическое назначение агента как исполнителя при просмотре, если настройка включена и еще не было автоматического назначения
    if (autoAssignConfig.value?.value === 'true' && !autoAssigned.value && ticket.executorAgentIds.length === 0) {
      console.log('Проверяем автоматическое назначение:', {
        config: autoAssignConfig.value?.value,
        autoAssigned: autoAssigned.value,
        userLogin: userData.value?.login,
        agentsCount: ticketData.agents.value.length,
        currentExecutorIds: ticket.executorAgentIds
      })
      const currentAgent = ticketData.agents.value.find((a: any) => a.login === userData.value?.login)
      console.log('Найден агент:', currentAgent)
      if (currentAgent) {
        console.log('Добавляем агента как исполнителя')
        ticket.executorAgentIds = [currentAgent.id]
        // Добавляем группы агента
        if (currentAgent.groups && currentAgent.groups.length > 0) {
          const newGroupIds = currentAgent.groups.map((g: any) => g.id).filter((id: number) => !ticket.executorGroupIds.includes(id))
          ticket.executorGroupIds = [...ticket.executorGroupIds, ...newGroupIds]
        }
        console.log('Автоматически назначен агент как исполнитель при просмотре тикета')
        // Автоматически сохраняем изменения без перенаправления
        try {
          await performSave(false)
        } catch (saveError) {
          console.error('Ошибка при автоматическом сохранении:', saveError)
        }
      } else {
        console.log('Агент не найден')
        autoAssigned.value = true // Даже если не добавили, помечаем как выполненное
      }
    }

    // Загружаем workflow если есть тип
    if (t.typeId) {
      await fetchTypeWorkflow(t.typeId, t.stateId)
    }

  }
  catch (err) {
    console.error('Error fetching ticket:', err)
  }
  finally {
    loading.value = false
  }
}

// Сохранение
const performSave = async (redirectAfterSave = true) => {
  try {
    const ticketData = {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      typeId: ticket.typeId ?? null,
      categoryId: ticket.categoryId ?? null,
      priorityId: ticket.priorityId ?? null,
      queueId: ticket.queueId ?? null,
      stateId: ticket.stateId ?? null,
      ownerId: ticket.ownerId?.value ?? ticket.ownerId ?? null,
      executorAgentIds: ticket.executorAgentIds,
      executorGroupIds: ticket.executorGroupIds,
      companyId: ticket.companyId ?? null,
      serviceId: ticket.serviceId ?? null,
      slaId: ticket.slaId ?? null,
      responseDeadline: ticket.responseDeadline ?? null,
      resolutionDeadline: ticket.resolutionDeadline ?? null,
    }

    await $fetch(`${API_BASE}/tickets/${ticketId.value}`, {
      method: 'PUT',
      body: {
        ...ticketData,
        description: description.value,
      },
    })

    if (redirectAfterSave) {
      await fetchTicket()
      await fetchAttachments()
      await fetchHistory()
      await fetchStatusHistory()
      newAttachments.value = []
      router.push('/apps/tickets')
    } else {
      await fetchTicket()
    }
  }
  catch (err: any) {
    console.error('Error saving ticket:', err)
    if (redirectAfterSave) {
      saving.value = false
    }
  }
}

// Workflow
const fetchTypeWorkflow = async (typeId: number, stateId?: number) => {
  if (!typeId) return

  try {
    const data = await $fetch(`${API_BASE}/types/${typeId}/workflow`)
    currentWorkflow.value = (data as any).workflow

    if (currentWorkflow.value) {
      availableStatuses.value = currentWorkflow.value.transitions?.map((t: any) => t.targetStatus) || []
    }
  }
  catch (err) {
    console.error('Error fetching workflow:', err)
  }
}

// История
const fetchHistory = async () => {
  if (!ticketId.value) return

  try {
    const data = await $fetch(`${API_BASE}/ticketHistory?ticketId=${ticketId.value}`)
    history.value = (data as any).history || []
  }
  catch (err) {
    console.error('Error fetching history:', err)
  }
}

const fetchComments = async () => {
  if (!ticketId.value) return

  try {
    const data = await $fetch(`${API_BASE}/ticketComments?ticketId=${ticketId.value}`)
    comments.value = (data as any).comments || []
  }
  catch (err) {
    console.error('Error fetching comments:', err)
  }
}

const fetchAttachments = async () => {
  if (!ticketId.value) return

  try {
    const data = await $fetch(`${API_BASE}/ticketAttachments?ticketId=${ticketId.value}`)
    existingAttachments.value = (data as any).attachments || []
  }
  catch (err) {
    console.error('Error fetching attachments:', err)
  }
}

const fetchStatusHistory = async () => {
  if (!ticketId.value) return

  try {
    const data = await $fetch(`${API_BASE}/ticketStatusHistory/${ticketId.value}`)
    // statusHistory.value = (data as any).history || []
  }
  catch (err) {
    console.error('Error fetching status history:', err)
  }
}

// Назначить на себя
const assignToMe = () => {
  const currentAgent = ticketData.agents.value.find((a: any) => a.login === userData.value?.login)
  if (currentAgent) {
    if (!ticket.executorAgentIds.includes(currentAgent.id)) {
      ticket.executorAgentIds = [...ticket.executorAgentIds, currentAgent.id]
    }
    if (currentAgent.groups && currentAgent.groups.length > 0) {
      const groupIds = currentAgent.groups.map((g: any) => g.id).filter((id: number) => !ticket.executorGroupIds.includes(id))
      ticket.executorGroupIds = [...ticket.executorGroupIds, ...groupIds]
    }
  }
}

// Toast
const showToast = (message: string, color: string = 'success') => {
  // Реализация toast
}

// Инициализация
onMounted(async () => {
  await Promise.all([
    ticketData.fetchPriorities(),
    ticketData.fetchQueues(),
    ticketData.fetchStates(),
    ticketData.fetchTypes(),
    ticketData.fetchCategories(),
    ticketData.fetchAgents(),
    ticketData.fetchAgentGroups(),
    ticketData.fetchCustomers(),
    ticketData.fetchServices(),
    ticketData.fetchSla(),
    ticketData.fetchCustomerUsers(),
    fetchAutoAssignConfig(),
    fetchExecutorSettings(),
  ])
  await fetchTicket()
})

// Watchers для ограничения множественного выбора
watch(() => allowMultipleExecutorGroups.value, () => {
  if (allowMultipleExecutorGroups.value?.value === 'false' && ticket.executorGroupIds.length > 1) {
    ticket.executorGroupIds = [ticket.executorGroupIds[0]]
  }
})

watch(() => allowMultipleExecutors.value, () => {
  if (allowMultipleExecutors.value?.value === 'false' && ticket.executorAgentIds.length > 1) {
    ticket.executorAgentIds = [ticket.executorAgentIds[0]]
  }
})

watch(() => ticket.executorGroupIds, (newVal) => {
  if (allowMultipleExecutorGroups.value?.value === 'false' && newVal.length > 1) {
    ticket.executorGroupIds = [newVal[0]]
  }
})

watch(() => ticket.executorAgentIds, (newVal) => {
  if (allowMultipleExecutors.value?.value === 'false' && newVal.length > 1) {
    ticket.executorAgentIds = [newVal[0]]
  }
})

export {
  ticketId,
  currentTicket,
  description,
  loading,
  saving,
  autoAssignConfig,
  autoAssigned,
  allowMultipleExecutorGroups,
  allowMultipleExecutors,
  history,
  comments,
  attachments,
  newAttachments,
  existingAttachments,
  currentWorkflow,
  availableStatuses,
  userData,
  fetchAutoAssignConfig,
  fetchExecutorSettings,
  fetchTicket,
  performSave,
  fetchTypeWorkflow,
  fetchHistory,
  fetchComments,
  fetchAttachments,
  fetchStatusHistory,
  assignToMe,
  showToast,
}