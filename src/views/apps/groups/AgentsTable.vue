<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, ref, watch } from 'vue'

// Типы данных для Агент
interface Agents {
  id: number
  firstName: string
  lastName: string
  login: string
  password: string
  email: string
  mobilePhone: string
  telegramAccount: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Данные агенты
const agents = ref<Agents[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Загрузка данных из API
const fetchAgents = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await $fetch<{ agents: Agents[], total: number }>(`${API_BASE}/agents`)
    agents.value = data.agents
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки агентов'
    console.error('Error fetching agents:', err)
  } finally {
    loading.value = false
  }
}

// Создание агента
const createAgents = async (item: Omit<Agents, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<Agents>(`${API_BASE}/agents`, {
      method: 'POST',
      body: item
    })
    agents.value.push(data)
    return data
  } catch (err) {
    console.error('Error creating agents:', err)
    throw err
  }
}

// Обновление агента
const updateAgents = async (id: number, item: Omit<Agents, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<Agents>(`${API_BASE}/agents/${id}`, {
      method: 'PUT',
      body: item
    })
    const index = agents.value.findIndex(p => p.id === id)
    if (index !== -1) agents.value[index] = data
    return data
  } catch (err) {
    console.error('Error updating agents:', err)
    throw err
  }
}

// Удаление агента
const deleteAgents = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/agents/${id}`, { method: 'DELETE' })
    const index = agents.value.findIndex(p => p.id === id)
    if (index !== -1) agents.value.splice(index, 1)
  } catch (err) {
    console.error('Error deleting agents:', err)
  }
}

// Инициализация
onMounted(() => {
  fetchAgents()
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Имя', key: 'firstName', sortable: true },
  { title: 'Фамилия', key: 'lastName', sortable: true },
  { title: 'Логин', key: 'login', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Мобильный телефон', key: 'mobilePhone', sortable: true },
  { title: 'Телеграмм акк', key: 'telegramAccount', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Фильтрация
const filteredAgents = computed(() => {
  let filtered = agents.value

  if (statusFilter.value !== null) {
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
  isBulkDeleteDialogOpen.value = true
}

const bulkChangeStatus = () => {
  isBulkStatusDialogOpen.value = true
}

const confirmBulkDelete = async () => {
  try {
    for (const item of selectedItems.value) {
      await deleteAgents(item.id)
    }
    selectedItems.value = []
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    console.error('Error bulk delete:', err)
  }
}

const confirmBulkStatusChange = async () => {
  try {
    for (const item of selectedItems.value) {
      await updateAgents(item.id, {
        ...item,
        isActive: bulkStatusValue.value === 1
      })
    }
    selectedItems.value = []
    isBulkStatusDialogOpen.value = false
  } catch (err) {
    console.error('Error bulk status change:', err)
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
const selectedItems = ref<Agents[]>([])
const isBulkActionsMenuOpen = ref(false)
const isBulkDeleteDialogOpen = ref(false)
const isBulkStatusDialogOpen = ref(false)
const bulkStatusValue = ref<number>(1)

// Диалоги
const editDialog = ref(false)
const deleteDialog = ref(false)

const defaultItem = ref<Agents>({
  id: -1,
  firstName: '',
  lastName: '',
  login: '',
  password: '',
  email: '',
  mobilePhone: '',
  telegramAccount: '',
  createdAt: '',
  updatedAt: '',
  isActive: true,
})

const editedItem = ref<Agents>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Отслеживание изменений выбранных элементов
watch(selectedItems, (newValue) => {
  console.log('Selected items:', newValue)
}, { deep: true })

// Переключение статуса
const toggleStatus = async (item: Agents, newValue: boolean | null) => {
  if (newValue === null) return
  try {
    await updateAgents(item.id, {
      firstName: item.firstName,
      lastName: item.lastName,
      login: item.login,
      password: item.password,
      email: item.email,
      mobilePhone: item.mobilePhone,
      telegramAccount: item.telegramAccount,
      isActive: newValue
    })
  } catch (err) {
    console.error('Error toggling status:', err)
  }
}

// Удаление
const deleteItem = (item: Agents) => {
  editedIndex.value = agents.value.indexOf(item)
  editedItem.value = { ...item }
  deleteDialog.value = true
}

const deleteItemConfirm = async () => {
  try {
    await deleteAgents(editedItem.value.id)
    deleteDialog.value = false
    editedIndex.value = -1
    editedItem.value = { ...defaultItem.value }
  } catch (err) {
    console.error('Error deleting:', err)
  }
}

const closeDelete = () => {
  deleteDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
}

// Редактирование
const editItem = (item: Agents) => {
  editedIndex.value = agents.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const close = () => {
  editDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
}

const save = async () => {
  if (!editedItem.value.firstName?.trim() || !editedItem.value.lastName?.trim()) {
    return
  }

  try {
    if (editedIndex.value > -1) {
      await updateAgents(editedItem.value.id, {
        firstName: editedItem.value.firstName,
        lastName: editedItem.value.lastName,
        login: editedItem.value.login,
        password: editedItem.value.password,
        email: editedItem.value.email,
        mobilePhone: editedItem.value.mobilePhone,
        telegramAccount: editedItem.value.telegramAccount,
        isActive: editedItem.value.isActive
      })
    } else {
      await createAgents({
        firstName: editedItem.value.firstName,
        lastName: editedItem.value.lastName,
        login: editedItem.value.login,
        password: editedItem.value.password,
        email: editedItem.value.email,
        mobilePhone: editedItem.value.mobilePhone,
        telegramAccount: editedItem.value.telegramAccount,
        isActive: editedItem.value.isActive
      })
    }
    close()
  } catch (err) {
    console.error('Error saving:', err)
  }
}

// Добавление нового агента
const addNewAgents = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="Агенты">
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
            placeholder="Поиск агентов"
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
            <VListItem @click="bulkDelete(); isBulkActionsMenuOpen = false">
              <VListItemTitle>Удалить</VListItemTitle>
            </VListItem>
            <VListItem @click="bulkChangeStatus(); isBulkActionsMenuOpen = false">
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
            @click="addNewAgents"
          >
            Добавить агента
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
            Вы уверены, что хотите удалить выбранных агентов? Это действие нельзя отменить.
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
        :items="filteredAgents"
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
          :length="Math.ceil(filteredAgents.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать агент' : 'Добавить агент'">
        <VCardText>
          <VRow>
            <!-- Имя -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.firstName"
                label="Имя *"
              />
            </VCol>

            <!-- Фамилия -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.lastName"
                label="Фамилия *"
              />
            </VCol>

            <!-- Логин -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.login"
                label="Логин"
              />
            </VCol>

            <!-- Пароль -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.password"
                label="Пароль"
                type="password"
              />
            </VCol>

            <!-- Email -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.email"
                label="Email"
              />
            </VCol>

            <!-- Мобильный телефон -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.mobilePhone"
                label="Мобильный телефон"
              />
            </VCol>

            <!-- Телеграмм акк -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.telegramAccount"
                label="Телеграмм акк"
              />
            </VCol>

            <!-- Активен -->
            <VCol cols="12" sm="6">
              <VSwitch
                v-model="editedItem.isActive"
                label="Активен"
                color="primary"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VCardText>
          <div class="d-flex gap-4 justify-end">
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
      <VCard title="Вы уверены, что хотите удалить этот агент?">
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
</template>
