<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, ref, watch } from 'vue'

// Типы данных для вложения
interface Attachment {
  id: number
  name: string
  fileName: string
  type: number
  comment: string
  createdAt: string
  updatedAt: string
  status: number // 1 - активен, 2 - не активен
  isActive: boolean
}

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Данные вложений
const attachments = ref<Attachment[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Загрузка данных из API
const fetchAttachments = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await $fetch<Attachment[]>(`${API_BASE}/attachments`)
    attachments.value = data
  } catch (err) {
    error.value = 'Ошибка загрузки вложений'
    console.error('Error fetching attachments:', err)
  } finally {
    loading.value = false
  }
}

// Создание вложения
const createAttachment = async (attachment: Omit<Attachment, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<Attachment>(`${API_BASE}/attachments`, {
      method: 'POST',
      body: attachment
    })
    attachments.value.push(data)
    return data
  } catch (err) {
    console.error('Error creating attachment:', err)
    throw err
  }
}

// Обновление вложения
const updateAttachment = async (id: number, attachment: Omit<Attachment, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<Attachment>(`${API_BASE}/attachments/${id}`, {
      method: 'PUT',
      body: attachment
    })
    const index = attachments.value.findIndex(a => a.id === id)
    if (index !== -1) {
      attachments.value[index] = data
    }
    return data
  } catch (err) {
    console.error('Error updating attachment:', err)
    throw err
  }
}

