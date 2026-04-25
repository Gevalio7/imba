<script setup lang="ts">
import { $api } from '@/utils/api'
import { onMounted, ref, computed, watch, nextTick } from 'vue'

interface Queue {
  id: number
  name: string
  description: string
  companyId: number | null
  serviceId: number | null
  slaId: number | null
  workflowId: number | null

  priorityId: number | null
  keywords: string
  quickAnswerArticleIds: number[] | null
  executorGroupIds: number[] | null
  executorAgentIds: number[] | null
  observerAgentIds: number[] | null
  approverGroupIds: number[] | null
  approverAgentIds: number[] | null
  departmentId: number | null
  typeId: number | null
  categoryId: number | null
  postMasterMailAccountId: number | null

  isActive: boolean
  createdAt: string
  updatedAt: string
  templateOpenTicketId: number | null
  templateCloseTicketId: number | null
  templateConfirmTicketId: number | null
  templateStatusChangeId: number | null
  templateCommentTicketId: number | null
  templateId: number | null
}

interface ReferenceData {
  services: { id: number; name: string }[]
  sla: { id: number; name: string }[]
  workflows: { id: number; name: string }[]
  agentGroups: { id: number; name: string }[]
  priorities: { id: number; name: string }[]
  customers: { id: number; name: string }[]
  customersGroups: { id: number; name: string; customerId: number }[]
  agents: { id: number; firstName: string; lastName: string }[]
  types: { id: number; name: string }[]
  typeCategories: { id: number; name: string }[]
  postMasterMailAccounts: { id: number; name: string }[]
  templates: { id: number; name: string }[]
  systemConfiguration: any[]
}

interface Article {
  id: number
  title: string
  content: string
  categoryId: number | null
  categoryName: string | null
  serviceId: number | null
  serviceName: string | null
  isPublished: boolean
}

const API_BASE = import.meta.env.VITE_API_BASE_URL
const route = useRoute()
const router = useRouter()

const isEdit = computed(() => {
  const id = Array.isArray((route.params as any).id) ? (route.params as any).id[0] : (route.params as any).id
  return typeof id === 'string' && id && !isNaN(Number(id))
})
const queueId = computed(() => {
  const id = Array.isArray((route.params as any).id) ? (route.params as any).id[0] : (route.params as any).id
  if (isEdit.value && typeof id === 'string') return Number(id)
  return null
})

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const activeTab = ref('basic')
const referenceData = ref<ReferenceData>({
  services: [],
  sla: [],
  workflows: [],
  agentGroups: [],
  priorities: [],
  customers: [],
  customersGroups: [],
  agents: [],
  types: [],
  typeCategories: [],
  postMasterMailAccounts: [],
  templates: [],
  systemConfiguration: []
})

const queue = ref<Queue>({
  id: 0,
  name: '',
  description: '',
  companyId: null,
  serviceId: null,
  slaId: null,
  workflowId: null,
  priorityId: null,
  keywords: '',
  quickAnswerArticleIds: null,
  executorGroupIds: null,
  executorAgentIds: null,
  observerAgentIds: null,
  approverGroupIds: null,
  approverAgentIds: null,
  departmentId: null,
  typeId: null,
  categoryId: null,
  postMasterMailAccountId: null,
  templateOpenTicketId: null,
  templateCloseTicketId: null,
  templateConfirmTicketId: null,
  templateStatusChangeId: null,
  templateCommentTicketId: null,
  templateId: null,
  isActive: true,
  createdAt: '',
  updatedAt: ''
})

const serviceOptions = computed(() => 
  referenceData.value.services.map(s => ({ title: s.name, value: s.id }))
)

const slaOptions = computed(() => 
  referenceData.value.sla.map(s => ({ title: s.name, value: s.id }))
)

const workflowOptions = computed(() => 
  referenceData.value.workflows.map(w => ({ title: w.name, value: w.id }))
)

const agentGroupOptions = computed(() => 
  referenceData.value.agentGroups.map(g => ({ title: g.name, value: g.id }))
)

const priorityOptions = computed(() =>
  referenceData.value.priorities.map(p => ({ title: p.name, value: p.id }))
)

const companyOptions = computed(() =>
  referenceData.value.customers.map(c => ({ title: c.name, value: c.id }))
)

