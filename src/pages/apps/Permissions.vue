<script setup lang="ts">
import { ref, watch } from 'vue'
import AgentsTable from '@/views/apps/groups/AgentsTable.vue'

// Состояние аккордеонов (какие панели открыты)
const expandedPanels = ref<number[]>(
  JSON.parse(localStorage.getItem('permissionsExpandedPanels') || '[]'),
)

// Сохраняем состояние аккордеонов при изменении
watch(expandedPanels, newValue => {
  localStorage.setItem('permissionsExpandedPanels', JSON.stringify(newValue))
}, { deep: true })

// Ref для таблицы агентов
const agentsTableRef = ref<InstanceType<typeof AgentsTable> | null>(null)

// Обработчик обновления агента
const handleAgentUpdated = () => {
  // Можно добавить дополнительную логику при обновлении агента
}
</script>

<template>
  <div>
    <VCard>
      <!-- Заголовок -->
      <div class="d-flex justify-space-between align-center pa-6">
        <div>
          <h4 class="text-h4 mb-1">
            Разрешения
          </h4>
          <p class="text-body-1 mb-0">
            Управление разрешениями пользователей системы.
          </p>
        </div>
      </div>

      <!-- Список агентов -->
      <VCol
        cols="12"
        class="mt-6"
      >
        <AgentsTable
          ref="agentsTableRef"
          @agent-updated="handleAgentUpdated"
        />
      </VCol>
    </VCard>
  </div>
</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
  max-width: 100%;
  width: 100%;
}

.expansion-panels-width-border {
  width: 100%;
}

:deep(.v-expansion-panel-text__wrapper) {
  width: 100%;
  max-width: 100%;
}

:deep(.v-expansion-panel) {
  max-width: 100%;
}
</style>
