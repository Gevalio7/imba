<script setup lang="ts">
interface Props {
  modelValue: boolean
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: boolean]
  'share-telegram': []
  'share-mail': []
  'share-email': []
}>()
</script>

<template>
  <VMenu
    :model-value="modelValue"
    :close-on-content-click="false"
    location="bottom end"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <VList
      density="compact"
      nav
    >
      <VListItem
        prepend-icon="bxl-telegram"
        title="Telegram"
        @click="$emit('share-telegram')"
      />
      <VListItem
        prepend-icon="bxl-mail.ru"
        title="Mail.ru"
        @click="$emit('share-mail')"
      />
      <VListItem
        prepend-icon="bx-envelope"
        title="Email"
        @click="$emit('share-email')"
      />
    </VList>
  </VMenu>
</template>
