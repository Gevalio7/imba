<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { isToastVisible, toastMessage, toastColor } = useToast()
</script>

<template>
  <VSnackbar
    v-model="isToastVisible"
    :color="toastColor"
    timeout="2000"
    location="top"
  >
    {{ toastMessage }}
  </VSnackbar>
</template>
