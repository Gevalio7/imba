<script setup lang="ts">
defineOptions({
  name: 'AuthProvider',
})

const { isAuthenticated, userData, userAbilities } = useUser()
</script>

<template>
  <slot v-if="isAuthenticated && userData.value && userAbilities.value" />
</template>
