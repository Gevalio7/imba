<template>
  <VDialog
    :model-value="modelValue"
    max-width="500"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle>
        {{ schedule?.id ? 'Редактирование расписания' : 'Создание расписания' }}
      </VCardTitle>
      <VCardText>
        <VAlert
          v-if="schedule?.isActive === false"
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          Расписание приостановлено
        </VAlert>

        <VSelect
          v-model="form.scheduleType"
          :items="scheduleTypeOptions"
          label="Тип расписания"
          class="mb-4"
        />

        <AppTextField
          v-model="form.scheduleTime"
          label="Время выполнения (HH:MM)"
          type="time"
          class="mb-4"
        />

        <AppTextField
          v-model="form.titlePrefix"
          label="Префикс названия тикета"
          placeholder="Расписание (Р) "
          class="mb-4"
        />

        <!-- Дни недели (только для weekly) -->
        <VSelect
          v-if="form.scheduleType === 'weekly'"
          v-model="form.scheduleDays"
          :items="weekDays"
          label="Дни недели"
          multiple
          chips
          class="mb-4"
        />

        <!-- День месяца (только для monthly) -->
        <VSelect
          v-if="form.scheduleType === 'monthly'"
          v-model="form.scheduleDayOfMonth"
          :items="monthDays"
          label="День месяца"
          class="mb-4"
        />

        <VRow>
          <VCol cols="6">
            <AppTextField
              v-model="form.startDate"
              label="Дата начала"
              type="date"
            />
          </VCol>
          <VCol cols="6">
            <AppTextField
              v-model="form.endDate"
              label="Дата окончания"
              type="date"
            />
          </VCol>
        </VRow>

        <VCheckbox
          v-model="form.isActive"
          label="Расписание активно"
          color="success"
          class="mt-2"
        />

        <!-- Информация о расписании -->
        <VAlert
          v-if="schedule?.nextRunAt"
          type="info"
          variant="tonal"
          class="mt-4"
        >
          <div class="text-body-2">
            <div>Следующий запуск: <strong>{{ formatDate(schedule.nextRunAt) }}</strong></div>
            <div v-if="schedule.lastRunAt">Последний запуск: {{ formatDate(schedule.lastRunAt) }}</div>
          </div>
        </VAlert>
      </VCardText>
      <VCardActions>
        <VBtn
          v-if="schedule?.id"
          variant="tonal"
          color="error"
          @click="$emit('delete')"
        >
          Удалить
        </VBtn>
        <VBtn
          v-if="schedule?.id && schedule.isActive"
          variant="tonal"
          color="primary"
          @click="$emit('run-now')"
        >
          Создать тикет сейчас
        </VBtn>
        <VSpacer />
        <VBtn
          variant="tonal"
          @click="$emit('update:modelValue', false)"
        >
          Отмена
        </VBtn>
        <VBtn
          :loading="saving"
          @click="$emit('save')"
        >
          Сохранить
        </VBtn>
      </CardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/slaFormatter'
import type { TicketSchedule } from '@/types/ticket'

interface Props {
  modelValue: boolean
  schedule?: TicketSchedule | null
  saving: boolean
}

const props = defineProps<Props>()

// Варианты типов расписания
const scheduleTypeOptions = [
  { title: 'Ежедневно', value: 'daily' },
  { title: 'Еженедельно', value: 'weekly' },
  { title: 'Ежемесячно', value: 'monthly' },
]

// Дни недели
const weekDays = [
  { title: 'Пн', value: 1 },
  { title: 'Вт', value: 2 },
  { title: 'Ср', value: 3 },
  { title: 'Чт', value: 4 },
  { title: 'Пт', value: 5 },
  { title: 'Сб', value: 6 },
  { title: 'Вс', value: 7 },
]

// Дни месяца (1-31)
const monthDays = Array.from({ length: 31 }, (_, i) => ({
  title: String(i + 1),
  value: i + 1,
}))

defineEmits<{
  'update:modelValue': [value: boolean]
  save: []
  delete: []
  'run-now': []
}>()

// Форма расписания (должна быть передана через props или управляться родителем)
const form = computed(() => ({
  scheduleType: 'daily' as 'daily' | 'weekly' | 'monthly',
  scheduleTime: '09:00',
  scheduleDays: [] as number[],
  scheduleDayOfMonth: 1,
  startDate: null as string | null,
  endDate: null as string | null,
  isActive: true,
  titlePrefix: 'Расписание (Р) ',
}))
</script>