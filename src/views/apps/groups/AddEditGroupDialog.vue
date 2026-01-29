<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, ref, watch } from 'vue'

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

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Данные
const group = ref<AgentsGroups>({
  id: -1,
  name: '',
  agents: [],
  isActive: true,
  createdAt: '',
  updatedAt: '',
})

const allAgents = ref<Agent[]>([])
const loadingAgents = ref(false)
const selectedAgent = ref<Agent | null>(null)

// Загрузка всех агентов
const fetchAllAgents = async () => {
  try {
    loadingAgents.value = true
    const data = await $fetch<{ agents: Agent[], total: number }>(`${API_BASE}/agents`)
    allAgents.value = data.agents.filter(agent => agent.isActive) // Только активные
  } catch (err) {
    console.error('Error fetching all agents:', err)
  } finally {
    loadingAgents.value = false
  }
}

// Доступные агенты для группы (не добавленные в эту группу)
const availableAgents = computed(() => {
  const currentAgentIds = group.value.agents.map(a => a.id)
  return allAgents.value.filter(agent => !currentAgentIds.includes(agent.id))
})

// Методы
const addAgent = async (agent: Agent) => {
  if (!group.value.id || group.value.id === -1) return

  try {
    await $fetch(`${API_BASE}/agentsGroups/${group.value.id}/agents`, {
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
    await $fetch(`${API_BASE}/agentsGroups/${group.value.id}/agents/${agent.id}`, {
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
      await $fetch(`${API_BASE}/agentsGroups/${group.value.id}`, {
        method: 'PUT',
        body: {
          name: group.value.name,
          isActive: group.value.isActive
        }
      })
      showToast('Группа обновлена')
    } else {
      // Создание
      const newGroup = await $fetch<AgentsGroups>(`${API_BASE}/agentsGroups`, {
        method: 'POST',
        body: {
          name: group.value.name,
          isActive: group.value.isActive
        }
      })
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

// Watchers
watch(() => props.isDialogVisible, (newVal) => {
  if (newVal) {
    if (props.groupDetail) {
      group.value = { ...props.groupDetail }
    } else {
      group.value = {
        id: -1,
        name: '',
        agents: [],
        isActive: true,
        createdAt: '',
        updatedAt: '',
      }
    }
    fetchAllAgents()
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
