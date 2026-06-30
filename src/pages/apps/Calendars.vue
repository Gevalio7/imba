<script setup lang="ts">
import EntityList, { type EntityListHeader } from '@/components/EntityList.vue'
import type { BaseEntity } from '@/composables/useEntityCrud'

definePage({
  meta: {
    navActiveLink: 'apps-calendars',
    action: 'read',
    subject: 'menu_calendars',
  },
})

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

const headers: EntityListHeader[] = [
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

const timezoneOptions = [
  { text: 'UTC', value: 'UTC' },
  { text: 'Europe/Moscow', value: 'Europe/Moscow' },
  { text: 'Europe/London', value: 'Europe/London' },
  { text: 'America/New_York', value: 'America/New_York' },
  { text: 'Asia/Tokyo', value: 'Asia/Tokyo' },
  { text: 'Asia/Shanghai', value: 'Asia/Shanghai' },
  { text: 'Australia/Sydney', value: 'Australia/Sydney' },
]

const toDateInputValue = (dateStr: string | null) => {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0]
}
</script>

<template>
  <div>
    <EntityList
      :config="{
        endpoint: '/calendars',
        itemName: 'календари',
        defaultItem: {
          id: -1, name: '', description: '', timezone: '',
          workHoursFrom: '', workHoursTo: '', workDaysPerWeek: 5, color: '',
          dateFrom: null, dateTo: null,
          createdAt: '', updatedAt: '', isActive: true,
        },
      }"
      :headers="headers"
      :subject="'menu_calendars'"
      :title="'Календари'"
      add-button-label="Добавить календарь"
      :edit-dialog-title-create="'Добавить календарь'"
      :edit-dialog-title-edit="'Редактировать календарь'"
      search-placeholder="Поиск календарей"
      show-export
      show-items-per-page
      show-status-filter
      show-edit-dialog
      show-delete-dialog
      edit-dialog-max-width="700px"
    >
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

      <!-- Кастомная форма редактирования -->
      <template #edit-form="{ editedItem, save, close }">
        <VRow>
          <VCol cols="12" sm="6">
            <AppTextField v-model="editedItem.name" label="Название *" />
          </VCol>
          <VCol cols="12">
            <AppTextarea
              v-model="editedItem.description"
              label="Описание"
              rows="3"
              placeholder="Введите описание..."
            />
          </VCol>
          <VCol cols="12" sm="6">
            <AppSelect
              v-model="editedItem.timezone"
              :items="timezoneOptions"
              item-title="text"
              item-value="value"
              label="Часовой пояс"
              placeholder="Выберите часовой пояс"
            />
          </VCol>
          <VCol cols="12" sm="6">
            <AppTextField
              v-model="editedItem.workHoursFrom"
              label="Рабочие часы с"
              type="time"
            />
          </VCol>
          <VCol cols="12" sm="6">
            <AppTextField
              v-model="editedItem.workHoursTo"
              label="Рабочие часы по"
              type="time"
            />
          </VCol>
          <VCol cols="12" sm="6">
            <AppTextField
              v-model.number="editedItem.workDaysPerWeek"
              label="Дней в неделю"
              type="number"
              :min="3"
              :max="7"
            />
          </VCol>
          <VCol cols="12" sm="6">
            <input
              v-model="editedItem.color"
              type="color"
            >
          </VCol>
          <VCol cols="12" sm="6">
            <AppTextField
              :model-value="toDateInputValue(editedItem.dateFrom)"
              label="Дата с"
              type="date"
              @update:model-value="editedItem.dateFrom = $event"
            />
          </VCol>
          <VCol cols="12" sm="6">
            <AppTextField
              :model-value="toDateInputValue(editedItem.dateTo)"
              label="Дата по"
              type="date"
              @update:model-value="editedItem.dateTo = $event"
            />
          </VCol>
          <VCol cols="12" sm="6">
            <VSwitch
              v-model="editedItem.isActive"
              label="Активен"
              color="primary"
            />
          </VCol>
        </VRow>
        <div class="self-align-end d-flex gap-4 justify-end mt-4">
          <VBtn color="error" variant="outlined" @click="close">Отмена</VBtn>
          <VBtn color="success" variant="elevated" @click="save">Сохранить</VBtn>
        </div>
      </template>
    </EntityList>
  </div>
</template>
