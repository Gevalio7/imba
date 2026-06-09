import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { $api } from '@/utils/api'
import { useReferenceData } from '@/composables/useReferenceData'
import type { TicketForm } from '@/types/ticket'
import { notificationService } from '@/services/notificationService'

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
    const currentServiceId = ticket.serviceId
    
    let list: any[] = []
    
    // Если компания не выбрана - показываем все сервисы
    if (!ticket.companyId) {
      list = services.value
    } else {
      // Фильтруем сервисы по компании
      list = services.value.filter((s: any) => {
        // Сервис без компаний - показываем (глобальный)
        if (!s.customers || s.customers.length === 0)
          return true

        // Проверяем есть ли компания в списке компаний сервиса
        return s.customers.some((c: any) => c.id === ticket.companyId)
      })
    }
    
    // Защита от потери выбранного сервиса: если текущий сервис не в списке — добавляем его
    if (currentServiceId && !list.some((s: any) => s.id === currentServiceId)) {
      const currentService = services.value.find((s: any) => s.id === currentServiceId)
      if (currentService) {
        list = [currentService, ...list]
      }
    }
    
    return list
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
      } else {
        list = [...(categories.value || [])]
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
    let filtered: any[] = []
    
    if (!ticket.queueId) {
      filtered = allTypes
    } else {
      const queue = queues.value.find((q: any) => q.id === ticket.queueId)
      if (!queue?.workflowId) {
        filtered = allTypes
      } else {
        filtered = allTypes.filter((t: any) => t.workflowId === queue.workflowId)
      }
    }

    // ВАЖНО: всегда оставляем текущий выбранный тип в списке,
    // даже если он не прошёл фильтр по workflow (иначе VSelect показывает сырой ID вместо названия)
    if (ticket.typeId != null) {
      const currentSelected = allTypes.find((t: any) => t.id === ticket.typeId)
      if (currentSelected && !filtered.some((t: any) => t.id === ticket.typeId)) {
        filtered = [currentSelected, ...filtered]
      }
    }
    
    return filtered
  })

  // Workflow данные
  const currentWorkflow = ref<any>(null)
  const availableStatuses = ref<any[]>([])
  const loadingWorkflow = ref(false)

  // Защитный флаг: предотвращает гонки и побочные эффекты watchers при автозаполнении из очереди
  const queueUpdateInProgress = ref(false)

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

      // Для существующего тикета используем оригинальный статус, для нового — не передаём currentStatusId (бек вернёт начальные)
      const isNewTicket = !ticketId.value
      const statusForWorkflow = isNewTicket ? null : (originalStateId.value ?? currentStatusId)

      let url = `/types/${targetTypeId}/workflow`
      if (statusForWorkflow !== undefined && statusForWorkflow !== null)
        url += `?currentStatusId=${statusForWorkflow}`

      const data = await $api(url)

      currentWorkflow.value = (data as any).workflow

      if (statusForWorkflow && currentWorkflow.value && (data as any).currentStatusTransitions) {
        availableStatuses.value = (data as any).currentStatusTransitions
      } else {
        availableStatuses.value = (data as any).availableStatuses || []
      }

      // Автоподстановка начального статуса (type='new') только при создании нового тикета и если статус ещё не выбран
      if (isNewTicket && !ticket.stateId) {
        const initial = (data as any).initialStatus
        if (initial?.id) {
          ticket.stateId = initial.id
          console.log('[QUEUE-AUTOFILL] auto-set initial status from workflow', { statusId: initial.id, name: initial.name })
        } else if (availableStatuses.value.length > 0) {
          // Фоллбэк: берём первый доступный (обычно это 'new')
          ticket.stateId = availableStatuses.value[0].id
          console.log('[QUEUE-AUTOFILL] auto-set first available status as initial', { statusId: ticket.stateId })
        }
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

const applyDefaultsFromQueue = async (queueId: number, forceUpdate: boolean = true) => {
  const queue = queues.value.find((q: any) => q.id === queueId)
  if (!queue) {
    console.warn('[QUEUE-AUTOFILL] Queue not found:', queueId)
    return
  }

  console.log('[QUEUE-AUTOFILL] Start', { 
    queueId, 
    forceUpdate,
    queueObserverGroups: queue.observerGroupIds,
    queueObserverAgents: queue.observerAgentIds,
    queueHasGroups: !!queue.observerGroupIds?.length,
    queueHasAgents: !!queue.observerAgentIds?.length,
  })

  queueUpdateInProgress.value = true

  try {
    // 1. Базовые поля - при forceUpdate=true обновляем всегда
    if (forceUpdate || !ticket.companyId) ticket.companyId = queue.companyId || null
    if (forceUpdate || !ticket.serviceId) ticket.serviceId = queue.serviceId || null
    if (forceUpdate || !ticket.slaId) ticket.slaId = queue.slaId || null
    if (forceUpdate || !ticket.priorityId) ticket.priorityId = queue.priorityId || null

    // 2. Исполнители и наблюдатели - при forceUpdate=true обновляем всегда
    if (forceUpdate) {
      ticket.executorGroupIds = queue.executorGroupIds && Array.isArray(queue.executorGroupIds) ? [...queue.executorGroupIds] : []
      ticket.executorAgentIds = queue.executorAgentIds && Array.isArray(queue.executorAgentIds) ? [...queue.executorAgentIds] : []
      ticket.observerGroupIds = queue.observerGroupIds && Array.isArray(queue.observerGroupIds) ? [...queue.observerGroupIds] : []
      ticket.observerAgentIds = queue.observerAgentIds && Array.isArray(queue.observerAgentIds) ? [...queue.observerAgentIds] : []
      
      console.log('[QUEUE-AUTOFILL] Force updated executors/observers')
    } else {
      if (Array.isArray(queue.executorGroupIds) && queue.executorGroupIds.length > 0 && ticket.executorGroupIds.length === 0)
        ticket.executorGroupIds = [...queue.executorGroupIds]
      if (Array.isArray(queue.executorAgentIds) && queue.executorAgentIds.length > 0 && ticket.executorAgentIds.length === 0)
        ticket.executorAgentIds = [...queue.executorAgentIds]
      if (Array.isArray(queue.observerGroupIds) && queue.observerGroupIds.length > 0 && ticket.observerGroupIds.length === 0)
        ticket.observerGroupIds = [...queue.observerGroupIds]
      if (Array.isArray(queue.observerAgentIds) && queue.observerAgentIds.length > 0 && ticket.observerAgentIds.length === 0)
        ticket.observerAgentIds = [...queue.observerAgentIds]
    }

    // 3. Тип
    let targetTypeId = queue.typeId
    if (!targetTypeId && queue.workflowId) {
      try {
        const typesData = await $api("/types")
        const typesList = (typesData as any).types || []
        const typeWithWorkflow = typesList.find((t: any) => t.workflowId === queue.workflowId)
        if (typeWithWorkflow) targetTypeId = typeWithWorkflow.id
      } catch (err) {
        console.error('[QUEUE-AUTOFILL] Error finding type:', err)
      }
    }

    if (targetTypeId) {
      if (forceUpdate || ticket.typeId !== targetTypeId) {
        ticket.typeId = targetTypeId
        await fetchWorkflowByType(targetTypeId, ticket.stateId)
        await nextTick()
      }
    } else if (forceUpdate) {
      ticket.typeId = undefined
      currentWorkflow.value = null
      availableStatuses.value = []
    }

    // 4. Категория
    if (queue.categoryId) {
      if (forceUpdate || !ticket.categoryId) {
        ticket.categoryId = queue.categoryId
      }
    } else if (forceUpdate && !queue.categoryId) {
      ticket.categoryId = undefined
    }

    // 5. Статус (только если не установлен)
    if (!ticket.stateId && currentWorkflow.value) {
      const initialStatus = (currentWorkflow.value as any)?.initialStatus
      if (initialStatus?.id) {
        ticket.stateId = initialStatus.id
      } else if (availableStatuses.value.length > 0) {
        ticket.stateId = availableStatuses.value[0].id
      }
    }

    console.log('[QUEUE-AUTOFILL] Completed', {
      observerGroupIds: ticket.observerGroupIds,
      observerAgentIds: ticket.observerAgentIds,
      executorGroupIds: ticket.executorGroupIds,
      executorAgentIds: ticket.executorAgentIds,
    })
  } catch (error) {
    console.error('[QUEUE-AUTOFILL] Error:', error)
  } finally {
    await nextTick()
    queueUpdateInProgress.value = false
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
      ownerId: (typeof ticket.ownerId === 'object' && ticket.ownerId ? ((ticket.ownerId as any).value ?? (ticket.ownerId as any).id) : ticket.ownerId) ?? null,
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

      // === ИНТЕГРАЦИЯ УВЕДОМЛЕНИЙ (по ТЗ TemplateQueues) ===
      if (isCreating && response.id) {
        try {
          // Получаем шаблон открытия из очереди
          const queue = queues.value.find((q: any) => q.id === ticket.queueId)
          const templateId = queue?.templateOpenTicketId || queue?.templateId

          if (templateId) {
            await notificationService.send('ticket_open', templateId, {
              ticket: {
                id: response.id,
                ticketNumber: ticket.ticketNumber || response.ticketNumber,
                title: ticket.title,
                priority: ticket.priorityId,
                // owner и др. будут подставлены из данных
                owner: { name: userData.value?.name || 'Пользователь' },
              },
              user: { name: userData.value?.name || '' },
            })
            console.log('[NOTIFICATION] ticket_open отправлено')
          }
        } catch (notifyErr) {
          console.warn('[NOTIFICATION] Ошибка отправки при создании:', notifyErr)
          // Не прерываем сохранение тикета из-за ошибки уведомления
        }
      }

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
  // Поддерживает redirectAfterSave для случаев с загрузкой вложений после создания (add.vue)
  const save = async (redirectAfterSave = true) => {
    if (!ticket.title?.trim())
      return

    // Проверка обязательности категории если тип имеет связанные категории
    if (hasCategoriesForType.value && !ticket.categoryId)
      return

    try {
      saving.value = true
      await performSave(redirectAfterSave)
    }
    catch (err: any) {
      console.error('Error saving ticket:', err)
      saving.value = false
    }
  }

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

// Watcher для очереди - ВНИМАНИЕ: этот watcher работает только в режиме создания (add.vue)
// В режиме редактирования (edit.vue) очередь управляется локальным watcher'ом
watch(() => ticket.queueId, async (newQueueId, oldQueueId) => {
  const isNewTicket = !ticketId.value

  // Пропускаем в режиме редактирования - useTicketForm НЕ должен обрабатывать очередь в edit.vue
  // (edit.vue имеет свой watcher, который вызывает applyDefaultsFromQueue с forceUpdate=false)
  if (!isNewTicket) {
    return
  }

  // В режиме создания: пропускаем только начальную инициализацию формы
  if (oldQueueId === undefined && !newQueueId) {
    return
  }

  console.log('[QUEUE-WATCHER] Queue selection (create mode)', { from: oldQueueId, to: newQueueId })

  if (newQueueId) {
    // forceUpdate = true — принудительно обновляем ВСЕ поля
    await applyDefaultsFromQueue(newQueueId, true)
  } else {
    // Очередь очищена — сбрасываем ВСЕ связанные поля
    console.log('[QUEUE-WATCHER] Queue cleared, resetting all fields')

    ticket.typeId = undefined
    ticket.categoryId = undefined
    ticket.priorityId = undefined
    ticket.slaId = undefined
    ticket.companyId = undefined
    ticket.serviceId = undefined
    ticket.executorGroupIds = []
    ticket.executorAgentIds = []
    ticket.observerGroupIds = []
    ticket.observerAgentIds = []
    ticket.stateId = undefined

    currentWorkflow.value = null
    availableStatuses.value = []
  }
})

  // Watcher для изменения автора - автозаполнение компании
  watch(() => ticket.ownerId, (newOwnerId, oldOwnerId) => {
    // Пропускаем начальную загрузку
    if (oldOwnerId === undefined)
      return

    // Нормализуем: ownerId всегда примитив
    const ownerId = typeof newOwnerId === 'object' && newOwnerId ? ((newOwnerId as any)?.value ?? (newOwnerId as any)?.id) : newOwnerId
    const customerId = typeof newOwnerId === 'object' && newOwnerId ? (newOwnerId as any)?.customerId : null

    if (customerId && !ticket.companyId) {
      ticket.companyId = customerId
    }
  })

  // Watcher для изменения типа - загружаем workflow
  watch(() => ticket.typeId, async (newTypeId, oldTypeId) => {
    // Пропускаем:
    // - начальную загрузку существующего тикета
    // - автоматические изменения во время обработки очереди (защита от гонок)
    if ((oldTypeId === undefined && ticket.stateId) || queueUpdateInProgress.value) {
      console.log('[TYPE-WATCHER-EDIT] SKIPPED by guard', {
        reason: queueUpdateInProgress.value ? 'queueUpdateInProgress' : 'initial load',
        newTypeId,
        oldTypeId,
        stateId: ticket.stateId
      })
      return
    }

    console.log('[TYPE-WATCHER-EDIT] fired', { newTypeId, oldTypeId, currentCategory: ticket.categoryId, stateId: ticket.stateId })

    if (newTypeId) {
      await fetchWorkflowByType(newTypeId, ticket.stateId)

      // Очищаем категорию если она не входит в список разрешённых для нового типа
      const selectedType = types.value.find((t: any) => t.id === newTypeId)
      if (selectedType && selectedType.categoryIds && selectedType.categoryIds.length > 0) {
        // Если у типа есть связанные категории - проверяем текущую
        if (ticket.categoryId && !selectedType.categoryIds.includes(ticket.categoryId)) {
          console.log('[TYPE-WATCHER-EDIT] clearing invalid category', { categoryId: ticket.categoryId, allowed: selectedType.categoryIds })
          ticket.categoryId = undefined
        }
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
    queueUpdateInProgress, // экспортируем для возможного использования в add.vue и компонентах
    applyDefaultsFromQueue, // публичный доступ при необходимости ручного вызова
    fetchWorkflowByType, // для делегирования из add.vue (большой рефакторинг)
  }
}
