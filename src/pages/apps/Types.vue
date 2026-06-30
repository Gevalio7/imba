<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { $api } from '@/utils/api'
import { useEntityCrud } from '@/composables/useEntityCrud'
import { useToast } from '@/composables/useToast'

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

// Универсальный CRUD (create/update/delete по /types, fetch — кастомный)
const {
  loading,
  error,
  editDialog,
  deleteDialog,
  editedItem,
  editedIndex,
  currentPage,
  itemsPerPage,
  searchQuery,
  statusFilter,
  isFilterDialogOpen,
  isBulkActionsMenuOpen,
  isBulkDeleteDialogOpen,
  isBulkStatusDialogOpen,
  bulkStatusValue,
  statusOptions,
  selectedItems,
  toggleStatus,
  resolveStatusVariant,
  deleteItem,
  deleteItemById,
  bulkDelete,
  bulkChangeStatus,
  confirmBulkDelete,
  confirmBulkStatusChange,
  addNewItem: addNewTypes,
} = useEntityCrud<Types>({
  endpoint: '/types',
  itemName: 'типа',
  defaultItem: {
    id: -1,
    name: '',
    comment: '',
    workflowId: null,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
})

// Состояние аккордеонов
const expandedPanels = ref<number[]>(
  (() => {
    try {
      const stored = localStorage.getItem('typesExpandedPanels')
      return stored ? JSON.parse(stored) : []
    }
    catch {
      return []
    }
  })(),
)

watch(expandedPanels, newValue => {
  localStorage.setItem('typesExpandedPanels', JSON.stringify(newValue))
}, { deep: true })

// Данные типы
const types = ref<Types[]>([])
const total = ref(0)

// Данные воркфлоу
const workflows = ref<Workflow[]>([])

// Данные категорий
const typeCategories = ref<TypeCategory[]>([])
const loadingCategories = ref(false)

// Загрузка справочников
const fetchWorkflows = async () => {
  try {
    const data = await $api<{ workflows: Workflow[] }>('/workflows')
    workflows.value = data.workflows || []
  }
  catch (err) {
    console.error('Error fetching workflows:', err)
  }
}

const fetchCategories = async () => {
  try {
    loadingCategories.value = true
    const data = await $api<{ typeCategories: TypeCategory[]; total: number }>('/typeCategories', {
      params: { itemsPerPage: 1000, isActive: 'all' },
    })
    typeCategories.value = data.typeCategories || []
  }
  catch (err) {
    console.error('Error fetching categories:', err)
  }
  finally {
    loadingCategories.value = false
  }
}

// Загрузка данных из API (композитный эндпоинт)
const fetchTypes = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await $api<{ types: Types[]; total: number }>('/typeCategories/with-types')
    types.value = data.types
    total.value = data.total
  }
  catch (err) {
    error.value = 'Ошибка загрузки типов'
    console.error('Error fetching types:', err)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTypes()
  fetchWorkflows()
  fetchCategories()
})

// Опции
const workflowOptions = computed(() => [
  { title: 'Не выбрано', value: null },
  ...workflows.value.filter(w => w.isActive).map(w => ({ title: w.name, value: w.id })),
])

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
  { title: 'Действия', key: 'actions', sortable: false },
]

// === Фильтрация (кастомная) ===
const selectedNames = ref<string[]>([])
const searchNames = ref<string | null>(null)

const uniqueNames = computed(() => {
  const names = types.value.map(p => p.name)
  return [...new Set(names)].sort()
})

const hasActiveFilters = computed(() => {
  return statusFilter.value !== null || selectedNames.value.length > 0
})

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = null
  selectedNames.value = []
}

const filteredTypes = computed(() => {
  let filtered = types.value

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p => p.name.toLowerCase().includes(query))
  }

  if (statusFilter.value !== null) {
    filtered = filtered.filter(p => p.isActive === (statusFilter.value === 1))
  }

  if (selectedNames.value.length > 0) {
    filtered = filtered.filter(p => selectedNames.value.includes(p.name))
  }

  return filtered
})

