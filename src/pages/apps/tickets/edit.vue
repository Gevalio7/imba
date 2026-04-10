<script setup lang="ts">
import { $api } from '@/utils/api'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReferenceData } from '@/composables/useReferenceData'

definePage({
  meta: {
    navActiveLink: 'apps-tickets',
  },
})

const API_BASE = import.meta.env.VITE_API_BASE_URL

const router = useRouter()
const route = useRoute()

const { data: refData, fetchAll: loadReferenceData, isLoading: refLoading } = useReferenceData()

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

const ticketId = computed(() => {
  const id = route.query.id
  
  return id ? Number(id) : null
})

// Данные
const loading = ref(false)
const saving = ref(false)

// Настройки автоматического назначения
const autoAssignConfig = ref<any>(null)
const autoAssigned = ref(false)
const allowMultipleExecutorGroups = ref<any>(null)
const allowMultipleExecutors = ref<any>(null)

// Workflow данные
const currentWorkflow = ref<any>(null)
const availableStatuses = ref<any[]>([])
const loadingWorkflow = ref(false)

// Загрузка справочников - используется useReferenceData composable

// Вычисляемый выбранный SLA для отображения дедлайнов

// Вычисляемый выбранный SLA для отображения дедлайнов
const selectedSla = computed(() => {
  if (!ticket.slaId) return null
  return slaList.value.find((s: any) => s.id === ticket.slaId) || null
})

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

// Дедлайны SLA
const responseDeadline = computed(() => {
  if (!selectedSla.value?.responseTime) return null
  const date = new Date()
  date.setMinutes(date.getMinutes() + selectedSla.value.responseTime)
  return date
})

const resolutionDeadline = computed(() => {
  if (!selectedSla.value?.solutionTime) return null
  const date = new Date()
  date.setMinutes(date.getMinutes() + selectedSla.value.solutionTime)
  return date
})

// Форматирование времени SLA (в часах для responseTime, в минутах для solutionTime)
const formatSlaTime = (value: number | null | undefined, isHours: boolean = false) => {
  if (!value) return '-'
  if (isHours) {
    // Для responseTime - это часы
    if (value < 1) return `${Math.round(value * 60)} мин`
    if (value < 24) return `${value}ч`
    const days = Math.floor(value / 24)
    const hours = Math.round(value % 24)
    return hours > 0 ? `${days}д ${hours}ч` : `${days}д`
  } else {
    // Для solutionTime - это минуты
    if (value < 60) return `${value} мин`
    const hours = Math.floor(value / 60)
    const mins = value % 60
    if (hours < 24) return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return remainingHours > 0 ? `${days}д ${remainingHours}ч` : `${days}д`
  }
}

