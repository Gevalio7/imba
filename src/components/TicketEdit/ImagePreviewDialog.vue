<template>
  <VDialog
    :model-value="modelValue"
    max-width="90%"
    width="auto"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <VCard class="pa-2">
      <VCardTitle class="d-flex justify-space-between align-center">
        <span class="text-truncate">{{ filename }}</span>
        <div class="d-flex align-center gap-1">
          <!-- Кнопки управления зумом -->
          <VBtn
            icon
            variant="text"
            size="small"
            :disabled="zoom <= 25"
            @click="$emit('zoom-out')"
          >
            <VIcon icon="bx-zoom-out" />
          </VBtn>
          <VChip
            size="small"
            variant="tonal"
            class="mx-1"
            @click="$emit('reset-zoom')"
            style="cursor: pointer"
          >
            {{ zoom }}%
          </VChip>
          <VBtn
            icon
            variant="text"
            size="small"
            :disabled="zoom >= 300"
            @click="$emit('zoom-in')"
          >
            <VIcon icon="bx-zoom-in" />
          </VBtn>

          <VDivider vertical class="mx-2" />

          <!-- Кнопка скачивания -->
          <VBtn
            icon
            variant="text"
            size="small"
            @click="$emit('download')"
          >
            <VIcon icon="bx-download" />
          </VBtn>

          <!-- Кнопка печати -->
          <VBtn
            icon
            variant="text"
            size="small"
            @click="$emit('print')"
          >
            <VIcon icon="bx-printer" />
          </VBtn>

          <VDivider vertical class="mx-2" />

          <!-- Кнопка закрытия -->
          <VBtn
            icon
            variant="text"
            size="small"
            @click="$emit('update:modelValue', false)"
          >
            <VIcon icon="bx-x" />
          </VBtn>
        </div>
      </VCardTitle>
      <VCardText class="d-flex justify-center align-center pa-0" style="overflow: auto;">
        <VImg
          :src="src"
          :alt="filename"
          :max-height="zoom > 100 ? 'none' : '80vh'"
          :max-width="zoom > 100 ? 'none' : '90vw'"
          :height="zoom > 100 ? `${zoom}%` : 'auto'"
          :width="zoom > 100 ? `${zoom}%` : 'auto'"
          contain
          :style="zoom > 100 ? 'object-fit: contain;' : ''"
        />
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          variant="tonal"
          @click="$emit('update:modelValue', false)"
        >
          Закрыть
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  src: string
  filename: string
  zoom: number
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: boolean]
  'zoom-in': []
  'zoom-out': []
  'reset-zoom': []
  download: []
  print: []
}>()
</script>