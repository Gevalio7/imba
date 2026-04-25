<template>
  <VCard class="mb-6">
    <VCardTitle class="d-flex align-center px-6 py-4">
      <h5 class="text-h5">
        Свойства
      </h5>
    </VCardTitle>
    <VCardText>
      <div class="d-flex flex-column gap-y-4">
        <AppTextField
          :model-value="ticket.ticketNumber"
          label="Номер обращения"
          disabled
        />

        <AppSelect
          v-model="ticket.typeId"
          :items="referenceData.types"
          item-title="name"
          item-value="id"
          label="Тип"
          placeholder="Выберите тип"
          clearable
        />

        <!-- Категория - зависит от типа: показываем только если есть связанные категории -->
        <AppSelect
          v-if="categoryVisible"
          v-model="ticket.categoryId"
          :items="filteredCategories"
          item-title="name"
          item-value="id"
          label="Категория"
          placeholder="Выберите категорию"
          :disabled="!ticket.typeId"
          :error-messages="hasCategoriesForType && !ticket.categoryId ? 'Выберите категорию' : undefined"
          clearable
        />

        <!-- Информация о workflow -->
        <VAlert
          v-if="currentWorkflow"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-2"
        >
          <div class="text-body-2">
            <strong>Workflow:</strong> {{ currentWorkflow.name }}
          </div>
        </VAlert>

        <AppSelect
          v-model="ticket.priorityId"
          :items="referenceData.priorities"
          item-title="name"
          item-value="id"
          label="Приоритет"
          placeholder="Выберите приоритет"
          clearable
        />

        <AppSelect
          v-model="ticket.queueId"
          :items="referenceData.queues"
          item-title="name"
          item-value="id"
          label="Очередь"
          placeholder="Выберите очередь"
          clearable
        />

        <!-- Статус - ограничен доступными из workflow или все если тип не выбран -->
        <AppSelect
          v-model="ticket.stateId"
          :items="statusOptions"
          item-title="title"
          item-value="value"
          label="Статус"
          :placeholder="availableStatuses.length > 0 ? 'Выберите статус из доступных' : 'Выберите статус'"

          :persistent-hint="availableStatuses.length > 0"
          clearable
        >
          <template #selection="{ item }">
            <VChip
              v-if="item.raw.color"
              :color="item.raw.color"
              density="compact"
              label
              size="small"
            >
              {{ item.title }}
            </VChip>
            <span v-else>{{ item.title }}</span>
          </template>
          <template #item="{ props, item }">
            <VListItem v-bind="props">
              <template #prepend>
                <VChip
                  v-if="item.raw.color"
                  :color="item.raw.color"
                  density="compact"
                  label
                  size="small"
                  class="mr-2"
                >
                  &nbsp;
                </VChip>
              </template>
            </VListItem>
          </template>
        </AppSelect>

        <VAutocomplete
          v-model="ticket.ownerId"
          :items="authorOptions"
          label="Автор"
          placeholder="Введите имя или email для поиска..."
          clearable
          hide-no-data
          return-object
        />

        <!-- Группы исполнителей -->
        <AppSelect
          v-model="ticket.executorGroupIds"
          :items="agentGroupOptions"
          label="Группы исполнителей"
          placeholder="Выберите группы исполнителей"
          :multiple="allowMultipleExecutorGroups?.value === 'true'"
          chips
          clearable
        />

        <!-- Исполнители -->
        <AppSelect
          v-model="ticket.executorAgentIds"
          :items="agentOptions"
          label="Исполнители"
          placeholder="Выберите исполнителей"
          :multiple="allowMultipleExecutors?.value === 'true'"
          chips
          clearable
        />

        <!-- Группы наблюдателей -->
        <AppSelect
          v-model="ticket.observerGroupIds"
          :items="agentGroupOptions"
          label="Группы наблюдателей"
          placeholder="Наблюдатели добавляются автоматически при эскалации"
          multiple
          chips
          readonly
        />

        <!-- Наблюдатели -->
        <AppSelect
          v-model="ticket.observerAgentIds"
          :items="agentOptions"
          label="Наблюдатели"
          placeholder="Наблюдатели добавляются автоматически при эскалации"
          multiple
          chips
          readonly
        />

        <!-- Счётчик эскалаций -->
        <AppTextField
          :model-value="ticket.escalationCount"
          label="Количество эскалаций"
          readonly
        />

        <AppSelect
          v-model="ticket.companyId"
          :items="referenceData.customers"
          item-title="name"
          item-value="id"
          label="Компания"
          placeholder="Выберите компанию"
          clearable
        />

        <AppSelect
          v-model="ticket.serviceId"
          :items="filteredServices"
          item-title="name"
          item-value="id"
          label="Сервис"
          placeholder="Выберите сервис"
          clearable
        />

        <AppSelect
          v-model="ticket.slaId"
          :items="referenceData.sla"
          item-title="name"
          item-value="id"
          label="SLA"
          placeholder="Выберите SLA"
          clearable
        />

        <!-- Отображение SLA дедлайнов -->
        <VAlert
          v-if="selectedSla || ticket.responseDeadline || ticket.resolutionDeadline"
          type="info"
          variant="tonal"
          density="compact"
          class="mt-2"
        >
          <div class="text-body-2">
            <div v-if="selectedSla?.responseTime">
              <strong>Время первого ответа:</strong> {{ formatSlaTime(selectedSla.responseTime, true) }}
            </div>
            <div v-if="ticket.responseDeadline">
              <strong>Срок ответа:</strong> {{ formatDeadline(ticket.responseDeadline) }}
            </div>
            <div v-if="selectedSla?.solutionTime">
              <strong>Время решения:</strong> {{ formatSlaTime(selectedSla.solutionTime, false) }}
            </div>
            <div v-if="ticket.resolutionDeadline">
              <strong>Срок решения:</strong> {{ formatDeadline(ticket.resolutionDeadline) }}
            </div>
            <div v-if="!selectedSla && !ticket.responseDeadline && !ticket.resolutionDeadline" class="text-body-2 text-medium-emphasis">
              SLA не установлен
            </div>
          </div>
        </VAlert>
      </div>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatSlaTime, formatDeadline } from '@/utils/slaFormatter'

