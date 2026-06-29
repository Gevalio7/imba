<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { $api } from '@/utils/api'
import { useToast } from '@/composables/useToast'

// Типы данных для Email адрес
interface EmailAddresses {
  id: number
  name: string
  message: string
  queueId: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Типы данных для Очереди
interface Queue {
  id: number
  name: string
  description: string
  maxTickets: number
  priority: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Данные email адреса
const emailAddresses = ref<EmailAddresses[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Данные очередей
const queues = ref<Queue[]>([])
const queuesLoading = ref(false)
const queuesError = ref<string | null>(null)

// Загрузка данных из API
const fetchEmailAddresses = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('Fetching emailAddresses from:', `${API_BASE}/emailAddresses`)

    const data = await $api<{ emailAddresses: EmailAddresses[]; total: number }>(`${API_BASE}/emailAddresses`)

    console.log('Fetched emailAddresses data:', data)
    emailAddresses.value = data.emailAddresses
    total.value = data.total
  }
  catch (err) {
    error.value = 'Ошибка загрузки email адреса'
    console.error('Error fetching emailAddresses:', err)
  }
  finally {
    loading.value = false
  }
}

// Загрузка данных очередей
const fetchQueues = async () => {
  try {
    queuesLoading.value = true
    queuesError.value = null
    console.log('Fetching queues from:', `${API_BASE}/queues`)

    const data = await $api<{ queues: Queue[]; total: number }>(`${API_BASE}/queues`)

    console.log('Fetched queues data:', data)
    queues.value = data.queues
  }
  catch (err) {
    queuesError.value = 'Ошибка загрузки очередей'
    console.error('Error fetching queues:', err)
  }
  finally {
    queuesLoading.value = false
  }
}

// Создание email адрес
const createEmailAddresses = async (item: Omit<EmailAddresses, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $api<EmailAddresses>(`${API_BASE}/emailAddresses`, {
      method: 'POST',
      body: item,
    })

    emailAddresses.value.push(data)

    return data
  }
  catch (err) {
    console.error('Error creating emailAddresses:', err)
    throw err
  }
}

// Обновление email адрес
const updateEmailAddresses = async (id: number, item: Omit<EmailAddresses, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $api<EmailAddresses>(`${API_BASE}/emailAddresses/${id}`, {
      method: 'PUT',
      body: item,
    })

    const index = emailAddresses.value.findIndex(p => p.id === id)
    if (index !== -1)
      emailAddresses.value[index] = data

    return data
  }
  catch (err) {
    console.error('Error updating emailAddresses:', err)
    throw err
  }
}

// Удаление email адрес
const deleteEmailAddresses = async (id: number) => {
  try {
    await $api(`${API_BASE}/emailAddresses/${id}`, {
      method: 'DELETE',
    })

    const index = emailAddresses.value.findIndex(p => p.id === id)
    if (index !== -1)
      emailAddresses.value.splice(index, 1)
  }
  catch (err) {
    console.error('Error deleting emailAddresses:', err)
    throw err
  }
}

