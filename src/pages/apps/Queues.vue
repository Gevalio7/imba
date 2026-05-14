<script setup lang="ts">
import { useFilters, type ColumnSetting } from '@/composables/useFilters'
import { $api } from '@/utils/api'
import { computed, onMounted, ref, watch } from 'vue'

// CASL helpers
import { useGlobalPermissions } from '@/composables/useGlobalPermissions'
import { useRoute } from 'vue-router'

// Типы данных для Очередь
interface Queues {
  id: number
  name: string
  description: string
  companyId: number | null
  serviceId: number | null
  slaId: number | null
  workflowId: number | null

  priorityId: number | null
  keywords: string[] | null
  quickAnswerArticleIds: number[] | null
  executorGroupIds: number[] | null
  executorAgentIds: number[] | null
  observerGroupIds: number[] | null
  observerAgentIds: number[] | null
  approverGroupIds: number[] | null
  approverAgentIds: number[] | null
  departmentId: number | null
  typeId: number | null
  categoryId: number | null
  postMasterMailAccountId: number | null

  templateOpenTicketId: number | null
  templateCloseTicketId: number | null
  templateConfirmTicketId: number | null
  templateStatusChangeId: number | null
  templateCommentTicketId: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}


// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Справочники для отображения названий вместо ID
interface ReferenceData {
  services: { id: number; name: string }[]
  sla: { id: number; name: string }[]
  workflows: { id: number; name: string }[]
  agentGroups: { id: number; name: string }[]
  priorities: { id: number; name: string; color: string }[]
  customers: { id: number; name: string }[]
  customersGroups: { id: number; name: string; customerId: number }[]
  agents: { id: number; firstName: string; lastName: string }[]
  types: { id: number; name: string }[]
  typeCategories: { id: number; name: string }[]
  postMasterMailAccounts: { id: number; name: string }[]
  templates: { id: number; name: string }[]
}

// Доступные колонки для настройки
const availableColumns: ColumnSetting[] = [
  { key: 'id', title: 'ID', visible: true, sortable: true, type: 'text' },
  { key: 'name', title: 'Название', visible: true, sortable: true, type: 'text' },
  { key: 'description', title: 'Описание', visible: true, sortable: true, type: 'text' },
  { key: 'companyId', title: 'Организация', visible: true, sortable: false, type: 'select' },
  { key: 'departmentId', title: 'Подразделение', visible: true, sortable: false, type: 'select' },
  { key: 'typeId', title: 'Тип', visible: true, sortable: false, type: 'select' },
  { key: 'categoryId', title: 'Категория', visible: true, sortable: false, type: 'select' },
  { key: 'postMasterMailAccountId', title: 'Почтовый аккаунт', visible: true, sortable: false, type: 'select' },
  { key: 'serviceId', title: 'Сервис', visible: true, sortable: false, type: 'select' },
  { key: 'slaId', title: 'SLA', visible: true, sortable: false, type: 'select' },
  { key: 'workflowId', title: 'Рабочий процесс', visible: true, sortable: false, type: 'select' },
  { key: 'priorityId', title: 'Приоритет (справочник)', visible: true, sortable: false, type: 'select' },
  { key: 'executorGroupIds', title: 'Группы исполнителей', visible: true, sortable: false, type: 'select' },
  { key: 'executorAgentIds', title: 'Исполнители', visible: true, sortable: false, type: 'select' },
  { key: 'observerGroupIds', title: 'Группы наблюдателей', visible: true, sortable: false, type: 'select' },
  { key: 'observerAgentIds', title: 'Наблюдатели', visible: true, sortable: false, type: 'select' },
  { key: 'approverGroupIds', title: 'Группы согласующих', visible: true, sortable: false, type: 'select' },
  { key: 'approverAgentIds', title: 'Согласующие', visible: true, sortable: false, type: 'select' },
  { key: 'keywords', title: 'Ключевые слова', visible: true, sortable: false, type: 'text' },
  { key: 'createdAt', title: 'Создано', visible: true, sortable: true, type: 'date' },
  { key: 'updatedAt', title: 'Изменено', visible: true, sortable: true, type: 'date' },
  { key: 'isActive', title: 'Активен', visible: true, sortable: false, type: 'boolean' },
  { key: 'actions', title: 'Действия', visible: true, sortable: false, type: 'text' },
]

