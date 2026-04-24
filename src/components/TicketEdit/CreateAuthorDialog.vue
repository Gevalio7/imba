<template>
  <VDialog
    :model-value="modelValue"
    max-width="500px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <VCard title="Создание нового сотрудника">
      <VCardText>
        <div class="text-body-1 mb-3">
          Сотрудника с email <strong>{{ email }}</strong> не найдено. Создать нового сотрудника?
        </div>
        <div class="d-flex gap-2 mb-3">
          <AppTextField
            v-model="firstName"
            label="Имя"
            placeholder="Имя"
            density="compact"
            hide-details
            class="flex-grow-1"
          />
          <AppTextField
            v-model="lastName"
            label="Фамилия"
            placeholder="Фамилия"
            density="compact"
            hide-details
            class="flex-grow-1"
          />
        </div>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="grey"
          variant="outlined"
          @click="$emit('cancel')"
        >
          Отмена
        </VBtn>
        <VBtn
          color="primary"
          variant="elevated"
          :loading="saving"
          @click="$emit('create')"
        >
          Создать
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  email: string
  firstName: string
  lastName: string
  saving: boolean
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: boolean]
  cancel: []
  create: []
}>()
</script>