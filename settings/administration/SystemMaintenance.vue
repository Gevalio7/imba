<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// Типы данных для обслуживания системы
interface SystemMaintenance {
  id: number
  name: string
  description: string
  startTime: string
  endTime: string
  isActive: boolean
  isScheduled: boolean
  createdAt: string
  updatedAt: string
  status: number // 1 - активен, 2 - не активен
}

// Данные обслуживания системы (демо данные)
const systemMaintenances = ref<SystemMaintenance[]>([
  {
    id: 1,
    name: 'Weekly Maintenance',
    description: 'Еженедельное обслуживание системы',
    startTime: '2023-01-15 02:00:00',
    endTime: '2023-01-15 04:00:00',
    isActive: true,
    isScheduled: true,
    createdAt: '2023-01-01 10:00:00',
    updatedAt: '2023-01-01 10:00:00',
    status: 1,
  },
  {
    id: 2,
    name: 'Database Update',
    description: 'Обновление базы данных',
    startTime: '2023-01-16 01:00:00',
    endTime: '2023-01-16 03:00:00',
    isActive: true,
    isScheduled: true,
    createdAt: '2023-01-02 11:00:00',
    updatedAt: '2023-01-02 11:00:00',
    status: 1,
  },
  {
    id: 3,
    name: 'Security Patch',
    description: 'Установка патчей безопасности',
    startTime: '2023-01-17 00:00:00',
    endTime: '2023-01-17 02:00:00',
    isActive: true,
    isScheduled: true,
    createdAt: '2023-01-03 12:00:00',
    updatedAt: '2023-01-03 12:00:00',
    status: 1,
  },
  {
    id: 4,
    name: 'Emergency Maintenance',
    description: 'Аварийное обслуживание системы',
    startTime: '2023-01-14 22:00:00',
    endTime: '2023-01-15 00:00:00',
    isActive: false,
    isScheduled: false,
    createdAt: '2023-01-04 13:00:00',
    updatedAt: '2023-01-04 13:00:00',
    status: 1,
  },
  {
    id: 5,
    name: 'Old Maintenance',
    description: 'Старое обслуживание, больше не используется',
    startTime: '2023-01-10 02:00:00',
    endTime: '2023-01-10 04:00:00',
    isActive: false,
    isScheduled: false,
    createdAt: '2023-01-05 14:00:00',
    updatedAt: '2023-01-05 14:00:00',
    status: 2,
  },
  {
    id: 6,
    name: 'Test Maintenance',
    description: 'Тестовое обслуживание для проверки системы',
    startTime: '2023-01-18 03:00:00',
    endTime: '2023-01-18 05:00:00',
    isActive: true,
    isScheduled: true,
    createdAt: '2023-01-06 15:00:00',
    updatedAt: '2023-01-06 15:00:00',
    status: 1,
  },
])

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Описание', key: 'description', sortable: false },
  { title: 'Начало', key: 'startTime', sortable: true },
  { title: 'Окончание', key: 'endTime', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Запланировано', key: 'isScheduled', sortable: false },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Статус', key: 'status', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Фильтрация
const filteredSystemMaintenances = computed(() => {
  let filtered = systemMaintenances.value

  if (statusFilter.value !== null) {
    filtered = filtered.filter(t => t.status === statusFilter.value)
  }

  if (isActiveFilter.value !== null) {
    filtered = filtered.filter(t => t.isActive === isActiveFilter.value)
  }

  if (isScheduledFilter.value !== null) {
    filtered = filtered.filter(t => t.isScheduled === isScheduledFilter.value)
  }

  return filtered
})

// Сброс фильтров
const clearFilters = () => {
  statusFilter.value = null
  isActiveFilter.value = null
  isScheduledFilter.value = null
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

const confirmBulkDelete = () => {
  const count = selectedItems.value.length
  selectedItems.value.forEach(item => {
    const index = systemMaintenances.value.findIndex(t => t.id === item.id)
    if (index !== -1) {
      systemMaintenances.value.splice(index, 1)
    }
  })
  selectedItems.value = []
  showToast(`Удалено ${count} мероприятий обслуживания`)
  isBulkDeleteDialogOpen.value = false
}

const confirmBulkStatusChange = () => {
  const count = selectedItems.value.length
  selectedItems.value.forEach(item => {
    const index = systemMaintenances.value.findIndex(t => t.id === item.id)
    if (index !== -1) {
      systemMaintenances.value[index].status = bulkStatusValue.value
      systemMaintenances.value[index].isActive = bulkStatusValue.value === 1
    }
  })
  selectedItems.value = []
  showToast(`Статус изменен для ${count} мероприятий обслуживания`)
  isBulkStatusDialogOpen.value = false
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
const isActiveFilter = ref<boolean | null>(null)
const isScheduledFilter = ref<boolean | null>(null)
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

const defaultItem = ref<SystemMaintenance>({
  id: -1,
  name: '',
  description: '',
  startTime: '',
  endTime: '',
  isActive: true,
  isScheduled: true,
  createdAt: '',
  updatedAt: '',
  status: 1,
})

const editedItem = ref<SystemMaintenance>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Методы
const editItem = (item: SystemMaintenance) => {
  editedIndex.value = systemMaintenances.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: SystemMaintenance) => {
  editedIndex.value = systemMaintenances.value.indexOf(item)
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

const save = () => {
  if (!editedItem.value.name.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  if (!editedItem.value.description.trim()) {
    showToast('Описание обязательно для заполнения', 'error')
    return
  }

  if (!editedItem.value.startTime.trim()) {
    showToast('Время начала обязательно для заполнения', 'error')
    return
  }

  if (!editedItem.value.endTime.trim()) {
    showToast('Время окончания обязательно для заполнения', 'error')
    return
  }

  if (new Date(editedItem.value.startTime) >= new Date(editedItem.value.endTime)) {
    showToast('Время окончания должно быть позже времени начала', 'error')
    return
  }

  if (editedIndex.value > -1) {
    editedItem.value.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    Object.assign(systemMaintenances.value[editedIndex.value], editedItem.value)
    showToast('Мероприятие обслуживания успешно сохранено')
  } else {
    // Добавление нового
    const newId = Math.max(...systemMaintenances.value.map(t => t.id)) + 1
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    editedItem.value.id = newId
    editedItem.value.createdAt = now
    editedItem.value.updatedAt = now
    systemMaintenances.value.push({ ...editedItem.value })
    showToast('Мероприятие обслуживания успешно добавлено')
  }
  close()
}

const deleteItemConfirm = () => {
  systemMaintenances.value.splice(editedIndex.value, 1)
  showToast('Мероприятие обслуживания успешно удалено')
  closeDelete()
}

// Переключение статуса
const toggleStatus = (item: SystemMaintenance, newValue: number) => {
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение статуса:', newValue)
  
  const index = systemMaintenances.value.findIndex((t: SystemMaintenance) => t.id === item.id)
  console.log('🔍 Найденный индекс:', index)
  
  if (index !== -1) {
    console.log('✅ Элемент найден, обновляем статус')
    systemMaintenances.value[index].status = newValue
    systemMaintenances.value[index].isActive = newValue === 1
    console.log('✅ Обновленный элемент:', systemMaintenances.value[index])
    showToast('Статус мероприятия обслуживания изменен')
  } else {
    console.error('❌ Элемент не найден в массиве systemMaintenances')
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

// Добавление нового мероприятия обслуживания
const addNewSystemMaintenance = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="Обслуживание системы">
      <VCardText>
        <p class="text-body-1">
          Управлять периодом обслуживания.
        </p>
        <p class="text-body-2 text-medium-emphasis">
          Schedule a maintenance period.
        </p>
      </VCardText>

      <div class="d-flex flex-wrap gap-4 pa-6">
        <div class="d-flex align-center">
          <!-- Поиск -->
          <AppTextField
            placeholder="Поиск мероприятий обслуживания"
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
              @click="() => {
                console.log('🖱️ Клик по кнопке Действия')
                console.log('📊 Количество выбранных:', selectedItems.length)
                console.log('🔍 Выбранные элементы:', selectedItems)
                console.log('🚪 Состояние меню до клика:', isBulkActionsMenuOpen)
              }"
            >
              Действия ({{ selectedItems.length }})
            </VBtn>
          </template>
          <VList>
            <VListItem
              @click="() => {
                console.log('🗑️ Клик по пункту Удалить')
                bulkDelete()
                isBulkActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Удалить</VListItemTitle>
            </VListItem>
            <VListItem
              @click="() => {
                console.log('🔄 Клик по пункту Изменить статус')
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
            @click="addNewSystemMaintenance"
          >
            Добавить обслуживание
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
              <VCol cols="12">
                <AppSelect
                  v-model="isActiveFilter"
                  placeholder="Активен"
                  :items="[
                    { title: 'Да', value: true },
                    { title: 'Нет', value: false },
                  ]"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>
              <VCol cols="12">
                <AppSelect
                  v-model="isScheduledFilter"
                  placeholder="Запланировано"
                  :items="[
                    { title: 'Да', value: true },
                    { title: 'Нет', value: false },
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
            Вы уверены, что хотите удалить выбранные мероприятия обслуживания? Это действие нельзя отменить.
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
        :items="filteredSystemMaintenances"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        @update:model-value="(val) => {
          console.log('📊 VDataTable model-value изменен:', val)
          console.log('📊 Тип данных:', typeof val, Array.isArray(val))
          console.log('📊 Количество выбранных:', val ? val.length : 0)
        }"
      >
        <!-- Описание -->
        <template #item.description="{ item }">
          <div style=" overflow: hidden;max-inline-size: 250px; text-overflow: ellipsis; white-space: pre-line;">
            {{ item.description }}
          </div>
        </template>

        <!-- Активен -->
        <template #item.isActive="{ item }">
          <VChip
            :color="item.isActive ? 'success' : 'default'"
            size="small"
            label
          >
            {{ item.isActive ? 'Да' : 'Нет' }}
          </VChip>
        </template>

        <!-- Запланировано -->
        <template #item.isScheduled="{ item }">
          <VChip
            :color="item.isScheduled ? 'primary' : 'default'"
            size="small"
            label
          >
            {{ item.isScheduled ? 'Да' : 'Нет' }}
          </VChip>
        </template>

        <!-- Статус -->
        <template #item.status="{ item }">
          <VChip
            v-bind="resolveStatusVariant(item.status)"
            density="default"
            label
            size="small"
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
          :length="Math.ceil(filteredSystemMaintenances.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать обслуживание' : 'Добавить обслуживание'">
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

            <!-- Описание -->
            <VCol cols="12">
              <AppTextarea
                v-model="editedItem.description"
                label="Описание обслуживания *"
                rows="3"
                placeholder="Введите описание обслуживания..."
              />
            </VCol>

            <!-- Время начала -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.startTime"
                label="Время начала *"
                type="datetime-local"
              />
            </VCol>

            <!-- Время окончания -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.endTime"
                label="Время окончания *"
                type="datetime-local"
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
              />
            </VCol>

            <!-- Запланировано -->
            <VCol
              cols="12"
              sm="6"
            >
              <VSwitch
                v-model="editedItem.isScheduled"
                label="Запланировано"
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
      <VCard title="Вы уверены, что хотите удалить это мероприятие обслуживания?">
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
