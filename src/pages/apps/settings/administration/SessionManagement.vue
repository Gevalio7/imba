<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// Типы данных для управления сеансами
interface Session {
  id: number
  username: string
  ipAddress: string
  userAgent: string
  loginTime: string
  lastActivity: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  status: number // 1 - активен, 2 - не активен
}

// Данные сеансов (демо данные)
const sessions = ref<Session[]>([
  {
    id: 1,
    username: 'admin',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    loginTime: '2023-01-15 09:00:00',
    lastActivity: '2023-01-15 10:30:00',
    isActive: true,
    createdAt: '2023-01-01 10:00:00',
    updatedAt: '2023-01-01 10:00:00',
    status: 1,
  },
  {
    id: 2,
    username: 'support_agent',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    loginTime: '2023-01-15 08:30:00',
    lastActivity: '2023-01-15 10:15:00',
    isActive: true,
    createdAt: '2023-01-02 11:00:00',
    updatedAt: '2023-01-02 11:00:00',
    status: 1,
  },
  {
    id: 3,
    username: 'customer_user',
    ipAddress: '10.0.0.50',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    loginTime: '2023-01-15 07:45:00',
    lastActivity: '2023-01-15 09:45:00',
    isActive: true,
    createdAt: '2023-01-03 12:00:00',
    updatedAt: '2023-01-03 12:00:00',
    status: 1,
  },
  {
    id: 4,
    username: 'manager',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/96.0.4664.110',
    loginTime: '2023-01-15 08:00:00',
    lastActivity: '2023-01-15 10:00:00',
    isActive: true,
    createdAt: '2023-01-04 13:00:00',
    updatedAt: '2023-01-04 13:00:00',
    status: 1,
  },
  {
    id: 5,
    username: 'old_user',
    ipAddress: '192.168.1.200',
    userAgent: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36',
    loginTime: '2023-01-10 10:00:00',
    lastActivity: '2023-01-10 10:30:00',
    isActive: false,
    createdAt: '2023-01-05 14:00:00',
    updatedAt: '2023-01-05 14:00:00',
    status: 2,
  },
  {
    id: 6,
    username: 'test_user',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36',
    loginTime: '2023-01-15 10:00:00',
    lastActivity: '2023-01-15 10:20:00',
    isActive: true,
    createdAt: '2023-01-06 15:00:00',
    updatedAt: '2023-01-06 15:00:00',
    status: 1,
  },
])

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Пользователь', key: 'username', sortable: true },
  { title: 'IP адрес', key: 'ipAddress', sortable: true },
  { title: 'User Agent', key: 'userAgent', sortable: false },
  { title: 'Время входа', key: 'loginTime', sortable: true },
  { title: 'Последняя активность', key: 'lastActivity', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Статус', key: 'status', sortable: false },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Фильтрация
const filteredSessions = computed(() => {
  let filtered = sessions.value

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
    const index = sessions.value.findIndex(t => t.id === item.id)
    if (index !== -1) {
      sessions.value.splice(index, 1)
    }
  })
  selectedItems.value = []
  showToast(`Удалено ${count} сеансов`)
  isBulkDeleteDialogOpen.value = false
}

