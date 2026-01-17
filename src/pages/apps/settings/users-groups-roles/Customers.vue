<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// Типы данных для компании
interface Customer {
  id: number
  name: string
  street: string
  zip: string
  city: string
  comment: string
  createdAt: string
  updatedAt: string
  status: number // 1 - активен, 2 - не активен
  isActive: boolean
}

// Данные компаний (демо данные)
const customers = ref<Customer[]>([
  {
    id: 1,
    name: 'Компания А',
    street: 'ул. Ленина, 15',
    zip: '123456',
    city: 'Москва',
    comment: 'Крупная корпоративная компания',
    createdAt: '2023-01-01 10:00:00',
    updatedAt: '2023-01-01 10:00:00',
    status: 1,
    isActive: true,
  },
  {
    id: 2,
    name: 'Компания Б',
    street: 'пр. Победы, 23',
    zip: '654321',
    city: 'Санкт-Петербург',
    comment: 'Средняя бизнес компания',
    createdAt: '2023-01-02 11:00:00',
    updatedAt: '2023-01-02 11:00:00',
    status: 1,
    isActive: true,
  },
  {
    id: 3,
    name: 'Компания В',
    street: 'ул. Советская, 8',
    zip: '112233',
    city: 'Екатеринбург',
    comment: 'Стартап компания',
    createdAt: '2023-01-03 12:00:00',
    updatedAt: '2023-01-03 12:00:00',
    status: 1,
    isActive: true,
  },
  {
    id: 4,
    name: 'Компания Г',
    street: 'пер. Зеленый, 45',
    zip: '332211',
    city: 'Новосибирск',
    comment: 'Индивидуальный предприниматель',
    createdAt: '2023-01-04 13:00:00',
    updatedAt: '2023-01-04 13:00:00',
    status: 1,
    isActive: true,
  },
  {
    id: 5,
    name: 'Компания Д',
    street: 'ш. Энтузиастов, 12',
    zip: '445566',
    city: 'Казань',
    comment: 'Государственная организация',
    createdAt: '2023-01-05 14:00:00',
    updatedAt: '2023-01-05 14:00:00',
    status: 2,
    isActive: false,
  },
  {
    id: 6,
    name: 'Компания Е',
    street: 'наб. Речная, 7',
    zip: '778899',
    city: 'Сочи',
    comment: 'Международная корпорация',
    createdAt: '2023-01-06 15:00:00',
    updatedAt: '2023-01-06 15:00:00',
    status: 1,
    isActive: true,
  },
])

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Комментарий', key: 'comment', sortable: false },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Статус', key: 'status', sortable: false },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Фильтрация
const filteredCustomers = computed(() => {
  let filtered = customers.value

  if (statusFilter.value !== null) {
    filtered = filtered.filter(c => c.status === statusFilter.value)
  }

  if (commentFilter.value !== null) {
    filtered = filtered.filter(c => c.comment === commentFilter.value)
  }

  return filtered
})

// Сброс фильтров
const clearFilters = () => {
  statusFilter.value = null
  commentFilter.value = null
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
    const index = customers.value.findIndex(c => c.id === item.id)
    if (index !== -1) {
      customers.value.splice(index, 1)
    }
  })
  selectedItems.value = []
  showToast(`Удалено ${count} компаний`)
  isBulkDeleteDialogOpen.value = false
}

