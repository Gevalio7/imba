import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { $api } from '@/utils/api'
import { useReferenceData } from '@/composables/useReferenceData'
import type { TicketForm } from '@/types/ticket'

export function useTicketForm(ticketId: Ref<number | null>) {
  const router = useRouter()
  const userData = useCookie<any>('userData')
  const { data: refData, fetchAll: loadReferenceData } = useReferenceData()

  const priorities = computed(() => refData.priorities)
  const queues = computed(() => refData.queues)
  const states = computed(() => refData.states || [])
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
    if (!ticket.companyId)
      return services.value

    // Фильтруем сервисы по компании
    return services.value.filter((s: any) => {
      // Сервис без компаний - показываем (глобальный)
      if (!s.customers || s.customers.length === 0)
        return true

      // Проверяем есть ли компания в списке компаний сервиса
      return s.customers.some((c: any) => c.id === ticket.companyId)
    })
  })

  // Вычисляемые категории - фильтруются по выбранному типу
  // Всегда включаем текущую выбранную категорию (важно при загрузке существующего тикета или автозаполнении)
  const filteredCategories = computed(() => {
    const currentCatId = ticket.categoryId
    let list: any[] = []

    if (ticket.typeId) {
      const selectedType = types.value.find((t: any) => t.id === ticket.typeId)
      if (selectedType && selectedType.categoryIds && selectedType.categoryIds.length > 0) {
        list = categories.value.filter((c: any) => selectedType.categoryIds.includes(c.id))
      }
    } else {
      list = [...(categories.value || [])]
    }

    // Если текущая категория не в списке — добавляем её (для корректного отображения)
    if (currentCatId && !list.some((c: any) => c.id === currentCatId)) {
      const currentCat = categories.value.find((c: any) => c.id === currentCatId)
      if (currentCat) list = [currentCat, ...list]
    }

    return list
  })

  // Есть ли связанные категории для текущего типа
  const hasCategoriesForType = computed(() => {
    if (!ticket.typeId)
      return false
    const selectedType = types.value.find((t: any) => t.id === ticket.typeId)

    return selectedType && selectedType.categoryIds && selectedType.categoryIds.length > 0
  })

  // Видимость поля категории - показываем если есть связанные категории
  const categoryVisible = computed(() => {
    return !ticket.typeId || hasCategoriesForType.value
  })

  // Вычисляемые типы - фильтруются по workflow выбранной очереди (аналогично Add.vue)
  const availableTypes = computed(() => {
    const allTypes = types.value || []
    if (!ticket.queueId) {
      return allTypes
    }
    const queue = queues.value.find((q: any) => q.id === ticket.queueId)
    if (!queue?.workflowId) {
      return allTypes
    }
    return allTypes.filter((t: any) => t.workflowId === queue.workflowId)
  })

  // Workflow данные
  const currentWorkflow = ref<any>(null)
  const availableStatuses = ref<any[]>([])
  const loadingWorkflow = ref(false)

  /**
   * Загружает данные workflow по ID типа обращения
   *
   * @param typeId - ID типа обращения (опционально; если не передан — используется ticket.typeId)
   * @param currentStatusId - ID текущего статуса для получения доступных переходов (для режима редактирования)
   * @returns Promise, который резолвится после загрузки данных workflow
   *
   * @description
   * Функция загружает:
   * - Информацию о workflow, связанном с типом
   * - Начальный статус (первый статус с типом 'new')
   * - Доступные статусы для перехода
   *
   * @example
   * // Для нового обращения
   * await fetchWorkflowByType(5)
   *
   * // Для редактирования (получаем переходы из текущего статуса)
   * await fetchWorkflowByType(5, 123)
   */
  const fetchWorkflowByType = async (typeId?: number, currentStatusId?: number | null) => {
    const targetTypeId = typeId ?? ticket.typeId
    if (!targetTypeId) {
      currentWorkflow.value = null
      availableStatuses.value = []

      return
    }

    try {
      loadingWorkflow.value = true

      // Всегда используем оригинальный сохраненный статус для определения доступных переходов
      const statusForWorkflow = originalStateId.value ?? currentStatusId

      // Формируем URL с параметром currentStatusId
      let url = `/types/${targetTypeId}/workflow`
      if (statusForWorkflow !== undefined && statusForWorkflow !== null)
        url += `?currentStatusId=${statusForWorkflow}`

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
    if (!ticketId.value)
      return

    try {
      const data = await $api(`/tickets/${ticketId.value}`)

      // Нормализуем ответ: иногда бэкенд возвращает { tickets: [...], total: 1 }, иногда прямой объект
      let t: any = data
      if (data && Array.isArray(data.tickets)) {
        t = data.tickets[0] || {}
      } else if (data && Array.isArray(data) && data.length > 0) {
        t = data[0]
      }

      // console.log('fetchTicket raw data:', data)
      // console.log('fetchTicket normalized ticket:', t)

      ticket.id = t.id
      ticket.ticketNumber = t.ticketNumber || ''
      ticket.title = t.title || ''
      ticket.typeId = t.typeId || undefined
      ticket.categoryId = t.categoryId || undefined
      ticket.priorityId = t.priorityId || undefined
      ticket.queueId = t.queueId || undefined
      ticket.stateId = t.stateId || undefined

      // ownerId ВСЕГДА должен быть примитивом (id), никогда объектом
      if (t.ownerId) {
        const ownerList = customerUsers.value || []
        const owner = ownerList.find((a: any) => a.id === Number(t.ownerId) || a.id === t.ownerId)
        ticket.ownerId = owner ? owner.id : Number(t.ownerId) || t.ownerId
      }
      else {
        ticket.ownerId = undefined
      }
      ticket.executorAgentIds = Array.isArray(t.executorAgentIds) ? t.executorAgentIds : []
      ticket.executorGroupIds = Array.isArray(t.executorGroupIds) ? t.executorGroupIds : []
      ticket.companyId = t.companyId || undefined
      ticket.serviceId = t.serviceId || undefined
      ticket.slaId = t.slaId || undefined
      ticket.responseDeadline = t.responseDeadline || undefined
      ticket.resolutionDeadline = t.resolutionDeadline || undefined

      // Эскалация
      ticket.observerAgentIds = Array.isArray(t.observerAgentIds) ? t.observerAgentIds : []
      ticket.observerGroupIds = Array.isArray(t.observerGroupIds) ? t.observerGroupIds : []
      ticket.escalationCount = t.escalationCount || 0
      ticket.isEscalated = t.isEscalated || false

      // Сохраняем начальные значения исполнителей для определения изменений при эскалации
      ticket.initialExecutorAgentIds = Array.isArray(t.executorAgentIds) ? t.executorAgentIds : []
      ticket.initialExecutorGroupIds = Array.isArray(t.executorGroupIds) ? t.executorGroupIds : []
      description.value = t.description || ''

      // Загружаем workflow если есть тип
      if (t.typeId)
        await fetchWorkflowByType(t.typeId, t.stateId)

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

      // ownerId всегда примитив (нормализуем на всякий случай)
      ownerId: (typeof ticket.ownerId === 'object' && ticket.ownerId ? (ticket.ownerId.value ?? ticket.ownerId.id) : ticket.ownerId) ?? null,
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
      if (isCreating && response.id)
        ticket.id = response.id

      // Обновляем оригинальный статус после успешного сохранения
      if (!isCreating)
        originalStateId.value = ticket.stateId

      if (redirectAfterSave) {
        if (isCreating) {
          router.push('/apps/tickets')
        }
        else {
          await fetchTicket() // Обновляем данные включая SLA дедлайны
          router.push('/apps/tickets')
        }
      }
      else {
        // Тихое сохранение без уведомлений и перенаправления
        if (!isCreating)
          await fetchTicket()
      }
    }
    catch (error: any) {
      // Если ошибка валидации перехода workflow, показываем предупреждение
      if (error.response?.status === 403 && error.response?.data?.error === 'TRANSITION_NOT_ALLOWED')
        throw new Error(`Невозможно изменить статус: переход из "${error.response.data.currentStatus?.name}" недопустим по workflow. Пожалуйста, сохраните изменения поэтапно.`)

      throw error
    }
    saving.value = false
  }

  // Сохранение
  const save = async () => {
    if (!ticket.title?.trim())
      return

    // Проверка обязательности категории если тип имеет связанные категории
    if (hasCategoriesForType.value && !ticket.categoryId)
      return

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
    if (oldTypeId === undefined && ticket.stateId)
      return

    if (newTypeId) {
      // Очищаем категорию если она не входит в список разрешённых для нового типа
      const selectedType = types.value.find((t: any) => t.id === newTypeId)
      if (selectedType && selectedType.categoryIds && selectedType.categoryIds.length > 0) {
        // Если у типа есть связанные категории - проверяем текущую
        if (ticket.categoryId && !selectedType.categoryIds.includes(ticket.categoryId))
          ticket.categoryId = undefined
      }
    }
  })

  // Watcher для изменения компании - очищаем сервис если он не принадлежит новой компании
  watch(() => ticket.companyId, (newCompanyId, oldCompanyId) => {
    // Пропускаем начальную загрузку
    if (oldCompanyId === undefined)
      return

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
    if (oldServiceId === undefined)
      return

    // Если сервис выбран и SLA ещё не выбран - пробуем получить SLA из сервиса
    if (newServiceId && !ticket.slaId) {
      const service = services.value.find((s: any) => s.id === newServiceId)
      if (service && service.sla && service.sla.id)
        ticket.slaId = service.sla.id
    }
  })

  // Watcher для изменения очереди - автозаполнение полей
  watch(() => ticket.queueId, async (newQueueId, oldQueueId) => {
    // Пропускаем начальную загрузку
    if (oldQueueId === undefined)
      return

    if (newQueueId) {
      const queue = queues.value.find((q: any) => q.id === newQueueId)
      if (queue) {
        // Автозаполняем поля из данных очереди
        if (queue.companyId)
          ticket.companyId = queue.companyId

        if (queue.serviceId)
          ticket.serviceId = queue.serviceId

        if (queue.slaId)
          ticket.slaId = queue.slaId

        if (queue.priorityId)
          ticket.priorityId = queue.priorityId

        // Автозаполняем исполнителя из группы очереди если не выбраны исполнители
        if (queue.agentGroupId && ticket.executorGroupIds.length === 0 && ticket.executorAgentIds.length === 0)
          ticket.executorGroupIds = [queue.agentGroupId]

        // Если у очереди есть workflow - ищем тип с этим workflow
        if (queue.workflowId) {
          try {
            const typesData = await $api("/types")
            const typesList = (typesData as any).types || []
            const typeWithWorkflow = typesList.find((t: any) => t.workflowId === queue.workflowId)
            if (typeWithWorkflow) {
              ticket.typeId = typeWithWorkflow.id
              // fetchWorkflowByType будет вызван реактивно через watcher на typeId
            }
          }
          catch (err) {
            console.error("Error finding type for workflow:", err)
          }
        }

        // Если у очереди есть category_id - автозаполняем категорию
        if (queue.categoryId)
          ticket.categoryId = queue.categoryId
      }
    }
  })

  // Watcher для изменения автора - автозаполнение компании
  watch(() => ticket.ownerId, (newOwnerId, oldOwnerId) => {
    // Пропускаем начальную загрузку
    if (oldOwnerId === undefined)
      return

    // Нормализуем: ownerId всегда примитив
    const ownerId = typeof newOwnerId === 'object' ? (newOwnerId?.value ?? newOwnerId?.id) : newOwnerId
    const customerId = typeof newOwnerId === 'object' ? newOwnerId?.customerId : null

    if (customerId && !ticket.companyId) {
      ticket.companyId = customerId
    }
  })

  // Watcher для изменения типа - загружаем workflow
  watch(() => ticket.typeId, async (newTypeId, oldTypeId) => {
    // Пропускаем начальную загрузку (обрабатывается в fetchTicket)
    if (oldTypeId === undefined && ticket.stateId)
      return

    if (newTypeId) {
      await fetchWorkflowByType(newTypeId, ticket.stateId)

      // Очищаем категорию если она не входит в список разрешённых для нового типа
      const selectedType = types.value.find((t: any) => t.id === newTypeId)
      if (selectedType && selectedType.categoryIds && selectedType.categoryIds.length > 0) {
        // Если у типа есть связанные категории - проверяем текущую
        if (ticket.categoryId && !selectedType.categoryIds.includes(ticket.categoryId))
          ticket.categoryId = undefined
      }
    }
    else {
      currentWorkflow.value = null
      availableStatuses.value = []
    }
  })

  // Эскалация
  const ESCALATION_STATUS_TYPE = 'Эскалирована'

  // Watcher для изменения статуса
  watch(() => ticket.stateId, async (newStateId, oldStateId) => {
    // Пропускаем начальную загрузку (обрабатывается в fetchTicket)
    if (oldStateId === undefined)
      return

    // Валидация перехода (оставляем как было)
    if (newStateId !== originalStateId.value && originalStateId.value !== undefined) {
      // Валидация будет происходить при сохранении
    }

    // === Эскалация ===
    if (newStateId && newStateId !== oldStateId) {
      const newStatus = states.value.find((s: any) => s.id === newStateId)
      if (newStatus?.type === ESCALATION_STATUS_TYPE) {
        console.log('🚀 Статус изменён на Эскалирована — выполняем эскалацию')

        // Проверка: должны быть исполнители
        if (ticket.executorAgentIds.length === 0 && ticket.executorGroupIds.length === 0) {
          console.warn('⚠️ Эскалация: не выбраны исполнители/группы')
          // Можно показать тост, но поскольку это в composable, оставим лог
          return
        }

        // Выполняем эскалацию (очистка исполнителей + перенос в наблюдатели)
        const previousExecutorAgentIds = [...(ticket.initialExecutorAgentIds || ticket.executorAgentIds || [])]
        const previousExecutorGroupIds = [...(ticket.initialExecutorGroupIds || ticket.executorGroupIds || [])]

        // Переносим в наблюдатели
        ticket.observerAgentIds = [
          ...ticket.observerAgentIds,
          ...previousExecutorAgentIds.filter((id: number) => !ticket.observerAgentIds.includes(id))
        ]
        ticket.observerGroupIds = [
          ...ticket.observerGroupIds,
          ...previousExecutorGroupIds.filter((id: number) => !ticket.observerGroupIds.includes(id))
        ]

        // Очищаем исполнителей
        ticket.executorAgentIds = []
        ticket.executorGroupIds = []

        // Увеличиваем счётчик и флаг
        ticket.escalationCount = (ticket.escalationCount || 0) + 1
        ticket.isEscalated = true

        console.log('✅ Эскалация выполнена: исполнители очищены и перенесены в наблюдатели')
      }
    }
  })

  // Watchers для ограничения множественного выбора
  watch(() => allowMultipleExecutorGroups.value, () => {
    if (allowMultipleExecutorGroups.value?.value === 'false' && ticket.executorGroupIds.length > 1)
      ticket.executorGroupIds = [ticket.executorGroupIds[0]]
  })

  watch(() => allowMultipleExecutors.value, () => {
    if (allowMultipleExecutors.value?.value === 'false' && ticket.executorAgentIds.length > 1)
      ticket.executorAgentIds = [ticket.executorAgentIds[0]]
  })

  watch(() => ticket.executorGroupIds, newVal => {
    if (allowMultipleExecutorGroups.value?.value === 'false' && newVal.length > 1)
      ticket.executorGroupIds = [newVal[0]]
  })

  watch(() => ticket.executorAgentIds, newVal => {
    if (allowMultipleExecutors.value?.value === 'false' && newVal.length > 1)
      ticket.executorAgentIds = [newVal[0]]
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
    availableTypes,
    currentWorkflow,
    availableStatuses,
    loadingWorkflow,
    allowMultipleExecutorGroups,
    allowMultipleExecutors,
    originalStateId,
  }
}