watch(selectedNames, value => {
  if (value.length > 10)
    nextTick(() => selectedNames.value.pop())
})

// === Диалоги (кастомные) ===
const defaultItem: Types = {
  id: -1,
  name: '',
  comment: '',
  workflowId: null,
  isActive: true,
  createdAt: '',
  updatedAt: '',
}

const selectedCategoryIds = ref<number[]>([])

const editItem = (item: Types) => {
  editedIndex.value = types.value.indexOf(item)
  editedItem.value = { ...item }
  selectedCategoryIds.value = item.categoryIds || []
  selectedCategoriesForMenu.value = []
  editDialog.value = true
}

const close = () => {
  editDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem }
  selectedCategoryIds.value = []
}

const closeDelete = () => {
  deleteDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem }
}

const save = async () => {
  if (!editedItem.value.name?.trim()) {
    return
  }

  try {
    if (editedIndex.value > -1) {
      const updated = await $api<Types>(`/types/${editedItem.value.id}`, {
        method: 'PUT',
        body: { ...editedItem.value, isActive: editedItem.value.isActive },
      })

      // Синхронизируем категории
      const currentCategoryIds = updated.categoryIds || []
      const newCategoryIds = selectedCategoryIds.value

      for (const catId of currentCategoryIds) {
        if (!newCategoryIds.includes(catId)) {
          await $api(`/types/${updated.id}/categories/${catId}`, { method: 'DELETE' })
        }
      }
      for (const catId of newCategoryIds) {
        if (!currentCategoryIds.includes(catId)) {
          await $api(`/types/${updated.id}/categories`, { method: 'POST', body: { categoryId: catId } })
        }
      }
    }
    else {
      const created = await $api<Types>('/types', {
        method: 'POST',
        body: { ...editedItem.value, isActive: editedItem.value.isActive },
      })

      for (const catId of selectedCategoryIds.value) {
        await $api(`/types/${created.id}/categories`, { method: 'POST', body: { categoryId: catId } })
      }
    }
    showToast('Тип успешно сохранен')
    close()
    await fetchTypes()
  }
  catch (err) {
    showToast('Ошибка сохранения типа', 'error')
    console.error('Error saving type:', err)
  }
}

const deleteItemConfirm = async () => {
  try {
    await deleteItemById(editedItem.value.id)
    showToast('Тип успешно удален')
    closeDelete()
  }
  catch (err) {
    showToast('Ошибка удаления типа', 'error')
    console.error('Error deleting type:', err)
  }
}

const { showToast } = useToast()

// === Категории (выбор в меню таблицы) ===
const selectedCategoriesForMenu = ref<number[]>([])

const availableCategoriesForType = (type: Types): TypeCategory[] => {
  const typeCategoryIds = type.categoryIds || []
  return typeCategories.value.filter(c => !typeCategoryIds.includes(c.id))
}

const addSelectedCategoriesToType = async (item: Types) => {
  const categoryIds = [...selectedCategoriesForMenu.value]
  if (categoryIds.length === 0)
    return

  try {
    for (const catId of categoryIds) {
      await $api(`/types/${item.id}/categories`, { method: 'POST', body: { categoryId: catId } })
    }
    const count = categoryIds.length
    showToast(count === 1 ? 'Категория добавлена' : `Добавлено ${count} категорий`)
    selectedCategoriesForMenu.value = []
    await fetchTypes()
  }
  catch (err: any) {
    showToast('Ошибка добавления категорий', 'error')
    console.error('Error adding categories:', err)
  }
}

// === Категории (CRUD + связи) ===
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

const availableTypesForLink = computed(() => {
  if (!linkingCategory.value)
    return []
  const categoryId = linkingCategory.value.id
  return types.value.filter(t => !t.categoryIds || !t.categoryIds.includes(categoryId))
})