const confirmBulkStatusChange = () => {
  const count = selectedItems.value.length
  selectedItems.value.forEach(item => {
    const index = sessions.value.findIndex(t => t.id === item.id)
    if (index !== -1) {
      sessions.value[index].status = bulkStatusValue.value
      sessions.value[index].isActive = bulkStatusValue.value === 1
    }
  })
  selectedItems.value = []
  showToast(`Статус изменен для ${count} сеансов`)
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

const defaultItem = ref<Session>({
  id: -1,
  username: '',
  ipAddress: '',
  userAgent: '',
  loginTime: '',
  lastActivity: '',
  isActive: true,
  createdAt: '',
  updatedAt: '',
  status: 1,
})

const editedItem = ref<Session>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Методы
const editItem = (item: Session) => {
  editedIndex.value = sessions.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: Session) => {
  editedIndex.value = sessions.value.indexOf(item)
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
  if (!editedItem.value.username.trim()) {
    showToast('Имя пользователя обязательно для заполнения', 'error')
    return
  }

  if (!editedItem.value.ipAddress.trim()) {
    showToast('IP адрес обязателен для заполнения', 'error')
    return
  }

  if (editedIndex.value > -1) {
    editedItem.value.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    Object.assign(sessions.value[editedIndex.value], editedItem.value)
    showToast('Сеанс успешно сохранен')
  } else {
    // Добавление нового
    const newId = Math.max(...sessions.value.map(t => t.id)) + 1
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    editedItem.value.id = newId
    editedItem.value.createdAt = now
    editedItem.value.updatedAt = now
    sessions.value.push({ ...editedItem.value })
    showToast('Сеанс успешно добавлен')
  }
  close()
}

const deleteItemConfirm = () => {
  sessions.value.splice(editedIndex.value, 1)
  showToast('Сеанс успешно удален')
  closeDelete()
}

// Переключение статуса
const toggleStatus = (item: Session, newValue: number) => {
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение статуса:', newValue)
  
  const index = sessions.value.findIndex((t: Session) => t.id === item.id)
  console.log('🔍 Найденный индекс:', index)
  
  if (index !== -1) {
    console.log('✅ Элемент найден, обновляем статус')
    sessions.value[index].status = newValue
    sessions.value[index].isActive = newValue === 1
    console.log('✅ Обновленный элемент:', sessions.value[index])
    showToast('Статус сеанса изменен')
  } else {
    console.error('❌ Элемент не найден в массиве sessions')
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

// Добавление нового сеанса
const addNewSession = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="Управление сеансами">
      <VCardText>
        <p class="text-body-1">
          Управление активными сеансами.
        </p>
      </VCardText>

      <div class="d-flex flex-wrap gap-4 pa-6">
        <div class="d-flex align-center">
          <!-- Поиск -->
          <AppTextField
            placeholder="Поиск сеансов"
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
            @click="addNewSession"
          >
            Добавить сеанс
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
            Вы уверены, что хотите удалить выбранные сеансы? Это действие нельзя отменить.
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
        :items="filteredSessions"
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
        <!-- Пользователь -->
        <template #item.username="{ item }">
          <div style=" overflow: hidden;max-inline-size: 150px; text-overflow: ellipsis; white-space: pre-line;">
            {{ item.username }}
          </div>
        </template>

        <!-- IP адрес -->
        <template #item.ipAddress="{ item }">
          <div style=" overflow: hidden;max-inline-size: 150px; text-overflow: ellipsis; white-space: pre-line;">
            {{ item.ipAddress }}
          </div>
        </template>

        <!-- User Agent -->
        <template #item.userAgent="{ item }">
          <div style=" overflow: hidden;max-inline-size: 250px; text-overflow: ellipsis; white-space: pre-line;">
            {{ item.userAgent }}
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
              console.log('🔘 VSwitch изменен для элемента:', item.username)
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
          :length="Math.ceil(filteredSessions.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать сеанс' : 'Добавить сеанс'">
        <VCardText>
          <VRow>
            <!-- Пользователь -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.username"
                label="Пользователь *"
              />
            </VCol>

            <!-- IP адрес -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.ipAddress"
                label="IP адрес *"
              />
            </VCol>

            <!-- User Agent -->
            <VCol cols="12">
              <AppTextarea
                v-model="editedItem.userAgent"
                label="User Agent"
                rows="3"
                placeholder="Введите User Agent..."
              />
            </VCol>

            <!-- Время входа -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.loginTime"
                label="Время входа *"
                type="datetime-local"
              />
            </VCol>

            <!-- Последняя активность -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.lastActivity"
                label="Последняя активность *"
                type="datetime-local"
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
      <VCard title="Вы уверены, что хотите удалить этот сеанс?">
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
