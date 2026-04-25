<script setup lang="ts">
import { useFilters, type ColumnSetting } from '@/composables/useFilters'
import { $api } from '@/utils/api'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import TicketScheduleDialog from '@/components/TicketEdit/TicketScheduleDialog.vue'

definePage({
  meta: {
    navActiveLink: 'apps-tickets',
  },
})

const API_BASE = import.meta.env.VITE_API_BASE_URL
const router = useRouter()

// Интерфейс расписания
interface TicketSchedule {
  id: number
  ticketId: number | null
  ticketNumber: string | null
  scheduleType: string
  scheduleTime: string
  scheduleDays: number[] | null
  scheduleDayOfMonth: number | null
  startDate: string | null
  endDate: string | null
  isActive: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  titlePrefix: string | null
  title: string
  description: string | null
  createdAt: string
  updatedAt: string
}

// Используем composable для фильтров
const {
  filterRows,
  filterPresets,
  isFilterDialogOpen,
  isSavePresetDialogOpen,
  newPresetName,
  loadSavedPresets,
  addFilterRow,
  removeFilterRow,
  applyPreset,
  saveCurrentAsPreset,
  deletePreset,
  clearAllFilters,
  getConditionsForColumn,
  filterItems,
  filterConditions,
  booleanOptions,
} = useFilters()

const FILTER_PRESETS_KEY = 'schedules-filter-presets'

// Данные
const schedules = ref<TicketSchedule[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Загрузка данных
const fetchSchedules = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await $api(`${API_BASE}/ticketSchedules`)
    schedules.value = data.schedules
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки расписаний'
    console.error('Error fetching schedules:', err)
  } finally {
    loading.value = false
  }
}

// Удаление расписания
const deleteScheduleById = async (id: number) => {
  try {
    await $api(`/ticketSchedules/${id}`, { method: 'DELETE' })
    const index = schedules.value.findIndex(s => s.id === id)
    if (index !== -1) schedules.value.splice(index, 1)
  } catch (err) {
    console.error('Error deleting schedule:', err)
    throw err
  }
}

// Доступные колонки с типами и опциями
const availableColumns: ColumnSetting[] = [
  { key: 'ticketNumber', title: 'Тикет', visible: true, sortable: true, type: 'text' },
  { key: 'title', title: 'Название', visible: true, sortable: true, type: 'text' },
  { key: 'scheduleType', title: 'Тип расписания', visible: true, sortable: false, type: 'select' },
  { key: 'scheduleTime', title: 'Время', visible: true, sortable: true, type: 'text' },
  { key: 'period', title: 'Период', visible: true, sortable: false, type: 'text' },
  { key: 'startDate', title: 'Дата начала', visible: true, sortable: true, type: 'date' },
  { key: 'endDate', title: 'Дата окончания', visible: true, sortable: true, type: 'date' },
  { key: 'nextRunAt', title: 'Следующий запуск', visible: true, sortable: true, type: 'date' },
  { key: 'lastRunAt', title: 'Последний запуск', visible: true, sortable: true, type: 'date' },
  { key: 'isActive', title: 'Статус', visible: true, sortable: false, type: 'boolean' },
  { key: 'actions', title: 'Действия', visible: true, sortable: false, type: 'text' },
]

// Загрузка/сохранение настроек колонок
const STORAGE_KEY = 'schedules-columns-settings'

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

// Вычисляемые заголовки
const headers = computed(() => {
  return columnSettings.value
    .filter(col => col.visible)
    .map(col => ({
      title: col.title,
      key: col.key,
      sortable: col.sortable
    }))
})

// Сохранение настроек при изменении
watch(columnSettings, (newSettings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
}, { deep: true })

// Диалог настроек колонок
const isColumnsDialogOpen = ref(false)

const moveColumn = (index: number, direction: 'up' | 'down') => {
  const newIndex = direction === 'up' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= columnSettings.value.length) return
  
  const temp = columnSettings.value[index]
  columnSettings.value[index] = columnSettings.value[newIndex]
  columnSettings.value[newIndex] = temp
}

const resetColumnSettings = () => {
  columnSettings.value = availableColumns.map(col => ({ ...col, visible: true }))
}

// Колонки для фильтрации
const filterableColumns = computed(() => {
  return columnSettings.value
    .filter(col => col.visible && col.key !== 'actions')
    .map(col => ({
      title: col.title,
      value: col.key,
      type: col.type,
      options: col.options || []
    }))
})

