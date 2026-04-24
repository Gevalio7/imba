import { $api } from '@/utils/api'
import { computed, reactive, ref, watch } from 'vue'
import { useReferenceData } from '@/composables/useReferenceData'
import { useRouter } from 'vue-router'
import type { TicketForm } from '@/types/ticket'

export function useTicketForm(ticketId: Ref<number | null>) {
  const router = useRouter()
  const userData = useCookie<any>('userData')
  const { data: refData, fetchAll: loadReferenceData } = useReferenceData()

  const priorities = computed(() => refData.priorities)
  const queues = computed(() => refData.queues)
  const states = computed(() => refData.states)
  const types = computed(() => refData.types)
  const categories = computed(() => refData.typeCategories)
  const agents = computed(() => refData.agents)
  const agentGroups = computed(() => refData.agentGroups)
  const customers = computed(() => refData.customers)
  const services = computed(() => refData.services)
  const slaList = computed(() => refData.sla)
  const customerUsers = computed(() => refData.customerUsers)
  const systemConfigs = computed(() => refData.systemConfiguration)

  // Настройки автоматического назначения
  const allowMultipleExecutorGroups = ref<any>(null)
  const allowMultipleExecutors = ref<any>(null)

  const ticket = reactive<TicketForm>({
    id: -1,
    ticketNumber: '',
    title: '',
    typeId: undefined,
    categoryId: undefined,
    priorityId: undefined,
    queueId: undefined,
    stateId: undefined,
    ownerId: undefined,
    executorAgentIds: [],
    executorGroupIds: [],
    companyId: undefined,
    serviceId: undefined,
    slaId: undefined,
    responseDeadline: undefined,
    resolutionDeadline: undefined,
    // Эскалация
    observerAgentIds: [],
    observerGroupIds: [],
    escalationCount: 0,
    isEscalated: false,
    // Начальные значения для отслеживания изменений
    initialExecutorAgentIds: [],
    initialExecutorGroupIds: [],
  })

  // Track original saved status for workflow validation
  const originalStateId = ref<number | undefined>(undefined)

  const description = ref('')
  const saving = ref(false)

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
    // Если тип не выбран - показываем пустой массив (категория скрыта)
    if (!ticket.typeId) {
      return []
    }
    // Находим тип и его categoryIds
    const selectedType = types.value.find((t: any) => t.id === ticket.typeId)
    if (!selectedType) {
      return []
    }
    // Если у типа нет categoryIds или массив пустой - возвращаем пустой массив
    if (!selectedType.categoryIds || selectedType.categoryIds.length === 0) {
      return []
    }
    // Фильтруем категории по categoryIds типа
    return categories.value.filter((c: any) => selectedType.categoryIds.includes(c.id))
  })

  // Есть ли связанные категории для текущего типа
  const hasCategoriesForType = computed(() => {
    if (!ticket.typeId) return false
    const selectedType = types.value.find((t: any) => t.id === ticket.typeId)
    return selectedType && selectedType.categoryIds && selectedType.categoryIds.length > 0
  })

  // Видимость поля категории - показываем если есть связанные категории
  const categoryVisible = computed(() => {
    return !ticket.typeId || hasCategoriesForType.value
  })

  // Workflow данные
  const currentWorkflow = ref<any>(null)
  const availableStatuses = ref<any[]>([])
  const loadingWorkflow = ref(false)

  // Загрузка workflow и доступных статусов по типу
  const fetchTypeWorkflow = async (currentStatusId?: number | null) => {
    if (!ticket.typeId) {
      currentWorkflow.value = null
      availableStatuses.value = []
      return
    }

    try {
      loadingWorkflow.value = true

      // Всегда используем оригинальный сохраненный статус для определения доступных переходов
      // Это предотвращает "перепрыгивание" через этапы workflow
      const statusForWorkflow = originalStateId.value ?? currentStatusId

      // Формируем URL с параметром currentStatusId
      let url = `/types/${ticket.typeId}/workflow`
      if (statusForWorkflow !== undefined && statusForWorkflow !== null) {
        url += `?currentStatusId=${statusForWorkflow}`
      }

      const data = await $api(url)

      currentWorkflow.value = (data as any).workflow

      // Если есть workflow, используем переходы из оригинального статуса
      if (statusForWorkflow !== undefined && statusForWorkflow !== null && currentWorkflow.value && (data as any).currentStatusTransitions) {
        availableStatuses.value = (data as any).currentStatusTransitions
      }
      else {
        // Для нового тикета используем начальные статусы
        availableStatuses.value = (data as any).availableStatuses || []
      }
    }
    catch (err) {
      console.error('Error fetching type workflow:', err)
      currentWorkflow.value = null
      availableStatuses.value = []
    }
    finally {
      loadingWorkflow.value = false
    }
  }

  // Загрузка тикета
  const fetchTicket = async () => {
    if (!ticketId.value) return

    try {
      const data = await $api(`/tickets/${ticketId.value}`)
      const t = data as any
      ticket.id = t.id
      ticket.ticketNumber = t.ticketNumber || ''
      ticket.title = t.title || ''
      ticket.typeId = t.typeId || undefined
      ticket.categoryId = t.categoryId || undefined
      ticket.priorityId = t.priorityId || undefined
      ticket.queueId = t.queueId || undefined
      ticket.stateId = t.stateId || undefined
      // ownerId может быть числом или объектом
      if (t.ownerId) {
        const owner = customerUsers.value.find((a: any) => a.value === t.ownerId)
        ticket.ownerId = owner || t.ownerId
      } else {
        ticket.ownerId = undefined
      }
      ticket.executorAgentIds = t.executorAgentIds || []
      ticket.executorGroupIds = t.executorGroupIds || []
      ticket.companyId = t.companyId || undefined
      ticket.serviceId = t.serviceId || undefined
      ticket.slaId = t.slaId || undefined
      ticket.responseDeadline = t.responseDeadline || undefined
      ticket.resolutionDeadline = t.resolutionDeadline || undefined
      // Эскалация
      ticket.observerAgentIds = t.observerAgentIds || []
      ticket.observerGroupIds = t.observerGroupIds || [] // TODO: типизировать - добавить поле в API/бэкенд
      ticket.escalationCount = t.escalationCount || 0
      ticket.isEscalated = t.isEscalated || false
      // Сохраняем начальные значения исполнителей для определения изменений при эскалации
      ticket.initialExecutorAgentIds = t.executorAgentIds || []
      ticket.initialExecutorGroupIds = t.executorGroupIds || []
       description.value = t.description || ''

      // Загружаем workflow если есть тип
      if (t.typeId) {
        await fetchTypeWorkflow(t.stateId)
      }

      // Track original saved status for workflow validation
      originalStateId.value = t.stateId
    }
    catch (err) {
      console.error('Error fetching ticket:', err)
    }
  }

  // Функция выполнения сохранения
  const performSave = async (redirectAfterSave = true) => {
    // Находим текущего агента
    const currentAgent = agents.value.find((a: any) => a.login === userData.value?.login)

    // Определяем, создаем ли новый тикет
    const isCreating = ticketId.value === null

    // Подготавливаем данные для отправки
    const ticketData = {
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      typeId: ticket.typeId ?? null,
      categoryId: ticket.categoryId ?? null,
      priorityId: ticket.priorityId ?? null,
      queueId: ticket.queueId ?? null,
      stateId: ticket.stateId ?? null,
      // ownerId может быть объектом (при использовании VAutocomplete с return-object)
      ownerId: (typeof ticket.ownerId === 'object' && ticket.ownerId ? ticket.ownerId.value : ticket.ownerId) ?? null,
      executorAgentIds: ticket.executorAgentIds,
      executorGroupIds: ticket.executorGroupIds,
      companyId: ticket.companyId ?? null,
      serviceId: ticket.serviceId ?? null,
      slaId: ticket.slaId ?? null,
      responseDeadline: ticket.responseDeadline ?? null,
      resolutionDeadline: ticket.resolutionDeadline ?? null,
      // Эскалирование
      isEscalated: ticket.isEscalated,
      escalationCount: ticket.escalationCount,
      observerAgentIds: ticket.observerAgentIds,
      observerGroupIds: ticket.observerGroupIds,
    }

    // Для нового тикета используем POST, для существующего - PUT
    const method = isCreating ? 'POST' : 'PUT'
    const endpoint = isCreating ? '/tickets' : `/tickets/${ticketId.value}`

    try {
      const response = await $api(endpoint, {
        method,
        body: {
          ...ticketData,
          ...(isCreating ? {} : { id: ticket.id }), // Для обновления передаем id
          changedBy: currentAgent?.id,
          description: description.value,
        },
      })

      // Для нового тикета обновляем ticket.id
      if (isCreating && response.id) {
        ticket.id = response.id
      }

      // Обновляем оригинальный статус после успешного сохранения
      if (!isCreating) {
        originalStateId.value = ticket.stateId
      }

      if (redirectAfterSave) {
        if (isCreating) {
          router.push('/apps/tickets')
        } else {
          await fetchTicket() // Обновляем данные включая SLA дедлайны
          router.push('/apps/tickets')
        }
      } else {
        // Тихое сохранение без уведомлений и перенаправления
        if (!isCreating) {
          await fetchTicket()
        }
      }
    } catch (error: any) {
      // Если ошибка валидации перехода workflow, показываем предупреждение
      if (error.response?.status === 403 && error.response?.data?.error === 'TRANSITION_NOT_ALLOWED') {
        throw new Error(`Невозможно изменить статус: переход из "${error.response.data.currentStatus?.name}" недопустим по workflow. Пожалуйста, сохраните изменения поэтапно.`)
      }
      throw error
    }
    saving.value = false
  }

  // Сохранение
  const save = async () => {
    if (!ticket.title?.trim()) {
      return
    }

    // Проверка обязательности категории если тип имеет связанные категории
    if (hasCategoriesForType.value && !ticket.categoryId) {
      return
    }

    try {
      saving.value = true
      await performSave()
    }
    catch (err: any) {
      console.error('Error saving ticket:', err)
      saving.value = false
    }
  }

  // Watchers для изменения типа - очищаем категорию если она не входит в список разрешённых для нового типа
  watch(() => ticket.typeId, (newTypeId, oldTypeId) => {
    // Пропускаем начальную загрузку (обрабатывается в fetchTicket)
    if (oldTypeId === undefined && ticket.stateId) return

    if (newTypeId) {
      // Очищаем категорию если она не входит в список разрешённых для нового типа
      const selectedType = types.value.find((t: any) => t.id === newTypeId)
      if (selectedType && selectedType.categoryIds && selectedType.categoryIds.length > 0) {
        // Если у типа есть связанные категории - проверяем текущую
        if (ticket.categoryId && !selectedType.categoryIds.includes(ticket.categoryId)) {
          ticket.categoryId = undefined
        }
      }
    }
  })

  // Watcher для изменения компании - очищаем сервис если он не принадлежит новой компании
  watch(() => ticket.companyId, (newCompanyId, oldCompanyId) => {
    // Пропускаем начальную загрузку
    if (oldCompanyId === undefined) return

    // Если компания изменилась - проверяем что текущий сервис принадлежит новой компании
    if (newCompanyId && ticket.serviceId) {
      const currentService = services.value.find((s: any) => s.id === ticket.serviceId)
      if (currentService) {
        // Если у сервиса есть компании и новая компания не в списке - очищаем сервис
        if (currentService.customers && currentService.customers.length > 0) {
          const belongsToCompany = currentService.customers.some((c: any) => c.id === newCompanyId)
          if (!belongsToCompany) {
            // Сервис не принадлежит компании - очищаем выбор
            ticket.serviceId = undefined
          }
        }
      }
    }
  })

  // Watcher для изменения сервиса - автозаполнение SLA
  watch(() => ticket.serviceId, (newServiceId, oldServiceId) => {
    // Пропускаем начальную загрузку
    if (oldServiceId === undefined) return

    // Если сервис выбран и SLA ещё не выбран - пробуем получить SLA из сервиса
    if (newServiceId && !ticket.slaId) {
      const service = services.value.find((s: any) => s.id === newServiceId)
      if (service && service.sla && service.sla.id) {
        ticket.slaId = service.sla.id
      }
    }
  })

  // Watcher для изменения очереди - автозаполнение исполнителя
  watch(() => ticket.queueId, (newQueueId, oldQueueId) => {
    // Пропускаем начальную загрузку (когда ещё тикет не загружен)
    if (oldQueueId === undefined || ticket.id === -1) return

    if (newQueueId) {
      const queue = queues.value.find((q: any) => q.id === newQueueId)
      if (queue && queue.agentGroupId) {
        // Автозаполняем группу исполнителей из очереди если не выбраны исполнители
        if (ticket.executorGroupIds.length === 0 && ticket.executorAgentIds.length === 0) {
          ticket.executorGroupIds = [queue.agentGroupId]
        }
      }
    }
  })

  // Watcher для изменения автора - автозаполнение компании
  watch(() => ticket.ownerId, (newOwnerId, oldOwnerId) => {
    // Пропускаем начальную загрузку
    if (oldOwnerId === undefined) return

    // ownerId может быть объектом (с customerId) или числом
    const customerId = typeof newOwnerId === 'object' ? newOwnerId?.customerId : newOwnerId
    if (customerId) {
      // Автозаполняем компанию если она ещё не выбрана
      if (!ticket.companyId) {
        ticket.companyId = customerId
      }
    }
  })

  // Watcher для изменения типа - загружаем workflow
  watch(() => ticket.typeId, async (newTypeId, oldTypeId) => {
    // Пропускаем начальную загрузку (обрабатывается в fetchTicket)
    if (oldTypeId === undefined && ticket.stateId) return

    if (newTypeId) {
      await fetchTypeWorkflow(ticket.stateId)

      // Очищаем категорию если она не входит в список разрешённых для нового типа
      const selectedType = types.value.find((t: any) => t.id === newTypeId)
      if (selectedType && selectedType.categoryIds && selectedType.categoryIds.length > 0) {
        // Если у типа есть связанные категории - проверяем текущую
        if (ticket.categoryId && !selectedType.categoryIds.includes(ticket.categoryId)) {
          ticket.categoryId = undefined
        }
      }
    }
    else {
      currentWorkflow.value = null
      availableStatuses.value = []
    }
  })

  // Watcher для изменения статуса - валидируем переход но не обновляем доступные статусы
  watch(() => ticket.stateId, async (newStateId, oldStateId) => {
    // Пропускаем начальную загрузку (обрабатывается в fetchTicket)
    if (oldStateId === undefined) return

    // Если статус изменился и есть оригинальный статус, проверяем валидность перехода
    if (newStateId !== originalStateId.value && originalStateId.value !== undefined) {
      // Не обновляем availableStatuses - они должны оставаться на основе оригинального статуса
      // Валидация будет происходить при сохранении
    }
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

  return {
    ticket,
    description,
    saving,
    save,
    fetchTicket,
    filteredServices,
    filteredCategories,
    hasCategoriesForType,
    categoryVisible,
    currentWorkflow,
    availableStatuses,
    loadingWorkflow,
    allowMultipleExecutorGroups,
    allowMultipleExecutors,
    originalStateId,
  }
}