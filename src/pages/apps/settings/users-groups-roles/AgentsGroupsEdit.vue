<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

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
  password: string
  email: string
  mobilePhone: string
  telegramAccount: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  groups?: string
}

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Роутер и роут
const router = useRouter()
const route = useRoute()
const groupId = computed(() => {
  const id = route.query.id
  return id ? Number(id) : null
})
const isNew = computed(() => !groupId.value)

// Данные
const loading = ref(false)
const saving = ref(false)
const loadingGroup = ref(false)

// Справочники
const allAgents = ref<Agent[]>([])
const selectedAgents = ref<Agent[]>([])
const group = ref<AgentsGroups>({
  id: -1,
  name: '',
  agents: [],
  isActive: true,
  createdAt: '',
  updatedAt: '',
})

// Загрузка группы
const fetchGroup = async () => {
  if (!groupId.value) return

  try {
    loadingGroup.value = true
    const data = await $fetch<AgentsGroups>(`${API_BASE}/agentsGroups/${groupId.value}`)
    group.value = data
    // Загружаем агентов группы
    const agents = await $fetch<Agent[]>(`${API_BASE}/agentsGroups/${groupId.value}/agents`)
    selectedAgents.value = agents
    // Синхронизируем чекбоксы с объектами из allAgents
    selectedItems.value = agents.map(agent => allAgents.value.find(a => a.id === agent.id)).filter(Boolean) as Agent[]
  } catch (err) {
    console.log('Error fetching group:', err)
    showToast('Ошибка загрузки группы', 'error')
  } finally {
    loadingGroup.value = false
  }
}

// Загрузка всех агентов
const fetchAllAgents = async () => {
  try {
    loading.value = true
    const data = await $fetch<{ agents: Agent[], total: number }>(`${API_BASE}/agents`)
    allAgents.value = data.agents
  } catch (err) {
    console.log('Error fetching all agents:', err)
  } finally {
    loading.value = false
  }
}

// Обновление агента
const updateAgents = async (id: number, item: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<Agent>(`${API_BASE}/agents/${id}`, {
      method: 'PUT',
      body: item
    })
    const index = allAgents.value.findIndex(a => a.id === id)
    if (index !== -1) {
      allAgents.value[index] = data
    }
    return data
  } catch (err) {
    console.error('Error updating agent:', err)
    throw err
  }
}

