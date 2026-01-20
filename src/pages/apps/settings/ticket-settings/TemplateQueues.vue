<script setup lang="ts">
import TemplateCards from '@/views/apps/template-queues/TemplateCards.vue'
import { $fetch } from 'ofetch'
import { computed, onMounted, ref } from 'vue'

// Типы данных для Шаблон
interface Templates {
  id: number
  name: string
  message: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Типы данных для Очередь
interface Queues {
  id: number
  name: string
  description: string
  maxTickets: number
  priority: number
  templateId: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Данные шаблонов
const templates = ref<Templates[]>([])
const templatesTotal = ref(0)
const templatesLoading = ref(false)
const templatesError = ref<string | null>(null)

// Данные очередей
const queues = ref<Queues[]>([])
const queuesTotal = ref(0)
const queuesLoading = ref(false)
const queuesError = ref<string | null>(null)

// Загрузка данных шаблонов из API
const fetchTemplates = async () => {
  try {
    templatesLoading.value = true
    templatesError.value = null
    console.log('Fetching templates from:', `${API_BASE}/templates`)
    const data = await $fetch<{ templates: Templates[], total: number }>(`${API_BASE}/templates`)
    console.log('Fetched templates data:', data)
    templates.value = data.templates
    templatesTotal.value = data.total
  } catch (err) {
    templatesError.value = 'Ошибка загрузки шаблонов'
    console.error('Error fetching templates:', err)
  } finally {
    templatesLoading.value = false
  }
}

// Загрузка данных очередей из API
const fetchQueues = async () => {
  try {
    queuesLoading.value = true
    queuesError.value = null
    console.log('Fetching queues from:', `${API_BASE}/queues`)
    const data = await $fetch<{ queues: Queues[], total: number }>(`${API_BASE}/queues`)
    console.log('Fetched queues data:', data)
    queues.value = data.queues
    queuesTotal.value = data.total
  } catch (err) {
    queuesError.value = 'Ошибка загрузки очередей'
    console.error('Error fetching queues:', err)
  } finally {
    queuesLoading.value = false
  }
}

// Создание шаблона
const createTemplates = async (item: Omit<Templates, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<Templates>(`${API_BASE}/templates`, {
      method: 'POST',
      body: item
    })
    templates.value.push(data)
    return data
  } catch (err) {
    console.error('Error creating templates:', err)
    throw err
  }
}

// Обновление шаблона
const updateTemplates = async (id: number, item: Omit<Templates, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<Templates>(`${API_BASE}/templates/${id}`, {
      method: 'PUT',
      body: item
    })
    const index = templates.value.findIndex(p => p.id === id)
    if (index !== -1) {
      templates.value[index] = data
    }
    return data
  } catch (err) {
    console.error('Error updating templates:', err)
    throw err
  }
}