// Форматирование дедлайна
const formatDeadline = (date: Date | null) => {
  if (!date) return ''
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Загрузка workflow и доступных статусов по типу
const fetchTypeWorkflow = async (typeId: number, currentStatusId?: number | null) => {
  try {
    loadingWorkflow.value = true
    
    // Формируем URL с параметром currentStatusId если он передан
    let url = `${API_BASE}/types/${typeId}/workflow`
    if (currentStatusId) {
      url += `?currentStatusId=${currentStatusId}`
    }
    
    const data = await $api(url.replace(API_BASE, ''))
    
    currentWorkflow.value = (data as any).workflow
    
    // Если передан текущий статус и есть workflow, используем переходы из текущего статуса
    if (currentStatusId && currentWorkflow.value && (data as any).currentStatusTransitions) {
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

// Форма
const description = ref('')

const ticket = reactive({
  id: -1,
  ticketNumber: '',
  title: '',
  typeId: undefined as number | undefined,
  categoryId: undefined as number | undefined,
  priorityId: undefined as number | undefined,
  queueId: undefined as number | undefined,
  stateId: undefined as number | undefined,
  ownerId: undefined as number | { value: number; customerId: number; customerName?: string } | undefined,
  executorAgentIds: [] as number[],
  executorGroupIds: [] as number[],
  companyId: undefined as number | undefined,
  serviceId: undefined as number | undefined,
  slaId: undefined as number | undefined,
  responseDeadline: undefined as string | undefined,
  resolutionDeadline: undefined as string | undefined,
  // Эскалация
  observerAgentIds: [] as number[],
  observerGroupIds: [] as number[],
  escalationCount: 0,
  isEscalated: false,
  // Начальные значения для отслеживания изменений
  initialExecutorAgentIds: [] as number[],
  initialExecutorGroupIds: [] as number[],
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

// Эскалация
const ESCALATION_STATUS_TYPE = 'Эскалирована'

const performEscalation = () => {
  console.log('🚀 Выполняем эскалацию...')

  // a) Добавляем старых исполнителей в наблюдатели
  const previousExecutorAgentIds = ticket.initialExecutorAgentIds || ticket.executorAgentIds
  const previousExecutorGroupIds = ticket.initialExecutorGroupIds || ticket.executorGroupIds

  ticket.observerAgentIds = [...ticket.observerAgentIds, ...previousExecutorAgentIds.filter((id: number) => !ticket.observerAgentIds.includes(id))]
  ticket.observerGroupIds = [...ticket.observerGroupIds, ...previousExecutorGroupIds.filter((id: number) => !ticket.observerGroupIds.includes(id))]

  console.log('🚀 Добавлены наблюдатели:', {
    addedAgents: previousExecutorAgentIds,
    addedGroups: previousExecutorGroupIds,
  })

  // b) Увеличиваем счётчик эскалаций
  ticket.escalationCount += 1

  // c) Устанавливаем флаг эскалирования
  ticket.isEscalated = true

  console.log('🚀 Установлены флаги эскалации:', {
    escalationCount: ticket.escalationCount,
    isEscalated: ticket.isEscalated,
  })
}

// Watcher для эскалации при изменении статуса
watch(() => ticket.stateId, async (newStateId, oldStateId) => {
  console.log('🔍 Watcher stateId:', { newStateId, oldStateId })
  if (!newStateId || newStateId === oldStateId) return
  const newStatus = states.value.find((s: any) => s.id === newStateId)
  console.log('🔍 New status:', newStatus?.name, 'type:', newStatus?.type)
  if (newStatus?.type === ESCALATION_STATUS_TYPE) {
    console.log('🚀 Status changed to escalation type')
    // Валидация: при эскалации должны быть выбраны исполнители или группы
    if (ticket.executorAgentIds.length === 0 && ticket.executorGroupIds.length === 0) {
      console.log('🚫 Эскалация заблокирована: не выбраны исполнители/группы')
      showToast('При эскалации укажите группу исполнителей и/или исполнителя', 'error')
      return
    }
    performEscalation()
    // Save silently
    await performSave(false)
  }
})

// Watcher для изменения типа
watch(() => ticket.typeId, async (newTypeId, oldTypeId) => {
  // Пропускаем начальную загрузку (обрабатывается в fetchTicket)
  if (oldTypeId === undefined && ticket.stateId) return
  
  if (newTypeId) {
    await fetchTypeWorkflow(newTypeId, ticket.stateId)
    
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

// Watcher для изменения статуса - обновляем доступные переходы
watch(() => ticket.stateId, async (newStateId, oldStateId) => {
  // Пропускаем начальную загрузку (обрабатывается в fetchTicket)
  if (oldStateId === undefined) return
  
  // Если есть тип и workflow, обновляем доступные переходы
  if (ticket.typeId && currentWorkflow.value) {
    await fetchTypeWorkflow(ticket.typeId, newStateId)
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

// Вложения
const existingAttachments = ref<any[]>([])
const newAttachments = ref<File[]>([])

// Превью изображения
const imagePreview = ref<{ show: boolean; src: string; filename: string }>({
  show: false,
  src: '',
  filename: ''
})

// Состояние зума для превью изображения
const imageZoom = ref(100)

// Увеличить изображение
const zoomIn = () => {
  if (imageZoom.value < 300) {
    imageZoom.value += 25
  }
}

// Уменьшить изображение
const zoomOut = () => {
  if (imageZoom.value > 25) {
    imageZoom.value -= 25
  }
}

// Сбросить зум
const resetZoom = () => {
  imageZoom.value = 100
}

// Скачать изображение
const downloadImage = async () => {
  try {
    const response = await fetch(imagePreview.value.src)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = imagePreview.value.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Error downloading image:', err)
    showToast('Ошибка скачивания файла', 'error')
  }
}

// Напечатать изображение
const printImage = () => {
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>${imagePreview.value.filename}</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            img { max-width: 100%; max-height: 100vh; }
            @media print { body { display: block; } img { max-width: 100%; max-height: none; } }
          </style>
        </head>
        <body>
          <img src="${imagePreview.value.src}" alt="${imagePreview.value.filename}">
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}

// Проверка - является ли файл изображением по расширению
const isImageFile = (filename: string) => {
  if (!filename) return false
  const ext = filename.toLowerCase().split('.').pop() || ''
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)
}

// Проверка - является ли объект файлом изображения (для новых файлов)
const isImageType = (file: File) => {
  return file.type?.startsWith('image/')
}

// Создание URL для превью изображения
const createObjectUrl = (file: File): string => {
  console.log('createObjectUrl called:', { file, type: typeof file, isFile: file instanceof File })
  if (typeof window === 'undefined' || !window.URL) {
    console.log('No window.URL available')
    return ''
  }
  if (!file) {
    console.log('No file provided')
    return ''
  }
  try {
    const url = window.URL.createObjectURL(file)
    console.log('Created URL:', url)
    return url
  } catch (e) {
    console.error('Error creating object URL:', e)
    return ''
  }
}

// Открыть превью изображения
const openImagePreview = (attachment: any) => {
  imagePreview.value = {
    show: true,
    src: `/uploads/${attachment.filename}`,
    filename: attachment.filename
  }
}

// Закрыть превью
const closeImagePreview = () => {
  imagePreview.value.show = false
  imageZoom.value = 100 // Сбрасываем зум при закрытии
}

// Комментарии
const comments = ref<any[]>([])
const newComment = ref('')
const isInternalComment = ref(false)
const savingComment = ref(false)
const editingCommentId = ref<number | null>(null)
const editingCommentContent = ref('')
const deletingCommentId = ref<number | null>(null)
const showDeleteDialog = ref(false)

// Вкладки в блоке комментариев
const activeTab = ref('comments')

// История изменений
const historyChanges = ref<any[]>([])
const loadingHistory = ref(false)

// История согласования
const approvalHistory = ref<any[]>([])
const loadingApproval = ref(false)

// История переходов статусов
const statusHistory = ref<any[]>([])
const loadingStatusHistory = ref(false)

// Агенты для выбора
const agentOptions = computed(() => {
  return agents.value.map((a: any) => ({
    title: `${a.firstName || ''} ${a.lastName || ''} (${a.email || a.login})`.trim(),
    value: a.id,
  }))
})

// Авторы (сотрудники) для выбора - с информацией о компании
const authorOptions = computed(() => {
  return customerUsers.value.map((c: any) => {
    const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.login || 'Неизвестно'
    const email = c.email ? ` (${c.email})` : ''
    const companyInfo = c.customerName ? ` [${c.customerName}]` : ''
    return {
      title: `${name}${email}${companyInfo}`,
      value: c.id,
      customerId: c.customerId,
      customerName: c.customerName,
    }
  })
})

// Поиск для поля автор
const authorSearch = ref('')

// Флаг - показывать ли опцию создания нового сотрудника
const showCreateNewAuthor = ref(false)

// Временные данные для нового сотрудника
const newAuthorData = ref({
  email: '',
  firstName: 'Новый',
  lastName: 'Сотрудник',
})

// Модальное окно создания сотрудника
const showCreateAuthorDialog = ref(false)

// systemConfigs теперь получается через useReferenceData composable (systemConfigs computed)

// Проверка - разрешено ли создание сотрудника по email
const canCreateCustomerUserByEmail = computed(() => {
  const config = systemConfigs.value.find(c => c.name === 'create_customer_user_by_email')
  const result = config?.value === 'true' && config?.isActive
  console.log('⚙️ canCreateCustomerUserByEmail computed:', result, 'config:', config)
  return result
})

// Фильтрованный список авторов по поиску
const filteredAuthorOptions = computed(() => {
  if (!authorSearch.value.trim()) {
    return authorOptions.value
  }
  const search = authorSearch.value.toLowerCase()
  return authorOptions.value.filter((a: any) => {
    return a.title.toLowerCase().includes(search)
  })
})

// Проверка - является ли введенный текст email
const isEmail = (text: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(text)
}

// Выбор автора из списка
const handleAuthorSelect = (item: any) => {
  showCreateNewAuthor.value = false
  newAuthorData.value.email = ''
}

// Очистка выбора автора
const handleAuthorClear = () => {
  showCreateNewAuthor.value = false
  newAuthorData.value.email = ''
}

// Обработка ввода в поле автора
const handleAuthorUpdate = (search: string) => {
  console.log('🔍 handleAuthorUpdate called with:', search)
  authorSearch.value = search || ''

  console.log('📧 canCreateCustomerUserByEmail:', canCreateCustomerUserByEmail.value)
  console.log('📧 isEmail(search):', isEmail(search))
  console.log('📧 authorOptions.length:', authorOptions.value.length)

  // Если включена опция создания по email и введен email
  if (canCreateCustomerUserByEmail.value && search && isEmail(search)) {
    console.log('✅ Checking for existing user...')
    // Проверяем, есть ли сотрудник с таким email
    const found = authorOptions.value.find((a: any) =>
      a.title.toLowerCase().includes(search.toLowerCase())
    )
    console.log('🔍 Found user:', found)

    if (!found) {
      console.log('🆕 Showing create option')
      // Показываем опцию создания нового сотрудника
      showCreateNewAuthor.value = true
      newAuthorData.value.email = search
    } else {
      console.log('👤 User found, hiding create option')
      showCreateNewAuthor.value = false
    }
  } else {
    console.log('❌ Conditions not met, hiding create option')
    showCreateNewAuthor.value = false
  }

  console.log('📊 Final state - showCreateNewAuthor:', showCreateNewAuthor.value)
}

// Создание нового сотрудника
const createNewAuthor = async () => {
  if (!newAuthorData.value.email || !isEmail(newAuthorData.value.email)) {
    showToast('Введите корректный email', 'error')
    return
  }
  
  try {
    // Создаем сотрудника
    const newUser = await $api('/customerUsers', {
      method: 'POST',
      body: {
        email: newAuthorData.value.email,
        firstName: newAuthorData.value.firstName,
        lastName: newAuthorData.value.lastName,
        login: newAuthorData.value.email,
        customerId: ticket.companyId || null,
      },
    })
    
    // Обновляем список сотрудников
    await fetchCustomerUsers()
    
    // Устанавливаем выбранного сотрудника
    ticket.ownerId = {
      value: (newUser as any).id,
      customerId: (newUser as any).customerId,
      customerName: (newUser as any).customerName,
    }
    
    showToast('Сотрудник создан', 'success')
    showCreateNewAuthor.value = false
    authorSearch.value = ''
  } catch (err: any) {
    console.error('Error creating customer user:', err)
    showToast(err.data?.message || 'Ошибка создания сотрудника', 'error')
  }
}

// Группы агентов для выбора
const agentGroupOptions = computed(() => {
  return agentGroups.value.map((g: any) => ({
    title: g.name,
    value: g.id,
  }))
})

// Текущий пользователь
const userData = useCookie<any>('userData')

// Назначить на себя
const assignToMe = () => {
  // Находим агента по логину пользователя
  const currentAgent = agents.value.find((a: any) => a.login === userData.value?.login)
  if (currentAgent) {
    // Добавляем себя как исполнителя
    if (!ticket.executorAgentIds.includes(currentAgent.id)) {
      ticket.executorAgentIds = [...ticket.executorAgentIds, currentAgent.id]
    }
    // Добавляем группы, в которые входит пользователь
    if (currentAgent.groups && currentAgent.groups.length > 0) {
      const groupIds = currentAgent.groups.map((g: any) => g.id).filter((id: number) => !ticket.executorGroupIds.includes(id))
      ticket.executorGroupIds = [...ticket.executorGroupIds, ...groupIds]
    }
    showToast('Вы назначены исполнителем')
  } else {
    showToast('Вы не являетесь агентом', 'error')
  }
}

// Вычисляемый список статусов для выбора
const statusOptions = computed(() => {
  // Если есть workflow и доступные статусы
  if (availableStatuses.value.length > 0) {
    // Находим текущий статус в общем списке
    const currentStatus = states.value.find((s: any) => s.id === ticket.stateId)
    
    // Создаём список с текущим статусом (если он есть и не в availableStatuses)
    const options = availableStatuses.value.map(s => ({
      title: s.name,
      value: s.id,
      color: s.color,
    }))
    
    // Добавляем текущий статус если его нет в списке
    if (currentStatus && !options.find(o => o.value === currentStatus.id)) {
      options.unshift({
        title: currentStatus.name,
        value: currentStatus.id,
        color: currentStatus.color,
      })
    }
    
    return options
  }
  
  // Если нет workflow - возвращаем все статусы
  return states.value.map((s: any) => ({
    title: s.name,
    value: s.id,
    color: s.color,
  }))
})

// Загрузка тикета
const fetchTicket = async () => {
  if (!ticketId.value) return

  try {
    loading.value = true
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
      const owner = authorOptions.value.find((a: any) => a.value === t.ownerId)
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
    // Эскалация
    ticket.observerAgentIds = t.observerAgentIds || []
    ticket.observerGroupIds = t.observerGroupIds || [] // TODO: типизировать - добавить поле в API/бэкенд
    ticket.escalationCount = t.escalationCount || 0
    ticket.isEscalated = t.isEscalated || false
    // Сохраняем начальные значения исполнителей для определения изменений при эскалации
    ticket.initialExecutorAgentIds = t.executorAgentIds || []
    ticket.initialExecutorGroupIds = t.executorGroupIds || []
    description.value = t.description || ''
    
    // Загружаем вложения
    if (t.attachments) {
      existingAttachments.value = t.attachments
    }

    // Автоматическое назначение агента как исполнителя при просмотре, если настройка включена, еще не было автоматического назначения и у тикета нет исполнителей
    if (autoAssignConfig.value?.value === 'true' && !autoAssigned.value && ticket.executorAgentIds.length === 0) {
      console.log('Проверяем автоматическое назначение:', {
        config: autoAssignConfig.value?.value,
        autoAssigned: autoAssigned.value,
        userLogin: userData.value?.login,
        agentsCount: agents.value.length,
        currentExecutorIds: ticket.executorAgentIds
      })
      const currentAgent = agents.value.find((a: any) => a.login === userData.value?.login)
      console.log('Найден агент:', currentAgent)
      if (currentAgent) {
        console.log('Добавляем агента как исполнителя')
        ticket.executorAgentIds = [currentAgent.id]
        // Добавляем группы агента
        ticket.executorGroupIds = currentAgent.groups ? currentAgent.groups.map((g: any) => g.id) : []
        console.log('Автоматически назначен агент как исполнитель при просмотре тикета')
        showToast('Вы назначены исполнителем')
        autoAssigned.value = true
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
    showToast('Ошибка загрузки обращения', 'error')
  }
  finally {
    loading.value = false
  }
}

// Загрузка комментариев
const fetchComments = async () => {
  if (!ticketId.value) return

  try {
    const data = await $api(`/ticketComments?ticketId=${ticketId.value}`)
    comments.value = (data as any).comments || []
  }
  catch (err) {
    console.error('Error fetching comments:', err)
  }
}

// Загрузка вложений тикета
const fetchAttachments = async () => {
  if (!ticketId.value) return

  try {
    const data = await $api(`/ticketAttachments?ticketId=${ticketId.value}`)
    existingAttachments.value = (data as any).attachments || []
  }
  catch (err) {
    console.error('Error fetching attachments:', err)
  }
}

// Загрузка истории изменений
const fetchHistory = async () => {
  if (!ticketId.value) return

  try {
    loadingHistory.value = true
    const data = await $api(`/ticketHistory?ticketId=${ticketId.value}`)
    historyChanges.value = (data as any).history || []
  }
  catch (err) {
    console.error('Error fetching history:', err)
  }
  finally {
    loadingHistory.value = false
  }
}

// Загрузка истории согласования
const fetchApprovalHistory = async () => {
  if (!ticketId.value) return

  try {
    loadingApproval.value = true
    const data = await $api(`/ticketHistory/approval/${ticketId.value}`)
    approvalHistory.value = (data as any).approvals || []
  }
  catch (err) {
    console.error('Error fetching approval history:', err)
  }
  finally {
    loadingApproval.value = false
  }
}

// Загрузка истории переходов статусов
const fetchStatusHistory = async () => {
  if (!ticketId.value) return

  try {
    loadingStatusHistory.value = true
    const data = await $api(`/ticketStatusHistory/${ticketId.value}`)
    statusHistory.value = (data as any).history || []
  }
  catch (err) {
    console.error('Error fetching status history:', err)
  }
  finally {
    loadingStatusHistory.value = false
  }
}

// Форматирование интервала времени
const formatTimeInStatus = (interval: string | Record<string, number> | null) => {
  if (!interval) return '-'
  
  let days = 0
  let hours = 0
  let minutes = 0
  let seconds = 0
  
  // PostgreSQL pg driver возвращает interval как объект
  if (typeof interval === 'object') {
    days = interval.days || 0
    hours = interval.hours || 0
    minutes = interval.minutes || 0
    seconds = interval.seconds || 0
  }
  else if (typeof interval === 'string') {
    // Парсим PostgreSQL interval формат строки
    const match = interval.match(/(?:(\d+)\s*days?\s*)?(?:(\d+):(\d+):(\d+))?/)
    if (match) {
      days = parseInt(match[1] || '0')
      hours = parseInt(match[2] || '0')
      minutes = parseInt(match[3] || '0')
      seconds = parseInt(match[4] || '0')
    }
    else {
      return interval
    }
  }
  else {
    return '-'
  }
  
  const parts: string[] = []
  if (days > 0) parts.push(`${days} дн.`)
  if (hours > 0) parts.push(`${hours} ч.`)
  if (minutes > 0) parts.push(`${minutes} мин.`)
  if (seconds > 0 && parts.length === 0) parts.push(`${seconds} сек.`)
  
   return parts.length > 0 ? parts.join(' ') : 'менее 1 мин.'
}

// Функция выполнения сохранения
const performSave = async (redirectAfterSave = true) => {
  try {
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



    // Загружаем новые вложения
    if (newAttachments.value.length > 0) {
      await uploadNewAttachments()
    }

    if (redirectAfterSave) {
      if (isCreating) {
        showToast('Тикет успешно создан')
        // Перенаправляем на список тикетов
        router.push('/apps/tickets')
      } else {
        showToast('Тикет успешно обновлён')
        await fetchTicket() // Обновляем данные включая SLA дедлайны
        await fetchAttachments()
        await fetchHistory() // Обновляем историю изменений
        await fetchStatusHistory() // Обновляем историю переходов
        newAttachments.value = []

        // Перенаправляем на список тикетов
        router.push('/apps/tickets')
      }
    } else {
      // Тихое сохранение без уведомлений и перенаправления
      if (!isCreating) {
        await fetchTicket()
      }
    }
  }
  catch (err: any) {
    console.error('Error saving ticket:', err)
    if (redirectAfterSave) {
      showToast('Ошибка сохранения обращения', 'error')
      saving.value = false
    }
  }
}

// Сохранение
const save = async () => {
  console.log('💾 Save called')
  console.log('📝 Title:', ticket.title)
  console.log('👤 showCreateNewAuthor:', showCreateNewAuthor.value)
  console.log('📧 authorSearch:', authorSearch.value)
  console.log('📧 isEmail(authorSearch):', isEmail(authorSearch.value))

  if (!ticket.title?.trim()) {
    showToast('Заголовок обязателен для заполнения', 'error')
    return
  }

  // Проверка обязательности категории если тип имеет связанные категории
  if (hasCategoriesForType.value && !ticket.categoryId) {
    showToast('Выберите категорию для данного типа', 'error')
    return
  }

  try {
    saving.value = true

    // Проверяем, нужно ли показать модальное окно для создания сотрудника
    if (showCreateNewAuthor.value && authorSearch.value && isEmail(authorSearch.value)) {
      console.log('🪟 Showing create dialog')
      showCreateAuthorDialog.value = true
      saving.value = false
      return
    }

    console.log('✅ Proceeding with save')
    // Продолжаем сохранение
    await performSave()
  }
  catch (err: any) {
    console.error('Error saving ticket:', err)
    // Показываем более информативное сообщение об ошибке
    if (err.data?.message) {
      showToast(err.data.message, 'error')
    } else {
      showToast('Ошибка сохранения обращения', 'error')
    }
    saving.value = false
  }
}

// Создание сотрудника из модального окна
const createAuthorFromDialog = async () => {
  try {
    saving.value = true
    showCreateAuthorDialog.value = false

    // Создаем сотрудника
    const newUser = await $api('/customerUsers', {
      method: 'POST',
      body: {
        email: authorSearch.value,
        firstName: newAuthorData.value.firstName,
        lastName: newAuthorData.value.lastName,
        login: authorSearch.value,
        customerId: ticket.companyId || null,
      },
    })

    // Обновляем список сотрудников
    await fetchCustomerUsers()

    // Устанавливаем выбранного сотрудника
    ticket.ownerId = {
      value: (newUser as any).id,
      customerId: (newUser as any).customerId,
      customerName: (newUser as any).customerName,
    }

    showToast('Сотрудник создан', 'success')

    // Теперь выполняем сохранение тикета
    await performSave()
  } catch (err: any) {
    console.error('Error creating customer user:', err)
    showToast(err.data?.message || 'Ошибка создания сотрудника', 'error')
    saving.value = false
  }
}

// Отмена создания сотрудника
const cancelCreateAuthor = () => {
  showCreateAuthorDialog.value = false
  saving.value = false
}

// Добавление комментария
const addComment = async () => {
  if (!newComment.value.trim() || !ticketId.value) return

  try {
    savingComment.value = true
    // Находим текущего агента
    const currentAgent = agents.value.find((a: any) => a.login === userData.value?.login)
    await $api('/ticketComments', {
      method: 'POST',
      body: {
        ticketId: ticketId.value,
        content: newComment.value,
        isInternal: isInternalComment.value,
        authorId: userData.value?.id || null,
      },
    })
    newComment.value = ''
    await fetchComments()
    showToast('Комментарий добавлен')
  }
  catch (err) {
    console.error('Error adding comment:', err)
    showToast('Ошибка добавления комментария', 'error')
  }
  finally {
    savingComment.value = false
  }
}

// Редактирование комментария
const startEditComment = (comment: any) => {
  editingCommentId.value = comment.id
  editingCommentContent.value = comment.content
}

const cancelEditComment = () => {
  editingCommentId.value = null
  editingCommentContent.value = ''
}

const saveEditComment = async (commentId: number) => {
  if (!editingCommentContent.value.trim()) return

  try {
    await $api(`/ticketComments/${commentId}`, {
      method: 'PUT',
      body: { content: editingCommentContent.value }
    })
    editingCommentId.value = null
    editingCommentContent.value = ''
    await fetchComments()
    showToast('Комментарий обновлён')
  }
  catch (err) {
    console.error('Error updating comment:', err)
    showToast('Ошибка обновления комментария', 'error')
  }
}

// Удаление комментария
const confirmDeleteComment = (commentId: number) => {
  deletingCommentId.value = commentId
  showDeleteDialog.value = true
}

const deleteComment = async () => {
  if (!deletingCommentId.value) return

  try {
    await $api(`/ticketComments/${deletingCommentId.value}`, {
      method: 'DELETE'
    })
    showDeleteDialog.value = false
    deletingCommentId.value = null
    await fetchComments()
    showToast('Комментарий удалён')
  }
  catch (err) {
    console.error('Error deleting comment:', err)
    showToast('Ошибка удаления комментария', 'error')
  }
}

// Обработка файлов
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    newAttachments.value = [...newAttachments.value, ...Array.from(target.files)]
  }
}

const removeNewAttachment = (index: number) => {
  newAttachments.value.splice(index, 1)
}

const deleteExistingAttachment = async (attachmentId: number) => {
  try {
    await $api(`/ticketAttachments/${attachmentId}`, {
      method: 'DELETE'
    })
    await fetchAttachments()
    showToast('Вложение удалено')
  }
  catch (err) {
    console.error('Error deleting attachment:', err)
    showToast('Ошибка удаления вложения', 'error')
  }
}

// Скачать одно вложение
const downloadAttachment = async (attachment: any) => {
  try {
    const link = document.createElement('a')
    link.href = `/uploads/${attachment.filename}`
    link.download = attachment.filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Error downloading attachment:', err)
    showToast('Ошибка скачивания файла', 'error')
  }
}

// Скачать все вложения
const downloadAllAttachments = async () => {
  if (existingAttachments.value.length === 0) return
  
  try {
    for (const attachment of existingAttachments.value) {
      // Небольшая задержка между скачиваниями
      await new Promise(resolve => setTimeout(resolve, 300))
      const link = document.createElement('a')
      link.href = `/uploads/${attachment.filename}`
      link.download = attachment.filename
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    showToast(`Скачано ${existingAttachments.value.length} файлов`)
  } catch (err) {
    console.error('Error downloading all attachments:', err)
    showToast('Ошибка скачивания файлов', 'error')
  }
}

// Получить MIME тип по расширению файла
const getMimeType = (filename: string): string => {
  const ext = filename.toLowerCase().split('.').pop()
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

// Попытаться использовать Web Share API для шаринга файлов
const tryWebShare = async (files: File[]): Promise<boolean> => {
  if (!navigator.share || !navigator.canShare) {
    return false
  }
  
  try {
    const shareData = {
      title: `Файлы из тикета #${ticket.ticketNumber}`,
      files: files,
    }
    
    if (navigator.canShare(shareData)) {
      await navigator.share(shareData)
      return true
    }
  } catch (err) {
    console.log('Web Share API not available or failed:', err)
  }
  return false
}

// Загрузить файл как Blob для шаринга
const fetchFileAsBlob = async (url: string): Promise<{ blob: Blob; filename: string } | null> => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const filename = url.split('/').pop() || 'file'
    return { blob, filename }
  } catch (err) {
    console.error('Error fetching file:', err)
    return null
  }
}

// Поделиться через Telegram (с файлами если возможно)
const shareToTelegram = async () => {
  if (existingAttachments.value.length === 0) return
  
  try {
    // Пробуем использовать Web Share API для отправки файлов
    const files: File[] = []
    for (const attachment of existingAttachments.value) {
      const url = `/uploads/${attachment.filename}`
      const result = await fetchFileAsBlob(url)
      if (result) {
        const mimeType = getMimeType(attachment.filename)
        files.push(new File([result.blob], attachment.filename, { type: mimeType }))
      }
    }
    
    // Если удалось загрузить файлы и Web Share поддерживает их
    if (files.length > 0) {
      const shared = await tryWebShare(files)
      if (shared) return
    }
    
    // Фоллбек на ссылки
    const baseUrl = window.location.origin
    const fileLinks = existingAttachments.value
      .map((attachment) => `${attachment.filename}: ${baseUrl}/uploads/${encodeURIComponent(attachment.filename)}`)
      .join('\n')
    
    const message = `📎 Файлы из тикета #${ticket.ticketNumber}\n\n${fileLinks}`
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(message)}`
    
    window.open(telegramUrl, '_blank')
  } catch (err) {
    console.error('Error sharing to Telegram:', err)
    showToast('Ошибка открытия Telegram', 'error')
  }
}

// Поделиться через Mail.ru
const shareToMail = async () => {
  if (existingAttachments.value.length === 0) return
  
  try {
    const baseUrl = window.location.origin
    const fileLinks = existingAttachments.value
      .map((attachment) => `${attachment.filename}: ${baseUrl}/uploads/${encodeURIComponent(attachment.filename)}`)
      .join('\n')
    
    const subject = encodeURIComponent(`Файлы из тикета #${ticket.ticketNumber}`)
    const body = encodeURIComponent(`📎 Файлы из тикета #${ticket.ticketNumber}\n\n${fileLinks}`)
    
    window.open(`https://e.mail.ru/compose/?mailto=&subject=${subject}&body=${body}`, '_blank')
  } catch (err) {
    console.error('Error sharing to Mail:', err)
    showToast('Ошибка открытия Mail.ru', 'error')
  }
}

// Поделиться по email
const shareToEmail = async () => {
  if (existingAttachments.value.length === 0) return
  
  try {
    const baseUrl = window.location.origin
    const fileLinks = existingAttachments.value
      .map((attachment) => `${attachment.filename}: ${baseUrl}/uploads/${encodeURIComponent(attachment.filename)}`)
      .join('\n')
    
    const subject = encodeURIComponent(`Файлы из тикета #${ticket.ticketNumber}`)
    const body = encodeURIComponent(`📎 Файлы из тикета #${ticket.ticketNumber}\n\n${fileLinks}`)
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  } catch (err) {
    console.error('Error sharing to Email:', err)
    showToast('Ошибка открытия почты', 'error')
  }
}

// Показать/скрыть меню шеринга
const showShareMenu = ref(false)

const uploadNewAttachments = async () => {
  for (const file of newAttachments.value) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('ticketId', ticketId.value!.toString())

    await $api('/ticketAttachments', {
      method: 'POST',
      body: formData,
    })
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Отмена
// Отмена
const cancel = () => {
  router.push('/apps/tickets')
}

// Инициализация
onMounted(async () => {
  await loadReferenceData()
  await fetchTicket()
  await fetchComments()
  await fetchAttachments()
  await fetchHistory()
  await fetchApprovalHistory()
  await fetchStatusHistory()
  await fetchTicketSchedule()
})

// Уведомления
const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

// ========== РАСПИСАНИЕ ТИКЕТА ==========
const ticketSchedule = ref<any>(null)
const loadingSchedule = ref(false)
const showScheduleDialog = ref(false)

// Форма расписания
const scheduleForm = reactive({
  scheduleType: 'daily' as 'daily' | 'weekly' | 'monthly',
  scheduleTime: '09:00',
  scheduleDays: [] as number[],
  scheduleDayOfMonth: 1,
  startDate: null as string | null,
  endDate: null as string | null,
  isActive: true,
  titlePrefix: 'Расписание (Р) ',
})

// Варианты типов расписания
const scheduleTypeOptions = [
  { title: 'Ежедневно', value: 'daily' },
  { title: 'Еженедельно', value: 'weekly' },
  { title: 'Ежемесячно', value: 'monthly' },
]

// Дни недели
const weekDays = [
  { title: 'Пн', value: 1 },
  { title: 'Вт', value: 2 },
  { title: 'Ср', value: 3 },
  { title: 'Чт', value: 4 },
  { title: 'Пт', value: 5 },
  { title: 'Сб', value: 6 },
  { title: 'Вс', value: 7 },
]

// Дни месяца (1-31)
const monthDays = Array.from({ length: 31 }, (_, i) => ({
  title: String(i + 1),
  value: i + 1,
}))

// Загрузка расписания для тикета
const fetchTicketSchedule = async () => {
  if (!ticketId.value) return

  try {
    loadingSchedule.value = true
    const data = await $api(`/ticketSchedules/ticket/${ticketId.value}`)
    ticketSchedule.value = (data as any).schedule || null
  }
  catch (err) {
    console.log('Error fetching schedule:', err)
  }
  finally {
    loadingSchedule.value = false
  }
}

// Открыть диалог настройки расписания
const openScheduleDialog = () => {
  if (ticketSchedule.value) {
    // Редактирование - заполняем форму текущими значениями
    scheduleForm.scheduleType = ticketSchedule.value.scheduleType || 'daily'
    scheduleForm.scheduleTime = ticketSchedule.value.scheduleTime || '09:00'
    scheduleForm.scheduleDays = ticketSchedule.value.scheduleDays || []
    scheduleForm.scheduleDayOfMonth = ticketSchedule.value.scheduleDayOfMonth || 1
    scheduleForm.startDate = ticketSchedule.value.startDate || null
    scheduleForm.endDate = ticketSchedule.value.endDate || null
    scheduleForm.isActive = ticketSchedule.value.isActive !== false
    scheduleForm.titlePrefix = ticketSchedule.value.titlePrefix || 'Расписание (Р) '
  } else {
    // Создание - сбрасываем форму
    scheduleForm.scheduleType = 'daily'
    scheduleForm.scheduleTime = '09:00'
    scheduleForm.scheduleDays = []
    scheduleForm.scheduleDayOfMonth = 1
    scheduleForm.startDate = null
    scheduleForm.endDate = null
    scheduleForm.isActive = true
    scheduleForm.titlePrefix = 'Расписание (Р) '
  }
  showScheduleDialog.value = true
}

// Сохранить расписание
const saveSchedule = async () => {
  if (!ticketId.value) return
  
  try {
    saving.value = true
    
    const scheduleData = {
      ticketId: ticketId.value,
      copyFromTicket: true,
      ...scheduleForm,
    }
    
    if (ticketSchedule.value?.id) {
      // Обновляем
      await $api(`/ticketSchedules/${ticketSchedule.value.id}`, {
        method: 'PUT',
        body: scheduleData
      })
      showToast('Расписание обновлено')
    } else {
      // Создаём
      await $api('/ticketSchedules', {
        method: 'POST',
        body: scheduleData,
      })
      showToast('Расписание создано')
    }
    
    showScheduleDialog.value = false
    await fetchTicketSchedule()
  }
  catch (err: any) {
    console.error('Error saving schedule:', err)
    if (err.data?.message) {
      showToast(err.data.message, 'error')
    } else {
      showToast('Ошибка сохранения расписания', 'error')
    }
  }
  finally {
    saving.value = false
  }
}

// Удалить расписание
const deleteSchedule = async () => {
  if (!ticketSchedule.value?.id) return

  try {
    await $api(`/ticketSchedules/${ticketSchedule.value.id}`, {
      method: 'DELETE'
    })
    showToast('Расписание удалено')
    ticketSchedule.value = null
  }
  catch (err) {
    console.error('Error deleting schedule:', err)
    showToast('Ошибка удаления расписания', 'error')
  }
}

// Запустить расписание вручную (создать тикет)
const runScheduleNow = async () => {
  if (!ticketSchedule.value?.id) return
  
  try {
    saving.value = true
    const data = await $api(`/ticketSchedules/${ticketSchedule.value.id}/run`, {
      method: 'POST',
    })
    showToast((data as any).message || 'Тикет создан')
  }
  catch (err: any) {
    console.error('Error running schedule:', err)
    if (err.data?.message) {
      showToast(err.data.message, 'error')
    } else {
      showToast('Ошибка запуска расписания', 'error')
    }
  }
  finally {
    saving.value = false
  }
}

// Форматирование даты
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return ''
  
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Форматирование даты только для даты (без времени)
const formatDateOnly = (dateStr: string | null) => {
  if (!dateStr) return ''
  
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex flex-wrap justify-start justify-sm-space-between gap-y-4 gap-x-6 mb-6">
      <div class="d-flex flex-column justify-center">
        <h4 class="text-h4 mb-1">
          Редактирование обращения
        </h4>
        <div
          v-if="ticket.ticketNumber"
          class="text-body-1"
        >
          #{{ ticket.ticketNumber }}
        </div>
      </div>

      <div class="d-flex gap-4 align-center flex-wrap">
        <VBtn
          variant="tonal"
          color="primary"
          @click="openScheduleDialog"
        >
          <VIcon icon="bx-calendar" class="me-1" />
          Расписание
        </VBtn>
        <VBtn
          variant="tonal"
          color="secondary"
          @click="cancel"
        >
          Отмена
        </VBtn>
        <VBtn
          :loading="saving"
          @click="save"
        >
          Сохранить
        </VBtn>
      </div>
    </div>

    <VRow>
      <!-- Левая колонка - Основная информация -->
      <VCol
        cols="12"
        md="8"
      >
        <!-- Основная информация -->
        <VCard class="mb-6">
          <VCardTitle class="d-flex align-center px-6 py-4">
            <h5 class="text-h5">
              Основная информация
            </h5>
          </VCardTitle>
          
          <div
            v-if="loading"
            class="d-flex justify-center pa-6"
          >
            <VProgressCircular
              indeterminate
              color="primary"
            />
          </div>

          <VCardText v-else>
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="ticket.title"
                  label="Заголовок *"
                  placeholder="Введите заголовок обращения"
                />
              </VCol>

              <VCol cols="12">
                <label class="v-label text-body-1 d-block mb-2">Описание</label>
                <TiptapEditor
                  v-model="description"
                  placeholder="Введите подробное описание проблемы"
                  class="border rounded"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Вложения -->
        <VCard class="mb-6">
          <VCardTitle class="d-flex align-center px-6 py-4">
            <h5 class="text-h5">
              Вложения
            </h5>
          </VCardTitle>
          <VCardText>
            <!-- Существующие вложения -->
            <div v-if="existingAttachments.length > 0" class="mb-4">
              <div class="d-flex justify-space-between align-center mb-2">
                <p class="text-body-2 mb-0">Прикрепленные файлы:</p>
                <div class="d-flex gap-2">
                  <!-- Меню поделиться -->
                  <VMenu
                    v-model="showShareMenu"
                    :close-on-content-click="false"
                    location="bottom end"
                  >
                    <template #activator="{ props }">
                      <VBtn
                        v-if="existingAttachments.length > 0"
                        v-bind="props"
                        icon
                        variant="tonal"
                        size="small"
                        color="info"
                      >
                        <VIcon icon="bx-share" />
                      </VBtn>
                    </template>
                    <VList density="compact" nav>
                      <VListItem
                        prepend-icon="bxl-telegram"
                        title="Telegram"
                        @click="shareToTelegram"
                      />
                      <VListItem
                        prepend-icon="bxl-mail.ru"
                        title="Mail.ru"
                        @click="shareToMail"
                      />
                      <VListItem
                        prepend-icon="bx-envelope"
                        title="Email"
                        @click="shareToEmail"
                      />
                    </VList>
                  </VMenu>
                  
                  <VBtn
                    v-if="existingAttachments.length > 1"
                    variant="tonal"
                    size="small"
                    color="primary"
                    @click="downloadAllAttachments"
                  >
                    <VIcon icon="bx-download" class="me-1" />
                    Скачать все
                  </VBtn>
                </div>
              </div>
              <div class="attachments-grid d-flex flex-wrap gap-2">
                <div
                  v-for="attachment in existingAttachments"
                  :key="attachment.id"
                  class="attachment-item position-relative"
                >
                  <!-- Изображение - показываем превью -->
                  <VImg
                    v-if="isImageFile(attachment.filename)"
                    :src="`/uploads/${attachment.filename}`"
                    :alt="attachment.filename"
                    class="attachment-thumbnail rounded cursor-pointer"
                    cover
                    height="80"
                    width="80"
                    @click="openImagePreview(attachment)"
                  >
                    <template #placeholder>
                      <div class="d-flex align-center justify-center fill-height bg-surface-variant">
                        <VProgressCircular indeterminate size="20" />
                      </div>
                    </template>
                  </VImg>
                  
                  <!-- Иконка для не-изображений -->
                  <VCard
                    v-else
                    class="attachment-thumbnail rounded d-flex align-center justify-center cursor-pointer"
                    height="80"
                    width="80"
                    @click="openImagePreview(attachment)"
                  >
                    <VIcon icon="bx-file" size="32" color="grey" />
                  </VCard>
                  
                  <!-- Кнопка скачивания -->
                  <VBtn
                    icon
                    size="x-small"
                    color="primary"
                    class="attachment-download-btn"
                    @click.stop="downloadAttachment(attachment)"
                  >
                    <VIcon icon="bx-download" size="14" />
                  </VBtn>
                  
                  <!-- Кнопка удаления -->
                  <VBtn
                    icon
                    size="x-small"
                    color="error"
                    class="attachment-delete-btn"
                    @click="deleteExistingAttachment(attachment.id)"
                  >
                    <VIcon icon="bx-x" size="14" />
                  </VBtn>
                  
                  <!-- Название файла -->
                  <div class="text-caption text-truncate text-center mt-1" style="max-width: 80px;">
                    {{ attachment.filename }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Новые файлы для загрузки -->
            <div v-if="newAttachments.length > 0" class="mb-4">
              <p class="text-body-2 mb-2">Новые файлы:</p>
              <div class="attachments-grid d-flex flex-wrap gap-2">
                <div
                  v-for="(file, index) in newAttachments"
                  :key="index"
                  class="attachment-item position-relative"
                >
                  <!-- Превью для новых изображений -->
                  <VImg
                    v-if="isImageType(file)"
                    :src="createObjectUrl(file)"
                    :alt="file.name"
                    class="attachment-thumbnail rounded"
                    cover
                    height="80"
                    width="80"
                  >
                    <template #placeholder>
                      <div class="d-flex align-center justify-center fill-height bg-surface-variant">
                        <VProgressCircular indeterminate size="20" />
                      </div>
                    </template>
                  </VImg>
                  
                  <!-- Иконка для не-изображений -->
                  <VCard
                    v-else
                    class="attachment-thumbnail rounded d-flex align-center justify-center"
                    height="80"
                    width="80"
                  >
                    <VIcon icon="bx-file" size="32" color="grey" />
                  </VCard>
                  
                  <!-- Кнопка удаления -->
                  <VBtn
                    icon
                    size="x-small"
                    color="error"
                    class="attachment-delete-btn"
                    @click="removeNewAttachment(index)"
                  >
                    <VIcon icon="bx-x" size="14" />
                  </VBtn>
                  
                  <!-- Название файла -->
                  <div class="text-caption text-truncate text-center mt-1" style="max-width: 80px;">
                    {{ file.name }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Drop Zone -->
            <div class="drop-zone pa-6 text-center">
              <VIcon
                icon="bx-cloud-upload"
                size="36"
                color="primary"
                class="mb-2"
              />
              <p class="text-body-2 mb-2">
                Перетащите файлы сюда или
              </p>
              <VBtn
                variant="tonal"
                color="primary"
                size="small"
                tag="label"
                class="cursor-pointer"
              >
                <input
                  type="file"
                  multiple
                  hidden
                  @change="handleFileSelect"
                >
                Выберите файлы
              </VBtn>
            </div>
          </VCardText>
        </VCard>

        <!-- Комментарии и история -->
        <VCard class="mb-6">
          <VTabs v-model="activeTab">
            <VTab value="comments">
              Комментарии
              <VChip
                v-if="comments.length > 0"
                size="x-small"
                color="primary"
                class="ms-2"
              >
                {{ comments.length }}
              </VChip>
            </VTab>
            <VTab value="history">
              История изменений
              <VChip
                v-if="historyChanges.length > 0"
                size="x-small"
                color="secondary"
                class="ms-2"
              >
                {{ historyChanges.length }}
              </VChip>
            </VTab>
            <VTab value="approval">
              История согласования
              <VChip
                v-if="approvalHistory.length > 0"
                size="x-small"
                color="success"
                class="ms-2"
              >
                {{ approvalHistory.length }}
              </VChip>
            </VTab>
            <VTab value="statusHistory">
              История переходов
              <VChip
                v-if="statusHistory.length > 0"
                size="x-small"
                color="info"
                class="ms-2"
              >
                {{ statusHistory.length }}
              </VChip>
            </VTab>
          </VTabs>

          <VCardText>
            <!-- Вкладка Комментарии -->
            <VWindow v-model="activeTab">
              <VWindowItem value="comments">
                <!-- Список комментариев -->
                <div
                  v-if="comments.length > 0"
                  class="comments-list mb-6"
                >
                  <div
                    v-for="comment in comments"
                    :key="comment.id"
                    class="comment-item pa-4 mb-3 rounded"
                    :class="comment.isInternal ? 'internal-comment' : 'external-comment'"
                  >
                    <div class="d-flex justify-space-between align-start mb-2">
                      <div class="d-flex align-center">
                        <VAvatar
                          size="32"
                          color="primary"
                          class="me-2"
                        >
                          <VImg v-if="comment.authorAvatar" :src="comment.authorAvatar" />
                          <span v-else class="text-caption">{{ (comment.authorName || comment.author || 'U').charAt(0).toUpperCase() }}</span>
                        </VAvatar>
                        <div>
                          <div class="text-body-1 font-weight-medium">
                            {{ comment.authorName || comment.author || 'Пользователь' }}
                          </div>
                          <div class="text-caption text-medium-emphasis">
                            {{ formatDate(comment.createdAt) }}
                          </div>
                        </div>
                      </div>
                      <div class="d-flex align-center gap-1">
                        <VChip
                          v-if="comment.isInternal"
                          size="x-small"
                          color="warning"
                          variant="flat"
                          class="me-2"
                        >
                          Внутренний
                        </VChip>
                        <VBtn
                          icon
                          variant="text"
                          size="small"
                          @click="startEditComment(comment)"
                        >
                          <VIcon icon="bx-edit" size="18" />
                        </VBtn>
                        <VBtn
                          icon
                          variant="text"
                          color="error"
                          size="small"
                          @click="confirmDeleteComment(comment.id)"
                        >
                          <VIcon icon="bx-trash" size="18" />
                        </VBtn>
                      </div>
                    </div>
                    
                    <!-- Режим редактирования -->
                    <div v-if="editingCommentId === comment.id">
                      <AppTextarea
                        v-model="editingCommentContent"
                        rows="3"
                        auto-grow
                        class="mb-2"
                      />
                      <div class="d-flex gap-2 justify-end">
                        <VBtn
                          variant="tonal"
                          size="small"
                          @click="cancelEditComment"
                        >
                          Отмена
                        </VBtn>
                        <VBtn
                          size="small"
                          @click="saveEditComment(comment.id)"
                        >
                          Сохранить
                        </VBtn>
                      </div>
                    </div>
                    
                    <!-- Обычный режим -->
                    <div
                      v-else
                      class="text-body-2 comment-content"
                      v-html="comment.content"
                    />
                  </div>
                </div>

                <!-- Форма добавления комментария -->
                <div class="comment-form">
                  <AppTextarea
                    v-model="newComment"
                    placeholder="Напишите комментарий..."
                    rows="3"
                    auto-grow
                    class="mb-3"
                  />
                  <div class="d-flex justify-space-between align-center">
                    <VCheckbox
                      v-model="isInternalComment"
                      label="Внутренний комментарий (только для агентов)"
                      density="compact"
                      hide-details
                      color="warning"
                    />
                    <VBtn
                      :loading="savingComment"
                      :disabled="!newComment.trim()"
                      @click="addComment"
                    >
                      <VIcon
                        icon="bx-send"
                        class="me-2"
                      />
                      Отправить
                    </VBtn>
                  </div>
                </div>
              </VWindowItem>

              <!-- Вкладка История изменений -->
              <VWindowItem value="history">
                <div
                  v-if="loadingHistory"
                  class="d-flex justify-center pa-6"
                >
                  <VProgressCircular
                    indeterminate
                    color="primary"
                  />
                </div>
                <div
                  v-else-if="historyChanges.length === 0"
                  class="text-center text-medium-emphasis pa-6"
                >
                  История изменений пуста
                </div>
                <div
                  v-else
                  class="history-list"
                >
                  <div
                    v-for="item in historyChanges"
                    :key="item.id"
                    class="history-item pa-3 mb-2 rounded border"
                  >
                    <div class="d-flex justify-space-between align-start">
                      <div>
                        <div class="text-body-1 font-weight-medium">
                          {{ item.fieldDisplayName }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          {{ item.changedByName }} • {{ formatDate(item.createdAt) }}
                        </div>
                      </div>
                      <div class="text-body-2">
                        <span
                          v-if="item.oldValue"
                          class="text-error"
                        >
                          {{ item.oldValue }}
                        </span>
                        <VIcon
                          icon="bx-arrow-right"
                          size="16"
                          class="mx-1"
                        />
                        <span
                          v-if="item.newValue"
                          class="text-success"
                        >
                          {{ item.newValue }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </VWindowItem>

              <!-- Вкладка История согласования -->
              <VWindowItem value="approval">
                <div
                  v-if="loadingApproval"
                  class="d-flex justify-center pa-6"
                >
                  <VProgressCircular
                    indeterminate
                    color="primary"
                  />
                </div>
                <div
                  v-else-if="approvalHistory.length === 0"
                  class="text-center text-medium-emphasis pa-6"
                >
                  История согласования пуста
                </div>
                <div
                  v-else
                  class="approval-list"
                >
                  <div
                    v-for="item in approvalHistory"
                    :key="item.id"
                    class="approval-item pa-3 mb-2 rounded border"
                  >
                    <div class="d-flex justify-space-between align-start">
                      <div>
                        <div class="text-body-1 font-weight-medium">
                          {{ item.action || 'Согласование' }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          {{ item.approverName || 'Система' }} • {{ formatDate(item.createdAt) }}
                        </div>
                      </div>
                      <VChip
                        :color="item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'error' : 'warning'"
                        size="small"
                      >
                        {{ item.status === 'approved' ? 'Согласовано' : item.status === 'rejected' ? 'Отклонено' : 'Ожидает' }}
                      </VChip>
                    </div>
                    <div
                      v-if="item.comment"
                      class="text-body-2 mt-2"
                    >
                      {{ item.comment }}
                    </div>
                  </div>
                </div>
              </VWindowItem>

              <!-- Вкладка История переходов -->
              <VWindowItem value="statusHistory">
                <div
                  v-if="loadingStatusHistory"
                  class="d-flex justify-center pa-6"
                >
                  <VProgressCircular
                    indeterminate
                    color="primary"
                  />
                </div>
                <div
                  v-else-if="statusHistory.length === 0"
                  class="text-center text-medium-emphasis pa-6"
                >
                  История переходов пуста
                </div>
                <div
                  v-else
                  class="status-history-list"
                >
                  <div
                    v-for="item in statusHistory"
                    :key="item.id"
                    class="status-history-item pa-3 mb-2 rounded border"
                  >
                    <div class="d-flex justify-space-between align-start">
                      <div class="flex-grow-1">
                        <div class="d-flex align-center gap-2 mb-1">
                          <!-- Из статуса -->
                          <VChip
                            v-if="item.fromStatusName"
                            :color="item.fromStatusColor || 'default'"
                            size="small"
                            density="compact"
                          >
                            {{ item.fromStatusName }}
                          </VChip>
                          <span v-else class="text-caption text-medium-emphasis">Новый</span>
                          
                          <!-- Стрелка -->
                          <VIcon
                            icon="bx-arrow-right"
                            size="16"
                            color="primary"
                          />
                          
                          <!-- В статус -->
                          <VChip
                            :color="item.toStatusColor || 'primary'"
                            size="small"
                            density="compact"
                          >
                            {{ item.toStatusName }}
                          </VChip>
                        </div>
                        
                        <div class="text-caption text-medium-emphasis">
                          {{ item.changedByName || 'Система' }} • {{ formatDate(item.transitionTime || item.createdAt) }}
                        </div>
                        
                        <!-- Метка действия -->
                        <div
                          v-if="item.actionLabel"
                          class="text-body-2 mt-1"
                        >
                          <VIcon icon="bx-label" size="14" class="me-1" />
                          {{ item.actionLabel }}
                        </div>
                      </div>
                      
                      <!-- Время в статусе -->
                      <div class="text-right">
                        <div class="text-caption text-medium-emphasis">
                          Время в статусе:
                        </div>
                        <div class="text-body-2 font-weight-medium">
                          {{ formatTimeInStatus(item.timeInPreviousStatus) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </VWindowItem>
            </VWindow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Правая колонка - Свойства тикета -->
      <VCol
        cols="12"
        md="4"
      >
        <!-- Свойства -->
        <VCard class="mb-6">
          <VCardTitle class="d-flex align-center px-6 py-4">
            <h5 class="text-h5">
              Свойства
            </h5>
          </VCardTitle>
          <VCardText>
            <div class="d-flex flex-column gap-y-4">
              <AppTextField
                :model-value="ticket.ticketNumber"
                label="Номер обращения"
                disabled
              />

              <AppSelect
                v-model="ticket.typeId"
                :items="types"
                item-title="name"
                item-value="id"
                label="Тип"
                placeholder="Выберите тип"
                clearable
              />

              <!-- Категория - зависит от типа: показываем только если есть связанные категории -->
              <AppSelect
                v-if="categoryVisible"
                v-model="ticket.categoryId"
                :items="filteredCategories"
                item-title="name"
                item-value="id"
                label="Категория"
                placeholder="Выберите категорию"
                :disabled="!ticket.typeId"
                :error-messages="hasCategoriesForType && !ticket.categoryId ? 'Выберите категорию' : undefined"
                clearable
              />

              <!-- Информация о workflow -->
              <VAlert
                v-if="currentWorkflow"
                type="info"
                variant="tonal"
                density="compact"
                class="mb-2"
              >
                <div class="text-body-2">
                  <strong>Workflow:</strong> {{ currentWorkflow.name }}
                </div>
              </VAlert>

              <VProgressLinear
                v-if="loadingWorkflow"
                indeterminate
                color="primary"
                class="mb-2"
              />

              <AppSelect
                v-model="ticket.priorityId"
                :items="priorities"
                item-title="name"
                item-value="id"
                label="Приоритет"
                placeholder="Выберите приоритет"
                clearable
              />

              <AppSelect
                v-model="ticket.queueId"
                :items="queues"
                item-title="name"
                item-value="id"
                label="Очередь"
                placeholder="Выберите очередь"
                clearable
              />

              <!-- Статус - ограничен доступными из workflow или все если тип не выбран -->
              <AppSelect
                v-model="ticket.stateId"
                :items="statusOptions"
                item-title="title"
                item-value="value"
                label="Статус"
                :placeholder="availableStatuses.length > 0 ? 'Выберите статус из доступных' : 'Выберите статус'"
                :hint="availableStatuses.length > 0 ? 'Доступные статусы из workflow' : ''"
                :persistent-hint="availableStatuses.length > 0"
                clearable
              >
                <template #selection="{ item }">
                  <VChip
                    v-if="item.raw.color"
                    :color="item.raw.color"
                    density="compact"
                    label
                    size="small"
                  >
                    {{ item.title }}
                  </VChip>
                  <span v-else>{{ item.title }}</span>
                </template>
                <template #item="{ props, item }">
                  <VListItem v-bind="props">
                    <template #prepend>
                      <VChip
                        v-if="item.raw.color"
                        :color="item.raw.color"
                        density="compact"
                        label
                        size="small"
                        class="mr-2"
                      >
                        &nbsp;
                      </VChip>
                    </template>
                  </VListItem>
                </template>
              </AppSelect>

              <VAutocomplete
                v-model="ticket.ownerId"
                :items="filteredAuthorOptions"
                label="Автор"
                placeholder="Введите имя или email для поиска..."
                :search-input="authorSearch"
                clearable
                hide-no-data
                return-object
                @update:model-value="handleAuthorSelect"
                @update:search-input="handleAuthorUpdate"
                @click:clear="handleAuthorClear"
              >
                <!-- Если показывать опцию создания -->
                <template #append-item>
                  <div v-if="showCreateNewAuthor && canCreateCustomerUserByEmail" class="pa-2">
                    <VCard variant="tonal" color="primary" class="pa-3">
                      <div class="text-body-2 mb-2">
                        <VIcon icon="bx-plus" size="small" class="me-1" />
                        Создать нового сотрудника: <strong>{{ newAuthorData.email }}</strong>
                      </div>
                      <div class="d-flex gap-2">
                        <AppTextField
                          v-model="newAuthorData.firstName"
                          label="Имя"
                          placeholder="Имя"
                          density="compact"
                          hide-details
                          class="flex-grow-1"
                        />
                        <AppTextField
                          v-model="newAuthorData.lastName"
                          label="Фамилия"
                          placeholder="Фамилия"
                          density="compact"
                          hide-details
                          class="flex-grow-1"
                        />
                        <VBtn
                          color="primary"
                          size="small"
                          @click="createNewAuthor"
                        >
                          Создать
                        </VBtn>
                      </div>
                    </VCard>
                  </div>
                </template>
              </VAutocomplete>

              <!-- Группы исполнителей -->
              <AppSelect
                v-model="ticket.executorGroupIds"
                :items="agentGroupOptions"
                label="Группы исполнителей"
                placeholder="Выберите группы исполнителей"
                :multiple="allowMultipleExecutorGroups?.value === 'true'"
                chips
                clearable
              />

              <!-- Исполнители -->
              <AppSelect
                v-model="ticket.executorAgentIds"
                :items="agentOptions"
                label="Исполнители"
                placeholder="Выберите исполнителей"
                :multiple="allowMultipleExecutors?.value === 'true'"
                chips
                clearable
              >
                <template #append-inner>
                  <VBtn
                    variant="text"
                    size="small"
                    color="primary"
                    @click="assignToMe"
                  >
                    Назначить на себя
                  </VBtn>
                </template>
              </AppSelect>

              <!-- Группы наблюдателей -->
              <AppSelect
                v-model="ticket.observerGroupIds"
                :items="agentGroupOptions"
                label="Группы наблюдателей"
                placeholder="Наблюдатели добавляются автоматически при эскалации"
                multiple
                chips
                readonly
              />

              <!-- Наблюдатели -->
              <AppSelect
                v-model="ticket.observerAgentIds"
                :items="agentOptions"
                label="Наблюдатели"
                placeholder="Наблюдатели добавляются автоматически при эскалации"
                multiple
                chips
                readonly
              />

              <!-- Счётчик эскалаций -->
              <AppTextField
                :model-value="ticket.escalationCount"
                label="Количество эскалаций"
                readonly
              />

              <AppSelect
                v-model="ticket.companyId"
                :items="customers"
                item-title="name"
                item-value="id"
                label="Компания"
                placeholder="Выберите компанию"
                clearable
              />

              <AppSelect
                v-model="ticket.serviceId"
                :items="filteredServices"
                item-title="name"
                item-value="id"
                label="Сервис"
                placeholder="Выберите сервис"
                clearable
              />

              <AppSelect
                v-model="ticket.slaId"
                :items="slaList"
                item-title="name"
                item-value="id"
                label="SLA"
                placeholder="Выберите SLA"
                clearable
              />

              <!-- Отображение SLA дедлайнов -->
              <VAlert
                v-if="selectedSla || ticket.responseDeadline || ticket.resolutionDeadline"
                type="info"
                variant="tonal"
                density="compact"
                class="mt-2"
              >
                <div class="text-body-2">
                  <div v-if="selectedSla?.responseTime">
                    <strong>Время первого ответа:</strong> {{ formatSlaTime(selectedSla.responseTime, true) }}
                  </div>
                  <div v-if="ticket.responseDeadline">
                    <strong>Срок ответа:</strong> {{ formatDate(ticket.responseDeadline) }}
                  </div>
                  <div v-if="selectedSla?.solutionTime">
                    <strong>Время решения:</strong> {{ formatSlaTime(selectedSla.solutionTime, false) }}
                  </div>
                  <div v-if="ticket.resolutionDeadline">
                    <strong>Срок решения:</strong> {{ formatDate(ticket.resolutionDeadline) }}
                  </div>
                  <div v-if="!selectedSla && !ticket.responseDeadline && !ticket.resolutionDeadline" class="text-body-2 text-medium-emphasis">
                    SLA не установлен
                  </div>
                </div>
              </VAlert>

            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Snackbar -->
    <VSnackbar
      v-model="isToastVisible"
      :color="toastColor"
      timeout="3000"
    >
      {{ toastMessage }}
    </VSnackbar>

    <!-- Диалог подтверждения удаления комментария -->
    <VDialog
      v-model="showDeleteDialog"
      max-width="400"
    >
      <VCard>
        <VCardTitle>Удаление комментария</VCardTitle>
        <VCardText>
          Вы уверены, что хотите удалить этот комментарий? Это действие нельзя отменить.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="tonal"
            @click="showDeleteDialog = false"
          >
            Отмена
          </VBtn>
          <VBtn
            color="error"
            @click="deleteComment"
          >
            Удалить
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Превью изображения -->
    <VDialog
      v-model="imagePreview.show"
      max-width="90%"
      width="auto"
    >
      <VCard class="pa-2">
        <VCardTitle class="d-flex justify-space-between align-center">
          <span class="text-truncate">{{ imagePreview.filename }}</span>
          <div class="d-flex align-center gap-1">
            <!-- Кнопки управления зумом -->
            <VBtn
              icon
              variant="text"
              size="small"
              :disabled="imageZoom <= 25"
              @click="zoomOut"
            >
              <VIcon icon="bx-zoom-out" />
            </VBtn>
            <VChip
              size="small"
              variant="tonal"
              class="mx-1"
              @click="resetZoom"
              style="cursor: pointer"
            >
              {{ imageZoom }}%
            </VChip>
            <VBtn
              icon
              variant="text"
              size="small"
              :disabled="imageZoom >= 300"
              @click="zoomIn"
            >
              <VIcon icon="bx-zoom-in" />
            </VBtn>
            
            <VDivider vertical class="mx-2" />
            
            <!-- Кнопка скачивания -->
            <VBtn
              icon
              variant="text"
              size="small"
              @click="downloadImage"
            >
              <VIcon icon="bx-download" />
            </VBtn>
            
            <!-- Кнопка печати -->
            <VBtn
              icon
              variant="text"
              size="small"
              @click="printImage"
            >
              <VIcon icon="bx-printer" />
            </VBtn>
            
            <VDivider vertical class="mx-2" />
            
            <!-- Кнопка закрытия -->
            <VBtn
              icon
              variant="text"
              size="small"
              @click="closeImagePreview"
            >
              <VIcon icon="bx-x" />
            </VBtn>
          </div>
        </VCardTitle>
        <VCardText class="d-flex justify-center align-center pa-0" style="overflow: auto;">
          <VImg
            :src="imagePreview.src"
            :alt="imagePreview.filename"
            :max-height="imageZoom > 100 ? 'none' : '80vh'"
            :max-width="imageZoom > 100 ? 'none' : '90vw'"
            :height="imageZoom > 100 ? `${imageZoom}%` : 'auto'"
            :width="imageZoom > 100 ? `${imageZoom}%` : 'auto'"
            contain
            :style="imageZoom > 100 ? 'object-fit: contain;' : ''"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="tonal"
            @click="closeImagePreview"
          >
            Закрыть
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Диалог настройки расписания -->
    <VDialog
      v-model="showScheduleDialog"
      max-width="500"
    >
      <VCard>
        <VCardTitle>
          {{ ticketSchedule?.id ? 'Редактирование расписания' : 'Создание расписания' }}
        </VCardTitle>
        <VCardText>
          <VAlert
            v-if="ticketSchedule?.isActive === false"
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            Расписание приостановлено
          </VAlert>

          <VSelect
            v-model="scheduleForm.scheduleType"
            :items="scheduleTypeOptions"
            label="Тип расписания"
            class="mb-4"
          />

          <AppTextField
            v-model="scheduleForm.scheduleTime"
            label="Время выполнения (HH:MM)"
            type="time"
            class="mb-4"
          />

          <AppTextField
            v-model="scheduleForm.titlePrefix"
            label="Префикс названия тикета"
            placeholder="Расписание (Р) "
            class="mb-4"
          />

          <!-- Дни недели (только для weekly) -->
          <VSelect
            v-if="scheduleForm.scheduleType === 'weekly'"
            v-model="scheduleForm.scheduleDays"
            :items="weekDays"
            label="Дни недели"
            multiple
            chips
            class="mb-4"
          />

          <!-- День месяца (только для monthly) -->
          <VSelect
            v-if="scheduleForm.scheduleType === 'monthly'"
            v-model="scheduleForm.scheduleDayOfMonth"
            :items="monthDays"
            label="День месяца"
            class="mb-4"
          />

          <VRow>
            <VCol cols="6">
              <AppTextField
                v-model="scheduleForm.startDate"
                label="Дата начала"
                type="date"
              />
            </VCol>
            <VCol cols="6">
              <AppTextField
                v-model="scheduleForm.endDate"
                label="Дата окончания"
                type="date"
              />
            </VCol>
          </VRow>

          <VCheckbox
            v-model="scheduleForm.isActive"
            label="Расписание активно"
            color="success"
            class="mt-2"
          />

          <!-- Информация о расписании -->
          <VAlert
            v-if="ticketSchedule?.nextRunAt"
            type="info"
            variant="tonal"
            class="mt-4"
          >
            <div class="text-body-2">
              <div>Следующий запуск: <strong>{{ formatDate(ticketSchedule.nextRunAt) }}</strong></div>
              <div v-if="ticketSchedule.lastRunAt">Последний запуск: {{ formatDate(ticketSchedule.lastRunAt) }}</div>
            </div>
          </VAlert>
        </VCardText>
        <VCardActions>
          <VBtn
            v-if="ticketSchedule?.id"
            variant="tonal"
            color="error"
            @click="deleteSchedule"
          >
            Удалить
          </VBtn>
          <VBtn
            v-if="ticketSchedule?.id && ticketSchedule.isActive"
            variant="tonal"
            color="primary"
            @click="runScheduleNow"
          >
            Создать тикет сейчас
          </VBtn>
          <VSpacer />
          <VBtn
            variant="tonal"
            @click="showScheduleDialog = false"
          >
            Отмена
          </VBtn>
          <VBtn
            :loading="saving"
            @click="saveSchedule"
          >
            Сохранить
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Модальное окно создания сотрудника -->
    <VDialog v-model="showCreateAuthorDialog" max-width="500px">
      <VCard title="Создание нового сотрудника">
        <VCardText>
          <div class="text-body-1 mb-3">
            Сотрудника с email <strong>{{ authorSearch }}</strong> не найдено. Создать нового сотрудника?
          </div>
          <div class="d-flex gap-2 mb-3">
            <AppTextField
              v-model="newAuthorData.firstName"
              label="Имя"
              placeholder="Имя"
              density="compact"
              hide-details
              class="flex-grow-1"
            />
            <AppTextField
              v-model="newAuthorData.lastName"
              label="Фамилия"
              placeholder="Фамилия"
              density="compact"
              hide-details
              class="flex-grow-1"
            />
          </div>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="grey" variant="outlined" @click="cancelCreateAuthor">Отмена</VBtn>
          <VBtn color="primary" variant="elevated" @click="createAuthorFromDialog">Создать</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style lang="scss" scoped>
.drop-zone {
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 6px;
  transition: border-color 0.2s;

  &:hover {
    border-color: rgba(var(--v-theme-primary), 0.5);
  }
}

.comments-list {
  max-block-size: 400px;
  overflow-y: auto;
}

.comment-item {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.internal-comment {
  background-color: rgba(var(--v-theme-warning), 0.05);
  border-inline-start: 3px solid rgb(var(--v-theme-warning));
}

.external-comment {
  background-color: rgba(var(--v-theme-primary), 0.02);
  border-inline-start: 3px solid rgb(var(--v-theme-primary));
}

.comment-content {
  word-break: break-word;
}

.history-list,
.approval-list,
.status-history-list {
  max-block-size: 400px;
  overflow-y: auto;
}

.history-item,
.approval-item,
.status-history-item {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.02);
  }
}

// Стили для миниатюр вложений
.attachments-grid {
  .attachment-item {
    &:hover {
      .attachment-download-btn,
      .attachment-delete-btn {
        opacity: 1;
      }
    }
  }

  .attachment-thumbnail {
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  .attachment-download-btn {
    position: absolute;
    top: -8px;
    left: -8px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .attachment-delete-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    opacity: 0;
    transition: opacity 0.2s;
  }
}
</style>

<style lang="scss">
.ProseMirror {
  p {
    margin-block-end: 0;
  }

  padding: 0.5rem;
  min-block-size: 150px;
  outline: none;

  p.is-editor-empty:first-child::before {
    block-size: 0;
    color: #adb5bd;
    content: attr(data-placeholder);
    float: inline-start;
    pointer-events: none;
  }
}
</style>
