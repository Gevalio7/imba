<script setup lang="ts">
import { $fetch } from 'ofetch'
import { onMounted, ref, watch } from 'vue'

// Типы данных для Агент
interface Agents {
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
  groups?: Array<{id: number, roleId?: number}>
}

// Тип для Группы агентов
interface AgentsGroups {
  id: number
  name: string
  agents: Agent[]
  isActive: boolean
  roleId?: number
  roleName?: string
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

// Роли для отображения
const rolesMap = ref<Map<number, { name: string; icon?: string }>>(new Map())

// Данные агенты
const agents = ref<Agents[]>([])
const total = ref(0)
const loading = ref(false)
const tableLoading = ref(false)
const error = ref<string | null>(null)
const statusLoading = ref<number[]>([])
const bulkStatusLoading = ref(false)

// Статусы групп для визуального отображения
const groupsStatusMap = ref<Map<number, { name: string; isActive: boolean; roleId?: number }>>(new Map())

// Список групп для выбора
const availableGroups = ref<{ id: number; name: string; isActive: boolean; roleId?: number }[]>([])

// Загрузка ролей
const fetchRoles = async () => {
  try {
    const data = await $fetch<{ roles: { id: number; name: string; icon?: string }[], total: number }>(`${API_BASE}/roles`)
    rolesMap.value.clear()
    data.roles.forEach(role => {
      rolesMap.value.set(role.id, { name: role.name, icon: role.icon })
    })
  } catch (err) {
    console.error('Error fetching roles:', err)
  }
}
const selectedGroupIds = ref<number[]>([])

// Загрузка данных из API
const fetchAgents = async (silent = false) => {
  try {
    if (!silent) {
      loading.value = true
    } else {
      tableLoading.value = true
    }
    error.value = null
    
    // Формируем параметры запроса с пагинацией И фильтрами
    const query: Record<string, any> = {
      page: currentPage.value,
      itemsPerPage: itemsPerPage.value,
      q: searchQuery.value || undefined,
    }
    
    // Передаём фильтр статуса на сервер
    if (statusFilter.value !== null) {
      query.isActive = statusFilter.value === 1
    }
    
    const data = await $fetch<{ agents: Agents[], total: number }>(`${API_BASE}/agents`, {
      query,
    })
    agents.value = data.agents
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки агентов'
    console.error('Error fetching agents:', err)
  } finally {
    if (!silent) {
      loading.value = false
    } else {
      tableLoading.value = false
    }
  }
}

// Получение статусов групп
const fetchGroupsStatus = async () => {
  try {
    const response = await $fetch(`${API_BASE}/agentsGroups`)
    console.log('📋 Groups API response:', response)
    console.log('📊 Type:', typeof response)
    console.log('🔍 Has agentsGroups:', !!response.agentsGroups)

    // Извлекаем массив в зависимости от структуры ответа
    let groupsData = []

    if (Array.isArray(response)) {
      groupsData = response
    } else if (response.agentsGroups) {
      groupsData = response.agentsGroups
    } else if (response.data) {
      groupsData = response.data
    }

    console.log('✅ Groups data:', groupsData)

    groupsStatusMap.value.clear()
    availableGroups.value = []
    
    groupsData.forEach((group: any) => {
      console.log('[DEBUG] AgentsTable - group data:', { id: group.id, name: group.name, roleId: group.roleId, isActive: group.isActive });
      groupsStatusMap.value.set(group.id, {
        name: group.name,
        isActive: group.isActive,
        roleId: group.roleId
      })
      // Добавляем в список доступных групп
      availableGroups.value.push({
        id: group.id,
        name: group.name,
        isActive: group.isActive,
        roleId: group.roleId
      })
    })
  } catch (err) {
    console.error('Error fetching groups status:', err)
  }
}

// Создание агента
const createAgents = async (item: Omit<Agents, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<Agents>(`${API_BASE}/agents`, {
      method: 'POST',
      body: item
    })
    agents.value.push(data)
    return data
  } catch (err) {
    console.error('Error creating agents:', err)
    throw err
  }
}