interface Props {
  ticket: any
  referenceData: any
  availableStatuses: any[]
  currentWorkflow: any
  allowMultipleExecutorGroups: any
  allowMultipleExecutors: any
  filteredServices: any[]
  filteredCategories: any[]
  hasCategoriesForType: boolean
  categoryVisible: boolean
}

const props = defineProps<Props>()

// Вычисляемый выбранный SLA для отображения дедлайнов
const selectedSla = computed(() => {
  if (!props.ticket.slaId) return null
  return props.referenceData.sla.find((s: any) => s.id === props.ticket.slaId) || null
})

// Агенты для выбора
const agentOptions = computed(() => {
  return props.referenceData.agents.map((a: any) => ({
    title: `${a.firstName || ''} ${a.lastName || ''} (${a.email || a.login})`.trim(),
    value: a.id,
  }))
})

// Группы агентов для выбора
const agentGroupOptions = computed(() => {
  return props.referenceData.agentGroups.map((g: any) => ({
    title: g.name,
    value: g.id,
  }))
})

// Авторы (сотрудники) для выбора - с информацией о компании
const authorOptions = computed(() => {
  return props.referenceData.customerUsers.map((c: any) => {
    const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.login || 'Неизвестно'
    const email = c.email ? ` (${c.email})` : ''
    const companyInfo = c.customerName ? ` [${c.customerName}]` : ''
    return {
      title: `${name}${email}${companyInfo}`,
      value: c.id,
      customerId: c.customerId,
      customerName: c.customerName,
    }
  })
})

// Вычисляемый список статусов для выбора
const statusOptions = computed(() => {
  // Если есть workflow и доступные статусы
  if (props.availableStatuses.length > 0) {
    // Находим текущий статус в общем списке
    const currentStatus = props.referenceData.states.find((s: any) => s.id === props.ticket.stateId)

    // Создаём список с текущим статусом (если он есть и не в availableStatuses)
    const options = props.availableStatuses.map(s => ({
      title: s.name,
      value: s.id,
      color: s.color,
    }))

    // Добавляем текущий статус если его нет в списке
    if (currentStatus && !options.find(o => o.value === currentStatus.id)) {
      options.unshift({
        title: currentStatus.name,
        value: currentStatus.id,
        color: currentStatus.color,
      })
    }

    return options
  }

  // Если нет workflow - возвращаем все статусы
  return props.referenceData.states.map((s: any) => ({
    title: s.name,
    value: s.id,
    color: s.color,
  }))
})
</script>