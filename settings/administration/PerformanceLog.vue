<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// Типы данных для журнала производительности
interface PerformanceLog {
  id: number
  name: string
  message: string
  createdAt: string
  updatedAt: string
  status: number // 1 - активен, 2 - не активен
  isActive: boolean
}

// Данные журнала производительности (демо данные)
const performanceLogs = ref<PerformanceLog[]>([
  {
    id: 1,
    name: 'performance-test-1',
    message: 'Тест производительности системы 1',
    createdAt: '2023-01-01 10:00:00',
    updatedAt: '2023-01-01 10:00:00',
    status: 1,
    isActive: true,
  },
  {
    id: 2,
    name: 'performance-test-2',
    message: 'Тест производительности системы 2',
    createdAt: '2023-01-02 11:00:00',
    updatedAt: '2023-01-02 11:00:00',
    status: 1,
    isActive: true,
  },
  {
    id: 3,
    name: 'performance-test-3',
    message: 'Тест производительности системы 3',
    createdAt: '2023-01-03 12:00:00',
    updatedAt: '2023-01-03 12:00:00',
    status: 1,
    isActive: true,
  },
  {
    id: 4,
    name: 'performance-test-4',
    message: 'Тест производительности системы 4',
    createdAt: '2023-01-04 13:00:00',
    updatedAt: '2023-01-04 13:00:00',
    status: 1,
    isActive: true,
  },
  {
    id: 5,
    name: 'old-performance-test',
    message: 'Старый тест производительности, больше не используется',
    createdAt: '2023-01-05 14:00:00',
    updatedAt: '2023-01-05 14:00:00',
    status: 2,
    isActive: false,
  },
  {
    id: 6,
    name: 'auto-performance-test',
    message: 'Автоматический тест производительности',
    createdAt: '2023-01-06 15:00:00',
    updatedAt: '2023-01-06 15:00:00',
    status: 1,
    isActive: true,
  },
])

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Описание', key: 'message', sortable: false },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Статус', key: 'status', sortable: false },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Фильтрация
const filteredPerformanceLogs = computed(() => {
  let filtered = performanceLogs.value

  if (statusFilter.value !== null) {
    filtered = filtered.filter(t => t.status === statusFilter.value)
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

const confirmBulkDelete = () => {
  const count = selectedItems.value.length
  selectedItems.value.forEach(item => {
    const index = performanceLogs.value.findIndex(t => t.id === item.id)
    if (index !== -1) {
      performanceLogs.value.splice(index, 1)
    }
  })
  selectedItems.value = []
  showToast(`Удалено ${count} журналов производительности`)
  isBulkDeleteDialogOpen.value = false
}

const confirmBulkStatusChange = () => {
  const count = selectedItems.value.length
  selectedItems.value.forEach(item => {
    const index = performanceLogs.value.findIndex(t => t.id === item.id)
    if (index !== -1) {
      performanceLogs.value[index].status = bulkStatusValue.value
      performanceLogs.value[index].isActive = bulkStatusValue.value === 1
    }
  })
  selectedItems.value = []
  showToast(`Статус изменен для ${count} журналов производительности`)
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

const defaultItem = ref<PerformanceLog>({
  id: -1,
  name: '',
  message: '',
  createdAt: '',
  updatedAt: '',
  status: 1,
  isActive: true,
})

const editedItem = ref<PerformanceLog>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Методы
const editItem = (item: PerformanceLog) => {
  editedIndex.value = performanceLogs.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: PerformanceLog) => {
  editedIndex.value = performanceLogs.value.indexOf(item)
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

  if (editedIndex.value > -1) {
    editedItem.value.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    Object.assign(performanceLogs.value[editedIndex.value], editedItem.value)
    showToast('Журнал производительности успешно сохранен')
  } else {
    // Добавление нового
    const newId = Math.max(...performanceLogs.value.map(t => t.id)) + 1
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    editedItem.value.id = newId
    editedItem.value.createdAt = now
    editedItem.value.updatedAt = now
    performanceLogs.value.push({ ...editedItem.value })
    showToast('Журнал производительности успешно добавлен')
  }
  close()
}

const deleteItemConfirm = () => {
  performanceLogs.value.splice(editedIndex.value, 1)
  showToast('Журнал производительности успешно удален')
  closeDelete()
}

// Переключение статуса
const toggleStatus = (item: PerformanceLog, newValue: number) => {
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение статуса:', newValue)
  
  const index = performanceLogs.value.findIndex((t: PerformanceLog) => t.id === item.id)
  console.log('🔍 Найденный индекс:', index)
  
  if (index !== -1) {
    console.log('✅ Элемент найден, обновляем статус')
    performanceLogs.value[index].status = newValue
    performanceLogs.value[index].isActive = newValue === 1
    console.log('✅ Обновленный элемент:', performanceLogs.value[index])
    showToast('Статус журнала производительности изменен')
  } else {
    console.error('❌ Элемент не найден в массиве performanceLogs')
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

// Добавление нового журнала производительности
const addNewPerformanceLog = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="Журнал производительности">

      <div class="d-flex flex-wrap gap-4 pa-6">
        <div class="d-flex align-center">
          <!-- Поиск -->
          <AppTextField
            placeholder="Поиск журналов производительности"
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
            @click="addNewPerformanceLog"
          >
            Добавить журнал производительности
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
            Вы уверены, что хотите удалить выбранные журналы производительности? Это действие нельзя отменить.
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
        :items="filteredPerformanceLogs"
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
        <template #item.message="{ item }">
          <div style=" overflow: hidden;max-inline-size: 300px; text-overflow: ellipsis; white-space: pre-line;">
            {{ item.message }}
          </div>
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

        <!-- Активен -->
        <template #item.isActive="{ item }">
          <VSwitch
            :model-value="item.isActive"
            @update:model-value="(val) => {
              console.log('🔘 VSwitch изменен для элемента:', item.name)
              console.log('🔘 Старое значение:', item.isActive)
              console.log('🔘 Новое значение:', val)
              console.log('🔘 Новый статус:', val ? 1 : 2)
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
          :length="Math.ceil(filteredPerformanceLogs.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать журнал производительности' : 'Добавить журнал производительности'">
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
                v-model="editedItem.message"
                label="Описание журнала производительности"
                rows="4"
                placeholder="Введите описание журнала производительности..."
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
      <VCard title="Вы уверены, что хотите удалить этот журнал производительности?">
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