// Обновление агента
const updateAgents = async (id: number, updates: Partial<Omit<Agents, 'id' | 'createdAt' | 'updatedAt'>>) => {
  try {
    const data = await $fetch<Agents>(`${API_BASE}/agents/${id}`, {
      method: 'PUT',
      body: updates
    })

    const index = agents.value.findIndex(p => p.id === id)
    if (index !== -1) {
      // Сохраняем критически важные поля, которые сервер может не вернуть
      const existingAgent = agents.value[index]

      agents.value[index] = {
        ...existingAgent,  // сохраняем старые данные (включая groups!)
        ...data,           // перезаписываем обновленными данными
        // Явно гарантируем сохранение groups
        groups: data.groups ?? existingAgent.groups
      }
    }
    return agents.value[index]
  } catch (err) {
    console.error('Error updating agent:', err)
    throw err
  }
}

// Удаление агента
const deleteAgents = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/agents/${id}`, { method: 'DELETE' })
    const index = agents.value.findIndex(p => p.id === id)
    if (index !== -1) agents.value.splice(index, 1)
  } catch (err) {
    console.error('Error deleting agents:', err)
  }
}

// Инициализация
onMounted(() => {
  fetchAgents()
  fetchGroupsStatus()
  fetchRoles()

  // Периодическое обновление статусов групп (каждые 2 секунды)
  setInterval(fetchGroupsStatus, 2000)

  // Обновление при фокусе окна
  window.addEventListener('focus', fetchGroupsStatus)
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Имя', key: 'firstName', sortable: true },
  { title: 'Фамилия', key: 'lastName', sortable: true },
  { title: 'Логин', key: 'login', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Мобильный телефон', key: 'mobilePhone', sortable: true },
  { title: 'Телеграмм акк', key: 'telegramAccount', sortable: true },
  { title: 'Роль', key: 'role', sortable: true },
  { title: 'Группы', key: 'groups', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Пагинация
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Фильтры
const statusFilter = ref<number | null>(null)
const isFilterDialogOpen = ref(false)

// Поиск
const searchQuery = ref('')

// Сброс фильтров
const clearFilters = () => {
  statusFilter.value = null
  currentPage.value = 1
  fetchAgents(true)
}

// Отслеживание изменения фильтра статуса
watch(statusFilter, () => {
  currentPage.value = 1
  fetchAgents(true)
})

// Массовые действия
const bulkDelete = () => {
  isBulkDeleteDialogOpen.value = true
}

const bulkAddToGroup = () => {
  isBulkAddToGroupDialogOpen.value = true
}

const bulkChangeStatus = () => {
  isBulkStatusDialogOpen.value = true
}

const confirmBulkDelete = async () => {
  try {
    for (const item of selectedItems.value) {
      await deleteAgents(item.id)
    }
    selectedItems.value = []
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    console.error('Error bulk delete:', err)
  }
}

const confirmBulkAddToGroup = async () => {
  if (!bulkAddToGroupId.value) {
    showToast('Выберите группу', 'error')
    return
  }

  try {
    bulkAddToGroupLoading.value = true
    
    // Добавляем каждого выбранного агента в группу
    for (const agent of selectedItems.value) {
      await $fetch(`${API_BASE}/agentsGroups/${bulkAddToGroupId.value}/agents`, {
        method: 'POST',
        body: { agentId: agent.id }
      })
    }
    
    showToast(`Агенты (${selectedItems.value.length}) добавлены в группу`)
    selectedItems.value = []
    isBulkAddToGroupDialogOpen.value = false
    bulkAddToGroupId.value = null
    emit('agent-updated')
    
    // Обновить данные
    await fetchAgents(true)
  } catch (err) {
    console.error('Error bulk add to group:', err)
    showToast('Ошибка добавления агентов в группу', 'error')
  } finally {
    bulkAddToGroupLoading.value = false
  }
}

const confirmBulkStatusChange = async () => {
  try {
    bulkStatusLoading.value = true

    // Оптимистично обновляем локально
    const previousStates = new Map<number, boolean>()
    for (const item of selectedItems.value) {
      const agentIndex = agents.value.findIndex(a => a.id === item.id)
      if (agentIndex !== -1) {
        previousStates.set(item.id, agents.value[agentIndex].isActive)
        agents.value[agentIndex].isActive = bulkStatusValue.value === 1
      }
    }

    // Отправляем на сервер
    await Promise.all(
      selectedItems.value.map(item =>
        updateAgents(item.id, { isActive: bulkStatusValue.value === 1 })
      )
    )

    selectedItems.value = []
    isBulkStatusDialogOpen.value = false
  } catch (err) {
    console.error('Error bulk status change:', err)
    // Откатываем при ошибке
    const previousStates = new Map<number, boolean>()
    for (const item of selectedItems.value) {
      const agentIndex = agents.value.findIndex(a => a.id === item.id)
      if (agentIndex !== -1) {
        agents.value[agentIndex].isActive = previousStates.get(item.id) ?? item.isActive
      }
    }
  } finally {
    bulkStatusLoading.value = false
  }
}

const resolveStatusVariant = (isActive: boolean) => {
  if (isActive)
    return { color: 'primary', text: 'Активен' }
  else
    return { color: 'error', text: 'Не активен' }
}

// Получить статус группы по id
const getGroupStatus = (groupId: number) => {
  const group = groupsStatusMap.value.get(groupId)
  return { isActive: group?.isActive ?? true }
}

// Определить цвет для группы
const getGroupColor = (groupId: number) => {
  const { isActive } = getGroupStatus(groupId)
  return isActive ? 'primary' : 'grey'
}

// Определить вариант для группы
const getGroupVariant = (groupId: number) => {
  const { isActive } = getGroupStatus(groupId)
  return isActive ? 'flat' : 'outlined'
}

// Определить иконку для группы
const getGroupIcon = (groupId: number) => {
  const { isActive } = getGroupStatus(groupId)
  return isActive ? undefined : 'bx-pause-circle'
}

// Массовые действия
const selectedItems = ref<Agents[]>([])
const isBulkActionsMenuOpen = ref(false)
const isBulkDeleteDialogOpen = ref(false)
const isBulkStatusDialogOpen = ref(false)
const isBulkAddToGroupDialogOpen = ref(false)
const bulkAddToGroupId = ref<number | null>(null)
const bulkAddToGroupLoading = ref(false)
const bulkStatusValue = ref<number>(1)

// Диалоги
const editDialog = ref(false)
const deleteDialog = ref(false)
const addToGroupDialog = ref(false)
const selectedAgentForGroup = ref<Agents | null>(null)
const selectedGroupForAgent = ref<number | null>(null)

const defaultItem = ref<Agents>({
  id: -1,
  firstName: '',
  lastName: '',
  login: '',
  password: '',
  email: '',
  mobilePhone: '',
  telegramAccount: '',
  createdAt: '',
  updatedAt: '',
  isActive: true,
})

const editedItem = ref<Agents>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Отслеживание изменений выбранных элементов
watch(selectedItems, (newValue) => {
  console.log('Selected items:', newValue)
}, { deep: true })

// Отслеживание изменений itemsPerPage
watch(itemsPerPage, () => {
  currentPage.value = 1
  fetchAgents(true)
})

// Отслеживание изменения страницы только от VPagination
// VDataTable не должен управлять страницей при hide-default-footer

// Отслеживание изменений поискового запроса с debounce
let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, (newValue) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    currentPage.value = 1 // Сброс на первую страницу при поиске
    fetchAgents(true)
  }, 300)
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

// Переключение статуса
const toggleStatus = async (item: Agents, newValue: boolean | null) => {
  if (newValue === null) return

  const previousValue = item.isActive
  const agentIndex = agents.value.findIndex(a => a.id === item.id)

  if (agentIndex === -1) return

  try {
    // Добавляем в загрузку
    statusLoading.value.push(item.id)

    // Оптимистично обновляем локальное состояние
    agents.value[agentIndex].isActive = newValue

    // Отправляем только изменение статуса
    await updateAgents(item.id, { isActive: newValue })

    // Показываем уведомление об успехе
    showToast(`Статус агента "${item.firstName} ${item.lastName}" изменен на "${newValue ? 'Активен' : 'Не активен'}"`)
  } catch (err) {
    console.error('Error toggling status:', err)
    // Откатываем при ошибке
    agents.value[agentIndex].isActive = previousValue
    showToast('Ошибка изменения статуса агента', 'error')
  } finally {
    // Убираем из загрузки
    statusLoading.value = statusLoading.value.filter(id => id !== item.id)
  }
}

// Удаление
const deleteItem = (item: Agents) => {
  editedIndex.value = agents.value.indexOf(item)
  editedItem.value = { ...item }
  deleteDialog.value = true
}

const deleteItemConfirm = async () => {
  try {
    await deleteAgents(editedItem.value.id)
    deleteDialog.value = false
    editedIndex.value = -1
    editedItem.value = { ...defaultItem.value }
  } catch (err) {
    console.error('Error deleting:', err)
  }
}

const closeDelete = () => {
  deleteDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
}

// Обновление выбранных групп при открытии диалога
const updateSelectedGroups = () => {
  if (editedItem.value.groups) {
    const groupNames = editedItem.value.groups.split(', ').filter(Boolean)
    selectedGroupIds.value = groupNames.map(name => {
      for (const [id, group] of groupsStatusMap.value.entries()) {
        if (group.name === name) return id
      }
      return null
    }).filter((id): id is number => id !== null)
  } else {
    selectedGroupIds.value = []
  }
  console.log('🔄 Selected groups updated:', selectedGroupIds.value)
}

// Редактирование
const editItem = (item: Agents) => {
  editedIndex.value = agents.value.indexOf(item)
  editedItem.value = { ...item }
  updateSelectedGroups()
  editDialog.value = true
}

// Добавление нового агента
const addNewAgents = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  selectedGroupIds.value = []
  editDialog.value = true
}

// Открыть диалог добавления в группу
const openAddToGroupDialog = (agent: Agents) => {
  selectedAgentForGroup.value = agent
  selectedGroupForAgent.value = null
  addToGroupDialog.value = true
}

// Добавить агента в группу
const addAgentToGroup = async () => {
  if (!selectedAgentForGroup.value || !selectedGroupForAgent.value) {
    showToast('Выберите группу', 'error')
    return
  }

  try {
    await $fetch(`${API_BASE}/agentsGroups/${selectedGroupForAgent.value}/agents`, {
      method: 'POST',
      body: { agentId: selectedAgentForGroup.value.id }
    })
    
    // Обновить данные агента
    await fetchAgents(true)
    
    showToast(`Агент добавлен в группу`)
    addToGroupDialog.value = false
    selectedAgentForGroup.value = null
    selectedGroupForAgent.value = null
    emit('agent-updated')
    selectedGroupForAgent.value = null
  } catch (err) {
    console.error('Error adding agent to group:', err)
    showToast('Ошибка добавления агента в группу', 'error')
  }
}

const close = () => {
  editDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
}

const save = async () => {
  if (!editedItem.value.firstName?.trim() || !editedItem.value.lastName?.trim()) {
    return
  }

  try {
    if (editedIndex.value > -1) {
      // Обновляем агента
      await updateAgents(editedItem.value.id, {
        firstName: editedItem.value.firstName,
        lastName: editedItem.value.lastName,
        login: editedItem.value.login,
        password: editedItem.value.password,
        email: editedItem.value.email,
        mobilePhone: editedItem.value.mobilePhone,
        telegramAccount: editedItem.value.telegramAccount,
        isActive: editedItem.value.isActive
      })

      // Сохраняем группы агента
      await $fetch(`${API_BASE}/agents/${editedItem.value.id}/groups`, {
        method: 'PUT',
        body: { groupIds: selectedGroupIds.value }
      })

      // Обновляем локальные данные агента
      const agent = agents.value.find(a => a.id === editedItem.value.id)
      if (agent) {
        Object.assign(agent, editedItem.value)
        // Обновляем отображаемые группы
        agent.groups = selectedGroupIds.value
          .map(id => availableGroups.value.find(g => g.id === id)?.name)
          .filter(Boolean)
          .join(', ')
      }

      // Генерируем событие для обновления списка групп (счётчики агентов)
      emit('agent-updated')
    } else {
      // Создаем нового агента
      const newAgent = await createAgents({
        firstName: editedItem.value.firstName,
        lastName: editedItem.value.lastName,
        login: editedItem.value.login,
        password: editedItem.value.password,
        email: editedItem.value.email,
        mobilePhone: editedItem.value.mobilePhone,
        telegramAccount: editedItem.value.telegramAccount,
        isActive: editedItem.value.isActive
      })

      // Сохраняем группы для нового агента
      if (selectedGroupIds.value.length > 0) {
        await $fetch(`${API_BASE}/agents/${newAgent.id}/groups`, {
          method: 'PUT',
          body: { groupIds: selectedGroupIds.value }
        })
      }

      // Перезагружаем данные
      await fetchAgents()

      // Генерируем событие для обновления списка групп (счётчики агентов)
      emit('agent-updated')
    }
    close()
  } catch (err) {
    console.error('Error saving:', err)
  }
}

// Эмиты
const emit = defineEmits<{
  (e: 'agent-updated'): void
}>()

// Экспортируем методы для родительского компонента
defineExpose({
  refresh: fetchAgents
})

</script>

<template>
  <div>
    <VCard title="Агенты">
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
            v-model="searchQuery"
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
            <VListItem @click="bulkAddToGroup(); isBulkActionsMenuOpen = false">
              <VListItemTitle>Добавить в группу</VListItemTitle>
            </VListItem>
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
            @click="addNewAgents"
          >
            Добавить агента
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
            Вы уверены, что хотите удалить выбранных агентов? Это действие нельзя отменить.
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
                :loading="bulkStatusLoading"
                @click="confirmBulkStatusChange"
              >
                Применить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог массового добавления в группу -->
      <VDialog
        v-model="isBulkAddToGroupDialogOpen"
        max-width="500px"
      >
        <VCard title="Добавить агентов в группу">
          <VCardText>
            <p class="mb-4">
              Выбрано агентов: <strong>{{ selectedItems.length }}</strong>
            </p>
            <AppSelect
              v-model="bulkAddToGroupId"
              :items="availableGroups"
              item-title="name"
              item-value="id"
              label="Выберите группу"
              placeholder="Выберите группу"
            />
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                color="error"
                variant="outlined"
                @click="isBulkAddToGroupDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                :loading="bulkAddToGroupLoading"
                @click="confirmBulkAddToGroup"
              >
                Добавить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <VDivider />

      <!-- Таблица -->
      <VDataTable
        class="agents-table"
        v-model="selectedItems"
        :items-per-page="itemsPerPage"
        :page="currentPage"
        :headers="headers"
        :items="agents"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Роль (из групп агента) -->
        <template #item.role="{ item }">
          <template v-if="item.groups && item.groups.some(g => g.roleId)">
            <div class="d-flex align-center gap-2">
              <VAvatar
                :color="$vuetify.theme.current.dark ? '#373B50' : '#EEEDF0'"
                size="32"
                class="text-caption font-weight-medium"
              >
                <span class="text-no-wrap" style="color: #666;">
                  {{ [...new Set(item.groups.filter(g => g.roleId).map(g => rolesMap.get(g.roleId!)?.name).filter(Boolean))].join(', ')?.[0] || '' }}
                </span>
              </VAvatar>
              <span>{{ [...new Set(item.groups.filter(g => g.roleId).map(g => rolesMap.get(g.roleId!)?.name).filter(Boolean))].join(', ') }}</span>
            </div>
          </template>
          <span v-else class="text-disabled">—</span>
        </template>

        <!-- Группы -->
        <template #item.groups="{ item }">
          <div class="d-flex flex-wrap gap-1 align-center">
            <template v-if="item.groups && item.groups.length > 0">
              <VChip
                v-for="group in item.groups"
                :key="group.id"
                :color="getGroupColor(group.id)"
                :variant="getGroupVariant(group.id)"
                density="compact"
                label
                size="small"
                class="me-1"
              >
                <VIcon
                  v-if="!getGroupStatus(group.id).isActive"
                  icon="bx-pause-circle"
                  size="small"
                  class="me-1"
                />
                <template v-if="group.roleId">
                  <span>{{ groupsStatusMap.get(group.id)?.name }}</span>
                  <span class="text-caption ms-1 font-weight-medium">• {{ rolesMap.get(group.roleId)?.name }}</span>
                </template>
                <template v-else>
                  {{ groupsStatusMap.get(group.id)?.name }}
                </template>
                <VTooltip
                  v-if="!getGroupStatus(group.id).isActive"
                  activator="parent"
                  location="top"
                >
                  Группа неактивна
                </VTooltip>
              </VChip>
            </template>
            <span v-else class="text-disabled">—</span>
          </div>
        </template>

        <!-- Активен -->
        <template #item.isActive="{ item }">
          <div class="d-flex align-center gap-2">
            <VSwitch
              :model-value="item.isActive"
              :disabled="statusLoading.includes(item.id)"
              @update:model-value="(val) => toggleStatus(item, val)"
              color="primary"
              hide-details
            />
            <VProgressCircular
              v-if="statusLoading.includes(item.id)"
              indeterminate
              size="16"
              color="primary"
            />
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
            <IconBtn @click="openAddToGroupDialog(item)">
              <VIcon icon="bx-user-plus" />
            </IconBtn>
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
          :length="Math.ceil(total / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
          @update:model-value="fetchAgents(true)"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать агент' : 'Добавить агент'">
        <VCardText>
          <VRow>
            <!-- Имя -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.firstName"
                label="Имя *"
              />
            </VCol>

            <!-- Фамилия -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.lastName"
                label="Фамилия *"
              />
            </VCol>

            <!-- Логин -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.login"
                label="Логин"
              />
            </VCol>

            <!-- Пароль -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.password"
                label="Пароль"
                type="password"
              />
            </VCol>

            <!-- Email -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.email"
                label="Email"
              />
            </VCol>

            <!-- Мобильный телефон -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.mobilePhone"
                label="Мобильный телефон"
              />
            </VCol>

            <!-- Телеграмм акк -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.telegramAccount"
                label="Телеграмм акк"
              />
            </VCol>

            <!-- Активен -->
            <VCol cols="12" sm="6">
              <VSwitch
                v-model="editedItem.isActive"
                label="Активен"
                color="primary"
              />
            </VCol>

            <!-- Группы агентов -->
            <VCol cols="12">
              <AppSelect
                v-model="selectedGroupIds"
                :items="availableGroups"
                item-title="name"
                item-value="id"
                label="Группы агентов"
                placeholder="Выберите группы"
                multiple
                chips
                clearable
                :menu-props="{ maxHeight: '300px' }"
              >
                <template #chip="{ props, item }">
                  <VChip
                    v-bind="props"
                    :color="item.raw.isActive ? 'primary' : 'grey'"
                    :variant="item.raw.isActive ? 'flat' : 'outlined'"
                    density="compact"
                    size="small"
                  >
                    <VIcon
                      v-if="!item.raw.isActive"
                      icon="bx-pause-circle"
                      size="small"
                      class="me-1"
                    />
                    {{ item.raw.name }}
                  </VChip>
                </template>
                <template #item="{ props, item }">
                  <VListItem v-bind="props" :title="item.raw.name">
                    <template #prepend>
                      <VIcon
                        v-if="!item.raw.isActive"
                        icon="bx-pause-circle"
                        color="grey"
                        size="small"
                        class="me-2"
                      />
                    </template>
                    <template v-if="!item.raw.isActive" #subtitle>
                      <span class="text-caption text-grey">Неактивная группа</span>
                    </template>
                  </VListItem>
                </template>
              </AppSelect>
            </VCol>
          </VRow>
        </VCardText>

        <VCardText>
          <div class="d-flex gap-4 justify-end">
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
      <VCard title="Вы уверены, что хотите удалить этот агент?">
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

    <!-- Уведомления -->
    <VSnackbar
      v-model="isToastVisible"
      :color="toastColor"
      timeout="3000"
    >
      {{ toastMessage }}
    </VSnackbar>

    <!-- Диалог добавления агента в группу -->
    <VDialog
      v-model="addToGroupDialog"
      max-width="400px"
    >
      <VCard title="Добавить агента в группу">
        <VCardText>
          <p v-if="selectedAgentForGroup" class="mb-4">
            Агент: <strong>{{ selectedAgentForGroup.firstName }} {{ selectedAgentForGroup.lastName }}</strong>
          </p>
          <AppSelect
            v-model="selectedGroupForAgent"
            :items="availableGroups"
            item-title="name"
            item-value="id"
            label="Выберите группу"
            placeholder="Выберите группу"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="addToGroupDialog = false"
          >
            Отмена
          </VBtn>
          <VBtn
            color="primary"
            @click="addAgentToGroup"
          >
            Добавить
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style lang="scss" scoped>
.agents-table {
  width: 100%;
  max-width: 100%;
}

:deep(.v-table) {
  width: 100%;
  max-width: 100%;
}

:deep(.v-data-table__wrapper) {
  width: 100%;
  overflow-x: auto;
}
</style>
