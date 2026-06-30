<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { type ColumnSetting } from '@/composables/useFilters'
import { useEntityCrud, type BaseEntity } from '@/composables/useEntityCrud'
import { $api } from '@/utils/api'

definePage({ meta: { navActiveLink: 'apps-queues', action: 'read', subject: 'menu_queues' } })

// Типы данных для Очередь
interface Queues extends BaseEntity {
  name: string
  description: string
  companyId: number | null
  serviceId: number | null
  slaId: number | null
  workflowId: number | null
  priorityId: number | null
  keywords: string | null
  quickAnswerArticleIds: number[] | null
  executorGroupIds: number[] | null
  executorAgentIds: number[] | null
  observerGroupIds: number[] | null
  observerAgentIds: number[] | null
  approverGroupIds: number[] | null
  approverAgentIds: number[] | null
  departmentId: number | null
  typeId: number | null
  categoryId: number | null
  postMasterMailAccountId: number | null
  templateOpenTicketId: number | null
  templateCloseTicketId: number | null
  templateConfirmTicketId: number | null
  templateStatusChangeId: number | null
  templateCommentTicketId: number | null
}

// Универсальный CRUD
const {
  items: queues,
  loading,
  error,
  fetchItems: fetchQueues,
  deleteDialog,
  editedItem,
  editedIndex,
  selectedItems,
  isBulkActionsMenuOpen,
  isBulkDeleteDialogOpen,
  isBulkStatusDialogOpen,
  bulkStatusValue,
  statusOptions,
  bulkDelete,
  bulkChangeStatus,
  confirmBulkDelete,
  confirmBulkStatusChange,
  resolveStatusVariant,
  toggleStatus,
  currentPage,
  itemsPerPage,
  searchQuery,
  statusFilter,
  isFilterDialogOpen,
  clearFilters,
  filteredItems: filteredQueues,
  deleteItem,
  closeDelete,
  deleteItemConfirm,
} = useEntityCrud<Queues>({
  endpoint: '/queues',
  itemName: 'очереди',
  defaultItem: {
    id: -1,
    name: '',
    description: '',
    companyId: null,
    serviceId: null,
    slaId: null,
    workflowId: null,
    priorityId: null,
    keywords: null,
    quickAnswerArticleIds: null,
    executorGroupIds: null,
    executorAgentIds: null,
    observerGroupIds: null,
    observerAgentIds: null,
    approverGroupIds: null,
    approverAgentIds: null,
    departmentId: null,
    typeId: null,
    categoryId: null,
    postMasterMailAccountId: null,
    templateOpenTicketId: null,
    templateCloseTicketId: null,
    templateConfirmTicketId: null,
    templateStatusChangeId: null,
    templateCommentTicketId: null,
    isActive: true,
  },
  customFilter: (item, query) => {
    return (item.name?.toLowerCase() || '').includes(query) ||
           (item.description?.toLowerCase() || '').includes(query)
  },
})

// Справочники для отображения названий вместо ID
interface ReferenceData {
  services: { id: number; name: string }[]
  sla: { id: number; name: string }[]
  workflows: { id: number; name: string }[]
  agentGroups: { id: number; name: string }[]
  priorities: { id: number; name: string; color: string }[]
  customers: { id: number; name: string }[]
  customersGroups: { id: number; name: string; customerId: number }[]
  agents: { id: number; firstName: string; lastName: string }[]
  types: { id: number; name: string }[]
  typeCategories: { id: number; name: string }[]
  postMasterMailAccounts: { id: number; name: string }[]
  templates: { id: number; name: string }[]
}

