<script setup lang="ts">
import { computed, nextTick, watch, onMounted, ref } from 'vue'
import { $api } from '@/utils/api'
import { useEntityCrud, type BaseEntity } from '@/composables/useEntityCrud'
import { useToast } from '@/composables/useToast'

// Типы данных для Сервис
interface Services extends BaseEntity {
  name: string
  comment: string
  type: string
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

// Универсальный CRUD (без кастомного save/editItem — используем свои)
const {
  items: services,
  loading,
  error,
  fetchItems: fetchServices,
  editDialog,
  deleteDialog,
  editedItem,
  editedIndex,
  currentPage,
  itemsPerPage,
  searchQuery,
  statusFilter,
  filteredItems: baseFilteredItems,
  selectedItems,
  isBulkActionsMenuOpen,
  isBulkDeleteDialogOpen,
  isBulkStatusDialogOpen,
  bulkStatusValue,
  statusOptions,
  bulkDelete,
  bulkChangeStatus,
  confirmBulkDelete,
  confirmBulkStatusChange,
  resolveStatusVariant,
  toggleStatus,
  isFilterDialogOpen,
  editItem: baseEditItem,
  deleteItem: baseDeleteItem,
  close: baseClose,
  closeDelete,
  deleteItemConfirm,
  addNewItem: addNewServices,
} = useEntityCrud<Services>({
  endpoint: '/services',
  itemName: 'сервисы',
  defaultItem: {
    id: -1,
    name: '',
    comment: '',
    type: '',
    createdAt: '',
    updatedAt: '',
    isActive: true,
  },
})

// === Справочники ===
const customers = ref<Customers[]>([])
const customersLoading = ref(false)
const slas = ref<SLA[]>([])
const slasLoading = ref(false)

// Выбранные компании при редактировании
const selectedCustomerIds = ref<number[]>([])
const uploadedFiles = ref<File[]>([])
const existingAttachments = ref<Attachment[]>([])
const selectedSLAId = ref<number | null>(null)

// === Загрузка справочников ===
const fetchCustomers = async () => {
  try {
    customersLoading.value = true
    const data = await $api<{ customers: Customers[]; total: number }>(`${API_BASE}/customers`)
    customers.value = data.customers || []
  }
  catch (err) {
    console.error('Error fetching customers:', err)
  }
  finally {
    customersLoading.value = false
  }
}

const fetchSLAs = async () => {
  try {
    slasLoading.value = true
    const data = await $api<{ sla: SLA[]; total: number }>(`${API_BASE}/sla`)
    slas.value = data.sla || []
  }
  catch (err) {
    console.error('Error fetching SLAs:', err)
  }
  finally {
    slasLoading.value = false
  }
}

// === Инициализация ===
onMounted(() => {
  fetchCustomers()
  fetchSLAs()
  fetchServices()
})

// === Заголовки таблицы ===
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
  { title: 'Действия', key: 'actions', sortable: false },
]

// === Фильтрация ===
const selectedNames = ref<string[]>([])
const selectedTypes = ref<string[]>([])
const searchNames = ref<string | null>(null)

const uniqueNames = computed(() => {
  const names = services.value.map(p => p.name)
  return [...new Set(names)].sort()
})

const hasActiveFilters = computed(() => {
  return statusFilter.value !== null || selectedNames.value.length > 0 || selectedTypes.value.length > 0
})

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = null
  selectedNames.value = []
  selectedTypes.value = []
}

const filteredServices = computed(() => {
  let filtered = baseFilteredItems.value
  if (selectedNames.value.length > 0)
    filtered = filtered.filter(p => selectedNames.value.includes(p.name))
  if (selectedTypes.value.length > 0)
    filtered = filtered.filter(p => selectedTypes.value.includes(p.type))
  return filtered
})

watch(selectedNames, value => {
  if (value.length > 10)
    nextTick(() => selectedNames.value.pop())
})

// === Опции типа ===
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
  'Ит',
]

