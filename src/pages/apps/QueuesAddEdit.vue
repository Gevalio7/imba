<script setup lang="ts">
import { $fetch } from 'ofetch'
import { onMounted, ref, computed } from 'vue'

interface Queue {
  id: number
  name: string
  description: string
  maxTickets: number
  priority: number
  companyId: number | null
  serviceId: number | null
  slaId: number | null
  workflowId: number | null
  agentGroupId: number | null
  priorityId: number | null
  emailConfig: string
  keywords: string
  autoResponseTemplate: string
  quickAnswerArticleIds: number[] | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ReferenceData {
  services: { id: number; name: string }[]
  sla: { id: number; name: string }[]
  workflows: { id: number; name: string }[]
  agentGroups: { id: number; name: string }[]
  priorities: { id: number; name: string }[]
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
  const id = route.params.id
  return id && !isNaN(Number(id))
})
const queueId = computed(() => {
  const id = route.params.id
  if (isEdit.value && id) return Number(id)
  return null
})

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const referenceData = ref<ReferenceData>({
  services: [],
  sla: [],
  workflows: [],
  agentGroups: [],
  priorities: []
})

const queue = ref<Queue>({
  id: 0,
  name: '',
  description: '',
  maxTickets: 0,
  priority: 0,
  companyId: null,
  serviceId: null,
  slaId: null,
  workflowId: null,
  agentGroupId: null,
  priorityId: null,
  emailConfig: '',
  keywords: '',
  autoResponseTemplate: '',
  quickAnswerArticleIds: null,
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
    
    const data = await $fetch<{ articles: Article[] }>(`${API_BASE}/knowledge-base/by-filters`, {
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
      $fetch<{ types: any[] }>(`${API_BASE}/types`),
      $fetch<{ services: any[] }>(`${API_BASE}/services`)
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
    const data = await $fetch<ReferenceData>(`${API_BASE}/reference-data`)
    referenceData.value = {
      services: data.services || [],
      sla: data.sla || [],
      workflows: data.workflows || [],
      agentGroups: data.agentGroups || [],
      priorities: data.priorities || []
    }
  } catch (err) {
    console.error('Error fetching reference data:', err)
  }
}

const fetchQueue = async () => {
  if (!queueId.value) return
  
  try {
    loading.value = true
    const data = await $fetch(`${API_BASE}/queues/${queueId.value}`)
    // Convert emailConfig from object to JSON string for textarea
    if (data.emailConfig && typeof data.emailConfig === 'object') {
      data.emailConfig = JSON.stringify(data.emailConfig, null, 2)
    }
    queue.value = data as Queue
    // Initialize selected article IDs
    if (queue.value.quickAnswerArticleIds && Array.isArray(queue.value.quickAnswerArticleIds)) {
      selectedArticleIds.value = [...queue.value.quickAnswerArticleIds]
    }
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
      maxTickets: queue.value.maxTickets,
      priority: queue.value.priority,
      isActive: queue.value.isActive
    }

    if (queue.value.serviceId !== undefined) queueData.serviceId = queue.value.serviceId
    if (queue.value.slaId !== undefined) queueData.slaId = queue.value.slaId
    if (queue.value.workflowId !== undefined) queueData.workflowId = queue.value.workflowId
    if (queue.value.agentGroupId !== undefined) queueData.agentGroupId = queue.value.agentGroupId
    if (queue.value.priorityId !== undefined) queueData.priorityId = queue.value.priorityId
    if (queue.value.emailConfig !== undefined) queueData.emailConfig = queue.value.emailConfig
    if (queue.value.keywords !== undefined) queueData.keywords = queue.value.keywords
    if (queue.value.autoResponseTemplate !== undefined) queueData.autoResponseTemplate = queue.value.autoResponseTemplate
    if (selectedArticleIds.value.length > 0) queueData.quickAnswerArticleIds = selectedArticleIds.value

    if (isEdit.value) {
      await $fetch(`${API_BASE}/queues/${queueId.value}`, {
        method: 'PUT',
        body: queueData
      })
      showToast('Очередь успешно обновлена')
    } else {
      await $fetch(`${API_BASE}/queues`, {
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

onMounted(async () => {
  await fetchReferenceData()
  if (isEdit.value) {
    await fetchQueue()
  }
})
</script>

<template>
  <div>
    <VCard :title="isEdit ? 'Редактирование очереди' : 'Создание очереди'">
      <VCardText>
        <VRow>
          <VCol cols="12" sm="6">
            <AppTextField
              v-model="queue.name"
              label="Название *"
              placeholder="Введите название"
            />
          </VCol>

          <VCol cols="12" sm="6">
            <AppTextField
              v-model="queue.priority"
              label="Приоритет"
              type="number"
              min="0"
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

          <VCol cols="12" sm="6">
            <AppTextField
              v-model="queue.maxTickets"
              label="Макс. тикетов"
              type="number"
              min="0"
            />
          </VCol>

          <VCol cols="12" sm="6">
            <AppSelect
              v-model="queue.serviceId"
              label="Сервис"
              :items="serviceOptions"
              clearable
              clear-icon="bx-x"
            />
          </VCol>

          <VCol cols="12" sm="6">
            <AppSelect
              v-model="queue.slaId"
              label="SLA"
              :items="slaOptions"
              clearable
              clear-icon="bx-x"
            />
          </VCol>

          <VCol cols="12" sm="6">
            <AppSelect
              v-model="queue.workflowId"
              label="Рабочий процесс"
              :items="workflowOptions"
              clearable
              clear-icon="bx-x"
            />
          </VCol>

          <VCol cols="12" sm="6">
            <AppSelect
              v-model="queue.agentGroupId"
              label="Группа агентов"
              :items="agentGroupOptions"
              clearable
              clear-icon="bx-x"
            />
          </VCol>

          <VCol cols="12" sm="6">
            <AppSelect
              v-model="queue.priorityId"
              label="Приоритет (справочник)"
              :items="priorityOptions"
              clearable
              clear-icon="bx-x"
            />
          </VCol>

          <VCol cols="12" sm="6">
            <VSwitch
              v-model="queue.isActive"
              label="Активен"
              color="primary"
            />
          </VCol>

          <VCol cols="12">
            <AppTextarea
              v-model="queue.keywords"
              label="Ключевые слова"
              rows="2"
              placeholder="Введите ключевые слова через запятую"
            />
          </VCol>

          <VCol cols="12">
            <AppTextarea
              v-model="queue.emailConfig"
              label="Конфигурация email"
              rows="3"
              placeholder="Введите конфигурацию email"
            />
          </VCol>

          <VCol cols="12">
            <AppTextarea
              v-model="queue.autoResponseTemplate"
              label="Шаблон автоответа"
              rows="4"
              placeholder="Введите шаблон автоответа"
            />
          </VCol>

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
            <VCol cols="12" sm="6">
              <AppSelect
                v-model="quickAnswerFilter.categoryId"
                label="Категория"
                :items="categoryOptions"
                clearable
                clear-icon="bx-x"
                placeholder="Все категории"
              />
            </VCol>
            <VCol cols="12" sm="6">
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