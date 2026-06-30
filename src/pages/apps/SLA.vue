<script setup lang="ts">
import EntityList, { type EntityListHeader } from '@/components/EntityList.vue'
import type { BaseEntity } from '@/composables/useEntityCrud'
import { $api } from '@/utils/api'

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

interface CalendarItem {
  id: number
  name: string
}

interface ServiceItem {
  id: number
  name: string
}

definePage({
  meta: {
    action: 'read',
    subject: 'menu_sla',
  },
})

const headers: EntityListHeader[] = [
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

// Справочники
const calendars = ref<CalendarItem[]>([])
const services = ref<ServiceItem[]>([])

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

const formatServices = (serviceNames?: string[]) => {
  if (!serviceNames || serviceNames.length === 0) return '-'
  return serviceNames.join(', ')
}
</script>

<template>
  <EntityList
    :config="{
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
    }"
    :headers="headers"
    title="SLA"
    subject="menu_sla"
    add-button-label="Добавить SLA"
    edit-dialog-title-create="Добавить SLA"
    edit-dialog-title-edit="Редактировать SLA"
    search-placeholder="Поиск SLA"
    edit-dialog-max-width="800px"
    @mounted="() => { fetchCalendars(); fetchServices() }"
  >
    <!-- Кастомная колонка: сервисы -->
    <template #item.serviceNames="{ item }">
      {{ formatServices((item as SLA).serviceNames) }}
    </template>

    <!-- Кастомная форма редактирования (широкая) -->
    <template #edit-form="{ editedItem, close, save }">
      <VRow>
        <VCol
          cols="12"
          md="8"
        >
          <AppTextField
            v-model="editedItem.name"
            label="Название *"
            :rules="[(v: string) => !!v || 'Обязательное поле']"
          />
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
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
        <VCol
          cols="12"
          md="4"
        >
          <AppTextField
            v-model.number="editedItem.responseTime"
            label="Время первого ответа (мин)"
            type="number"
          />
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <AppTextField
            v-model.number="editedItem.resolutionTime"
            label="Время обновления (мин)"
            type="number"
          />
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <AppTextField
            v-model.number="editedItem.solutionTime"
            label="Время решения (мин)"
            type="number"
          />
        </VCol>
      </VRow>

      <VRow>
        <VCol
          cols="12"
          md="6"
        >
          <AppSelect
            v-model="editedItem.calendarId"
            :items="calendars.map(c => ({ title: c.name, value: c.id }))"
            label="Календарь"
            clearable
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <AppSelect
            v-model="editedItem.serviceIds"
            :items="services.map(s => ({ title: s.name, value: s.id }))"
            label="Сервисы"
            multiple
            chips
          />
        </VCol>
      </VRow>

      <div class="d-flex justify-end gap-4 mt-4">
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
    </template>
  </EntityList>
</template>
