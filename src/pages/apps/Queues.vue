<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { type ColumnSetting } from '@/composables/useFilters'
import type { BaseEntity } from '@/composables/useEntityCrud'
import EntityList, { type EntityListHeader } from '@/components/EntityList.vue'
import { $api } from '@/utils/api'

definePage({ meta: { navActiveLink: 'apps-queues', action: 'read', subject: 'menu_queues' } })

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

const entityListRef = ref<any>(null)
const router = useRouter()
const route = useRoute()

// === Доступные колонки для настройки ===
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

const visibleHeaders = computed<EntityListHeader[]>(() => {
  return columnSettings.value.filter(col => col.visible).map(col => ({
    title: col.title,
    key: col.key,
    sortable: col.sortable,
  }))
})

watch(columnSettings, newSettings => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings)) }
  catch (e) { console.error('Error saving column settings:', e) }
}, { deep: true })

const moveColumnUp = (index: number) => {
  if (index <= 0) return
  const temp = columnSettings.value[index]
  columnSettings.value[index] = columnSettings.value[index - 1]
  columnSettings.value[index - 1] = temp
}

const moveColumnDown = (index: number) => {
  if (index >= columnSettings.value.length - 1) return
  const temp = columnSettings.value[index]
  columnSettings.value[index] = columnSettings.value[index + 1]
  columnSettings.value[index + 1] = temp
}

const resetColumnSettings = () => {
  columnSettings.value = availableColumns.map(col => ({ ...col, visible: true }))
}

// === Справочники ===
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

const referenceData = ref<ReferenceData>({
  services: [], sla: [], workflows: [], agentGroups: [],
  priorities: [], customers: [], customersGroups: [], agents: [],
  types: [], typeCategories: [], postMasterMailAccounts: [], templates: [],
})

const fetchReferenceData = async () => {
  try {
    const data = await $api<ReferenceData>('/referenceData')
    Object.assign(referenceData.value, data)
  }
  catch (err) {
    console.error('Error fetching reference data:', err)
  }
}

const getServiceName = (id: number | null) => id ? referenceData.value.services.find(s => s.id === id)?.name || '-' : '-'
const getSlaName = (id: number | null) => id ? referenceData.value.sla.find(s => s.id === id)?.name || '-' : '-'
const getWorkflowName = (id: number | null) => id ? referenceData.value.workflows.find(w => w.id === id)?.name || '-' : '-'
const getAgentGroupName = (id: number | null) => id ? referenceData.value.agentGroups.find(g => g && g.id === id)?.name || '-' : '-'
const getPriorityName = (id: number | null) => id ? referenceData.value.priorities.find(p => p && p.id === id)?.name || '-' : '-'
const getPriorityColor = (id: number | null) => id ? referenceData.value.priorities.find(p => p && p.id === id)?.color || 'grey' : 'grey'
const getCompanyName = (id: number | null) => id ? referenceData.value.customers.find(c => c && c.id === id)?.name || '-' : '-'
const getDepartmentName = (id: number | null) => id ? referenceData.value.customersGroups.find(d => d && d.id === id)?.name || '-' : '-'
const getAgentNames = (ids: number[] | null) => !ids || ids.length === 0 ? '-' : ids.map(id => {
  const agent = referenceData.value.agents.find(a => a && a.id === id)
  return agent ? `${agent.firstName} ${agent.lastName}` : `Агент ${id}`
}).join(', ')
const getTypeName = (id: number | null) => id ? referenceData.value.types.find(t => t && t.id === id)?.name || '-' : '-'
const getCategoryName = (id: number | null) => id ? referenceData.value.typeCategories.find(c => c && c.id === id)?.name || '-' : '-'
const getPostMasterMailAccountName = (id: number | null) => id ? referenceData.value.postMasterMailAccounts.find(a => a && a.id === id)?.name || '-' : '-'
const getTemplateName = (id: number | null) => id ? referenceData.value.templates.find(t => t && t.id === id)?.name || '-' : '-'

// === Навигация ===
const editItem = (item: Queues) => router.push(`/apps/queues/${item.id}`)
const addNewQueues = () => router.push('/apps/queues/add')

// === Диалог настройки колонок ===
const isColumnsDialogOpen = ref(false)

// === Watcher для обновления при возврате с редактирования ===
let stopWatchRefresh: (() => void) | null = null

onMounted(() => {
  stopWatchRefresh = watch(() => route.query.refresh, newVal => {
    if (newVal) entityListRef.value?.fetchItems()
  })
})

onBeforeUnmount(() => {
  if (stopWatchRefresh) stopWatchRefresh()
})
</script>

