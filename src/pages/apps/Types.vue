<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

// Типы данных для Тип
interface Types {
  id: number
  name: string
  comment: string
  workflowId: number | null
  workflowName?: string
  categoryIds?: number[]
  categories?: TypeCategory[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Типы данных для Воркфлоу
interface Workflow {
  id: number
  name: string
  description: string
  isActive: boolean
}

// Типы данных для Категории
interface TypeCategory {
  id: number
  name: string
  laborHours: number
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

// Данные типы
const types = ref<Types[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Состояние аккордеонов
const expandedPanels = ref<number[]>(
  (() => {
    try {
      const stored = localStorage.getItem('typesExpandedPanels')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })()
)

// Сохраняем состояние аккордеонов
watch(expandedPanels, (newValue) => {
  localStorage.setItem('typesExpandedPanels', JSON.stringify(newValue))
}, { deep: true })

// Данные воркфлоу
const workflows = ref<Workflow[]>([])

// Данные категорий
const typeCategories = ref<TypeCategory[]>([])
const loadingCategories = ref(false)

// Загрузка списка воркфлоу
const fetchWorkflows = async () => {
  try {
    const data = await $fetch<{ workflows: Workflow[] }>(`${API_BASE}/workflows`)
    workflows.value = data.workflows || []
  } catch (err) {
    console.error('Error fetching workflows:', err)
  }
}

// Загрузка категорий
const fetchCategories = async () => {
  try {
    loadingCategories.value = true
    // Получаем все категории (включая неактивные для админ-функций)
    const data = await $fetch<{ typeCategories: TypeCategory[], total: number }>(`${API_BASE}/typeCategories`, {
      query: { itemsPerPage: 1000, isActive: 'all' }
    })
    typeCategories.value = data.typeCategories || []
  } catch (err) {
    console.error('Error fetching categories:', err)
  } finally {
    loadingCategories.value = false
  }
}

// Доступные категории для конкретного типа (те, которые еще не добавлены)
const availableCategoriesForType = (type: Types): TypeCategory[] => {
  const typeCategoryIds = type.categoryIds || []
  return typeCategories.value.filter(c => !typeCategoryIds.includes(c.id))
}

// Добавить категорию к типу из таблицы
const addCategoryToTypeFromTable = async (type: Types, categoryId: number) => {
  try {
    await $fetch(`${API_BASE}/types/${type.id}/categories`, {
      method: 'POST',
      body: { categoryId }
    })
    showToast('Категория добавлена')
    await fetchTypes()
  } catch (err: any) {
    if (err.data?.message?.includes('already added')) {
      showToast('Категория уже добавлена', 'error')
    } else {
      showToast('Ошибка добавления категории', 'error')
    }
  }
}

// Получить типы с категориями из API
const fetchTypesWithCategories = async () => {
  try {
    loading.value = true
    const data = await $fetch<{ types: Types[], total: number }>(`${API_BASE}/typeCategories/with-types`)
    types.value = data.types
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки типов'
    console.error('Error fetching types with categories:', err)
  } finally {
    loading.value = false
  }
}

// Опции для селекта воркфлоу
const workflowOptions = computed(() => [
  { title: 'Не выбрано', value: null },
  ...workflows.value.filter(w => w.isActive).map(w => ({ title: w.name, value: w.id }))
])

// Загрузка данных из API
const fetchTypes = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('Fetching types from:', `${API_BASE}/typeCategories/with-types`)
    const data = await $fetch<{ types: Types[], total: number }>(`${API_BASE}/typeCategories/with-types`)
    console.log('Fetched types data:', data)
    types.value = data.types
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки типов'
    console.error('Error fetching types:', err)
  } finally {
    loading.value = false
  }
}

// Создание тип
const createTypes = async (item: Omit<Types, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<Types>(`${API_BASE}/types`, {
      method: 'POST',
      body: item
    })
    types.value.unshift(data) // Добавляем в начало массива
    return data
  } catch (err) {
    console.error('Error creating types:', err)
    throw err
  }
}

// Обновление тип
const updateTypes = async (id: number, item: Omit<Types, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<Types>(`${API_BASE}/types/${id}`, {
      method: 'PUT',
      body: item
    })
    const index = types.value.findIndex(p => p.id === id)
    if (index !== -1) {
      types.value[index] = data
    }
    return data
  } catch (err) {
    console.error('Error updating types:', err)
    throw err
  }
}

// Удаление тип
const deleteTypes = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/types/${id}`, {
      method: 'DELETE'
    })
    const index = types.value.findIndex(p => p.id === id)
    if (index !== -1) {
      types.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Error deleting types:', err)
    throw err
  }
}

// Инициализация
onMounted(() => {
  fetchTypes()
  fetchWorkflows()
  fetchCategories()
})

// Опции категорий для селекта
const categoryOptions = computed(() => {
  return typeCategories.value
    .filter(c => c.isActive)
    .map(c => ({ title: c.name, value: c.id, laborHours: c.laborHours }))
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Категории', key: 'categories', sortable: false },
  { title: 'Воркфлоу', key: 'workflowName', sortable: true },
  { title: 'Комментарий', key: 'comment', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Фильтрация
const filteredTypes = computed(() => {
  let filtered = types.value

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

  return filtered
})

// Сброс фильтров
const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = null
  selectedNames.value = []
}

// Уникальные названия для фильтра
const uniqueNames = computed(() => {
  const names = types.value.map(p => p.name)
  return [...new Set(names)].sort()
})

// Проверка активных фильтров
const hasActiveFilters = computed(() => {
  return statusFilter.value !== null || selectedNames.value.length > 0
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
      await deleteTypes(item.id)
    }
    selectedItems.value = []
    showToast(count === 1 ? `Удален 1 тип` : count <= 4 ? `Удалено ${count} типа` : `Удалено ${count} типов`)
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmBulkStatusChange = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await updateTypes(item.id, {
        ...item,
        isActive: bulkStatusValue.value === 1
      })
    }
    selectedItems.value = []
    showToast(count === 1 ? `Статус изменен для 1 типа` : count <= 4 ? `Статус изменен для ${count} типов` : `Статус изменен для ${count} типов`)
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

const defaultItem = ref<Types>({
  id: -1,
  name: '',
  comment: '',
  workflowId: null,
  createdAt: '',
  updatedAt: '',
  isActive: true,
})

const editedItem = ref<Types>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Выбранные категории в диалоге редактирования
const selectedCategoryIds = ref<number[]>([])

// Выбранные категории в меню таблицы (для множественного добавления)
const selectedCategoriesForMenu = ref<number[]>([])

// Переключить категорию в меню
const toggleCategoryForMenu = (categoryId: number) => {
  const index = selectedCategoriesForMenu.value.indexOf(categoryId)
  if (index === -1) {
    selectedCategoriesForMenu.value.push(categoryId)
  } else {
    selectedCategoriesForMenu.value.splice(index, 1)
  }
}

// Добавить выбранные категории к типу
const addSelectedCategoriesToType = async (item: Types) => {
  const categoryIds = [...selectedCategoriesForMenu.value]
  if (categoryIds.length === 0) return
  
  console.log('Добавляем категории:', categoryIds, 'к типу:', item.id)
  
  try {
    for (const catId of categoryIds) {
      await $fetch(`${API_BASE}/types/${item.id}/categories`, {
        method: 'POST',
        body: { categoryId: catId }
      })
    }
    const count = categoryIds.length
    showToast(count === 1 ? 'Категория добавлена' : `Добавлено ${count} категорий`)
    selectedCategoriesForMenu.value = []
    await fetchTypes()
  } catch (err: any) {
    console.error('Ошибка добавления:', err)
    if (err.data?.message?.includes('already added')) {
      showToast('Некоторые категории уже добавлены', 'error')
    } else {
      showToast('Ошибка добавления категорий', 'error')
    }
  }
}

// Методы
const editItem = (item: Types) => {
  editedIndex.value = types.value.indexOf(item)
  editedItem.value = { ...item }
  // Загружаем выбранные категории
  selectedCategoryIds.value = item.categoryIds || []
  // Сбрасываем выбор в меню таблицы
  selectedCategoriesForMenu.value = []
  editDialog.value = true
}

const deleteItem = (item: Types) => {
  editedIndex.value = types.value.indexOf(item)
  editedItem.value = { ...item }
  deleteDialog.value = true
}

const close = () => {
  editDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
  selectedCategoryIds.value = []
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
    if (editedIndex.value > -1) {
      // Обновление существующего
      const updated = await updateTypes(editedItem.value.id, {
        ...editedItem.value,
        isActive: editedItem.value.isActive
      })
      
      // Синхронизируем категории: удаляем старые и добавляем новые
      const currentCategoryIds = updated.categoryIds || []
      const newCategoryIds = selectedCategoryIds.value
      
      // Удаляем старые категории
      for (const catId of currentCategoryIds) {
        if (!newCategoryIds.includes(catId)) {
          await $fetch(`${API_BASE}/types/${updated.id}/categories/${catId}`, {
            method: 'DELETE'
          })
        }
      }
      
      // Добавляем новые категории
      for (const catId of newCategoryIds) {
        if (!currentCategoryIds.includes(catId)) {
          await $fetch(`${API_BASE}/types/${updated.id}/categories`, {
            method: 'POST',
            body: { categoryId: catId }
          })
        }
      }
      
      showToast('Тип успешно сохранен')
    } else {
      // Добавление нового
      const created = await createTypes({
        ...editedItem.value,
        isActive: editedItem.value.isActive
      })
      
      // Добавляем категории для нового типа
      for (const catId of selectedCategoryIds.value) {
        await $fetch(`${API_BASE}/types/${created.id}/categories`, {
          method: 'POST',
          body: { categoryId: catId }
        })
      }
      
      showToast('Тип успешно добавлен')
    }
    close()
    await fetchTypes()
  } catch (err) {
    showToast('Ошибка сохранения типа', 'error')
  }
}

const deleteItemConfirm = async () => {
  try {
    await deleteTypes(editedItem.value.id)
    showToast('Тип успешно удален')
    closeDelete()
  } catch (err) {
    showToast('Ошибка удаления типа', 'error')
  }
}

// Переключение статуса
const toggleStatus = async (item: Types, newValue: boolean | null) => {
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение isActive:', newValue)

  if (newValue === null) return

  try {
    await updateTypes(item.id, {
      ...item,
      isActive: newValue
    })
    showToast('Статус типа изменен')
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

// Добавление нового тип
const addNewTypes = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}

// === Функционал категорий ===

// Диалоги категорий
const categoryDialog = ref(false)
const deleteCategoryDialog = ref(false)
const linkCategoryDialog = ref(false)
const linkCategoriesToTypeDialog = ref(false)
const editingCategory = ref<TypeCategory | null>(null)
const deletingCategory = ref<TypeCategory | null>(null)
const linkingCategory = ref<TypeCategory | null>(null)
const linkingTypeForCategories = ref<Types | null>(null)
const selectedTypesForLink = ref<number[]>([])
const selectedCategoriesForLink = ref<number[]>([])
const savingCategory = ref(false)

// Доступные категории для связывания с типом (те, которые ещё не привязаны)
const availableCategoriesForLinkToType = computed(() => {
  if (!linkingTypeForCategories.value) return []
  const typeCategoryIds = linkingTypeForCategories.value.categoryIds || []
  return typeCategories.value.filter(c => !typeCategoryIds.includes(c.id))
})

// Открыть диалог добавления категорий к типу
const openLinkCategoriesToTypeDialog = (type: Types) => {
  linkingTypeForCategories.value = type
  selectedCategoriesForLink.value = []
  linkCategoriesToTypeDialog.value = true
}

// Добавить выбранные категории к типу
const addCategoriesToType = async () => {
  if (!linkingTypeForCategories.value || selectedCategoriesForLink.value.length === 0) return
  
  try {
    for (const catId of selectedCategoriesForLink.value) {
      await $fetch(`${API_BASE}/types/${linkingTypeForCategories.value.id}/categories`, {
        method: 'POST',
        body: { categoryId: catId }
      })
    }
    const count = selectedCategoriesForLink.value.length
    showToast(count === 1 ? 'Категория добавлена' : `Добавлено ${count} категорий`)
    linkCategoriesToTypeDialog.value = false
    await fetchTypes()
  } catch (err: any) {
    if (err.data?.message?.includes('already added')) {
      showToast('Некоторые категории уже добавлены', 'error')
    } else {
      showToast('Ошибка добавления категорий', 'error')
    }
  }
}

// Форма категории
const defaultCategoryForm = {
  name: '',
  laborHours: 0,
  isActive: true
}

const categoryForm = ref({ ...defaultCategoryForm })

// Получить типы для категории
const getTypesForCategory = (categoryId: number): Types[] => {
  return types.value.filter(t => 
    t.categoryIds && t.categoryIds.includes(categoryId)
  )
}

// Доступные типы для связывания (те, которые еще не имеют эту категорию)
const availableTypesForLink = computed(() => {
  if (!linkingCategory.value) return []
  const categoryId = linkingCategory.value.id
  return types.value.filter(t => 
    !t.categoryIds || !t.categoryIds.includes(categoryId)
  )
})

// Открыть диалог создания категории
const openCategoryDialog = () => {
  editingCategory.value = null
  categoryForm.value = { ...defaultCategoryForm }
  categoryDialog.value = true
}

// Редактировать категорию
const editCategory = (category: TypeCategory) => {
  editingCategory.value = category
  categoryForm.value = {
    name: category.name,
    laborHours: category.laborHours,
    isActive: category.isActive
  }
  categoryDialog.value = true
}

// Удалить категорию
const deleteCategory = (category: TypeCategory) => {
  deletingCategory.value = category
  deleteCategoryDialog.value = true
}

// Подтвердить удаление категории
const confirmDeleteCategory = async () => {
  if (!deletingCategory.value) return
  try {
    await $fetch(`${API_BASE}/typeCategories/${deletingCategory.value.id}`, {
      method: 'DELETE'
    })
    showToast('Категория удалена')
    await fetchCategories()
    await fetchTypes()
    deleteCategoryDialog.value = false
  } catch (err) {
    showToast('Ошибка удаления категории', 'error')
  }
}

// Сохранить категорию
const saveCategory = async () => {
  if (!categoryForm.value.name?.trim()) {
    showToast('Название обязательно', 'error')
    return
  }
  try {
    savingCategory.value = true
    if (editingCategory.value) {
      // Обновление
      await $fetch(`${API_BASE}/typeCategories/${editingCategory.value.id}`, {
        method: 'PUT',
        body: categoryForm.value
      })
      showToast('Категория обновлена')
    } else {
      // Создание
      await $fetch(`${API_BASE}/typeCategories`, {
        method: 'POST',
        body: categoryForm.value
      })
      showToast('Категория создана')
    }
    categoryDialog.value = false
    await fetchCategories()
  } catch (err) {
    showToast('Ошибка сохранения категории', 'error')
  } finally {
    savingCategory.value = false
  }
}

// Открыть диалог связывания
const openLinkCategoryDialog = async (category: TypeCategory) => {
  linkingCategory.value = category
  selectedTypesForLink.value = []
  
  // Всегда загружаем свежие данные перед открытием диалога
  await fetchTypes()
  
  linkCategoryDialog.value = true
  console.log('Открыт диалог связывания, доступные типы:', availableTypesForLink.value)
}

// Добавить категорию к типам
const addCategoryToType = async () => {
  if (!linkingCategory.value || selectedTypesForLink.value.length === 0) return
  
  try {
    // Добавляем категорию к каждому выбранному типу
    for (const typeId of selectedTypesForLink.value) {
      await $fetch(`${API_BASE}/types/${typeId}/categories`, {
        method: 'POST',
        body: { categoryId: linkingCategory.value.id }
      })
    }
    
    const count = selectedTypesForLink.value.length
    showToast(count === 1 ? 'Связь добавлена' : `Связи добавлены к ${count} типам`)
    linkCategoryDialog.value = false
    await fetchTypes()
  } catch (err: any) {
    if (err.data?.message?.includes('already added')) {
      showToast('Категория уже добавлена к некоторым типам', 'error')
    } else {
      showToast('Ошибка добавления связей', 'error')
    }
  }
}

// Удалить категорию из типа
const removeCategoryFromType = async (type: Types, categoryId: number) => {
  try {
    await $fetch(`${API_BASE}/types/${type.id}/categories/${categoryId}`, {
      method: 'DELETE'
    })
    showToast('Связь удалена')
    await fetchTypes()
  } catch (err) {
    showToast('Ошибка удаления связи', 'error')
  }
}
</script>

<template>
  <div>
    <VCard title="Типы">

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
            placeholder="Поиск типов"
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
            @click="addNewTypes"
          >
            Добавить тип
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
                  label="Названия типов"
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
            Вы уверены, что хотите удалить выбранные типы? Это действие нельзя отменить.
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
        :items="filteredTypes"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Категории (чипы + переключатель) -->
        <template #item.categories="{ item }">
          <div class="d-flex flex-wrap align-center gap-1">
            <template v-if="item.categories && item.categories.length > 0">
              <VChip
                v-for="cat in item.categories"
                :key="cat.id"
                size="x-small"
                color="primary"
                variant="tonal"
                closable
                @click:close="removeCategoryFromType(item, cat.id)"
              >
                {{ cat.name }}
              </VChip>
            </template>

            <span v-if="!item.categories || item.categories.length === 0" class="text-medium-emphasis text-caption">
              нет
            </span>
          </div>
        </template>

        <!-- Воркфлоу -->
        <template #item.workflowName="{ item }">
          <VChip
            v-if="item.workflowName"
            size="small"
            color="primary"
            variant="tonal"
          >
            <VIcon icon="bx-network-chart" start size="14" />
            {{ item.workflowName }}
          </VChip>
          <span v-else class="text-medium-emphasis">Не назначен</span>
        </template>

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

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
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
          :length="Math.ceil(filteredTypes.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать тип' : 'Добавить тип'">
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

            <!-- Воркфлоу -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.workflowId"
                :items="workflowOptions"
                label="Воркфлоу"
                placeholder="Выберите воркфлоу"
                clearable
                clear-icon="bx-x"
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

            <!-- Категории -->
            <VCol
              cols="12"
            >
              <AppSelect
                v-model="selectedCategoryIds"
                :items="categoryOptions"
                label="Категории"
                placeholder="Выберите категории"
                multiple
                chips
                closable-chips
                clearable
                clear-icon="bx-x"
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
      <VCard title="Вы уверены, что хотите удалить этот тип?">
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

  <!-- Аккордеон для Категорий и связей -->
  <VExpansionPanels
    v-model="expandedPanels"
    variant="accordion"
    class="expansion-panels-width-border mt-6"
  >
    <VExpansionPanel elevation="0" :value="0">
      <VExpansionPanelTitle
        collapse-icon="bx-minus"
        expand-icon="bx-plus"
      >
        <div>
          <h4 class="text-h4 mb-1">
            Категории и связи
          </h4>
          <p class="text-body-1 mb-0">
            Справочник категорий типов обращений с указанием времени трудозатрат.
          </p>
        </div>
      </VExpansionPanelTitle>

      <VExpansionPanelText>
        <div v-if="loadingCategories || typeCategories.length === 0" class="d-flex justify-center pa-6">
          <VProgressCircular v-if="loadingCategories" indeterminate color="primary" />
          <div v-else class="text-center">
            <p class="text-body-1 text-medium-emphasis mb-4">
              Категории пока не созданы
            </p>
            <VBtn
              color="primary"
              prepend-icon="bx-plus"
              @click="openCategoryDialog()"
            >
              Добавить категорию
            </VBtn>
          </div>
        </div>
        
        <div v-else>
          <!-- Кнопка добавления категории -->
          <div class="d-flex justify-end mb-4">
            <VBtn
              color="primary"
              prepend-icon="bx-plus"
              size="small"
              @click="openCategoryDialog()"
            >
              Добавить категорию
            </VBtn>
          </div>

          <!-- Список категорий -->
          <VRow>
            <VCol
              v-for="category in typeCategories"
              :key="category.id"
              cols="12"
              md="6"
              lg="4"
            >
              <VCard
                variant="outlined"
                class="pa-4"
              >
                <div class="d-flex justify-space-between align-start mb-2">
                  <div>
                    <h5 class="text-h5 mb-1">{{ category.name }}</h5>
                    <div class="d-flex gap-2 align-center">
                      <VChip
                        size="x-small"
                        :color="category.isActive ? 'success' : 'error'"
                        variant="tonal"
                      >
                        {{ category.isActive ? 'Активна' : 'Не активна' }}
                      </VChip>
                      <span class="text-body-2 text-medium-emphasis">
                        <VIcon icon="bx-time" size="14" />
                        {{ category.laborHours || 0 }} ч.
                      </span>
                    </div>
                  </div>
                  <div class="d-flex gap-1">
                    <IconBtn size="small" @click="editCategory(category)">
                      <VIcon icon="bx-edit" size="18" />
                    </IconBtn>
                    <IconBtn size="small" @click="deleteCategory(category)">
                      <VIcon icon="bx-trash" size="18" />
                    </IconBtn>
                  </div>
                </div>

                <!-- Связанные типы -->
                <VDivider class="mb-3" />
                <div v-if="getTypesForCategory(category.id).length > 0">
                  <p class="text-caption text-medium-emphasis mb-2">
                    Связанные типы:
                  </p>
                  <div class="d-flex flex-wrap gap-1">
                    <VChip
                      v-for="type in getTypesForCategory(category.id)"
                      :key="type.id"
                      size="x-small"
                      color="primary"
                      variant="tonal"
                      closable
                      @click:close="removeCategoryFromType(type, category.id)"
                    >
                      {{ type.name }}
                    </VChip>
                  </div>
                </div>
                <p v-else class="text-body-2 text-medium-emphasis">
                  Нет связанных типов
                </p>

                <!-- Кнопка добавить связь: категория -> типы -->
                <VBtn
                  variant="tonal"
                  color="secondary"
                  size="x-small"
                  class="mt-3 me-2"
                  @click="openLinkCategoryDialog(category)"
                >
                  <VIcon icon="bx-link" start size="14" />
                  К типам
                </VBtn>
              </VCard>
            </VCol>
          </VRow>
        </div>
      </VExpansionPanelText>
    </VExpansionPanel>
  </VExpansionPanels>

  <!-- Диалог создания/редактирования категории -->
  <VDialog v-model="categoryDialog" max-width="500px">
    <VCard :title="editingCategory ? 'Редактировать категорию' : 'Добавить категорию'">
      <VCardText>
        <VRow>
          <VCol cols="12">
            <AppTextField
              v-model="categoryForm.name"
              label="Название *"
              placeholder="Введите название категории"
            />
          </VCol>
          <VCol cols="12">
            <AppTextField
              v-model.number="categoryForm.laborHours"
              label="Время трудозатрат (часы)"
              type="number"
              placeholder="0"
            />
          </VCol>
          <VCol cols="12">
            <VSwitch
              v-model="categoryForm.isActive"
              :label="categoryForm.isActive ? 'Активна' : 'Не активна'"
              color="primary"
              density="compact"
            />
          </VCol>
        </VRow>
      </VCardText>
      <VCardText>
        <div class="d-flex justify-end gap-4">
          <VBtn
            color="error"
            variant="outlined"
            @click="categoryDialog = false"
          >
            Отмена
          </VBtn>
          <VBtn
            color="success"
            variant="elevated"
            @click="saveCategory"
          >
            Сохранить
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </VDialog>

  <!-- Диалог удаления категории -->
  <VDialog v-model="deleteCategoryDialog" max-width="400px">
    <VCard title="Подтверждение удаления">
      <VCardText>
        Вы уверены, что хотите удалить категорию "{{ deletingCategory?.name }}"?
      </VCardText>
      <VCardText>
        <div class="d-flex justify-end gap-4">
          <VBtn
            color="error"
            variant="outlined"
            @click="deleteCategoryDialog = false"
          >
            Отмена
          </VBtn>
          <VBtn
            color="success"
            variant="elevated"
            @click="confirmDeleteCategory"
          >
            Удалить
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </VDialog>

  <!-- Диалог добавления категорий к типу (в аккордеоне) -->
  <VDialog v-model="linkCategoriesToTypeDialog" max-width="500px">
    <VCard title="Добавить категории к типу">
      <VCardText>
        <p class="mb-4">
          Выберите категории для типа "{{ linkingTypeForCategories?.name }}":
        </p>
        <VSelect
          v-model="selectedCategoriesForLink"
          :items="availableCategoriesForLinkToType"
          item-title="name"
          item-value="id"
          label="Категории"
          placeholder="Выберите категории"
          multiple
          chips
          closable-chips
        >
          <template #item="{ item, props }">
            <VListItem v-bind="props">
              <template #append>
                <span v-if="item.raw.laborHours" class="text-caption text-medium-emphasis ms-2">
                  {{ item.raw.laborHours }}ч.
                </span>
              </template>
            </VListItem>
          </template>
        </VSelect>
      </VCardText>
      <VCardText>
        <div class="d-flex justify-end gap-4">
          <VBtn
            color="error"
            variant="outlined"
            @click="linkCategoriesToTypeDialog = false"
          >
            Отмена
          </VBtn>
          <VBtn
            color="success"
            variant="elevated"
            :disabled="selectedCategoriesForLink.length === 0"
            @click="addCategoriesToType"
          >
            Добавить
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </VDialog>

  <!-- Диалог связывания категории с типом -->
  <VDialog v-model="linkCategoryDialog" max-width="500px">
    <VCard title="Добавить связь с типом">
      <VCardText>
        <p class="mb-4">
          Выберите тип для категории "{{ linkingCategory?.name }}":
        </p>
        <VSelect
          v-model="selectedTypesForLink"
          :items="availableTypesForLink"
          item-title="name"
          item-value="id"
          label="Типы"
          placeholder="Выберите типы"
          multiple
          chips
          closable-chips
        />
      </VCardText>
      <VCardText>
        <div class="d-flex justify-end gap-4">
          <VBtn
            color="error"
            variant="outlined"
            @click="linkCategoryDialog = false"
          >
            Отмена
          </VBtn>
          <VBtn
            color="success"
            variant="elevated"
            :disabled="selectedTypesForLink.length === 0"
            @click="addCategoryToType"
          >
            Добавить
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}
</style>
