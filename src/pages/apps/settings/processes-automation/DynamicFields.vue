<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// Типы данных для динамических полей
interface DynamicField {
  id: number
  name: string
  label: string
  fieldType: string
  defaultValue: string
  isRequired: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  status: number // 1 - активен, 2 - не активен
}

// Данные динамических полей (демо данные)
const dynamicFields = ref<DynamicField[]>([
  {
    id: 1,
    name: 'customer_priority',
    label: 'Приоритет клиента',
    fieldType: 'select',
    defaultValue: 'normal',
    isRequired: false,
    isActive: true,
    createdAt: '2023-01-01 10:00:00',
    updatedAt: '2023-01-01 10:00:00',
    status: 1,
  },
  {
    id: 2,
    name: 'ticket_category',
    label: 'Категория тикета',
    fieldType: 'select',
    defaultValue: '',
    isRequired: true,
    isActive: true,
    createdAt: '2023-01-02 11:00:00',
    updatedAt: '2023-01-02 11:00:00',
    status: 1,
  },
  {
    id: 3,
    name: 'customer_phone',
    label: 'Телефон клиента',
    fieldType: 'text',
    defaultValue: '',
    isRequired: false,
    isActive: true,
    createdAt: '2023-01-03 12:00:00',
    updatedAt: '2023-01-03 12:00:00',
    status: 1,
  },
  {
    id: 4,
    name: 'agent_notes',
    label: 'Заметки агента',
    fieldType: 'textarea',
    defaultValue: '',
    isRequired: false,
    isActive: true,
    createdAt: '2023-01-04 13:00:00',
    updatedAt: '2023-01-04 13:00:00',
    status: 1,
  },
  {
    id: 5,
    name: 'old_field',
    label: 'Старое поле',
    fieldType: 'text',
    defaultValue: '',
    isRequired: false,
    isActive: false,
    createdAt: '2023-01-05 14:00:00',
    updatedAt: '2023-01-05 14:00:00',
    status: 2,
  },
  {
    id: 6,
    name: 'test_field',
    label: 'Тестовое поле',
    fieldType: 'checkbox',
    defaultValue: 'false',
    isRequired: true,
    isActive: true,
    createdAt: '2023-01-06 15:00:00',
    updatedAt: '2023-01-06 15:00:00',
    status: 1,
  },
])

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Метка', key: 'label', sortable: true },
  { title: 'Тип поля', key: 'fieldType', sortable: true },
  { title: 'Значение по умолчанию', key: 'defaultValue', sortable: false },
  { title: 'Обязательное', key: 'isRequired', sortable: false },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Статус', key: 'status', sortable: false },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Фильтрация
const filteredDynamicFields = computed(() => {
  let filtered = dynamicFields.value

  if (statusFilter.value !== null) {
    filtered = filtered.filter(t => t.status === statusFilter.value)
  }

  if (fieldTypeFilter.value !== null) {
    filtered = filtered.filter(t => t.fieldType === fieldTypeFilter.value)
  }

  return filtered
})

// Сброс фильтров
const clearFilters = () => {
  statusFilter.value = null
  fieldTypeFilter.value = null
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
    const index = dynamicFields.value.findIndex(t => t.id === item.id)
    if (index !== -1) {
      dynamicFields.value.splice(index, 1)
    }
  })
  selectedItems.value = []
  showToast(`Удалено ${count} динамических полей`)
  isBulkDeleteDialogOpen.value = false
}

