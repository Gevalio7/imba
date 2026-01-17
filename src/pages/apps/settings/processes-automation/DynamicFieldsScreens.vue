<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// Типы данных для динамических полей и экранов
interface DynamicFieldScreen {
  id: number
  name: string
  screenName: string
  fieldName: string
  fieldType: string
  isActive: boolean
  isRequired: boolean
  position: number
  createdAt: string
  updatedAt: string
  status: number // 1 - активен, 2 - не активен
}

// Данные динамических полей и экранов (демо данные)
const dynamicFieldScreens = ref<DynamicFieldScreen[]>([
  {
    id: 1,
    name: 'Ticket Create Screen',
    screenName: 'Создание тикета',
    fieldName: 'priority',
    fieldType: 'select',
    isActive: true,
    isRequired: true,
    position: 1,
    createdAt: '2023-01-01 10:00:00',
    updatedAt: '2023-01-01 10:00:00',
    status: 1,
  },
  {
    id: 2,
    name: 'Ticket Edit Screen',
    screenName: 'Редактирование тикета',
    fieldName: 'category',
    fieldType: 'select',
    isActive: true,
    isRequired: false,
    position: 2,
    createdAt: '2023-01-02 11:00:00',
    updatedAt: '2023-01-02 11:00:00',
    status: 1,
  },
  {
    id: 3,
    name: 'Customer Profile Screen',
    screenName: 'Профиль клиента',
    fieldName: 'phone',
    fieldType: 'text',
    isActive: true,
    isRequired: false,
    position: 1,
    createdAt: '2023-01-03 12:00:00',
    updatedAt: '2023-01-03 12:00:00',
    status: 1,
  },
  {
    id: 4,
    name: 'Agent Dashboard Screen',
    screenName: 'Агентская панель',
    fieldName: 'assigned_to',
    fieldType: 'select',
    isActive: true,
    isRequired: false,
    position: 1,
    createdAt: '2023-01-04 13:00:00',
    updatedAt: '2023-01-04 13:00:00',
    status: 1,
  },
  {
    id: 5,
    name: 'Old Screen Config',
    screenName: 'Старый экран',
    fieldName: 'old_field',
    fieldType: 'text',
    isActive: false,
    isRequired: false,
    position: 1,
    createdAt: '2023-01-05 14:00:00',
    updatedAt: '2023-01-05 14:00:00',
    status: 2,
  },
  {
    id: 6,
    name: 'Test Screen',
    screenName: 'Тестовый экран',
    fieldName: 'test_field',
    fieldType: 'checkbox',
    isActive: true,
    isRequired: true,
    position: 3,
    createdAt: '2023-01-06 15:00:00',
    updatedAt: '2023-01-06 15:00:00',
    status: 1,
  },
])

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Экран', key: 'screenName', sortable: true },
  { title: 'Поле', key: 'fieldName', sortable: true },
  { title: 'Тип', key: 'fieldType', sortable: true },
  { title: 'Обязательное', key: 'isRequired', sortable: false },
  { title: 'Позиция', key: 'position', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Статус', key: 'status', sortable: false },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Фильтрация
const filteredDynamicFieldScreens = computed(() => {
  let filtered = dynamicFieldScreens.value

  if (statusFilter.value !== null) {
    filtered = filtered.filter(t => t.status === statusFilter.value)
  }

  if (isActiveFilter.value !== null) {
    filtered = filtered.filter(t => t.isActive === isActiveFilter.value)
  }

  return filtered
})

// Сброс фильтров
const clearFilters = () => {
  statusFilter.value = null
  isActiveFilter.value = null
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
    const index = dynamicFieldScreens.value.findIndex(t => t.id === item.id)
    if (index !== -1) {
      dynamicFieldScreens.value.splice(index, 1)
    }
  })
  selectedItems.value = []
  showToast(`Удалено ${count} конфигураций динамических полей`)
  isBulkDeleteDialogOpen.value = false
}

