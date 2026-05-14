<script setup lang="ts">
import { $api } from '@/utils/api'
import { computed, onMounted, ref, watch } from 'vue'

// Типы данных для Сервис
interface Services {
  id: number
  name: string
  comment: string
  type: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  customers?: Customers[]
  attachments?: Attachment[]
  sla?: SLA | null
  hasAttachments?: boolean
}

// Типы данных для Компания
interface Customers {
  id: number
  name: string
  street: string
  zip: string
  city: string
  comment: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Типы данных для Вложения
interface Attachment {
  id: number
  serviceId: number
  fileName: string
  filePath: string
  fileSize: number | null
  mimeType: string | null
  uploadedBy: number | null
  createdAt: string
}

// Типы данных для SLA
interface SLA {
  id: number
  name: string
  comment: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}


// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Store
const searchQuery = ref('')
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

// Данные сервисы
const services = ref<Services[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Данные компаний для выбора
const customers = ref<Customers[]>([])
const customersLoading = ref(false)

// Данные SLA для выбора
const slas = ref<SLA[]>([])
const slasLoading = ref(false)

// Выбранные компании при редактировании
const selectedCustomerIds = ref<number[]>([])

// Загружаемые файлы
const uploadedFiles = ref<File[]>([])

// Существующие вложения сервиса
const existingAttachments = ref<Attachment[]>([])

// Выбранный SLA при редактировании (связь 1 к 1)
const selectedSLAId = ref<number | null>(null)

// Загрузка данных из API
const fetchServices = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('Fetching services from:', `${API_BASE}/services`)
    const data = await $api<{ services: Services[], total: number }>(`${API_BASE}/services`)
    console.log('Fetched services data:', data)
    services.value = data.services
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки сервисы'
    console.error('Error fetching services:', err)
  } finally {
    loading.value = false
  }
}

// Создание сервис
const createServices = async (item: Omit<Services, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $api<Services>(`${API_BASE}/services`, {
      method: 'POST',
      body: item
    })
    services.value.unshift(data) // Добавляем в начало массива
    return data
  } catch (err) {
    console.error('Error creating services:', err)
    throw err
  }
}

// Обновление сервис
const updateServices = async (id: number, item: Omit<Services, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $api<Services>(`${API_BASE}/services/${id}`, {
      method: 'PUT',
      body: item
    })
    const index = services.value.findIndex(p => p.id === id)
    if (index !== -1) {
      services.value[index] = data
    }
    return data
  } catch (err) {
    console.error('Error updating services:', err)
    throw err
  }
}

// Удаление сервис
const deleteServices = async (id: number) => {
  try {
    await $api(`${API_BASE}/services/${id}`, {
      method: 'DELETE'
    })
    const index = services.value.findIndex(p => p.id === id)
    if (index !== -1) {
      services.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Error deleting services:', err)
    throw err
  }
}

// Инициализация
onMounted(() => {
  fetchServices()
  fetchCustomers()
  fetchSLAs()
})

// Загрузка списка компаний
const fetchCustomers = async () => {
  try {
    customersLoading.value = true
    const data = await $api<{ customers: Customers[], total: number }>(`${API_BASE}/customers`)
    customers.value = data.customers || []
  } catch (err) {
    console.error('Error fetching customers:', err)
  } finally {
    customersLoading.value = false
  }
}

// Загрузка списка SLA
const fetchSLAs = async () => {
  try {
    slasLoading.value = true
    const data = await $api<{ sla: SLA[], total: number }>(`${API_BASE}/sla`)
    slas.value = data.sla || []
  } catch (err) {
    console.error('Error fetching SLAs:', err)
  } finally {
    slasLoading.value = false
  }
}

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Комментарий', key: 'comment', sortable: true },
  { title: 'Тип', key: 'type', sortable: true },
  { title: 'Компании', key: 'customers', sortable: false },
  { title: '', key: 'hasAttachments', sortable: false },
  { title: 'SLA', key: 'sla', sortable: false },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Фильтрация
const filteredServices = computed(() => {
  let filtered = services.value

  if (searchQuery.value.trim()) {
    // Фильтруем по поисковому запросу (по названию)
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p => p.name.toLowerCase().includes(query))
  }

  if (statusFilter.value !== null) {
    // Фильтруем по isActive: 1 = true (активен), 2 = false (не активен)
    filtered = filtered.filter(p => p.isActive === (statusFilter.value === 1))
  }

  if (selectedNames.value.length > 0) {
    // Фильтруем по выбранным названиям
    filtered = filtered.filter(p => selectedNames.value.includes(p.name))
  }

  if (selectedTypes.value.length > 0) {
    // Фильтруем по выбранным типам
    filtered = filtered.filter(p => selectedTypes.value.includes(p.type))
  }

  return filtered
})

