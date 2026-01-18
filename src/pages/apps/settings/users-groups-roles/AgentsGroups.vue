<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, ref, watch } from 'vue'

// Типы данных для Группа агентов
interface AgentsGroups {
  id: number
  name: string
  message: string
  status: number // 1 - активен, 2 - не активен
  isActive: boolean
  createdAt: string
  updatedAt: string
}


// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Данные группы агентов
const agentsGroups = ref<AgentsGroups[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Загрузка данных из API
const fetchAgentsGroups = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('Fetching agentsGroups from:', `${API_BASE}/agentsGroups`)
    const data = await $fetch<{ agentsGroups: AgentsGroups[], total: number }>(`${API_BASE}/agentsGroups`)
    console.log('Fetched agentsGroups data:', data)
    agentsGroups.value = data.agentsGroups
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки группы агентов'
    console.error('Error fetching agentsGroups:', err)
  } finally {
    loading.value = false
  }
}

// Создание группа агентов
const createAgentsGroups = async (item: Omit<AgentsGroups, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<AgentsGroups>(`${API_BASE}/agentsGroups`, {
      method: 'POST',
      body: item
    })
    agentsGroups.value.push(data)
    return data
  } catch (err) {
    console.error('Error creating agentsGroups:', err)
    throw err
  }
}

// Обновление группа агентов
const updateAgentsGroups = async (id: number, item: Omit<AgentsGroups, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<AgentsGroups>(`${API_BASE}/agentsGroups/${id}`, {
      method: 'PUT',
      body: item
    })
    const index = agentsGroups.value.findIndex(p => p.id === id)
    if (index !== -1) {
      agentsGroups.value[index] = data
    }
    return data
  } catch (err) {
    console.error('Error updating agentsGroups:', err)
    throw err
  }
}

// Удаление группа агентов
const deleteAgentsGroups = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/agentsGroups/${id}`, {
      method: 'DELETE'
    })
    const index = agentsGroups.value.findIndex(p => p.id === id)
    if (index !== -1) {
      agentsGroups.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Error deleting agentsGroups:', err)
    throw err
  }
}

// Инициализация
onMounted(() => {
  fetchAgentsGroups()
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Сообщение', key: 'message', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Статус', key: 'status', sortable: false },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Фильтрация
const filteredAgentsGroups = computed(() => {
  let filtered = agentsGroups.value

  if (statusFilter.value !== null) {
    filtered = filtered.filter(p => p.status === statusFilter.value)
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
      await deleteAgentsGroups(item.id)
    }
    selectedItems.value = []
    showToast(`Удалено ${count} группы агентов`)
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmBulkStatusChange = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await updateAgentsGroups(item.id, {
        ...item,
        status: bulkStatusValue.value,
        isActive: bulkStatusValue.value === 1
      })
    }
    selectedItems.value = []
    showToast(`Статус изменен для ${count} группы агентов`)
    isBulkStatusDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового изменения статуса', 'error')
  }
}

const resolveStatusVariant = (status: number) => {
  if (status === 1)
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

const defaultItem = ref<AgentsGroups>({
  id: -1,
  name: '',
  message: '',
  createdAt: '',
  updatedAt: '',
  status: 1,
  isActive: true,
})

const editedItem = ref<AgentsGroups>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Методы
const editItem = (item: AgentsGroups) => {
  editedIndex.value = agentsGroups.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: AgentsGroups) => {
  editedIndex.value = agentsGroups.value.indexOf(item)
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
      const updated = await updateAgentsGroups(editedItem.value.id, {
        ...editedItem.value,
        status: editedItem.value.status,
        isActive: editedItem.value.status === 1
      })
      showToast('Группа агентов успешно сохранен')
    } else {
      // Добавление нового
      const created = await createAgentsGroups({
        ...editedItem.value,
        status: editedItem.value.status,
        isActive: editedItem.value.status === 1
      })
      showToast('Группа агентов успешно добавлен')
    }
    close()
  } catch (err) {
    showToast('Ошибка сохранения группа агентов', 'error')
  }
}

const deleteItemConfirm = async () => {
  try {
    await deleteAgentsGroups(editedItem.value.id)
    showToast('Группа агентов успешно удален')
    closeDelete()
  } catch (err) {
    showToast('Ошибка удаления группа агентов', 'error')
  }
}

// Переключение статуса
const toggleStatus = async (item: AgentsGroups, newValue: number) => {
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение статуса:', newValue)

  try {
    await updateAgentsGroups(item.id, {
      ...item,
      status: newValue,
      isActive: newValue === 1
    })
    showToast('Статус группа агентов изменен')
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

// Добавление нового группа агентов
const addNewAgentsGroups = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="Группы агентов">

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
            placeholder="Поиск группы агентов"
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
            @click="addNewAgentsGroups"
          >
            Добавить группа агентов
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
            Вы уверены, что хотите удалить выбранные группы агентов? Это действие нельзя отменить.
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
        :items="filteredAgentsGroups"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Статус -->
        <template #item.status="{ item }">
          <VChip
            v-bind="resolveStatusVariant(item.status)"
            density="default"
            label
            size="small"
          />
        </template>

        <!-- Активен -->
        <template #item.isActive="{ item }">
          <VSwitch
            :model-value="item.isActive"
            @update:model-value="(val) => {
              toggleStatus(item, val ? 1 : 2)
            }"
          />
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
          :length="Math.ceil(filteredAgentsGroups.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать группа агентов' : 'Добавить группа агентов'">
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

            <!-- Сообщение -->
            <VCol
              cols="12"
              
            >
              <AppTextarea
                v-model="editedItem.message"
                label="Сообщение"
                rows="3"
                placeholder="Введите сообщение..."
              />
            </VCol>

            <!-- Статус -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.status"
                :items="statusOptions"
                item-title="text"
                item-value="value"
                label="Статус"
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
      <VCard title="Вы уверены, что хотите удалить этот группа агентов?">
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
