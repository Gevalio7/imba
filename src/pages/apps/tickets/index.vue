<script setup lang="ts">
import { useFilters, type ColumnSetting } from '@/composables/useFilters'
import { $fetch } from 'ofetch'
import { computed, onMounted, ref, watch } from 'vue'

// Типы данных
interface Ticket {
  id: number
  ticketNumber: string
  title: string
  typeId: number | null
  typeName: string | null
  categoryId: number | null
  categoryName: string | null
  priorityId: number | null
  priorityName: string | null
  priorityColor: string | null
  queueId: number | null
  queueName: string | null
  stateId: number | null
  stateName: string | null
  stateColor: string | null
  ownerId: number | null
  ownerLogin: string | null
  ownerFirstname: string | null
  ownerLastname: string | null
  executorAgentIds: number[] | null
  executorGroupIds: number[] | null
  executorAgents: { id: number; login: string; firstName: string | null; lastName: string | null }[] | null
  executorGroups: { id: number; name: string }[] | null
  companyId: number | null
  companyName: string | null
  serviceId: number | null
  serviceName: string | null
  slaId: number | null
  slaName: string | null
  description: string | null
  createdAt: string
  updatedAt: string
  responseDeadline: string | null
  resolutionDeadline: string | null
  firstResponseAt: string | null
  slaViolated: boolean | null
  pendingStartAt: string | null
}

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL
const router = useRouter()

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

const FILTER_PRESETS_KEY = 'tickets-filter-presets'

// Данные
const tickets = ref<Ticket[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Загрузка данных
const fetchTickets = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await $fetch<{ tickets: Ticket[], total: number }>(`${API_BASE}/tickets`)
    tickets.value = data.tickets
    total.value = data.total
    
    // После загрузки тикетов - обновляем опции фильтров
    if (tickets.value.length > 0) {
      loadUniqueValuesFromTickets()
    }
  } catch (err) {
    error.value = 'Ошибка загрузки обращений'
    console.error('Error fetching tickets:', err)
  } finally {
    loading.value = false
  }
}

// Удаление тикета
const deleteTicketById = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/tickets/${id}`, { method: 'DELETE' })
    const index = tickets.value.findIndex(t => t.id === id)
    if (index !== -1) tickets.value.splice(index, 1)
  } catch (err) {
    console.error('Error deleting ticket:', err)
    throw err
  }
}

// Доступные колонки с типами и опциями
const availableColumns: ColumnSetting[] = [
  { key: 'ticketNumber', title: 'Номер', visible: true, sortable: true, type: 'text' },
  { key: 'title', title: 'Заголовок', visible: true, sortable: true, type: 'text' },
  { key: 'typeName', title: 'Тип', visible: true, sortable: false, type: 'select' },
  { key: 'categoryName', title: 'Категория', visible: true, sortable: false, type: 'select' },
  { key: 'priorityName', title: 'Приоритет', visible: true, sortable: false, type: 'select' },
  { key: 'queueName', title: 'Очередь', visible: true, sortable: false, type: 'select' },
  { key: 'stateName', title: 'Статус', visible: true, sortable: false, type: 'select' },
  { key: 'slaStatus', title: 'SLA', visible: true, sortable: false, type: 'select' },
  { key: 'responseDeadline', title: 'Срок ответа', visible: true, sortable: true, type: 'date' },
  { key: 'resolutionDeadline', title: 'Срок решения', visible: true, sortable: true, type: 'date' },
  { key: 'ownerLogin', title: 'Автор', visible: true, sortable: false, type: 'select' },
  { key: 'executorGroupIds', title: 'Группы', visible: true, sortable: false, type: 'select' },
  { key: 'executorAgentIds', title: 'Исполнители', visible: true, sortable: false, type: 'select' },
  { key: 'companyName', title: 'Компания', visible: true, sortable: false, type: 'select' },
  { key: 'serviceName', title: 'Сервис', visible: true, sortable: false, type: 'select' },
  { key: 'createdAt', title: 'Дата создания', visible: true, sortable: true, type: 'date' },
  { key: 'updatedAt', title: 'Дата изменения', visible: true, sortable: true, type: 'date' },
  { key: 'actions', title: 'Действия', visible: true, sortable: false, type: 'text' },
]

// Загрузка/сохранение настроек колонок
const STORAGE_KEY = 'tickets-columns-settings'

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
const getFilterSpecialValue = (ticket: Ticket, columnKey: string): string => {
  if (columnKey === 'slaStatus') {
    return getSlaStatus(ticket).text
  } else if (columnKey === 'executorGroupIds') {
    return ticket.executorGroups?.map(g => g.name).join(', ') || ''
  } else if (columnKey === 'executorAgentIds') {
    return ticket.executorAgents?.map(a => `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.login).join(', ') || ''
  } else if (columnKey === 'ownerLogin') {
    return getOwnerName(ticket)
  }
  return ''
}