// Удаление вложения
const deleteAttachment = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/attachments/${id}`, {
      method: 'DELETE'
    })
    const index = attachments.value.findIndex(a => a.id === id)
    if (index !== -1) {
      attachments.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Error deleting attachment:', err)
    throw err
  }
}

// Инициализация
onMounted(() => {
  fetchAttachments()
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Название файла', key: 'fileName', sortable: false },
  { title: 'Тип', key: 'type', sortable: false },
  { title: 'Комментарий', key: 'comment', sortable: false },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Статус', key: 'status', sortable: false },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Фильтрация
const filteredAttachments = computed(() => {
  let filtered = attachments.value

  if (statusFilter.value !== null) {
    filtered = filtered.filter(a => a.status === statusFilter.value)
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
      await deleteAttachment(item.id)
    }
    selectedItems.value = []
    showToast(`Удалено ${count} вложений`)
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmBulkStatusChange = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await updateAttachment(item.id, {
        name: item.name,
        fileName: item.fileName,
        type: item.type,
        comment: item.comment,
        status: bulkStatusValue.value,
        isActive: bulkStatusValue.value === 1
      })
    }
    selectedItems.value = []
    showToast(`Статус изменен для ${count} вложений`)
    isBulkStatusDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового изменения статуса', 'error')
  }
}

const resolveStatusVariant = (status: number) => {
  if (status === 1)
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

// Файл
const fileInput = ref<HTMLInputElement>()

const defaultItem = ref<Attachment>({
  id: -1,
  name: '',
  fileName: '',
  type: 1,
  comment: '',
  createdAt: '',
  updatedAt: '',
  status: 1,
  isActive: true,
})

const editedItem = ref<Attachment>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Опции типов
const typeOptions = [
  { text: 'PDF', value: 1 },
  { text: 'Изображение', value: 2 },
  { text: 'Таблица', value: 3 },
  { text: 'Презентация', value: 4 },
  { text: 'Архив', value: 5 },
  { text: 'Текст', value: 6 },
]

// Методы
const editItem = (item: Attachment) => {
  editedIndex.value = attachments.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: Attachment) => {
  editedIndex.value = attachments.value.indexOf(item)
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
  if (!editedItem.value.name.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  if (!editedItem.value.fileName.trim()) {
    showToast('Название файла обязательно для заполнения', 'error')
    return
  }

  if (!editedItem.value.type) {
    showToast('Тип файла обязателен для заполнения', 'error')
    return
  }

  try {
    if (editedIndex.value > -1) {
      // Обновление существующего
      const updated = await updateAttachment(editedItem.value.id, {
        name: editedItem.value.name,
        fileName: editedItem.value.fileName,
        type: editedItem.value.type,
        comment: editedItem.value.comment,
        status: editedItem.value.status,
        isActive: editedItem.value.status === 1
      })
      showToast('Вложение успешно сохранено')
    } else {
      // Добавление нового
      const created = await createAttachment({
        name: editedItem.value.name,
        fileName: editedItem.value.fileName,
        type: editedItem.value.type,
        comment: editedItem.value.comment,
        status: editedItem.value.status,
        isActive: editedItem.value.status === 1
      })
      showToast('Вложение успешно добавлено')
    }
    close()
  } catch (err) {
    showToast('Ошибка сохранения вложения', 'error')
  }
}

const deleteItemConfirm = async () => {
  try {
    await deleteAttachment(editedItem.value.id)
    showToast('Вложение успешно удалено')
    closeDelete()
  } catch (err) {
    showToast('Ошибка удаления вложения', 'error')
  }
}

// Переключение статуса
const toggleStatus = async (item: Attachment, newValue: number) => {
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение статуса:', newValue)

  try {
    await updateAttachment(item.id, {
      name: item.name,
      fileName: item.fileName,
      type: item.type,
      comment: item.comment,
      status: newValue,
      isActive: newValue === 1
    })
    showToast('Статус вложения изменен')
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

// Добавление нового вложения
const addNewAttachment = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}

// Методы для работы с файлами
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    editedItem.value.fileName = file.name
    // Автозаполнение названия файла без расширения
    if (!editedItem.value.name.trim()) {
      editedItem.value.name = file.name.replace(/\.[^/.]+$/, '')
    }
  }
}

const removeFile = () => {
  editedItem.value.fileName = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Скачивание файла
const downloadItem = (item: Attachment) => {
  console.log('📥 Скачивание файла:', item.fileName)
  try {
    // Создаем ссылку для скачивания и автоматически кликаем по ней
    const link = document.createElement('a')
    link.href = `${API_BASE}/attachments/${item.id}/download`
    link.download = item.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast(`Файл "${item.fileName}" скачивается`)
  } catch (error) {
    console.error('Ошибка скачивания:', error)
    showToast('Ошибка скачивания файла', 'error')
  }
}
</script>

<template>
  <div>
    <VCard title="Вложения">

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
            placeholder="Поиск вложений"
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
              @click="() => {
                console.log('🖱️ Клик по кнопке Действия')
                console.log('📊 Количество выбранных:', selectedItems.length)
                console.log('🔍 Выбранные элементы:', selectedItems)
                console.log('🚪 Состояние меню до клика:', isBulkActionsMenuOpen)
              }"
            >
              Действия ({{ selectedItems.length }})
            </VBtn>
          </template>
          <VList>
            <VListItem
              @click="() => {
                console.log('🗑️ Клик по пункту Удалить')
                bulkDelete()
                isBulkActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Удалить</VListItemTitle>
            </VListItem>
            <VListItem
              @click="() => {
                console.log('🔄 Клик по пункту Изменить статус')
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
            @click="addNewAttachment"
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
        @update:model-value="(val) => {
          console.log('📊 VDataTable model-value изменен:', val)
          console.log('📊 Тип данных:', typeof val, Array.isArray(val))
          console.log('📊 Количество выбранных:', val ? val.length : 0)
        }"
      >
        <!-- Название файла -->
        <template #item.fileName="{ item }">
          {{ item.fileName }}
        </template>

        <!-- Тип -->
        <template #item.type="{ item }">
          {{ typeOptions.find(t => t.value === item.type)?.text || 'Неизвестно' }}
        </template>

        <!-- Комментарий -->
        <template #item.comment="{ item }">
          {{ item.comment }}
        </template>

        <!-- Статус -->
        <template #item.status="{ item }">
          <VChip
            v-bind="resolveStatusVariant(item.status)"
            density="default"
            label
            size="small"
          />
        </template>

        <!-- Активен -->
        <template #item.isActive="{ item }">
          <VSwitch
            :model-value="item.isActive"
            @update:model-value="(val) => {
              console.log('🔘 VSwitch изменен для элемента:', item.name)
              console.log('🔘 Старое значение:', item.isActive)
              console.log('🔘 Новое значение:', val)
              console.log('🔘 Новый статус:', val ? 1 : 2)
              toggleStatus(item, val ? 1 : 2)
            }"
          />
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn @click="downloadItem(item)">
              <VIcon icon="bx-download" />
            </IconBtn>
            <IconBtn @click="editItem(item)">
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn @click="deleteItem(item)">
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

            <!-- Название файла -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.fileName"
                label="Название файла"
                readonly
              />
            </VCol>

            <!-- Файл -->
            <VCol
              cols="12"
              sm="6"
            >
              <div class="d-flex align-center gap-2">
                <AppTextField
                  :model-value="editedItem.fileName"
                  label="Файл"
                  readonly
                  placeholder="Выберите файл"
                />
                <VBtn
                  v-if="editedItem.fileName"
                  icon="bx-download"
                  size="small"
                  variant="tonal"
                  color="success"
                  @click="downloadItem(editedItem)"
                />
                <VBtn
                  icon="bx-paperclip"
                  size="small"
                  variant="tonal"
                  color="primary"
                  @click="triggerFileInput"
                />
                <VBtn
                  v-if="editedItem.fileName"
                  icon="bx-trash"
                  size="small"
                  variant="tonal"
                  color="error"
                  @click="removeFile"
                />
              </div>
              <input
                ref="fileInput"
                type="file"
                style="display: none;"
                @change="handleFileChange"
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
                item-title="text"
                item-value="value"
                label="Тип файла *"
              />
            </VCol>

            <!-- Комментарий -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.comment"
                label="Комментарий"
              />
            </VCol>

            <!-- Статус -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.status"
                :items="statusOptions"
                item-title="text"
                item-value="value"
                label="Статус"
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
      <VCard title="Вы уверены, что хотите удалить это вложение?">
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
