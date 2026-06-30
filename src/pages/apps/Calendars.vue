<script setup lang="ts">
import { onMounted } from 'vue'
import { useEntityCrud, type BaseEntity } from '@/composables/useEntityCrud'

// Типы данных для Календарь
interface Calendars extends BaseEntity {
  name: string
  description: string
  timezone: string
  workHoursFrom: string
  workHoursTo: string
  workDaysPerWeek: number
  color: string
  dateFrom: string | null
  dateTo: string | null
}

// Универсальный CRUD
const {
  items: calendars,
  loading,
  error,
  fetchItems: fetchCalendars,
  editDialog,
  deleteDialog,
  editedItem,
  editedIndex,
  currentPage,
  itemsPerPage,
  statusFilter,
  filteredItems: filteredCalendars,
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
  clearFilters,
  deleteItem,
  close,
  closeDelete,
  deleteItemConfirm,
  addNewItem: addNewCalendars,
  save,
} = useEntityCrud<Calendars>({
  endpoint: '/calendars',
  itemName: 'календари',
  defaultItem: {
    id: -1,
    name: '',
    description: '',
    timezone: '',
    workHoursFrom: '',
    workHoursTo: '',
    workDaysPerWeek: 5,
    color: '',
    dateFrom: '',
    dateTo: '',
    createdAt: '',
    updatedAt: '',
    isActive: true,
  },
})

// === Инициализация ===
onMounted(() => fetchCalendars())

// === Заголовки таблицы ===
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Описание', key: 'description', sortable: true },
  { title: 'Часовой пояс', key: 'timezone', sortable: true },
  { title: 'Рабочие часы с', key: 'workHoursFrom', sortable: true },
  { title: 'Рабочие часы по', key: 'workHoursTo', sortable: true },
  { title: 'Дней в неделю', key: 'workDaysPerWeek', sortable: true },
  { title: 'Цвет', key: 'color', sortable: true },
  { title: 'Дата с', key: 'dateFrom', sortable: true },
  { title: 'Дата по', key: 'dateTo', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// === Опции часовых поясов ===
const timezoneOptions = [
  { text: 'UTC', value: 'UTC' },
  { text: 'Europe/Moscow', value: 'Europe/Moscow' },
  { text: 'Europe/London', value: 'Europe/London' },
  { text: 'America/New_York', value: 'America/New_York' },
  { text: 'Asia/Tokyo', value: 'Asia/Tokyo' },
  { text: 'Asia/Shanghai', value: 'Asia/Shanghai' },
  { text: 'Australia/Sydney', value: 'Australia/Sydney' },
]

// === Переопределяем editItem чтобы преобразовать даты ===
const editItem = (item: Calendars) => {
  editedIndex.value = calendars.value.indexOf(item)
  editedItem.value = {
    ...item,
    dateFrom: item.dateFrom ? new Date(item.dateFrom).toISOString().split('T')[0] : '',
    dateTo: item.dateTo ? new Date(item.dateTo).toISOString().split('T')[0] : '',
  }
  editDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="Календари">
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
            placeholder="Поиск календари"
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
            color="primary"
            prepend-icon="bx-plus"
            @click="addNewCalendars"
          >
            Добавить календарь
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
            Вы уверены, что хотите удалить выбранные календари? Это действие нельзя отменить.
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
        :items="filteredCalendars"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Рабочие часы с -->
        <template #item.workHoursFrom="{ item }">
          {{ item.workHoursFrom || '-' }}
        </template>

        <!-- Рабочие часы по -->
        <template #item.workHoursTo="{ item }">
          {{ item.workHoursTo || '-' }}
        </template>

        <!-- Дней в неделю -->
        <template #item.workDaysPerWeek="{ item }">
          {{ item.workDaysPerWeek || '-' }}
        </template>

        <!-- Цвет -->
        <template #item.color="{ item }">
          <VChip
            :color="item.color || 'primary'"
            density="compact"
            label
            size="small"
          >
            {{ item.color || 'primary' }}
          </VChip>
        </template>

        <!-- Дата с -->
        <template #item.dateFrom="{ item }">
          {{ item.dateFrom ? new Date(item.dateFrom).toLocaleDateString() : '-' }}
        </template>

        <!-- Дата по -->
        <template #item.dateTo="{ item }">
          {{ item.dateTo ? new Date(item.dateTo).toLocaleDateString() : '-' }}
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
              v-if="$can('write', 'menu_calendars')"
              @click="editItem(item)"
            >
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn
              v-if="$can('delete', 'menu_calendars')"
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
          :length="Math.ceil(filteredCalendars.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать календарь' : 'Добавить календарь'">
        <VCardText>
          <VRow>
            <!-- Название -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.name"
                label="Название *"
              />
            </VCol>

            <!-- Описание -->
            <VCol cols="12">
              <AppTextarea
                v-model="editedItem.description"
                label="Описание"
                rows="3"
                placeholder="Введите описание..."
              />
            </VCol>

            <!-- Часовой пояс -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.timezone"
                :items="timezoneOptions"
                item-title="text"
                item-value="value"
                label="Часовой пояс"
                placeholder="Выберите часовой пояс"
              />
            </VCol>

            <!-- Рабочие часы с -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.workHoursFrom"
                label="Рабочие часы с"
                type="time"
              />
            </VCol>

            <!-- Рабочие часы по -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.workHoursTo"
                label="Рабочие часы по"
                type="time"
              />
            </VCol>

            <!-- Дней в неделю -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model.number="editedItem.workDaysPerWeek"
                label="Дней в неделю"
                type="number"
                :min="3"
                :max="7"
              />
            </VCol>

            <!-- Цвет -->
            <VCol
              cols="12"
              sm="6"
            >
              <input
                v-model="editedItem.color"
                type="color"
                label="Цвет"
                placeholder="Выберите цвет"
              >
            </VCol>

            <!-- Дата с -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.dateFrom"
                label="Дата с"
                type="date"
              />
            </VCol>

            <!-- Дата по -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.dateTo"
                label="Дата по"
                type="date"
              />
            </VCol>

            <!-- Активен -->
            <VCol
              cols="12"
              sm="6"
            >
              <VSwitch
                v-model="editedItem.isActive"
                label="Активен"
                color="primary"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VCardText>
          <div class="self-align-end d-flex gap-4 justify-end">
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
      <VCard title="Вы уверены, что хотите удалить этот календарь?">
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