const confirmBulkStatusChange = () => {
  const count = selectedItems.value.length
  selectedItems.value.forEach(item => {
    const index = dynamicFieldScreens.value.findIndex(t => t.id === item.id)
    if (index !== -1) {
      dynamicFieldScreens.value[index].status = bulkStatusValue.value
      dynamicFieldScreens.value[index].isActive = bulkStatusValue.value === 1
    }
  })
  selectedItems.value = []
  showToast(`Статус изменен для ${count} конфигураций динамических полей`)
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

const defaultItem = ref<DynamicFieldScreen>({
  id: -1,
  name: '',
  screenName: '',
  fieldName: '',
  fieldType: 'text',
  isActive: true,
  isRequired: false,
  position: 1,
  createdAt: '',
  updatedAt: '',
  status: 1,
})

const editedItem = ref<DynamicFieldScreen>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Опции типов полей
const fieldTypeOptions = [
  { text: 'Текст', value: 'text' },
  { text: 'Чекбокс', value: 'checkbox' },
  { text: 'Выбор', value: 'select' },
  { text: 'Дата', value: 'date' },
  { text: 'Число', value: 'number' },
]

// Методы
const editItem = (item: DynamicFieldScreen) => {
  editedIndex.value = dynamicFieldScreens.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: DynamicFieldScreen) => {
  editedIndex.value = dynamicFieldScreens.value.indexOf(item)
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

  if (!editedItem.value.screenName.trim()) {
    showToast('Название экрана обязательно для заполнения', 'error')
    return
  }

  if (!editedItem.value.fieldName.trim()) {
    showToast('Название поля обязательно для заполнения', 'error')
    return
  }

  if (editedIndex.value > -1) {
    editedItem.value.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    Object.assign(dynamicFieldScreens.value[editedIndex.value], editedItem.value)
    showToast('Конфигурация динамического поля успешно сохранена')
  } else {
    // Добавление нового
    const newId = Math.max(...dynamicFieldScreens.value.map(t => t.id)) + 1
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    editedItem.value.id = newId
    editedItem.value.createdAt = now
    editedItem.value.updatedAt = now
    dynamicFieldScreens.value.push({ ...editedItem.value })
    showToast('Конфигурация динамического поля успешно добавлена')
  }
  close()
}

const deleteItemConfirm = () => {
  dynamicFieldScreens.value.splice(editedIndex.value, 1)
  showToast('Конфигурация динамического поля успешно удалена')
  closeDelete()
}

// Переключение статуса
const toggleStatus = (item: DynamicFieldScreen, newValue: number) => {
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение статуса:', newValue)
  
  const index = dynamicFieldScreens.value.findIndex((t: DynamicFieldScreen) => t.id === item.id)
  console.log('🔍 Найденный индекс:', index)
  
  if (index !== -1) {
    console.log('✅ Элемент найден, обновляем статус')
    dynamicFieldScreens.value[index].status = newValue
    dynamicFieldScreens.value[index].isActive = newValue === 1
    console.log('✅ Обновленный элемент:', dynamicFieldScreens.value[index])
    showToast('Статус конфигурации динамического поля изменен')
  } else {
    console.error('❌ Элемент не найден в массиве dynamicFieldScreens')
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

// Добавление новой конфигурации динамического поля
const addNewDynamicFieldScreen = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="Динамические поля и Экраны">
      <VCardText>
        <p class="text-body-1">
          Активация динамических полей для экранов.
        </p>
        <p class="text-body-2 text-medium-emphasis">
          Activation of dynamic fields for screens.
        </p>
      </VCardText>

      <div class="d-flex flex-wrap gap-4 pa-6">
        <div class="d-flex align-center">
          <!-- Поиск -->
          <AppTextField
            placeholder="Поиск конфигураций динамических полей"
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
            @click="addNewDynamicFieldScreen"
          >
            Добавить конфигурацию
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
            Вы уверены, что хотите удалить выбранные конфигурации динамических полей? Это действие нельзя отменить.
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
        :items="filteredDynamicFieldScreens"
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
        <!-- Экран -->
        <template #item.screenName="{ item }">
          <div style=" overflow: hidden;max-inline-size: 200px; text-overflow: ellipsis; white-space: pre-line;">
            {{ item.screenName }}
          </div>
        </template>

        <!-- Поле -->
        <template #item.fieldName="{ item }">
          <div style=" overflow: hidden;max-inline-size: 150px; text-overflow: ellipsis; white-space: pre-line;">
            {{ item.fieldName }}
          </div>
        </template>

        <!-- Тип -->
        <template #item.fieldType="{ item }">
          <VChip
            :color="item.fieldType === 'text' ? 'primary' : item.fieldType === 'select' ? 'success' : item.fieldType === 'checkbox' ? 'warning' : 'info'"
            size="small"
            label
          >
            {{ item.fieldType }}
          </VChip>
        </template>

        <!-- Обязательное -->
        <template #item.isRequired="{ item }">
          <VChip
            :color="item.isRequired ? 'success' : 'default'"
            size="small"
            label
          >
            {{ item.isRequired ? 'Да' : 'Нет' }}
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
          :length="Math.ceil(filteredDynamicFieldScreens.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать конфигурацию' : 'Добавить конфигурацию'">
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

            <!-- Название экрана -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.screenName"
                label="Название экрана *"
              />
            </VCol>

            <!-- Название поля -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.fieldName"
                label="Название поля *"
              />
            </VCol>

            <!-- Тип поля -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.fieldType"
                :items="fieldTypeOptions"
                item-title="text"
                item-value="value"
                label="Тип поля *"
              />
            </VCol>

            <!-- Обязательное -->
            <VCol
              cols="12"
              sm="6"
            >
              <VSwitch
                v-model="editedItem.isRequired"
                label="Обязательное поле"
              />
            </VCol>

            <!-- Позиция -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.position"
                label="Позиция"
                type="number"
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
      <VCard title="Вы уверены, что хотите удалить эту конфигурацию динамического поля?">
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