// Сброс фильтров
const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = null
  selectedNames.value = []
  selectedTypes.value = []
}

// Уникальные названия для фильтра
const uniqueNames = computed(() => {
  const names = services.value.map(p => p.name)
  return [...new Set(names)].sort()
})

// Проверка активных фильтров
const hasActiveFilters = computed(() => {
  return statusFilter.value !== null || selectedNames.value.length > 0 || selectedTypes.value.length > 0
})

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
      await deleteServices(item.id)
    }
    selectedItems.value = []
    showToast(`Удалено ${count} сервисы`)
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmBulkStatusChange = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await updateServices(item.id, {
        ...item,
        isActive: bulkStatusValue.value === 1
      })
    }
    selectedItems.value = []
    showToast(`Статус изменен для ${count} сервисы`)
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

// Фильтры
const statusFilter = ref<number | null>(null)
const selectedNames = ref<string[]>([])
const selectedTypes = ref<string[]>([])
const searchNames = ref<string | null>(null)
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

// Ограничение количества выбранных названий
watch(selectedNames, (value) => {
  if (value.length > 10) {
    nextTick(() => selectedNames.value.pop())
  }
})

// Диалоги
const editDialog = ref(false)
const deleteDialog = ref(false)

const defaultItem = ref<Services>({
  id: -1,
  name: '',
  comment: '',
  type: '',
  createdAt: '',
  updatedAt: '',
  isActive: true,
})

const editedItem = ref<Services>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Опции типа
const typeOptions = [
  'Обучение',
  'Демонстрация',
  'Другое',
  'Интерфейсная часть',
  'Конечный сервис пользователя',
  'Контракт поддержки',
  'Планирование',
  'Сервисная часть',
  'Составление отчетов',
  'Управление ИТ',
  'Эксплуатация',
  'Ит'
]

// Методы
const editItem = async (item: Services) => {
  editedIndex.value = services.value.indexOf(item)
  
  // Загружаем полные данные сервиса с сервера
  try {
    const fullItem = await $api<Services>(`${API_BASE}/services/${item.id}`)
    editedItem.value = { ...fullItem }
    // Устанавливаем выбранные компании
    selectedCustomerIds.value = fullItem.customers?.map(c => c.id) || []
    // Устанавливаем существующие вложения
    existingAttachments.value = fullItem.attachments || []
    // Очищаем загружаемые файлы
    uploadedFiles.value = []
    // Устанавливаем выбранный SLA (связь 1 к 1)
    selectedSLAId.value = fullItem.sla?.id || null
  } catch (err) {
    console.error('Error loading service details:', err)
    // Fallback к локальным данным
    editedItem.value = { ...item }
    selectedCustomerIds.value = item.customers?.map(c => c.id) || []
    existingAttachments.value = item.attachments || []
    uploadedFiles.value = []
    selectedSLAId.value = item.sla?.id || null
  }
  
  editDialog.value = true
}

const deleteItem = (item: Services) => {
  editedIndex.value = services.value.indexOf(item)
  editedItem.value = { ...item }
  deleteDialog.value = true
}

const close = () => {
  editDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
  selectedCustomerIds.value = []
  uploadedFiles.value = []
  existingAttachments.value = []
  selectedSLAId.value = null
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
    // Извлекаем ID компаний из объектов (VCombobox может возвращать объекты вместо ID)
    const customerIds = selectedCustomerIds.value.map((item: any) => 
      typeof item === 'object' && item !== null ? item.id : item
    )

    // Извлекаем ID SLA из объекта (связь 1 к 1)
    const slaId = selectedSLAId.value ? (typeof selectedSLAId.value === 'object' ? (selectedSLAId.value as any).id : selectedSLAId.value) : null

    // Подготовка данных для отправки
    const serviceData = {
      name: editedItem.value.name,
      comment: editedItem.value.comment || '',
      type: editedItem.value.type || '',
      isActive: editedItem.value.isActive,
      customerIds: customerIds,
      slaId: slaId
    }

    if (editedIndex.value > -1) {
      // Обновление существующего
      const updated = await updateServices(editedItem.value.id, serviceData)
      
      // Загрузка новых файлов если есть
      if (uploadedFiles.value.length > 0) {
        await uploadFiles(editedItem.value.id)
      }
      
      showToast('Сервис успешно сохранен')
    } else {
      // Добавление нового
      const created = await createServices(serviceData)
      
      // Загрузка файлов для нового сервиса
      if (uploadedFiles.value.length > 0 && created.id) {
        await uploadFiles(created.id)
      }
      
      // Перезагружаем данные что бы получить актуальный список с сервера
      await fetchServices()
      showToast('Сервис успешно добавлен')
    }
    close()
  } catch (err) {
    showToast('Ошибка сохранения сервис', 'error')
  }
}