// Загрузка/сохранение настроек колонок
const STORAGE_KEY = 'queues-columns-settings'

const loadColumnSettings = (): ColumnSetting[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as ColumnSetting[]
      return availableColumns.map(col => {
        const savedCol = parsed.find((s: ColumnSetting) => s.key === col.key)
        return savedCol ? { ...col, visible: savedCol.visible } : col
      })
    }
  } catch (e) {
    console.error('Error loading column settings:', e)
  }
  return [...availableColumns]
}

const columnSettings = ref<ColumnSetting[]>(loadColumnSettings())

// Вычисляемые заголовки на основе настроек колонок
const visibleHeaders = computed(() => {
  return columnSettings.value.filter(col => col.visible)
})

// Сохранение настроек колонок
watch(columnSettings, (newSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
  } catch (e) {
    console.error('Error saving column settings:', e)
  }
}, { deep: true })

// Методы для работы с колонками
const moveColumnUp = (index: number) => {
  if (index <= 0) return
  const temp = columnSettings.value[index]
  columnSettings.value[index] = columnSettings.value[index - 1]
  columnSettings.value[index - 1] = temp
}

const moveColumnDown = (index: number) => {
  if (index >= columnSettings.value.length - 1) return
  const temp = columnSettings.value[index]
  columnSettings.value[index] = columnSettings.value[index + 1]
  columnSettings.value[index + 1] = temp
}

const resetColumnSettings = () => {
  columnSettings.value = availableColumns.map(col => ({ ...col, visible: true }))
}

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
  templates: []
})

const fetchReferenceData = async () => {
  try {
    const data = await $api<ReferenceData>(`${API_BASE}/referenceData`)
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
      templates: data.templates || []
    }
  } catch (err) {
    console.error('Error fetching reference data:', err)
  }
}

const getServiceName = (id: number | null) => {
  if (!id) return '-'
  const service = referenceData.value.services.find(s => s.id === id)
  return service?.name || '-'
}

const getSlaName = (id: number | null) => {
  if (!id) return '-'
  const sla = referenceData.value.sla.find(s => s.id === id)
  return sla?.name || '-'
}

const getWorkflowName = (id: number | null) => {
  if (!id) return '-'
  const workflows = referenceData.value.workflows.find(w => w.id === id)
  return workflows?.name || '-'
}

const getAgentGroupName = (id: number | null) => {
  if (!id) return '-'
  const group = referenceData.value.agentGroups.find(g => g && g.id === id)
  return group?.name || '-'
}

const getPriorityName = (id: number | null) => {
  if (!id) return '-'
  const priority = referenceData.value.priorities.find(p => p && p.id === id)
  return priority?.name || '-'
}

const getPriorityColor = (id: number | null) => {
  if (!id) return 'grey'
  const priority = referenceData.value.priorities.find(p => p && p.id === id)
  return priority?.color || 'grey'
}

const priorityOptions = computed(() =>
  referenceData.value.priorities.map(p => ({ title: p.name, value: p.id }))
)

const getCompanyName = (id: number | null) => {
  if (!id) return '-'
  const company = referenceData.value.customers.find(c => c && c.id === id)
  return company?.name || '-'
}

const getDepartmentName = (id: number | null) => {
  if (!id) return '-'
  const department = referenceData.value.customersGroups.find(d => d && d.id === id)
  return department?.name || '-'
}

const getAgentNames = (ids: number[] | null) => {
  if (!ids || ids.length === 0) return '-'
  const names = ids.map(id => {
    const agent = referenceData.value.agents.find(a => a && a.id === id)
    return agent ? `${agent.firstName} ${agent.lastName}` : `Агент ${id}`
  })
  return names.join(', ')
}

