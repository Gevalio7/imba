<script setup lang="ts">
const { isAuthenticated, userData, userAbilities } = useUser()

defineOptions({
  name: 'AuthProvider',
})
</script>

<template>
  <slot v-if="isAuthenticated && userData.value && userAbilities.value" />
</template>