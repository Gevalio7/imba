<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  executorAgentIds: number[]
  executorGroupIds: number[]
  agentOptions: any[]
  agentGroupOptions: any[]
  allowMultipleAgents?: boolean
  allowMultipleGroups?: boolean
}

const props = defineProps<Props>()

defineEmits<{
  'update:agentIds': [value: number[]]
  'update:groupIds': [value: number[]]
  'assign-to-me': []
}>()
</script>

<template>
  <div>
    <!-- Группы исполнителей -->
    <AppSelect
      :model-value="executorGroupIds"
      :items="agentGroupOptions"
      label="Группы исполнителей"
      placeholder="Выберите группы исполнителей"
      :multiple="allowMultipleGroups"
      chips
      clearable
      class="mb-4"
      @update:model-value="$emit('update:groupIds', $event)"
    />

    <!-- Исполнители -->
    <AppSelect
      :model-value="executorAgentIds"
      :items="agentOptions"
      label="Исполнители"
      placeholder="Выберите исполнителей"
      :multiple="allowMultipleAgents"
      chips
      clearable
      @update:model-value="$emit('update:agentIds', $event)"
    >
      <template #append-inner>
        <VBtn
          variant="text"
          size="small"
          color="primary"
          @click="$emit('assign-to-me')"
        >
          Назначить на себя
        </VBtn>
      </template>
    </AppSelect>
  </div>
</template>
