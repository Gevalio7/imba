<script setup lang="ts">
import { $fetch } from 'ofetch'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

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
  { title: 'Агентов', key: 'agents', sortable: false },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Функция для определения варианта статуса
const resolveStatusVariant = (isActive: boolean) => {
  if (isActive)
    return { color: 'primary', text: 'Активен' }
  else
    return { color: 'error', text: 'Не активен' }
}

const editGroup = (group: AgentsGroups) => {
  router.push(`/apps/settings/users-groups-roles/AgentsGroupsEdit?id=${group.id}`)
}

const deleteGroup = (group: AgentsGroups) => {
  editedIndex.value = props.agentsGroups.indexOf(group)
  editedItem.value = { ...group }
  deleteDialog.value = true
}

const addNewGroup = () => {
  router.push('/apps/settings/users-groups-roles/AgentsGroupsEdit')
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

const toggleStatus = async (group: AgentsGroups, newValue: boolean) => {
  const previousValue = group.isActive

  try {
    // Добавляем в загрузку
    statusLoading.value.push(group.id)

    // Оптимистично обновляем локальное состояние
    group.isActive = newValue

    // Отправляем на сервер
    await $fetch(`${API_BASE}/agentsGroups/${group.id}`, {
      method: 'PUT',
      body: { isActive: newValue }
    })

    // Показываем уведомление об успехе
    showToast(`Статус группы "${group.name}" изменен на "${newValue ? 'Активна' : 'Не активна'}"`)
  } catch (err) {
    console.error('Error toggling status:', err)
    // Откатываем при ошибке
    group.isActive = previousValue
    showToast('Ошибка изменения статуса группы', 'error')
  } finally {
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

      await $fetch(`${API_BASE}/agentsGroups/${deletedGroupId}`, {
        method: 'DELETE'
      })

      // Только эмитим событие - не изменяем пропсы напрямую!
      emit('group-updated')
      closeDelete()
      showToast('Группа успешно удалена')
    }
  } catch (err) {
    console.error('Error deleting group:', err)
    showToast('Ошибка удаления группы', 'error')
  } finally {
    if (editedItem.value) {
      deleteLoading.value = deleteLoading.value.filter(id => id !== editedItem.value.id)
    }
  }
}

// Отслеживание изменений выбранных элементов
watch(() => props.selectedItems, (newValue) => {
  console.log('Selected items:', newValue)
}, { deep: true })
</script>

<template>
  <VCard>
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
      <!-- Таблица групп -->
      <VDataTable
        :model-value="selectedItems"
        @update:model-value="updateSelectedItems"
        :items-per-page="itemsPerPage"
        @update:items-per-page="updateItemsPerPage"
        :page="currentPage"
        @update:page="updatePage"
        :headers="headers"
        :items="agentsGroups"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
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
                  <span class="text-no-wrap" style="color: #666;">{{ agent.firstName?.[0] || '' }}{{ agent.lastName?.[0] || '' }}</span>
                </VAvatar>
              </template>
              <VAvatar
                v-if="item.agents.length > 3"
                :color="$vuetify.theme.current.dark ? '#373B50' : '#EEEDF0'"
                size="32"
                class="text-caption font-weight-medium"
              >
                <span class="text-no-wrap" style="color: #666;">+{{ item.agents.length - 3 }}</span>
              </VAvatar>
            </div>
            <span class="ml-2">{{ item.agents.length }} агентов</span>
          </div>
        </template>

        <!-- Активен -->
        <template #item.isActive="{ item }">
          <div class="d-flex align-center gap-2">
            <VSwitch
              :model-value="item.isActive"
              :disabled="statusLoading.includes(item.id)"
              @update:model-value="(val) => toggleStatus(item, val as boolean)"
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
          @update:model-value="updatePage"
          :length="Math.ceil(agentsGroups.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
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
              :loading="editedItem && deleteLoading.includes(editedItem.id)"
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
  </VCard>
</template>