const confirmBulkStatusChange = () => {
  const count = selectedItems.value.length
  selectedItems.value.forEach(item => {
    const index = customers.value.findIndex(c => c.id === item.id)
    if (index !== -1) {
      customers.value[index].status = bulkStatusValue.value
      customers.value[index].isActive = bulkStatusValue.value === 1
    }
  })
  selectedItems.value = []
  showToast(`Статус изменен для ${count} компаний`)
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
const commentFilter = ref<string | null>(null)
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

// Диалоги и формы
const relationsDialog = ref(false)
const isDeleteDialogOpen = ref(false)

const defaultItem = ref<Customer>({
  id: -1,
  name: '',
  street: '',
  zip: '',
  city: '',
  comment: '',
  createdAt: '',
  updatedAt: '',
  status: 1,
  isActive: true,
})

const editedItem = ref<Customer>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Методы
const editItem = (item: Customer) => {
  editedIndex.value = customers.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: Customer) => {
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

const save = () => {
  if (!editedItem.value.name.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  if (editedIndex.value > -1) {
    editedItem.value.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    Object.assign(customers.value[editedIndex.value], editedItem.value)
    showToast('Компания успешно сохранена')
  } else {
    // Добавление нового
    const newId = Math.max(...customers.value.map(c => c.id)) + 1
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    editedItem.value.id = newId
    editedItem.value.createdAt = now
    editedItem.value.updatedAt = now
    customers.value.push({ ...editedItem.value })
    showToast('Компания успешно добавлена')
  }
  close()
}

const deleteItemConfirm = () => {
  customers.value.splice(editedIndex.value, 1)
  showToast('Компания успешно удалена')
  closeDelete()
}

// Переключение статуса
const toggleStatus = (item: Customer, newValue: number) => {
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение статуса:', newValue)
  
  const index = customers.value.findIndex((c: Customer) => c.id === item.id)
  console.log('🔍 Найденный индекс:', index)
  
  if (index !== -1) {
    console.log('✅ Элемент найден, обновляем статус')
    customers.value[index].status = newValue
    customers.value[index].isActive = newValue === 1
    console.log('✅ Обновленный элемент:', customers.value[index])
    showToast('Статус компании изменен')
  } else {
    console.error('❌ Элемент не найден в массиве customers')
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


// Удаление клиента
const deleteCustomer = (item: Customer) => {
  editedItem.value = { ...item }
  editedIndex.value = customers.value.indexOf(item)
  isDeleteDialogOpen.value = true
}

// Подтверждение удаления
const confirmDelete = () => {
  customers.value.splice(editedIndex.value, 1)
  showToast('Компания успешно удалена')
  isDeleteDialogOpen.value = false
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
}

// Функции для создания и редактирования
const addNewCustomer = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}

const editCustomer = (item: Customer) => {
  editedIndex.value = customers.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

// Диалог редактирования
const editDialog = ref(false)
</script>

<template>
  <div>
    <!-- Основная таблица -->
    <VCard
      title="Компании"
    >
      <div class="d-flex flex-wrap gap-4 pa-6">
        <div class="d-flex align-center">
          <!-- Поиск -->
          <AppTextField
            placeholder="Поиск компаний"
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

        <!-- Кнопка связей -->
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="bx-link"
          @click="relationsDialog = true"
        >
          Связи
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
            @click="addNewCustomer"
          >
            Добавить компанию
          </VBtn>
        </div>
      </div>

      <VDivider />

      <!-- Таблица -->
      <VDataTable
        v-model="selectedItems"
        v-model:items-per-page="itemsPerPage"
        v-model:page="currentPage"
        :headers="headers"
        :items="filteredCustomers"
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
        <!-- Комментарий -->
        <template #item.comment="{ item }">
          <div class="text-truncate" style="max-inline-size: 200px;">
            {{ item.comment }}
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
            <IconBtn @click="editCustomer(item)">
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn @click="deleteCustomer(item)">
              <VIcon icon="bx-trash" />
            </IconBtn>
          </div>
        </template>
      </VDataTable>

      <!-- Пагинация -->
      <div class="d-flex justify-center mt-4 pb-4">
        <VPagination
          v-model="currentPage"
          :length="Math.ceil(filteredCustomers.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

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
                v-model="commentFilter"
                placeholder="Комментарий"
                :items="[
                  { title: 'Крупная корпоративная компания', value: 'Крупная корпоративная компания' },
                  { title: 'Средняя бизнес компания', value: 'Средняя бизнес компания' },
                  { title: 'Стартап компания', value: 'Стартап компания' },
                  { title: 'Индивидуальный предприниматель', value: 'Индивидуальный предприниматель' },
                  { title: 'Государственная организация', value: 'Государственная организация' },
                  { title: 'Международная корпорация', value: 'Международная корпорация' },
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

    <!-- Диалог связей -->
    <VDialog
      v-model="relationsDialog"
      max-width="600px"
    >
      <VCard title="Связи компаний">
        <VCardText>
          <p class="text-body-1 mb-4">
            Клиенты связаны с пользователями клиентов и сервисами. Перейдите в соответствующие разделы для управления связями.
          </p>
          <VRow>
            <VCol cols="12" sm="6">
              <VCard
                variant="outlined"
                class="pa-4 text-center"
                hover
                @click="$router.push({ name: 'settings', query: { tab: 'customer-users' } })"
              >
                <VIcon icon="bx-user" size="48" class="mb-2" />
                <div class="text-h6">Пользователи клиентов</div>
                <div class="text-body-2 text-medium-emphasis">
                  Управление пользователями клиентов
                </div>
              </VCard>
            </VCol>
            <VCol cols="12" sm="6">
              <VCard
                variant="outlined"
                class="pa-4 text-center"
                hover
                @click="$router.push({ name: 'settings', query: { tab: 'customer-users-services' } })"
              >
                <VIcon icon="bx-link" size="48" class="mb-2" />
                <div class="text-h6">Связи клиентов и сервисов</div>
                <div class="text-body-2 text-medium-emphasis">
                  Связи между компаниями и сервисами
                </div>
              </VCard>
            </VCol>
          </VRow>
        </VCardText>
        <VCardText>
          <div class="d-flex justify-end">
            <VBtn
              color="primary"
              variant="outlined"
              @click="relationsDialog = false"
            >
              Закрыть
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог удаления -->
    <VDialog
      v-model="isDeleteDialogOpen"
      max-width="500px"
    >
      <VCard title="Вы уверены, что хотите удалить эту компанию?">
        <VCardText>
          <div class="d-flex justify-center gap-4">
            <VBtn
              color="error"
              variant="outlined"
              @click="isDeleteDialogOpen = false"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="confirmDelete"
            >
              Удалить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог редактирования/создания -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex === -1 ? 'Добавить компанию' : 'Редактировать компанию'">
        <VCardText>
          <VRow>
            <VCol cols="12">
              <AppTextField
                v-model="editedItem.name"
                label="Название *"
                placeholder="Введите название компании"
                required
              />
            </VCol>
            <VCol cols="12">
              <AppTextField
                v-model="editedItem.street"
                label="Адрес"
                placeholder="Введите адрес"
              />
            </VCol>
            <VCol cols="6">
              <AppTextField
                v-model="editedItem.zip"
                label="Индекс"
                placeholder="Введите индекс"
              />
            </VCol>
            <VCol cols="6">
              <AppTextField
                v-model="editedItem.city"
                label="Город"
                placeholder="Введите город"
              />
            </VCol>
            <VCol cols="12">
              <VTextarea
                v-model="editedItem.comment"
                label="Комментарий"
                placeholder="Введите комментарий"
                rows="3"
              />
            </VCol>
            <VCol cols="12">
              <div class="d-flex align-center">
                <VSwitch
                  v-model="editedItem.isActive"
                  label="Активен"
                  color="primary"
                  @update:model-value="(val) => {
                    editedItem.status = val ? 1 : 2
                  }"
                />
              </div>
            </VCol>
          </VRow>
        </VCardText>
        <VCardText>
          <div class="d-flex justify-end gap-4">
            <VBtn
              variant="text"
              @click="close"
            >
              Отмена
            </VBtn>
            <VBtn
              color="primary"
              variant="elevated"
              @click="save"
            >
              {{ editedIndex === -1 ? 'Добавить' : 'Сохранить' }}
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
.color-circle {
  border: 1px solid #ccc;
  border-radius: 50%;
  block-size: 20px;
  inline-size: 20px;
}

.v-card {
  margin-block-end: 1rem;
}
</style>
