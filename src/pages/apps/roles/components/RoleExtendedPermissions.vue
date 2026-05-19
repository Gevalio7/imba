<template>
  <VCard class="mt-6">
    <VCardTitle class="d-flex align-center gap-3">
      <VIcon icon="bx-crown" color="error" size="20" />
      <span class="text-h6">Расширенные права</span>
    </VCardTitle>

    <VCardText>
      <VRow class="g-4">
        <VCol cols="12">
          <div class="super-admin-row d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-3">
              <VIcon icon="bx-crown" color="error" size="18" />
              <div>
                <div class="text-body-1 font-weight-medium">Супер-админ</div>
                <div class="text-caption text-medium-emphasis">Полный доступ ко всем разделам системы</div>
              </div>
            </div>
            <VSwitch :model-value="superAdmin" color="error" hide-details @update:model-value="$emit('update:superAdmin', $event)" />
          </div>
        </VCol>

        <VCol cols="12" md="6">
          <VSelect
            :model-value="departments"
            :items="departmentsList"
            item-title="name"
            item-value="id"
            multiple
            chips
            label="Отделы"
            placeholder="Все отделы"
            density="compact"
            @update:model-value="$emit('update:departments', $event)"
          />
        </VCol>

        <VCol cols="12" md="6">
          <VSelect
            :model-value="companies"
            :items="companiesList"
            item-title="name"
            item-value="id"
            multiple
            chips
            label="Компании"
            placeholder="Все компании"
            density="compact"
            @update:model-value="$emit('update:companies', $event)"
          />
        </VCol>

        <VCol cols="12" md="6">
          <div class="option-row d-flex align-center justify-space-between">
            <div>
              <div class="text-body-1">Только свои обращения</div>
              <div class="text-caption text-medium-emphasis">Показывать только заявки, где назначен исполнитель</div>
            </div>
            <VSwitch :model-value="onlyOwnTickets" color="primary" hide-details @update:model-value="$emit('update:onlyOwnTickets', $event)" />
          </div>
        </VCol>

        <VCol cols="12" md="6">
          <div class="option-row d-flex align-center justify-space-between">
            <div>
              <div class="text-body-1">Добавлять комментарии в обращения</div>
              <div class="text-caption text-medium-emphasis mt-1 mb-0">(видны всем)</div>
            </div>
            <VSwitch :model-value="canReply" color="primary" hide-details @update:model-value="$emit('update:canReply', $event)" />
          </div>
        </VCol>

        <VCol cols="12" md="6">
          <div class="option-row d-flex align-center justify-space-between">
            <div>
              <div class="text-body-1">Менять статус в тикете</div>
              <div class="text-caption text-medium-emphasis mt-1 mb-0">Разрешение на смену статуса обращения</div>
            </div>
            <VSwitch :model-value="canChangeStatus" color="primary" hide-details @update:model-value="$emit('update:canChangeStatus', $event)" />
          </div>
        </VCol>

        <VCol cols="12" md="6">
          <div class="option-row d-flex align-center justify-space-between">
            <div>
              <div class="text-body-1">Менять приоритет</div>
              <div class="text-caption text-medium-emphasis mt-1 mb-0">Разрешение на изменение приоритета тикета</div>
            </div>
            <VSwitch :model-value="canChangePriority" color="primary" hide-details @update:model-value="$emit('update:canChangePriority', $event)" />
          </div>
        </VCol>

        <VCol cols="12">
          <div class="option-row d-flex align-center justify-space-between">
            <div>
              <div class="text-body-1">Внутренние заметки</div>
              <div class="text-caption text-medium-emphasis mt-1 mb-0">Добавлять внутренние комментарии (видны только сотрудникам)</div>
            </div>
            <VSwitch :model-value="canInternalNotes" color="primary" hide-details @update:model-value="$emit('update:canInternalNotes', $event)" />
          </div>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
interface SelectItem { id: number; name: string }

defineProps<{
  superAdmin: boolean
  departments: number[]
  companies: number[]
  onlyOwnTickets: boolean
  canReply: boolean
  canInternalNotes: boolean
  canChangeStatus: boolean
  canChangePriority: boolean
  departmentsList?: SelectItem[]
  companiesList?: SelectItem[]
}>()

defineEmits<{
  (e: 'update:superAdmin', value: boolean): void
  (e: 'update:departments', value: number[]): void
  (e: 'update:companies', value: number[]): void
  (e: 'update:onlyOwnTickets', value: boolean): void
  (e: 'update:canReply', value: boolean): void
  (e: 'update:canInternalNotes', value: boolean): void
  (e: 'update:canChangeStatus', value: boolean): void
  (e: 'update:canChangePriority', value: boolean): void
}>()
</script>

<style scoped>
.super-admin-row {
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--v-theme-surface);
}
.option-row {
  padding: 8px 0;
}
</style>
