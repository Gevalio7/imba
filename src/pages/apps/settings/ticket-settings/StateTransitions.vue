<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, ref } from 'vue'

// Типы данных для переходов статусов
interface StateTransition {
  id: number
  typeId: number | null
  fromStateId: number | null
  toStateId: number
  name: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  typeName?: string
  fromStateName?: string
  toStateName?: string
}

// Справочники
interface Type {
  id: number
  name: string
}

interface State {
  id: number
  name: string
  color?: string
}

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Store
const searchQuery = ref('')
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

// Данные переходов
const transitions = ref<StateTransition[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Справочники
const types = ref<Type[]>([])
const states = ref<State[]>([])

// Загрузка справочников
const fetchTypes = async () => {
  try {
    const data = await $fetch<{ types: Type[] }>(`${API_BASE}/types`)
    types.value = data.types || []
  } catch (err) {
    console.error('Error fetching types:', err)
  }
}

const fetchStates = async () => {
  try {
    const data = await $fetch<{ states: State[] }>(`${API_BASE}/states`)
    states.value = data.states || []
  } catch (err) {
    console.error('Error fetching states:', err)
  }
}

// Загрузка данных из API
const fetchTransitions = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('Fetching transitions from:', `${API_BASE}/stateTransitions`)
    const data = await $fetch<{ transitions: StateTransition[], total: number }>(`${API_BASE}/stateTransitions`)
    console.log('Fetched transitions data:', data)
    transitions.value = data.transitions
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки переходов'
    console.error('Error fetching transitions:', err)
  } finally {
    loading.value = false
  }
}

// Создание перехода
const createTransition = async (item: Omit<StateTransition, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<StateTransition>(`${API_BASE}/stateTransitions`, {
      method: 'POST',
      body: item
    })
    transitions.value.unshift(data)
    return data
  } catch (err) {
    console.error('Error creating transition:', err)
    throw err
  }
}

// Обновление перехода
const updateTransition = async (id: number, item: Omit<StateTransition, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<StateTransition>(`${API_BASE}/stateTransitions/${id}`, {
      method: 'PUT',
      body: item
    })
    const index = transitions.value.findIndex(p => p.id === id)
    if (index !== -1) {
      transitions.value[index] = data
    }
    return data
  } catch (err) {
    console.error('Error updating transition:', err)
    throw err
  }
}