// === Кастомные методы ===
const editItem = async (item: Services) => {
  editedIndex.value = services.value.indexOf(item)
  try {
    const fullItem = await $api<Services>(`${API_BASE}/services/${item.id}`)
    editedItem.value = { ...fullItem }
    selectedCustomerIds.value = fullItem.customers?.map(c => c.id) || []
    existingAttachments.value = fullItem.attachments || []
    uploadedFiles.value = []
    selectedSLAId.value = fullItem.sla?.id || null
  }
  catch (err) {
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
  editedItem.value = {
    id: -1,
    name: '',
    comment: '',
    type: '',
    createdAt: '',
    updatedAt: '',
    isActive: true,
  }
  selectedCustomerIds.value = []
  uploadedFiles.value = []
  existingAttachments.value = []
  selectedSLAId.value = null
}

const save = async () => {
  if (!editedItem.value.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  try {
    const customerIds = selectedCustomerIds.value.map((item: any) =>
      typeof item === 'object' && item !== null ? item.id : item,
    )
    const slaId = selectedSLAId.value
      ? (typeof selectedSLAId.value === 'object' ? (selectedSLAId.value as any).id : selectedSLAId.value)
      : null

    const serviceData = {
      name: editedItem.value.name,
      comment: editedItem.value.comment || '',
      type: editedItem.value.type || '',
      isActive: editedItem.value.isActive,
      customerIds,
      slaId,
    }

    if (editedIndex.value > -1) {
      await $api(`${API_BASE}/services/${editedItem.value.id}`, {
        method: 'PUT',
        body: serviceData,
      })
      if (uploadedFiles.value.length > 0)
        await uploadFiles(editedItem.value.id)
      showToast('Сервис успешно сохранен')
    }
    else {
      const created = await $api<Services>(`${API_BASE}/services`, {
        method: 'POST',
        body: serviceData,
      })
      if (uploadedFiles.value.length > 0 && created.id)
        await uploadFiles(created.id)
      showToast('Сервис успешно добавлен')
    }
    close()
    await fetchServices()
  }
  catch (err) {
    showToast('Ошибка сохранения сервиса', 'error')
  }
}

const { showToast } = useToast()

const uploadFiles = async (serviceId: number) => {
  try {
    const formData = new FormData()
    uploadedFiles.value.forEach(file => {
      formData.append('files', file)
    })
    await $api(`${API_BASE}/services/${serviceId}/attachments`, {
      method: 'POST',
      body: formData,
    })
  }
  catch (err) {
    console.error('Error uploading files:', err)
    showToast('Ошибка загрузки файлов', 'error')
  }
}

const removeAttachment = async (attachmentId: number) => {
  try {
    await $api(`${API_BASE}/services/${editedItem.value.id}/attachments/${attachmentId}`, {
      method: 'DELETE',
    })
    existingAttachments.value = existingAttachments.value.filter(a => a.id !== attachmentId)
    showToast('Файл удален')
  }
  catch (err) {
    showToast('Ошибка удаления файла', 'error')
  }
}

const downloadAttachment = async (attachment: Attachment) => {
  try {
    const response = await fetch(`${API_BASE}/services/${editedItem.value.id}/attachments/${attachment.id}/download`)
    if (!response.ok)
      throw new Error('Download failed')
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = attachment.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
  catch (err) {
    showToast('Ошибка скачивания файла', 'error')
  }
}
</script>

<template>
  <div>
    <VCard title="Сервисы">
      <!-- Индикатор загрузки -->
      <div
        v-if="loading"
        class="d-flex justify-center pa-6"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>

      <!-- Сообщение об ошибке -->
      <div
        v-else-if="error"
        class="d-flex justify-center pa-6"
      >
        <VAlert
          type="error"
          class="ma-4"
        >
          {{ error }}
        </VAlert>
      </div>

      <div
        v-else
        class="d-flex flex-wrap gap-4 pa-6"
      >
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
              <VCol
                cols="12"
                md="6"
              >
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
              <VCol
                cols="12"
                md="6"
              >
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
              color="primary"
              hide-details
              @update:model-value="(val) => toggleStatus(item, val)"
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
            <span
              v-if="!item.customers || item.customers.length === 0"
              class="text-disabled"
            >
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
          <VTooltip
            v-if="item.hasAttachments"
            location="top"
          >
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
          <span
            v-else
            class="text-disabled"
          >—</span>
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
          <span
            v-else
            class="text-disabled"
          >Нет SLA</span>
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn
              v-if="$can('write', 'menu_services')"
              @click="editItem(item)"
            >
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn
              v-if="$can('delete', 'menu_services')"
              @click="deleteItem(item)"
            >
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
            <VCol cols="12">
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

              <div
                v-if="existingAttachments.length > 0"
                class="mt-4"
              >
                <p class="text-body-2 mb-2">
                  Прикрепленные файлы:
                </p>
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
                          <VIcon
                            icon="bx-download"
                            size="18"
                          />
                        </IconBtn>
                        <IconBtn
                          color="error"
                          size="small"
                          @click="removeAttachment(attachment.id)"
                        >
                          <VIcon
                            icon="bx-trash"
                            size="18"
                          />
                        </IconBtn>
                      </div>
                    </template>
                    <template #prepend>
                      <VIcon
                        icon="bx-file"
                        size="20"
                      />
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
</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}
</style>
