<script setup lang="ts">
import AgentsGroupsCards from '@/views/apps/groups/AgentsGroupsCards.vue'
import AgentsGroupsTable from '@/views/apps/groups/AgentsGroupsTable.vue'
import { $fetch } from 'ofetch'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

// Переключатель вида групп (карточки/таблица)
const groupsViewMode = ref<'cards' | 'table'>('cards')

// Типы данных для Группа агентов
interface AgentsGroups {
  id: number
  name: string
  agents: Agent[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Тип для агента
interface Agent {
  id: number
  firstName: string
  lastName: string
  login: string
  email: string
  isActive: boolean
}

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Роутер
const router = useRouter()

// Refs
const agentsGroupsTable = ref()

// Данные группы агентов
const agentsGroups = ref<AgentsGroups[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Загрузка данных из API
const fetchAgentsGroups = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await $fetch<{ agentsGroups: AgentsGroups[], total: number }>(`${API_BASE}/agentsGroups`)

    // Для каждой группы загрузим агентов
    for (const group of data.agentsGroups) {
      group.agents = await fetchAgentsInGroup(group.id)
    }

    agentsGroups.value = data.agentsGroups
  } catch (err) {
    error.value = 'Ошибка загрузки группы агентов'
    console.error('Error fetching agentsGroups:', err)
  } finally {
    loading.value = false
  }
}

// Загрузка агентов в группе
const fetchAgentsInGroup = async (groupId: number): Promise<Agent[]> => {
  try {
    const agents = await $fetch<Agent[]>(`${API_BASE}/agentsGroups/${groupId}/agents`)
    return agents
  } catch (err) {
    console.error('Error fetching agents in group:', err)
    return []
  }
}

// Инициализация
onMounted(() => {
  fetchAgentsGroups()
})

// Удаление группы
const deleteGroup = async (group: AgentsGroups) => {
  try {
    await $fetch(`${API_BASE}/agentsGroups/${group.id}`, { method: 'DELETE' })
    const index = agentsGroups.value.findIndex(g => g.id === group.id)
    if (index !== -1) agentsGroups.value.splice(index, 1)
  } catch (err) {
    console.error('Error deleting group:', err)
  }
}

// Переключение статуса группы
const toggleGroupStatus = async (group: AgentsGroups, newValue: boolean) => {
  try {
    await $fetch(`${API_BASE}/agentsGroups/${group.id}`, {
      method: 'PUT',
      body: { ...group, isActive: newValue }
    })
    group.isActive = newValue
  } catch (err) {
    console.error('Error toggling group status:', err)
  }
}

// Пагинация
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Фильтры
const statusFilter = ref<number | null>(null)
const isFilterDialogOpen = ref(false)

// Массовые действия
const selectedItems = ref<AgentsGroups[]>([])
const isBulkActionsMenuOpen = ref(false)
const isBulkDeleteDialogOpen = ref(false)
const isBulkStatusDialogOpen = ref(false)
const bulkStatusValue = ref<number>(1)

// Фильтрация
const filteredGroups = computed(() => {
  let filtered = agentsGroups.value
  if (statusFilter.value !== null) {
    filtered = filtered.filter(g => g.isActive === (statusFilter.value === 1))
  }
  return filtered
})

// Сброс фильтров
const clearFilters = () => {
  statusFilter.value = null
}

// Массовые действия
const bulkDelete = () => {
  isBulkDeleteDialogOpen.value = true
}

const bulkChangeStatus = () => {
  isBulkStatusDialogOpen.value = true
}

const confirmBulkDelete = async () => {
  try {
    for (const item of selectedItems.value) {
      await $fetch(`${API_BASE}/agentsGroups/${item.id}`, { method: 'DELETE' })
      const index = agentsGroups.value.findIndex(g => g.id === item.id)
      if (index !== -1) agentsGroups.value.splice(index, 1)
    }
    selectedItems.value = []
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    console.error('Error bulk deleting:', err)
  }
}

const confirmBulkStatusChange = async () => {
  try {
    for (const item of selectedItems.value) {
      await $fetch(`${API_BASE}/agentsGroups/${item.id}`, {
        method: 'PUT',
        body: { ...item, isActive: bulkStatusValue.value === 1 }
      })
      const group = agentsGroups.value.find(g => g.id === item.id)
      if (group) group.isActive = bulkStatusValue.value === 1
    }
    selectedItems.value = []
    isBulkStatusDialogOpen.value = false
  } catch (err) {
    console.error('Error bulk status change:', err)
  }
}

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]
</script>

<template>
  <VRow>
    <!-- Заголовок групп -->
    <VCol cols="12">
      <div class="d-flex justify-space-between align-center">
        <div>
          <h4 class="text-h4 mb-1">
            Группы агентов
          </h4>
          <p class="text-body-1 mb-0">
            Группа агентов предоставляет доступ к определенным агентам для совместной работы.
          </p>
        </div>
        <VBtnToggle
          v-model="groupsViewMode"
          mandatory
          variant="outlined"
          divided
        >
          <VBtn value="cards" icon="bx-grid-alt" />
          <VBtn value="table" icon="bx-list-ul" />
        </VBtnToggle>
      </div>
    </VCol>

    <!-- Группы -->
    <VCol cols="12">
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

      <template v-else>
        <!-- Карточный вид - без VCard обертки -->
        <AgentsGroupsCards
          v-if="groupsViewMode === 'cards'"
          :agents-groups="filteredGroups"
          :loading="loading"
          @edit="(group) => router.push(`/apps/settings/users-groups-roles/AgentsGroupsEdit?id=${group.id}`)"
          @delete="deleteGroup"
          @add="() => router.push('/apps/settings/users-groups-roles/AgentsGroupsCreate')"
          @toggle-status="toggleGroupStatus"
        />

        <!-- Табличный вид - с VCard оберткой -->
        <VCard v-else title="Группы агентов">
          <!-- Табличный вид - панель инструментов -->
          <div class="d-flex flex-wrap gap-4 pa-6">
            <div class="d-flex align-center">
              <!-- Поиск -->
              <AppTextField
                placeholder="Поиск групп"
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
                <VListItem @click="bulkDelete(); isBulkActionsMenuOpen = false">
                  <VListItemTitle>Удалить</VListItemTitle>
                </VListItem>
                <VListItem @click="bulkChangeStatus(); isBulkActionsMenuOpen = false">
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
              <VBtn
                color="primary"
                prepend-icon="bx-plus"
                @click="router.push('/apps/settings/users-groups-roles/AgentsGroupsCreate')"
              >
                Создать группу
              </VBtn>
            </div>
          </div>

          <VDivider />

          <AgentsGroupsTable
            ref="agentsGroupsTable"
            v-model:current-page="currentPage"
            v-model:items-per-page="itemsPerPage"
            v-model:selected-items="selectedItems"
            :agents-groups="filteredGroups"
            :loading="loading"
            :error="error"
            @group-updated="fetchAgentsGroups"
            @toggle-status="toggleGroupStatus"
          />
        </VCard>
      </template>
    </VCol>

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
          Вы уверены, что хотите удалить выбранные группы? Это действие нельзя отменить.
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

    <!-- Заголовок агентов -->
    <VCol cols="12">
      <h4 class="text-h4 mb-1 mt-6">
        Все агенты
      </h4>
      <p class="text-body-1 mb-0">
        Список всех агентов системы с возможностью фильтрации и массовых действий.
      </p>
    </VCol>

    <!-- Агенты -->
    <VCol cols="12">
      <AgentsTable />
    </VCol>
  </VRow>
</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}
</style>
