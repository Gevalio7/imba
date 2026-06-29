import { computed, ref, type ComputedRef, type Ref, watch } from 'vue'
import { $api } from '@/utils/api'
import { useToast } from '@/composables/useToast'

// ========================
// Types
// ========================

/** Базовый интерфейс для сущности с поддержкой isActive */
export interface BaseEntity {
  id: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  [key: string]: any
}

export interface CrudHeader {
  title: string
  key: string
  sortable: boolean
}

export interface CrudConfig<T extends BaseEntity> {
  /** Эндпоинт API, напр. '/states' — передаётся напрямую в $api (baseURL уже настроен) */
  endpoint: string
  /** Название сущности в родительном падеже, напр. 'состояния' */
  itemName: string
  /** Заголовки таблицы */
  headers: CrudHeader[]
  /** Значение по умолчанию для новой сущности */
  defaultItem: T
  /** Ключ ответа API, если он отличается от имени эндпоинта (напр. '/backup' возвращает { data: [...] }) */
  responseKey?: string
  /** Функция дополнительной фильтрации */
  customFilter?: (item: T, searchQuery: string) => boolean
  /** Дополнительные поля для массового обновления статуса */
  extraUpdateFields?: (item: T) => Record<string, any>
  /** Обработчик перед сохранением (для валидации/трансформации) */
  beforeSave?: (item: T) => T | Promise<T>
  /** Обработчик после успешного сохранения */
  afterSave?: (saved: T, isNew: boolean) => void | Promise<void>
  /** Сбрасывать страницу на 1 при изменении itemsPerPage */
  autoResetPageOnPageSizeChange?: boolean
}

export interface UseEntityCrudReturn<T extends BaseEntity> {
  // === Состояния данных ===
  items: Ref<T[]>
  total: Ref<number>
  loading: Ref<boolean>
  error: Ref<string | null>

