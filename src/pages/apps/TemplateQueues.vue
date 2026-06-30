<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import QueueCards from '@/views/apps/queues/QueueCards.vue'
import TemplateCards from '@/views/apps/template-queues/TemplateCards.vue'
import { useEntityCrud } from '@/composables/useEntityCrud'
import { $api } from '@/utils/api'

// Типы данных для Шаблон (не extends BaseEntity — совместимость с TemplateCards)
interface Templates {
  id: number
  name: string
  message: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  [key: string]: any
}

// Типы данных для Очередь (не extends BaseEntity — совместимость с QueueCards)
interface Queues {
  id: number
  name: string
  description: string
  maxTickets: number
  priority: number
  templateId: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  companyId: number | null
  serviceId: number | null
  slaId: number | null
  workflowId: number | null
  agentGroupId: number | null
  priorityId: number | null
  emailConfig: { host: string; port: number; username: string; password: string; useSSL: boolean } | null
  keywords: string[]
  autoResponseTemplate: string
  [key: string]: any
}

// ======== Шаблоны (useEntityCrud) ========
const {
  items: templates,
  loading: templatesLoading,
  error: templatesError,
  fetchItems: fetchTemplates,
  editDialog: templatesEditDialog,
  deleteDialog: templatesDeleteDialog,
  editedItem: editedTemplatesItem,
  editedIndex: editedTemplatesIndex,
  selectedItems: templatesSelectedItems,
  isBulkActionsMenuOpen: templatesBulkActionsMenuOpen,
  isBulkDeleteDialogOpen: isTemplatesBulkDeleteDialogOpen,
  isBulkStatusDialogOpen: isTemplatesBulkStatusDialogOpen,
  bulkStatusValue: templatesBulkStatusValue,
  bulkDelete: templatesBulkDelete,
  bulkChangeStatus: templatesBulkChangeStatus,
  confirmBulkDelete: confirmTemplatesBulkDelete,
  confirmBulkStatusChange: confirmTemplatesBulkStatusChange,
  resolveStatusVariant,
  toggleStatus: toggleTemplatesStatus,
  hasActiveFilters: templatesHasActiveFilters,
  currentPage: templatesCurrentPage,
  itemsPerPage: templatesItemsPerPage,
  searchQuery: templatesSearchQuery,
  statusFilter: templatesStatusFilter,
  isFilterDialogOpen: templatesFilterDialogOpen,
  clearFilters: clearTemplatesFilters,
  filteredItems: filteredTemplates,
  editItem: editTemplatesItem,
  deleteItem: deleteTemplatesItem,
  close: closeTemplates,
  closeDelete: closeTemplatesDelete,
  save: saveTemplates,
  deleteItemConfirm: deleteTemplatesItemConfirm,
  statusOptions,
} = useEntityCrud<Templates>({
  endpoint: '/templates',
  itemName: 'шаблоны',
  defaultItem: {
    id: -1,
    name: '',
    message: '',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
})

// ======== Очереди (useEntityCrud) ========
const {
  items: queues,
  loading: queuesLoading,
  error: queuesError,
  fetchItems: fetchQueues,
  editDialog: queuesEditDialog,
  deleteDialog: queuesDeleteDialog,
  editedItem: editedQueuesItem,
  editedIndex: editedQueuesIndex,
  selectedItems: queuesSelectedItems,
  isBulkActionsMenuOpen: queuesBulkActionsMenuOpen,
  isBulkDeleteDialogOpen: isQueuesBulkDeleteDialogOpen,
  isBulkStatusDialogOpen: isQueuesBulkStatusDialogOpen,
  bulkStatusValue: queuesBulkStatusValue,
  bulkDelete: queuesBulkDelete,
  bulkChangeStatus: queuesBulkChangeStatus,
  confirmBulkDelete: confirmQueuesBulkDelete,
  confirmBulkStatusChange: confirmQueuesBulkStatusChange,
  toggleStatus: toggleQueuesStatus,
  hasActiveFilters: queuesHasActiveFilters,
  currentPage: queuesCurrentPage,
  itemsPerPage: queuesItemsPerPage,
  searchQuery: queuesSearchQuery,
  statusFilter: queuesStatusFilter,
  isFilterDialogOpen: queuesFilterDialogOpen,
  clearFilters: clearQueuesFilters,
  filteredItems: baseFilteredQueues,
  editItem: editQueuesItem,
  deleteItem: deleteQueuesItem,
  close: closeQueues,
  closeDelete: closeQueuesDelete,
  save: saveQueues,
  deleteItemConfirm: deleteQueuesItemConfirm,
} = useEntityCrud<Queues>({
  endpoint: '/queues',
  itemName: 'очереди',
  defaultItem: {
    id: -1,
    name: '',
    description: '',
    maxTickets: 0,
    priority: 0,
    templateId: null,
    companyId: null,
    serviceId: null,
    slaId: null,
    workflowId: null,
    agentGroupId: null,
    priorityId: null,
    emailConfig: null,
    keywords: [],
    autoResponseTemplate: '',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
})

// Справочники для новых полей
interface Companies { id: number; name: string }
interface Services { id: number; name: string }
interface Sla { id: number; name: string }
interface Workflows { id: number; name: string }
interface Priorities { id: number; name: string; value: number }

const companies = ref<Companies[]>([])
const services = ref<Services[]>([])
const slaList = ref<Sla[]>([])
const workflows = ref<Workflows[]>([])
const prioritiesList = ref<Priorities[]>([])
const agentsGroups = ref<any[]>([])

const fetchCompanies = async () => {
  try {
    const data = await $api(`/customers`)
    companies.value = data.customers || []
  }
  catch (err) {
    console.log('Error fetching companies:', err)
  }
}

const fetchServices = async () => {
  try {
    const data = await $api(`/services`)
    services.value = data.services || []
  }
  catch (err) {
    console.log('Error fetching services:', err)
  }
}

const fetchSla = async () => {
  try {
    const data = await $api(`/sla`)
    slaList.value = data.sla || []
  }
  catch (err) {
    console.log('Error fetching SLA:', err)
  }
}

const fetchWorkflows = async () => {
  try {
    const data = await $api(`/workflows`)
    workflows.value = data.workflows || []
  }
  catch (err) {
    console.log('Error fetching workflows:', err)
  }
}

const fetchPriorities = async () => {
  try {
    const data = await $api(`/priorities`)
    prioritiesList.value = data.priorities || []
  }
  catch (err) {
    console.log('Error fetching priorities:', err)
  }
}

const fetchAgentsGroups = async () => {
  try {
    const data = await $api(`/agentsGroups`)
    agentsGroups.value = data.agentsGroups || []
  }
  catch (err) {
    console.log('Error fetching agentsGroups:', err)
  }
}

// Инициализация
onMounted(() => {
  fetchTemplates()
  fetchQueues()
  fetchCompanies()
  fetchServices()
  fetchSla()
  fetchWorkflows()
  fetchPriorities()
  fetchAgentsGroups()
})

// Headers для шаблонов
const templatesHeaders = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Сообщение', key: 'message', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Headers для очередей
const queuesHeaders = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Описание', key: 'description', sortable: true },
  { title: 'Макс. тикетов', key: 'maxTickets', sortable: true },
  { title: 'Приоритет', key: 'priority', sortable: true },
  { title: 'Шаблон', key: 'templateName', sortable: false },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Фильтрация очередей (с добавлением templateName)
const filteredQueues = computed(() => {
  return baseFilteredQueues.value.map(queue => ({
    ...queue,
    templateName: templates.value.find(t => t.id === queue.templateId)?.name || 'Не указан',
  })) as Queues[]
})

// Опции шаблонов для выбора
const templateOptions = computed(() => {
  return templates.value.map(t => ({ title: t.name, value: t.id }))
})

// Опции для новых полей
const companyOptions = computed(() => companies.value.map(c => ({ title: c.name, value: c.id })))
const serviceOptions = computed(() => services.value.map(s => ({ title: s.name, value: s.id })))
const slaOptions = computed(() => slaList.value.map(s => ({ title: s.name, value: s.id })))
const workflowOptions = computed(() => workflows.value.map(w => ({ title: w.name, value: w.id })))
const priorityIdOptions = computed(() => prioritiesList.value.map(p => ({ title: p.name, value: p.id })))
const agentsGroupsOptions = computed(() => agentsGroups.value.map((ag: any) => ({ title: ag.name, value: ag.id })))

// Значения по умолчанию для добавления новых элементов
const defaultTemplatesItem: Templates = { id: -1, name: '', message: '', isActive: true, createdAt: '', updatedAt: '' }
const defaultQueuesItem: Queues = {
  id: -1, name: '', description: '', maxTickets: 0, priority: 0,
  templateId: null, companyId: null, serviceId: null, slaId: null,
  workflowId: null, agentGroupId: null, priorityId: null,
  emailConfig: null, keywords: [], autoResponseTemplate: '', isActive: true,
  createdAt: '', updatedAt: '',
}

// Добавление новых элементов (с проверкой прав)
const addNewTemplates = () => {
  editedTemplatesItem.value = { ...defaultTemplatesItem }
  editedTemplatesIndex.value = -1
  templatesEditDialog.value = true
}

const addNewQueues = () => {
  editedQueuesItem.value = { ...defaultQueuesItem }
  editedQueuesIndex.value = -1
  queuesEditDialog.value = true
}

// Переключатель вида шаблонов (карточки/таблица)
const templatesViewMode = ref<'cards' | 'table'>('cards')

// Переключатель вида очередей (карточки/таблица)
const queuesViewMode = ref<'cards' | 'table'>('table')

// Функция для удаления HTML-тегов
const stripHtmlTags = (html: string) => {
  return html.replace(/<[^>]*>/g, '')
}

// Для ключевых слов
const newKeyword = ref('')

const addKeyword = () => {
  if (newKeyword.value.trim() && !editedQueuesItem.value.keywords?.includes(newKeyword.value.trim())) {
    if (!editedQueuesItem.value.keywords)
      editedQueuesItem.value.keywords = []

    editedQueuesItem.value.keywords.push(newKeyword.value.trim())
    newKeyword.value = ''
  }
}

const removeKeyword = (index: number) => {
  if (editedQueuesItem.value.keywords)
    editedQueuesItem.value.keywords.splice(index, 1)
}

// Для email конфига
const emailConfig = ref({
  host: '',
  port: 587,
  username: '',
  password: '',
  useSSL: false,
})

// Синхронизация emailConfig с editedQueuesItem
watch(() => editedQueuesItem.value.emailConfig, newVal => {
  if (newVal)
    emailConfig.value = { ...newVal }
}, { deep: true })

watch(emailConfig, newVal => {
  editedQueuesItem.value.emailConfig = { ...newVal }
}, { deep: true })
</script>

<template>
  <VRow>
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        Шаблоны и Очереди
      </h4>
      <p class="text-body-1 mb-0">
        Управление шаблонами и очередями тикетов. Каждая очередь может быть связана с одним шаблоном.
      </p>
    </VCol>

    <!-- Шаблоны -->
    <VCol cols="12">
      <div class="d-flex justify-space-between align-center mb-1">
        <div>
          <h4 class="text-h4 mb-1">
            Шаблоны
          </h4>
          <p class="text-body-1 mb-0">
            Шаблоны предоставляют доступ к предопределенным сообщениям и настройкам, чтобы в зависимости от назначенного шаблона администратор имел доступ к тому, что ему нужно.
          </p>
        </div>
        <VBtnToggle
          v-model="templatesViewMode"
          mandatory
          variant="outlined"
          divided
        >
          <VBtn
            value="cards"
            icon="bx-grid-alt"
          />
          <VBtn
            value="table"
            icon="bx-list-ul"
          />
        </VBtnToggle>
      </div>
    </VCol>

    <!-- Карточный вид -->
    <VCol
      v-if="templatesViewMode === 'cards'"
      cols="12"
    >
      <TemplateCards
        :templates="filteredTemplates"
        :loading="templatesLoading"
        @edit="editTemplatesItem"
        @delete="deleteTemplatesItem"
        @add="addNewTemplates"
        @toggle-status="toggleTemplatesStatus"
      />
    </VCol>

    <!-- Табличный вид -->
    <VCol
      v-else
      cols="12"
    >
      <VCard title="Шаблоны">
        <!-- Индикатор загрузки -->
        <div
          v-if="templatesLoading"
          class="d-flex justify-center pa-6"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>

        <!-- Сообщение об ошибке -->
        <div
          v-else-if="templatesError"
          class="d-flex justify-center pa-6"
        >
          <VAlert
            type="error"
            class="ma-4"
          >
            {{ templatesError }}
          </VAlert>
        </div>

        <div
          v-else
          class="d-flex flex-wrap gap-4 pa-6"
        >
          <div class="d-flex align-center">
            <!-- Поиск -->
            <AppTextField
              v-model="templatesSearchQuery"
              placeholder="Поиск шаблонов"
              style="inline-size: 250px;"
              class="me-3"
            />
          </div>

          <!-- Кнопка фильтра -->
          <VBtn
            variant="tonal"
            color="secondary"
            :prepend-icon="templatesHasActiveFilters ? 'bx-x' : 'bx-filter'"
            @click="templatesHasActiveFilters ? clearTemplatesFilters() : templatesFilterDialogOpen = true"
          >
            {{ templatesHasActiveFilters ? 'Сбросить фильтр' : 'Фильтр' }}
          </VBtn>

          <!-- Кнопка массовых действий -->
          <VMenu
            v-model="templatesBulkActionsMenuOpen"
            :close-on-content-click="false"
          >
            <template #activator="{ props }">
              <VBtn
                variant="tonal"
                color="secondary"
                prepend-icon="bx-dots-vertical-rounded"
                :disabled="templatesSelectedItems.length === 0"
                v-bind="props"
              >
                Действия ({{ templatesSelectedItems.length }})
              </VBtn>
            </template>
            <VList>
              <VListItem
                @click="() => {
                  templatesBulkDelete()
                  templatesBulkActionsMenuOpen = false
                }"
              >
                <VListItemTitle>Удалить</VListItemTitle>
              </VListItem>
              <VListItem
                @click="() => {
                  templatesBulkChangeStatus()
                  templatesBulkActionsMenuOpen = false
                }"
              >
                <VListItemTitle>Изменить статус</VListItemTitle>
              </VListItem>
            </VList>
          </VMenu>

          <VSpacer />
          <div class="d-flex gap-4 flex-wrap align-center">
            <AppSelect
              v-model="templatesItemsPerPage"
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
              v-if="$can('write', 'menu_templates')"
              color="primary"
              prepend-icon="bx-plus"
              @click="addNewTemplates"
            >
              Добавить шаблон
            </VBtn>
          </div>
        </div>

        <!-- Диалог фильтров шаблонов -->
        <VDialog
          v-model="templatesFilterDialogOpen"
          max-width="500px"
        >
          <VCard title="Фильтры">
            <VCardText>
              <VRow>
                <VCol cols="12">
                  <AppSelect
                    v-model="templatesStatusFilter"
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
                  @click="clearTemplatesFilters"
                >
                  Сбросить
                </VBtn>
                <VBtn
                  color="error"
                  variant="outlined"
                  @click="templatesFilterDialogOpen = false"
                >
                  Отмена
                </VBtn>
                <VBtn
                  color="success"
                  variant="elevated"
                  @click="templatesFilterDialogOpen = false"
                >
                  Применить
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VDialog>

        <!-- Диалог массового удаления шаблонов -->
        <VDialog
          v-model="isTemplatesBulkDeleteDialogOpen"
          max-width="500px"
        >
          <VCard title="Подтверждение удаления">
            <VCardText>
              Вы уверены, что хотите удалить выбранные шаблоны? Это действие нельзя отменить.
            </VCardText>
            <VCardText>
              <div class="d-flex justify-end gap-4">
                <VBtn
                  color="error"
                  variant="outlined"
                  @click="isTemplatesBulkDeleteDialogOpen = false"
                >
                  Отмена
                </VBtn>
                <VBtn
                  color="success"
                  variant="elevated"
                  @click="confirmTemplatesBulkDelete"
                >
                  Удалить
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VDialog>

        <!-- Диалог массового изменения статуса шаблонов -->
        <VDialog
          v-model="isTemplatesBulkStatusDialogOpen"
          max-width="500px"
        >
          <VCard title="Изменить статус">
            <VCardText>
              <AppSelect
                v-model="templatesBulkStatusValue"
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
                  @click="isTemplatesBulkStatusDialogOpen = false"
                >
                  Отмена
                </VBtn>
                <VBtn
                  color="success"
                  variant="elevated"
                  @click="confirmTemplatesBulkStatusChange"
                >
                  Применить
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VDialog>

        <VDivider />

        <!-- Таблица шаблонов -->
        <VDataTable
          v-model="templatesSelectedItems"
          v-model:items-per-page="templatesItemsPerPage"
          v-model:page="templatesCurrentPage"
          :headers="templatesHeaders"
          :items="filteredTemplates"
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
                color="primary"
                hide-details
                @update:model-value="(val: boolean | null) => toggleTemplatesStatus(item, val)"
              />
              <VChip
                v-bind="resolveStatusVariant(item.isActive)"
                density="compact"
                label
                size="small"
              />
            </div>
          </template>

          <!-- Сообщение -->
          <template #item.message="{ item }">
            {{ stripHtmlTags(item.message) }}
          </template>

          <!-- Действия -->
          <template #item.actions="{ item }">
            <div class="d-flex gap-1">
              <IconBtn
                v-if="$can('write', 'menu_templates')"
                @click="editTemplatesItem(item)"
              >
                <VIcon icon="bx-edit" />
              </IconBtn>
              <IconBtn
                v-if="$can('delete', 'menu_templates')"
                @click="deleteTemplatesItem(item)"
              >
                <VIcon icon="bx-trash" />
              </IconBtn>
            </div>
          </template>
        </VDataTable>

        <!-- Пагинация шаблонов -->
        <div class="d-flex justify-center mt-4 pb-4">
          <VPagination
            v-model="templatesCurrentPage"
            :length="Math.ceil(filteredTemplates.length / templatesItemsPerPage) || 1"
            :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
          />
        </div>
      </VCard>
    </VCol>

    <!-- Очереди -->
    <VCol cols="12">
      <div class="d-flex justify-space-between align-center mb-1 mt-6">
        <div>
          <h4 class="text-h4 mb-1">
            Очереди
          </h4>
          <p class="text-body-1 mb-0">
            Найдите все очереди вашей компании и их связанные шаблоны.
          </p>
        </div>
        <VBtnToggle
          v-model="queuesViewMode"
          mandatory
          variant="outlined"
          divided
        >
          <VBtn
            value="cards"
            icon="bx-grid-alt"
          />
          <VBtn
            value="table"
            icon="bx-list-ul"
          />
        </VBtnToggle>
      </div>
    </VCol>

    <!-- Карточный вид очередей -->
    <VCol
      v-if="queuesViewMode === 'cards'"
      cols="12"
    >
      <QueueCards
        :queues="filteredQueues"
        :loading="queuesLoading"
        @edit="editQueuesItem"
        @delete="deleteQueuesItem"
        @add="addNewQueues"
        @toggle-status="toggleQueuesStatus"
      />
    </VCol>

    <!-- Табличный вид очередей -->
    <VCol
      v-else
      cols="12"
    >
      <VCard title="Очереди">
        <!-- Индикатор загрузки -->
        <div
          v-if="queuesLoading"
          class="d-flex justify-center pa-6"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>

        <!-- Сообщение об ошибке -->
        <div
          v-else-if="queuesError"
          class="d-flex justify-center pa-6"
        >
          <VAlert
            type="error"
            class="ma-4"
          >
            {{ queuesError }}
          </VAlert>
        </div>

        <div
          v-else
          class="d-flex flex-wrap gap-4 pa-6"
        >
          <div class="d-flex align-center">
            <!-- Поиск -->
            <AppTextField
              v-model="queuesSearchQuery"
              placeholder="Поиск очередей"
              style="inline-size: 250px;"
              class="me-3"
            />
          </div>

          <!-- Кнопка фильтра -->
          <VBtn
            variant="tonal"
            color="secondary"
            :prepend-icon="queuesHasActiveFilters ? 'bx-x' : 'bx-filter'"
            @click="queuesHasActiveFilters ? clearQueuesFilters() : queuesFilterDialogOpen = true"
          >
            {{ queuesHasActiveFilters ? 'Сбросить фильтр' : 'Фильтр' }}
          </VBtn>

          <!-- Кнопка массовых действий -->
          <VMenu
            v-model="queuesBulkActionsMenuOpen"
            :close-on-content-click="false"
          >
            <template #activator="{ props }">
              <VBtn
                variant="tonal"
                color="secondary"
                prepend-icon="bx-dots-vertical-rounded"
                :disabled="queuesSelectedItems.length === 0"
                v-bind="props"
              >
                Действия ({{ queuesSelectedItems.length }})
              </VBtn>
            </template>
            <VList>
              <VListItem
                @click="() => {
                  queuesBulkDelete()
                  queuesBulkActionsMenuOpen = false
                }"
              >
                <VListItemTitle>Удалить</VListItemTitle>
              </VListItem>
              <VListItem
                @click="() => {
                  queuesBulkChangeStatus()
                  queuesBulkActionsMenuOpen = false
                }"
              >
                <VListItemTitle>Изменить статус</VListItemTitle>
              </VListItem>
            </VList>
          </VMenu>

          <VSpacer />
          <div class="d-flex gap-4 flex-wrap align-center">
            <AppSelect
              v-model="queuesItemsPerPage"
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
              v-if="$can('write', 'menu_queues')"
              color="primary"
              prepend-icon="bx-plus"
              @click="addNewQueues"
            >
              Добавить очередь
            </VBtn>
          </div>
        </div>

        <!-- Диалог фильтров очередей -->
        <VDialog
          v-model="queuesFilterDialogOpen"
          max-width="500px"
        >
          <VCard title="Фильтры">
            <VCardText>
              <VRow>
                <VCol cols="12">
                  <AppSelect
                    v-model="queuesStatusFilter"
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
                  @click="clearQueuesFilters"
                >
                  Сбросить
                </VBtn>
                <VBtn
                  color="error"
                  variant="outlined"
                  @click="queuesFilterDialogOpen = false"
                >
                  Отмена
                </VBtn>
                <VBtn
                  color="success"
                  variant="elevated"
                  @click="queuesFilterDialogOpen = false"
                >
                  Применить
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VDialog>

        <!-- Диалог массового удаления очередей -->
        <VDialog
          v-model="isQueuesBulkDeleteDialogOpen"
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
                  @click="isQueuesBulkDeleteDialogOpen = false"
                >
                  Отмена
                </VBtn>
                <VBtn
                  color="success"
                  variant="elevated"
                  @click="confirmQueuesBulkDelete"
                >
                  Удалить
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VDialog>

        <!-- Диалог массового изменения статуса очередей -->
        <VDialog
          v-model="isQueuesBulkStatusDialogOpen"
          max-width="500px"
        >
          <VCard title="Изменить статус">
            <VCardText>
              <AppSelect
                v-model="queuesBulkStatusValue"
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
                  @click="isQueuesBulkStatusDialogOpen = false"
                >
                  Отмена
                </VBtn>
                <VBtn
                  color="success"
                  variant="elevated"
                  @click="confirmQueuesBulkStatusChange"
                >
                  Применить
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VDialog>

        <VDivider />

        <!-- Таблица очередей -->
        <VDataTable
          v-model="queuesSelectedItems"
          v-model:items-per-page="queuesItemsPerPage"
          v-model:page="queuesCurrentPage"
          :headers="queuesHeaders"
          :items="filteredQueues"
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
                color="primary"
                hide-details
                @update:model-value="(val: boolean | null) => toggleQueuesStatus(item, val)"
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
                @click="editQueuesItem(item)"
              >
                <VIcon icon="bx-edit" />
              </IconBtn>
              <IconBtn
                v-if="$can('delete', 'menu_queues')"
                @click="deleteQueuesItem(item)"
              >
                <VIcon icon="bx-trash" />
              </IconBtn>
            </div>
          </template>
        </VDataTable>

        <!-- Пагинация очередей -->
        <div class="d-flex justify-center mt-4 pb-4">
          <VPagination
            v-model="queuesCurrentPage"
            :length="Math.ceil(filteredQueues.length / queuesItemsPerPage) || 1"
            :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
          />
        </div>
      </VCard>
    </VCol>

    <!-- Диалог редактирования шаблона -->
    <VDialog
      v-model="templatesEditDialog"
      max-width="600px"
    >
      <VCard :title="editedTemplatesIndex > -1 ? 'Редактировать шаблон' : 'Добавить шаблон'">
        <VCardText>
          <VRow>
            <!-- Название -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedTemplatesItem.name"
                label="Название *"
              />
            </VCol>

            <!-- Сообщение -->
            <VCol cols="12">
              <label class="v-label">Сообщение</label>
              <TiptapEditor
                v-model="editedTemplatesItem.message"
                placeholder="Введите сообщение..."
                style="border: 1px solid #ccc; border-radius: 4px; min-block-size: 200px;"
              />
            </VCol>

            <!-- Активен -->
            <VCol
              cols="12"
              sm="6"
            >
              <VSwitch
                v-model="editedTemplatesItem.isActive"
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
              @click="closeTemplates"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="saveTemplates"
            >
              Сохранить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог удаления шаблона -->
    <VDialog
      v-model="templatesDeleteDialog"
      max-width="500px"
    >
      <VCard title="Вы уверены, что хотите удалить этот шаблон?">
        <VCardText>
          <div class="d-flex justify-center gap-4">
            <VBtn
              color="error"
              variant="outlined"
              @click="closeTemplatesDelete"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="deleteTemplatesItemConfirm"
            >
              Удалить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог редактирования очереди -->
    <VDialog
      v-model="queuesEditDialog"
      max-width="800px"
    >
      <VCard :title="editedQueuesIndex > -1 ? 'Редактировать очередь' : 'Добавить очередь'">
        <VCardText>
          <VRow>
            <!-- Название -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedQueuesItem.name"
                label="Название *"
              />
            </VCol>

            <!-- Шаблон -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedQueuesItem.templateId"
                :items="templateOptions"
                label="Шаблон"
                clearable
                placeholder="Выберите шаблон"
              />
            </VCol>

            <!-- Компания -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedQueuesItem.companyId"
                :items="companyOptions"
                label="Компания"
                clearable
                placeholder="Выберите компанию"
              />
            </VCol>

            <!-- Сервис -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedQueuesItem.serviceId"
                :items="serviceOptions"
                label="Сервис"
                clearable
                placeholder="Выберите сервис"
              />
            </VCol>

            <!-- SLA -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedQueuesItem.slaId"
                :items="slaOptions"
                label="SLA"
                clearable
                placeholder="Выберите SLA"
              />
            </VCol>

            <!-- Workflow -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedQueuesItem.workflowId"
                :items="workflowOptions"
                label="Workflow"
                clearable
                placeholder="Выберите Workflow"
              />
            </VCol>

            <!-- Группа агентов -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedQueuesItem.agentGroupId"
                :items="agentsGroupsOptions"
                label="Группа агентов"
                clearable
                placeholder="Выберите группу агентов"
              />
            </VCol>

            <!-- Приоритет (связь) -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedQueuesItem.priorityId"
                :items="priorityIdOptions"
                label="Приоритет"
                clearable
                placeholder="Выберите приоритет"
              />
            </VCol>

            <!-- Описание -->
            <VCol cols="12">
              <AppTextarea
                v-model="editedQueuesItem.description"
                label="Описание"
                rows="3"
                placeholder="Введите описание..."
              />
            </VCol>

            <!-- Макс. тикетов -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedQueuesItem.maxTickets"
                label="Макс. тикетов"
                type="number"
                min="0"
              />
            </VCol>

            <!-- Приоритет (число) -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedQueuesItem.priority"
                label="Приоритет (число)"
                type="number"
                min="0"
              />
            </VCol>

            <!-- Ключевые слова -->
            <VCol cols="12">
              <AppSelect
                v-model="editedQueuesItem.keywords"
                :items="[]"
                label="Ключевые слова"
                placeholder="Введите ключевые слова"
                multiple
                chips
                clearable
                :manual-filter="true"
                @update:model-value="(val: string[]) => editedQueuesItem.keywords = val"
              />
              <VTextField
                v-model="newKeyword"
                label="Добавить ключевое слово"
                placeholder="Нажмите Enter для добавления"
                class="mt-2"
                @keydown.enter.prevent="addKeyword"
              >
                <template #append-inner>
                  <VBtn
                    variant="text"
                    size="small"
                    @click="addKeyword"
                  >
                    Добавить
                  </VBtn>
                </template>
              </VTextField>
              <div
                v-if="editedQueuesItem.keywords?.length"
                class="mt-2"
              >
                <VChip
                  v-for="(keyword, index) in editedQueuesItem.keywords"
                  :key="index"
                  closable
                  class="ma-1"
                  @click:close="removeKeyword(index)"
                >
                  {{ keyword }}
                </VChip>
              </div>
            </VCol>

            <!-- Шаблон автоответа -->
            <VCol cols="12">
              <AppTextarea
                v-model="editedQueuesItem.autoResponseTemplate"
                label="Шаблон автоответа"
                rows="4"
                placeholder="Введите шаблон автоответа..."
              />
            </VCol>

            <!-- Email настройки -->
            <VCol cols="12">
              <VCard
                variant="outlined"
                class="pa-4"
              >
                <h4 class="mb-4">
                  Настройки email
                </h4>
                <VRow>
                  <VCol
                    cols="12"
                    sm="6"
                  >
                    <AppTextField
                      v-model="emailConfig.host"
                      label="SMTP хост"
                      placeholder="smtp.example.com"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    sm="6"
                  >
                    <AppTextField
                      v-model="emailConfig.port"
                      label="SMTP порт"
                      type="number"
                      placeholder="587"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    sm="6"
                  >
                    <AppTextField
                      v-model="emailConfig.username"
                      label="SMTP пользователь"
                      placeholder="user@example.com"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    sm="6"
                  >
                    <AppTextField
                      v-model="emailConfig.password"
                      label="SMTP пароль"
                      type="password"
                      placeholder="******"
                    />
                  </VCol>
                  <VCol cols="12">
                    <VSwitch
                      v-model="emailConfig.useSSL"
                      label="Использовать SSL/TLS"
                      color="primary"
                    />
                  </VCol>
                </VRow>
              </VCard>
            </VCol>

            <!-- Активен -->
            <VCol
              cols="12"
              sm="6"
            >
              <VSwitch
                v-model="editedQueuesItem.isActive"
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
              @click="closeQueues"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="saveQueues"
            >
              Сохранить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог удаления очереди -->
    <VDialog
      v-model="queuesDeleteDialog"
      max-width="500px"
    >
      <VCard title="Вы уверены, что хотите удалить эту очередь?">
        <VCardText>
          <div class="d-flex justify-center gap-4">
            <VBtn
              color="error"
              variant="outlined"
              @click="closeQueuesDelete"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="deleteQueuesItemConfirm"
            >
              Удалить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </VRow>

</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}
</style>