// Загрузка файлов на сервер
const uploadFiles = async (serviceId: number) => {
  try {
    const formData = new FormData()
    uploadedFiles.value.forEach((file) => {
      formData.append('files', file)
    })
    
    await $api(`${API_BASE}/services/${serviceId}/attachments`, {
      method: 'POST',
      body: formData
    })
    
    // Перезагружаем данные после загрузки файлов
    await fetchServices()
  } catch (err) {
    console.error('Error uploading files:', err)
    showToast('Ошибка загрузки файлов', 'error')
  }
}

// Удаление вложения
const removeAttachment = async (attachmentId: number) => {
  try {
    await $api(`${API_BASE}/services/${editedItem.value.id}/attachments/${attachmentId}`, {
      method: 'DELETE'
    })
    // Удаляем из списка существующих вложений
    existingAttachments.value = existingAttachments.value.filter(a => a.id !== attachmentId)
    showToast('Файл удален')
  } catch (err) {
    console.error('Error removing attachment:', err)
    showToast('Ошибка удаления файла', 'error')
  }
}

// Скачивание вложения
const downloadAttachment = async (attachment: Attachment) => {
  try {
    const response = await fetch(`${API_BASE}/services/${editedItem.value.id}/attachments/${attachment.id}/download`)
    if (!response.ok) throw new Error('Download failed')
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = attachment.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Error downloading file:', err)
    showToast('Ошибка скачивания файла', 'error')
  }
}

const deleteItemConfirm = async () => {
  try {
    await deleteServices(editedItem.value.id)
    showToast('Сервис успешно удален')
    closeDelete()
  } catch (err) {
    showToast('Ошибка удаления сервис', 'error')
  }
}