// Доступные колонки для настройки
const availableColumns: ColumnSetting[] = [
  { key: 'id', title: 'ID', visible: true, sortable: true, type: 'text' },
  { key: 'name', title: 'Название', visible: true, sortable: true, type: 'text' },
  { key: 'description', title: 'Описание', visible: true, sortable: true, type: 'text' },
  { key: 'companyId', title: 'Организация', visible: true, sortable: false, type: 'select' },
  { key: 'departmentId', title: 'Подразделение', visible: true, sortable: false, type: 'select' },
  { key: 'typeId', title: 'Тип', visible: true, sortable: false, type: 'select' },
  { key: 'categoryId', title: 'Категория', visible: true, sortable: false, type: 'select' },
  { key: 'postMasterMailAccountId', title: 'Почтовый аккаунт', visible: true, sortable: false, type: 'select' },
  { key: 'serviceId', title: 'Сервис', visible: true, sortable: false, type: 'select' },
  { key: 'slaId', title: 'SLA', visible: true, sortable: false, type: 'select' },
  { key: 'workflowId', title: 'Рабочий процесс', visible: true, sortable: false, type: 'select' },
  { key: 'priorityId', title: 'Приоритет (справочник)', visible: true, sortable: false, type: 'select' },
  { key: 'executorGroupIds', title: 'Группы исполнителей', visible: true, sortable: false, type: 'select' },
  { key: 'executorAgentIds', title: 'Исполнители', visible: true, sortable: false, type: 'select' },
  { key: 'observerGroupIds', title: 'Группы наблюдателей', visible: true, sortable: false, type: 'select' },
  { key: 'observerAgentIds', title: 'Наблюдатели', visible: true, sortable: false, type: 'select' },
  { key: 'approverGroupIds', title: 'Группы согласующих', visible: true, sortable: false, type: 'select' },
  { key: 'approverAgentIds', title: 'Согласующие', visible: true, sortable: false, type: 'select' },
  { key: 'keywords', title: 'Ключевые слова', visible: true, sortable: false, type: 'text' },
  { key: 'createdAt', title: 'Создано', visible: true, sortable: true, type: 'date' },
  { key: 'updatedAt', title: 'Изменено', visible: true, sortable: true, type: 'date' },
  { key: 'isActive', title: 'Активен', visible: true, sortable: false, type: 'boolean' },
  { key: 'actions', title: 'Действия', visible: true, sortable: false, type: 'text' },
]

// Загрузка/сохранение настроек колонок
const STORAGE_KEY = 'queues-columns-settings'

const loadColumnSettings = (): ColumnSetting[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as ColumnSetting[]

      return availableColumns.map(col => {
        const savedCol = parsed.find((s: ColumnSetting) => s.key === col.key)

        return savedCol ? { ...col, visible: savedCol.visible } : col
      })
    }
  }
  catch (e) {
    console.error('Error loading column settings:', e)
  }

  return [...availableColumns]
}

const columnSettings = ref<ColumnSetting[]>(loadColumnSettings())

// Вычисляемые заголовки на основе настроек колонок
const visibleHeaders = computed(() => {
  return columnSettings.value.filter(col => col.visible)
})

// Сохранение настроек колонок
watch(columnSettings, newSettings => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
  }
  catch (e) {
    console.error('Error saving column settings:', e)
  }
}, { deep: true })

// Методы для работы с колонками
const moveColumnUp = (index: number) => {
  if (index <= 0)
    return
  const temp = columnSettings.value[index]

  columnSettings.value[index] = columnSettings.value[index - 1]
  columnSettings.value[index - 1] = temp
}

const moveColumnDown = (index: number) => {
  if (index >= columnSettings.value.length - 1)
    return
  const temp = columnSettings.value[index]

  columnSettings.value[index] = columnSettings.value[index + 1]
  columnSettings.value[index + 1] = temp
}

const resetColumnSettings = () => {
  columnSettings.value = availableColumns.map(col => ({ ...col, visible: true }))
}

const referenceData = ref<ReferenceData>({
  services: [],
  sla: [],
  workflows: [],
  agentGroups: [],
  priorities: [],
  customers: [],
  customersGroups: [],
  agents: [],
  types: [],
  typeCategories: [],
  postMasterMailAccounts: [],
  templates: [],
})

