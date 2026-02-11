<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, ref, watch } from 'vue'

// Типы данных для PostMasterMailAccount
interface PostMasterMailAccount {
  id: number
  type: 'IMAP' | 'IMAPS' | 'IMAPTLS' | 'MSGraph' | 'POP3' | 'POP3S' | 'POP3TLS'
  authenticationType: 'oauth2_token' | 'password'
  login: string
  password?: string
  host: string
  imapFolder?: string
  trusted: boolean
  dispatchingBy: 'Queue' | 'From'
  queueId?: number
  comment?: string
  oauth2TokenConfigID?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Типы данных для Очереди
interface Queue {
  id: number
  name: string
  description: string
  maxTickets: number
  priority: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}


// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Данные PostMasterMailAccount
const postMasterMailAccounts = ref<PostMasterMailAccount[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Данные очередей
const queues = ref<Queue[]>([])
const queuesLoading = ref(false)
const queuesError = ref<string | null>(null)

// Типы протоколов
const typeOptions = [
  { title: 'IMAP', value: 'IMAP' },
  { title: 'IMAPS', value: 'IMAPS' },
  { title: 'IMAPTLS', value: 'IMAPTLS' },
  { title: 'MSGraph', value: 'MSGraph' },
  { title: 'POP3', value: 'POP3' },
  { title: 'POP3S', value: 'POP3S' },
  { title: 'POP3TLS', value: 'POP3TLS' },
]

// Типы аутентификации
const authenticationTypeOptions = [
  { title: 'OAuth2 Token', value: 'oauth2_token' },
  { title: 'Password', value: 'password' },
]

// Методы маршрутизации
const dispatchingByOptions = [
  { title: 'Queue', value: 'Queue' },
  { title: 'From', value: 'From' },
]

// Загрузка данных из API
const fetchPostMasterMailAccounts = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('Fetching postMasterMailAccounts from:', `${API_BASE}/postMasterMailAccounts`)
    const data = await $fetch<{ postMasterMailAccounts: PostMasterMailAccount[], total: number }>(`${API_BASE}/postMasterMailAccounts`)
    console.log('Fetched postMasterMailAccounts data:', data)
    postMasterMailAccounts.value = data.postMasterMailAccounts
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки почтовых аккаунтов'
    console.error('Error fetching postMasterMailAccounts:', err)
  } finally {
    loading.value = false
  }
}

// Загрузка данных очередей
const fetchQueues = async () => {
  try {
    queuesLoading.value = true
    queuesError.value = null
    console.log('Fetching queues from:', `${API_BASE}/queues`)
    const data = await $fetch<{ queues: Queue[], total: number }>(`${API_BASE}/queues`)
    console.log('Fetched queues data:', data)
    queues.value = data.queues
  } catch (err) {
    queuesError.value = 'Ошибка загрузки очередей'
    console.error('Error fetching queues:', err)
  } finally {
    queuesLoading.value = false
  }
}

// Создание PostMasterMailAccount
const createPostMasterMailAccount = async (item: Omit<PostMasterMailAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<PostMasterMailAccount>(`${API_BASE}/postMasterMailAccounts`, {
      method: 'POST',
      body: item
    })
    postMasterMailAccounts.value.push(data)
    return data
  } catch (err) {
    console.error('Error creating postMasterMailAccount:', err)
    throw err
  }
}

// Обновление PostMasterMailAccount
const updatePostMasterMailAccount = async (id: number, item: Omit<PostMasterMailAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<PostMasterMailAccount>(`${API_BASE}/postMasterMailAccounts/${id}`, {
      method: 'PUT',
      body: item
    })
    const index = postMasterMailAccounts.value.findIndex(p => p.id === id)
    if (index !== -1) {
      postMasterMailAccounts.value[index] = data
    }
    return data
  } catch (err) {
    console.error('Error updating postMasterMailAccount:', err)
    throw err
  }
}

