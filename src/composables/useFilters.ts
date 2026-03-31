// Composable для фильтрации
import { computed, ref } from 'vue'

// Типы данных для фильтров
export type FilterCondition = 'contains' | 'equals' | 'not_equals' | 'starts_with' | 'ends_with' | 'greater' | 'less' | 'is_empty' | 'is_not_empty'

export interface FilterRow {
  id: number
  column: string
  condition: FilterCondition
  value: string
}

export interface FilterPreset {
  id: number
  name: string
  filters: FilterRow[]
}

// Доступные условия фильтрации
export const filterConditions: { title: string; value: FilterCondition }[] = [
  { title: 'Содержит', value: 'contains' },
  { title: 'Равно', value: 'equals' },
  { title: 'Не равно', value: 'not_equals' },
  { title: 'Начинается с', value: 'starts_with' },
  { title: 'Заканчивается на', value: 'ends_with' },
  { title: 'Больше', value: 'greater' },
  { title: 'Меньше', value: 'less' },
  { title: 'Пусто', value: 'is_empty' },
  { title: 'Не пусто', value: 'is_not_empty' },
]

// Условия для булевых полей
export const booleanConditions: { title: string; value: FilterCondition }[] = [
  { title: 'Равно', value: 'equals' },
  { title: 'Пусто', value: 'is_empty' },
  { title: 'Не пусто', value: 'is_not_empty' },
]

// Условия для дат
export const dateConditions: { title: string; value: FilterCondition }[] = [
  { title: 'Равно', value: 'equals' },
  { title: 'Больше', value: 'greater' },
  { title: 'Меньше', value: 'less' },
  { title: 'Пусто', value: 'is_empty' },
  { title: 'Не пусто', value: 'is_not_empty' },
]

// Опции для булевых полей
export const booleanOptions = [
  { title: 'Да', value: 'true' },
  { title: 'Нет', value: 'false' },
]

// Интерфейс для колонки
export interface ColumnSetting {
  key: string
  title: string
  visible: boolean
  sortable: boolean
  type: 'text' | 'select' | 'boolean' | 'date'
  options?: { title: string; value: string }[]
}

// Пресеты по умолчанию
const defaultPresets: FilterPreset[] = [
  {
    id: 1,
    name: 'Активные обращения',
    filters: [
      { id: 1, column: 'isActive', condition: 'equals', value: 'true' }
    ]
  },
  {
    id: 2,
    name: 'Просроченные SLA',
    filters: [
      { id: 1, column: 'slaStatus', condition: 'equals', value: 'Просрочен' }
    ]
  },
  {
    id: 3,
    name: 'Мои обращения',
    filters: []
  }
]