const getTypeName = (id: number | null) => {
  if (!id) return '-'
  const type = referenceData.value.types.find(t => t && t.id === id)
  return type?.name || '-'
}

const getCategoryName = (id: number | null) => {
  if (!id) return '-'
  const category = referenceData.value.typeCategories.find(c => c && c.id === id)
  return category?.name || '-'
}

const getPostMasterMailAccountName = (id: number | null) => {
  if (!id) return '-'
  const account = referenceData.value.postMasterMailAccounts.find(a => a && a.id === id)
  return account?.name || '-'
}

const getTemplateName = (id: number | null) => {
  if (!id) return '-'
  const template = referenceData.value.templates.find(t => t && t.id === id)
  return template?.name || '-'
}

// Роутер
const router = useRouter()
const route = useRoute()

// Данные очереди
const queues = ref<Queues[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Загрузка данных из API
const fetchQueues = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('Fetching queues from:', `${API_BASE}/queues`)
    const data = await $api<{ queues: Queues[], total: number }>(`${API_BASE}/queues`)
    console.log('Fetched queues data:', data)
    queues.value = data.queues
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки очереди'
    console.error('Error fetching queues:', err)
  } finally {
    loading.value = false
  }
}

// Создание очередь
const createQueues = async (item: Omit<Queues, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $api<Queues>(`${API_BASE}/queues`, {
      method: 'POST',
      body: item
    })
    queues.value.push(data)
    return data
  } catch (err) {
    console.error('Error creating queues:', err)
    throw err
  }
}

// Обновление очередь
const updateQueues = async (id: number, item: Omit<Queues, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $api<Queues>(`${API_BASE}/queues/${id}`, {
      method: 'PUT',
      body: item
    })
    const index = queues.value.findIndex(p => p.id === id)
    if (index !== -1) {
      queues.value[index] = data
    }
    return data
  } catch (err) {
    console.error('Error updating queues:', err)
    throw err
  }
}

// Удаление очередь
const deleteQueues = async (id: number) => {
  try {
    await $api(`${API_BASE}/queues/${id}`, {
      method: 'DELETE'
    })
    const index = queues.value.findIndex(p => p.id === id)
    if (index !== -1) {
      queues.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Error deleting queues:', err)
    throw err
  }
}

// Watcher для обновления данных при возврате со страницы редактирования
watch(() => route.query.refresh, (newVal) => {
  if (newVal) {
    fetchQueues()
  }
})

// Инициализация
onMounted(async () => {
  await fetchReferenceData()
  fetchQueues()
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Описание', key: 'description', sortable: true },
  { title: 'Организация', key: 'companyId', sortable: false },
  { title: 'Подразделение', key: 'departmentId', sortable: false },
  { title: 'Тип', key: 'typeId', sortable: false },
  { title: 'Категория', key: 'categoryId', sortable: false },
  { title: 'Почтовый аккаунт', key: 'postMasterMailAccountId', sortable: false },
  { title: 'Сервис', key: 'serviceId', sortable: false },
  { title: 'SLA', key: 'slaId', sortable: false },
  { title: 'Рабочий процесс', key: 'workflowId', sortable: false },
  { title: 'Приоритет (справочник)', key: 'priorityId', sortable: false },
  { title: 'Группы исполнителей', key: 'executorGroupIds', sortable: false },
  { title: 'Исполнители', key: 'executorAgentIds', sortable: false },
  { title: 'Наблюдатели', key: 'observerAgentIds', sortable: false },
  { title: 'Группы согласующих', key: 'approverGroupIds', sortable: false },
  { title: 'Согласующие', key: 'approverAgentIds', sortable: false },
  { title: 'Шаблон открытия', key: 'templateOpenTicketId', sortable: false },
  { title: 'Шаблон закрытия', key: 'templateCloseTicketId', sortable: false },
  { title: 'Шаблон подтверждения', key: 'templateConfirmTicketId', sortable: false },
  { title: 'Шаблон изменения статуса', key: 'templateStatusChangeId', sortable: false },
  { title: 'Шаблон комментария', key: 'templateCommentTicketId', sortable: false },
  { title: 'Ключевые слова', key: 'keywords', sortable: false },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Фильтрация
const filteredQueues = computed(() => {
  let filtered = queues.value

  if (statusFilter.value !== null) {
    // Фильтруем по isActive: 1 = true (активен), 2 = false (не активен)
    filtered = filtered.filter(p => p.isActive === (statusFilter.value === 1))
  }

  return filtered
})

// Сброс фильтров
const clearFilters = () => {
  statusFilter.value = null
}

// Массовые действия
const bulkDelete = () => {
  console.log('🗑️ Массовое удаление - вызвано')
  console.log('📋 Выбранные элементы:', selectedItems.value)
  console.log('📊 Количество выбранных элементов:', selectedItems.value.length)
  isBulkDeleteDialogOpen.value = true
}

const bulkChangeStatus = () => {
  console.log('🔄 Массовое изменение статуса - вызвано')
  console.log('📋 Выбранные элементы:', selectedItems.value)
  console.log('📊 Количество выбранных элементов:', selectedItems.value.length)
  isBulkStatusDialogOpen.value = true
}

const confirmBulkDelete = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await deleteQueues(item.id)
    }
    selectedItems.value = []
    showToast(`Удалено ${count} очереди`)
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmBulkStatusChange = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await updateQueues(item.id, {
        ...item,
        isActive: bulkStatusValue.value === 1
      })
    }
    selectedItems.value = []
    showToast(`Статус изменен для ${count} очереди`)
    isBulkStatusDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового изменения статуса', 'error')
  }
}

