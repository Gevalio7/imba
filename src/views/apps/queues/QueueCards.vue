<script setup lang="ts">
import girlUsingLaptop from '@images/pages/girl-using-laptop.png'

// Типы данных для Очередь
interface Queues {
  id: number
  name: string
  description: string
  maxTickets: number
  priority: number
  templateId: number | null
  templateName?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Props
interface Props {
  queues: Queues[]
  loading: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  edit: [queue: Queues]
  delete: [queue: Queues]
  add: []
}>()

const editQueue = (queue: Queues) => {
  emit('edit', queue)
}

const deleteQueue = (queue: Queues) => {
  emit('delete', queue)
}

const addNewQueue = () => {
  emit('add')
}
</script>

<template>
  <!-- Индикатор загрузки -->
  <div v-if="props.loading" class="d-flex justify-center pa-6">
    <VProgressCircular indeterminate color="primary" />
  </div>

  <VRow v-else>
    <!-- 👉 Queues -->
    <VCol
      v-for="queue in props.queues"
      :key="queue.id"
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard>
        <VCardText class="d-flex align-center pb-4">
          <div class="text-body-1">
            Очередь {{ queue.isActive ? 'активна' : 'не активна' }}
          </div>

          <VSpacer />

          <VChip
            :color="queue.isActive ? 'success' : 'error'"
            size="small"
          >
            {{ queue.isActive ? 'Активна' : 'Не активна' }}
          </VChip>
        </VCardText>

        <VCardText>
          <div class="d-flex justify-space-between align-center">
            <div>
              <h5 class="text-h5 mb-1">
                {{ queue.name }}
              </h5>
              <div class="text-body-2 mb-1">
                Шаблон: {{ queue.templateName || 'Не указан' }}
              </div>
              <div class="text-body-2 mb-1">
                Макс. тикетов: {{ queue.maxTickets }}
              </div>
              <div class="text-body-2 mb-1">
                Приоритет: {{ queue.priority }}
              </div>
              <div class="d-flex align-center">
                <a
                  href="javascript:void(0)"
                  @click="editQueue(queue)"
                >
                  Редактировать
                </a>
              </div>
            </div>
            <IconBtn class="align-self-end" @click="deleteQueue(queue)">
              <VIcon
                icon="bx-trash"
                class="text-error"
              />
            </IconBtn>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 Add New Queue -->
    <VCol
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard
        class="h-100"
        :ripple="false"
      >
        <VRow
          no-gutters
          class="h-100"
        >
          <VCol
            cols="6"
            class="d-flex flex-column justify-end align-center mt-5"
          >
            <img
              width="105"
              :src="girlUsingLaptop"
            >
          </VCol>

          <VCol cols="6">
            <VCardText class="d-flex flex-column align-end justify-end gap-4">
              <VBtn
                size="small"
                @click="addNewQueue"
              >
                Добавить очередь
              </VBtn>
              <div class="text-end">
                Добавить новую очередь,<br> если она не существует.
              </div>
            </VCardText>
          </VCol>
        </VRow>
      </VCard>
    </VCol>
  </VRow>
</template>
