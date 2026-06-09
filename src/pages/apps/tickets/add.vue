<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { $api } from '@/utils/api'
import { useReferenceData } from '@/composables/useReferenceData'
import { useAuthorSearch } from '@/composables/useAuthorSearch'
import { useTicketForm } from '@/composables/useTicketForm'

definePage({
  meta: {
    navActiveLink: 'apps-tickets',

    // route-level permission meta for router guard
    action: 'write',
    subject: 'menu_tickets_create',
  },
})

const API_BASE = import.meta.env.VITE_API_BASE_URL
const router = useRouter()

const { data: refData, fetchAll: loadReferenceData, refreshData: refreshReferenceData, isLoading: refLoading } = useReferenceData()

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

// === Большой рефакторинг: подключаем централизованный useTicketForm для режима создания ===
const ticketIdForForm = ref<number | null>(null)
const {
  ticket: formTicket,                    // основной реактивный объект тикета из composable
  queueUpdateInProgress,                 // защитный флаг вместо локального isUpdatingFromQueue
  applyDefaultsFromQueue,                // новая централизованная функция автозаполнения
  fetchWorkflowByType: composableFetchWorkflowByType,
  currentWorkflow: composableCurrentWorkflow,
  availableStatuses: composableAvailableStatuses,
  loadingWorkflow: composableLoadingWorkflow,
  availableTypes: composableAvailableTypes,
  filteredCategories: composableFilteredCategories,
  save: composableSave,           // централизованное сохранение (большой рефакторинг)
  saving: composableSaving,       // флаг сохранения из composable
} = useTicketForm(ticketIdForForm)

// Временный алиас: пока используем formTicket как основной источник (постепенная миграция)
const ticket = formTicket   // теперь ticket — это реактивный объект из composable

// Workflow данные (постепенно заменяем на composable версии)
const currentWorkflow = composableCurrentWorkflow
const availableStatuses = composableAvailableStatuses
const loadingWorkflow = composableLoadingWorkflow

// initialStatus пока оставляем локально (будет доработано)
const initialStatus = ref<any>(null)

// Флаг для предотвращения гонок — теперь берём из composable (но пока дублируем для минимальных правок)
let isUpdatingFromQueue = false   // будет заменён на queueUpdateInProgress в следующих шагах

// Загрузка справочников - используется useReferenceData composable

// Получение очереди по ID
const getQueueById = (queueId: number) => {
  return queues.value.find(q => q.id === queueId)
}

// Сброс данных workflow (для очистки при ошибках или удалении очереди)
// Постепенно делегируем в composable
const resetWorkflowData = () => {
  currentWorkflow.value = null
  initialStatus.value = null
  availableStatuses.value = []
  if (ticket) {
    ticket.stateId = undefined
    ticket.categoryId = undefined
    ticket.typeId = undefined
  }
}

// Загрузка workflow и доступных статусов по типу
// Большой рефакторинг: делегируем в централизованную версию из useTicketForm
const fetchTypeWorkflow = async (typeId: number) => {
  try {
    // Используем улучшенную версию из composable (она уже поддерживает initialStatus для новых тикетов)
    await composableFetchWorkflowByType(typeId)

    // Синхронизируем initialStatus (пока локально)
    // В будущем можно вынести initialStatus тоже в composable
    initialStatus.value = (currentWorkflow.value as any)?.initialStatus || null
  }
  catch (err) {
    console.error('Error fetching type workflow (delegated):', err)
    resetWorkflowData()
  }
}

// Форма
const saving = ref(false)
const description = ref('')

// ticket теперь приходит из useTicketForm (реактивный объект, без .value)
// Старая локальная ref-объект удалена в рамках большого рефакторинга

// Watcher для изменения типа - автоподстановка категории
// Большой рефакторинг: обновлено под реактивный ticket из composable + защитный флаг
watch(() => ticket.typeId, async (newTypeId, oldTypeId) => {
  // Пропускаем если это автоматическое обновление из очереди
  if ((isUpdatingFromQueue || queueUpdateInProgress.value) && oldTypeId === undefined) {
    return
  }

  if (newTypeId) {
    await fetchTypeWorkflow(newTypeId)

    // Автоподстановка категории только если пользователь ещё не выбрал
    if (!ticket.categoryId) {
      const selectedType = types.value.find((t: any) => t.id === newTypeId)
      if (selectedType?.categoryIds?.length === 1) {
        ticket.categoryId = selectedType.categoryIds[0]
      }
    }
    return
  }

  // Сброс при очистке типа
  resetWorkflowData()
})