  // === CRUD ===
  fetchItems: (silent?: boolean) => Promise<void>
  createItem: (item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Promise<T>
  updateItem: (id: number, item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Promise<T>
  deleteItemById: (id: number) => Promise<void>

  // === Диалоги ===
  editDialog: Ref<boolean>
  deleteDialog: Ref<boolean>
  editedItem: Ref<T>
  editedIndex: Ref<number>
  defaultItem: T

  // === Массовые действия ===
  selectedItems: Ref<T[]>
  isBulkActionsMenuOpen: Ref<boolean>
  isBulkDeleteDialogOpen: Ref<boolean>
  isBulkStatusDialogOpen: Ref<boolean>
  bulkStatusValue: Ref<number>
  statusOptions: { text: string; value: number }[]
  bulkDelete: () => void
  bulkChangeStatus: () => void
  confirmBulkDelete: () => Promise<void>
  confirmBulkStatusChange: () => Promise<void>

  // === Хелперы ===
  resolveStatusVariant: (isActive: boolean) => { color: string; text: string }
  toggleStatus: (item: T, newValue: boolean | null) => Promise<void>
  hasActiveFilters: ComputedRef<boolean>

  // === Пагинация ===
  currentPage: Ref<number>
  itemsPerPage: Ref<number>
  searchQuery: Ref<string>
  pageCount: ComputedRef<number>

  // === Фильтры ===
  statusFilter: Ref<number | null>
  isFilterDialogOpen: Ref<boolean>
  clearFilters: () => void
  filteredItems: ComputedRef<T[]>

  // === Действия ===
  editItem: (item: T) => void
  deleteItem: (item: T) => void
  close: () => void
  closeDelete: () => void
  save: () => Promise<void>
  deleteItemConfirm: () => Promise<void>
  addNewItem: () => void
}

// ========================
// Composable
// ========================

export function useEntityCrud<T extends BaseEntity>(
  config: CrudConfig<T>,
): UseEntityCrudReturn<T> {
  const { showToast } = useToast()

  const {
    endpoint,
    itemName,
    headers: _headers,
    defaultItem: _defaultItem,
    responseKey,
    customFilter,
    extraUpdateFields,
    beforeSave,
    afterSave,
    autoResetPageOnPageSizeChange = true,
  } = config

  // === Состояния данных ===
  const items: Ref<T[]> = ref([]) as any
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // === CRUD ===
  const fetchItems = async (silent = false) => {
    try {
      if (!silent) loading.value = true
      error.value = null

      const data = await $api<Record<string, any>>(endpoint)

      // Извлекаем массив: явный ключ > производный от эндпоинта > data > сам ответ
      const key = responseKey || endpoint.replace(/^\//, '').replace(/\/$/, '')
      const raw = data[key] ?? data.data ?? data

      items.value = (Array.isArray(raw) ? raw : []) as T[]
      total.value = data.total ?? items.value.length
    }
    catch (err) {
      error.value = `Ошибка загрузки ${itemName}`
      console.error(`Error fetching ${itemName}:`, err)
    }
    finally {
      if (!silent) loading.value = false
    }
  }

  const createItem = async (item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> => {
    const data = await $api<T>(endpoint, {
      method: 'POST',
      body: item,
    })
    items.value.unshift(data)
    return data
  }

  const updateItem = async (id: number, item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> => {
    const data = await $api<T>(`${endpoint}/${id}`, {
      method: 'PUT',
      body: item,
    })
    const index = items.value.findIndex(p => p.id === id)
    if (index !== -1)
      items.value[index] = data

    return data
  }

  const deleteItemById = async (id: number): Promise<void> => {
    await $api(`${endpoint}/${id}`, { method: 'DELETE' })
    const index = items.value.findIndex(p => p.id === id)
    if (index !== -1)
      items.value.splice(index, 1)
  }

  // === Пагинация ===
  const currentPage = ref(1)
  const itemsPerPage = ref(10)
  const searchQuery = ref('')
  const pageCount = computed(() => Math.ceil(filteredItems.value.length / itemsPerPage.value) || 1)

  // === Фильтры ===
  const statusFilter = ref<number | null>(null)
  const isFilterDialogOpen = ref(false)

  const hasActiveFilters = computed(() => statusFilter.value !== null)

  const clearFilters = () => {
    searchQuery.value = ''
    statusFilter.value = null
  }

  const filteredItems = computed(() => {
    let filtered = items.value

    // Поиск
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      filtered = filtered.filter(p => {
        if (customFilter) return customFilter(p, q)
        return (p.name != null ? String(p.name) : '').toLowerCase().includes(q)
      })
    }

    // Фильтр по статусу
    if (statusFilter.value !== null) {
      filtered = filtered.filter(p => p.isActive === (statusFilter.value === 1))
    }

    return filtered
  })

  // === Диалоги ===
  const editDialog = ref(false)
  const deleteDialog = ref(false)

  const defaultItemRef = ref<T>({ ..._defaultItem })
  const editedItem = ref<T>({ ..._defaultItem })
  const editedIndex = ref(-1)

  const editItem = (item: T) => {
    editedIndex.value = items.value.indexOf(item)
    editedItem.value = { ...item }
    editDialog.value = true
  }

  const deleteItem = (item: T) => {
    editedIndex.value = items.value.indexOf(item)
    editedItem.value = { ...item }
    deleteDialog.value = true
  }

  const close = () => {
    editDialog.value = false
    editedIndex.value = -1
    editedItem.value = { ...defaultItemRef.value }
  }

  const closeDelete = () => {
    deleteDialog.value = false
    editedIndex.value = -1
    editedItem.value = { ...defaultItemRef.value }
  }

  const save = async () => {
    try {
      let payload = { ...editedItem.value } as any
      // Удаляем системные поля
      delete payload.id
      delete payload.createdAt
      delete payload.updatedAt

      if (beforeSave) {
        payload = await beforeSave(payload as T)
      }

      if (editedIndex.value > -1) {
        const updated = await updateItem(editedItem.value.id, payload)
        showToast(`${capitalize(itemName)} успешно сохранен(о)`)
        if (afterSave) await afterSave(updated, false)
      }
      else {
        const created = await createItem(payload)
        showToast(`${capitalize(itemName)} успешно добавлен(о)`)
        if (afterSave) await afterSave(created, true)
      }
      close()
    }
    catch (err) {
      showToast(`Ошибка сохранения ${itemName}`, 'error')
    }
  }

  const deleteItemConfirm = async () => {
    try {
      await deleteItemById(editedItem.value.id)
      showToast(`${capitalize(itemName)} успешно удален(о)`)
      closeDelete()
    }
    catch (err) {
      showToast(`Ошибка удаления ${itemName}`, 'error')
    }
  }

  const addNewItem = () => {
    editedItem.value = { ...defaultItemRef.value }
    editedIndex.value = -1
    editDialog.value = true
  }

  // === Массовые действия ===
  const selectedItems: Ref<T[]> = ref([]) as any
  const isBulkActionsMenuOpen = ref(false)
  const isBulkDeleteDialogOpen = ref(false)
  const isBulkStatusDialogOpen = ref(false)
  const bulkStatusValue = ref(1)

  const statusOptions = [
    { text: 'Активен', value: 1 },
    { text: 'Не активен', value: 2 },
  ]

  const bulkDelete = () => {
    isBulkDeleteDialogOpen.value = true
  }

  const bulkChangeStatus = () => {
    isBulkStatusDialogOpen.value = true
  }

  const confirmBulkDelete = async () => {
    try {
      const count = selectedItems.value.length
      for (const item of selectedItems.value)
        await deleteItemById(item.id)

      selectedItems.value = []
      showToast(`Удалено ${count} ${itemName}`)
      isBulkDeleteDialogOpen.value = false
    }
    catch (err) {
      showToast(`Ошибка массового удаления ${itemName}`, 'error')
    }
  }

  const confirmBulkStatusChange = async () => {
    try {
      const count = selectedItems.value.length
      const newStatus = bulkStatusValue.value === 1
      for (const item of selectedItems.value) {
        const updates: Record<string, any> = { ...item, isActive: newStatus }
        if (extraUpdateFields) {
          Object.assign(updates, extraUpdateFields(item))
        }
        await updateItem(item.id, updates as Omit<T, 'id' | 'createdAt' | 'updatedAt'>)
      }
      selectedItems.value = []
      showToast(`Статус изменен для ${count} ${itemName}`)
      isBulkStatusDialogOpen.value = false
    }
    catch (err) {
      showToast(`Ошибка массового изменения статуса ${itemName}`, 'error')
    }
  }

  // Сброс страницы при изменении itemsPerPage
  if (autoResetPageOnPageSizeChange) {
    watch(itemsPerPage, () => {
      currentPage.value = 1
      if (items.value.length > 0) fetchItems(true)
    })
  }

  // === Хелперы ===
  const resolveStatusVariant = (isActive: boolean) => {
    if (isActive)
      return { color: 'primary', text: 'Активен' }
    else
      return { color: 'error', text: 'Не активен' }
  }

  const toggleStatus = async (item: T, newValue: boolean | null) => {
    if (newValue === null) return

    try {
      const payload: Record<string, any> = { ...item, isActive: newValue }
      delete payload.id
      delete payload.createdAt
      delete payload.updatedAt

      await updateItem(item.id, payload as Omit<T, 'id' | 'createdAt' | 'updatedAt'>)
      showToast(`Статус ${itemName} изменен`)
    }
    catch (err) {
      showToast(`Ошибка изменения статуса ${itemName}`, 'error')
    }
  }

  // === Вспомогательные ===
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  return {
    // Состояния данных
    items,
    total,
    loading,
    error,

    // CRUD
    fetchItems,
    createItem,
    updateItem,
    deleteItemById,

    // Диалоги
    editDialog,
    deleteDialog,
    editedItem,
    editedIndex,
    defaultItem: defaultItemRef.value,

    // Массовые действия
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

    // Хелперы
    resolveStatusVariant,
    toggleStatus,
    hasActiveFilters,

    // Пагинация
    currentPage,
    itemsPerPage,
    searchQuery,
    pageCount,

    // Фильтры
    statusFilter,
    isFilterDialogOpen,
    clearFilters,
    filteredItems,

    // Действия
    editItem,
    deleteItem,
    close,
    closeDelete,
    save,
    deleteItemConfirm,
    addNewItem,
  } as UseEntityCrudReturn<T>
}