// Удаление PostMasterMailAccount
const deletePostMasterMailAccount = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/postMasterMailAccounts/${id}`, {
      method: 'DELETE'
    })
    const index = postMasterMailAccounts.value.findIndex(p => p.id === id)
    if (index !== -1) {
      postMasterMailAccounts.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Error deleting postMasterMailAccount:', err)
    throw err
  }
}

// Инициализация
onMounted(() => {
  fetchPostMasterMailAccounts()
  fetchQueues()
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Тип', key: 'type', sortable: true },
  { title: 'Хост', key: 'host', sortable: true },
  { title: 'Логин', key: 'login', sortable: true },
  { title: 'Аутентификация', key: 'authenticationType', sortable: true },
  { title: 'Маршрутизация', key: 'dispatchingBy', sortable: true },
  { title: 'Очередь', key: 'queueId', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Фильтрация
const filteredPostMasterMailAccounts = computed(() => {
  let filtered = postMasterMailAccounts.value

  if (statusFilter.value !== null) {
    filtered = filtered.filter(p => p.isActive === (statusFilter.value === 1))
  }

  return filtered
})

// Получение имени очереди по ID
const getQueueName = (queueId: number | undefined) => {
  if (!queueId) return '-'
  const queue = queues.value.find(q => q.id === queueId)
  return queue ? queue.name : '-'
}

// Получение отображаемого имени типа аутентификации
const getAuthTypeName = (authType: string) => {
  const option = authenticationTypeOptions.find(o => o.value === authType)
  return option ? option.title : authType
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
      await deletePostMasterMailAccount(item.id)
    }
    selectedItems.value = []
    showToast(`Удалено ${count} почтовых аккаунтов`)
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmBulkStatusChange = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await updatePostMasterMailAccount(item.id, {
        ...item,
        isActive: bulkStatusValue.value === 1
      })
    }
    selectedItems.value = []
    showToast(`Статус изменен для ${count} почтовых аккаунтов`)
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
const editDialog = ref(false)
const deleteDialog = ref(false)

const defaultItem = ref<PostMasterMailAccount>({
  id: -1,
  type: 'IMAP',
  authenticationType: 'password',
  login: '',
  password: '',
  host: '',
  imapFolder: '',
  trusted: false,
  dispatchingBy: 'Queue',
  queueId: undefined,
  comment: '',
  oauth2TokenConfigID: undefined,
  createdAt: '',
  updatedAt: '',
  isActive: true,
})

const editedItem = ref<PostMasterMailAccount>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Методы
const editItem = (item: PostMasterMailAccount) => {
  editedIndex.value = postMasterMailAccounts.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: PostMasterMailAccount) => {
  editedIndex.value = postMasterMailAccounts.value.indexOf(item)
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
  // Валидация
  if (!editedItem.value.type?.trim()) {
    showToast('Тип протокола обязателен для заполнения', 'error')
    return
  }
  if (!editedItem.value.authenticationType?.trim()) {
    showToast('Тип аутентификации обязателен для заполнения', 'error')
    return
  }
  if (!editedItem.value.login?.trim()) {
    showToast('Логин обязателен для заполнения', 'error')
    return
  }
  if (!editedItem.value.host?.trim()) {
    showToast('Хост обязателен для заполнения', 'error')
    return
  }
  if (editedItem.value.authenticationType === 'password' && !editedItem.value.password?.trim()) {
    showToast('Пароль обязателен при выборе аутентификации по паролю', 'error')
    return
  }

  try {
    if (editedIndex.value > -1) {
      // Обновление существующего
      const updated = await updatePostMasterMailAccount(editedItem.value.id, {
        ...editedItem.value,
        isActive: editedItem.value.isActive
      })
      showToast('Почтовый аккаунт успешно сохранен')
    } else {
      // Добавление нового
      const created = await createPostMasterMailAccount({
        ...editedItem.value,
        isActive: editedItem.value.isActive
      })
      showToast('Почтовый аккаунт успешно добавлен')
    }
    close()
  } catch (err) {
    showToast('Ошибка сохранения почтового аккаунта', 'error')
  }
}

const deleteItemConfirm = async () => {
  try {
    await deletePostMasterMailAccount(editedItem.value.id)
    showToast('Почтовый аккаунт успешно удален')
    closeDelete()
  } catch (err) {
    showToast('Ошибка удаления почтового аккаунта', 'error')
  }
}

// Переключение статуса
const toggleStatus = async (item: PostMasterMailAccount, newValue: boolean) => {
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение isActive:', newValue)

  try {
    await updatePostMasterMailAccount(item.id, {
      ...item,
      isActive: newValue
    })
    showToast('Статус почтового аккаунта изменен')
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

// Добавление нового PostMasterMailAccount
const addNewPostMasterMailAccount = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="Почтовые аккаунты PostMaster">

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
            placeholder="Поиск почтового аккаунта"
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
            @click="addNewPostMasterMailAccount"
          >
            Добавить почтовый аккаунт
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
            Вы уверены, что хотите удалить выбранные почтовые аккаунты? Это действие нельзя отменить.
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
        :items="filteredPostMasterMailAccounts"
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

        <!-- Тип -->
        <template #item.type="{ item }">
          <VChip color="info" density="compact" label size="small">
            {{ item.type }}
          </VChip>
        </template>

        <!-- Аутентификация -->
        <template #item.authenticationType="{ item }">
          {{ getAuthTypeName(item.authenticationType) }}
        </template>

        <!-- Очередь -->
        <template #item.queueId="{ item }">
          {{ getQueueName(item.queueId) }}
        </template>

        <!-- Доверенный -->
        <template #item.trusted="{ item }">
          <VCheckbox
            :model-value="item.trusted"
            disabled
            hide-details
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
          :length="Math.ceil(filteredPostMasterMailAccounts.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="700px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать почтовый аккаунт' : 'Добавить почтовый аккаунт'">
        <VCardText>
          <VRow>

            <!-- Тип протокола -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.type"
                label="Тип протокола *"
                :items="typeOptions"
                item-title="title"
                item-value="value"
              />
            </VCol>

            <!-- Тип аутентификации -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.authenticationType"
                label="Тип аутентификации *"
                :items="authenticationTypeOptions"
                item-title="title"
                item-value="value"
              />
            </VCol>

            <!-- Хост -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.host"
                label="Хост *"
                placeholder="mail.example.com"
              />
            </VCol>

            <!-- Логин -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.login"
                label="Логин *"
                placeholder="user@example.com"
              />
            </VCol>

            <!-- Пароль -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.password"
                label="Пароль *"
                type="password"
                placeholder="Введите пароль"
              />
            </VCol>

            <!-- IMAP папка -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.imapFolder"
                label="IMAP папка"
                placeholder="INBOX"
              />
            </VCol>

            <!-- Доверенный -->
            <VCol
              cols="12"
              sm="6"
            >
              <VSwitch
                v-model="editedItem.trusted"
                label="Доверенный аккаунт"
                color="primary"
              />
            </VCol>

            <!-- Маршрутизация -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.dispatchingBy"
                label="Маршрутизация"
                :items="dispatchingByOptions"
                item-title="title"
                item-value="value"
              />
            </VCol>

            <!-- Очередь -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.queueId"
                label="Очередь"
                :items="queues.map(q => ({ title: q.name, value: q.id }))"
                item-title="title"
                item-value="value"
                clearable
                clear-icon="bx-x"
                placeholder="Выберите очередь"
              />
            </VCol>

            <!-- OAuth2 Token Config ID -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.oauth2TokenConfigID"
                label="OAuth2 Token Config ID"
                type="number"
                placeholder="ID конфигурации OAuth2"
              />
            </VCol>

            <!-- Комментарий -->
            <VCol
              cols="12"
            >
              <AppTextarea
                v-model="editedItem.comment"
                label="Комментарий"
                rows="2"
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
      <VCard title="Вы уверены, что хотите удалить этот почтовый аккаунт?">
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