const filteredTickets = computed(() => {
  let filtered = tickets.value

  // Поиск
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(t =>
      t.title?.toLowerCase().includes(q) ||
      t.ticketNumber?.toLowerCase().includes(q)
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
const selectedItems = ref<any[]>([])
const isBulkActionsMenuOpen = ref(false)
const isBulkDeleteDialogOpen = ref(false)

const bulkDelete = () => {
  isBulkDeleteDialogOpen.value = true
}

const bulkClone = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await cloneTicketById(item.id)
    }
    showToast(`Клонировано ${count} обращений`)
    // Обновляем данные
    await fetchTickets()
  } catch (err) {
    showToast('Ошибка клонирования обращений', 'error')
  }
}

// Клонирование тикета
const cloneTicketById = async (id: number) => {
  try {
    // Получаем тикет
    const ticket = tickets.value.find(t => t.id === id)
    if (!ticket) throw new Error('Тикет не найден')
    
    // Создаем копию с основными полями
    const cloneData = {
      title: `${ticket.title} (копия)`,
      typeId: ticket.typeId,
      categoryId: ticket.categoryId,
      priorityId: ticket.priorityId,
      queueId: ticket.queueId,
      ownerId: ticket.ownerId,
      companyId: ticket.companyId,
      serviceId: ticket.serviceId,
      slaId: ticket.slaId,
      description: ticket.description || null,
      executorAgentIds: ticket.executorAgentIds || [],
      executorGroupIds: ticket.executorGroupIds || [],
    }
    
    const newTicket = await $fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      body: cloneData
    })
    
    return newTicket
  } catch (err) {
    console.error('Error cloning ticket:', err)
    throw err
  }
}

const confirmBulkDelete = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await deleteTicketById(item.id)
    }
    selectedItems.value = []
    showToast(`Удалено ${count} обращений`)
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}



const resolvePriorityColor = (color?: string | null) => {
  return color || 'secondary'
}

const resolveStateColor = (color?: string | null) => {
  return color || 'secondary'
}

// Функция для определения статуса SLA
const getSlaStatus = (ticket: Ticket) => {
  if (!ticket.responseDeadline && !ticket.resolutionDeadline) {
    return { color: 'grey', text: 'Нет SLA', variant: 'text' }
  }
  
  const now = new Date()
  
  if (ticket.slaViolated) {
    return { color: 'error', text: 'SLA нарушен', variant: 'flat' }
  }
  
  if (ticket.responseDeadline) {
    const deadline = new Date(ticket.responseDeadline)
    const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (hoursLeft < 0) {
      return { color: 'error', text: 'Просрочен', variant: 'flat' }
    } else if (hoursLeft < 4) {
      return { color: 'warning', text: 'Скоро истекает', variant: 'tonal' }
    }
  }
  
  if (ticket.resolutionDeadline) {
    const deadline = new Date(ticket.resolutionDeadline)
    const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (hoursLeft < 0) {
      return { color: 'error', text: 'Просрочен', variant: 'flat' }
    } else if (hoursLeft < 4) {
      return { color: 'warning', text: 'Скоро истекает', variant: 'tonal' }
    }
  }
  
  return { color: 'success', text: 'В норме', variant: 'flat' }
}

// Форматтер даты
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getOwnerName = (ticket: Ticket) => {
  if (!ticket.ownerFirstname && !ticket.ownerLastname)
    return ticket.ownerLogin || '-'
  return `${ticket.ownerFirstname || ''} ${ticket.ownerLastname || ''}`.trim()
}

// Диалог удаления
const deleteDialog = ref(false)
const deletingItem = ref<Ticket | null>(null)

const deleteItem = (item: Ticket) => {
  deletingItem.value = item
  deleteDialog.value = true
}

// Клонирование тикета
const cloneTicket = async (item: Ticket) => {
  try {
    await cloneTicketById(item.id)
    showToast('Обращение склонировано')
    // Обновляем данные
    await fetchTickets()
  } catch (err) {
    showToast('Ошибка клонирования обращения', 'error')
  }
}

const closeDelete = () => {
  deleteDialog.value = false
  deletingItem.value = null
}