// Удаление шаблона
const deleteTemplates = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/templates/${id}`, {
      method: 'DELETE'
    })
    const index = templates.value.findIndex(p => p.id === id)
    if (index !== -1) {
      templates.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Error deleting templates:', err)
    throw err
  }
}

// Создание очереди
const createQueues = async (item: Omit<Queues, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<Queues>(`${API_BASE}/queues`, {
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

// Обновление очереди
const updateQueues = async (id: number, item: Omit<Queues, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<Queues>(`${API_BASE}/queues/${id}`, {
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

// Удаление очереди
const deleteQueues = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/queues/${id}`, {
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

// Инициализация
onMounted(() => {
  fetchTemplates()
  fetchQueues()
})

// Headers для шаблонов
const templatesHeaders = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Сообщение', key: 'message', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Headers для очередей
const queuesHeaders = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Описание', key: 'description', sortable: true },
  { title: 'Макс. тикетов', key: 'maxTickets', sortable: true },
  { title: 'Приоритет', key: 'priority', sortable: true },
  { title: 'Шаблон', key: 'templateName', sortable: false },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Фильтрация шаблонов
const filteredTemplates = computed(() => {
  let filtered = templates.value
  if (templatesStatusFilter.value !== null) {
    filtered = filtered.filter(p => p.isActive === (templatesStatusFilter.value === 1))
  }
  return filtered
})

// Фильтрация очередей
const filteredQueues = computed(() => {
  let filtered = queues.value.map(queue => ({
    ...queue,
    templateName: templates.value.find(t => t.id === queue.templateId)?.name || 'Не указан'
  }))
  if (queuesStatusFilter.value !== null) {
    filtered = filtered.filter(p => p.isActive === (queuesStatusFilter.value === 1))
  }
  return filtered
})

// Сброс фильтров
const clearTemplatesFilters = () => {
  templatesStatusFilter.value = null
}

const clearQueuesFilters = () => {
  queuesStatusFilter.value = null
}

// Массовые действия для шаблонов
const templatesBulkDelete = () => {
  isTemplatesBulkDeleteDialogOpen.value = true
}

const templatesBulkChangeStatus = () => {
  isTemplatesBulkStatusDialogOpen.value = true
}

const confirmTemplatesBulkDelete = async () => {
  try {
    const count = templatesSelectedItems.value.length
    for (const item of templatesSelectedItems.value) {
      await deleteTemplates(item.id)
    }
    templatesSelectedItems.value = []
    showToast(`Удалено ${count} шаблонов`)
    isTemplatesBulkDeleteDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmTemplatesBulkStatusChange = async () => {
  try {
    const count = templatesSelectedItems.value.length
    for (const item of templatesSelectedItems.value) {
      await updateTemplates(item.id, {
        ...item,
        isActive: templatesBulkStatusValue.value === 1
      })
    }
    templatesSelectedItems.value = []
    showToast(`Статус изменен для ${count} шаблонов`)
    isTemplatesBulkStatusDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового изменения статуса', 'error')
  }
}

// Массовые действия для очередей
const queuesBulkDelete = () => {
  isQueuesBulkDeleteDialogOpen.value = true
}

const queuesBulkChangeStatus = () => {
  isQueuesBulkStatusDialogOpen.value = true
}

const confirmQueuesBulkDelete = async () => {
  try {
    const count = queuesSelectedItems.value.length
    for (const item of queuesSelectedItems.value) {
      await deleteQueues(item.id)
    }
    queuesSelectedItems.value = []
    showToast(`Удалено ${count} очередей`)
    isQueuesBulkDeleteDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmQueuesBulkStatusChange = async () => {
  try {
    const count = queuesSelectedItems.value.length
    for (const item of queuesSelectedItems.value) {
      await updateQueues(item.id, {
        ...item,
        isActive: queuesBulkStatusValue.value === 1
      })
    }
    queuesSelectedItems.value = []
    showToast(`Статус изменен для ${count} очередей`)
    isQueuesBulkStatusDialogOpen.value = false
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
const templatesCurrentPage = ref(1)
const templatesItemsPerPage = ref(10)
const queuesCurrentPage = ref(1)
const queuesItemsPerPage = ref(10)

// Фильтры
const templatesStatusFilter = ref<number | null>(null)
const queuesStatusFilter = ref<number | null>(null)
const templatesFilterDialogOpen = ref(false)
const queuesFilterDialogOpen = ref(false)

// Массовые действия
const templatesSelectedItems = ref<any[]>([])
const queuesSelectedItems = ref<any[]>([])
const templatesBulkActionsMenuOpen = ref(false)
const queuesBulkActionsMenuOpen = ref(false)
const isTemplatesBulkDeleteDialogOpen = ref(false)
const isTemplatesBulkStatusDialogOpen = ref(false)
const isQueuesBulkDeleteDialogOpen = ref(false)
const isQueuesBulkStatusDialogOpen = ref(false)
const templatesBulkStatusValue = ref<number>(1)
const queuesBulkStatusValue = ref<number>(1)

// Диалоги
const templatesEditDialog = ref(false)
const templatesDeleteDialog = ref(false)
const queuesEditDialog = ref(false)
const queuesDeleteDialog = ref(false)

const defaultTemplatesItem = ref<Templates>({
  id: -1,
  name: '',
  message: '',
  createdAt: '',
  updatedAt: '',
  isActive: true,
})

const defaultQueuesItem = ref<Queues>({
  id: -1,
  name: '',
  description: '',
  maxTickets: 0,
  priority: 0,
  templateId: null,
  createdAt: '',
  updatedAt: '',
  isActive: true,
})

const editedTemplatesItem = ref<Templates>({ ...defaultTemplatesItem.value })
const editedQueuesItem = ref<Queues>({ ...defaultQueuesItem.value })
const editedTemplatesIndex = ref(-1)
const editedQueuesIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Опции шаблонов для выбора
const templateOptions = computed(() => {
  return templates.value.map(t => ({ title: t.name, value: t.id }))
})

// Методы для шаблонов
const editTemplatesItem = (item: Templates) => {
  editedTemplatesIndex.value = templates.value.indexOf(item)
  editedTemplatesItem.value = { ...item }
  templatesEditDialog.value = true
}

const deleteTemplatesItem = (item: Templates) => {
  editedTemplatesIndex.value = templates.value.indexOf(item)
  editedTemplatesItem.value = { ...item }
  templatesDeleteDialog.value = true
}

const closeTemplates = () => {
  templatesEditDialog.value = false
  editedTemplatesIndex.value = -1
  editedTemplatesItem.value = { ...defaultTemplatesItem.value }
}

const closeTemplatesDelete = () => {
  templatesDeleteDialog.value = false
  editedTemplatesIndex.value = -1
  editedTemplatesItem.value = { ...defaultTemplatesItem.value }
}

const saveTemplates = async () => {
  if (!editedTemplatesItem.value.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  try {
    if (editedTemplatesIndex.value > -1) {
      const updated = await updateTemplates(editedTemplatesItem.value.id, {
        ...editedTemplatesItem.value,
        isActive: editedTemplatesItem.value.isActive
      })
      showToast('Шаблон успешно сохранен')
    } else {
      const created = await createTemplates({
        ...editedTemplatesItem.value,
        isActive: editedTemplatesItem.value.isActive
      })
      showToast('Шаблон успешно добавлен')
    }
    closeTemplates()
  } catch (err) {
    showToast('Ошибка сохранения шаблона', 'error')
  }
}

const deleteTemplatesItemConfirm = async () => {
  try {
    await deleteTemplates(editedTemplatesItem.value.id)
    showToast('Шаблон успешно удален')
    closeTemplatesDelete()
  } catch (err) {
    showToast('Ошибка удаления шаблона', 'error')
  }
}

const toggleTemplatesStatus = async (item: Templates, newValue: boolean | null) => {
  if (newValue === null) return
  try {
    await updateTemplates(item.id, {
      ...item,
      isActive: newValue
    })
    showToast('Статус шаблона изменен')
  } catch (err) {
    showToast('Ошибка изменения статуса', 'error')
  }
}

// Методы для очередей
const editQueuesItem = (item: Queues) => {
  editedQueuesIndex.value = queues.value.indexOf(item)
  editedQueuesItem.value = { ...item }
  queuesEditDialog.value = true
}

const deleteQueuesItem = (item: Queues) => {
  editedQueuesIndex.value = queues.value.indexOf(item)
  editedQueuesItem.value = { ...item }
  queuesDeleteDialog.value = true
}

const closeQueues = () => {
  queuesEditDialog.value = false
  editedQueuesIndex.value = -1
  editedQueuesItem.value = { ...defaultQueuesItem.value }
}

const closeQueuesDelete = () => {
  queuesDeleteDialog.value = false
  editedQueuesIndex.value = -1
  editedQueuesItem.value = { ...defaultQueuesItem.value }
}

const saveQueues = async () => {
  if (!editedQueuesItem.value.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  try {
    if (editedQueuesIndex.value > -1) {
      const updated = await updateQueues(editedQueuesItem.value.id, {
        ...editedQueuesItem.value,
        isActive: editedQueuesItem.value.isActive
      })
      showToast('Очередь успешно сохранена')
    } else {
      const created = await createQueues({
        ...editedQueuesItem.value,
        isActive: editedQueuesItem.value.isActive
      })
      showToast('Очередь успешно добавлена')
    }
    closeQueues()
  } catch (err) {
    showToast('Ошибка сохранения очереди', 'error')
  }
}

const deleteQueuesItemConfirm = async () => {
  try {
    await deleteQueues(editedQueuesItem.value.id)
    showToast('Очередь успешно удалена')
    closeQueuesDelete()
  } catch (err) {
    showToast('Ошибка удаления очереди', 'error')
  }
}

const toggleQueuesStatus = async (item: Queues, newValue: boolean | null) => {
  if (newValue === null) return
  try {
    await updateQueues(item.id, {
      ...item,
      isActive: newValue
    })
    showToast('Статус очереди изменен')
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

// Добавление новых элементов
const addNewTemplates = () => {
  editedTemplatesItem.value = { ...defaultTemplatesItem.value }
  editedTemplatesIndex.value = -1
  templatesEditDialog.value = true
}

const addNewQueues = () => {
  editedQueuesItem.value = { ...defaultQueuesItem.value }
  editedQueuesIndex.value = -1
  queuesEditDialog.value = true
}

// Переключатель вида шаблонов (карточки/таблица)
const templatesViewMode = ref<'cards' | 'table'>('cards')
</script>

<template>
  <VRow>
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        Шаблоны и Очереди
      </h4>
      <p class="text-body-1 mb-0">
        Управление шаблонами и очередями тикетов. Каждая очередь может быть связана с одним шаблоном.
      </p>
    </VCol>

    <!-- Шаблоны -->
    <VCol cols="12">
      <div class="d-flex justify-space-between align-center mb-1">
        <div>
          <h4 class="text-h4 mb-1">
            Шаблоны
          </h4>
          <p class="text-body-1 mb-0">
            Шаблоны предоставляют доступ к предопределенным сообщениям и настройкам, чтобы в зависимости от назначенного шаблона администратор имел доступ к тому, что ему нужно.
          </p>
        </div>
        <VBtnToggle
          v-model="templatesViewMode"
          mandatory
          variant="outlined"
          divided
        >
          <VBtn value="cards" icon="bx-grid-alt" />
          <VBtn value="table" icon="bx-list-ul" />
        </VBtnToggle>
      </div>
    </VCol>

    <!-- Карточный вид -->
    <VCol v-if="templatesViewMode === 'cards'" cols="12">
      <TemplateCards
        :templates="filteredTemplates"
        :loading="templatesLoading"
        @edit="editTemplatesItem"
        @delete="deleteTemplatesItem"
        @add="addNewTemplates"
      />
    </VCol>

    <!-- Табличный вид -->
    <VCol v-else cols="12">
      <VCard title="Шаблоны">
        <!-- Индикатор загрузки -->
        <div v-if="templatesLoading" class="d-flex justify-center pa-6">
          <VProgressCircular indeterminate color="primary" />
        </div>

        <!-- Сообщение об ошибке -->
        <div v-else-if="templatesError" class="d-flex justify-center pa-6">
          <VAlert type="error" class="ma-4">
            {{ templatesError }}
          </VAlert>
        </div>

        <div v-else class="d-flex flex-wrap gap-4 pa-6">
          <div class="d-flex align-center">
            <!-- Поиск -->
            <AppTextField
              placeholder="Поиск шаблонов"
              style="inline-size: 250px;"
              class="me-3"
            />
          </div>

          <!-- Кнопка фильтра -->
          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="bx-filter"
            @click="templatesFilterDialogOpen = true"
          >
            Фильтр
          </VBtn>

          <!-- Кнопка массовых действий -->
          <VMenu
            v-model="templatesBulkActionsMenuOpen"
            :close-on-content-click="false"
          >
            <template #activator="{ props }">
              <VBtn
                variant="tonal"
                color="secondary"
                prepend-icon="bx-dots-vertical-rounded"
                :disabled="templatesSelectedItems.length === 0"
                v-bind="props"
              >
                Действия ({{ templatesSelectedItems.length }})
              </VBtn>
            </template>
            <VList>
              <VListItem
                @click="() => {
                  templatesBulkDelete()
                  templatesBulkActionsMenuOpen = false
                }"
              >
                <VListItemTitle>Удалить</VListItemTitle>
              </VListItem>
              <VListItem
                @click="() => {
                  templatesBulkChangeStatus()
                  templatesBulkActionsMenuOpen = false
                }"
              >
                <VListItemTitle>Изменить статус</VListItemTitle>
              </VListItem>
            </VList>
          </VMenu>

          <VSpacer />
          <div class="d-flex gap-4 flex-wrap align-center">
            <AppSelect
              v-model="templatesItemsPerPage"
              :items="[5, 10, 20, 25, 50]"
            />
            <!-- Экспорт -->
            <VBtn
              variant="tonal"
              color="secondary"
              prepend-icon="bx-export"
            >
              Экспорт
            </VBtn>

            <VBtn
              color="primary"
              prepend-icon="bx-plus"
              @click="addNewTemplates"
            >
              Добавить шаблон
            </VBtn>
          </div>
        </div>

        <!-- Диалог фильтров шаблонов -->
        <VDialog
          v-model="templatesFilterDialogOpen"
          max-width="500px"
        >
          <VCard title="Фильтры">
            <VCardText>
              <VRow>
                <VCol cols="12">
                  <AppSelect
                    v-model="templatesStatusFilter"
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
                  @click="clearTemplatesFilters"
                >
                  Сбросить
                </VBtn>
                <VBtn
                  color="error"
                  variant="outlined"
                  @click="templatesFilterDialogOpen = false"
                >
                  Отмена
                </VBtn>
                <VBtn
                  color="success"
                  variant="elevated"
                  @click="templatesFilterDialogOpen = false"
                >
                  Применить
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VDialog>

        <VDivider />

        <!-- Таблица шаблонов -->
        <VDataTable
          v-model="templatesSelectedItems"
          v-model:items-per-page="templatesItemsPerPage"
          v-model:page="templatesCurrentPage"
          :headers="templatesHeaders"
          :items="filteredTemplates"
          show-select
          :hide-default-footer="true"
          item-value="id"
          return-object
          no-data-text="Нет данных"
        >
          <!-- Активен -->
          <template #item.isActive="{ item }">
            <div class="d-flex align-center gap-2">
              <VSwitch
                :model-value="item.isActive"
                @update:model-value="(val) => toggleTemplatesStatus(item, val)"
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
              <IconBtn @click="editTemplatesItem(item)">
                <VIcon icon="bx-edit" />
              </IconBtn>
              <IconBtn @click="deleteTemplatesItem(item)">
                <VIcon icon="bx-trash" />
              </IconBtn>
            </div>
          </template>
        </VDataTable>

        <!-- Пагинация шаблонов -->
        <div class="d-flex justify-center mt-4 pb-4">
          <VPagination
            v-model="templatesCurrentPage"
            :length="Math.ceil(filteredTemplates.length / templatesItemsPerPage) || 1"
            :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
          />
        </div>
      </VCard>
    </VCol>

    <!-- Очереди -->
    <VCol cols="12">
      <h4 class="text-h4 mb-1 mt-6">
        Очереди
      </h4>
      <p class="text-body-1 mb-0">
        Найдите все очереди вашей компании и их связанные шаблоны.
      </p>
    </VCol>

    <VCol cols="12">
      <VCard title="Очереди">

        <!-- Индикатор загрузки -->
        <div v-if="queuesLoading" class="d-flex justify-center pa-6">
          <VProgressCircular indeterminate color="primary" />
        </div>

        <!-- Сообщение об ошибке -->
        <div v-else-if="queuesError" class="d-flex justify-center pa-6">
          <VAlert type="error" class="ma-4">
            {{ queuesError }}
          </VAlert>
        </div>

        <div v-else class="d-flex flex-wrap gap-4 pa-6">
          <div class="d-flex align-center">
            <!-- Поиск -->
            <AppTextField
              placeholder="Поиск очередей"
              style="inline-size: 250px;"
              class="me-3"
            />
          </div>

          <!-- Кнопка фильтра -->
          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="bx-filter"
            @click="queuesFilterDialogOpen = true"
          >
            Фильтр
          </VBtn>

          <!-- Кнопка массовых действий -->
          <VMenu
            v-model="queuesBulkActionsMenuOpen"
            :close-on-content-click="false"
          >
            <template #activator="{ props }">
              <VBtn
                variant="tonal"
                color="secondary"
                prepend-icon="bx-dots-vertical-rounded"
                :disabled="queuesSelectedItems.length === 0"
                v-bind="props"
              >
                Действия ({{ queuesSelectedItems.length }})
              </VBtn>
            </template>
            <VList>
              <VListItem
                @click="() => {
                  queuesBulkDelete()
                  queuesBulkActionsMenuOpen = false
                }"
              >
                <VListItemTitle>Удалить</VListItemTitle>
              </VListItem>
              <VListItem
                @click="() => {
                  queuesBulkChangeStatus()
                  queuesBulkActionsMenuOpen = false
                }"
              >
                <VListItemTitle>Изменить статус</VListItemTitle>
              </VListItem>
            </VList>
          </VMenu>

          <VSpacer />
          <div class="d-flex gap-4 flex-wrap align-center">
            <AppSelect
              v-model="queuesItemsPerPage"
              :items="[5, 10, 20, 25, 50]"
            />
            <!-- Экспорт -->
            <VBtn
              variant="tonal"
              color="secondary"
              prepend-icon="bx-export"
            >
              Экспорт
            </VBtn>

            <VBtn
              color="primary"
              prepend-icon="bx-plus"
              @click="addNewQueues"
            >
              Добавить очередь
            </VBtn>
          </div>
        </div>

        <!-- Диалог фильтров очередей -->
        <VDialog
          v-model="queuesFilterDialogOpen"
          max-width="500px"
        >
          <VCard title="Фильтры">
            <VCardText>
              <VRow>
                <VCol cols="12">
                  <AppSelect
                    v-model="queuesStatusFilter"
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
                  @click="clearQueuesFilters"
                >
                  Сбросить
                </VBtn>
                <VBtn
                  color="error"
                  variant="outlined"
                  @click="queuesFilterDialogOpen = false"
                >
                  Отмена
                </VBtn>
                <VBtn
                  color="success"
                  variant="elevated"
                  @click="queuesFilterDialogOpen = false"
                >
                  Применить
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VDialog>

        <!-- Диалог массового удаления очередей -->
        <VDialog
          v-model="isQueuesBulkDeleteDialogOpen"
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
                  @click="isQueuesBulkDeleteDialogOpen = false"
                >
                  Отмена
                </VBtn>
                <VBtn
                  color="success"
                  variant="elevated"
                  @click="confirmQueuesBulkDelete"
                >
                  Удалить
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VDialog>

        <!-- Диалог массового изменения статуса очередей -->
        <VDialog
          v-model="isQueuesBulkStatusDialogOpen"
          max-width="500px"
        >
          <VCard title="Изменить статус">
            <VCardText>
              <AppSelect
                v-model="queuesBulkStatusValue"
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
                  @click="isQueuesBulkStatusDialogOpen = false"
                >
                  Отмена
                </VBtn>
                <VBtn
                  color="success"
                  variant="elevated"
                  @click="confirmQueuesBulkStatusChange"
                >
                  Применить
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VDialog>

        <VDivider />

        <!-- Таблица очередей -->
        <VDataTable
          v-model="queuesSelectedItems"
          v-model:items-per-page="queuesItemsPerPage"
          v-model:page="queuesCurrentPage"
          :headers="queuesHeaders"
          :items="filteredQueues"
          show-select
          :hide-default-footer="true"
          item-value="id"
          return-object
          no-data-text="Нет данных"
        >
          <!-- Активен -->
          <template #item.isActive="{ item }">
            <div class="d-flex align-center gap-2">
              <VSwitch
                :model-value="item.isActive"
                @update:model-value="(val) => toggleQueuesStatus(item, val)"
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
              <IconBtn @click="editQueuesItem(item)">
                <VIcon icon="bx-edit" />
              </IconBtn>
              <IconBtn @click="deleteQueuesItem(item)">
                <VIcon icon="bx-trash" />
              </IconBtn>
            </div>
          </template>
        </VDataTable>

        <!-- Пагинация очередей -->
        <div class="d-flex justify-center mt-4 pb-4">
          <VPagination
            v-model="queuesCurrentPage"
            :length="Math.ceil(filteredQueues.length / queuesItemsPerPage) || 1"
            :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
          />
        </div>
      </VCard>
    </VCol>

    <!-- Диалог редактирования шаблона -->
    <VDialog
      v-model="templatesEditDialog"
      max-width="600px"
    >
      <VCard :title="editedTemplatesIndex > -1 ? 'Редактировать шаблон' : 'Добавить шаблон'">
        <VCardText>
          <VRow>
            <!-- Название -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedTemplatesItem.name"
                label="Название *"
              />
            </VCol>

            <!-- Сообщение -->
            <VCol cols="12">
              <AppTextarea
                v-model="editedTemplatesItem.message"
                label="Сообщение"
                rows="3"
                placeholder="Введите сообщение..."
              />
            </VCol>

            <!-- Активен -->
            <VCol cols="12" sm="6">
              <VSwitch
                v-model="editedTemplatesItem.isActive"
                label="Активен"
                color="primary"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VCardText>
          <div class="d-flex gap-4 justify-end">
            <VBtn
              color="error"
              variant="outlined"
              @click="closeTemplates"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="saveTemplates"
            >
              Сохранить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог удаления шаблона -->
    <VDialog
      v-model="templatesDeleteDialog"
      max-width="500px"
    >
      <VCard title="Вы уверены, что хотите удалить этот шаблон?">
        <VCardText>
          <div class="d-flex justify-center gap-4">
            <VBtn
              color="error"
              variant="outlined"
              @click="closeTemplatesDelete"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="deleteTemplatesItemConfirm"
            >
              Удалить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог редактирования очереди -->
    <VDialog
      v-model="queuesEditDialog"
      max-width="600px"
    >
      <VCard :title="editedQueuesIndex > -1 ? 'Редактировать очередь' : 'Добавить очередь'">
        <VCardText>
          <VRow>
            <!-- Название -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedQueuesItem.name"
                label="Название *"
              />
            </VCol>

            <!-- Шаблон -->
            <VCol cols="12" sm="6">
              <AppSelect
                v-model="editedQueuesItem.templateId"
                :items="templateOptions"
                label="Шаблон"
                clearable
                placeholder="Выберите шаблон"
              />
            </VCol>

            <!-- Описание -->
            <VCol cols="12">
              <AppTextarea
                v-model="editedQueuesItem.description"
                label="Описание"
                rows="3"
                placeholder="Введите описание..."
              />
            </VCol>

            <!-- Макс. тикетов -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedQueuesItem.maxTickets"
                label="Макс. тикетов"
                type="number"
                min="0"
              />
            </VCol>

            <!-- Приоритет -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedQueuesItem.priority"
                label="Приоритет"
                type="number"
                min="0"
              />
            </VCol>

            <!-- Активен -->
            <VCol cols="12" sm="6">
              <VSwitch
                v-model="editedQueuesItem.isActive"
                label="Активен"
                color="primary"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VCardText>
          <div class="d-flex gap-4 justify-end">
            <VBtn
              color="error"
              variant="outlined"
              @click="closeQueues"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="saveQueues"
            >
              Сохранить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог удаления очереди -->
    <VDialog
      v-model="queuesDeleteDialog"
      max-width="500px"
    >
      <VCard title="Вы уверены, что хотите удалить эту очередь?">
        <VCardText>
          <div class="d-flex justify-center gap-4">
            <VBtn
              color="error"
              variant="outlined"
              @click="closeQueuesDelete"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="deleteQueuesItemConfirm"
            >
              Удалить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </VRow>

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