// Фильтрация
const searchQuery = ref('')

// Получить специальное значение для фильтрации
const getFilterSpecialValue = (schedule: TicketSchedule, columnKey: string): string => {
  if (columnKey === 'scheduleType') {
    return getScheduleTypeText(schedule.scheduleType)
  } else if (columnKey === 'period') {
    return getPeriodText(schedule)
  } else if (columnKey === 'isActive') {
    return schedule.isActive ? 'Активно' : 'Приостановлено'
  }
  return ''
}

const filteredSchedules = computed(() => {
  let filtered = schedules.value

  // Поиск
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(s =>
      s.title?.toLowerCase().includes(q) ||
      s.ticketNumber?.toLowerCase().includes(q) ||
      s.scheduleType?.toLowerCase().includes(q)
    )
  }

  // Фильтры из composable
  filtered = filterItems(filtered, columnSettings.value, getFilterSpecialValue)

  return filtered
})

// Пагинация
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Массовые действия
const selectedItems = ref<number[]>([])
const isBulkActionsMenuOpen = ref(false)
const isBulkDeleteDialogOpen = ref(false)

// Удалить выбранные расписания
const confirmBulkDelete = async () => {
  try {
    const count = selectedItems.value.length
    for (const id of selectedItems.value) {
      await deleteScheduleById(id)
    }
    selectedItems.value = []
    showToast(`Удалено ${count} расписаний`)
    isBulkDeleteDialogOpen.value = false
    await fetchSchedules()
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

// Сделать активным/неактивным
const toggleActiveStatus = async (scheduleId: number, makeActive: boolean) => {
  try {
    await $api(`/ticketSchedules/${scheduleId}`, {
      method: 'PUT',
      body: { isActive: makeActive }
    })
    showToast(makeActive ? 'Расписание активировано' : 'Расписание приостановлено')
    await fetchSchedules()
  } catch (err) {
    showToast('Ошибка изменения статуса', 'error')
  }
}

// Массовая активация/деактивация
const bulkSetActive = async (makeActive: boolean) => {
  try {
    const count = selectedItems.value.length
    for (const id of selectedItems.value) {
      await $api(`/ticketSchedules/${id}`, {
        method: 'PUT',
        body: { isActive: makeActive }
      })
    }
    selectedItems.value = []
    showToast(makeActive ? `Активировано ${count} расписаний` : `Приостановлено ${count} расписаний`)
    isBulkActionsMenuOpen.value = false
    await fetchSchedules()
  } catch (err) {
    showToast('Ошибка массового изменения статуса', 'error')
  }
}

// Форматирование даты
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Форматирование даты только для даты
const formatDateOnly = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Получить текстовое представление типа расписания
const getScheduleTypeText = (type: string) => {
  switch (type) {
    case 'daily': return 'Ежедневно'
    case 'weekly': return 'Еженедельно'
    case 'monthly': return 'Ежемесячно'
    default: return type
  }
}

// Получить текстовое представление периода
const getPeriodText = (schedule: TicketSchedule) => {
  if (schedule.scheduleType === 'weekly') {
    return getWeekDaysText(schedule.scheduleDays)
  } else if (schedule.scheduleType === 'monthly') {
    return `${schedule.scheduleDayOfMonth} числа`
  }
  return '-'
}

// Получить текстовое представление дней недели
const getWeekDaysText = (days: number[] | null) => {
  if (!days || days.length === 0) return '-'
  const dayNames: Record<number, string> = {
    1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб', 7: 'Вс'
  }
  return days.map(d => dayNames[d]).join(', ')
}

// Статус расписания
const getScheduleStatus = (schedule: TicketSchedule) => {
  if (!schedule.isActive) return { text: 'Приостановлено', color: 'warning', variant: 'flat' as const }
  if (schedule.nextRunAt && new Date(schedule.nextRunAt) <= new Date()) {
    return { text: 'Готов к выполнению', color: 'success', variant: 'flat' as const }
  }
  if (schedule.nextRunAt) {
    return { text: 'Ожидание', color: 'info', variant: 'flat' as const }
  }
  return { text: 'Завершено', color: 'error', variant: 'flat' as const }
}

// Перейти к редактированию тикета
const goToTicket = (ticketId: number | null) => {
  if (ticketId) {
    window.location.href = `/apps/tickets/edit?id=${ticketId}`
  }
}

// Диалог удаления
const deleteDialog = ref(false)
const deletingItem = ref<TicketSchedule | null>(null)

// Диалог логов
const logsDialog = ref(false)
const logsLoading = ref(false)
const scheduleLogs = ref<any[]>([])
const logsScheduleId = ref<number | null>(null)

// Диалог редактирования расписания
const editDialog = ref(false)
const editingSchedule = ref<TicketSchedule | null>(null)
const savingSchedule = ref(false)

// Открыть логи расписания
const openLogsDialog = async (schedule: TicketSchedule) => {
  logsScheduleId.value = schedule.id
  logsDialog.value = true
  logsLoading.value = true
  try {
    const data = await $api(`${API_BASE}/ticketSchedules/${schedule.id}/logs`)
    scheduleLogs.value = data.logs || []
  } catch (err) {
    console.error('Error fetching logs:', err)
    scheduleLogs.value = []
  } finally {
    logsLoading.value = false
  }
}

// Формат даты для логов
const formatLogDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Получить цвет статуса для лога
const getLogStatusColor = (status: string) => {
  switch (status) {
    case 'success': return 'success'
    case 'error': return 'error'
    case 'skipped': return 'warning'
    default: return 'grey'
  }
}

const deleteItem = (item: TicketSchedule) => {
  deletingItem.value = item
  deleteDialog.value = true
}

const closeDelete = () => {
  deleteDialog.value = false
  deletingItem.value = null
}

const deleteItemConfirm = async () => {
  if (!deletingItem.value) return
  try {
    await deleteScheduleById(deletingItem.value.id)
    showToast('Расписание успешно удалено')
    closeDelete()
  } catch (err) {
    showToast('Ошибка удаления расписания', 'error')
  }
}

// Открыть диалог редактирования расписания
const openEditDialog = (schedule: TicketSchedule) => {
  editingSchedule.value = schedule
  editDialog.value = true
}

// Сохранить расписание
const saveSchedule = async () => {
  savingSchedule.value = true
  try {
    // Диалог сам обработает сохранение
    await fetchSchedules()
    showToast('Расписание сохранено')
    editDialog.value = false
  } catch (err) {
    showToast('Ошибка сохранения расписания', 'error')
  } finally {
    savingSchedule.value = false
  }
}

// Удалить расписание из диалога
const deleteScheduleFromDialog = async () => {
  if (!editingSchedule.value) return
  try {
    await deleteScheduleById(editingSchedule.value.id)
    showToast('Расписание удалено')
    editDialog.value = false
  } catch (err) {
    showToast('Ошибка удаления расписания', 'error')
  }
}

// Запустить расписание сейчас
const runScheduleNow = async () => {
  if (!editingSchedule.value?.id) return
  try {
    await $api(`/ticketSchedules/${editingSchedule.value.id}/run`, {
      method: 'POST'
    })
    showToast('Тикет создан по расписанию')
    editDialog.value = false
    await fetchSchedules()
  } catch (err: any) {
    console.error('Error running schedule:', err)
    console.log('Error data:', err?.data)
    const message = err?.data?.message || err?.response?.data?.message || err?.message || 'Ошибка создания тикета'
    console.log('Toast message:', message)
    showToast(message, 'error')
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

// Инициализация
onMounted(() => {
  fetchSchedules()
  loadSavedPresets(FILTER_PRESETS_KEY)
})
</script>

<template>
  <div>
    <VCard title="Расписания тикетов">

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
          <AppTextField
            v-model="searchQuery"
            placeholder="Поиск расписания"
            style="inline-size: 250px;"
            class="me-3"
          />
        </div>

        <!-- Кнопка фильтра -->
        <div class="d-flex align-center">
          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="bx-filter"
            @click="isFilterDialogOpen = true"
          >
            Фильтр
          </VBtn>
          
          <!-- Кнопка сброса фильтров -->
          <VBtn
            v-if="filterRows.some(f => f.column && f.condition)"
            variant="text"
            color="error"
            size="small"
            class="ml-1"
            @click="clearAllFilters"
          >
            <VIcon icon="bx-x" />
            Сбросить
          </VBtn>
        </div>

        <!-- Меню массовых действий -->
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
            <VListItem @click="bulkSetActive(true)">
              <VListItemTitle>Активировать</VListItemTitle>
            </VListItem>
            <VListItem @click="bulkSetActive(false)">
              <VListItemTitle>Приостановить</VListItemTitle>
            </VListItem>
            <VDivider />
            <VListItem @click="() => { isBulkDeleteDialogOpen = true; isBulkActionsMenuOpen = false }">
              <VListItemTitle class="text-error">Удалить</VListItemTitle>
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

          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="bx-refresh"
            @click="fetchSchedules"
          >
            Обновить
          </VBtn>
        </div>
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
                      size="small"
                      :disabled="index === 0"
                      @click="moveColumn(index, 'up')"
                    >
                      <VIcon icon="bx-chevron-up" />
                    </IconBtn>
                    <IconBtn
                      size="small"
                      :disabled="index === columnSettings.length - 1"
                      @click="moveColumn(index, 'down')"
                    >
                      <VIcon icon="bx-chevron-down" />
                    </IconBtn>
                  </div>
                </template>
              </VListItem>
            </VList>
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end">
              <VBtn color="primary" variant="elevated" @click="isColumnsDialogOpen = false">Готово</VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог фильтров -->
      <VDialog v-model="isFilterDialogOpen" max-width="900px">
        <VCard title="Фильтры">
          <VCardText>
            <!-- Пресеты -->
            <div class="mb-4">
              <div class="text-subtitle-2 mb-2">Пресеты</div>
              <div class="d-flex flex-wrap gap-2">
                <VChip
                  v-for="preset in filterPresets"
                  :key="preset.id"
                  closable
                  @click="applyPreset(preset)"
                  @click:close="deletePreset(preset.id, FILTER_PRESETS_KEY)"
                >
                  {{ preset.name }}
                </VChip>
                <VBtn
                  variant="outlined"
                  size="small"
                  @click="isSavePresetDialogOpen = true"
                >
                  + Сохранить текущие
                </VBtn>
              </div>
            </div>

            <VDivider class="mb-4" />

            <!-- Заголовки таблицы фильтров -->
            <div class="d-flex gap-2 mb-2 text-subtitle-2">
              <div style="width: 180px;">Колонка</div>
              <div style="width: 150px;">Условие</div>
              <div style="width: 200px;">Значение</div>
              <div style="width: 60px;"></div>
            </div>

            <!-- Строки фильтров -->
            <div
              v-for="(filter, index) in filterRows"
              :key="filter.id"
              class="d-flex gap-2 mb-2 align-center"
            >
              <AppSelect
                v-model="filter.column"
                :items="filterableColumns"
                item-title="title"
                item-value="value"
                placeholder="Колонка"
                style="width: 180px;"
              />
               <AppSelect
                 v-model="filter.condition"
                 :items="getConditionsForColumn(columnSettings.find(c => c.key === filter.column))"
                 placeholder="Условие"
                 style="width: 150px;"
                 :clearable="filter.condition !== null"
               />
              
              <!-- Для булевых колонок -->
              <AppSelect
                v-if="columnSettings.find(c => c.key === filter.column)?.type === 'boolean'"
                v-model="filter.value"
                :items="booleanOptions"
                item-title="title"
                item-value="value"
                placeholder="Значение"
                :disabled="filter.condition === 'is_empty' || filter.condition === 'is_not_empty'"
                style="width: 200px;"
                :clearable="filter.value !== null && filter.value !== '' && filter.condition !== 'is_empty' && filter.condition !== 'is_not_empty'"
              />
              
              <!-- Для колонок со справочниками -->
              <AppSelect
                v-else-if="columnSettings.find(c => c.key === filter.column)?.type === 'select'"
                v-model="filter.value"
                :items="columnSettings.find(c => c.key === filter.column)?.options || []"
                item-title="title"
                item-value="value"
                placeholder="Значение"
                :disabled="filter.condition === 'is_empty' || filter.condition === 'is_not_empty'"
                style="width: 200px;"
                :clearable="filter.value !== null && filter.value !== '' && filter.condition !== 'is_empty' && filter.condition !== 'is_not_empty'"
              />
              
              <!-- Для дат -->
              <AppTextField
                v-else-if="columnSettings.find(c => c.key === filter.column)?.type === 'date'"
                v-model="filter.value"
                type="date"
                placeholder="Значение"
                :disabled="filter.condition === 'is_empty' || filter.condition === 'is_not_empty'"
                style="width: 200px;"
              />
              
              <!-- Для текстовых полей -->
              <AppTextField
                v-else
                v-model="filter.value"
                placeholder="Значение"
                :disabled="filter.condition === 'is_empty' || filter.condition === 'is_not_empty'"
                style="width: 200px;"
              />
              
              <IconBtn @click="removeFilterRow(filter.id)">
                <VIcon icon="bx-trash" />
              </IconBtn>
            </div>

            <VBtn
              variant="text"
              size="small"
              class="mt-2"
              @click="addFilterRow"
            >
              + Добавить условие
            </VBtn>
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn variant="text" @click="clearAllFilters">Сбросить всё</VBtn>
              <VBtn color="error" variant="outlined" @click="isFilterDialogOpen = false">Отмена</VBtn>
              <VBtn color="success" variant="elevated" @click="isFilterDialogOpen = false">Применить</VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог сохранения пресета -->
      <VDialog v-model="isSavePresetDialogOpen" max-width="400px">
        <VCard title="Сохранить пресет">
          <VCardText>
            <AppTextField
              v-model="newPresetName"
              placeholder="Название пресета"
              @keyup.enter="saveCurrentAsPreset(FILTER_PRESETS_KEY)"
            />
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn variant="text" @click="isSavePresetDialogOpen = false">Отмена</VBtn>
              <VBtn color="success" variant="elevated" @click="saveCurrentAsPreset(FILTER_PRESETS_KEY)">Сохранить</VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог массового удаления -->
      <VDialog v-model="isBulkDeleteDialogOpen" max-width="500px">
        <VCard title="Подтверждение удаления">
          <VCardText>
            Вы уверены, что хотите удалить выбранные расписания? Это действие нельзя отменить.
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn color="error" variant="outlined" @click="isBulkDeleteDialogOpen = false">Отмена</VBtn>
              <VBtn color="success" variant="elevated" @click="confirmBulkDelete">Удалить</VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <VDivider />

      <!-- Пустое состояние -->
      <div v-if="!loading && filteredSchedules.length === 0" class="text-center pa-6">
        <VIcon icon="bx-calendar" size="48" color="grey" class="mb-2" />
        <p class="text-body-1 text-medium-emphasis">
          Нет активных расписаний
        </p>
        <p class="text-body-2 text-medium-emphasis">
          Создайте расписание для тикета в его редакторе
        </p>
      </div>

      <!-- Таблица -->
      <VDataTable
        v-model="selectedItems"
        v-model:items-per-page="itemsPerPage"
        v-model:page="currentPage"
        :headers="headers"
        :items="filteredSchedules"
        show-select
        :hide-default-footer="true"
        item-value="id"
        no-data-text="Нет данных"
      >
        <!-- Тикет -->
        <template #item.ticketNumber="{ item }">
          <div class="d-flex align-center gap-2">
            <VBtn
              variant="text"
              size="small"
              @click="goToTicket(item.ticketId)"
            >
              #{{ item.ticketNumber || item.ticketId }}
            </VBtn>
          </div>
        </template>

        <!-- Название -->
        <template #item.title="{ item }">
          <span class="text-body-2 text-truncate" style="max-width: 200px; display: block;">
            {{ item.title || '-' }}
          </span>
        </template>

        <!-- Тип расписания -->
        <template #item.scheduleType="{ item }">
          <VChip
            size="small"
            variant="tonal"
            color="primary"
          >
            {{ getScheduleTypeText(item.scheduleType) }}
          </VChip>
        </template>

        <!-- Время -->
        <template #item.scheduleTime="{ item }">
          <span class="text-body-2">{{ item.scheduleTime || '-' }}</span>
        </template>

        <!-- Период -->
        <template #item.period="{ item }">
          <span v-if="item.scheduleType === 'weekly'" class="text-body-2">
            {{ getWeekDaysText(item.scheduleDays) }}
          </span>
          <span v-else-if="item.scheduleType === 'monthly'" class="text-body-2">
            {{ item.scheduleDayOfMonth }} числа
          </span>
          <span v-else class="text-body-2">-</span>
        </template>

        <!-- Дата начала -->
        <template #item.startDate="{ item }">
          <span class="text-body-2">{{ formatDateOnly(item.startDate) }}</span>
        </template>

        <!-- Дата окончания -->
        <template #item.endDate="{ item }">
          <span class="text-body-2">{{ formatDateOnly(item.endDate) }}</span>
        </template>

        <!-- Следующий запуск -->
        <template #item.nextRunAt="{ item }">
          <span v-if="item.nextRunAt" class="text-body-2" :class="{
            'text-success': new Date(item.nextRunAt) <= new Date(),
            'text-medium-emphasis': new Date(item.nextRunAt) > new Date()
          }">
            {{ formatDate(item.nextRunAt) }}
          </span>
          <span v-else class="text-error">
            Завершено
          </span>
        </template>

        <!-- Последний запуск -->
        <template #item.lastRunAt="{ item }">
          <span v-if="item.lastRunAt" class="text-body-2">
            {{ formatDate(item.lastRunAt) }}
          </span>
          <span v-else class="text-body-2 text-medium-emphasis">
            Ещё не выполнялось
          </span>
        </template>

        <!-- Статус -->
        <template #item.isActive="{ item }">
          <VChip
            size="small"
            :color="getScheduleStatus(item).color"
            :variant="getScheduleStatus(item).variant"
          >
            {{ getScheduleStatus(item).text }}
          </VChip>
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn @click="openLogsDialog(item)">
              <VIcon icon="bx-history" />
            </IconBtn>
            <IconBtn @click="toggleActiveStatus(item.id, !item.isActive)">
              <VIcon :icon="item.isActive ? 'bx-pause' : 'bx-play'" />
            </IconBtn>
            <IconBtn @click="openEditDialog(item)">
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
          :length="Math.ceil(filteredSchedules.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог удаления -->
    <VDialog v-model="deleteDialog" max-width="500px">
      <VCard title="Подтверждение удаления">
        <VCardText>
          Вы уверены, что хотите удалить это расписание? Это действие нельзя отменить.
        </VCardText>
        <VCardText>
          <div class="d-flex justify-center gap-4">
            <VBtn color="error" variant="outlined" @click="closeDelete">Отмена</VBtn>
            <VBtn color="success" variant="elevated" @click="deleteItemConfirm">Удалить</VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог логов расписания -->
    <VDialog v-model="logsDialog" max-width="700px">
      <VCard title="История выполнения расписания">
        <VCardText>
          <div v-if="logsLoading" class="d-flex justify-center pa-4">
            <VProgressCircular indeterminate color="primary" />
          </div>
          <div v-else-if="scheduleLogs.length === 0" class="text-center pa-4 text-medium-emphasis">
            Нет записей в истории выполнения
          </div>
          <VTable v-else density="compact">
            <thead>
              <tr>
                <th>Время</th>
                <th>Статус</th>
                <th>Созданный тикет</th>
                <th>Ошибка</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in scheduleLogs" :key="log.id">
                <td>{{ formatLogDate(log.executedAt) }}</td>
                <td>
                  <VChip size="small" :color="getLogStatusColor(log.status)">
                    {{ log.status === 'success' ? 'Успешно' : log.status === 'error' ? 'Ошибка' : 'Пропущено' }}
                  </VChip>
                </td>
                <td>
                  <a v-if="log.createdTicketNumber" :href="`/apps/tickets/edit?id=${log.createdTicketId}`" target="_blank" class="text-primary">
                    #{{ log.createdTicketNumber }}
                  </a>
                  <span v-else>-</span>
                </td>
                <td>
                  <span v-if="log.errorMessage" class="text-error">{{ log.errorMessage }}</span>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
        <VCardText>
          <div class="d-flex justify-end">
            <VBtn color="primary" variant="elevated" @click="logsDialog = false">Закрыть</VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог редактирования расписания -->
    <TicketScheduleDialog
      v-model="editDialog"
      :schedule="editingSchedule"
      :saving="savingSchedule"
      :ticket-id="editingSchedule?.ticketId || undefined"
      @save="saveSchedule"
      @delete="deleteScheduleFromDialog"
      @run-now="runScheduleNow"
    />

    <!-- Уведомления -->
    <VSnackbar v-model="isToastVisible" :color="toastColor" timeout="5000">
      {{ toastMessage }}
    </VSnackbar>
  </div>
</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}
</style>
