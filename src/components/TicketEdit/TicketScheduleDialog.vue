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
            <div>Следующий запуск: <strong>{{ formatDateTime(schedule.nextRunAt) }}</strong></div>
            <div v-if="schedule.lastRunAt">Последний запуск: {{ formatDateTime(schedule.lastRunAt) }}</div>
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
          @click="saveSchedule"
        >
          {{ schedule?.id ? 'Сохранить' : 'Создать' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { $api } from '@/utils/api'
import { formatDateTime } from '@/utils/slaFormatter'

// Интерфейс расписания для диалога
interface DialogTicketSchedule {
  id?: number
  ticketId: number | null
  scheduleType: 'daily' | 'weekly' | 'monthly'
  scheduleTime: string
  scheduleDays: number[] | null
  scheduleDayOfMonth: number | null
  startDate: string | null
  endDate: string | null
  isActive: boolean
  titlePrefix: string | null
  nextRunAt?: string
  lastRunAt?: string
}

interface Props {
  modelValue: boolean
  schedule?: any
  saving: boolean
  ticketId?: number | null
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

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: []
  delete: []
  'run-now': []
}>()

// Форма расписания
const form = reactive({
  scheduleType: 'daily' as 'daily' | 'weekly' | 'monthly',
  scheduleTime: '09:00',
  scheduleDays: [] as number[],
  scheduleDayOfMonth: 1,
  startDate: null as string | null,
  endDate: null as string | null,
  isActive: true,
  titlePrefix: 'Расписание (Р) ',
})

// Инициализация формы при открытии
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // Сброс формы при открытии
    form.scheduleType = 'daily'
    form.scheduleTime = '09:00'
    form.scheduleDays = []
    form.scheduleDayOfMonth = 1
    form.startDate = null
    form.endDate = null
    form.isActive = true
    form.titlePrefix = 'Расписание (Р) '
  }
})

// Инициализация формы при открытии
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    if (props.schedule) {
      // Редактирование - заполняем форму текущими значениями
      form.scheduleType = props.schedule.scheduleType || 'daily'
      form.scheduleTime = props.schedule.scheduleTime || '09:00'
      form.scheduleDays = props.schedule.scheduleDays || []
      form.scheduleDayOfMonth = props.schedule.scheduleDayOfMonth || 1
      form.startDate = props.schedule.startDate || null
      form.endDate = props.schedule.endDate || null
      form.isActive = props.schedule.isActive !== false
      form.titlePrefix = props.schedule.titlePrefix || 'Расписание (Р) '
    } else {
      // Создание - сбрасываем форму
      form.scheduleType = 'daily'
      form.scheduleTime = '09:00'
      form.scheduleDays = []
      form.scheduleDayOfMonth = 1
      form.startDate = null
      form.endDate = null
      form.isActive = true
      form.titlePrefix = 'Расписание (Р) '
    }
  }
})

// Сохранение расписания
const saveSchedule = async () => {
  try {
    const scheduleData = {
      ...form
    }

    // Для создания добавляем ticketId
    if (!props.schedule?.id && props.ticketId) {
      scheduleData.ticketId = props.ticketId
    }
    // Для обновления ticketId не нужен, расписание уже привязано

    if (props.schedule?.id) {
      // Обновление
      await $api(`/ticketSchedules/${props.schedule.id}`, {
        method: 'PUT',
        body: scheduleData
      })
    } else {
      // Создание
      await $api('/ticketSchedules', {
        method: 'POST',
        body: scheduleData
      })
    }

    emit('save')
    emit('update:modelValue', false)
  } catch (error) {
    console.error('Error saving schedule:', error)
  }
}
</script>