<template>
  <div>
    <EntityList
      ref="entityListRef"
      :config="{
        endpoint: '/queues',
        itemName: 'очереди',
        defaultItem: {
          id: -1, name: '', description: '', companyId: null, serviceId: null,
          slaId: null, workflowId: null, priorityId: null, keywords: null,
          quickAnswerArticleIds: null, executorGroupIds: null, executorAgentIds: null,
          observerGroupIds: null, observerAgentIds: null, approverGroupIds: null,
          approverAgentIds: null, departmentId: null, typeId: null, categoryId: null,
          postMasterMailAccountId: null, templateOpenTicketId: null, templateCloseTicketId: null,
          templateConfirmTicketId: null, templateStatusChangeId: null, templateCommentTicketId: null,
          isActive: true,
        },
        customFilter: (item, query) => {
          const q = item as Queues
          return (q.name?.toLowerCase() || '').includes(query)
            || (q.description?.toLowerCase() || '').includes(query)
        },
      }"
      :headers="visibleHeaders"
      title="Очереди"
      subject="menu_queues"
      search-placeholder="Поиск очереди"
      :show-edit-dialog="false"
      @mounted="fetchReferenceData"
    >
      <!-- Кастомные колонки (все ~20) -->
      <template #item.serviceId="{ item }">{{ getServiceName((item as Queues).serviceId) }}</template>
      <template #item.slaId="{ item }">{{ getSlaName((item as Queues).slaId) }}</template>
      <template #item.workflowId="{ item }">{{ getWorkflowName((item as Queues).workflowId) }}</template>
      <template #item.companyId="{ item }">{{ getCompanyName((item as Queues).companyId) }}</template>
      <template #item.departmentId="{ item }">{{ getDepartmentName((item as Queues).departmentId) }}</template>
      <template #item.typeId="{ item }">{{ getTypeName((item as Queues).typeId) }}</template>
      <template #item.categoryId="{ item }">{{ getCategoryName((item as Queues).categoryId) }}</template>
      <template #item.postMasterMailAccountId="{ item }">{{ getPostMasterMailAccountName((item as Queues).postMasterMailAccountId) }}</template>

      <template #item.keywords="{ item }">
        <div v-if="(item as Queues).keywords" class="d-flex flex-wrap gap-1">
          <VChip v-for="keyword in (item as Queues).keywords!.split(',')" :key="keyword" size="small" color="primary" variant="flat" prepend-icon="bx-tag">
            {{ keyword.trim() }}
          </VChip>
        </div>
        <span v-else class="text-disabled">-</span>
      </template>

      <template #item.executorGroupIds="{ item }">
        {{ (item as Queues).executorGroupIds && (item as Queues).executorGroupIds!.length > 0 ? (item as Queues).executorGroupIds!.map(id => getAgentGroupName(id)).join(', ') : '-' }}
      </template>
      <template #item.executorAgentIds="{ item }">{{ getAgentNames((item as Queues).executorAgentIds) }}</template>
      <template #item.observerGroupIds="{ item }">
        {{ (item as Queues).observerGroupIds && (item as Queues).observerGroupIds!.length > 0 ? (item as Queues).observerGroupIds!.map(id => getAgentGroupName(id)).join(', ') : '-' }}
      </template>
      <template #item.observerAgentIds="{ item }">{{ getAgentNames((item as Queues).observerAgentIds) }}</template>
      <template #item.approverGroupIds="{ item }">
        {{ (item as Queues).approverGroupIds && (item as Queues).approverGroupIds!.length > 0 ? (item as Queues).approverGroupIds!.map(id => getAgentGroupName(id)).join(', ') : '-' }}
      </template>
      <template #item.approverAgentIds="{ item }">{{ getAgentNames((item as Queues).approverAgentIds) }}</template>

      <template #item.priorityId="{ item }">
        <VChip v-if="(item as Queues).priorityId" :color="getPriorityColor((item as Queues).priorityId)" size="small">
          {{ getPriorityName((item as Queues).priorityId) }}
        </VChip>
        <span v-else>-</span>
      </template>

      <template #item.templateOpenTicketId="{ item }">{{ getTemplateName((item as Queues).templateOpenTicketId) }}</template>
      <template #item.templateCloseTicketId="{ item }">{{ getTemplateName((item as Queues).templateCloseTicketId) }}</template>
      <template #item.templateConfirmTicketId="{ item }">{{ getTemplateName((item as Queues).templateConfirmTicketId) }}</template>
      <template #item.templateStatusChangeId="{ item }">{{ getTemplateName((item as Queues).templateStatusChangeId) }}</template>
      <template #item.templateCommentTicketId="{ item }">{{ getTemplateName((item as Queues).templateCommentTicketId) }}</template>

      <!-- Действия: навигация на отдельные страницы -->
      <template #item.actions="{ item }">
        <div class="d-flex gap-1">
          <IconBtn v-if="$can('write', 'menu_queues')" @click="editItem(item as Queues)">
            <VIcon icon="bx-edit" />
          </IconBtn>
          <IconBtn v-if="$can('delete', 'menu_queues')" @click="entityListRef?.deleteItem(item)">
            <VIcon icon="bx-trash" />
          </IconBtn>
        </div>
      </template>

      <!-- Доп. кнопки в тулбаре -->
      <template #toolbar-append>
        <VBtn variant="tonal" color="secondary" prepend-icon="bx-columns" @click="isColumnsDialogOpen = true">
          Колонки
        </VBtn>
        <VBtn v-if="$can('write', 'menu_queues')" color="primary" prepend-icon="bx-plus" @click="addNewQueues">
          Добавить очередь
        </VBtn>
      </template>
    </EntityList>

    <!-- Диалог настроек колонок -->
    <VDialog v-model="isColumnsDialogOpen" max-width="600px">
      <VCard title="Настройка колонок">
        <VCardText>
          <div class="d-flex justify-end mb-4">
            <VBtn variant="text" size="small" @click="resetColumnSettings">Сбросить</VBtn>
          </div>
          <VList>
            <VListItem v-for="(col, index) in columnSettings" :key="col.key" class="mb-1">
              <template #prepend>
                <VCheckbox v-model="col.visible" hide-details density="compact" />
              </template>
              <VListItemTitle>{{ col.title }}</VListItemTitle>
              <template #append>
                <div class="d-flex gap-1">
                  <IconBtn :disabled="index === 0" @click="moveColumnUp(index)"><VIcon icon="bx-chevron-up" /></IconBtn>
                  <IconBtn :disabled="index === columnSettings.length - 1" @click="moveColumnDown(index)"><VIcon icon="bx-chevron-down" /></IconBtn>
                </div>
              </template>
            </VListItem>
          </VList>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn @click="isColumnsDialogOpen = false">Закрыть</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
