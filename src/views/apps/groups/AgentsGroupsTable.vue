<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import AddEditGroupDialog from './AddEditGroupDialog.vue'
import { $api } from '@/utils/api'
import { useToast } from '@/composables/useToast'

// Типы данных для Группа агентов
interface AgentsGroups {
  id: number
  name: string
  agents: Agent[]
  isActive: boolean
  roleId?: number
  roleIds?: number[]
  roles?: Role[]
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

// Роутер

// Props
interface Props {
  agentsGroups: AgentsGroups[]
  loading: boolean
  error?: string | null
  currentPage: number
  itemsPerPage: number
  selectedItems: AgentsGroups[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  edit: [group: AgentsGroups]
  delete: [group: AgentsGroups]
  add: []
  toggleStatus: [group: AgentsGroups, newValue: boolean]
  'update:currentPage': [page: number]
  'update:itemsPerPage': [items: number]
  'update:selectedItems': [items: AgentsGroups[]]
  'group-updated': []
}>()

// Headers для таблицы
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Роль', key: 'role', sortable: false },
  { title: 'Агентов', key: 'agents', sortable: false },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Функция для определения варианта статуса
// Состояние диалога редактирования/создания
const isEditDialogVisible = ref(false)
const editingGroup = ref<AgentsGroups | undefined>(undefined)

// Роли
const roles = ref<Role[]>([])
const loadingRoles = ref(false)

// Загрузка ролей
const fetchRoles = async () => {
  try {
    loadingRoles.value = true
    console.log('[AgentsGroupsTable.vue] GET /api/roles - fetching roles')

    const data = await $api<{ roles: Role[]; total: number }>(`/roles`)

    roles.value = data.roles
  }
  catch (err) {
    console.error('Error fetching roles:', err)
  }
  finally {
    loadingRoles.value = false
  }
}

// Получить имя роли по ID
const getRoleName = (roleId?: number) => {
  if (!roleId)
    return '-'
  const role = roles.value.find(r => r.id === roleId)

  return role ? role.name : '-'
}

// Получить список ролей группы
const getGroupRoles = (group: AgentsGroups): Role[] => {
  if (group.roles && group.roles.length > 0)
    return group.roles

  if (group.roleId) {
    const role = roles.value.find(r => r.id === group.roleId)

    return role ? [role] : []
  }

  return []
}

const resolveStatusVariant = (isActive: boolean) => {
  if (isActive)
    return { color: 'primary', text: 'Активен' }
  else
    return { color: 'error', text: 'Не активен' }
}

const editGroup = (group: AgentsGroups) => {
  editingGroup.value = group
  isEditDialogVisible.value = true
}

const deleteGroup = (group: AgentsGroups) => {
  editedIndex.value = props.agentsGroups.indexOf(group)
  editedItem.value = { ...group }
  deleteDialog.value = true
}

const handleGroupUpdated = () => {
  emit('group-updated')
}

const addNewGroup = () => {
  editingGroup.value = undefined
  isEditDialogVisible.value = true
}

const { showToast } = useToast()

const toggleStatus = async (group: AgentsGroups, newValue: boolean) => {
  const previousValue = group.isActive

  try {
    // Добавляем в загрузку
    statusLoading.value.push(group.id)

    // Оптимистично обновляем локальное состояние
    group.isActive = newValue

    // Отправляем на сервер
    await $api(`/agentsGroups/${group.id}`, {
      method: 'PUT',
      body: { isActive: newValue },
    })

    // Показываем уведомление об успехе
    showToast(`Статус группы "${group.name}" изменен на "${newValue ? 'Активна' : 'Не активна'}"`)
  }
  catch (err) {
    console.error('Error toggling status:', err)

    // Откатываем при ошибке
    group.isActive = previousValue
    showToast('Ошибка изменения статуса группы', 'error')
  }
  finally {
    // Убираем из загрузки
    statusLoading.value = statusLoading.value.filter(id => id !== group.id)
  }
}

const updatePage = (page: number) => {
  emit('update:currentPage', page)
}

const updateItemsPerPage = (items: number) => {
  emit('update:itemsPerPage', items)
}

const updateSelectedItems = (items: AgentsGroups[]) => {
  emit('update:selectedItems', items)
}

// Диалоги
const deleteDialog = ref(false)

const editedItem = ref<AgentsGroups | null>(null)
const editedIndex = ref(-1)

const statusLoading = ref<number[]>([])
const deleteLoading = ref<number[]>([])

const closeDelete = () => {
  deleteDialog.value = false
  editedIndex.value = -1
  editedItem.value = null
}

const deleteItemConfirm = async () => {
  try {
    if (editedItem.value) {
      const deletedGroupId = editedItem.value.id

      deleteLoading.value.push(deletedGroupId)

      await $api(`/agentsGroups/${deletedGroupId}`, {
        method: 'DELETE',
      })

      // Только эмитим событие - не изменяем пропсы напрямую!
      emit('group-updated')
      closeDelete()
      showToast('Группа успешно удалена')
    }
  }
  catch (err) {
    console.error('Error deleting group:', err)
    showToast('Ошибка удаления группы', 'error')
  }
  finally {
    if (editedItem.value)
      deleteLoading.value = deleteLoading.value.filter(id => id !== editedItem.value!.id)
  }
}

// Отслеживание изменений выбранных элементов
watch(() => props.selectedItems, newValue => {
  console.log('Selected items:', newValue)
}, { deep: true })

// Загружаем роли при монтировании
onMounted(() => {
  fetchRoles()
})
</script>

<template>
  <VCard>
    <!-- Индикатор загрузки -->
    <div
      v-if="loading"
      class="d-flex justify-center pa-6"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>