const fetchReferenceData = async () => {
  try {
    const data = await $api<ReferenceData>(`/referenceData`)

    referenceData.value = {
      services: data.services || [],
      sla: data.sla || [],
      workflows: data.workflows || [],
      agentGroups: data.agentGroups || [],
      priorities: data.priorities || [],
      customers: data.customers || [],
      customersGroups: data.customersGroups || [],
      agents: data.agents || [],
      types: data.types || [],
      typeCategories: data.typeCategories || [],
      postMasterMailAccounts: data.postMasterMailAccounts || [],
      templates: data.templates || [],
    }
  }
  catch (err) {
    console.error('Error fetching reference data:', err)
    // Устанавливаем пустые массивы при ошибке
    referenceData.value = {
      services: [],
      sla: [],
      workflows: [],
      agentGroups: [],
      priorities: [],
      customers: [],
      customersGroups: [],
      agents: [],
      types: [],
      typeCategories: [],
      postMasterMailAccounts: [],
      templates: [],
    }
  }
}

const getServiceName = (id: number | null) => {
  if (!id)
    return '-'
  const service = referenceData.value.services.find(s => s.id === id)

  return service?.name || '-'
}

const getSlaName = (id: number | null) => {
  if (!id)
    return '-'
  const sla = referenceData.value.sla.find(s => s.id === id)

  return sla?.name || '-'
}

const getWorkflowName = (id: number | null) => {
  if (!id)
    return '-'
  const workflows = referenceData.value.workflows.find(w => w.id === id)

  return workflows?.name || '-'
}

const getAgentGroupName = (id: number | null) => {
  if (!id)
    return '-'
  const group = referenceData.value.agentGroups.find(g => g && g.id === id)

  return group?.name || '-'
}

const getPriorityName = (id: number | null) => {
  if (!id)
    return '-'
  const priority = referenceData.value.priorities.find(p => p && p.id === id)

  return priority?.name || '-'
}

const getPriorityColor = (id: number | null) => {
  if (!id)
    return 'grey'
  const priority = referenceData.value.priorities.find(p => p && p.id === id)

  return priority?.color || 'grey'
}

const getCompanyName = (id: number | null) => {
  if (!id)
    return '-'
  const company = referenceData.value.customers.find(c => c && c.id === id)

  return company?.name || '-'
}

const getDepartmentName = (id: number | null) => {
  if (!id)
    return '-'
  const department = referenceData.value.customersGroups.find(d => d && d.id === id)

  return department?.name || '-'
}

const getAgentNames = (ids: number[] | null) => {
  if (!ids || ids.length === 0)
    return '-'

  const names = ids.map(id => {
    const agent = referenceData.value.agents.find(a => a && a.id === id)

    return agent ? `${agent.firstName} ${agent.lastName}` : `Агент ${id}`
  })

  return names.join(', ')
}

const getTypeName = (id: number | null) => {
  if (!id)
    return '-'
  const type = referenceData.value.types.find(t => t && t.id === id)

  return type?.name || '-'
}

const getCategoryName = (id: number | null) => {
  if (!id)
    return '-'
  const category = referenceData.value.typeCategories.find(c => c && c.id === id)

  return category?.name || '-'
}

const getPostMasterMailAccountName = (id: number | null) => {
  if (!id)
    return '-'
  const account = referenceData.value.postMasterMailAccounts.find(a => a && a.id === id)

  return account?.name || '-'
}

const getTemplateName = (id: number | null) => {
  if (!id)
    return '-'
  const template = referenceData.value.templates.find(t => t && t.id === id)

  return template?.name || '-'
}

// Роутер
const router = useRouter()
const route = useRoute()

// Диалог настройки колонок
const isColumnsDialogOpen = ref(false)

// Watcher для обновления данных при возврате со страницы редактирования
let stopWatchRefresh: (() => void) | null = null

const editItem = (item: Queues) => {
  router.push(`/apps/queues/${item.id}`)
}

const addNewQueues = () => {
  router.push('/apps/queues/add')
}

