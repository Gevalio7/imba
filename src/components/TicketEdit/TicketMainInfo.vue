<template>
  <VCard class="mb-6">
    <VCardTitle class="d-flex align-center px-6 py-4">
      <h5 class="text-h5">
        Основная информация
      </h5>
    </VCardTitle>

    <div
      v-if="loading"
      class="d-flex justify-center pa-6"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>

    <VCardText v-else>
      <VRow>
        <VCol cols="12">
          <AppTextField
            :model-value="title"
            label="Заголовок *"
            placeholder="Введите заголовок обращения"
            @update:model-value="$emit('update:title', $event)"
          />
        </VCol>

        <VCol cols="12">
          <label class="v-label text-body-1 d-block mb-2">Описание</label>
          <TiptapEditor
            :model-value="description"
            placeholder="Введите подробное описание проблемы"
            class="border rounded"
            @update:model-value="$emit('update:description', $event)"
          />
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description: string
  loading?: boolean
}

defineProps<Props>()

defineEmits<{
  'update:title': [value: string]
  'update:description': [value: string]
}>()
</script>