const resolveStatusVariant = (isActive: boolean) => {
  if (isActive)
    return { color: 'primary', text: 'Активен' }
  else
    return { color: 'error', text: 'Не активен' }
}

// Пагинация
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Фильтры
const statusFilter = ref<number | null>(null)
const isFilterDialogOpen = ref(false)

// Массовые действия
const selectedItems = ref<any[]>([])
const isBulkActionsMenuOpen = ref(false)
const isBulkDeleteDialogOpen = ref(false)
const isBulkStatusDialogOpen = ref(false)
const bulkStatusValue = ref<number>(1)

// Отслеживание изменений выбранных элементов
watch(selectedItems, (newValue) => {
  console.log('✅ Изменение выбранных элементов')
  console.log('📋 Новое значение selectedItems:', newValue)
  console.log('📊 Количество выбранных:', newValue.length)
  console.log('🔍 Детали выбранных элементов:', JSON.stringify(newValue, null, 2))
}, { deep: true })

// Диалоги
const editDialog = ref(false)
const deleteDialog = ref(false)
const isColumnsDialogOpen = ref(false)

const defaultItem = ref<Queues>({
  id: -1,
  name: '',
  description: '',
  companyId: null,
  serviceId: null,
  slaId: null,
  workflowId: null,
  priorityId: null,
  keywords: null,
  quickAnswerArticleIds: null,
  executorGroupIds: null,
  executorAgentIds: null,
  observerGroupIds: null,
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
  createdAt: '',
  updatedAt: '',
  isActive: true,
})

const editedItem = ref<Queues>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Методы
const editItem = (item: Queues) => {
  router.push(`/apps/queues/${item.id}`)
}

const deleteItem = (item: Queues) => {
  editedIndex.value = queues.value.indexOf(item)
  editedItem.value = { ...item }
  deleteDialog.value = true
}

const close = () => {
  editDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
}

const closeDelete = () => {
  deleteDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
}