// Watcher для очереди - автозаполнение из неё
watch(() => ticket.queueId, async (newQueueId, oldQueueId) => {
  // Пропускаем: начальная инициализация (старое значение undefined, новое тоже undefined)
  if (oldQueueId === undefined && !newQueueId) {
    return
  }
  
  // Пропускаем: очередь не выбрана
  if (!newQueueId) {
    resetWorkflowData()
    return
  }

  // Дополнительная проверка: справочники должны быть загружены
  if (!queues.value || queues.value.length === 0) {
    console.log('[QUEUE-WATCHER] Reference data not loaded yet, skipping')
    return
  }

  // Используем защитный флаг из composable
  isUpdatingFromQueue = true

  try {
    // Главный шаг большого рефакторинга — вся логика автозаполнения теперь здесь
    await applyDefaultsFromQueue(newQueueId, true)

    // После делегирования обновляем локальный initialStatus (если нужно)
    initialStatus.value = (currentWorkflow.value as any)?.initialStatus || null
  } catch (error) {
    console.error('Error processing queue selection (delegated):', error)
    showToast('Ошибка загрузки данных очереди', 'error')
    resetWorkflowData()
  } finally {
    await nextTick()
    isUpdatingFromQueue = false
  }
})


// Watcher для изменения компании - очищаем сервис если он не принадлежит новой компании
watch(() => ticket.companyId, (newCompanyId, oldCompanyId) => {
  // Пропускаем начальную загрузку
  if (oldCompanyId === undefined)
    return

  // Если компания изменилась - проверяем что текущий сервис принадлежит новой компании
  if (newCompanyId && ticket.serviceId) {
    const currentService = services.value.find((s: any) => s && s.id === ticket.serviceId)
    if (currentService) {
      // Если у сервиса есть компании и новая компания не в списке - очищаем сервис
      if (currentService.customers && Array.isArray(currentService.customers) && currentService.customers.length > 0) {
        const belongsToCompany = currentService.customers.some((c: any) => c && typeof c === 'object' && c.id === newCompanyId)
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
    const service = services.value.find((s: any) => s && s.id === newServiceId)
    if (service && service.sla && typeof service.sla === 'object' && service.sla.id)
      ticket.slaId = service.sla.id
  }
})

// Watcher для изменения автора - автозаполнение компании
watch(() => ticket.ownerId, (newOwnerId, oldOwnerId) => {
  // Пропускаем начальную загрузку
  if (oldOwnerId === undefined)
    return

  // Если выбран сотрудник (число), находим его customerId
  if (typeof newOwnerId === 'number') {
    const selectedUser = customerUsers.value.find((u: any) => u && u.id === newOwnerId)
    if (selectedUser && selectedUser.customerId && !ticket.companyId)
      ticket.companyId = selectedUser.customerId
  }
})

// Вложения
const attachments = ref<File[]>([])
const uploadingFiles = ref(false)

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files)
    attachments.value = [...attachments.value, ...Array.from(target.files)]
}

const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0)
    return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

// Агенты для выбора
const agentOptions = computed(() => {
  return agents.value.filter(a => a).map((a: any) => ({
    title: `${a.firstName || ''} ${a.lastName || ''} (${a.email || a.login})`.trim(),
    value: a.id,
  }))
})

// Use useAuthorSearch composable for author selection
const {
  authorSearch,
  showCreateNewAuthor,
  newAuthorData,
  filteredAuthorOptions,
  canCreateCustomerUserByEmail,
  handleAuthorUpdate,
  handleAuthorClear,
  createNewAuthor,
} = useAuthorSearch(
  customerUsers, 
  systemConfigs, 
  computed(() => ticket.companyId),
  computed(() => ticket.queueId)   // передаём для отправки писем с почтового ящика очереди
)

