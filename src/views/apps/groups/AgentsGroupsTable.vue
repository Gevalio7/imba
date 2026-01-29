<script setup lang="ts">
import { $fetch } from 'ofetch'
import { ref, watch } from 'vue'

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
  toggleStatus: [group: AgentsGroups, newValue: boolean | null]
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
  editedIndex.value = props.agentsGroups.indexOf(group)
  editedItem.value = { ...group }
  editDialog.value = true
}

const deleteGroup = (group: AgentsGroups) => {
  editedIndex.value = props.agentsGroups.indexOf(group)
  editedItem.value = { ...group }
  deleteDialog.value = true
}

const addNewGroup = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}

const toggleStatus = async (group: AgentsGroups, newValue: boolean | null) => {
  if (newValue === null) return
  try {
    await $fetch(`${API_BASE}/agentsGroups/${group.id}`, {
      method: 'PUT',
      body: { ...group, isActive: newValue }
    })
    group.isActive = newValue
    emit('group-updated')
  } catch (err) {
    console.error('Error toggling status:', err)
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
const editDialog = ref(false)
const deleteDialog = ref(false)

const defaultItem = ref<AgentsGroups>({
  id: -1,
  name: '',
  agents: [],
  isActive: true,
  createdAt: '',
  updatedAt: '',
})

const editedItem = ref<AgentsGroups>({ ...defaultItem.value })
const editedIndex = ref(-1)

const close = () => {
  editDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
}

const closeDelete = () => {
  deleteDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
}

const save = async () => {
  if (!editedItem.value.name?.trim()) {
    return
  }

  try {
    if (editedIndex.value > -1) {
      // Обновление существующей группы
      await $fetch(`${API_BASE}/agentsGroups/${editedItem.value.id}`, {
        method: 'PUT',
        body: { ...editedItem.value, isActive: editedItem.value.isActive }
      })
    } else {
      // Создание новой группы
      await $fetch(`${API_BASE}/agentsGroups`, {
        method: 'POST',
        body: { ...editedItem.value, isActive: editedItem.value.isActive }
      })
    }
    emit('group-updated')
    close()
  } catch (err) {
    console.error('Error saving group:', err)
  }
}

const deleteItemConfirm = async () => {
  try {
    await $fetch(`${API_BASE}/agentsGroups/${editedItem.value.id}`, {
      method: 'DELETE'
    })
    emit('group-updated')
    closeDelete()
  } catch (err) {
    console.error('Error deleting group:', err)
  }
}

// Отслеживание изменений выбранных элементов
watch(() => props.selectedItems, (newValue) => {
  console.log('Selected items:', newValue)
}, { deep: true })
</script>

<template>
  <VCard title="Группы агентов">
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
              @update:model-value="(val) => toggleStatus(item, val)"
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

    <!-- Диалог редактирования/добавления -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать группу' : 'Добавить группу'">
        <VCardText>
          <VRow>
            <!-- Название -->
            <VCol cols="12">
              <AppTextField
                v-model="editedItem.name"
                label="Название *"
              />
            </VCol>

            <!-- Активен -->
            <VCol cols="12">
              <VSwitch
                v-model="editedItem.isActive"
                label="Активен"
                color="primary"
              />
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
              @click="deleteItemConfirm"
            >
              Удалить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </VCard>
</template>
