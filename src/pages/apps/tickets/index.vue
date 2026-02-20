<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, ref } from 'vue'

// Типы данных
interface Ticket {
  id: number
  ticketNumber: string
  title: string
  typeId: number | null
  typeName: string | null
  priorityId: number | null
  priorityName: string | null
  priorityColor: string | null
  queueId: number | null
  queueName: string | null
  stateId: number | null
  stateName: string | null
  stateColor: string | null
  ownerId: number | null
  ownerLogin: string | null
  ownerFirstname: string | null
  ownerLastname: string | null
  companyId: number | null
  companyName: string | null
  slaId: number | null
  slaName: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Роутер
const router = useRouter()

// Данные
const tickets = ref<Ticket[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Загрузка данных
const fetchTickets = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await $fetch<{ tickets: Ticket[], total: number }>(`${API_BASE}/tickets`)
    tickets.value = data.tickets
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки тикетов'
    console.error('Error fetching tickets:', err)
  } finally {
    loading.value = false
  }
}

// Удаление тикета
const deleteTicketById = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/tickets/${id}`, { method: 'DELETE' })
    const index = tickets.value.findIndex(t => t.id === id)
    if (index !== -1) tickets.value.splice(index, 1)
  } catch (err) {
    console.error('Error deleting ticket:', err)
    throw err
  }
}

// Инициализация
onMounted(() => {
  fetchTickets()
})

const headers = [
  { title: 'Номер', key: 'ticketNumber', sortable: true },
  { title: 'Заголовок', key: 'title', sortable: true },
  { title: 'Тип', key: 'typeName', sortable: false },
  { title: 'Приоритет', key: 'priorityName', sortable: false },
  { title: 'Очередь', key: 'queueName', sortable: false },
  { title: 'Статус', key: 'stateName', sortable: false },
  { title: 'Владелец', key: 'ownerLogin', sortable: false },
  { title: 'Компания', key: 'companyName', sortable: false },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Фильтрация
const statusFilter = ref<number | null>(null)
const searchQuery = ref('')

const filteredTickets = computed(() => {
  let filtered = tickets.value

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(t =>
      t.title?.toLowerCase().includes(q) ||
      t.ticketNumber?.toLowerCase().includes(q)
    )
  }

  if (statusFilter.value !== null) {
    filtered = filtered.filter(t => t.isActive === (statusFilter.value === 1))
  }

  return filtered
})

// Пагинация
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Фильтры
const isFilterDialogOpen = ref(false)

const clearFilters = () => {
  statusFilter.value = null
  searchQuery.value = ''
}

// Массовые действия
const selectedItems = ref<any[]>([])
const isBulkActionsMenuOpen = ref(false)
const isBulkDeleteDialogOpen = ref(false)

const bulkDelete = () => {
  isBulkDeleteDialogOpen.value = true
}

const confirmBulkDelete = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await deleteTicketById(item.id)
    }
    selectedItems.value = []
    showToast(`Удалено ${count} тикетов`)
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const resolveStatusVariant = (isActive: boolean) => {
  if (isActive)
    return { color: 'primary', text: 'Активен' }
  else
    return { color: 'error', text: 'Не активен' }
}

const resolvePriorityColor = (color?: string | null) => {
  return color || 'secondary'
}

const resolveStateColor = (color?: string | null) => {
  return color || 'secondary'
}

const getOwnerName = (ticket: Ticket) => {
  if (!ticket.ownerFirstname && !ticket.ownerLastname)
    return ticket.ownerLogin || '-'
  return `${ticket.ownerFirstname || ''} ${ticket.ownerLastname || ''}`.trim()
}

// Диалог удаления
const deleteDialog = ref(false)
const deletingItem = ref<Ticket | null>(null)

const deleteItem = (item: Ticket) => {
  deletingItem.value = item
  deleteDialog.value = true
}

const closeDelete = () => {
  deleteDialog.value = false
  deletingItem.value = null
}

const deleteItemConfirm = async () => {
  if (!deletingItem.value) return
  try {
    await deleteTicketById(deletingItem.value.id)
    showToast('Тикет успешно удалён')
    closeDelete()
  } catch (err) {
    showToast('Ошибка удаления тикета', 'error')
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

// Навигация
const createTicket = () => {
  router.push('/apps/tickets/add')
}

const editTicket = (id: number) => {
  router.push({ path: '/apps/tickets/edit', query: { id } })
}
</script>

<template>
  <div>
    <VCard title="Тикеты">

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
          <AppTextField
            v-model="searchQuery"
            placeholder="Поиск тикета"
            style="inline-size: 250px;"
            class="me-3"
          />
        </div>

        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="bx-filter"
          @click="isFilterDialogOpen = true"
        >
          Фильтр
        </VBtn>

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
          </VList>
        </VMenu>

        <VSpacer />
        <div class="d-flex gap-4 flex-wrap align-center">
          <AppSelect
            v-model="itemsPerPage"
            :items="[5, 10, 20, 25, 50]"
          />
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
            @click="createTicket"
          >
            Создать тикет
          </VBtn>
        </div>
      </div>

      <!-- Диалог фильтров -->
      <VDialog v-model="isFilterDialogOpen" max-width="500px">
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
              <VBtn variant="text" @click="clearFilters">Сбросить</VBtn>
              <VBtn color="error" variant="outlined" @click="isFilterDialogOpen = false">Отмена</VBtn>
              <VBtn color="success" variant="elevated" @click="isFilterDialogOpen = false">Применить</VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог массового удаления -->
      <VDialog v-model="isBulkDeleteDialogOpen" max-width="500px">
        <VCard title="Подтверждение удаления">
          <VCardText>
            Вы уверены, что хотите удалить выбранные тикеты? Это действие нельзя отменить.
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn color="error" variant="outlined" @click="isBulkDeleteDialogOpen = false">Отмена</VBtn>
              <VBtn color="success" variant="elevated" @click="confirmBulkDelete">Удалить</VBtn>
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
        :items="filteredTickets"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Номер тикета -->
        <template #item.ticketNumber="{ item }">
          <span
            class="text-body-1 font-weight-medium text-primary cursor-pointer"
            @click="editTicket(item.id)"
          >
            #{{ item.ticketNumber }}
          </span>
        </template>

        <!-- Приоритет -->
        <template #item.priorityName="{ item }">
          <VChip
            v-if="item.priorityName"
            :color="resolvePriorityColor(item.priorityColor)"
            density="compact"
            label
            size="small"
          >
            {{ item.priorityName }}
          </VChip>
          <span v-else class="text-body-2">-</span>
        </template>

        <!-- Статус -->
        <template #item.stateName="{ item }">
          <VChip
            v-if="item.stateName"
            :color="resolveStateColor(item.stateColor)"
            density="compact"
            label
            size="small"
          >
            {{ item.stateName }}
          </VChip>
          <span v-else class="text-body-2">-</span>
        </template>

        <!-- Владелец -->
        <template #item.ownerLogin="{ item }">
          <span class="text-body-2">{{ getOwnerName(item) }}</span>
        </template>

        <!-- Активен -->
        <template #item.isActive="{ item }">
          <VChip
            v-bind="resolveStatusVariant(item.isActive)"
            density="compact"
            label
            size="small"
          />
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn @click="editTicket(item.id)">
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
          :length="Math.ceil(filteredTickets.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог удаления -->
    <VDialog v-model="deleteDialog" max-width="500px">
      <VCard title="Вы уверены, что хотите удалить этот тикет?">
        <VCardText>
          <div class="d-flex justify-center gap-4">
            <VBtn color="error" variant="outlined" @click="closeDelete">Отмена</VBtn>
            <VBtn color="success" variant="elevated" @click="deleteItemConfirm">Удалить</VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Уведомления -->
    <VSnackbar v-model="isToastVisible" :color="toastColor" timeout="3000">
      {{ toastMessage }}
    </VSnackbar>
  </div>
</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
