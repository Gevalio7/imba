<template>
  <div class="d-flex flex-wrap justify-start justify-sm-space-between gap-y-4 gap-x-6 mb-6">
    <div class="d-flex flex-column justify-center">
      <h4 class="text-h4 mb-1">
        Редактирование обращения
      </h4>
      <div
        v-if="ticket.ticketNumber"
        class="text-body-1"
      >
        #{{ ticket.ticketNumber }}
      </div>
    </div>

    <div class="d-flex gap-4 align-center flex-wrap">
      <VBtn
        v-if="showScheduleButton"
        variant="tonal"
        color="primary"
        @click="$emit('schedule')"
      >
        <VIcon icon="bx-calendar" class="me-1" />
        Расписание
      </VBtn>
      <VBtn
        variant="tonal"
        color="secondary"
        @click="$emit('cancel')"
      >
        Отмена
      </VBtn>
      <VBtn
        :loading="saving"
        @click="$emit('save')"
      >
        Сохранить
      </VBtn>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TicketForm } from '@/types/ticket'

interface Props {
  ticket: TicketForm
  saving: boolean
  showScheduleButton?: boolean
}

defineProps<Props>()

defineEmits<{
  save: []
  cancel: []
  schedule: []
}>()
</script>