// Инициализация
onMounted(() => {
  fetchEmailAddresses()
  fetchQueues()
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Адрес электронной почты', key: 'name', sortable: true },
  { title: 'Отображаемое имя', key: 'message', sortable: true },
  { title: 'Очередь', key: 'queueId', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Фильтрация
const filteredEmailAddresses = computed(() => {
  let filtered = emailAddresses.value

  if (statusFilter.value !== null) {
    // Фильтруем по isActive: 1 = true (активен), 2 = false (не активен)
    filtered = filtered.filter(p => p.isActive === (statusFilter.value === 1))
  }

  return filtered
})

// Получение имени очереди по ID
const getQueueName = (queueId: number | null) => {
  if (!queueId)
    return '-'
  const queue = queues.value.find(q => q.id === queueId)

  return queue ? queue.name : '-'
}

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
    for (const item of selectedItems.value)
      await deleteEmailAddresses(item.id)

    selectedItems.value = []
    showToast(`Удалено ${count} email адреса`)
    isBulkDeleteDialogOpen.value = false
  }
  catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmBulkStatusChange = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await updateEmailAddresses(item.id, {
        ...item,
        isActive: bulkStatusValue.value === 1,
      })
    }
    selectedItems.value = []
    showToast(`Статус изменен для ${count} email адреса`)
    isBulkStatusDialogOpen.value = false
  }
  catch (err) {
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
watch(selectedItems, newValue => {
  console.log('✅ Изменение выбранных элементов')
  console.log('📋 Новое значение selectedItems:', newValue)
  console.log('📊 Количество выбранных:', newValue.length)
  console.log('🔍 Детали выбранных элементов:', JSON.stringify(newValue, null, 2))
}, { deep: true })

// Диалоги
const editDialog = ref(false)
const deleteDialog = ref(false)

const defaultItem = ref<EmailAddresses>({
  id: -1,
  name: '',
  message: '',
  queueId: null,
  createdAt: '',
  updatedAt: '',
  isActive: true,
})

const editedItem = ref<EmailAddresses>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Методы
const editItem = (item: EmailAddresses) => {
  editedIndex.value = emailAddresses.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: EmailAddresses) => {
  editedIndex.value = emailAddresses.value.indexOf(item)
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
    showToast('Адрес электронной почты обязателен для заполнения', 'error')

    return
  }

  try {
    if (editedIndex.value > -1) {
      // Обновление существующего
      const updated = await updateEmailAddresses(editedItem.value.id, {
        ...editedItem.value,
        isActive: editedItem.value.isActive,
      })

      showToast('Email адрес успешно сохранен')
    }
    else {
      // Добавление нового
      const created = await createEmailAddresses({
        ...editedItem.value,
        isActive: editedItem.value.isActive,
      })

      showToast('Email адрес успешно добавлен')
    }
    close()
  }
  catch (err) {
    showToast('Ошибка сохранения email адрес', 'error')
  }
}

const deleteItemConfirm = async () => {
  try {
    await deleteEmailAddresses(editedItem.value.id)
    showToast('Email адрес успешно удален')
    closeDelete()
  }
  catch (err) {
    showToast('Ошибка удаления email адрес', 'error')
  }
}

// Переключение статуса
const toggleStatus = async (item: EmailAddresses, newValue: boolean) => {
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение isActive:', newValue)

  try {
    await updateEmailAddresses(item.id, {
      ...item,
      isActive: newValue,
    })
    showToast('Статус email адрес изменен')
  }
  catch (err) {
    showToast('Ошибка изменения статуса', 'error')
  }
}

const { showToast } = useToast()

// Добавление нового email адрес
const addNewEmailAddresses = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="Email адреса">
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
            placeholder="Поиск email адреса"
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
            v-if="$can('write', 'menu_email_addresses')"
            color="primary"
            prepend-icon="bx-plus"
            @click="addNewEmailAddresses"
          >
            Добавить email адрес
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
            Вы уверены, что хотите удалить выбранные email адреса? Это действие нельзя отменить.
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
        :items="filteredEmailAddresses"
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

        <!-- Очередь -->
        <template #item.queueId="{ item }">
          {{ getQueueName(item.queueId) }}
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn
              v-if="$can('write', 'menu_email_addresses')"
              @click="editItem(item)"
            >
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn
              v-if="$can('delete', 'menu_email_addresses')"
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
          :length="Math.ceil(filteredEmailAddresses.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать email адрес' : 'Добавить email адрес'">
        <VCardText>
          <VRow>
            <!-- Адрес электронной почты -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.name"
                label="Адрес электронной почты *"
              />
            </VCol>

            <!-- Отображаемое имя -->
            <VCol cols="12">
              <AppTextarea
                v-model="editedItem.message"
                label="Отображаемое имя"
                rows="3"
                placeholder="Введите отображаемое имя..."
              />
            </VCol>

            <!-- Очередь -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.queueId"
                label="Очередь"
                :items="queues.map(q => ({ title: q.name, value: q.id }))"
                item-title="title"
                item-value="value"
                clearable
                clear-icon="bx-x"
                placeholder="Выберите очередь"
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
      <VCard title="Вы уверены, что хотите удалить этот email адрес?">
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