const confirmBulkStatusChange = () => {
  const count = selectedItems.value.length
  selectedItems.value.forEach(item => {
    const index = dynamicFields.value.findIndex(t => t.id === item.id)
    if (index !== -1) {
      dynamicFields.value[index].status = bulkStatusValue.value
      dynamicFields.value[index].isActive = bulkStatusValue.value === 1
    }
  })
  selectedItems.value = []
  showToast(`Статус изменен для ${count} динамических полей`)
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
const fieldTypeFilter = ref<string | null>(null)
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

const defaultItem = ref<DynamicField>({
  id: -1,
  name: '',
  label: '',
  fieldType: 'text',
  defaultValue: '',
  isRequired: false,
  isActive: true,
  createdAt: '',
  updatedAt: '',
  status: 1,
})

const editedItem = ref<DynamicField>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Опции типов полей
const fieldTypeOptions = [
  { text: 'Текст', value: 'text' },
  { text: 'Текстовая область', value: 'textarea' },
  { text: 'Выбор', value: 'select' },
  { text: 'Чекбокс', value: 'checkbox' },
  { text: 'Дата', value: 'date' },
  { text: 'Число', value: 'number' },
]

// Методы
const editItem = (item: DynamicField) => {
  editedIndex.value = dynamicFields.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: DynamicField) => {
  editedIndex.value = dynamicFields.value.indexOf(item)
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

  if (!editedItem.value.label.trim()) {
    showToast('Метка обязательна для заполнения', 'error')
    return
  }

  if (editedIndex.value > -1) {
    editedItem.value.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    Object.assign(dynamicFields.value[editedIndex.value], editedItem.value)
    showToast('Динамическое поле успешно сохранено')
  } else {
    // Добавление нового
    const newId = Math.max(...dynamicFields.value.map(t => t.id)) + 1
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    editedItem.value.id = newId
    editedItem.value.createdAt = now
    editedItem.value.updatedAt = now
    dynamicFields.value.push({ ...editedItem.value })
    showToast('Динамическое поле успешно добавлено')
  }
  close()
}

const deleteItemConfirm = () => {
  dynamicFields.value.splice(editedIndex.value, 1)
  showToast('Динамическое поле успешно удалено')
  closeDelete()
}

// Переключение статуса
const toggleStatus = (item: DynamicField, newValue: number) => {
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение статуса:', newValue)
  
  const index = dynamicFields.value.findIndex((t: DynamicField) => t.id === item.id)
  console.log('🔍 Найденный индекс:', index)
  
  if (index !== -1) {
    console.log('✅ Элемент найден, обновляем статус')
    dynamicFields.value[index].status = newValue
    dynamicFields.value[index].isActive = newValue === 1
    console.log('✅ Обновленный элемент:', dynamicFields.value[index])
    showToast('Статус динамического поля изменен')
  } else {
    console.error('❌ Элемент не найден в массиве dynamicFields')
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

// Добавление нового динамического поля
const addNewDynamicField = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="Динамические поля">
      <VCardText>
        <p class="text-body-1">
          Создание динамических полей и управление ими.
        </p>
        <p class="text-body-2 text-medium-emphasis">
          Create and manage dynamic fields.
        </p>
      </VCardText>

      <div class="d-flex flex-wrap gap-4 pa-6">
        <div class="d-flex align-center">
          <!-- Поиск -->
          <AppTextField
            placeholder="Поиск динамических полей"
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
            @click="addNewDynamicField"
          >
            Добавить поле
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
                  v-model="fieldTypeFilter"
                  placeholder="Тип поля"
                  :items="[
                    { title: 'Текст', value: 'text' },
                    { title: 'Текстовая область', value: 'textarea' },
                    { title: 'Выбор', value: 'select' },
                    { title: 'Чекбокс', value: 'checkbox' },
                    { title: 'Дата', value: 'date' },
                    { title: 'Число', value: 'number' },
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
            Вы уверены, что хотите удалить выбранные динамические поля? Это действие нельзя отменить.
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
        :items="filteredDynamicFields"
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
        <!-- Метка -->
        <template #item.label="{ item }">
          <div style=" overflow: hidden;max-inline-size: 200px; text-overflow: ellipsis; white-space: pre-line;">
            {{ item.label }}
          </div>
        </template>

        <!-- Тип поля -->
        <template #item.fieldType="{ item }">
          <VChip
            :color="item.fieldType === 'text' ? 'primary' : item.fieldType === 'select' ? 'success' : item.fieldType === 'checkbox' ? 'warning' : 'info'"
            size="small"
            label
          >
            {{ item.fieldType }}
          </VChip>
        </template>

        <!-- Значение по умолчанию -->
        <template #item.defaultValue="{ item }">
          <div style=" overflow: hidden;max-inline-size: 200px; text-overflow: ellipsis; white-space: pre-line;">
            {{ item.defaultValue }}
          </div>
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
          :length="Math.ceil(filteredDynamicFields.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать поле' : 'Добавить поле'">
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

            <!-- Метка -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.label"
                label="Метка *"
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

            <!-- Значение по умолчанию -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.defaultValue"
                label="Значение по умолчанию"
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
      <VCard title="Вы уверены, что хотите удалить это динамическое поле?">
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
