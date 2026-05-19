<template>
  <VCard class="mt-6">
    <VCardTitle>
      Расширенные права
    </VCardTitle>

    <VCardText>
      <VRow>
        <VCol cols="12">
          <div class="d-flex align-center justify-space-between">
            <div>
              <span class="text-body-1 font-weight-medium">Супер-админ</span>
              <p class="text-caption text-medium-emphasis mt-1 mb-0">Полный доступ ко всем разделам системы</p>
            </div>
            <VSwitch :model-value="superAdmin" color="error" hide-details @update:model-value="$emit('update:superAdmin', $event)" />
          </div>
        </VCol>

        <VCol cols="12">
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

        <VCol cols="12">
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
          <div class="d-flex align-center justify-space-between">
            <div>
              <span class="text-body-1">Только свои обращения</span>
              <p class="text-caption text-medium-emphasis mt-1 mb-0">Пользователь видит только заявки, где назначен исполнителем</p>
            </div>
            <VSwitch :model-value="onlyOwnTickets" color="primary" hide-details @update:model-value="$emit('update:onlyOwnTickets', $event)" />
          </div>
        </VCol>

        <VCol cols="12" md="6">
          <div class="d-flex align-center justify-space-between">
            <div>
              <span class="text-body-1">Отвечать на заявки</span>
              <p class="text-caption text-medium-emphasis mt-1 mb-0">Добавлять публичные комментарии</p>
            </div>
            <VSwitch :model-value="canReply" color="primary" hide-details @update:model-value="$emit('update:canReply', $event)" />
          </div>
        </VCol>

        <VCol cols="12">
          <div class="d-flex align-center justify-space-between">
            <div>
              <span class="text-body-1">Внутренние заметки</span>
              <p class="text-caption text-medium-emphasis mt-1 mb-0">Добавлять внутренние комментарии (видны только сотрудникам)</p>
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
}>()
</script>