const availableCategoriesForLinkToType = computed(() => {
  if (!linkingTypeForCategories.value)
    return []
  const typeCategoryIds = linkingTypeForCategories.value.categoryIds || []
  return typeCategories.value.filter(c => !typeCategoryIds.includes(c.id))
})

const openCategoryDialog = () => {
  editingCategory.value = null
  categoryForm.value = { ...defaultCategoryForm }
  categoryDialog.value = true
}

const editCategory = (category: TypeCategory) => {
  editingCategory.value = category
  categoryForm.value = { name: category.name, laborHours: category.laborHours, isActive: category.isActive }
  categoryDialog.value = true
}

const deleteCategory = (category: TypeCategory) => {
  deletingCategory.value = category
  deleteCategoryDialog.value = true
}

const confirmDeleteCategory = async () => {
  if (!deletingCategory.value)
    return
  try {
    const categoryId = deletingCategory.value.id
    const typesWithCategory = types.value.filter(t => t.categoryIds && t.categoryIds.includes(categoryId))
    for (const type of typesWithCategory) {
      await $api(`/types/${type.id}/categories/${categoryId}`, { method: 'DELETE' })
    }
    await $api(`/typeCategories/${categoryId}`, { method: 'DELETE' })
    showToast('Категория удалена')
    await fetchCategories()
    await fetchTypes()
    deleteCategoryDialog.value = false
  }
  catch (err) {
    showToast('Ошибка удаления категории', 'error')
    console.error('Error deleting category:', err)
  }
}

const defaultCategoryForm = { name: '', laborHours: 0, isActive: true }
const categoryForm = ref({ ...defaultCategoryForm })

const saveCategory = async () => {
  if (!categoryForm.value.name?.trim())
    return
  try {
    savingCategory.value = true
    if (editingCategory.value) {
      await $api(`/typeCategories/${editingCategory.value.id}`, { method: 'PUT', body: categoryForm.value })
    }
    else {
      await $api('/typeCategories', { method: 'POST', body: categoryForm.value })
    }
    categoryDialog.value = false
    showToast(editingCategory.value ? 'Категория обновлена' : 'Категория создана')
    await fetchCategories()
    await fetchTypes()
  }
  catch (err) {
    showToast('Ошибка сохранения категории', 'error')
    console.error('Error saving category:', err)
  }
  finally {
    savingCategory.value = false
  }
}

const getTypesForCategory = (categoryId: number): Types[] => {
  return types.value.filter(t => t.categoryIds && t.categoryIds.includes(categoryId))
}

const openLinkCategoryDialog = async (category: TypeCategory) => {
  linkingCategory.value = category
  selectedTypesForLink.value = []
  await fetchTypes()
  linkCategoryDialog.value = true
}

const addCategoryToType = async () => {
  if (!linkingCategory.value || selectedTypesForLink.value.length === 0)
    return
  try {
    for (const typeId of selectedTypesForLink.value) {
      await $api(`/types/${typeId}/categories`, { method: 'POST', body: { categoryId: linkingCategory.value.id } })
    }
    const count = selectedTypesForLink.value.length
    showToast(count === 1 ? 'Связь добавлена' : `Связи добавлены к ${count} типам`)
    linkCategoryDialog.value = false
    await fetchTypes()
  }
  catch (err: any) {
    showToast('Ошибка добавления связей', 'error')
    console.error('Error adding category to type:', err)
  }
}

const openLinkCategoriesToTypeDialog = (type: Types) => {
  linkingTypeForCategories.value = type
  selectedCategoriesForLink.value = []
  linkCategoriesToTypeDialog.value = true
}

const addCategoriesToType = async () => {
  if (!linkingTypeForCategories.value || selectedCategoriesForLink.value.length === 0)
    return
  try {
    for (const catId of selectedCategoriesForLink.value) {
      await $api(`/types/${linkingTypeForCategories.value.id}/categories`, { method: 'POST', body: { categoryId: catId } })
    }
    const count = selectedCategoriesForLink.value.length
    showToast(count === 1 ? 'Категория добавлена' : `Добавлено ${count} категорий`)
    linkCategoriesToTypeDialog.value = false
    await fetchTypes()
  }
  catch (err: any) {
    showToast('Ошибка добавления категорий', 'error')
    console.error('Error adding categories to type:', err)
  }
}