const departmentOptions = computed(() => {
  const filtered = referenceData.value.customersGroups
    .filter(d => !queue.value.companyId || d.customerId === queue.value.companyId)
  console.log('departmentOptions filtered ids:', filtered.map(d => d.id))
  console.log('all customersGroups ids:', referenceData.value.customersGroups.map(d => ({ id: d.id, customerId: d.customerId })))
  console.log('current departmentId:', queue.value.departmentId, 'companyId:', queue.value.companyId)
  const options = filtered.map(d => ({ title: d.name, value: d.id }))
  // If current departmentId is not in options, add it
  if (queue.value.departmentId && !options.find(o => o.value === queue.value.departmentId)) {
    const dept = referenceData.value.customersGroups.find(d => d.id === queue.value.departmentId)
    if (dept) {
      console.log('Adding missing department:', dept)
      options.push({ title: `${dept.name} (несоответствует компании)`, value: dept.id })
    }
  }
  console.log('final options ids:', options.map(o => o.value))
  return options
})

const agentOptions = computed(() =>
  referenceData.value.agents.map(a => ({ title: `${a.firstName} ${a.lastName}`, value: a.id }))
)

const typeOptions = computed(() =>
  referenceData.value.types.map(t => ({ title: t.name, value: t.id }))
)

const typeCategoryOptions = computed(() =>
  referenceData.value.typeCategories.map(c => ({ title: c.name, value: c.id }))
)

const postMasterMailAccountOptions = computed(() =>
  referenceData.value.postMasterMailAccounts.map(a => ({ title: a.name, value: a.id }))
)

const templateOptions = computed(() =>
  referenceData.value.templates.map(t => ({ title: t.name, value: t.id }))
)

const allowMultipleExecutorGroups = computed(() => {
  const config = referenceData.value.systemConfiguration.find(c => c.name === 'allow_multiple_executor_groups')
  const value = config ? config.value === 'true' || config.value === true : false
  console.log('allowMultipleExecutorGroups:', value, 'config:', config)
  return value
})

const allowMultipleExecutors = computed(() => {
  const config = referenceData.value.systemConfiguration.find(c => c.name === 'allow_multiple_executors')
  const value = config ? config.value === 'true' || config.value === true : false
  console.log('allowMultipleExecutors:', value, 'config:', config)
  return value
})

const agentAutoAssignAsExecutor = computed(() => {
  const config = referenceData.value.systemConfiguration.find(c => c.name === 'agent_auto_assign_as_executor')
  const value = config ? config.value === 'true' || config.value === true : false
  console.log('agentAutoAssignAsExecutor:', value, 'config:', config)
  return value
})

const keywordsArray = ref<string[]>([])

watch(() => queue.value.keywords, (newVal) => {
  keywordsArray.value = typeof newVal === 'string' && newVal ? newVal.split(',').map(k => k.trim()).filter(k => k) : []
}, { immediate: true })

watch(keywordsArray, (newVal) => {
  queue.value.keywords = newVal.join(', ')
}, { deep: true })

const categoriesList = ref<{ id: number; name: string }[]>([])
const servicesList = ref<{ id: number; name: string }[]>([])
const typesList = ref<{ id: number; name: string }[]>([])

const quickAnswerFilter = ref({
  categoryId: null as number | null,
  serviceId: null as number | null
})
const foundArticles = ref<Article[]>([])
const selectedArticleIds = ref<number[]>([])
const loadingArticles = ref(false)
const showQuickAnswersDialog = ref(false)

const categoryOptions = computed(() => 
  categoriesList.value.map(c => ({ title: c.name, value: c.id }))
)

const serviceOptionsQuickAnswers = computed(() => 
  servicesList.value.map(s => ({ title: s.name, value: s.id }))
)

const searchArticles = async () => {
  try {
    loadingArticles.value = true
    const params: any = {}
    if (quickAnswerFilter.value.categoryId) params.categoryId = quickAnswerFilter.value.categoryId
    if (quickAnswerFilter.value.serviceId) params.serviceId = quickAnswerFilter.value.serviceId
    
    const data = await $api<{ articles: Article[] }>(`${API_BASE}/knowledge-base/by-filters`, {
      params
    })
    foundArticles.value = data.articles || []
  } catch (err) {
    console.error('Error fetching articles:', err)
    foundArticles.value = []
  } finally {
    loadingArticles.value = false
  }
}