    <!-- Сообщение об ошибке -->
    <div
      v-else-if="error"
      class="d-flex justify-center pa-6"
    >
      <VAlert
        type="error"
        class="ma-4"
      >
        {{ error }}
      </VAlert>
    </div>

    <template v-else>
      <!-- Таблица групп -->
      <VDataTable
        :model-value="selectedItems"
        :items-per-page="itemsPerPage"
        :page="currentPage"
        :headers="headers"
        :items="agentsGroups"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
        @update:model-value="updateSelectedItems"
        @update:items-per-page="updateItemsPerPage"
        @update:page="updatePage"
      >
        <!-- Агентов -->
        <template #item.agents="{ item }">
          <div class="d-flex align-center gap-2">
            <div class="v-avatar-group">
              <template
                v-for="(agent, index) in item.agents"
                :key="agent.id"
              >
                <VAvatar
                  v-if="index < 3"
                  :color="$vuetify.theme.current.dark ? '#373B50' : '#EEEDF0'"
                  size="32"
                  class="text-caption font-weight-medium"
                >
                  <span
                    class="text-no-wrap"
                    style="color: #666;"
                  >{{ agent.firstName?.[0] || '' }}{{ agent.lastName?.[0] || '' }}</span>
                </VAvatar>
              </template>
              <VAvatar
                v-if="item.agents.length > 3"
                :color="$vuetify.theme.current.dark ? '#373B50' : '#EEEDF0'"
                size="32"
                class="text-caption font-weight-medium"
              >
                <span
                  class="text-no-wrap"
                  style="color: #666;"
                >+{{ item.agents.length - 3 }}</span>
              </VAvatar>
            </div>
            <span class="ml-2">{{ item.agents.length }} агентов</span>
          </div>
        </template>

        <!-- Роль -->
        <template #item.role="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <template v-if="getGroupRoles(item).length > 0">
              <VChip
                v-for="role in getGroupRoles(item)"
                :key="role.id"
                color="primary"
                variant="tonal"
                size="small"
                label
              >
                {{ role.name }}
              </VChip>
            </template>
            <span
              v-else
              class="text-medium-emphasis"
            >-</span>
          </div>
        </template>

        <!-- Активен -->
        <template #item.isActive="{ item }">
          <div class="d-flex align-center gap-2">
            <VSwitch
              :model-value="item.isActive"
              :disabled="statusLoading.includes(item.id)"
              color="primary"
              hide-details
              @update:model-value="(val) => toggleStatus(item, val as boolean)"
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
            <IconBtn @click="editGroup(item)">
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn @click="deleteGroup(item)">
              <VIcon icon="bx-trash" />
            </IconBtn>
          </div>
        </template>
      </VDataTable>

      <!-- Пагинация -->
      <div class="d-flex justify-center mt-4 pb-4">
        <VPagination
          :model-value="currentPage"
          :length="Math.ceil(agentsGroups.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
          @update:model-value="updatePage"
        />
      </div>
    </template>

    <!-- Диалог удаления -->
    <VDialog
      v-model="deleteDialog"
      max-width="500px"
    >
      <VCard title="Вы уверены, что хотите удалить эту группу?">
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
              :loading="editedItem ? deleteLoading.includes(editedItem!.id) : false"
              @click="deleteItemConfirm"
            >
              Удалить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог редактирования/создания группы -->
    <AddEditGroupDialog
      v-model:is-dialog-visible="isEditDialogVisible"
      :group-detail="editingGroup"
      @group-updated="handleGroupUpdated"
    />
  </VCard>
</template>