// Удаление перехода
const deleteTransition = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/stateTransitions/${id}`, {
      method: 'DELETE'
    })
    const index = transitions.value.findIndex(p => p.id === id)
    if (index !== -1) {
      transitions.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Error deleting transition:', err)
    throw err
  }
}

// Инициализация
onMounted(async () => {
  await Promise.all([
    fetchTypes(),
    fetchStates(),
  ])
  await fetchTransitions()
})

const headers = [
  { title: '№', key: 'sortOrder', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Тип тикета', key: 'typeName', sortable: true },
  { title: 'Из статуса', key: 'fromStateName', sortable: true },
  { title: 'В статус', key: 'toStateName', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Фильтрация
const filteredTransitions = computed(() => {
  let filtered = transitions.value

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) ||
      (p.typeName && p.typeName.toLowerCase().includes(query)) ||
      (p.fromStateName && p.fromStateName.toLowerCase().includes(query)) ||
      (p.toStateName && p.toStateName.toLowerCase().includes(query))
    )
  }

  if (statusFilter.value !== null) {
    filtered = filtered.filter(p => p.isActive === (statusFilter.value === 1))
  }

  if (selectedTypes.value.length > 0) {
    filtered = filtered.filter(p => p.typeId && selectedTypes.value.includes(p.typeId))
  }

  if (selectedFromStates.value.length > 0) {
    filtered = filtered.filter(p => p.fromStateId && selectedFromStates.value.includes(p.fromStateId))
  }

  if (selectedToStates.value.length > 0) {
    filtered = filtered.filter(p => p.toStateId && selectedToStates.value.includes(p.toStateId))
  }

  return filtered
})

// Сброс фильтров
const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = null
  selectedTypes.value = []
  selectedFromStates.value = []
  selectedToStates.value = []
}

// Проверка активных фильтров
const hasActiveFilters = computed(() => {
  return statusFilter.value !== null || 
         selectedTypes.value.length > 0 || 
         selectedFromStates.value.length > 0 || 
         selectedToStates.value.length > 0
})

// Массовые действия
const bulkDelete = () => {
  isBulkDeleteDialogOpen.value = true
}

const bulkChangeStatus = () => {
  isBulkStatusDialogOpen.value = true
}

const confirmBulkDelete = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await deleteTransition(item.id)
    }
    selectedItems.value = []
    showToast(`Удалено ${count} переходов`)
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmBulkStatusChange = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await updateTransition(item.id, {
        ...item,
        isActive: bulkStatusValue.value === 1
      })
    }
    selectedItems.value = []
    showToast(`Статус изменен для ${count} переходов`)
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
const selectedTypes = ref<number[]>([])
const selectedFromStates = ref<number[]>([])
const selectedToStates = ref<number[]>([])
const isFilterDialogOpen = ref(false)

// Массовые действия
const selectedItems = ref<any[]>([])
const isBulkActionsMenuOpen = ref(false)
const isBulkDeleteDialogOpen = ref(false)
const isBulkStatusDialogOpen = ref(false)
const bulkStatusValue = ref<number>(1)

// Диалоги
const editDialog = ref(false)
const deleteDialog = ref(false)

const defaultItem = ref<StateTransition>({
  id: -1,
  typeId: null,
  fromStateId: null,
  toStateId: 0,
  name: '',
  isActive: true,
  sortOrder: 0,
  createdAt: '',
  updatedAt: '',
})

const editedItem = ref<StateTransition>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Опции для селектов
const typeOptions = computed(() => 
  types.value.map(t => ({ title: t.name, value: t.id }))
)

const stateOptions = computed(() => 
  states.value.map(s => ({ title: s.name, value: s.id }))
)

// Методы
const editItem = (item: StateTransition) => {
  editedIndex.value = transitions.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: StateTransition) => {
  editedIndex.value = transitions.value.indexOf(item)
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
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  if (!editedItem.value.toStateId) {
    showToast('Целевой статус обязателен для заполнения', 'error')
    return
  }

  try {
    if (editedIndex.value > -1) {
      // Обновление существующего
      await updateTransition(editedItem.value.id, {
        ...editedItem.value,
        isActive: editedItem.value.isActive
      })
      showToast('Переход успешно сохранен')
    } else {
      // Добавление нового
      await createTransition({
        ...editedItem.value,
        isActive: editedItem.value.isActive
      })
      showToast('Переход успешно добавлен')
    }
    close()
    // Перезагружаем данные для получения имен
    await fetchTransitions()
  } catch (err) {
    showToast('Ошибка сохранения перехода', 'error')
  }
}

const deleteItemConfirm = async () => {
  try {
    await deleteTransition(editedItem.value.id)
    showToast('Переход успешно удален')
    closeDelete()
  } catch (err) {
    showToast('Ошибка удаления перехода', 'error')
  }
}

// Переключение статуса
const toggleStatus = async (item: StateTransition, newValue: boolean | null) => {
  if (newValue === null) return

  try {
    await updateTransition(item.id, {
      ...item,
      isActive: newValue
    })
    showToast('Статус перехода изменен')
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

// Добавление нового перехода
const addNewTransition = () => {
  editedItem.value = { ...defaultItem.value, sortOrder: transitions.value.length + 1 }
  editedIndex.value = -1
  editDialog.value = true
}

// Перемещение перехода вверх
const moveUp = async (item: StateTransition) => {
  const index = transitions.value.findIndex(t => t.id === item.id)
  if (index <= 0) return

  const prevItem = transitions.value[index - 1]
  const currentOrder = item.sortOrder
  const prevOrder = prevItem.sortOrder

  // Меняем местами порядковые номера
  try {
    await updateTransition(item.id, { ...item, sortOrder: prevOrder })
    await updateTransition(prevItem.id, { ...prevItem, sortOrder: currentOrder })
    await fetchTransitions()
    showToast('Порядок изменен')
  } catch (err) {
    showToast('Ошибка изменения порядка', 'error')
  }
}

// Перемещение перехода вниз
const moveDown = async (item: StateTransition) => {
  const index = transitions.value.findIndex(t => t.id === item.id)
  if (index >= transitions.value.length - 1) return

  const nextItem = transitions.value[index + 1]
  const currentOrder = item.sortOrder
  const nextOrder = nextItem.sortOrder

  // Меняем местами порядковые номера
  try {
    await updateTransition(item.id, { ...item, sortOrder: nextOrder })
    await updateTransition(nextItem.id, { ...nextItem, sortOrder: currentOrder })
    await fetchTransitions()
    showToast('Порядок изменен')
  } catch (err) {
    showToast('Ошибка изменения порядка', 'error')
  }
}
</script>

<template>
  <div>
    <VCard title="Переходы статусов (Workflow)">

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
            placeholder="Поиск переходов"
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
            @click="addNewTransition"
          >
            Добавить переход
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
                  v-model="selectedTypes"
                  :items="typeOptions"
                  placeholder="Выберите типы"
                  label="Типы тикетов"
                  multiple
                  clearable
                  chips
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppSelect
                  v-model="selectedFromStates"
                  :items="stateOptions"
                  placeholder="Выберите статусы"
                  label="Из статуса"
                  multiple
                  clearable
                  chips
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppSelect
                  v-model="selectedToStates"
                  :items="stateOptions"
                  placeholder="Выберите статусы"
                  label="В статус"
                  multiple
                  clearable
                  chips
                />
              </VCol>
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
                  label="Статус"
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
            Вы уверены, что хотите удалить выбранные переходы? Это действие нельзя отменить.
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
        :items="filteredTransitions"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Порядковый номер -->
        <template #item.sortOrder="{ item, index }">
          <div class="d-flex align-center gap-2">
            <VChip
              size="small"
              color="primary"
              variant="tonal"
            >
              {{ item.sortOrder || index + 1 }}
            </VChip>
            <div class="d-flex flex-column">
              <IconBtn
                size="x-small"
                @click="moveUp(item)"
                :disabled="index === 0"
              >
                <VIcon icon="bx-chevron-up" size="18" />
              </IconBtn>
              <IconBtn
                size="x-small"
                @click="moveDown(item)"
                :disabled="index === filteredTransitions.length - 1"
              >
                <VIcon icon="bx-chevron-down" size="18" />
              </IconBtn>
            </div>
          </div>
        </template>

        <!-- Тип тикета -->
        <template #item.typeName="{ item }">
          <VChip
            v-if="item.typeName"
            size="small"
            color="info"
            variant="outlined"
          >
            {{ item.typeName }}
          </VChip>
          <span v-else class="text-medium-emphasis">Все типы</span>
        </template>

        <!-- Из статуса -->
        <template #item.fromStateName="{ item }">
          <VChip
            v-if="item.fromStateName"
            size="small"
            color="warning"
            variant="outlined"
          >
            {{ item.fromStateName }}
          </VChip>
          <span v-else class="text-medium-emphasis">Любой статус</span>
        </template>

        <!-- В статус -->
        <template #item.toStateName="{ item }">
          <VChip
            v-if="item.toStateName"
            size="small"
            color="success"
            variant="outlined"
          >
            {{ item.toStateName }}
          </VChip>
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
          :length="Math.ceil(filteredTransitions.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать переход' : 'Добавить переход'">
        <VCardText>
          <VRow>
            <!-- Название -->
            <VCol cols="12">
              <AppTextField
                v-model="editedItem.name"
                label="Название перехода *"
                placeholder="Например: Открыть, Закрыть, В работу"
              />
            </VCol>

            <!-- Тип тикета -->
            <VCol cols="12" md="6">
              <AppSelect
                v-model="editedItem.typeId"
                :items="typeOptions"
                label="Тип тикета"
                placeholder="Оставьте пустым для всех типов"
                clearable
                hint="Если не выбрано, применяется ко всем типам"
                persistent-hint
              />
            </VCol>

            <!-- Из статуса -->
            <VCol cols="12" md="6">
              <AppSelect
                v-model="editedItem.fromStateId"
                :items="stateOptions"
                label="Из статуса"
                placeholder="Оставьте пустым для любого статуса"
                clearable
                hint="Если не выбрано, переход доступен из любого статуса"
                persistent-hint
              />
            </VCol>

            <!-- В статус -->
            <VCol cols="12">
              <AppSelect
                v-model="editedItem.toStateId"
                :items="stateOptions"
                label="В статус *"
                placeholder="Выберите целевой статус"
                clearable
                hint="Обязательное поле - статус, в который перейдет тикет"
                persistent-hint
              />
            </VCol>

            <!-- Порядковый номер -->
            <VCol cols="12" md="6">
              <AppTextField
                v-model.number="editedItem.sortOrder"
                label="Порядковый номер"
                placeholder="1, 2, 3..."
                type="number"
                hint="Определяет порядок отображения перехода в списке"
                persistent-hint
              />
            </VCol>

            <!-- Активен -->
            <VCol cols="12" md="6">
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
      <VCard title="Вы уверены, что хотите удалить этот переход?">
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