const save = async () => {
  if (!editedItem.value.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

    try {
      // Подготавливаем данные для отправки
      const dataToSave = {
        ...editedItem.value,
        keywords: editedItem.value.keywords
          ? editedItem.value.keywords.join(', ')
          : null
      }

      if (editedIndex.value > -1) {
        // Обновление существующего
        const updated = await updateQueues(editedItem.value.id, dataToSave)
        showToast('Очередь успешно сохранена')
      } else {
        // Добавление нового
        const created = await createQueues(dataToSave)
        showToast('Очередь успешно добавлена')
      }
      close()
    } catch (err) {
      showToast('Ошибка сохранения очереди', 'error')
    }
}

const deleteItemConfirm = async () => {
  try {
    await deleteQueues(editedItem.value.id)
    showToast('Очередь успешно удален')
    closeDelete()
  } catch (err) {
    showToast('Ошибка удаления очередь', 'error')
  }
}

// Переключение статуса
const toggleStatus = async (item: Queues, newValue: boolean | null) => {
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение isActive:', newValue)

  if (newValue === null) return

  try {
    await updateQueues(item.id, {
      ...item,
      isActive: newValue
    })
    showToast('Статус очередь изменен')
  } catch (err) {
    showToast('Ошибка изменения статуса', 'error')
  }
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

// Добавление нового очередь
const addNewQueues = () => {
  router.push('/apps/queues/add')
}
</script>

<template>
  <div>
    <VCard title="Очереди">

      <!-- Индикатор загрузки -->
      <div v-if="loading" class="d-flex justify-center pa-6">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <!-- Сообщение об ошибке -->
      <div v-else-if="error" class="d-flex justify-center pa-6">
        <VAlert type="error" class="ma-4">
          {{ error }}
        </VAlert>
      </div>

      <div v-else class="d-flex flex-wrap gap-4 pa-6">
        <div class="d-flex align-center">
          <!-- Поиск -->
          <AppTextField
            placeholder="Поиск очереди"
            style="inline-size: 250px;"
            class="me-3"
          />
        </div>

        <!-- Кнопка фильтра -->
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="bx-filter"
          @click="isFilterDialogOpen = true"
        >
          Фильтр
        </VBtn>

        <!-- Кнопка массовых действий -->
        <VMenu
          v-model="isBulkActionsMenuOpen"
          :close-on-content-click="false"
        >
          <template #activator="{ props }">
            <VBtn
              variant="tonal"
              color="secondary"
              prepend-icon="bx-dots-vertical-rounded"
              :disabled="selectedItems.length === 0"
              v-bind="props"
            >
              Действия ({{ selectedItems.length }})
            </VBtn>
          </template>
          <VList>
            <VListItem
              @click="() => {
                bulkDelete()
                isBulkActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Удалить</VListItemTitle>
            </VListItem>
            <VListItem
              @click="() => {
                bulkChangeStatus()
                isBulkActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Изменить статус</VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>

        <VSpacer />
        <div class="d-flex gap-4 flex-wrap align-center">
          <AppSelect
            v-model="itemsPerPage"
            :items="[5, 10, 20, 25, 50]"
          />
          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="bx-columns"
            @click="isColumnsDialogOpen = true"
          >
            Колонки
          </VBtn>
          <!-- Экспорт -->
          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="bx-export"
          >
            Экспорт
          </VBtn>

          <VBtn
            v-if="$can('write','menu_queues')"
            color="primary"
            prepend-icon="bx-plus"
            @click="addNewQueues"
          >
            Добавить очередь
          </VBtn>
        </div>
      </div>


      <!-- Диалог фильтров -->
      <VDialog
        v-model="isFilterDialogOpen"
        max-width="500px"
      >
        <VCard title="Фильтры">
          <VCardText>
            <VRow>
              <VCol cols="12">
                <AppSelect
                  v-model="statusFilter"
                  placeholder="Статус"
                  :items="[
                    { title: 'Активен', value: 1 },
                    { title: 'Не активен', value: 2 },
                  ]"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>
            </VRow>
          </VCardText>

          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                variant="text"
                @click="clearFilters"
              >
                Сбросить
              </VBtn>
              <VBtn
                color="error"
                variant="outlined"
                @click="isFilterDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="isFilterDialogOpen = false"
              >
                Применить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог массового удаления -->
      <VDialog
        v-model="isBulkDeleteDialogOpen"
        max-width="500px"
      >
        <VCard title="Подтверждение удаления">
          <VCardText>
            Вы уверены, что хотите удалить выбранные очереди? Это действие нельзя отменить.
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                color="error"
                variant="outlined"
                @click="isBulkDeleteDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="confirmBulkDelete"
              >
                Удалить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог массового изменения статуса -->
      <VDialog
        v-model="isBulkStatusDialogOpen"
        max-width="500px"
      >
        <VCard title="Изменить статус">
          <VCardText>
            <AppSelect
              v-model="bulkStatusValue"
              :items="statusOptions"
              item-title="text"
              item-value="value"
              label="Новый статус"
            />
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                color="error"
                variant="outlined"
                @click="isBulkStatusDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="confirmBulkStatusChange"
              >
                Применить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <VDivider />

      <!-- Таблица -->
      <VDataTable
        v-model="selectedItems"
        v-model:items-per-page="itemsPerPage"
        v-model:page="currentPage"
        :headers="visibleHeaders"
        :items="filteredQueues"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Сервис -->
        <template #item.serviceId="{ item }">
          {{ getServiceName(item.serviceId) }}
        </template>

        <!-- SLA -->
        <template #item.slaId="{ item }">
          {{ getSlaName(item.slaId) }}
        </template>

        <!-- Рабочий процесс -->
        <template #item.workflowId="{ item }">
          {{ getWorkflowName(item.workflowId) }}
        </template>



        <!-- Организация -->
        <template #item.companyId="{ item }">
          {{ getCompanyName(item.companyId) }}
        </template>

        <!-- Подразделение -->
        <template #item.departmentId="{ item }">
          {{ getDepartmentName(item.departmentId) }}
        </template>

        <!-- Тип -->
        <template #item.typeId="{ item }">
          {{ getTypeName(item.typeId) }}
        </template>

        <!-- Категория -->
        <template #item.categoryId="{ item }">
          {{ getCategoryName(item.categoryId) }}
        </template>

        <!-- Ключевые слова -->
        <template #item.keywords="{ item }">
          <div v-if="item.keywords && Array.isArray(item.keywords)" class="d-flex flex-wrap gap-1">
            <VChip
              v-for="keyword in item.keywords"
              :key="keyword"
              size="small"
              color="primary"
              variant="flat"
              prepend-icon="bx-tag"
            >
              {{ keyword }}
            </VChip>
          </div>
          <span v-else class="text-disabled">-</span>
        </template>

        <!-- Почтовый аккаунт -->
        <template #item.postMasterMailAccountId="{ item }">
          {{ getPostMasterMailAccountName(item.postMasterMailAccountId) }}
        </template>

        <!-- Группы исполнителей -->
        <template #item.executorGroupIds="{ item }">
          {{ item.executorGroupIds && item.executorGroupIds.length > 0 ? item.executorGroupIds.map(id => getAgentGroupName(id)).join(', ') : '-' }}
        </template>

        <!-- Исполнители -->
        <template #item.executorAgentIds="{ item }">
          {{ getAgentNames(item.executorAgentIds) }}
        </template>

        <!-- Группы наблюдателей -->
        <template #item.observerGroupIds="{ item }">
          {{ item.observerGroupIds && item.observerGroupIds.length > 0 ? item.observerGroupIds.map(id => getAgentGroupName(id)).join(', ') : '-' }}
        </template>

        <!-- Наблюдатели -->
        <template #item.observerAgentIds="{ item }">
          {{ getAgentNames(item.observerAgentIds) }}
        </template>

        <!-- Группы согласующих -->
        <template #item.approverGroupIds="{ item }">
          {{ item.approverGroupIds && item.approverGroupIds.length > 0 ? item.approverGroupIds.map(id => getAgentGroupName(id)).join(', ') : '-' }}
        </template>

        <!-- Согласующие -->
        <template #item.approverAgentIds="{ item }">
          {{ getAgentNames(item.approverAgentIds) }}
        </template>

        <!-- Приоритет (справочник) -->
        <template #item.priorityId="{ item }">
          <VChip v-if="item.priorityId" :color="getPriorityColor(item.priorityId)" size="small">
            {{ getPriorityName(item.priorityId) }}
          </VChip>
          <span v-else>-</span>
        </template>

        <!-- Шаблон открытия -->
        <template #item.templateOpenTicketId="{ item }">
          {{ getTemplateName(item.templateOpenTicketId) }}
        </template>

        <!-- Шаблон закрытия -->
        <template #item.templateCloseTicketId="{ item }">
          {{ getTemplateName(item.templateCloseTicketId) }}
        </template>

        <!-- Шаблон подтверждения -->
        <template #item.templateConfirmTicketId="{ item }">
          {{ getTemplateName(item.templateConfirmTicketId) }}
        </template>

        <!-- Шаблон изменения статуса -->
        <template #item.templateStatusChangeId="{ item }">
          {{ getTemplateName(item.templateStatusChangeId) }}
        </template>

        <!-- Шаблон комментария -->
        <template #item.templateCommentTicketId="{ item }">
          {{ getTemplateName(item.templateCommentTicketId) }}
        </template>

        <!-- Активен -->
        <template #item.isActive="{ item }">
          <div class="d-flex align-center gap-2">
            <VSwitch
              :model-value="item.isActive"
              @update:model-value="(val) => toggleStatus(item, val)"
              color="primary"
              hide-details
            />
            <VChip
              v-bind="resolveStatusVariant(item.isActive)"
              density="compact"
              label
              size="small"
            />
          </div>
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn v-if="$can('write','menu_queues')" @click="editItem(item)">
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn v-if="$can('delete','menu_queues')" @click="deleteItem(item)">
              <VIcon icon="bx-trash" />
            </IconBtn>
          </div>
        </template>
      </VDataTable>

      <!-- Пагинация -->
      <div class="d-flex justify-center mt-4 pb-4">
        <VPagination
          v-model="currentPage"
          :length="Math.ceil(filteredQueues.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать очередь' : 'Добавить очередь'">
        <VCardText>
          <VRow>

            <!-- Название -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.name"
                label="Название *"
              />
            </VCol>

            <!-- Описание -->
            <VCol
              cols="12"
              
            >
              <AppTextarea
                v-model="editedItem.description"
                label="Описание"
                rows="3"
                placeholder="Введите описание..."
              />
            </VCol>

            <!-- Приоритет -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.priorityId"
                label="Приоритет"
                :items="priorityOptions"
                clearable
                clear-icon="bx-x"
              />
            </VCol>

            <!-- Организация -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.companyId"
                label="Организация"
                :items="referenceData.customers.map(c => ({ title: c.name, value: c.id }))"
                clearable
                clear-icon="bx-x"
              />
            </VCol>

            <!-- Подразделение -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.departmentId"
                label="Подразделение"
                :items="referenceData.customersGroups.filter(d => !editedItem.companyId || d.customerId === editedItem.companyId).map(d => ({ title: d.name, value: d.id }))"
                clearable
                clear-icon="bx-x"
              />
            </VCol>

            <!-- Тип -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.typeId"
                label="Тип"
                :items="referenceData.types.map(t => ({ title: t.name, value: t.id }))"
                clearable
                clear-icon="bx-x"
              />
            </VCol>

            <!-- Категория -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.categoryId"
                label="Категория типа"
                :items="referenceData.typeCategories.map(c => ({ title: c.name, value: c.id }))"
                clearable
                clear-icon="bx-x"
              />
            </VCol>

            <!-- Группы исполнителей -->
            <VCol cols="12" sm="6">
              <AppSelect
                v-model="editedItem.executorGroupIds"
                label="Группы исполнителей"
                :items="referenceData.agentGroups.map(g => ({ title: g.name, value: g.id }))"
                multiple
                clearable
                clear-icon="bx-x"
                chips
              />
            </VCol>

            <!-- Исполнители -->
            <VCol cols="12" sm="6">
              <AppSelect
                v-model="editedItem.executorAgentIds"
                label="Исполнители"
                :items="referenceData.agents.map(a => ({ title: `${a.firstName} ${a.lastName}`, value: a.id }))"
                multiple
                clearable
                clear-icon="bx-x"
                chips
              />
            </VCol>

            <!-- Наблюдатели -->
            <VCol cols="12" sm="6">
              <AppSelect
                v-model="editedItem.observerAgentIds"
                label="Наблюдатели"
                :items="referenceData.agents.map(a => ({ title: `${a.firstName} ${a.lastName}`, value: a.id }))"
                multiple
                clearable
                clear-icon="bx-x"
                chips
              />
            </VCol>

            <!-- Группы согласующих -->
            <VCol cols="12" sm="6">
              <AppSelect
                v-model="editedItem.approverGroupIds"
                label="Группы согласующих"
                :items="referenceData.agentGroups.map(g => ({ title: g.name, value: g.id }))"
                multiple
                clearable
                clear-icon="bx-x"
                chips
              />
            </VCol>

            <!-- Согласующие -->
            <VCol cols="12" sm="6">
              <AppSelect
                v-model="editedItem.approverAgentIds"
                label="Согласующие"
                :items="referenceData.agents.map(a => ({ title: `${a.firstName} ${a.lastName}`, value: a.id }))"
                multiple
                clearable
                clear-icon="bx-x"
                chips
              />
            </VCol>

            <!-- Активен -->
            <VCol
              cols="12"
              sm="6"
            >
              <VSwitch
                v-model="editedItem.isActive"
                label="Активен"
                color="primary"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VCardText>
          <div class="self-align-end d-flex gap-4 justify-end">
            <VBtn
              color="error"
              variant="outlined"
              @click="close"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="save"
            >
              Сохранить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог удаления -->
    <VDialog
      v-model="deleteDialog"
      max-width="500px"
    >
      <VCard title="Вы уверены, что хотите удалить этот очередь?">
        <VCardText>
          <div class="d-flex justify-center gap-4">
            <VBtn
              color="error"
              variant="outlined"
              @click="closeDelete"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="deleteItemConfirm"
            >
              Удалить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </div>

  <!-- Диалог настроек колонок -->
  <VDialog v-model="isColumnsDialogOpen" max-width="600px">
    <VCard title="Настройка колонок">
      <VCardText>
        <div class="d-flex justify-end mb-4">
          <VBtn variant="text" size="small" @click="resetColumnSettings">Сбросить</VBtn>
        </div>
        <VList>
          <VListItem
            v-for="(col, index) in columnSettings"
            :key="col.key"
            class="mb-1"
          >
            <template #prepend>
              <VCheckbox
                v-model="col.visible"
                hide-details
                density="compact"
              />
            </template>
            <VListItemTitle>{{ col.title }}</VListItemTitle>
            <template #append>
              <div class="d-flex gap-1">
                <IconBtn
                  @click="moveColumnUp(index)"
                  :disabled="index === 0"
                >
                  <VIcon icon="bx-chevron-up" />
                </IconBtn>
                <IconBtn
                  @click="moveColumnDown(index)"
                  :disabled="index === columnSettings.length - 1"
                >
                  <VIcon icon="bx-chevron-down" />
                </IconBtn>
              </div>
            </template>
          </VListItem>
        </VList>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn @click="isColumnsDialogOpen = false">Закрыть</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Уведомления -->
  <VSnackbar
    v-model="isToastVisible"
    :color="toastColor"
    timeout="3000"
  >
    {{ toastMessage }}
  </VSnackbar>
</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}
</style>