const fetchCategoriesAndServices = async () => {
  try {
    const [typesData, servicesData] = await Promise.all([
      $api<{ types: any[] }>(`${API_BASE}/types`),
      $api<{ services: any[] }>(`${API_BASE}/services`)
    ])
    typesList.value = typesData.types || []
    servicesList.value = servicesData.services || []
    categoriesList.value = typesList.value
  } catch (err) {
    console.error('Error fetching categories/services:', err)
  }
}

const toggleArticle = (articleId: number) => {
  const index = selectedArticleIds.value.indexOf(articleId)
  if (index === -1) {
    selectedArticleIds.value.push(articleId)
  } else {
    selectedArticleIds.value.splice(index, 1)
  }
}

const removeArticle = (articleId: number) => {
  const index = selectedArticleIds.value.indexOf(articleId)
  if (index !== -1) {
    selectedArticleIds.value.splice(index, 1)
  }
}

const isArticleSelected = (articleId: number) => {
  return selectedArticleIds.value.includes(articleId)
}

const selectedArticlesDetails = computed(() => {
  return selectedArticleIds.value.map(id => {
    const article = foundArticles.value.find(a => a.id === id)
    if (article) return article
    return { id, title: `Статья #${id}`, content: '' }
  })
})

const openQuickAnswersDialog = () => {
  showQuickAnswersDialog.value = true
  if (categoriesList.value.length === 0) {
    fetchCategoriesAndServices()
  }
}

const fetchReferenceData = async () => {
  try {
    const data =     await $api<ReferenceData>(`${API_BASE}/referenceData`)
    referenceData.value = {
      services: data.services || [],
      sla: data.sla || [],
      workflows: data.workflows || [],
      agentGroups: data.agentGroups || [],
      priorities: data.priorities || [],
      customers: data.customers || [],
      customersGroups: data.customersGroups || [],
      agents: data.agents || [],
      types: data.types || [],
      typeCategories: data.typeCategories || [],
      postMasterMailAccounts: data.postMasterMailAccounts || [],
      templates: data.templates || [],
      systemConfiguration: data.systemConfiguration || []
    }
  } catch (err) {
    console.error('Error fetching reference data:', err)
  }
}

const fetchTemplates = async () => {
  try {
    const data = await $api<{ templates: any[] }>(`${API_BASE}/templates`)
    referenceData.value.templates = data.templates || []
  } catch (err) {
    console.error('Error fetching templates:', err)
  }
}

const fetchQueue = async () => {
  if (!queueId.value) return

  try {
    loading.value = true
    const data = await $api(`${API_BASE}/queues/${queueId.value}`)
    console.log('Fetched queue data:', data)
    console.log('departmentId:', data.departmentId, 'companyId:', data.companyId)
    Object.assign(queue.value, data as Queue)
    await nextTick()
    console.log('After nextTick, departmentId:', queue.value.departmentId)
    // Initialize selected article IDs
    if (queue.value.quickAnswerArticleIds && Array.isArray(queue.value.quickAnswerArticleIds)) {
      selectedArticleIds.value = [...queue.value.quickAnswerArticleIds]
    }
    // Initialize keywords array
    keywordsArray.value = typeof queue.value.keywords === 'string' && queue.value.keywords ? queue.value.keywords.split(',').map(k => k.trim()).filter(k => k) : []
  } catch (err) {
    error.value = 'Ошибка загрузки очереди'
    console.error('Error fetching queue:', err)
  } finally {
    loading.value = false
  }
}

