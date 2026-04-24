<template>
  <div>
    <div
      v-if="loading"
      class="d-flex justify-center pa-6"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>
    <div
      v-else-if="items.length === 0"
      class="text-center text-medium-emphasis pa-6"
    >
      {{ emptyMessage }}
    </div>
    <div
      v-else
      class="history-list"
    >
      <div
        v-for="item in items"
        :key="item.id"
        class="history-item pa-3 mb-2 rounded border"
      >
        <!-- Для изменений -->
        <div v-if="type === 'changes'" class="d-flex justify-space-between align-start">
          <div>
            <div class="text-body-1 font-weight-medium">
              {{ item.fieldDisplayName }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ item.changedByName }} • {{ formatDate(item.createdAt) }}
            </div>
          </div>
          <div class="text-body-2">
            <span
              v-if="item.oldValue"
              class="text-error"
            >
              {{ item.oldValue }}
            </span>
            <VIcon
              icon="bx-arrow-right"
              size="16"
              class="mx-1"
            />
            <span
              v-if="item.newValue"
              class="text-success"
            >
              {{ item.newValue }}
            </span>
          </div>
        </div>

        <!-- Для согласования -->
        <div v-else-if="type === 'approval'" class="d-flex justify-space-between align-start">
          <div>
            <div class="text-body-1 font-weight-medium">
              {{ item.action || 'Согласование' }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ item.approverName || 'Система' }} • {{ formatDate(item.createdAt) }}
            </div>
          </div>
          <VChip
            :color="item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'error' : 'warning'"
            size="small"
          >
            {{ item.status === 'approved' ? 'Согласовано' : item.status === 'rejected' ? 'Отклонено' : 'Ожидает' }}
          </VChip>
        </div>
        <div
          v-if="item.comment"
          class="text-body-2 mt-2"
        >
          {{ item.comment }}
        </div>

        <!-- Для статусов -->
        <div v-else-if="type === 'status'" class="d-flex justify-space-between align-start">
          <div class="flex-grow-1">
            <div class="d-flex align-center gap-2 mb-1">
              <!-- Из статуса -->
              <VChip
                v-if="item.fromStatusName"
                :color="item.fromStatusColor || 'default'"
                size="small"
                density="compact"
              >
                {{ item.fromStatusName }}
              </VChip>
              <span v-else class="text-caption text-medium-emphasis">Новый</span>

              <!-- Стрелка -->
              <VIcon
                icon="bx-arrow-right"
                size="16"
                color="primary"
              />

              <!-- В статус -->
              <VChip
                :color="item.toStatusColor || 'primary'"
                size="small"
                density="compact"
              >
                {{ item.toStatusName }}
              </VChip>
            </div>

            <div class="text-caption text-medium-emphasis">
              {{ item.changedByName || 'Система' }} • {{ formatDate(item.transitionTime || item.createdAt) }}
            </div>

            <!-- Метка действия -->
            <div
              v-if="item.actionLabel"
              class="text-body-2 mt-1"
            >
              <VIcon icon="bx-label" size="14" class="me-1" />
              {{ item.actionLabel }}
            </div>
          </div>

          <!-- Время в статусе -->
          <div class="text-right">
            <div class="text-caption text-medium-emphasis">
              Время в статусе:
            </div>
            <div class="text-body-2 font-weight-medium">
              {{ formatTimeInStatus(item.timeInPreviousStatus) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/slaFormatter'

interface Props {
  items: any[]
  loading: boolean
  type: 'changes' | 'approval' | 'status'
  emptyMessage: string
}

defineProps<Props>()

// Функция форматирования интервала времени
const formatTimeInStatus = (interval: string | Record<string, number> | null) => {
  if (!interval) return '-'

  let days = 0
  let hours = 0
  let minutes = 0
  let seconds = 0

  // PostgreSQL pg driver возвращает interval как объект
  if (typeof interval === 'object') {
    days = interval.days || 0
    hours = interval.hours || 0
    minutes = interval.minutes || 0
    seconds = interval.seconds || 0
  }
  else if (typeof interval === 'string') {
    // Парсим PostgreSQL interval формат строки
    const match = interval.match(/(?:(\d+)\s*days?\s*)?(?:(\d+):(\d+):(\d+))?/)
    if (match) {
      days = parseInt(match[1] || '0')
      hours = parseInt(match[2] || '0')
      minutes = parseInt(match[3] || '0')
      seconds = parseInt(match[4] || '0')
    }
    else {
      return interval
    }
  }
  else {
    return '-'
  }

  const parts: string[] = []
  if (days > 0) parts.push(`${days} дн.`)
  if (hours > 0) parts.push(`${hours} ч.`)
  if (minutes > 0) parts.push(`${minutes} мин.`)
  if (seconds > 0 && parts.length === 0) parts.push(`${seconds} сек.`)

   return parts.length > 0 ? parts.join(' ') : 'менее 1 мин.'
}
</script>

<style lang="scss" scoped>
.history-list {
  max-block-size: 400px;
  overflow-y: auto;
}

.history-item {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.02);
  }
}
</style>