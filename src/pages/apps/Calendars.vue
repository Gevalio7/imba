<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { $api } from '@/utils/api'

// Типы данных для Календарь
interface Calendars {
  id: number
  name: string
  description: string
  timezone: string
  workHoursFrom: string
  workHoursTo: string
  workDaysPerWeek: number
  color: string
  dateFrom: string | null
  dateTo: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Данные календари
const calendars = ref<Calendars[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Загрузка данных из API
const fetchCalendars = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('Fetching calendars from:', `${API_BASE}/calendars`)

    const data = await $api<{ calendars: Calendars[]; total: number }>(`${API_BASE}/calendars`)

    console.log('Fetched calendars data:', data)
    calendars.value = data.calendars
    total.value = data.total
  }
  catch (err) {
    error.value = 'Ошибка загрузки календари'
    console.error('Error fetching calendars:', err)
  }
  finally {
    loading.value = false
  }
}

// Создание календарь
const createCalendars = async (item: Omit<Calendars, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $api<Calendars>(`${API_BASE}/calendars`, {
      method: 'POST',
      body: item,
    })

    calendars.value.push(data)

    return data
  }
  catch (err) {
    console.error('Error creating calendars:', err)
    throw err
  }
}

// Обновление календарь
const updateCalendars = async (id: number, item: Omit<Calendars, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $api<Calendars>(`${API_BASE}/calendars/${id}`, {
      method: 'PUT',
      body: item,
    })

    const index = calendars.value.findIndex(p => p.id === id)
    if (index !== -1)
      calendars.value[index] = data

    return data
  }
  catch (err) {
    console.error('Error updating calendars:', err)
    throw err
  }
}

// Удаление календарь
const deleteCalendars = async (id: number) => {
  try {
    await $api(`${API_BASE}/calendars/${id}`, {
      method: 'DELETE',
    })

    const index = calendars.value.findIndex(p => p.id === id)
    if (index !== -1)
      calendars.value.splice(index, 1)
  }
  catch (err) {
    console.error('Error deleting calendars:', err)
    throw err
  }
}

