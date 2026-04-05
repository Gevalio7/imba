<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Props
const props = defineProps<{
  agentId: number | null
}>()

// Data
const isLoading = ref(true)
const activities = ref<Array<{
  id: string
  description: string
  timestamp: string
  details?: string
}>>([])

// Mock data for now
const mockActivities = [
  {
    id: '1',
    description: 'Создал обращение #TICK-00123',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    details: 'Создано новое обращение в системе поддержки'
  },
  {
    id: '2',
    description: 'Изменил статус обращения #TICK-00124',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    details: 'Статус изменен с "Открыто" на "В работе"'
  }
]

// Load activities
const loadActivities = async () => {
  try {
    isLoading.value = true
    // For now, use mock data
    activities.value = mockActivities
  } catch (error) {
    console.error('Error loading activities:', error)
  } finally {
    isLoading.value = false
  }
}

// Format relative time
const formatRelativeTime = (timestamp: string) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffMs = now.getTime() - time.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))

  if (diffMins < 60) {
    return `${diffMins} мин назад`
  } else {
    return `${Math.floor(diffMins / 60)} ч назад`
  }
}

onMounted(() => {
  loadActivities()
})
</script>

<template>
  <div v-if="isLoading" class="d-flex justify-center pa-4">
    <VProgressCircular indeterminate color="primary" />
  </div>

  <div v-else-if="activities.length > 0" class="pa-4">
    <h4 class="mb-4">Недавняя активность</h4>
    <div v-for="activity in activities" :key="activity.id" class="mb-3 pb-3 border-b">
      <div class="d-flex justify-space-between align-center">
        <span class="font-weight-medium">{{ activity.description }}</span>
        <span class="text-caption text-disabled">{{ formatRelativeTime(activity.timestamp) }}</span>
      </div>
      <p v-if="activity.details" class="text-body-2 mt-1">{{ activity.details }}</p>
    </div>
  </div>

  <div v-else class="text-center pa-4">
    <VIcon icon="bx-time" size="48" color="grey" class="mb-2" />
    <div class="text-h6 text-grey">Нет активности</div>
    <div class="text-body-2 text-grey">Агент еще не совершал действий в системе</div>
  </div>
</template>