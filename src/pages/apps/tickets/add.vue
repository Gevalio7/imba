<script setup lang="ts">
import { $api } from '@/utils/api'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useReferenceData } from '@/composables/useReferenceData'

definePage({
  meta: {
    navActiveLink: 'apps-tickets',
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

// Workflow данные
const currentWorkflow = ref<any>(null)
const availableStatuses = ref<any[]>([])
const initialStatus = ref<any>(null)
const loadingWorkflow = ref(false)

// Загрузка справочников - используется useReferenceData composable

// Получение очереди по ID
const getQueueById = (queueId: number) => {
  return queues.value.find(q => q.id === queueId)
}

// Загрузка workflow и доступных статусов по типу
const fetchTypeWorkflow = async (typeId: number) => {
  try {
    loadingWorkflow.value = true
    const data = await $api(`/types/${typeId}/workflow`)
    
    currentWorkflow.value = (data as any).workflow
    initialStatus.value = (data as any).initialStatus
    availableStatuses.value = (data as any).availableStatuses || []
    
    // Автоматически устанавливаем начальный статус если есть
    if (initialStatus.value) {
      ticket.value.stateId = initialStatus.value.id
    }
  }
  catch (err) {
    console.error('Error fetching type workflow:', err)
    currentWorkflow.value = null
    initialStatus.value = null
    availableStatuses.value = []
  }
  finally {
    loadingWorkflow.value = false
  }
}

// Форма
const saving = ref(false)
const description = ref('')

const ticket = ref({
  title: '',
  typeId: undefined as number | undefined,
  categoryId: undefined as number | undefined,
  priorityId: undefined as number | undefined,
  queueId: undefined as number | undefined,
  stateId: undefined as number | undefined,
  ownerId: undefined as number | string | null | undefined,
  executorAgentIds: [] as number[],
  executorGroupIds: [] as number[],
  companyId: undefined as number | undefined,
  serviceId: undefined as number | undefined,
  slaId: undefined as number | undefined,
})

// Watcher для изменения типа - автоподстановка категории
watch(() => ticket.value.typeId, async (newTypeId, oldTypeId) => {
  if (newTypeId) {
    await fetchTypeWorkflow(newTypeId)
    
    // Автоподстановка категории при выборе типа
    const selectedType = types.value.find((t: any) => t.id === newTypeId)
    if (selectedType && selectedType.categoryIds && selectedType.categoryIds.length > 0) {
      // Если у типа только одна категория - автоподставляем
      if (selectedType.categoryIds.length === 1) {
        ticket.value.categoryId = selectedType.categoryIds[0]
      }
      // Если у типа несколько категорий - не сбрасываем уже выбранную (если она в списке)
      else if (ticket.value.categoryId && !selectedType.categoryIds.includes(ticket.value.categoryId)) {
        ticket.value.categoryId = undefined
      }
    }
  }
  else {
    currentWorkflow.value = null
    initialStatus.value = null
    availableStatuses.value = []
    ticket.value.stateId = undefined
    ticket.value.categoryId = undefined
  }
})

// Watcher для изменения очереди - автозаполнение полей
watch(() => ticket.value.queueId, async (newQueueId, oldQueueId) => {
  // Пропускаем только если это не реальное изменение
  if (oldQueueId === undefined && newQueueId === undefined) {
    return
  }

  // Обрабатываем изменение, если newQueueId отличается от oldQueueId
  if (newQueueId !== oldQueueId && newQueueId) {
    const queue = getQueueById(newQueueId)
    if (queue) {
      // Автозаполняем поля из данных очереди
      if (queue.companyId) {
        ticket.value.companyId = queue.companyId
      }
      if (queue.serviceId) {
        ticket.value.serviceId = queue.serviceId
      }
      if (queue.slaId) {
        ticket.value.slaId = queue.slaId
      }
      if (queue.priorityId) {
        ticket.value.priorityId = queue.priorityId
      }

      // Автозаполняем исполнителя из группы очереди если не выбраны исполнители
      if (queue.agentGroupId && ticket.value.executorGroupIds.length === 0 && ticket.value.executorAgentIds.length === 0) {
        ticket.value.executorGroupIds = [queue.agentGroupId]
      }

      // Если у очереди есть workflow - ищем тип с этим workflow
      if (queue.workflowId) {
        try {
          const typesData = await $api('/types')
          const typesList = (typesData as any).types || []
          const typeWithWorkflow = typesList.find((t: any) => t.workflowId === queue.workflowId)
          if (typeWithWorkflow) {
            ticket.value.typeId = typeWithWorkflow.id
          }
        } catch (err) {
          console.error('Error finding type for workflow:', err)
        }
      }

      // Если у очереди есть category_id - автозаполняем категорию
      if (queue.categoryId) {
        ticket.value.categoryId = queue.categoryId
      }
    }
  }
})

// Watcher для изменения компании - очищаем сервис если он не принадлежит новой компании
watch(() => ticket.value.companyId, (newCompanyId, oldCompanyId) => {
  // Пропускаем начальную загрузку
  if (oldCompanyId === undefined) return
  
  // Если компания изменилась - проверяем что текущий сервис принадлежит новой компании
  if (newCompanyId && ticket.value.serviceId) {
    const currentService = services.value.find((s: any) => s.id === ticket.value.serviceId)
    if (currentService) {
      // Если у сервиса есть компании и новая компания не в списке - очищаем сервис
      if (currentService.customers && currentService.customers.length > 0) {
        const belongsToCompany = currentService.customers.some((c: any) => c.id === newCompanyId)
        if (!belongsToCompany) {
          // Сервис не принадлежит компании - очищаем выбор
          ticket.value.serviceId = undefined
        }
      }
    }
  }
})

// Watcher для изменения сервиса - автозаполнение SLA
watch(() => ticket.value.serviceId, (newServiceId, oldServiceId) => {
  // Пропускаем начальную загрузку
  if (oldServiceId === undefined) return
  
  // Если сервис выбран и SLA ещё не выбран - пробуем получить SLA из сервиса
  if (newServiceId && !ticket.value.slaId) {
    const service = services.value.find((s: any) => s.id === newServiceId)
    if (service && service.sla && service.sla.id) {
      ticket.value.slaId = service.sla.id
    }
  }
})

// Watcher для изменения автора - автозаполнение компании
watch(() => ticket.value.ownerId, (newOwnerId, oldOwnerId) => {
  // Пропускаем начальную загрузку
  if (oldOwnerId === undefined) return

  // Если выбран сотрудник (число), находим его customerId
  if (typeof newOwnerId === 'number') {
    const selectedUser = customerUsers.value.find((u: any) => u.id === newOwnerId)
    if (selectedUser?.customerId && !ticket.value.companyId) {
      ticket.value.companyId = selectedUser.customerId
    }
  }
})

// Вложения
const attachments = ref<File[]>([])
const uploadingFiles = ref(false)

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    attachments.value = [...attachments.value, ...Array.from(target.files)]
  }
}

const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Агенты для выбора
const agentOptions = computed(() => {
  return agents.value.map((a: any) => ({
    title: `${a.firstName || ''} ${a.lastName || ''} (${a.email || a.login})`.trim(),
    value: a.id,
  }))
})

// Авторы (сотрудники) для выбора
const authorOptions = computed(() => {
  console.log('authorOptions computed, customerUsers.length:', customerUsers.value.length)
  const options = customerUsers.value.map((c: any) => {
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
  console.log('authorOptions returning:', options.length, 'options')
  return options
})

// Отображаемое значение поиска для поля автора (не очищается Vuetify)
const authorSearchDisplay = ref('')

// Watcher для отслеживания изменений поиска
watch(() => authorSearchDisplay.value, (newVal, oldVal) => {
  console.log('authorSearchDisplay changed from "' + oldVal + '" to "' + newVal + '"')
})



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
  const isEnabled = config?.value === true || config?.value === 'true'
  const isActive = config?.isActive !== false
  console.log('Config:', config, 'isEnabled:', isEnabled, 'isActive:', isActive)
  return isEnabled && isActive
})

// Фильтрованный список авторов по поиску
const filteredAuthorOptions = computed(() => {
  if (!authorSearchDisplay.value.trim()) {
    return authorOptions.value
  }
  const search = authorSearchDisplay.value.toLowerCase()
  const matches = authorOptions.value.filter((a: any) => {
    return a.title.toLowerCase().includes(search)
  })

  console.log('filteredAuthorOptions: search="' + search + '", matches:', matches.length)
  return matches
})

// Проверка - является ли введенный текст email
const isEmail = (text: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(text)
}

// Вычисляемый - показывать ли иконку создания в no-data
const showCreateIconInNoData = computed(() => {
  const shouldShow = authorSearchDisplay.value && isEmail(authorSearchDisplay.value) && !filteredAuthorOptions.value.length && canCreateCustomerUserByEmail.value
  console.log('showCreateIconInNoData: search="' + authorSearchDisplay.value + '", isEmail=' + isEmail(authorSearchDisplay.value) + ', filteredLength=' + filteredAuthorOptions.value.length + ', canCreate=' + canCreateCustomerUserByEmail.value + ', shouldShow=' + shouldShow)
  return shouldShow
})

// Обработка выбора автора (включая кастомный email)
const handleAuthorSelect = (value: any) => {
  if (typeof value === 'string' && isEmail(value)) {
    if (canCreateCustomerUserByEmail.value) {
      newAuthorData.value.email = value.trim()
      showCreateAuthorDialog.value = true
      ticket.value.ownerId = null
    } else {
      ticket.value.ownerId = null
      authorSearchDisplay.value = ''
      showToast('Создание сотрудника по email отключено в настройках', 'error')
    }
  }
}

// Очистка выбора автора
const handleAuthorClear = () => {
  newAuthorData.value.email = ''
  authorSearchDisplay.value = ''
  ticket.value.ownerId = null
}

// Обработка ввода в поле автора
const handleAuthorUpdate = async (search: string) => {
  console.log('handleAuthorUpdate called with search:', search, 'length:', search?.length)
  if (!search?.trim()) return

  if (isEmail(search.trim())) {
    console.log('Email detected in handleAuthorUpdate')
    const existingUser = customerUsers.value.find(
      (u: any) => u.email?.toLowerCase() === search.trim().toLowerCase()
    )
    console.log('existingUser in handleAuthorUpdate:', existingUser)

    if (!existingUser && canCreateCustomerUserByEmail.value) {
      console.log('Setting new user data for email:', search.trim())
      newAuthorData.value.email = search.trim()
    }
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
    if (!ticket.value.executorAgentIds.includes(currentAgent.id)) {
      ticket.value.executorAgentIds = [...ticket.value.executorAgentIds, currentAgent.id]
    }
    // Добавляем группы, в которые входит пользователь
    if (currentAgent.groups && currentAgent.groups.length > 0) {
      const groupIds = currentAgent.groups.map((g: any) => g.id).filter((id: number) => !ticket.value.executorGroupIds.includes(id))
      ticket.value.executorGroupIds = [...ticket.value.executorGroupIds, ...groupIds]
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
    return availableStatuses.value.map(s => ({
      title: s.name,
      value: s.id,
      color: s.color,
    }))
  }
  
  // Если нет workflow - возвращаем все статусы
  return states.value.map((s: any) => ({
    title: s.name,
    value: s.id,
    color: s.color,
  }))
})

// Вычисляемый выбранный SLA для отображения дедлайнов
const selectedSla = computed(() => {
  if (!ticket.value.slaId) return null
  return slaList.value.find(s => s.id === ticket.value.slaId)
})

// Вычисляемые сервисы - фильтруются по компании если она выбрана
const filteredServices = computed(() => {
  // Если компания не выбрана - показываем все сервисы
  if (!ticket.value.companyId) {
    return services.value
  }
  // Фильтруем сервисы по компании
  return services.value.filter((s: any) => {
    // Сервис без компаний - показываем (глобальный)
    if (!s.customers || s.customers.length === 0) {
      return true
    }
    // Проверяем есть ли компания в списке компаний сервиса
    return s.customers.some((c: any) => c.id === ticket.value.companyId)
  })
})

// Вычисляемые категории - фильтруются по выбранному типу
const filteredCategories = computed(() => {
  // Если тип не выбран - показываем пустой массив (категория скрыта)
  if (!ticket.value.typeId) {
    return []
  }
  // Находим тип и его categoryIds
  const selectedType = types.value.find((t: any) => t.id === ticket.value.typeId)
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
  if (!ticket.value.typeId) return false
  const selectedType = types.value.find((t: any) => t.id === ticket.value.typeId)
  return selectedType && selectedType.categoryIds && selectedType.categoryIds.length > 0
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

// Расчёт дедлайнов (responseTime - часы, solutionTime - минуты)
const responseDeadline = computed(() => {
  if (!selectedSla.value?.responseTime) return null
  const date = new Date()
  // responseTime в часах, поэтому умножаем на 60*60*1000
  date.setTime(date.getTime() + selectedSla.value.responseTime * 60 * 60 * 1000)
  return date
})

const resolutionDeadline = computed(() => {
  if (!selectedSla.value?.solutionTime) return null
  const date = new Date()
  // solutionTime в минутах
  date.setMinutes(date.getMinutes() + selectedSla.value.solutionTime)
  return date
})

const formatDeadline = (date: Date | null) => {
  if (!date) return '-'
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
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
  } catch (error) {
    showToast('Ошибка обновления данных', 'error')
  }
}

// Функция выполнения сохранения
const performSave = async () => {
  try {
    // Подготавливаем данные для отправки
    const ticketData = {
      ...ticket.value,
      // ownerId теперь всегда number или null (строки обрабатываются в save)
      ownerId: typeof ticket.value.ownerId === 'number' ? ticket.value.ownerId : null,
      description: description.value,
    }

    // Находим текущего агента для истории изменений
    const currentAgent = agents.value.find((a: any) => a.login === userData.value?.login)

    const result = await $api('/tickets', {
      method: 'POST',
      body: {
        ...ticketData,
        changedBy: currentAgent?.id,
      },
    })

    const newTicketId = (result as any).id || (result as any).ticket?.id

    // Загружаем вложения если есть
    if (attachments.value.length > 0 && newTicketId) {
      await uploadAttachments(newTicketId)
    }

    showToast('Обращение успешно создан')
    router.push('/apps/tickets')
  }
  catch (err) {
    console.error('Error saving ticket:', err)
    showToast('Ошибка создания обращения', 'error')
    saving.value = false
  }
}

// Сохранение
const save = async () => {
  if (!ticket.value.title?.trim()) {
    showToast('Заголовок обязателен для заполнения', 'error')
    return
  }

  if (ticket.value.ownerId === '') {
    ticket.value.ownerId = null
  }

  try {
    saving.value = true
    await performSave()
  }
  catch (err) {
    console.error('Error saving ticket:', err)
    showToast('Ошибка создания обращения', 'error')
    saving.value = false
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

    const newUser = await $api('/customerUsers', {
      method: 'POST',
      body: {
        email: newAuthorData.value.email,
        firstName: newAuthorData.value.firstName,
        lastName: newAuthorData.value.lastName,
        login: newAuthorData.value.email,
        customerId: ticket.value.companyId || null,
      },
    })

    await loadReferenceData(true)

    ticket.value.ownerId = (newUser as any).id
    newAuthorData.value.email = ''
    authorSearchDisplay.value = ''
    showCreateAuthorDialog.value = false

    showToast('Сотрудник создан', 'success')

    await performSave()
  } catch (err: any) {
    console.error('Error creating customer user:', err)
    showToast(err.data?.message || 'Ошибка создания сотрудника', 'error')
    saving.value = false
  }
}

// Создание сотрудника напрямую из no-data
const createNewUserFromNoData = async () => {
  console.log('createNewUserFromNoData called, search="' + authorSearchDisplay.value + '"')
  if (!authorSearchDisplay.value || !isEmail(authorSearchDisplay.value)) {
    showToast('Введите корректный email', 'error')
    return
  }

  try {
    saving.value = true
    console.log('Creating new user with email:', authorSearchDisplay.value, 'name:', newAuthorData.value.firstName, newAuthorData.value.lastName)

    const newUser = await $api('/customerUsers', {
      method: 'POST',
      body: {
        email: authorSearchDisplay.value,
        firstName: newAuthorData.value.firstName,
        lastName: newAuthorData.value.lastName,
        login: authorSearchDisplay.value,
        customerId: ticket.value.companyId || null,
      },
    })

    console.log('New user created:', newUser)
    console.log('Fetching updated customerUsers...')
    await loadReferenceData(true)
    console.log('customerUsers after fetch:', customerUsers.value.length, 'items')

    const createdUserId = (newUser as any).id
    ticket.value.ownerId = createdUserId
    console.log('ticket.ownerId set to:', ticket.value.ownerId)

    authorSearchDisplay.value = ''
    console.log('authorSearchDisplay cleared, VAutocomplete should show selected item')

    showToast('Сотрудник создан', 'success')
    saving.value = false
  } catch (err: any) {
    console.error('Error creating customer user:', err)
    showToast(err.data?.message || 'Ошибка создания сотрудника', 'error')
    saving.value = false
  }
}

// Отмена создания сотрудника
const cancelCreateAuthor = () => {
  showCreateAuthorDialog.value = false
  newAuthorData.value.email = ''
  authorSearchDisplay.value = ''
  ticket.value.ownerId = null
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
           @click="refreshData"
           :loading="refLoading"
         >
           <VIcon icon="bx-refresh" class="me-2" />
           Обновить данные
         </VBtn>
         <VBtn
           :loading="saving"
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
                :items="types"
                item-title="name"
                item-value="id"
                label="Тип"
                placeholder="Выберите тип"
                clearable
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
              >
                <template #append-inner>
                  <span v-if="!ticket.typeId" class="text-caption text-medium-emphasis">(выберите тип)</span>
                  <span v-else-if="!hasCategoriesForType" class="text-caption text-error">(нет категорий)</span>
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
                item-title="title"
                item-value="value"
                label="Автор"
                placeholder="Введите имя или email для поиска..."
                v-model:search="authorSearchDisplay"
                clearable
                allow-custom
                @update:model-value="handleAuthorSelect"
                @update:search="handleAuthorUpdate"
                @click:clear="handleAuthorClear"
              >
                <template #no-data>
                  <div>
                    <div v-if="showCreateIconInNoData" class="px-4 py-2 cursor-pointer" @click="createNewUserFromNoData">
                      <VIcon icon="bx-magic" class="me-2" />
                      Создать сотрудника "{{ newAuthorData.firstName }} {{ newAuthorData.lastName }}"
                    </div>
                    <div v-else class="px-4 py-2">
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
    <VDialog v-model="showCreateAuthorDialog" max-width="500px">
      <VCard title="Создание нового сотрудника">
        <VCardText>
          <div class="text-body-1 mb-3">
            Сотрудника с email <strong>{{ newAuthorData.email || authorSearchDisplay }}</strong> не найдено. Создать нового сотрудника?
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