export function useFilters() {
  // Состояние фильтров
  const filterRows = ref<FilterRow[]>([
    { id: 1, column: '', condition: 'contains', value: '' }
  ])
  let filterRowIdCounter = 1

  // Пресеты
  const savedPresets = ref<FilterPreset[]>([])
  const filterPresets = computed(() => [...defaultPresets, ...savedPresets.value])

  // Диалоги
  const isFilterDialogOpen = ref(false)
  const isSavePresetDialogOpen = ref(false)
  const newPresetName = ref('')

  // Загрузка сохранённых пресетов
  const loadSavedPresets = (storageKey: string) => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        savedPresets.value = JSON.parse(saved)
      }
    } catch (e) {
      console.error('Error loading filter presets:', e)
    }
  }

  // Сохранение пресетов
  const savePresets = (storageKey: string) => {
    localStorage.setItem(storageKey, JSON.stringify(savedPresets.value))
  }

  // Добавить строку фильтра
  const addFilterRow = () => {
    filterRowIdCounter++
    filterRows.value.push({ id: filterRowIdCounter, column: '', condition: 'contains', value: '' })
  }

  // Удалить строку фильтра
  const removeFilterRow = (id: number) => {
    if (filterRows.value.length > 1) {
      filterRows.value = filterRows.value.filter(f => f.id !== id)
    }
  }

  // Применить пресет
  const applyPreset = (preset: FilterPreset) => {
    filterRows.value = preset.filters.map(f => ({ ...f, id: Math.random() }))
    filterRowIdCounter = filterRows.value.length
  }

  // Сохранить текущие фильтры как пресет
  const saveCurrentAsPreset = (storageKey: string) => {
    if (!newPresetName.value.trim()) return
    const newPreset: FilterPreset = {
      id: Date.now(),
      name: newPresetName.value.trim(),
      filters: filterRows.value.filter(f => f.column && f.condition)
    }
    savedPresets.value.push(newPreset)
    savePresets(storageKey)
    newPresetName.value = ''
    isSavePresetDialogOpen.value = false
  }

  // Удалить пресет
  const deletePreset = (id: number, storageKey: string) => {
    if (id <= 3) return // Не удалять дефолтные
    savedPresets.value = savedPresets.value.filter(p => p.id !== id)
    savePresets(storageKey)
  }

  // Очистить все фильтры
  const clearAllFilters = () => {
    filterRows.value = [{ id: 1, column: '', condition: 'contains', value: '' }]
  }

  // Получить условия для конкретной колонки
  const getConditionsForColumn = (column: ColumnSetting | undefined) => {
    if (!column) return filterConditions
    
    if (column.type === 'boolean') return booleanConditions
    if (column.type === 'date') return dateConditions
    return filterConditions
  }

  // Применить фильтр к записи
  const applyFilter = <T extends Record<string, any>>(
    item: T, 
    filter: FilterRow, 
    columns: ColumnSetting[],
    getSpecialValue?: (item: T, columnKey: string) => string
  ): boolean => {
    const columnKey = filter.column
    if (!columnKey) return true
    
    const column = columns.find(c => c.key === columnKey)
    let cellValue: any = item[columnKey as keyof keyof T]
    
    // Обработка special полей
    if (getSpecialValue) {
      const specialValue = getSpecialValue(item, columnKey)
      if (specialValue !== undefined) {
        cellValue = specialValue
      }
    }
    
    // Для булевых полей
    if (column?.type === 'boolean') {
      if (filter.condition === 'is_empty') return !cellValue
      if (filter.condition === 'is_not_empty') return cellValue
      if (filter.condition === 'equals') return String(cellValue) === filter.value
      return true
    }
    
    // Для дат
    if (column?.type === 'date' && cellValue) {
      const cellDate = new Date(cellValue).toISOString().split('T')[0]
      const filterDate = filter.value
      
      if (filter.condition === 'equals') return cellDate === filterDate
      if (filter.condition === 'greater') return cellDate > filterDate
      if (filter.condition === 'less') return cellDate < filterDate
      if (filter.condition === 'is_empty') return !cellValue
      if (filter.condition === 'is_not_empty') return !!cellValue
      return true
    }
    
    // Для текстовых полей
    // Если значение фильтра пустое или null/undefined, пропускаем фильтр
    if (!filter.value && filter.condition !== 'is_empty' && filter.condition !== 'is_not_empty') {
      return true
    }
    const filterValue = filter.value?.toLowerCase() || ''
    
    switch (filter.condition) {
      case 'contains':
        return String(cellValue || '').toLowerCase().includes(filterValue)
      case 'equals':
        return String(cellValue || '').toLowerCase() === filterValue
      case 'not_equals':
        return String(cellValue || '').toLowerCase() !== filterValue
      case 'starts_with':
        return String(cellValue || '').toLowerCase().startsWith(filterValue)
      case 'ends_with':
        return String(cellValue || '').toLowerCase().endsWith(filterValue)
      case 'greater':
        return cellValue > filter.value
      case 'less':
        return cellValue < filter.value
      case 'is_empty':
        return !cellValue || cellValue === '-'
      case 'is_not_empty':
        return !!cellValue && cellValue !== '-'
      default:
        return true
    }
  }

  // Применить все фильтры к списку
  const filterItems = <T extends Record<string, any>>(
    items: T[],
    columns: ColumnSetting[],
    getSpecialValue?: (item: T, columnKey: string) => string
  ) => {
    const activeFilters = filterRows.value.filter(f => f.column && f.condition)
    if (activeFilters.length === 0) return items
    
    return items.filter(item => {
      return activeFilters.every(filter => applyFilter(item, filter, columns, getSpecialValue))
    })
  }

  return {
    // Состояние
    filterRows,
    filterPresets,
    isFilterDialogOpen,
    isSavePresetDialogOpen,
    newPresetName,
    // Методы
    loadSavedPresets,
    addFilterRow,
    removeFilterRow,
    applyPreset,
    saveCurrentAsPreset,
    deletePreset,
    clearAllFilters,
    getConditionsForColumn,
    filterItems,
    // Константы
    filterConditions,
    booleanConditions,
    dateConditions,
    booleanOptions,
  }
}
