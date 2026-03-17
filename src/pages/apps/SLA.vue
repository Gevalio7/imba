<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, ref, watch } from 'vue'

// Типы данных для SLA
interface SLA {
   id: number
   name: string
   description: string
   type: string // тип SLA
   responseTime: number // в минутах - время первого ответа
   resolutionTime: number // в минутах - время обновления
   solutionTime: number // в минутах - время решения
   minIncidentTime: number // в минутах - минимальное время между инцидентами
   responseNotification: number // процент уведомления для первого ответа
   updateNotification: number // процент уведомления для обновления
   solutionNotification: number // процент уведомления для решения
   calendarId?: number
   calendarName?: string
   serviceIds?: number[]
   serviceNames?: string[]
   isActive: boolean
   createdAt: string
   updatedAt: string
}


// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Роутер
const router = useRouter()

// Данные sla
const sLA = ref<SLA[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Справочники
const calendars = ref([])
const services = ref([])

// Загрузка справочников
const fetchCalendars = async () => {
  console.log('fetchCalendars called')
  try {
    console.log('Fetching calendars from:', `${API_BASE}/calendars`)
    const data = await $fetch(`${API_BASE}/calendars`)
    console.log('Fetched calendars:', data)
    calendars.value = data.calendars || []
    console.log('Calendars set to:', calendars.value)
  } catch (err) {
    console.log('Error fetching calendars:', err)
  }
}

const fetchServices = async () => {
  try {
    console.log('Fetching services from:', `${API_BASE}/services`)
    const data = await $fetch(`${API_BASE}/services`)
    console.log('Fetched services:', data)
    services.value = data.services || []
    console.log('Services set to:', services.value)
  } catch (err) {
    console.log('Error fetching services:', err)
  }
}

// Загрузка данных из API
const fetchSLA = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('Fetching sla from:', `${API_BASE}/sla`)
    const data = await $fetch<{ sla: SLA[], total: number }>(`${API_BASE}/sla`)
    console.log('Fetched sla data:', data)
    sLA.value = data.sla
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки sla'
    console.error('Error fetching sLA:', err)
  } finally {
    loading.value = false
  }
}

// Создание sla
const createSLA = async (item: Omit<SLA, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<SLA>(`${API_BASE}/sla`, {
      method: 'POST',
      body: item
    })
    sLA.value.push(data)
    return data
  } catch (err) {
    console.error('Error creating sla:', err)
    throw err
  }
}

// Обновление sla
const updateSLA = async (id: number, item: Omit<SLA, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<SLA>(`${API_BASE}/sla/${id}`, {
      method: 'PUT',
      body: item
    })
    const index = sLA.value.findIndex(p => p.id === id)
    if (index !== -1) {
      sLA.value[index] = data
    }
    return data
  } catch (err) {
    console.error('Error updating sla:', err)
    throw err
  }
}

// Удаление sla
const deleteSLA = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/sla/${id}`, {
      method: 'DELETE'
    })
    const index = sLA.value.findIndex(p => p.id === id)
    if (index !== -1) {
      sLA.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Error deleting sla:', err)
    throw err
  }
}

// Инициализация
onMounted(async () => {
  console.log('onMounted called')
  await Promise.all([fetchCalendars(), fetchServices()])
  console.log('fetchCalendars and fetchServices done')
  fetchSLA()
})

const headers = [
   { title: 'ID', key: 'id', sortable: true },
   { title: 'Название', key: 'name', sortable: true },
   { title: 'Описание', key: 'description', sortable: true },
   { title: 'Эскалация - время первого ответа (мин)', key: 'responseTime', sortable: true },
   { title: 'Эскалация - время обновления (мин)', key: 'resolutionTime', sortable: true },
   { title: 'Эскалация - время решения (мин)', key: 'solutionTime', sortable: true },
   { title: 'Мин. время между инцидентами (мин)', key: 'minIncidentTime', sortable: true },
   { title: 'Календарь', key: 'calendarName', sortable: true },
   { title: 'Сервисы', key: 'serviceNames', sortable: false },
   { title: 'Создано', key: 'createdAt', sortable: true },
   { title: 'Изменено', key: 'updatedAt', sortable: true },
   { title: 'Активен', key: 'isActive', sortable: false },
   { title: 'Действия', key: 'actions', sortable: false }
]

// Фильтрация
const filteredSLA = computed(() => {
  let filtered = sLA.value

  if (statusFilter.value !== null) {
    // Фильтруем по isActive: 1 = true (активен), 2 = false (не активен)
    filtered = filtered.filter(p => p.isActive === (statusFilter.value === 1))
  }

  return filtered
})

// Форматирование сервисов для отображения
const formatServices = (serviceNames?: string[]) => {
  if (!serviceNames || serviceNames.length === 0) return '-'
  return serviceNames.join(', ')
}

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
      await deleteSLA(item.id)
    }
    selectedItems.value = []
    showToast(`Удалено ${count} sla`)
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmBulkStatusChange = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await updateSLA(item.id, {
        ...item,
        isActive: bulkStatusValue.value === 1
      })
    }
    selectedItems.value = []
    showToast(`Статус изменен для ${count} sla`)
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
const deleteDialog = ref(false)

const editedItem = ref<SLA>({
   id: -1,
   name: '',
   description: '',
   type: '',
   responseTime: 15,
   resolutionTime: 4,
   solutionTime: 0,
   minIncidentTime: 10,
   responseNotification: 20,
   updateNotification: 80,
   solutionNotification: 80,
   calendarId: undefined,
   serviceIds: [],
   createdAt: '',
   updatedAt: '',
   isActive: true,
})

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Методы
const editItem = (item: SLA) => {
   router.push(`/apps/SLA-${item.id}`)
}

const deleteItem = (item: SLA) => {
   editedItem.value = { ...item }
   deleteDialog.value = true
}

const closeDelete = () => {
   deleteDialog.value = false
}

const deleteItemConfirm = async () => {
   try {
     await deleteSLA(editedItem.value.id)
     showToast('SLA успешно удален')
     closeDelete()
   } catch (err) {
     showToast('Ошибка удаления sla', 'error')
   }
}

// Переключение статуса
const toggleStatus = async (item: SLA, newValue: boolean | null) => {
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение isActive:', newValue)

  if (newValue === null) return

  try {
    await updateSLA(item.id, {
      ...item,
      isActive: newValue
    })
    showToast('Статус sla изменен')
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

// Добавление нового sla
const addNewSLA = () => {
   router.push('/apps/SLA-new')
}
</script>

<template>
  <div>
    <VCard title="SLA">

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
            placeholder="Поиск sla"
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
            @click="addNewSLA"
          >
            Добавить sla
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
            Вы уверены, что хотите удалить выбранные sla? Это действие нельзя отменить.
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
        :items="filteredSLA"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Календарь -->
        <template #item.calendarName="{ item }">
          {{ item.calendarName || '-' }}
        </template>

        <!-- Сервисы -->
        <template #item.serviceNames="{ item }">
          {{ formatServices(item.serviceNames) }}
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
          :length="Math.ceil(filteredSLA.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог удаления -->
    <VDialog
      v-model="deleteDialog"
      max-width="500px"
    >
      <VCard title="Вы уверены, что хотите удалить этот sla?">
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