// Инициализация и очистка
onMounted(async () => {
  await fetchReferenceData()
  await fetchQueues()

  // Настройка watcher с очисткой
  stopWatchRefresh = watch(() => route.query.refresh, newVal => {
    if (newVal) fetchQueues()
  })
})

onBeforeUnmount(() => {
  // Очищаем watcher при размонтировании
  if (stopWatchRefresh) {
    stopWatchRefresh()
  }
})
</script>

<template>
  <div>
    <VCard title="Очереди">
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

      <div
        v-else
        class="d-flex flex-wrap gap-4 pa-6"
      >
        <div class="d-flex align-center">
          <!-- Поиск -->
          <AppTextField
            v-model="searchQuery"
            placeholder="Поиск очереди"
            style="inline-size: 250px;"
            class="me-3"
            clearable
            clear-icon="bx-x"
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
              <VListItemTitle>Удалить</VListItemTitle>
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
          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="bx-columns"
            @click="isColumnsDialogOpen = true"
          >
            Колонки
          </VBtn>
          <!-- Экспорт -->
          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="bx-export"
          >
            Экспорт
          </VBtn>

          <VBtn
            v-if="$can('write', 'menu_queues')"
            color="primary"
            prepend-icon="bx-plus"
            @click="addNewQueues"
          >
            Добавить очередь
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
            Вы уверены, что хотите удалить выбранные очереди? Это действие нельзя отменить.
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

      <!-- Таблица -->
      <VDataTable
        v-model="selectedItems"
        v-model:items-per-page="itemsPerPage"
        v-model:page="currentPage"
        :headers="visibleHeaders"
        :items="filteredQueues"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Сервис -->
        <template #item.serviceId="{ item }">
          {{ getServiceName(item.serviceId) }}
        </template>

        <!-- SLA -->
        <template #item.slaId="{ item }">
          {{ getSlaName(item.slaId) }}
        </template>

        <!-- Рабочий процесс -->
        <template #item.workflowId="{ item }">
          {{ getWorkflowName(item.workflowId) }}
        </template>

        <!-- Организация -->
        <template #item.companyId="{ item }">
          {{ getCompanyName(item.companyId) }}
        </template>

        <!-- Подразделение -->
        <template #item.departmentId="{ item }">
          {{ getDepartmentName(item.departmentId) }}
        </template>

        <!-- Тип -->
        <template #item.typeId="{ item }">
          {{ getTypeName(item.typeId) }}
        </template>

        <!-- Категория -->
        <template #item.categoryId="{ item }">
          {{ getCategoryName(item.categoryId) }}
        </template>

        <!-- Ключевые слова -->
        <template #item.keywords="{ item }">
          <div
            v-if="item.keywords"
            class="d-flex flex-wrap gap-1"
          >
            <VChip
              v-for="keyword in item.keywords.split(',')"
              :key="keyword"
              size="small"
              color="primary"
              variant="flat"
              prepend-icon="bx-tag"
            >
              {{ keyword.trim() }}
            </VChip>
          </div>
          <span
            v-else
            class="text-disabled"
          >-</span>
        </template>

        <!-- Почтовый аккаунт -->
        <template #item.postMasterMailAccountId="{ item }">
          {{ getPostMasterMailAccountName(item.postMasterMailAccountId) }}
        </template>

        <!-- Группы исполнителей -->
        <template #item.executorGroupIds="{ item }">
          {{ item.executorGroupIds && item.executorGroupIds.length > 0 ? item.executorGroupIds.map(id => getAgentGroupName(id)).join(', ') : '-' }}
        </template>

        <!-- Исполнители -->
        <template #item.executorAgentIds="{ item }">
          {{ getAgentNames(item.executorAgentIds) }}
        </template>

        <!-- Группы наблюдателей -->
        <template #item.observerGroupIds="{ item }">
          {{ item.observerGroupIds && item.observerGroupIds.length > 0 ? item.observerGroupIds.map(id => getAgentGroupName(id)).join(', ') : '-' }}
        </template>

        <!-- Наблюдатели -->
        <template #item.observerAgentIds="{ item }">
          {{ getAgentNames(item.observerAgentIds) }}
        </template>

        <!-- Группы согласующих -->
        <template #item.approverGroupIds="{ item }">
          {{ item.approverGroupIds && item.approverGroupIds.length > 0 ? item.approverGroupIds.map(id => getAgentGroupName(id)).join(', ') : '-' }}
        </template>

        <!-- Согласующие -->
        <template #item.approverAgentIds="{ item }">
          {{ getAgentNames(item.approverAgentIds) }}
        </template>

        <!-- Приоритет (справочник) -->
        <template #item.priorityId="{ item }">
          <VChip
            v-if="item.priorityId"
            :color="getPriorityColor(item.priorityId)"
            size="small"
          >
            {{ getPriorityName(item.priorityId) }}
          </VChip>
          <span v-else>-</span>
        </template>

        <!-- Шаблон открытия -->
        <template #item.templateOpenTicketId="{ item }">
          {{ getTemplateName(item.templateOpenTicketId) }}
        </template>

        <!-- Шаблон закрытия -->
        <template #item.templateCloseTicketId="{ item }">
          {{ getTemplateName(item.templateCloseTicketId) }}
        </template>

        <!-- Шаблон подтверждения -->
        <template #item.templateConfirmTicketId="{ item }">
          {{ getTemplateName(item.templateConfirmTicketId) }}
        </template>

        <!-- Шаблон изменения статуса -->
        <template #item.templateStatusChangeId="{ item }">
          {{ getTemplateName(item.templateStatusChangeId) }}
        </template>

        <!-- Шаблон комментария -->
        <template #item.templateCommentTicketId="{ item }">
          {{ getTemplateName(item.templateCommentTicketId) }}
        </template>

        <!-- Активен -->
        <template #item.isActive="{ item }">
          <div class="d-flex align-center gap-2">
            <VSwitch
              :model-value="item.isActive"
              color="primary"
              hide-details
              @update:model-value="(val) => toggleStatus(item, val)"
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
            <IconBtn
              v-if="$can('write', 'menu_queues')"
              @click="editItem(item)"
            >
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn
              v-if="$can('delete', 'menu_queues')"
              @click="deleteItem(item)"
            >
              <VIcon icon="bx-trash" />
            </IconBtn>
          </div>
        </template>
      </VDataTable>

      <!-- Пагинация -->
      <div class="d-flex justify-center mt-4 pb-4">
        <VPagination
          v-model="currentPage"
          :length="Math.ceil(filteredQueues.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="deleteDialog"
      max-width="500px"
    >
      <VCard title="Вы уверены, что хотите удалить эту очередь?">
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
  </div>

  <!-- Диалог настроек колонок -->
  <VDialog
    v-model="isColumnsDialogOpen"
    max-width="600px"
  >
    <VCard title="Настройка колонок">
      <VCardText>
        <div class="d-flex justify-end mb-4">
          <VBtn
            variant="text"
            size="small"
            @click="resetColumnSettings"
          >
            Сбросить
          </VBtn>
        </div>
        <VList>
          <VListItem
            v-for="(col, index) in columnSettings"
            :key="col.key"
            class="mb-1"
          >
            <template #prepend>
              <VCheckbox
                v-model="col.visible"
                hide-details
                density="compact"
              />
            </template>
            <VListItemTitle>{{ col.title }}</VListItemTitle>
            <template #append>
              <div class="d-flex gap-1">
                <IconBtn
                  :disabled="index === 0"
                  @click="moveColumnUp(index)"
                >
                  <VIcon icon="bx-chevron-up" />
                </IconBtn>
                <IconBtn
                  :disabled="index === columnSettings.length - 1"
                  @click="moveColumnDown(index)"
                >
                  <VIcon icon="bx-chevron-down" />
                </IconBtn>
              </div>
            </template>
          </VListItem>
        </VList>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn @click="isColumnsDialogOpen = false">
          Закрыть
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>


</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}
</style>
