<script setup lang="ts">
import girlUsingLaptop from '@images/pages/girl-using-laptop.png'
import { $fetch } from 'ofetch'

// Типы данных для Группа агентов
interface AgentsGroups {
  id: number
  name: string
  agents: Agent[]
  isActive: boolean
  roleId?: number
  role?: Role
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

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Props
interface Props {
  agentsGroups: AgentsGroups[]
  loading: boolean
  roles?: Role[]
}

const props = withDefaults(defineProps<Props>(), {
  roles: () => []
})

// Если роли не переданы, загружаем сами
const localRoles = ref<Role[]>([])
const loadingRoles = ref(false)

const loadRoles = async () => {
  if (props.roles && props.roles.length > 0) {
    localRoles.value = props.roles
  } else {
    try {
      loadingRoles.value = true
      const data = await $fetch<{ roles: Role[], total: number }>(`${API_BASE}/roles`)
      localRoles.value = data.roles
    } catch (err) {
      console.error('Error fetching roles:', err)
    } finally {
      loadingRoles.value = false
    }
  }
}

// Загружаем роли при монтировании
loadRoles()

// Emits
const emit = defineEmits<{
  edit: [group: AgentsGroups]
  delete: [group: AgentsGroups]
  add: []
  toggleStatus: [group: AgentsGroups, newValue: boolean]
}>()

const editGroup = (group: AgentsGroups) => {
  emit('edit', group)
}

const deleteGroup = (group: AgentsGroups) => {
  emit('delete', group)
}

const addNewGroup = () => {
  emit('add')
}

const toggleStatus = (group: AgentsGroups, newValue: boolean) => {
  emit('toggleStatus', group, newValue)
}

// Получить имя роли по ID
const getRoleName = (roleId?: number) => {
  if (!roleId) return ''
  const role = localRoles.value.find(r => r.id === roleId)
  return role ? role.name : ''
}
</script>

<template>
  <VRow>
    <!-- 👉 Groups -->
    <VCol
      v-for="group in props.agentsGroups"
      :key="group.id"
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard>
        <VCardText class="d-flex align-center pb-4">
          <div class="text-body-1">
            {{ group.agents.length }} агентов
          </div>

          <VSpacer />

          <div class="v-avatar-group">
            <template
              v-for="(agent, index) in group.agents"
              :key="agent.id"
            >
              <VAvatar
                v-if="group.agents.length > 4 && group.agents.length !== 4 && index < 3"
                :color="$vuetify.theme.current.dark ? '#373B50' : '#EEEDF0'"
                size="default"
              >
                <span class="text-caption">{{ agent.firstName?.[0] || '' }}{{ agent.lastName?.[0] || '' }}</span>
              </VAvatar>

              <VAvatar
                v-if="group.agents.length === 4"
                :color="$vuetify.theme.current.dark ? '#373B50' : '#EEEDF0'"
                size="default"
              >
                <span class="text-caption">{{ agent.firstName?.[0] || '' }}{{ agent.lastName?.[0] || '' }}</span>
              </VAvatar>
            </template>
            <VAvatar
              v-if="group.agents.length > 4"
              :color="$vuetify.theme.current.dark ? '#373B50' : '#EEEDF0'"
              size="default"
            >
              <span class="text-caption">+{{ group.agents.length - 3 }}</span>
            </VAvatar>
          </div>
        </VCardText>

        <VCardText>
          <div class="d-flex justify-space-between align-center">
            <div>
              <h5 class="text-h5 mb-1">
                {{ group.name }}
              </h5>
              <div class="d-flex align-center gap-2">
                <div
                  class="text-body-2"
                  :class="group.isActive ? 'text-success' : 'text-error'"
                >
                  {{ group.isActive ? 'Группа активна' : 'Группа не активна' }}
                </div>
                <VChip
                  v-if="group.roleId"
                  color="primary"
                  variant="tonal"
                  size="x-small"
                  label
                >
                  {{ getRoleName(group.roleId) }}
                </VChip>
              </div>
            </div>
            <div class="d-flex flex-column align-end gap-2">
              <VSwitch
                :model-value="group.isActive"
                @update:model-value="(val) => toggleStatus(group, !!val)"
                color="primary"
                hide-details
                density="compact"
              />
              <div class="d-flex gap-1">
                <IconBtn @click="editGroup(group)">
                  <VIcon icon="bx-edit" />
                </IconBtn>
                <IconBtn @click="deleteGroup(group)">
                  <VIcon
                    icon="bx-trash"
                    class="text-error"
                  />
                </IconBtn>
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 Add New Group -->
    <VCol
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard
        class="h-100"
        :ripple="false"
      >
        <VRow
          no-gutters
          class="h-100"
        >
          <VCol
            cols="6"
            class="d-flex flex-column justify-end align-center mt-5"
          >
            <img
              width="105"
              :src="girlUsingLaptop"
            >
          </VCol>

          <VCol cols="6">
            <VCardText class="d-flex flex-column align-end justify-end gap-4">
              <VBtn
                size="small"
                @click="addNewGroup"
              >
                Создать группу
              </VBtn>
              <div class="text-end">
                Создать новую группу агентов,<br> если она не существует.
              </div>
            </VCardText>
          </VCol>
        </VRow>
      </VCard>
    </VCol>
  </VRow>
</template>
