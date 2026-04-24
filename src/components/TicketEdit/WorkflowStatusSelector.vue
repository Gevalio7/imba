<template>
  <AppSelect
    :model-value="modelValue"
    :items="statusOptions"
    item-title="title"
    item-value="value"
    label="Статус"
    :placeholder="availableStatuses.length > 0 ? 'Выберите статус из доступных' : 'Выберите статус'"
    :hint="availableStatuses.length > 0 ? 'Доступные статусы из workflow' : ''"
    :persistent-hint="availableStatuses.length > 0"
    clearable
    @update:model-value="$emit('update:modelValue', $event)"
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
</template>

<script setup lang="ts">
interface Props {
  modelValue?: number
  availableStatuses: any[]
  allStatuses: any[]
  currentStatusId?: number
}

const props = defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

// Вычисляемый список статусов для выбора
const statusOptions = computed(() => {
  // Если есть workflow и доступные статусы
  if (props.availableStatuses.length > 0) {
    // Находим текущий статус в общем списке
    const currentStatus = props.allStatuses.find((s: any) => s.id === props.currentStatusId)

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
  return props.allStatuses.map((s: any) => ({
    title: s.name,
    value: s.id,
    color: s.color,
  }))
})
</script>