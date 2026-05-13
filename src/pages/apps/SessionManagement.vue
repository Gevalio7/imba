<script setup lang="ts">
import { $api } from '@/utils/api'
import { computed, onMounted, ref, watch } from 'vue'

// Типы данных для Управление сессией
interface SessionManagement {
  id: number
  username: string
  ipAddress: string
  userAgent: string
  loginTime: string
  lastActivity: string
  type: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}


// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Данные управление сессиями
const sessionManagement = ref<SessionManagement[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Загрузка данных из API
const fetchSessionManagement = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('Fetching sessionManagement from:', `${API_BASE}/sessionManagement`)
    const data = await $api<{ sessionManagement: SessionManagement[], total: number }>(`${API_BASE}/sessionManagement`)
    console.log('Fetched sessionManagement data:', data)
    sessionManagement.value = data.sessionManagement
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки управление сессиями'
    console.error('Error fetching sessionManagement:', err)
  } finally {
    loading.value = false
  }
}

// Создание управление сессией
const createSessionManagement = async (item: Omit<SessionManagement, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $api<SessionManagement>(`${API_BASE}/sessionManagement`, {
      method: 'POST',
      body: item
    })
    sessionManagement.value.push(data)
    return data
  } catch (err) {
    console.error('Error creating sessionManagement:', err)
    throw err
  }
}

// Обновление управление сессией
const updateSessionManagement = async (id: number, item: Omit<SessionManagement, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $api<SessionManagement>(`${API_BASE}/sessionManagement/${id}`, {
      method: 'PUT',
      body: item
    })
    const index = sessionManagement.value.findIndex(p => p.id === id)
    if (index !== -1) {
      sessionManagement.value[index] = data
    }
    return data
  } catch (err) {
    console.error('Error updating sessionManagement:', err)
    throw err
  }
}

// Удаление управление сессией
const deleteSessionManagement = async (id: number) => {
  try {
    await $api(`${API_BASE}/sessionManagement/${id}`, {
      method: 'DELETE'
    })
    const index = sessionManagement.value.findIndex(p => p.id === id)
    if (index !== -1) {
      sessionManagement.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Error deleting sessionManagement:', err)
    throw err
  }
}

// Завершение сессии
const terminateSession = async (id: number) => {
  try {
    const data = await $api<SessionManagement>(`${API_BASE}/sessionManagement/${id}/terminate`, {
      method: 'PUT'
    })
    const index = sessionManagement.value.findIndex(p => p.id === id)
    if (index !== -1) {
      sessionManagement.value[index] = data
    }
    showToast('Сессия завершена')

    // Если завершена своя сессия, выйти из системы
    const userData = JSON.parse(localStorage.getItem('userData') || '{}')
    if (data.username === userData.login) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('userData')
      window.location.href = '/login'
    }
  } catch (err) {
    console.error('Error terminating session:', err)
    showToast('Ошибка завершения сессии', 'error')
  }
}

// Завершение всех активных сессий
const terminateAllSessions = async () => {
  try {
    await $api(`${API_BASE}/sessionManagement/terminate-all`, {
      method: 'POST'
    })
    showToast('Сессии завершены')
    fetchSessionManagement()
  } catch (err) {
    console.error('Error terminating all sessions:', err)
    showToast('Ошибка завершения всех сессий', 'error')
  }
}

// Инициализация
onMounted(() => {
  fetchSessionManagement()
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Имя пользователя', key: 'username', sortable: true },
  { title: 'IP адрес', key: 'ipAddress', sortable: true },
  { title: 'User Agent', key: 'userAgent', sortable: true },
  { title: 'Время входа', key: 'loginTime', sortable: true },
  { title: 'Последняя активность', key: 'lastActivity', sortable: true },
  { title: 'Тип', key: 'type', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Фильтрация
const filteredSessionManagement = computed(() => {
  let filtered = sessionManagement.value

  if (statusFilter.value !== null) {
    // Фильтруем по isActive: 1 = true (активен), 2 = false (не активен)
    filtered = filtered.filter(p => p.isActive === (statusFilter.value === 1))
  }

  if (typeFilter.value !== null) {
    filtered = filtered.filter(p => p.type === typeFilter.value)
  }

  return filtered
})

// Сброс фильтров
const clearFilters = () => {
  statusFilter.value = null
}

// Массовые действия



const confirmBulkTerminateAll = async () => {
  try {
    await terminateAllSessions()
    isBulkTerminateAllDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка завершения сессий', 'error')
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
const typeFilter = ref<string | null>(null)
const isFilterDialogOpen = ref(false)

// Массовые действия
const selectedItems = ref<any[]>([])
const isBulkActionsMenuOpen = ref(false)
const isBulkTerminateAllDialogOpen = ref(false)









// Уведомления
const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}


</script>

<template>
  <div>
    <VCard title="Управление сессиями">

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
            placeholder="Поиск управление сессиями"
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
              v-bind="props"
            >
              Действия
            </VBtn>
          </template>
          <VList>
            <VListItem
              @click="() => {
                isBulkTerminateAllDialogOpen = true
                isBulkActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Завершить сессии</VListItemTitle>
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
                  v-model="typeFilter"
                  placeholder="Тип"
                  :items="[
                    { title: 'Пользователь', value: 'user' },
                    { title: 'Агент', value: 'agent' },
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





      <!-- Диалог завершения всех сессий -->
      <VDialog
        v-model="isBulkTerminateAllDialogOpen"
        max-width="500px"
      >
        <VCard title="Завершить сессии">
          <VCardText>
            Вы уверены, что хотите завершить все активные сессии? Это действие нельзя отменить.
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                color="error"
                variant="outlined"
                @click="isBulkTerminateAllDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="confirmBulkTerminateAll"
              >
                Завершить
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
        :items="filteredSessionManagement"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Тип -->
        <template #item.type="{ item }">
          {{ item.type === 'agent' ? 'Агент' : 'Сотрудник' }}
        </template>

        <!-- Активен -->
        <template #item.isActive="{ item }">
          <div class="d-flex align-center gap-2">
            <VIcon v-if="!item.isActive" icon="bx-door-closed" color="error" />
            <span v-if="!item.isActive" class="text-error">Завершено</span>
            <VChip
              v-else
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
            <IconBtn v-if="item.isActive" @click="terminateSession(item.id)" color="warning">
              <VIcon icon="bx-door-open" />
            </IconBtn>
          </div>
        </template>
      </VDataTable>

      <!-- Пагинация -->
      <div class="d-flex justify-center mt-4 pb-4">
        <VPagination
          v-model="currentPage"
          :length="Math.ceil(filteredSessionManagement.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>


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