// Модальное окно создания сотрудника
const showCreateAuthorDialog = ref(false)

// Проверка - является ли введенный текст email
const isEmail = (text: string) => {
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

  return emailRegex.test(text)
}

// Use showCreateNewAuthor from composable for no-data
const showCreateIconInNoData = showCreateNewAuthor

// Обработка выбора автора (включая кастомный email)
const handleAuthorSelect = (value: any) => {
  if (typeof value === 'string' && isEmail(value)) {
    if (canCreateCustomerUserByEmail.value) {
      newAuthorData.value.email = value.trim()
      showCreateAuthorDialog.value = true
      ticket.ownerId = null
    }
    else {
      ticket.ownerId = null
      authorSearch.value = ''
      showToast('Создание сотрудника по email отключено в настройках', 'error')
    }
  }
}

// Группы агентов для выбора
const agentGroupOptions = computed(() => {
  return agentGroups.value.filter(g => g).map((g: any) => ({
    title: g.name,
    value: g.id,
  }))
})

// Группы наблюдателей для выбора (отдельный computed для избежания конфликтов)
const observerGroupOptions = computed(() => {
  return agentGroups.value.filter((g: any) => g).map((g: any) => ({
    title: g.name,
    value: g.id,
  }))
})

// Текущий пользователь
const userData = useCookie<any>('userData')

// Назначить на себя
const assignToMe = () => {
  // Находим агента по логину пользователя
  const currentAgent = agents.value.find((a: any) => a && a.login === userData.value?.login)
  if (currentAgent) {
    // Добавляем себя как исполнителя
    if (!ticket.executorAgentIds.includes(currentAgent.id))
      ticket.executorAgentIds = [...ticket.executorAgentIds, currentAgent.id]

    // Добавляем группы, в которые входит пользователь
    if (currentAgent.groups && Array.isArray(currentAgent.groups) && currentAgent.groups.length > 0) {
      const groupIds = currentAgent.groups.filter((g: any) => g).map((g: any) => g.id).filter((id: number) => !ticket.executorGroupIds.includes(id))

      ticket.executorGroupIds = [...ticket.executorGroupIds, ...groupIds]
    }
    showToast('Вы назначены исполнителем')
  }
  else {
    showToast('Вы не являетесь агентом', 'error')
  }
}

// Вычисляемый список статусов для выбора
// Всегда включаем текущий статус (важно при автозаполнении из очереди)
const statusOptions = computed(() => {
  const currentStateId = ticket.stateId
  let list: any[] = []

  if (availableStatuses.value.length > 0) {
    list = availableStatuses.value.map(s => ({
      title: s.name,
      value: s.id,
      color: s.color,
    }))
  } else {
    list = states.value.map((s: any) => ({
      title: s.name,
      value: s.id,
      color: s.color,
    }))
  }

  // Если текущий статус не в списке — добавляем его
  if (currentStateId && !list.some((s: any) => s.value === currentStateId)) {
    const currentState = states.value.find((s: any) => s.id === currentStateId)
    if (currentState) {
      list = [{
        title: currentState.name,
        value: currentState.id,
        color: currentState.color,
      }, ...list]
    }
  }

  return list
})

// Вычисляемый выбранный SLA для отображения дедлайнов
const selectedSla = computed(() => {
  if (!ticket.slaId)
    return null

  return slaList.value.find(s => s.id === ticket.slaId)
})