// Переключение статуса
const toggleStatus = async (item: Services, newValue: boolean | null) => {
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение isActive:', newValue)

  if (newValue === null) return

  try {
    await updateServices(item.id, {
      ...item,
      isActive: newValue
    })
    showToast('Статус сервис изменен')
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

// Добавление нового сервис
const addNewServices = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  selectedCustomerIds.value = []
  uploadedFiles.value = []
  existingAttachments.value = []
  selectedSLAId.value = null
  editDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="Сервисы">

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
            v-model="searchQuery"
            placeholder="Поиск сервисы"
            style="inline-size: 250px;"
            class="me-3"
          />
        </div>

        <!-- Кнопка фильтра -->
        <VBtn
          variant="tonal"
          color="secondary"
          :prepend-icon="hasActiveFilters ? 'bx-x' : 'bx-filter'"
          @click="hasActiveFilters ? clearFilters() : isFilterDialogOpen = true"
        >
          {{ hasActiveFilters ? 'Сбросить фильтр' : 'Фильтр' }}
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
            @click="addNewServices"
          >
            Добавить сервис
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
                <AppCombobox
                  v-model="selectedNames"
                  v-model:search-input="searchNames"
                  :items="uniqueNames"
                  hide-selected
                  :hide-no-data="false"
                  placeholder="Выберите названия"
                  hint="Максимум 10 названий"
                  label="Названия сервисов"
                  multiple
                  persistent-hint
                >
                  <template #no-data>
                    <VListItem>
                      <VListItemTitle>
                        Нет результатов для "<strong>{{ searchNames }}</strong>"
                      </VListItemTitle>
                    </VListItem>
                  </template>
                </AppCombobox>
              </VCol>
              <VCol cols="12" md="6">
                <AppCombobox
                  v-model="selectedTypes"
                  :items="typeOptions"
                  placeholder="Выберите типы"
                  label="Типы сервисов"
                  multiple
                  clearable
                  chips
                />
              </VCol>
              <VCol cols="12" md="6">
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
            Вы уверены, что хотите удалить выбранные сервисы? Это действие нельзя отменить.
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
        :headers="headers"
        :items="filteredServices"
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

        <!-- Компании -->
        <template #item.customers="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <VChip
              v-for="customer in item.customers"
              :key="customer.id"
              size="small"
              color="success"
              variant="outlined"
            >
              {{ customer.name }}
            </VChip>
            <span v-if="!item.customers || item.customers.length === 0" class="text-disabled">
              Нет компаний
            </span>
          </div>
        </template>

        <!-- Документы (иконка вложений - скрепка) -->
        <template #header.hasAttachments>
          <VTooltip location="top">
            <template #activator="{ props }">
              <VIcon
                v-bind="props"
                icon="bx-paperclip"
                size="20"
              />
            </template>
            <span>Документы</span>
          </VTooltip>
        </template>
        <template #item.hasAttachments="{ item }">
          <VTooltip v-if="item.hasAttachments" location="top">
            <template #activator="{ props }">
              <VIcon
                v-bind="props"
                icon="bx-paperclip"
                color="primary"
                size="24"
              />
            </template>
            <span>Есть прикрепленные документы</span>
          </VTooltip>
          <span v-else class="text-disabled">—</span>
        </template>

        <!-- SLA -->
        <template #item.sla="{ item }">
          <VChip
            v-if="item.sla"
            size="small"
            color="info"
            variant="outlined"
          >
            {{ item.sla.name }}
          </VChip>
          <span v-else class="text-disabled">Нет SLA</span>
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn v-if="$can('write','menu_services')" @click="editItem(item)">
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn v-if="$can('delete','menu_services')" @click="deleteItem(item)">
              <VIcon icon="bx-trash" />
            </IconBtn>
          </div>
        </template>
      </VDataTable>

      <!-- Пагинация -->
      <div class="d-flex justify-center mt-4 pb-4">
        <VPagination
          v-model="currentPage"
          :length="Math.ceil(filteredServices.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать сервис' : 'Добавить сервис'">
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

            <!-- Тип -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.type"
                :items="typeOptions"
                label="Тип"
                placeholder="Выберите тип"
                clearable
              />
            </VCol>

            <!-- Комментарий -->
            <VCol
              cols="12"

            >
              <AppTextarea
                v-model="editedItem.comment"
                label="Комментарий"
                rows="3"
                placeholder="Введите комментарий..."
              />
            </VCol>

            <!-- Компании -->
            <VCol cols="12">
              <AppCombobox
                v-model="selectedCustomerIds"
                :items="customers"
                item-title="name"
                item-value="id"
                label="Компании"
                placeholder="Выберите компании"
                multiple
                chips
                closable-chips
                :loading="customersLoading"
                hint="Выберите одну или несколько компаний"
                persistent-hint
              />
            </VCol>

            <!-- Вложения (документы) -->
            <VCol cols="12">
              <VFileInput
                v-model="uploadedFiles"
                label="Документы"
                placeholder="Выберите файлы для загрузки"
                multiple
                chips
                prepend-icon="bx-paperclip"
                hint="Выберите файлы для прикрепления к сервису"
                persistent-hint
              />
              
              <!-- Список существующих вложений -->
              <div v-if="existingAttachments.length > 0" class="mt-4">
                <p class="text-body-2 mb-2">Прикрепленные файлы:</p>
                <VList density="compact">
                  <VListItem
                    v-for="attachment in existingAttachments"
                    :key="attachment.id"
                    :title="attachment.fileName"
                    :subtitle="attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(1)} КБ` : ''"
                    class="px-0"
                  >
                    <template #append>
                      <div class="d-flex gap-1">
                        <IconBtn
                          color="primary"
                          size="small"
                          @click="downloadAttachment(attachment)"
                        >
                          <VIcon icon="bx-download" size="18" />
                        </IconBtn>
                        <IconBtn
                          color="error"
                          size="small"
                          @click="removeAttachment(attachment.id)"
                        >
                          <VIcon icon="bx-trash" size="18" />
                        </IconBtn>
                      </div>
                    </template>
                    <template #prepend>
                      <VIcon icon="bx-file" size="20" />
                    </template>
                  </VListItem>
                </VList>
              </div>
            </VCol>

            <!-- SLA -->
            <VCol cols="12">
              <AppSelect
                v-model="selectedSLAId"
                :items="slas"
                item-title="name"
                item-value="id"
                label="SLA"
                placeholder="Выберите SLA"
                clearable
                :loading="slasLoading"
                hint="Выберите SLA для сервиса"
                persistent-hint
              />
            </VCol>

            <!-- Активен -->
            <VCol
              cols="12"
              md="6"
            >
              <VSwitch
                v-model="editedItem.isActive"
                :label="editedItem.isActive ? 'Активен' : 'Не активен'"
                color="primary"
                density="compact"
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
      <VCard title="Вы уверены, что хотите удалить этот сервис?">
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