const deleteItemConfirm = async () => {
  if (!deletingItem.value) return
  try {
    await deleteTicketById(deletingItem.value.id)
    showToast('Обращение успешно удалёно')
    closeDelete()
  } catch (err) {
    showToast('Ошибка удаления обращения', 'error')
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

// Навигация
const createTicket = () => {
  router.push('/apps/tickets/add')
}

const editTicket = (id: number) => {
  router.push({ path: '/apps/tickets/edit', query: { id } })
}

// Загрузка уникальных значений из данных тикетов
const loadUniqueValuesFromTickets = () => {
  console.log('Loading unique values from tickets data...')
  
  // Собираем все уникальные значения из тикетов
  const uniqueValues: Record<string, Set<string>> = {}
  
  tickets.value.forEach(ticket => {
    // Тип
    if (ticket.typeName) {
      if (!uniqueValues.typeName) uniqueValues.typeName = new Set()
      uniqueValues.typeName.add(ticket.typeName)
    }
    // Категория
    if (ticket.categoryName) {
      if (!uniqueValues.categoryName) uniqueValues.categoryName = new Set()
      uniqueValues.categoryName.add(ticket.categoryName)
    }
    // Приоритет
    if (ticket.priorityName) {
      if (!uniqueValues.priorityName) uniqueValues.priorityName = new Set()
      uniqueValues.priorityName.add(ticket.priorityName)
    }
    // Очередь
    if (ticket.queueName) {
      if (!uniqueValues.queueName) uniqueValues.queueName = new Set()
      uniqueValues.queueName.add(ticket.queueName)
    }
    // Статус
    if (ticket.stateName) {
      if (!uniqueValues.stateName) uniqueValues.stateName = new Set()
      uniqueValues.stateName.add(ticket.stateName)
    }
    // Сервис
    if (ticket.serviceName) {
      if (!uniqueValues.serviceName) uniqueValues.serviceName = new Set()
      uniqueValues.serviceName.add(ticket.serviceName)
    }
    // Компания
    if (ticket.companyName) {
      if (!uniqueValues.companyName) uniqueValues.companyName = new Set()
      uniqueValues.companyName.add(ticket.companyName)
    }
    // Автор
    const ownerName = getOwnerName(ticket)
    if (ownerName && ownerName !== '-') {
      if (!uniqueValues.ownerLogin) uniqueValues.ownerLogin = new Set()
      uniqueValues.ownerLogin.add(ownerName)
    }
    // Группы
    if (ticket.executorGroups && ticket.executorGroups.length > 0) {
      if (!uniqueValues.executorGroupIds) uniqueValues.executorGroupIds = new Set()
      ticket.executorGroups.forEach(g => uniqueValues.executorGroupIds!.add(g.name))
    }
    // Исполнители
    if (ticket.executorAgents && ticket.executorAgents.length > 0) {
      if (!uniqueValues.executorAgentIds) uniqueValues.executorAgentIds = new Set()
      ticket.executorAgents.forEach(a => {
        const name = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.login
        if (name) uniqueValues.executorAgentIds!.add(name)
      })
    }
  })
  
  console.log('Unique values collected:', Object.keys(uniqueValues).map(k => `${k}: ${uniqueValues[k].size}`).join(', '))
  
  // Обновляем опции в columnSettings
  columnSettings.value = columnSettings.value.map(col => {
    const newCol = { ...col, options: [] as { title: string, value: string }[] }
    const uniqueSet = uniqueValues[col.key]
    
    if (uniqueSet && uniqueSet.size > 0) {
      newCol.options = Array.from(uniqueSet)
        .sort()
        .map(value => ({ title: value, value }))
      console.log(`Options for ${col.key}:`, newCol.options.length)
    } else if (col.key === 'slaStatus') {
      // SLA status - фиксированные значения
      newCol.options = [
        { title: 'В норме', value: 'В норме' },
        { title: 'Скоро истекает', value: 'Скоро истекает' },
        { title: 'Просрочен', value: 'Просрочен' },
        { title: 'SLA нарушен', value: 'SLA нарушен' },
        { title: 'Нет SLA', value: 'Нет SLA' },
      ]
    }
    
    return newCol
  })
  
  console.log('Unique values loaded successfully')
}

// Инициализация
onMounted(() => {
  fetchTickets()
  loadSavedPresets(FILTER_PRESETS_KEY)
})
</script>

<template>
  <div>
    <VCard title="Обращения">

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
            placeholder="Поиск обращения"
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
                bulkClone()
                isBulkActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Клонировать</VListItemTitle>
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
            prepend-icon="bx-export"
          >
            Экспорт
          </VBtn>

          <VBtn
            color="primary"
            prepend-icon="bx-plus"
            @click="createTicket"
          >
            Создать обращение
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
            Вы уверены, что хотите удалить выбранные обращения? Это действие нельзя отменить.
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

      <!-- Таблица -->
      <VDataTable
        v-model="selectedItems"
        v-model:items-per-page="itemsPerPage"
        v-model:page="currentPage"
        :headers="headers"
        :items="filteredTickets"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Номер тикета -->
        <template #item.ticketNumber="{ item }">
          <span
            class="text-body-1 font-weight-medium text-primary cursor-pointer"
            @click="editTicket(item.id)"
          >
            #{{ item.ticketNumber }}
          </span>
        </template>

        <!-- Тип -->
        <template #item.typeName="{ item }">
          <span class="text-body-2">{{ item.typeName || '-' }}</span>
        </template>

        <!-- Категория -->
        <template #item.categoryName="{ item }">
          <span class="text-body-2">{{ item.categoryName || '-' }}</span>
        </template>

        <!-- Группы исполнителей -->
        <template #item.executorGroupIds="{ item }">
          <span v-if="item.executorGroups && item.executorGroups.length > 0" class="text-body-2">
            {{ item.executorGroups.map(g => g.name).join(', ') }}
          </span>
          <span v-else class="text-body-2 text-medium-emphasis">-</span>
        </template>

        <!-- Исполнители -->
        <template #item.executorAgentIds="{ item }">
          <span v-if="item.executorAgents && item.executorAgents.length > 0" class="text-body-2">
            {{ item.executorAgents.map(a => `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.login).join(', ') }}
          </span>
          <span v-else class="text-body-2 text-medium-emphasis">-</span>
        </template>

        <!-- Приоритет -->
        <template #item.priorityName="{ item }">
          <VChip
            v-if="item.priorityName"
            :color="resolvePriorityColor(item.priorityColor)"
            density="compact"
            label
            size="small"
          >
            {{ item.priorityName }}
          </VChip>
          <span v-else class="text-body-2">-</span>
        </template>

        <!-- Статус -->
        <template #item.stateName="{ item }">
          <VChip
            v-if="item.stateName"
            :color="resolveStateColor(item.stateColor)"
            density="compact"
            label
            size="small"
          >
            {{ item.stateName }}
          </VChip>
          <span v-else class="text-body-2">-</span>
        </template>

        <!-- SLA Статус -->
        <template #item.slaStatus="{ item }">
          <VChip
            :color="getSlaStatus(item).color"
            :variant="getSlaStatus(item).variant as any"
            density="compact"
            label
            size="small"
          >
            {{ getSlaStatus(item).text }}
          </VChip>
        </template>

        <!-- Срок ответа -->
        <template #item.responseDeadline="{ item }">
          <span class="text-body-2" :class="{ 'text-error': getSlaStatus(item).color === 'error' }">
            {{ formatDate(item.responseDeadline) }}
          </span>
        </template>

        <!-- Срок решения -->
        <template #item.resolutionDeadline="{ item }">
          <span class="text-body-2" :class="{ 'text-error': getSlaStatus(item).color === 'error' }">
            {{ formatDate(item.resolutionDeadline) }}
          </span>
        </template>

        <!-- Автор -->
        <template #item.ownerLogin="{ item }">
          <span class="text-body-2">{{ getOwnerName(item) }}</span>
        </template>

        <!-- Сервис -->
        <template #item.serviceName="{ item }">
          <span class="text-body-2">{{ item.serviceName || '-' }}</span>
        </template>

        <!-- Дата создания -->
        <template #item.createdAt="{ item }">
          <span class="text-body-2">{{ formatDate(item.createdAt) }}</span>
        </template>

        <!-- Дата изменения -->
        <template #item.updatedAt="{ item }">
          <span class="text-body-2">{{ formatDate(item.updatedAt) }}</span>
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn @click="cloneTicket(item)">
              <VIcon icon="bx-copy" />
            </IconBtn>
            <IconBtn @click="editTicket(item.id)">
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
          :length="Math.ceil(filteredTickets.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог удаления -->
    <VDialog v-model="deleteDialog" max-width="500px">
      <VCard title="Вы уверены, что хотите удалить это обращение?">
        <VCardText>
          <div class="d-flex justify-center gap-4">
            <VBtn color="error" variant="outlined" @click="closeDelete">Отмена</VBtn>
            <VBtn color="success" variant="elevated" @click="deleteItemConfirm">Удалить</VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Уведомления -->
    <VSnackbar v-model="isToastVisible" :color="toastColor" timeout="3000">
      {{ toastMessage }}
    </VSnackbar>
  </div>
</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
