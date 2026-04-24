<template>
  <VAlert
    v-if="selectedSla || responseDeadline || resolutionDeadline"
    type="info"
    variant="tonal"
    density="compact"
    class="mt-2"
  >
    <div class="text-body-2">
      <div v-if="selectedSla?.responseTime">
        <strong>Время первого ответа:</strong> {{ formatSlaTime(selectedSla.responseTime, true) }}
      </div>
      <div v-if="responseDeadline">
        <strong>Срок ответа:</strong> {{ formatDeadline(responseDeadline) }}
      </div>
      <div v-if="selectedSla?.solutionTime">
        <strong>Время решения:</strong> {{ formatSlaTime(selectedSla.solutionTime, false) }}
      </div>
      <div v-if="resolutionDeadline">
        <strong>Срок решения:</strong> {{ formatDeadline(resolutionDeadline) }}
      </div>
      <div v-if="!selectedSla && !responseDeadline && !resolutionDeadline" class="text-body-2 text-medium-emphasis">
        SLA не установлен
      </div>
    </div>
  </VAlert>
</template>

<script setup lang="ts">
import { formatSlaTime, formatDeadline } from '@/utils/slaFormatter'

interface Props {
  selectedSla?: any
  responseDeadline?: string
  resolutionDeadline?: string
}

defineProps<Props>()
</script>