// Удаление агента
const deleteAgents = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/agents/${id}`, {
      method: 'DELETE'
    })
    const index = allAgents.value.findIndex(a => a.id === id)
    if (index !== -1) {
      allAgents.value.splice(index, 1)
    }
    // Также удалить из selectedAgents, если там есть
    const selectedIndex = selectedAgents.value.findIndex(a => a.id === id)
    if (selectedIndex !== -1) {
      selectedAgents.value.splice(selectedIndex, 1)
    }
  } catch (err) {
    console.error('Error deleting agent:', err)
    throw err
  }
}

// Выбор агентов
const toggleAgentSelection = (agent: Agent) => {
  const index = selectedAgents.value.findIndex(a => a.id === agent.id)
  if (index === -1) {
    selectedAgents.value.push(agent)
  } else {
    selectedAgents.value.splice(index, 1)
  }
}

const isAgentSelected = (agent: Agent): boolean => {
  return selectedAgents.value.some(a => a.id === agent.id)
}

// Сохранение
const save = async () => {
  if (!group.value.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  try {
    saving.value = true
    
    if (isNew.value) {
      // Создание новой группы
      const newGroup = await $fetch<AgentsGroups>(`${API_BASE}/agentsGroups`, {
        method: 'POST',
        body: {
          name: group.value.name,
          isActive: group.value.isActive,
          agents: selectedAgents.value.map(a => a.id),
        }
      })
      showToast('Группа агентов успешно создана')
    } else {
      // Обновление группы
      await $fetch(`${API_BASE}/agentsGroups/${groupId.value}`, {
        method: 'PUT',
        body: {
          name: group.value.name,
          isActive: group.value.isActive,
        }
      })
      
      // Обновляем агентов в группе
      // Сначала получаем текущих агентов
      const currentAgents = await $fetch<Agent[]>(`${API_BASE}/agentsGroups/${groupId.value}/agents`)
      const currentAgentIds = currentAgents.map(a => a.id)
      const newAgentIds = selectedAgents.value.map(a => a.id)
      
      // Добавляем новых агентов
      for (const agentId of newAgentIds) {
        if (!currentAgentIds.includes(agentId)) {
          await $fetch(`${API_BASE}/agentsGroups/${groupId.value}/agents`, {
            method: 'POST',
            body: { agentId }
          })
        }
      }
      
      // Удаляем агентов которых больше нет в выборе
      for (const agentId of currentAgentIds) {
        if (!newAgentIds.includes(agentId)) {
          await $fetch(`${API_BASE}/agentsGroups/${groupId.value}/agents/${agentId}`, {
            method: 'DELETE'
          })
        }
      }
      
      showToast('Группа агентов успешно обновлена')
    }
    
    router.push('/apps/settings/users-groups-roles/AgentsGroups')
  } catch (err) {
    showToast('Ошибка сохранения группы агентов', 'error')
  } finally {
    saving.value = false
  }
}

// Отмена
const cancel = () => {
  router.push('/apps/settings/users-groups-roles/AgentsGroups')
}

// Инициализация
onMounted(async () => {
  await fetchAllAgents()
  if (!isNew.value) {
    await fetchGroup()
  }
})

// Уведомления
const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Имя', key: 'firstName', sortable: true },
  { title: 'Фамилия', key: 'lastName', sortable: true },
  { title: 'Логин', key: 'login', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Мобильный телефон', key: 'mobilePhone', sortable: true },
  { title: 'Телеграмм акк', key: 'telegramAccount', sortable: true },
  { title: 'Группы', key: 'groups', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false }
]

// Фильтрация
const filteredAgents = computed(() => {
  let filtered = allAgents.value

  if (statusFilter.value !== null) {
    // Фильтруем по isActive: 1 = true (активен), 2 = false (не активен)
    filtered = filtered.filter(p => p.isActive === (statusFilter.value === 1))
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

const confirmBulkDelete = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      const index = selectedAgents.value.findIndex(a => a.id === item.id)
      if (index !== -1) {
        selectedAgents.value.splice(index, 1)
      }
    }
    selectedItems.value = []
    showToast(`Удалено ${count} агентов из выбранных`)
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmBulkStatusChange = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      const agent = selectedAgents.value.find(a => a.id === item.id)
      if (agent) {
        agent.isActive = bulkStatusValue.value === 1
      }
    }
    selectedItems.value = []
    showToast(`Статус изменен для ${count} агентов`)
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
const selectedItems = ref<Agent[]>([])
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

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Отслеживание изменений selectedAgents
watch(selectedAgents, (newValue) => {
  console.log('✅ Изменение selectedAgents')
  console.log('📋 Новое значение selectedAgents:', newValue)
  console.log('📊 Количество выбранных:', newValue.length)
}, { deep: true })

// Синхронизация selectedItems с selectedAgents
watch(selectedItems, (newValue, oldValue) => {
  // Добавленные
  for (const item of newValue) {
    if (!oldValue.some(o => o.id === item.id)) {
      if (!selectedAgents.value.some(a => a.id === item.id)) {
        selectedAgents.value.push(item)
      }
    }
  }
  // Удаленные
  for (const item of oldValue) {
    if (!newValue.some(n => n.id === item.id)) {
      const index = selectedAgents.value.findIndex(a => a.id === item.id)
      if (index !== -1) {
        selectedAgents.value.splice(index, 1)
      }
    }
  }
}, { deep: true })
</script>

<template>
  <div>
    <VCard>
      <VCardTitle>
        {{ isNew ? 'Создание группы агентов' : 'Редактирование группы агентов' }}
      </VCardTitle>

      <VCardText>
        <VRow>
          <VCol cols="12">
            <h6 class="text-h6 font-weight-medium">
              Основное
            </h6>
            <p class="mb-0">
              {{ isNew ? 'Введите название группы и выберите агентов' : 'Редактируйте название группы и выберите агентов' }}
            </p>
          </VCol>

          <VCol cols="12" md="6">
            <AppTextField
              v-model="group.name"
              label="Название группы *"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VSwitch
              v-model="group.isActive"
              label="Активно"
              color="primary"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <!-- Индикатор загрузки -->
      <div v-if="loading || loadingGroup" class="d-flex justify-center pa-6">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <div v-else class="d-flex flex-wrap gap-4 pa-6">
        <div class="d-flex align-center">
          <!-- Поиск -->
          <AppTextField
            placeholder="Поиск агентов"
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
              <VListItemTitle>Удалить из выбранных</VListItemTitle>
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
            Вы уверены, что хотите удалить выбранных агентов из списка? Это действие нельзя отменить.
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

      <!-- Таблица доступных агентов -->
      <VDataTable
        v-model="selectedItems"
        v-model:items-per-page="itemsPerPage"
        v-model:page="currentPage"
        :headers="headers"
        :items="filteredAgents"
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
              @update:model-value="(val) => item.isActive = val"
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

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn @click="toggleAgentSelection(item)">
              <VIcon icon="bx-x" />
            </IconBtn>
          </div>
        </template>
      </VDataTable>

      <!-- Пагинация -->
      <div class="d-flex justify-center mt-4 pb-4">
        <VPagination
          v-model="currentPage"
          :length="Math.ceil(filteredAgents.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>

      <VDivider />

      <VCardText>
        <div class="d-flex flex-wrap gap-4 justify-space-between mt-8">
          <VBtn
            color="secondary"
            variant="tonal"
            @click="cancel"
          >
            Отмена
          </VBtn>

          <VBtn
            color="success"
            :loading="saving"
            @click="save"
          >
            {{ isNew ? 'Создать' : 'Сохранить' }}
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- Уведомления -->
    <VSnackbar
      v-model="isToastVisible"
      :color="toastColor"
      timeout="3000"
    >
      {{ toastMessage }}
    </VSnackbar>
  </div>
</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}
</style>
