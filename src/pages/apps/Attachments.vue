<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { $api } from '@/utils/api'
import { useEntityCrud, type BaseEntity } from '@/composables/useEntityCrud'
import { useToast } from '@/composables/useToast'

// Типы данных для Вложение
interface Attachments extends BaseEntity {
  name: string
  fileName: string
  type: number
  comment: string
}

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Универсальный CRUD (без save — используем кастомный)
const {
  items: attachments,
  loading,
  error,
  fetchItems: fetchAttachments,
  editDialog,
  deleteDialog,
  editedItem,
  editedIndex,
  currentPage,
  itemsPerPage,
  statusFilter,
  filteredItems: filteredAttachments,
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
  clearFilters,

  deleteItem,
  close: baseClose,
  closeDelete,
  deleteItemConfirm,
  addNewItem: addNewAttachments,
} = useEntityCrud<Attachments>({
  endpoint: '/attachments',
  itemName: 'вложения',
  defaultItem: {
    id: -1,
    name: '',
    fileName: '',
    type: 0,
    comment: '',
    createdAt: '',
    updatedAt: '',
    isActive: true,
  },
})

// === Инициализация ===
onMounted(() => fetchAttachments())

// === Заголовки таблицы ===
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Имя файла', key: 'fileName', sortable: true },
  { title: 'Тип файла', key: 'type', sortable: true },
  { title: 'Комментарий', key: 'comment', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// === Специфичные поля ===
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// Опции типов файлов
const typeOptions = [
  { text: 'Неизвестный', value: 0, icon: 'bx-file-blank' },
  { text: 'Изображение', value: 1, icon: 'bx-image' },
  { text: 'Видео', value: 2, icon: 'bx-video' },
  { text: 'PDF', value: 3, icon: 'bx-file' },
  { text: 'Текст', value: 4, icon: 'bx-text' },
]

// === Методы ===
const editItem = (item: Attachments) => {
  editedIndex.value = attachments.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const close = () => {
  editDialog.value = false
  editedIndex.value = -1
  editedItem.value = {
    id: -1,
    name: '',
    fileName: '',
    type: 0,
    comment: '',
    createdAt: '',
    updatedAt: '',
    isActive: true,
  }
  selectedFile.value = null
  if (fileInput.value)
    fileInput.value.value = ''
}

const save = async () => {
  if (!editedItem.value.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  try {
    if (editedIndex.value > -1) {
      const payload = { ...editedItem.value } as any
      delete payload.id
      delete payload.createdAt
      delete payload.updatedAt

      const data = await $api<Attachments>(`${API_BASE}/attachments/${editedItem.value.id}`, {
        method: 'PUT',
        body: payload,
      })
      const index = attachments.value.findIndex(p => p.id === editedItem.value.id)
      if (index !== -1)
        attachments.value[index] = data

      showToast('Вложение успешно сохранено')
    }
    else {
      if (selectedFile.value) {
        const formData = new FormData()
        formData.append('name', editedItem.value.name)
        formData.append('fileName', editedItem.value.fileName)
        formData.append('type', editedItem.value.type.toString())
        formData.append('comment', editedItem.value.comment)
        formData.append('isActive', editedItem.value.isActive.toString())
        formData.append('file', selectedFile.value)

        const data = await $api<Attachments>(`${API_BASE}/attachments`, {
          method: 'POST',
          body: formData,
        })
        attachments.value.push(data)
      }
      else {
        const data = await $api<Attachments>(`${API_BASE}/attachments`, {
          method: 'POST',
          body: {
            ...editedItem.value,
          },
        })
        attachments.value.push(data)
      }
      showToast('Вложение успешно добавлено')
    }
    close()
  }
  catch (err) {
    showToast('Ошибка сохранения вложения', 'error')
  }
}

const { showToast } = useToast()

const getTypeIcon = (type: number): string => {
  switch (type) {
    case 1: return 'bx-image'
    case 2: return 'bx-video'
    case 3: return 'bx-file'
    case 4: return 'bx-text'
    default: return 'bx-file-blank'
  }
}

const getTypeText = (type: number): string => {
  switch (type) {
    case 1: return 'Изображение'
    case 2: return 'Видео'
    case 3: return 'PDF'
    case 4: return 'Текст'
    default: return 'Неизвестный'
  }
}

const getFileType = (file: File): number => {
  if (file.type.startsWith('image/'))
    return 1
  if (file.type.startsWith('video/'))
    return 2
  if (file.type === 'application/pdf')
    return 3
  if (file.type.startsWith('text/'))
    return 4
  return 0
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    if (file.size > 20 * 1024 * 1024) {
      showToast('Файл слишком большой. Максимальный размер: 20 МБ', 'error')
      return
    }
    const allowedTypes = ['image/', 'video/', 'application/pdf', 'text/']
    const isAllowed = allowedTypes.some(type => file.type.startsWith(type) || file.type === 'application/pdf')
    if (!isAllowed) {
      showToast('Недопустимый тип файла. Разрешены: изображения, видео, PDF, текстовые файлы', 'error')
      return
    }
    selectedFile.value = file
    editedItem.value.fileName = file.name
    editedItem.value.type = getFileType(file)
  }
}

const clearFile = () => {
  selectedFile.value = null
  editedItem.value.fileName = ''
  editedItem.value.type = 0
  if (fileInput.value)
    fileInput.value.value = ''
}

const downloadItem = async (item: Attachments) => {
  try {
    const response = await fetch(`${API_BASE}/attachments/${item.id}/download`)
    if (!response.ok)
      throw new Error('Download failed')
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = item.fileName
    a.click()
    window.URL.revokeObjectURL(url)
  }
  catch (err) {
    showToast('Ошибка скачивания файла', 'error')
  }
}

</script>

<template>
  <div>
    <VCard title="Вложения">
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
            placeholder="Поиск вложения"
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
            @click="addNewAttachments"
          >
            Добавить вложение
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
            Вы уверены, что хотите удалить выбранные вложения? Это действие нельзя отменить.
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
        :items="filteredAttachments"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Тип файла -->
        <template #item.type="{ item }">
          <VIcon :icon="getTypeIcon(item.type)" />
        </template>

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

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn @click="downloadItem(item)">
              <VIcon icon="bx-download" />
            </IconBtn>
            <IconBtn
              v-if="$can('write', 'menu_attachments')"
              @click="editItem(item)"
            >
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn
              v-if="$can('delete', 'menu_attachments')"
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
          :length="Math.ceil(filteredAttachments.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать вложение' : 'Добавить вложение'">
        <VCardText>
          <VRow>
            <!-- Выбор файла -->
            <VCol cols="12">
              <div>
                <div class="d-flex align-center gap-2">
                  <VBtn
                    color="primary"
                    variant="outlined"
                    prepend-icon="bx-paperclip"
                    @click="fileInput?.click()"
                  >
                    Выбрать файл
                  </VBtn>
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/*,video/*,.pdf,text/*"
                    style="display: none;"
                    @change="handleFileSelect"
                  >
                  <span
                    v-if="selectedFile || (editedIndex > -1 && editedItem.fileName)"
                    class="text-body-2 text-truncate"
                  >{{ selectedFile ? selectedFile.name : editedItem.fileName }}</span>
                  <VBtn
                    v-if="selectedFile || (editedIndex > -1 && editedItem.fileName)"
                    color="error"
                    variant="text"
                    prepend-icon="bx-trash"
                    @click="clearFile"
                  >
                    Удалить
                  </VBtn>
                </div>
                <small class="text-caption mt-1 d-block">Максимальный размер: 20 МБ. Разрешенные типы: изображения, видео, PDF, текстовые файлы.</small>
              </div>
            </VCol>

            <!-- Название -->
            <VCol cols="12">
              <AppTextField
                v-model="editedItem.name"
                label="Название *"
              />
            </VCol>

            <!-- Имя файла -->
            <VCol
              v-if="!selectedFile"
              cols="12"
            >
              <AppTextField
                v-model="editedItem.fileName"
                label="Имя файла"
              />
            </VCol>

            <!-- Тип -->
            <VCol
              v-if="selectedFile"
              cols="12"
              sm="6"
            >
              <div class="d-flex align-center gap-2">
                <VIcon :icon="getTypeIcon(editedItem.type)" />
                <span>{{ getTypeText(editedItem.type) }}</span>
              </div>
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
      <VCard title="Вы уверены, что хотите удалить этот вложение?">
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
