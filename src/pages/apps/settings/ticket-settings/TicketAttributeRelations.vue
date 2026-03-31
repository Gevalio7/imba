<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, ref, watch } from 'vue'

// Типы данных для Связь атрибутов тикета
interface TicketAttributeRelations {
  id: number
  name: string
  sourceAttribute: string
  targetAttribute: string
  relationType: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}


// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Данные связи атрибутов тикетов
const ticketAttributeRelations = ref<TicketAttributeRelations[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Загрузка данных из API
const fetchTicketAttributeRelations = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('Fetching ticketAttributeRelations from:', `${API_BASE}/ticketAttributeRelations`)
    const data = await $fetch<{ ticketAttributeRelations: TicketAttributeRelations[], total: number }>(`${API_BASE}/ticketAttributeRelations`)
    console.log('Fetched ticketAttributeRelations data:', data)
    ticketAttributeRelations.value = data.ticketAttributeRelations
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки связи атрибутов тикетов'
    console.error('Error fetching ticketAttributeRelations:', err)
  } finally {
    loading.value = false
  }
}

// Создание связь атрибутов тикета
const createTicketAttributeRelations = async (item: Omit<TicketAttributeRelations, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<TicketAttributeRelations>(`${API_BASE}/ticketAttributeRelations`, {
      method: 'POST',
      body: item
    })
    ticketAttributeRelations.value.push(data)
    return data
  } catch (err) {
    console.error('Error creating ticketAttributeRelations:', err)
    throw err
  }
}

// Обновление связь атрибутов тикета
const updateTicketAttributeRelations = async (id: number, item: Omit<TicketAttributeRelations, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<TicketAttributeRelations>(`${API_BASE}/ticketAttributeRelations/${id}`, {
      method: 'PUT',
      body: item
    })
    const index = ticketAttributeRelations.value.findIndex(p => p.id === id)
    if (index !== -1) {
      ticketAttributeRelations.value[index] = data
    }
    return data
  } catch (err) {
    console.error('Error updating ticketAttributeRelations:', err)
    throw err
  }
}

// Удаление связь атрибутов тикета
const deleteTicketAttributeRelations = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/ticketAttributeRelations/${id}`, {
      method: 'DELETE'
    })
    const index = ticketAttributeRelations.value.findIndex(p => p.id === id)
    if (index !== -1) {
      ticketAttributeRelations.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Error deleting ticketAttributeRelations:', err)
    throw err
  }
}

// Инициализация
onMounted(() => {
  fetchTicketAttributeRelations()
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Исходный атрибут', key: 'sourceAttribute', sortable: true },
  { title: 'Целевой атрибут', key: 'targetAttribute', sortable: true },
  { title: 'Тип связи', key: 'relationType', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Фильтрация
const filteredTicketAttributeRelations = computed(() => {
  let filtered = ticketAttributeRelations.value

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
    for (const item of selectedItems.value) {
      await deleteTicketAttributeRelations(item.id)
    }
    selectedItems.value = []
    showToast(`Удалено ${count} связи атрибутов тикетов`)
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmBulkStatusChange = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await updateTicketAttributeRelations(item.id, {
        ...item,
        isActive: bulkStatusValue.value === 1
      })
    }
    selectedItems.value = []
    showToast(`Статус изменен для ${count} связи атрибутов тикетов`)
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
watch(selectedItems, (newValue) => {
  console.log('✅ Изменение выбранных элементов')
  console.log('📋 Новое значение selectedItems:', newValue)
  console.log('📊 Количество выбранных:', newValue.length)
  console.log('🔍 Детали выбранных элементов:', JSON.stringify(newValue, null, 2))
}, { deep: true })

// Диалоги
const editDialog = ref(false)
const deleteDialog = ref(false)

const defaultItem = ref<TicketAttributeRelations>({
  id: -1,
  name: '',
  sourceAttribute: '',
  targetAttribute: '',
  relationType: '',
  createdAt: '',
  updatedAt: '',
  isActive: true,
})

const editedItem = ref<TicketAttributeRelations>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Методы
const editItem = (item: TicketAttributeRelations) => {
  editedIndex.value = ticketAttributeRelations.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: TicketAttributeRelations) => {
  editedIndex.value = ticketAttributeRelations.value.indexOf(item)
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
      const updated = await updateTicketAttributeRelations(editedItem.value.id, {
        ...editedItem.value,
        isActive: editedItem.value.isActive
      })
      showToast('Связь атрибутов тикета успешно сохранен')
    } else {
      // Добавление нового
      const created = await createTicketAttributeRelations({
        ...editedItem.value,
        isActive: editedItem.value.isActive
      })
      showToast('Связь атрибутов тикета успешно добавлен')
    }
    close()
  } catch (err) {
    showToast('Ошибка сохранения связь атрибутов тикета', 'error')
  }
}

const deleteItemConfirm = async () => {
  try {
    await deleteTicketAttributeRelations(editedItem.value.id)
    showToast('Связь атрибутов тикета успешно удален')
    closeDelete()
  } catch (err) {
    showToast('Ошибка удаления связь атрибутов тикета', 'error')
  }
}

// Переключение статуса
const toggleStatus = async (item: TicketAttributeRelations, newValue: boolean | null) => {
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение isActive:', newValue)

  if (newValue === null) return

  try {
    await updateTicketAttributeRelations(item.id, {
      ...item,
      isActive: newValue
    })
    showToast('Статус связь атрибутов тикета изменен')
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

// Добавление нового связь атрибутов тикета
const addNewTicketAttributeRelations = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="Связи атрибутов тикетов">

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
            placeholder="Поиск связи атрибутов тикетов"
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
            @click="addNewTicketAttributeRelations"
          >
            Добавить связь атрибутов тикета
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
            Вы уверены, что хотите удалить выбранные связи атрибутов тикетов? Это действие нельзя отменить.
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
        :items="filteredTicketAttributeRelations"
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
          :length="Math.ceil(filteredTicketAttributeRelations.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать связь атрибутов тикета' : 'Добавить связь атрибутов тикета'">
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

            <!-- Исходный атрибут -->
            <VCol
              cols="12"
              
            >
              <AppTextField
                v-model="editedItem.sourceAttribute"
                label="Исходный атрибут"
              />
            </VCol>

            <!-- Целевой атрибут -->
            <VCol
              cols="12"
              
            >
              <AppTextField
                v-model="editedItem.targetAttribute"
                label="Целевой атрибут"
              />
            </VCol>

            <!-- Тип связи -->
            <VCol
              cols="12"
              
            >
              <AppTextField
                v-model="editedItem.relationType"
                label="Тип связи"
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
      <VCard title="Вы уверены, что хотите удалить этот связь атрибутов тикета?">
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
