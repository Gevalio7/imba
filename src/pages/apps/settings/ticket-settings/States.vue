<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, ref, watch } from 'vue'

// Типы данных для Состояние
interface States {
  id: number
  name: string
  comment: string
  type: string
  color: string
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

// Данные состояния
const states = ref<States[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Загрузка данных из API
const fetchStates = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('Fetching states from:', `${API_BASE}/states`)
    const data = await $fetch<{ states: States[], total: number }>(`${API_BASE}/states`)
    console.log('Fetched states data:', data)
    states.value = data.states
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки состояния'
    console.error('Error fetching states:', err)
  } finally {
    loading.value = false
  }
}

// Создание состояние
const createStates = async (item: Omit<States, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<States>(`${API_BASE}/states`, {
      method: 'POST',
      body: item
    })
    states.value.unshift(data) // Добавляем в начало массива
    return data
  } catch (err) {
    console.error('Error creating states:', err)
    throw err
  }
}

// Обновление состояние
const updateStates = async (id: number, item: Omit<States, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<States>(`${API_BASE}/states/${id}`, {
      method: 'PUT',
      body: item
    })
    const index = states.value.findIndex(p => p.id === id)
    if (index !== -1) {
      states.value[index] = data
    }
    return data
  } catch (err) {
    console.error('Error updating states:', err)
    throw err
  }
}

// Удаление состояние
const deleteStates = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/states/${id}`, {
      method: 'DELETE'
    })
    const index = states.value.findIndex(p => p.id === id)
    if (index !== -1) {
      states.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Error deleting states:', err)
    throw err
  }
}

// Инициализация
onMounted(() => {
  fetchStates()
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Тип', key: 'type', sortable: true },
  { title: 'Цвет', key: 'color', sortable: true },
  { title: 'Комментарий', key: 'comment', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Фильтрация
const filteredStates = computed(() => {
  let filtered = states.value

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

  if (selectedTypes.value.length > 0) {
    // Фильтруем по выбранным типам
    filtered = filtered.filter(p => selectedTypes.value.includes(p.type))
  }

  return filtered
})

// Сброс фильтров
const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = null
  selectedNames.value = []
  selectedTypes.value = []
}

// Уникальные названия и типы для фильтра
const uniqueNames = computed(() => {
  const names = states.value.map(p => p.name)
  return [...new Set(names)].sort()
})

const uniqueTypes = computed(() => {
  const types = states.value.map(p => p.type)
  return [...new Set(types)].sort()
})

// Проверка активных фильтров
const hasActiveFilters = computed(() => {
  return statusFilter.value !== null || selectedNames.value.length > 0 || selectedTypes.value.length > 0
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
      await deleteStates(item.id)
    }
    selectedItems.value = []
    showToast(`Удалено ${count} состояния`)
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmBulkStatusChange = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await updateStates(item.id, {
        ...item,
        isActive: bulkStatusValue.value === 1
      })
    }
    selectedItems.value = []
    showToast(`Статус изменен для ${count} состояния`)
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
const selectedTypes = ref<string[]>([])
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

// Ограничение количества выбранных названий и типов
watch(selectedNames, (value) => {
  if (value.length > 10) {
    nextTick(() => selectedNames.value.pop())
  }
})

watch(selectedTypes, (value) => {
  if (value.length > 10) {
    nextTick(() => selectedTypes.value.pop())
  }
})

// Диалоги
const editDialog = ref(false)
const deleteDialog = ref(false)

const defaultItem = ref<States>({
  id: -1,
  name: '',
  comment: '',
  type: '',
  color: '',
  createdAt: '',
  updatedAt: '',
  isActive: true,
})

const editedItem = ref<States>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Опции типа
const typeOptions = [
  'Закрыта',
  'Новая',
  'Объединенные',
  'Ожидает автозакрытия',
  'Ожидает напоминания',
  'Открыта',
  'Удалена'
]

// Методы
const editItem = (item: States) => {
  editedIndex.value = states.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: States) => {
  editedIndex.value = states.value.indexOf(item)
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

  try {
    if (editedIndex.value > -1) {
      // Обновление существующего
      const updated = await updateStates(editedItem.value.id, {
        ...editedItem.value,
        isActive: editedItem.value.isActive
      })
      showToast('Состояние успешно сохранен')
    } else {
      // Добавление нового
      const created = await createStates({
        ...editedItem.value,
        isActive: editedItem.value.isActive
      })
      showToast('Состояние успешно добавлен')
    }
    close()
  } catch (err) {
    showToast('Ошибка сохранения состояние', 'error')
  }
}

const deleteItemConfirm = async () => {
  try {
    await deleteStates(editedItem.value.id)
    showToast('Состояние успешно удален')
    closeDelete()
  } catch (err) {
    showToast('Ошибка удаления состояние', 'error')
  }
}

// Переключение статуса
const toggleStatus = async (item: States, newValue: boolean | null) => {
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение isActive:', newValue)

  if (newValue === null) return

  try {
    await updateStates(item.id, {
      ...item,
      isActive: newValue
    })
    showToast('Статус состояние изменен')
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

// Добавление нового состояние
const addNewStates = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="Состояния">

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
            placeholder="Поиск состояния"
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
            @click="addNewStates"
          >
            Добавить состояние
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
                  label="Названия состояний"
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
                <AppCombobox
                  v-model="selectedTypes"
                  :items="uniqueTypes"
                  placeholder="Выберите типы"
                  hint="Максимум 10 типов"
                  label="Типы состояний"
                  multiple
                  persistent-hint
                />
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
            Вы уверены, что хотите удалить выбранные состояния? Это действие нельзя отменить.
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
        :items="filteredStates"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Тип -->
        <template #item.type="{ item }">
          {{ item.type }}
        </template>

        <!-- Цвет -->
        <template #item.color="{ item }">
          <div class="d-flex align-center gap-2">
            <div
              class="color-circle"
              :style="{ backgroundColor: item.color }"
            ></div>
            <span>{{ item.color }}</span>
          </div>
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
          :length="Math.ceil(filteredStates.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать состояние' : 'Добавить состояние'">
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

            <!-- Тип -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.type"
                :items="typeOptions"
                label="Тип"
              />
            </VCol>
          </VRow>
          <VRow>
            <!-- Цвет -->
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField
                v-model="editedItem.color"
                label="Цвет"
                type="color"
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
          <VRow>
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
      <VCard title="Вы уверены, что хотите удалить этот состояние?">
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

.color-circle {
  display: inline-block;
  border: 1px solid #ddd;
  border-radius: 50%;
  block-size: 20px;
  inline-size: 20px;
}
</style>
