<script setup lang="ts">
import { $api } from '@/utils/api'
import { computed, ref, watch } from 'vue'

// Типы данных для Группа агентов
interface AgentsGroups {
  id: number
  name: string
  agents: Agent[]
  isActive: boolean
  roleId?: number
  roleIds?: number[]
  roles?: Role[]
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

// Тип для роли
interface Role {
  id: number
  name: string
}

interface Props {
  isDialogVisible: boolean
  groupDetail?: AgentsGroups
}

const props = withDefaults(defineProps<Props>(), {
  isDialogVisible: false,
  groupDetail: undefined,
})

const emit = defineEmits<{
  'update:isDialogVisible': [value: boolean]
  'update:groupDetail': [value: AgentsGroups | undefined]
  'group-updated': []
}>()

// $api уже содержит baseURL и добавляет Authorization header

// Данные
const group = ref<AgentsGroups>({
  id: -1,
  name: '',
  agents: [],
  isActive: true,
  roleId: undefined,
  roleIds: [],
  roles: [],
  createdAt: '',
  updatedAt: '',
})

// Выбранные роли (массив ID)
const selectedRoleIds = ref<number[]>([])

const allAgents = ref<Agent[]>([])
const loadingAgents = ref(false)
const selectedAgent = ref<Agent | null>(null)

// Роли
const roles = ref<Role[]>([])
const loadingRoles = ref(false)

// Загрузка всех агентов
const fetchAllAgents = async () => {
  try {
    loadingAgents.value = true
    const data = await $api<{ agents: Agent[], total: number }>('/agents')
    allAgents.value = data.agents.filter(agent => agent.isActive) // Только активные
  } catch (err) {
    console.error('Error fetching all agents:', err)
  } finally {
    loadingAgents.value = false
  }
}

// Загрузка всех ролей
const fetchAllRoles = async () => {
  try {
    loadingRoles.value = true
    const data = await $api<{ roles: Role[], total: number }>('/roles')
    roles.value = data.roles
  } catch (err) {
    console.error('Error fetching roles:', err)
  } finally {
    loadingRoles.value = false
  }
}

// Доступные агенты для группы (не добавленные в эту группу)
const availableAgents = computed(() => {
  const currentAgentIds = (group.value.agents || []).map(a => a.id)
  return allAgents.value.filter(agent => !currentAgentIds.includes(agent.id))
})

// Методы
const addAgent = async (agent: Agent) => {
  if (!group.value.id || group.value.id === -1) return

  try {
    await $api(`/agentsGroups/${group.value.id}/agents`, {
      method: 'POST',
      body: { agentId: agent.id }
    })
    group.value.agents.push(agent)
    showToast('Агент добавлен в группу')
    selectedAgent.value = null
  } catch (err) {
    showToast('Ошибка добавления агента', 'error')
  }
}

const removeAgent = async (agent: Agent) => {
  if (!group.value.id || group.value.id === -1) return

  try {
    await $api(`/agentsGroups/${group.value.id}/agents/${agent.id}`, {
      method: 'DELETE'
    })
    group.value.agents = group.value.agents.filter(a => a.id !== agent.id)
    showToast('Агент удален из группы')
  } catch (err) {
    showToast('Ошибка удаления агента', 'error')
  }
}

const saveGroup = async () => {
  if (!group.value.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  try {
    if (group.value.id > 0) {
      // Обновление
      await $api(`/agentsGroups/${group.value.id}`, {
        method: 'PUT',
        body: {
          name: group.value.name,
          isActive: group.value.isActive,
          roleIds: selectedRoleIds.value
        }
      })
      showToast('Группа обновлена')
    } else {
      // Создание
      const newGroup = await $api<AgentsGroups>('/agentsGroups', {
        method: 'POST',
        body: {
          name: group.value.name,
          isActive: group.value.isActive,
          roleIds: selectedRoleIds.value
        }
      })
      // Убедимся что agents существует
      newGroup.agents = newGroup.agents || []
      group.value = newGroup
      showToast('Группа создана')
    }
    emit('group-updated')
    closeDialog()
  } catch (err) {
    showToast('Ошибка сохранения группы', 'error')
  }
}

const closeDialog = () => {
  emit('update:isDialogVisible', false)
  emit('update:groupDetail', undefined)
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

// Загрузка актуальных данных группы с сервера
const fetchGroupById = async (groupId: number) => {
  try {
    const data = await $api<AgentsGroups>(`/agentsGroups/${groupId}`)
    group.value = { ...data, agents: group.value.agents || [] }
    // Инициализируем выбранные роли из актуальных данных
    if (data.roles && data.roles.length > 0) {
      selectedRoleIds.value = data.roles.map(r => r.id)
    } else if (data.roleId) {
      selectedRoleIds.value = [data.roleId]
    } else {
      selectedRoleIds.value = []
    }
  } catch (err) {
    console.error('Error fetching group by id:', err)
  }
}

// Watchers
watch(() => props.isDialogVisible, async (newVal) => {
  if (newVal) {
    if (props.groupDetail) {
      group.value = { ...props.groupDetail }
      // Инициализируем выбранные роли из данных группы
      if (props.groupDetail.roles && props.groupDetail.roles.length > 0) {
        selectedRoleIds.value = props.groupDetail.roles.map(r => r.id)
      } else if (props.groupDetail.roleIds && props.groupDetail.roleIds.length > 0) {
        selectedRoleIds.value = [...props.groupDetail.roleIds]
      } else if (props.groupDetail.roleId) {
        selectedRoleIds.value = [props.groupDetail.roleId]
      } else {
        selectedRoleIds.value = []
      }
      // Загружаем актуальные данные с сервера (включая roles)
      if (props.groupDetail.id > 0) {
        await fetchGroupById(props.groupDetail.id)
      }
    } else {
      group.value = {
        id: -1,
        name: '',
        agents: [],
        isActive: true,
        roleId: undefined,
        roleIds: [],
        roles: [],
        createdAt: '',
        updatedAt: '',
      }
      selectedRoleIds.value = []
    }
    fetchAllAgents()
    fetchAllRoles()
  }
})
</script>

<template>
  <VDialog
    :model-value="isDialogVisible"
    max-width="800px"
    @update:model-value="closeDialog"
  >
    <VCard>
      <VCardTitle>
        {{ group.id > 0 ? 'Управление группой агентов' : 'Создать новую группу агентов' }}
      </VCardTitle>

      <VCardText>
        <VRow>
          <VCol cols="12">
            <AppTextField
              v-model="group.name"
              label="Название группы *"
              placeholder="Введите название группы"
            />
          </VCol>

          <VCol cols="12">
            <AppSelect
              v-model="selectedRoleIds"
              :items="roles"
              item-title="name"
              item-value="id"
              label="Роли"
              placeholder="Выберите роли для группы"
              :loading="loadingRoles"
              multiple
              chips
              clearable
              clear-icon="bx-x"
              :menu-props="{ maxHeight: '300px' }"
            >
              <template #chip="{ props: chipProps, item }">
                <VChip
                  v-bind="chipProps"
                  color="primary"
                  variant="tonal"
                  density="compact"
                  size="small"
                >
                  {{ item.raw.name }}
                </VChip>
              </template>
              <template #item="{ props: itemProps, item }">
                <VListItem v-bind="itemProps">
                  <template #title>
                    {{ item.raw.name }}
                  </template>
                </VListItem>
              </template>
            </AppSelect>
          </VCol>

          <VCol cols="12">
            <VSwitch
              v-model="group.isActive"
              label="Активна"
              color="primary"
            />
          </VCol>

          <VCol
            v-if="group.id > 0"
            cols="12"
          >
            <VDivider class="my-4" />
            <h6 class="text-h6 mb-4">Агенты в группе</h6>

            <div class="d-flex flex-wrap gap-2 mb-4">
              <VChip
                v-for="agent in group.agents"
                :key="agent.id"
                closable
                @click:close="removeAgent(agent)"
              >
                {{ agent.firstName }} {{ agent.lastName }}
              </VChip>
            </div>

            <h6 class="text-h6 mb-4">Добавить агента</h6>

            <VSelect
              v-model="selectedAgent"
              :items="availableAgents"
              item-title="firstName"
              item-value="id"
              label="Выберите агента"
              placeholder="Выберите агента для добавления"
              return-object
              @update:model-value="addAgent"
            >
              <template #item="{ props, item }">
                <VListItem v-bind="props">
                  {{ item.raw.firstName }} {{ item.raw.lastName }}
                </VListItem>
              </template>
            </VSelect>
          </VCol>
        </VRow>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          variant="outlined"
          @click="closeDialog"
        >
          Отмена
        </VBtn>
        <VBtn
          color="primary"
          @click="saveGroup"
        >
          {{ group.id > 0 ? 'Сохранить' : 'Создать' }}
        </VBtn>
      </VCardActions>
    </VCard>

    <!-- Уведомления -->
    <VSnackbar
      v-model="isToastVisible"
      :color="toastColor"
      timeout="3000"
    >
      {{ toastMessage }}
    </VSnackbar>
  </VDialog>
</template>