// Вычисляемые сервисы - фильтруются по компании если она выбрана
const filteredServices = computed(() => {
  // Если компания не выбрана - показываем все сервисы
  if (!ticket.companyId)
    return services.value

  // Фильтруем сервисы по компании
  return services.value.filter((s: any) => {
    // Сервис без компаний - показываем (глобальный)
    if (!s.customers || !Array.isArray(s.customers) || s.customers.length === 0)
      return true

    // Проверяем есть ли компания в списке компаний сервиса
    return s.customers.some((c: any) => c && typeof c === 'object' && c.id === ticket.companyId)
  })
})

  // Вычисляемые категории - фильтруются по выбранному типу
  // Всегда включаем текущую выбранную категорию (важно при автозаполнении из очереди)
  const filteredCategories = computed(() => {
    const currentCatId = ticket.categoryId
    let list: any[] = []

    if (ticket.typeId) {
      const selectedType = types.value.find((t: any) => t.id === ticket.typeId)
      if (selectedType && selectedType.categoryIds && selectedType.categoryIds.length > 0) {
        list = categories.value.filter((c: any) => selectedType.categoryIds.includes(c.id))
      }
    } else {
      list = [...categories.value]
    }

    // Если текущая категория не в списке — добавляем её (для отображения при pre-fill из очереди)
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

// Вычисляемые типы - фильтруются по workflow выбранной очереди
const availableTypes = computed(() => {
  // Если очередь не выбрана - показываем все типы
  if (!ticket.queueId) {
    return types.value
  }

  const queue = getQueueById(ticket.queueId)
  if (!queue?.workflowId) {
    return types.value
  }

  let filtered = types.value.filter((t: any) => t.workflowId === queue.workflowId)

  // ВАЖНО: всегда оставляем текущий выбранный тип в списке,
  // даже если он не прошёл фильтр по workflow (иначе VSelect показывает сырой ID вместо названия)
  if (ticket.typeId != null) {
    const currentSelected = types.value.find((t: any) => t.id === ticket.typeId)
    if (currentSelected && !filtered.some((t: any) => t.id === ticket.typeId)) {
      filtered = [currentSelected, ...filtered]
    }
  }

  return filtered
})

// Форматирование времени SLA (в часах для responseTime, в минутах для solutionTime)
const formatSlaTime = (value: number | null | undefined, isHours: boolean = false) => {
  if (!value)
    return '-'
  if (isHours) {
    // Для responseTime - это часы
    if (value < 1)
      return `${Math.round(value * 60)} мин`
    if (value < 24)
      return `${value}ч`
    const days = Math.floor(value / 24)
    const hours = Math.round(value % 24)

    return hours > 0 ? `${days}д ${hours}ч` : `${days}д`
  }
  else {
    // Для solutionTime - это минуты
    if (value < 60)
      return `${value} мин`
    const hours = Math.floor(value / 60)
    const mins = value % 60
    if (hours < 24)
      return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24

    return remainingHours > 0 ? `${days}д ${remainingHours}ч` : `${days}д`
  }
}

// Расчёт дедлайнов (responseTime - часы, solutionTime - минуты)
const responseDeadline = computed(() => {
  if (!selectedSla.value?.responseTime)
    return null
  const date = new Date()

  // responseTime в часах, поэтому умножаем на 60*60*1000
  date.setTime(date.getTime() + selectedSla.value.responseTime * 60 * 60 * 1000)

  return date
})

const resolutionDeadline = computed(() => {
  if (!selectedSla.value?.solutionTime)
    return null
  const date = new Date()

  // solutionTime в минутах
  date.setMinutes(date.getMinutes() + selectedSla.value.solutionTime)

  return date
})

const formatDeadline = (date: Date | null) => {
  if (!date)
    return '-'

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Уведомления
const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

// Обновление справочных данных
const refreshData = async () => {
  try {
    await refreshReferenceData()
    showToast('Справочные данные обновлены', 'success')
  }
  catch (error) {
    showToast('Ошибка обновления данных', 'error')
  }
}

// Сохранение — полностью делегировано на централизованный composableSave (большой рефакторинг)
// Локальный performSave удалён как дублирование
const save = async () => {
  if (!ticket.title?.trim()) {
    showToast('Заголовок обязателен для заполнения', 'error')
    return
  }

  if (!ticket.queueId) {
    showToast('Очередь обязательна для заполнения', 'error')
    return
  }

  if (!ticket.ownerId) {
    showToast('Автор обязателен для заполнения', 'error')
    return
  }

  if (ticket.ownerId === '')
    ticket.ownerId = null

  try {
    // Используем composableSaving вместо локального
    // Вызываем без редиректа, чтобы сначала загрузить вложения
    await composableSave(false)

    // Загрузка вложений после успешного создания (специфика add.vue)
    const newTicketId = ticket.id   // composable обновляет ticket.id после создания
    if (attachments.value.length > 0 && newTicketId) {
      await uploadAttachments(newTicketId)
    }

    showToast('Обращение успешно создано')
    router.push('/apps/tickets')
  }
  catch (err) {
    console.error('Error saving ticket (delegated):', err)
    showToast('Ошибка создания обращения', 'error')
  }
}

// Создание сотрудника из модального окна
const createAuthorFromDialog = async () => {
  if (!newAuthorData.value.email || !isEmail(newAuthorData.value.email)) {
    showToast('Введите корректный email', 'error')

    return
  }

  try {
    saving.value = true

    const newUser = await createNewAuthor()

    await loadReferenceData(true)

    ticket.ownerId = (newUser as any).id   // всегда примитив ID
    newAuthorData.value.email = ''
    authorSearch.value = ''
    showCreateAuthorDialog.value = false

    showToast('Сотрудник создан', 'success')

    // Теперь используем делегированный save (большой рефакторинг)
    await save()
  }
  catch (err: any) {
    console.error('Error creating customer user:', err)
    showToast(err.data?.message || 'Ошибка создания сотрудника', 'error')
    saving.value = false
  }
}

// Создание сотрудника напрямую из no-data
const createNewUserFromNoData = async () => {
  console.log(`createNewUserFromNoData called, search="${authorSearch.value}"`)
  if (!authorSearch.value || !isEmail(authorSearch.value)) {
    showToast('Введите корректный email', 'error')

    return
  }

  // Ensure newAuthorData has the email
  newAuthorData.value.email = authorSearch.value

  try {
    saving.value = true
    console.log('Creating new user with email:', authorSearch.value, 'name:', newAuthorData.value.firstName, newAuthorData.value.lastName)

    const newUser = await createNewAuthor()

    console.log('New user created:', newUser)
    console.log('Fetching updated customerUsers...')
    await loadReferenceData(true)
    console.log('customerUsers after fetch:', customerUsers.value.length, 'items')

    const createdUserId = (newUser as any).id

    ticket.ownerId = createdUserId   // всегда примитив ID
    console.log('ticket.ownerId set to:', ticket.ownerId)

    // authorSearch is already cleared by createNewAuthor
    console.log('authorSearch cleared, VAutocomplete should show selected item')

    showToast('Сотрудник создан', 'success')
    saving.value = false
  }
  catch (err: any) {
    console.error('Error creating customer user:', err)
    showToast(err.data?.message || 'Ошибка создания сотрудника', 'error')
    saving.value = false
  }
}

// Отмена создания сотрудника
const cancelCreateAuthor = () => {
  showCreateAuthorDialog.value = false
  newAuthorData.value.email = ''
  authorSearch.value = ''
  ticket.ownerId = null
  saving.value = false
}

// Загрузка вложений
const uploadAttachments = async (ticketId: number) => {
  try {
    uploadingFiles.value = true

    for (const file of attachments.value) {
      const formData = new FormData()

      formData.append('file', file)
      formData.append('ticketId', ticketId.toString())

      await $api('/ticketAttachments', {
        method: 'POST',
        body: formData,
      })
    }
  }
  catch (err) {
    console.error('Error uploading attachments:', err)
    showToast('Ошибка загрузки вложений', 'error')
  }
  finally {
    uploadingFiles.value = false
  }
}

// Отмена
const cancel = () => {
  router.push('/apps/tickets')
}

// Инициализация
onMounted(async () => {
  console.log('Add.vue mounted - initializing')
  await loadReferenceData()
  console.log('Add.vue initialization complete')
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex flex-wrap justify-start justify-sm-space-between gap-y-4 gap-x-6 mb-6">
      <div class="d-flex flex-column justify-center">
        <h4 class="text-h4 mb-1">
          Создание обращения
        </h4>
        <div class="text-body-1">
          Заполните информацию для создания нового обращения
        </div>
      </div>

      <div class="d-flex gap-4 align-center flex-wrap">
        <VBtn
          variant="tonal"
          color="secondary"
          @click="cancel"
        >
          Отмена
        </VBtn>
        <VBtn
          variant="outlined"
          color="primary"
          :loading="refLoading"
          @click="refreshData"
        >
          <VIcon
            icon="bx-refresh"
            class="me-2"
          />
          Обновить данные
        </VBtn>
        <VBtn
          :loading="composableSaving"
          @click="save"
        >
          Создать обращение
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
          <VCardText>
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="ticket.title"
                  :error="!ticket.title?.trim()"
                  label="Заголовок"
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
            <!-- Drop Zone -->
            <div class="drop-zone pa-8 text-center mb-4">
              <VIcon
                icon="bx-cloud-upload"
                size="48"
                color="primary"
                class="mb-2"
              />
              <p class="text-body-1 mb-2">
                Перетащите файлы сюда или
              </p>
              <VBtn
                variant="tonal"
                color="primary"
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

            <!-- Список выбранных файлов -->
            <VList
              v-if="attachments.length > 0"
              class="border rounded"
            >
              <VListItem
                v-for="(file, index) in attachments"
                :key="index"
                class="py-3"
              >
                <template #prepend>
                  <VIcon
                    icon="bx-file"
                    class="me-3"
                  />
                </template>

                <VListItemTitle>{{ file.name }}</VListItemTitle>
                <VListItemSubtitle>{{ formatFileSize(file.size) }}</VListItemSubtitle>

                <template #append>
                  <VBtn
                    icon
                    variant="text"
                    color="error"
                    size="small"
                    @click="removeAttachment(index)"
                  >
                    <VIcon icon="bx-x" />
                  </VBtn>
                </template>
              </VListItem>
            </VList>
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
               <AppSelect
                 v-model="ticket.typeId"
                 :items="availableTypes"
                 :disabled="availableTypes.length === 1"
                 item-title="name"
                 item-value="id"
                 label="Тип"
                 placeholder="Выберите тип"
                 clearable
                 density="comfortable"
               />


              <!-- Категория - зависит от типа -->
               <AppSelect
                 v-model="ticket.categoryId"
                 :items="filteredCategories"
                 item-title="name"
                 item-value="id"
                 label="Категория"
                 :placeholder="hasCategoriesForType ? 'Выберите категорию' : 'Нет категорий для типа'"
                 :disabled="!ticket.typeId || !hasCategoriesForType"
                 clearable
                 density="comfortable"
               >
                 <template #selection="{ item }">
                   <span>{{ item?.title || item?.raw?.name || item?.name || item || '—' }}</span>
                 </template>
                <template #append-inner>
                  <span
                    v-if="!ticket.typeId"
                    class="text-caption text-medium-emphasis"
                  >(выберите тип)</span>
                  <span
                    v-else-if="!hasCategoriesForType"
                    class="text-caption text-error"
                  >(нет категорий)</span>
                </template>
              </AppSelect>

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
                density="comfortable"
              />

              <AppSelect
                v-model="ticket.queueId"
                :items="queues"
                item-title="name"
                item-value="id"
                :error="!ticket.queueId"
                label="Очередь"
                placeholder="Выберите очередь"
                clearable
                density="comfortable"
              />

              <!-- Статус - ограничен доступными из workflow или все если тип не выбран -->
              <AppSelect
                v-model="ticket.stateId"
                :items="statusOptions"
                item-title="title"
                item-value="value"
                label="Статус"
                :placeholder="availableStatuses.length > 0 ? 'Выберите статус из доступных' : 'Выберите статус'"
                clearable
                density="comfortable"
              >
                <template #selection="{ item }">
                  <VChip
                    v-if="item?.raw?.color || item?.color"
                    :color="item.raw?.color || item.color"
                    density="compact"
                    label
                    size="small"
                  >
                    {{ item?.title || item?.raw?.title || item?.name || item }}
                  </VChip>
                  <span v-else>{{ item?.title || item?.raw?.title || item?.name || item || '—' }}</span>
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
                v-model:search="authorSearch"
                :items="filteredAuthorOptions"
                item-title="title"
                item-value="value"
                :error="!ticket.ownerId"
                label="Автор"
                placeholder="Введите имя или email для поиска..."
                clearable
                allow-custom
                :menu-props="{ location: 'top' }"
                variant="outlined"
                density="comfortable"
                @update:model-value="handleAuthorSelect"
                @update:search="handleAuthorUpdate"
                @click:clear="handleAuthorClear"
              >
                <template #selection="{ item }">
                  <VChip
                    density="compact"
                    label
                    size="small"
                  >
                    {{ item?.raw?.title || item?.title || (typeof item === 'object' ? (item.name || item.login || item.value) : item) || '—' }}
                  </VChip>
                </template>
                <template #no-data>
                  <div>
                    <div
                      v-if="showCreateIconInNoData"
                      class="px-4 py-2 cursor-pointer"
                      @click="createNewUserFromNoData"
                    >
                      <VIcon
                        icon="bx-magic"
                        class="me-2"
                      />
                      Создать сотрудника "{{ newAuthorData.firstName }} {{ newAuthorData.lastName }}"
                    </div>
                    <div
                      v-else
                      class="px-4 py-2"
                    >
                      Нет данных
                    </div>
                  </div>
                </template>
              </VAutocomplete>

              <!-- Группы исполнителей -->
              <AppSelect
                v-model="ticket.executorGroupIds"
                :items="agentGroupOptions"
                label="Группы исполнителей"
                placeholder="Выберите группы исполнителей"
                multiple
                chips
                clearable
                density="comfortable"
              />

              <!-- Исполнители -->
              <AppSelect
                v-model="ticket.executorAgentIds"
                :items="agentOptions"
                label="Исполнители"
                placeholder="Выберите исполнителей"
                multiple
                chips
                clearable
                density="comfortable"
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
                :items="observerGroupOptions"
                label="Группы наблюдателей"
                placeholder="Выберите группы наблюдателей"
                multiple
                chips
                clearable
                clear-icon="bx-x"
              />

              <!-- Наблюдатели -->
              <AppSelect
                v-model="ticket.observerAgentIds"
                :items="agentOptions"
                label="Наблюдатели"
                placeholder="Выберите наблюдателей"
                multiple
                chips
                clearable
                density="comfortable"
              />

              <AppSelect
                v-model="ticket.companyId"
                :items="customers"
                item-title="name"
                item-value="id"
                label="Компания"
                placeholder="Выберите компанию"
                clearable
                density="comfortable"
              />

              <AppSelect
                v-model="ticket.serviceId"
                :items="filteredServices"
                item-title="name"
                item-value="id"
                label="Сервис"
                placeholder="Выберите сервис"
                clearable
                density="comfortable"
              />

              <AppSelect
                v-model="ticket.slaId"
                :items="slaList"
                item-title="name"
                item-value="id"
                label="SLA"
                placeholder="Выберите SLA"
                clearable
                density="comfortable"
              />

              <!-- Информация о SLA дедлайнах -->
              <VAlert
                v-if="selectedSla"
                type="info"
                variant="tonal"
                density="compact"
                class="mt-2"
              >
                <div class="text-body-2">
                  <div v-if="selectedSla.responseTime">
                    <strong>Время первого ответа:</strong> {{ formatSlaTime(selectedSla.responseTime, true) }}
                    (до {{ formatDeadline(responseDeadline) }})
                  </div>
                  <div v-if="selectedSla.solutionTime">
                    <strong>Время решения:</strong> {{ formatSlaTime(selectedSla.solutionTime, false) }}
                    (до {{ formatDeadline(resolutionDeadline) }})
                  </div>
                </div>
              </VAlert>

              <VDivider class="my-2" />
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

    <!-- Модальное окно создания сотрудника -->
    <VDialog
      v-model="showCreateAuthorDialog"
      max-width="500px"
    >
      <VCard title="Создание нового сотрудника">
        <VCardText>
          <div class="text-body-1 mb-3">
            Сотрудника с email <strong>{{ newAuthorData.email || authorSearch }}</strong> не найдено. Создать нового сотрудника?
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
          <VBtn
            color="grey"
            variant="outlined"
            @click="cancelCreateAuthor"
          >
            Отмена
          </VBtn>
          <VBtn
            color="primary"
            variant="elevated"
            @click="createAuthorFromDialog"
          >
            Создать
          </VBtn>
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
</style>

<style lang="scss">
.ProseMirror {
  p {
    margin-block-end: 0;
  }

  padding: 0.5rem;
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
