<script setup lang="ts">
import EntityList, { type EntityListHeader } from '@/components/EntityList.vue'
import type { BaseEntity } from '@/composables/useEntityCrud'
import { $api } from '@/utils/api'

interface EmailAddresses extends BaseEntity {
  name: string
  message: string
  queueId: number | null
}

interface Queue {
  id: number
  name: string
  description: string
  maxTickets: number
  priority: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

definePage({
  meta: {
    action: 'read',
    subject: 'menu_email_addresses',
  },
})

const headers: EntityListHeader[] = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Адрес электронной почты', key: 'name', sortable: true },
  { title: 'Отображаемое имя', key: 'message', sortable: true },
  { title: 'Очередь', key: 'queueId', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Данные очередей для селекта в форме
const queues = ref<Queue[]>([])

const fetchQueues = async () => {
  try {
    const data = await $api<{ queues: Queue[]; total: number }>('/queues')
    queues.value = data.queues
  }
  catch (err) {
    console.error('Error fetching queues:', err)
  }
}

const getQueueName = (queueId: number | null) => {
  if (!queueId) return '-'
  const queue = queues.value.find(q => q.id === queueId)
  return queue ? queue.name : '-'
}
</script>

<template>
  <EntityList
    :config="{
      endpoint: '/emailAddresses',
      itemName: 'email адреса',
      defaultItem: {
        id: -1,
        name: '',
        message: '',
        queueId: null,
        createdAt: '',
        updatedAt: '',
        isActive: true,
      },
    }"
    :headers="headers"
    title="Email адреса"
    subject="menu_email_addresses"
    add-button-label="Добавить email адрес"
    edit-dialog-title-create="Добавить email адрес"
    edit-dialog-title-edit="Редактировать email адрес"
    search-placeholder="Поиск email адреса"
    @mounted="fetchQueues"
  >
    <!-- Кастомная колонка: название очереди -->
    <template #item.queueId="{ item }">
      {{ getQueueName((item as EmailAddresses).queueId) }}
    </template>

    <!-- Кастомная форма редактирования -->
    <template #edit-form="{ editedItem, close, save }">
      <VRow>
        <VCol
          cols="12"
          sm="6"
        >
          <AppTextField
            v-model="editedItem.name"
            label="Адрес электронной почты *"
          />
        </VCol>

        <VCol cols="12">
          <AppTextarea
            v-model="editedItem.message"
            label="Отображаемое имя"
            rows="3"
            placeholder="Введите отображаемое имя..."
          />
        </VCol>

        <VCol
          cols="12"
          sm="6"
        >
          <AppSelect
            v-model="editedItem.queueId"
            label="Очередь"
            :items="queues.map(q => ({ title: q.name, value: q.id }))"
            item-title="title"
            item-value="value"
            clearable
            clear-icon="bx-x"
            placeholder="Выберите очередь"
          />
        </VCol>

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

      <div class="self-align-end d-flex gap-4 justify-end mt-4">
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