const removeCategoryFromType = async (type: Types, categoryId: number) => {
  try {
    await $api(`/types/${type.id}/categories/${categoryId}`, { method: 'DELETE' })
    showToast('Связь удалена')
    await fetchTypes()
  }
  catch (err) {
    showToast('Ошибка удаления связи', 'error')
    console.error('Error removing category from type:', err)
  }
}

// Массовые действия делегированы composable
</script>

<template>
  <div>
    <VCard title="Типы">
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
            v-if="$can('write', 'menu_types')"
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

            <span
              v-if="!item.categories || item.categories.length === 0"
              class="text-medium-emphasis text-caption"
            >
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
            <VIcon
              icon="bx-network-chart"
              start
              size="14"
            />
            {{ item.workflowName }}
          </VChip>
          <span
            v-else
            class="text-medium-emphasis"
          >Не назначен</span>
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
              v-if="$can('write', 'menu_types')"
              @click="editItem(item)"
            >
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn
              v-if="$can('delete', 'menu_types')"
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
            <VCol cols="12">
              <AppTextarea
                v-model="editedItem.comment"
                label="Комментарий"
                rows="3"
                placeholder="Введите комментарий..."
              />
            </VCol>

            <!-- Категории -->
            <VCol cols="12">
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

  <!-- Аккордеон для Категорий и связей -->
  <VExpansionPanels
    v-model="expandedPanels"
    variant="accordion"
    class="expansion-panels-width-border mt-6"
  >
    <VExpansionPanel
      elevation="0"
      :value="0"
    >
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
        <div
          v-if="loadingCategories || typeCategories.length === 0"
          class="d-flex justify-center pa-6"
        >
          <VProgressCircular
            v-if="loadingCategories"
            indeterminate
            color="primary"
          />
          <div
            v-else
            class="text-center"
          >
            <p class="text-body-1 text-medium-emphasis mb-4">
              Категории пока не созданы
            </p>
            <VBtn
              color="primary"
              prepend-icon="bx-plus"
              @click="openCategoryDialog"
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
              @click="openCategoryDialog"
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
                    <h5 class="text-h5 mb-1">
                      {{ category.name }}
                    </h5>
                    <div class="d-flex gap-2 align-center">
                      <VChip
                        size="x-small"
                        :color="category.isActive ? 'success' : 'error'"
                        variant="tonal"
                      >
                        {{ category.isActive ? 'Активна' : 'Не активна' }}
                      </VChip>
                      <span class="text-body-2 text-medium-emphasis">
                        <VIcon
                          icon="bx-time"
                          size="14"
                        />
                        {{ category.laborHours || 0 }} ч.
                      </span>
                    </div>
                  </div>
                  <div class="d-flex gap-1">
                    <IconBtn
                      size="small"
                      @click="editCategory(category)"
                    >
                      <VIcon
                        icon="bx-edit"
                        size="18"
                      />
                    </IconBtn>
                    <IconBtn
                      size="small"
                      @click="deleteCategory(category)"
                    >
                      <VIcon
                        icon="bx-trash"
                        size="18"
                      />
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
                <p
                  v-else
                  class="text-body-2 text-medium-emphasis"
                >
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
                  <VIcon
                    icon="bx-link"
                    start
                    size="14"
                  />
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
  <VDialog
    v-model="categoryDialog"
    max-width="500px"
  >
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
  <VDialog
    v-model="deleteCategoryDialog"
    max-width="400px"
  >
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
  <VDialog
    v-model="linkCategoriesToTypeDialog"
    max-width="500px"
  >
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
                <span
                  v-if="item.raw.laborHours"
                  class="text-caption text-medium-emphasis ms-2"
                >
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
  <VDialog
    v-model="linkCategoryDialog"
    max-width="500px"
  >
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
