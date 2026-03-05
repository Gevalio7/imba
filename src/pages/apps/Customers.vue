<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, ref, watch } from 'vue'

// Типы данных для Компания
interface Customers {
  id: number
  name: string
  street: string
  zip: string
  city: string
  comment: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ========== ПАГИНАЦИЯ КОМПАНИЙ ==========
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Вычисляем количество страниц
const paginationLength = computed(() => {
  const total = filteredCustomers.value.length
  const perPage = itemsPerPage.value
  return Math.ceil(total / perPage) || 1
})

// ========== ФИЛЬТРАЦИЯ ==========
const searchQuery = ref('')
const statusFilter = ref<number | null>(null)
const isFilterDialogOpen = ref(false)

// Сброс страницы при изменении фильтров
watch([searchQuery, statusFilter], () => {
  currentPage.value = 1
})

// Сброс страницы при изменении количества элементов на странице
watch(itemsPerPage, () => {
  currentPage.value = 1
})

// ========== КЛИЕНТСКАЯ ФИЛЬТРАЦИЯ ==========
const filteredCustomers = computed(() => {
  let filtered = customers.value
  
  // Фильтр по статусу
  if (statusFilter.value !== null) {
    filtered = filtered.filter(c => c.isActive === (statusFilter.value === 1))
  }
  
  // Поиск по названию, городу, улице
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(c => 
      c.name?.toLowerCase().includes(query) ||
      c.city?.toLowerCase().includes(query) ||
      c.street?.toLowerCase().includes(query) ||
      c.comment?.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// ========== КОМПАНИИ ==========
const customers = ref<Customers[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Загрузка данных из API
const fetchCustomers = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await $fetch<{ customers: Customers[], total: number }>(`${API_BASE}/customers`)
    customers.value = data.customers
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки компании'
    console.error('Error fetching customers:', err)
  } finally {
    loading.value = false
  }
}

// Создание компании
const createCustomers = async (item: Omit<Customers, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<Customers>(`${API_BASE}/customers`, {
      method: 'POST',
      body: item
    })
    customers.value.push(data)
    return data
  } catch (err) {
    console.error('Error creating customers:', err)
    throw err
  }
}

// Обновление компании
const updateCustomers = async (id: number, item: Omit<Customers, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<Customers>(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      body: item
    })
    const index = customers.value.findIndex(p => p.id === id)
    if (index !== -1) {
      customers.value[index] = data
    }
    return data
  } catch (err) {
    console.error('Error updating customers:', err)
    throw err
  }
}

// Удаление компании
const deleteCustomers = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/customers/${id}`, {
      method: 'DELETE'
    })
    const index = customers.value.findIndex(p => p.id === id)
    if (index !== -1) {
      customers.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Error deleting customers:', err)
    throw err
  }
}

// Инициализация
onMounted(() => {
  fetchCustomers()
})

// ========== ЗАГОЛОВКИ ТАБЛИЦ КОМПАНИЙ ==========
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Улица', key: 'street', sortable: true },
  { title: 'Индекс', key: 'zip', sortable: true },
  { title: 'Город', key: 'city', sortable: true },
  { title: 'Комментарий', key: 'comment', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Сброс фильтров компаний
const clearFilters = () => {
  statusFilter.value = null
}

// ========== МАССОВЫЕ ДЕЙСТВИЯ ДЛЯ КОМПАНИЙ ==========
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
      await deleteCustomers(item.id)
    }
    selectedItems.value = []
    showToast(`Удалено ${count} компаний`)
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmBulkStatusChange = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await updateCustomers(item.id, {
        ...item,
        isActive: bulkStatusValue.value === 1
      })
    }
    selectedItems.value = []
    showToast(`Статус изменен для ${count} компаний`)
    isBulkStatusDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового изменения статуса', 'error')
  }
}

const resolveStatusVariant = (isActive: boolean) => {
  if (isActive) {
    return { color: 'primary', text: 'Активен' }
  }
  return { color: 'error', text: 'Не активен' }
}

// Массовые действия для компаний
const selectedItems = ref<any[]>([])
const isBulkActionsMenuOpen = ref(false)
const isBulkDeleteDialogOpen = ref(false)
const isBulkStatusDialogOpen = ref(false)
const bulkStatusValue = ref<number>(1)

// Отслеживание изменений выбранных элементов компаний
watch(selectedItems, () => {
  // Можно добавить логику при изменении выбранных элементов
}, { deep: true })

// ========== ДИАЛОГИ КОМПАНИЙ ==========
const editDialog = ref(false)
const deleteDialog = ref(false)

const defaultItem = ref<Customers>({
  id: -1,
  name: '',
  street: '',
  zip: '',
  city: '',
  comment: '',
  createdAt: '',
  updatedAt: '',
  isActive: true,
})

const editedItem = ref<Customers>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// ========== МЕТОДЫ КОМПАНИЙ ==========
const editItem = (item: Customers) => {
  editedIndex.value = customers.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: Customers) => {
  editedIndex.value = customers.value.indexOf(item)
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
      await updateCustomers(editedItem.value.id, {
        ...editedItem.value,
        isActive: editedItem.value.isActive
      })
      showToast('Компания успешно сохранена')
    } else {
      // Добавление нового
      await createCustomers({
        ...editedItem.value,
        isActive: editedItem.value.isActive
      })
      showToast('Компания успешно добавлена')
    }
    close()
  } catch (err) {
    showToast('Ошибка сохранения компании', 'error')
  }
}

const deleteItemConfirm = async () => {
  try {
    await deleteCustomers(editedItem.value.id)
    showToast('Компания успешно удалена')
    closeDelete()
  } catch (err) {
    showToast('Ошибка удаления компании', 'error')
  }
}

// Переключение статуса компании
const toggleStatus = async (item: Customers, newValue: boolean) => {
  try {
    await updateCustomers(item.id, {
      ...item,
      isActive: newValue
    })
    showToast('Статус компании изменен')
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

// Добавление нового клиент
const addNewCustomers = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="Компании">

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
            placeholder="Поиск компании"
            style="inline-size: 250px;"
            class="me-3"
            clearable
            clear-icon="bx-x"
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
            @click="addNewCustomers"
          >
            Добавить компанию
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
            Вы уверены, что хотите удалить выбранные компании? Это действие нельзя отменить.
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
        :items-per-page="itemsPerPage"
        @update:items-per-page="(val) => itemsPerPage = val"
        :page="currentPage"
        @update:page="(val) => currentPage = val"
        :headers="headers"
        :items="filteredCustomers"
        :items-length="filteredCustomers.length"
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
              @update:model-value="(val) => toggleStatus(item, val ?? false)"
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
          :length="paginationLength"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать компанию' : 'Добавить компанию'">
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

            <!-- Улица -->
            <VCol
              cols="12"
              
            >
              <AppTextField
                v-model="editedItem.street"
                label="Улица"
              />
            </VCol>

            <!-- Индекс -->
            <VCol
              cols="12"
              
            >
              <AppTextField
                v-model="editedItem.zip"
                label="Индекс"
              />
            </VCol>

            <!-- Город -->
            <VCol
              cols="12"
              
            >
              <AppTextField
                v-model="editedItem.city"
                label="Город"
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
      <VCard title="Вы уверены, что хотите удалить эту компанию?">
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