const saveQueue = async () => {
  if (!queue.value.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  try {
    saving.value = true
    const queueData: any = {
      name: queue.value.name,
      description: queue.value.description,
      isActive: queue.value.isActive
    }

    if (queue.value.serviceId !== undefined) queueData.serviceId = queue.value.serviceId
    if (queue.value.slaId !== undefined) queueData.slaId = queue.value.slaId
    if (queue.value.workflowId !== undefined) queueData.workflowId = queue.value.workflowId
    if (queue.value.priorityId !== undefined) queueData.priorityId = queue.value.priorityId
    if (queue.value.keywords !== undefined && queue.value.keywords !== '') queueData.keywords = queue.value.keywords
    if (selectedArticleIds.value.length > 0) queueData.quickAnswerArticleIds = selectedArticleIds.value
    if (queue.value.templateOpenTicketId !== undefined) queueData.templateOpenTicketId = queue.value.templateOpenTicketId
    if (queue.value.templateCloseTicketId !== undefined) queueData.templateCloseTicketId = queue.value.templateCloseTicketId
    if (queue.value.templateConfirmTicketId !== undefined) queueData.templateConfirmTicketId = queue.value.templateConfirmTicketId
    if (queue.value.templateStatusChangeId !== undefined) queueData.templateStatusChangeId = queue.value.templateStatusChangeId
    if (queue.value.templateCommentTicketId !== undefined) queueData.templateCommentTicketId = queue.value.templateCommentTicketId

    console.log('Saving queueData:', queueData)

    // Новые поля
    if (queue.value.companyId !== undefined) queueData.companyId = queue.value.companyId
    if (queue.value.departmentId !== undefined) queueData.departmentId = queue.value.departmentId
    if (queue.value.typeId !== undefined) queueData.typeId = queue.value.typeId
    if (queue.value.categoryId !== undefined) queueData.categoryId = queue.value.categoryId
    if (queue.value.postMasterMailAccountId !== undefined) queueData.postMasterMailAccountId = queue.value.postMasterMailAccountId
    if (queue.value.executorGroupIds !== undefined && queue.value.executorGroupIds !== null) queueData.executorGroupIds = queue.value.executorGroupIds
    if (queue.value.executorAgentIds !== undefined && queue.value.executorAgentIds !== null) queueData.executorAgentIds = queue.value.executorAgentIds
    if (queue.value.observerAgentIds !== undefined && queue.value.observerAgentIds !== null) queueData.observerAgentIds = queue.value.observerAgentIds
    if (queue.value.approverGroupIds !== undefined && queue.value.approverGroupIds !== null) queueData.approverGroupIds = queue.value.approverGroupIds
    if (queue.value.approverAgentIds !== undefined && queue.value.approverAgentIds !== null) queueData.approverAgentIds = queue.value.approverAgentIds

    if (isEdit.value) {
      await $api(`${API_BASE}/queues/${queueId.value}`, {
        method: 'PUT',
        body: queueData
      })
      showToast('Очередь успешно обновлена')
    } else {
      await $api(`${API_BASE}/queues`, {
        method: 'POST',
        body: queueData
      })
      showToast('Очередь успешно создана')
    }
    
    router.push('/apps/Queues')
  } catch (err) {
    showToast('Ошибка сохранения очереди', 'error')
    console.error('Error saving queue:', err)
  } finally {
    saving.value = false
  }
}

const cancel = () => {
  router.push('/apps/Queues')
}

const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

// Watch for companyId changes to reset related fields (only if user changed, not on load)
watch(() => queue.value.companyId, (newCompanyId, oldCompanyId) => {
  if (newCompanyId !== oldCompanyId && oldCompanyId !== null) {
    queue.value.departmentId = null
    queue.value.postMasterMailAccountId = null
  }
})

onMounted(async () => {
  await fetchReferenceData()
  await fetchTemplates()
  if (isEdit.value) {
    await fetchQueue()
  }
})
</script>

<template>
  <div>
    <VCard :title="isEdit ? 'Редактирование очереди' : 'Создание очереди'">
      <VCardText>
        <div class="d-flex">
          <VTabs v-model="activeTab" direction="vertical" class="v-tabs--vertical">
          <VTab value="basic" prepend-icon="bx-info-circle">Основная информация</VTab>
          <VTab value="organization" prepend-icon="bx-building">Организация</VTab>
          <VTab value="types" prepend-icon="bx-category">Типы</VTab>
          <VTab value="services" prepend-icon="bx-cog">Сервисы</VTab>
          <VTab value="agents" prepend-icon="bx-group">Агенты</VTab>
          <VTab value="observers" prepend-icon="bx-eye">Наблюдатели</VTab>
          <VTab value="approvers" prepend-icon="bx-check-circle">Согласующие</VTab>
          <VTab value="email" prepend-icon="bx-envelope">Почта</VTab>
          <VTab value="templates" prepend-icon="bx-file">Шаблоны</VTab>
          <VTab value="quick_answers" prepend-icon="bx-book">Быстрые ответы</VTab>
        </VTabs>

        <VWindow v-model="activeTab">
          <VWindowItem value="basic">
            <div class="pa-4">
              <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="queue.name"
                  label="Название *"
                  placeholder="Введите название"
                />
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="queue.priorityId"
                  label="Приоритет"
                  :items="priorityOptions"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>

              <VCol cols="12">
                <AppTextarea
                  v-model="queue.description"
                  label="Описание"
                  rows="3"
                  placeholder="Введите описание"
                />
              </VCol>

              <VCol cols="12">
                <VSwitch
                  v-model="queue.isActive"
                  label="Активен"
                  color="primary"
                />
              </VCol>
            </VRow>
            </div>
          </VWindowItem>


          <VWindowItem value="organization">
            <div class="pa-4">
              <VRow>
              <VCol cols="12">
                <AppSelect
                  v-model="queue.companyId"
                  label="Организация"
                  :items="companyOptions"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="queue.departmentId"
                  label="Подразделение"
                  :items="departmentOptions"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>
            </VRow>
            </div>
          </VWindowItem>

          <VWindowItem value="types">
            <div class="pa-4">
              <VRow>
              <VCol cols="12">
                <AppSelect
                  v-model="queue.typeId"
                  label="Тип"
                  :items="typeOptions"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="queue.categoryId"
                  label="Категория типа"
                  :items="typeCategoryOptions"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>
            </VRow>
            </div>
          </VWindowItem>

          <VWindowItem value="services">
            <VRow class="pa-4">
              <VCol cols="12">
                <AppSelect
                  v-model="queue.serviceId"
                  label="Сервис"
                  :items="serviceOptions"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="queue.slaId"
                  label="SLA"
                  :items="slaOptions"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="queue.workflowId"
                  label="Рабочий процесс"
                  :items="workflowOptions"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>
            </VRow>
          </VWindowItem>

          <VWindowItem value="agents">
            <VRow class="pa-4">
              <VCol cols="12">
                <AppSelect
                  v-model="queue.executorGroupIds"
                  label="Группы агентов-исполнителей"
                  :items="agentGroupOptions"
                  :multiple="allowMultipleExecutorGroups"
                  :chips="allowMultipleExecutorGroups"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="queue.executorAgentIds"
                  label="Агенты-исполнители"
                  :items="agentOptions"
                  :multiple="allowMultipleExecutors"
                  :chips="allowMultipleExecutors"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>
            </VRow>
          </VWindowItem>

          <VWindowItem value="observers">
            <VRow class="pa-4">
              <VCol cols="12">
                <AppSelect
                  v-model="queue.observerAgentIds"
                  label="Наблюдатели"
                  :items="agentOptions"
                  multiple
                  :chips="true"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>
            </VRow>
          </VWindowItem>

          <VWindowItem value="approvers">
            <VRow class="pa-4">
              <VCol cols="12" sm="6">
                <AppSelect
                  v-model="queue.approverGroupIds"
                  label="Группы согласующих"
                  :items="agentGroupOptions"
                  multiple
                  chips
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>
              <VCol cols="12" sm="6">
                <AppSelect
                  v-model="queue.approverAgentIds"
                  label="Согласующие"
                  :items="agentOptions"
                  multiple
                  chips
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>
            </VRow>
          </VWindowItem>

          <VWindowItem value="email">
            <VRow class="pa-4">
              <VCol cols="12">
                <AppSelect
                  v-model="queue.postMasterMailAccountId"
                  label="Почтовый аккаунт"
                  :items="postMasterMailAccountOptions"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>

              <VCol cols="12">
                <VCombobox
                  :model-value="keywordsArray"
                  @update:model-value="keywordsArray = $event"
                  label="Ключевые слова"
                  multiple
                  chips
                  placeholder="Введите ключевые слова"
                />
              </VCol>
            </VRow>
          </VWindowItem>

          <VWindowItem value="templates">
            <VRow class="pa-4">
              <VCol cols="12">
                <AppSelect
                  v-model="queue.templateOpenTicketId"
                  label="Шаблон открытия обращения"
                  :items="templateOptions"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="queue.templateCloseTicketId"
                  label="Шаблон закрытия обращения"
                  :items="templateOptions"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="queue.templateConfirmTicketId"
                  label="Шаблон согласования заявки"
                  :items="templateOptions"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="queue.templateStatusChangeId"
                  label="Шаблон изменения статуса обращения"
                  :items="templateOptions"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="queue.templateCommentTicketId"
                  label="Шаблон получения комментария по заявке"
                  :items="templateOptions"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>
            </VRow>
          </VWindowItem>

          <VWindowItem value="quick_answers">
            <VRow class="pa-4">
              <VCol cols="12">
                <div class="d-flex align-center gap-4">
                  <VBtn
                    variant="outlined"
                    color="primary"
                    @click="openQuickAnswersDialog"
                  >
                    <VIcon icon="bx-book" class="me-2" />
                    Быстрые ответы
                  </VBtn>
                  <span v-if="selectedArticleIds.length > 0" class="text-body-2 text-medium-emphasis">
                    Выбрано: {{ selectedArticleIds.length }} статей
                  </span>
                </div>
                <div v-if="selectedArticleIds.length > 0" class="mt-3 d-flex flex-wrap gap-2">
                  <VChip
                    v-for="article in selectedArticlesDetails"
                    :key="article.id"
                    closable
                    @click:close="removeArticle(article.id)"
                  >
                    {{ article.title }}
                  </VChip>
                </div>
              </VCol>
            </VRow>
          </VWindowItem>
        </VWindow>
        </div>
      </VCardText>

      <VCardText>
        <div class="d-flex gap-4 justify-end">
          <VBtn
            color="error"
            variant="outlined"
            @click="cancel"
          >
            Отмена
          </VBtn>
          <VBtn
            color="success"
            variant="elevated"
            :loading="saving"
            @click="saveQueue"
          >
            Сохранить
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <VSnackbar
      v-model="isToastVisible"
      :color="toastColor"
      timeout="3000"
    >
      {{ toastMessage }}
    </VSnackbar>

    <VDialog v-model="showQuickAnswersDialog" max-width="700" scrollable>
      <VCard title="Быстрые ответы из базы знаний">
        <VCardText>
          <VRow class="mb-4">
            <VCol cols="12">
              <AppSelect
                v-model="quickAnswerFilter.categoryId"
                label="Категория"
                :items="categoryOptions"
                clearable
                clear-icon="bx-x"
                placeholder="Все категории"
              />
            </VCol>
            <VCol cols="12">
              <AppSelect
                v-model="quickAnswerFilter.serviceId"
                label="Сервис"
                :items="serviceOptionsQuickAnswers"
                clearable
                clear-icon="bx-x"
                placeholder="Все сервисы"
              />
            </VCol>
          </VRow>
          <div class="d-flex justify-center mb-4">
            <VBtn
              color="primary"
              :loading="loadingArticles"
              @click="searchArticles"
            >
              <VIcon icon="bx-search" class="me-2" />
              Найти статьи
            </VBtn>
          </div>

          <div v-if="foundArticles.length === 0 && !loadingArticles" class="text-center py-4 text-medium-emphasis">
            Выберите категорию и/или сервис и нажмите "Найти статьи"
          </div>

          <VList v-if="foundArticles.length > 0" class="border rounded" max-height="300">
            <VListItem
              v-for="article in foundArticles"
              :key="article.id"
              class="mb-1"
            >
              <template #prepend>
                <VCheckbox
                  :model-value="isArticleSelected(article.id)"
                  @update:model-value="toggleArticle(article.id)"
                />
              </template>
              <VListItemTitle class="font-weight-medium">{{ article.title }}</VListItemTitle>
              <VListItemSubtitle class="text-truncate">
                {{ article.content?.substring(0, 100) || 'Без описания' }}...
              </VListItemSubtitle>
            </VListItem>
          </VList>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="primary" @click="showQuickAnswersDialog = false">
            Закрыть
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style lang="scss" scoped>
.v-tabs--vertical {
  .v-tabs-bar {
    width: 250px;
    flex-shrink: 0;
  }


}
</style>