// Инициализация
onMounted(() => {
  fetchCalendars()
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Описание', key: 'description', sortable: true },
  { title: 'Часовой пояс', key: 'timezone', sortable: true },
  { title: 'Рабочие часы с', key: 'workHoursFrom', sortable: true },
  { title: 'Рабочие часы по', key: 'workHoursTo', sortable: true },
  { title: 'Дней в неделю', key: 'workDaysPerWeek', sortable: true },
  { title: 'Цвет', key: 'color', sortable: true },
  { title: 'Дата с', key: 'dateFrom', sortable: true },
  { title: 'Дата по', key: 'dateTo', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Фильтрация
const filteredCalendars = computed(() => {
  let filtered = calendars.value

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
    for (const item of selectedItems.value)
      await deleteCalendars(item.id)

    selectedItems.value = []
    showToast(`Удалено ${count} календари`)
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
      await updateCalendars(item.id, {
        ...item,
        isActive: bulkStatusValue.value === 1,
      })
    }
    selectedItems.value = []
    showToast(`Статус изменен для ${count} календари`)
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

const defaultItem = ref<Calendars>({
  id: -1,
  name: '',
  description: '',
  timezone: '',
  workHoursFrom: '',
  workHoursTo: '',
  workDaysPerWeek: 5,
  color: 'primary',
  dateFrom: '',
  dateTo: '',
  createdAt: '',
  updatedAt: '',
  isActive: true,
})

const editedItem = ref<Calendars>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Опции часовых поясов
const timezoneOptions = [
  { text: 'UTC', value: 'UTC' },
  { text: 'Europe/Moscow', value: 'Europe/Moscow' },
  { text: 'Europe/London', value: 'Europe/London' },
  { text: 'America/New_York', value: 'America/New_York' },
  { text: 'Asia/Tokyo', value: 'Asia/Tokyo' },
  { text: 'Asia/Shanghai', value: 'Asia/Shanghai' },
  { text: 'Australia/Sydney', value: 'Australia/Sydney' },
]

// Методы
const editItem = (item: Calendars) => {
  editedIndex.value = calendars.value.indexOf(item)
  editedItem.value = {
    ...item,
    dateFrom: item.dateFrom ? new Date(item.dateFrom).toISOString().split('T')[0] : '',
    dateTo: item.dateTo ? new Date(item.dateTo).toISOString().split('T')[0] : '',
  }
  editDialog.value = true
}

const deleteItem = (item: Calendars) => {
  editedIndex.value = calendars.value.indexOf(item)
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
  console.log('DEBUG: Saving calendar with color:', editedItem.value.color)
  if (!editedItem.value.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')

    return
  }

  try {
    // Преобразуем даты в формат ISO для отправки на сервер
    const dataToSend = {
      ...editedItem.value,
      dateFrom: editedItem.value.dateFrom ? new Date(editedItem.value.dateFrom).toISOString() : null,
      dateTo: editedItem.value.dateTo ? new Date(editedItem.value.dateTo).toISOString() : null,
      isActive: editedItem.value.isActive,
    }

    console.log('DEBUG: Data to send:', dataToSend)

    if (editedIndex.value > -1) {
      // Обновление существующего
      const updated = await updateCalendars(editedItem.value.id, dataToSend)

      console.log('DEBUG: Updated calendar:', updated)
      showToast('Календарь успешно сохранен')
    }
    else {
      // Добавление нового
      const created = await createCalendars(dataToSend)

      console.log('DEBUG: Created calendar:', created)
      showToast('Календарь успешно добавлен')
    }
    close()
  }
  catch (err) {
    console.error('DEBUG: Error saving calendar:', err)
    showToast('Ошибка сохранения календарь', 'error')
  }
}

const deleteItemConfirm = async () => {
  try {
    await deleteCalendars(editedItem.value.id)
    showToast('Календарь успешно удален')
    closeDelete()
  }
  catch (err) {
    showToast('Ошибка удаления календарь', 'error')
  }
}

// Переключение статуса
const toggleStatus = async (item: Calendars, newValue: boolean | null) => {
  if (newValue === null)
    return
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение isActive:', newValue)

  try {
    await updateCalendars(item.id, {
      ...item,
      isActive: newValue,
    })
    showToast('Статус календарь изменен')
  }
  catch (err) {
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

// Добавление нового календарь
const addNewCalendars = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="Календари">
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
            placeholder="Поиск календари"
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
            @click="addNewCalendars"
          >
            Добавить календарь
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
            Вы уверены, что хотите удалить выбранные календари? Это действие нельзя отменить.
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
        :items="filteredCalendars"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Рабочие часы с -->
        <template #item.workHoursFrom="{ item }">
          {{ item.workHoursFrom || '-' }}
        </template>

        <!-- Рабочие часы по -->
        <template #item.workHoursTo="{ item }">
          {{ item.workHoursTo || '-' }}
        </template>

        <!-- Дней в неделю -->
        <template #item.workDaysPerWeek="{ item }">
          {{ item.workDaysPerWeek || '-' }}
        </template>

        <!-- Цвет -->
        <template #item.color="{ item }">
          <VChip
            :color="item.color || 'primary'"
            density="compact"
            label
            size="small"
          >
            {{ item.color || 'primary' }}
          </VChip>
        </template>

        <!-- Дата с -->
        <template #item.dateFrom="{ item }">
          {{ item.dateFrom ? new Date(item.dateFrom).toLocaleDateString() : '-' }}
        </template>

        <!-- Дата по -->
        <template #item.dateTo="{ item }">
          {{ item.dateTo ? new Date(item.dateTo).toLocaleDateString() : '-' }}
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
            <IconBtn
              v-if="$can('write', 'menu_calendars')"
              @click="editItem(item)"
            >
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn
              v-if="$can('delete', 'menu_calendars')"
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
          :length="Math.ceil(filteredCalendars.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать календарь' : 'Добавить календарь'">
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
            <VCol cols="12">
              <AppTextarea
                v-model="editedItem.description"
                label="Описание"
                rows="3"
                placeholder="Введите описание..."
              />
            </VCol>

            <!-- Часовой пояс -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.timezone"
                :items="timezoneOptions"
                item-title="text"
                item-value="value"
                label="Часовой пояс"
                placeholder="Выберите часовой пояс"
              />
            </VCol>

            <!-- Рабочие часы с -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.workHoursFrom"
                label="Рабочие часы с"
                type="time"
              />
            </VCol>

            <!-- Рабочие часы по -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.workHoursTo"
                label="Рабочие часы по"
                type="time"
              />
            </VCol>

            <!-- Дней в неделю -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model.number="editedItem.workDaysPerWeek"
                label="Дней в неделю"
                type="number"
                :min="3"
                :max="7"
              />
            </VCol>

            <!-- Цвет -->
            <VCol
              cols="12"
              sm="6"
            >
              <input
                v-model="editedItem.color"
                type="color"
                label="Цвет"
                placeholder="Выберите цвет"
              >
            </VCol>

            <!-- Дата с -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.dateFrom"
                label="Дата с"
                type="date"
              />
            </VCol>

            <!-- Дата по -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.dateTo"
                label="Дата по"
                type="date"
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
      <VCard title="Вы уверены, что хотите удалить этот календарь?">
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
