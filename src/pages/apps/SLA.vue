<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { $api } from '@/utils/api'
import { useEntityCrud, type BaseEntity } from '@/composables/useEntityCrud'

// Типы данных для SLA
interface SLA extends BaseEntity {
  name: string
  description: string
  responseTime: number
  resolutionTime: number
  solutionTime: number
  minIncidentTime: number
  responseNotification: number
  updateNotification: number
  solutionNotification: number
  calendarId?: number
  calendarName?: string
  serviceIds?: number[]
  serviceNames?: string[]
}

// Универсальный CRUD
const {
  items: sLA,
  loading,
  error,
  fetchItems: fetchSLA,
  editDialog,
  deleteDialog,
  editedItem,
  editedIndex,
  currentPage,
  itemsPerPage,
  statusFilter,
  filteredItems: filteredSLA,
  clearFilters,
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
  isFilterDialogOpen,
  editItem,
  deleteItem,
  close: closeEdit,
  closeDelete,
  deleteItemConfirm,
  addNewItem: addNewSLA,
  save: saveSLA,
} = useEntityCrud<SLA>({
  endpoint: '/sla',
  itemName: 'sla',
  defaultItem: {
    id: -1,
    name: '',
    description: '',
    responseTime: 15,
    resolutionTime: 240,
    solutionTime: 480,
    minIncidentTime: 10,
    responseNotification: 20,
    updateNotification: 80,
    solutionNotification: 80,
    calendarId: undefined,
    calendarName: '',
    serviceIds: [],
    serviceNames: [],
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
})

// Справочники
interface CalendarItem {
  id: number
  name: string
}

interface ServiceItem {
  id: number
  name: string
}

const calendars = ref<CalendarItem[]>([])
const services = ref<ServiceItem[]>([])

// Загрузка справочников
const fetchCalendars = async () => {
  try {
    const data = await $api<{ calendars: CalendarItem[] }>('/calendars')
    calendars.value = data.calendars || []
  }
  catch (err) {
    console.error('Error fetching calendars:', err)
  }
}

const fetchServices = async () => {
  try {
    const data = await $api<{ services: ServiceItem[] }>('/services')
    services.value = data.services || []
  }
  catch (err) {
    console.error('Error fetching services:', err)
  }
}

onMounted(async () => {
  await Promise.all([fetchCalendars(), fetchServices()])
  fetchSLA()
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Описание', key: 'description', sortable: true },
  { title: 'Эскалация - время первого ответа (мин)', key: 'responseTime', sortable: true },
  { title: 'Эскалация - время обновления (мин)', key: 'resolutionTime', sortable: true },
  { title: 'Эскалация - время решения (мин)', key: 'solutionTime', sortable: true },
  { title: 'Мин. время между инцидентами (мин)', key: 'minIncidentTime', sortable: true },
  { title: 'Календарь', key: 'calendarName', sortable: true },
  { title: 'Сервисы', key: 'serviceNames', sortable: false },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Фильтрация — используем встроенную из composable (фильтр по статусу)
// filteredSLA уже алиасится из filteredItems в деструктуризации

// Форматирование сервисов для отображения
const formatServices = (serviceNames?: string[]) => {
  if (!serviceNames || serviceNames.length === 0)
    return '-'

  return serviceNames.join(', ')
}
</script>

<template>
  <div>
    <VCard title="SLA">
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
            placeholder="Поиск sla"
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
          <!-- Экспорт -->
          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="bx-export"
          >
            Экспорт
          </VBtn>

          <VBtn
            v-if="$can('write', 'menu_sla')"
            color="primary"
            prepend-icon="bx-plus"
            @click="addNewSLA"
          >
            Добавить sla
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
            Вы уверены, что хотите удалить выбранные sla? Это действие нельзя отменить.
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
        :headers="headers"
        :items="filteredSLA"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Календарь -->
        <template #item.calendarName="{ item }">
          {{ item.calendarName || '-' }}
        </template>

        <!-- Сервисы -->
        <template #item.serviceNames="{ item }">
          {{ formatServices(item.serviceNames) }}
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
              v-if="$can('write', 'menu_sla')"
              @click="editItem(item)"
            >
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn
              v-if="$can('delete', 'menu_sla')"
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
          :length="Math.ceil(filteredSLA.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования / создания SLA -->
    <VDialog
      v-model="editDialog"
      max-width="800px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать SLA' : 'Добавить SLA'">
        <VCardText>
          <VRow>
            <VCol cols="12" md="8">
              <AppTextField
                v-model="editedItem.name"
                label="Название *"
                :rules="[(v: string) => !!v || 'Обязательное поле']"
              />
            </VCol>
            <VCol cols="12" md="4">
              <VSwitch
                v-model="editedItem.isActive"
                :label="editedItem.isActive ? 'Активен' : 'Не активен'"
                color="primary"
              />
            </VCol>
          </VRow>

          <VRow>
            <VCol cols="12">
              <AppTextField
                v-model="editedItem.description"
                label="Описание"
                type="textarea"
              />
            </VCol>
          </VRow>

          <VRow>
            <VCol cols="12" md="4">
              <AppTextField
                v-model.number="editedItem.responseTime"
                label="Время первого ответа (мин)"
                type="number"
              />
            </VCol>
            <VCol cols="12" md="4">
              <AppTextField
                v-model.number="editedItem.resolutionTime"
                label="Время обновления (мин)"
                type="number"
              />
            </VCol>
            <VCol cols="12" md="4">
              <AppTextField
                v-model.number="editedItem.solutionTime"
                label="Время решения (мин)"
                type="number"
              />
            </VCol>
          </VRow>

          <VRow>
            <VCol cols="12" md="6">
              <AppSelect
                v-model="editedItem.calendarId"
                :items="calendars.map(c => ({ title: c.name, value: c.id }))"
                label="Календарь"
                clearable
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppSelect
                v-model="editedItem.serviceIds"
                :items="services.map(s => ({ title: s.name, value: s.id }))"
                label="Сервисы"
                multiple
                chips
              />
            </VCol>
          </VRow>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            color="error"
            variant="outlined"
            @click="closeEdit"
          >
            Отмена
          </VBtn>
          <VBtn
            color="success"
            variant="elevated"
            @click="saveSLA"
          >
            Сохранить
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Диалог удаления -->
    <VDialog
      v-model="deleteDialog"
      max-width="500px"
    >
      <VCard title="Вы уверены, что хотите удалить этот sla?">
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


</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}
</style>
