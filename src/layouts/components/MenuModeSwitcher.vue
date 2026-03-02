<script setup lang="ts">
const isOldMenu = ref(false)

// Check localStorage on mount
onMounted(() => {
  isOldMenu.value = localStorage.getItem('isOldMenu') === 'true'
  
  // Listen for storage changes from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'isOldMenu') {
      isOldMenu.value = e.newValue === 'true'
      // Force re-render by triggering a custom event
      window.dispatchEvent(new CustomEvent('menu-mode-changed'))
    }
  })
})

const toggleMenu = () => {
  isOldMenu.value = !isOldMenu.value
  localStorage.setItem('isOldMenu', String(isOldMenu.value))
  
  // Force re-render
  window.location.reload()
}
</script>

<template>
  <VTooltip location="bottom">
    <template #activator="{ props: tooltipProps }">
      <IconBtn
        v-bind="tooltipProps"
        @click="toggleMenu"
      >
        <VIcon
          :icon="isOldMenu ? 'bx-menu' : 'bx-minus'"
          size="22"
        />
        <span class="text-caption ms-1 d-none d-sm-inline">
          {{ isOldMenu ? 'Full' : 'Simple' }}
        </span>
      </IconBtn>
    </template>
    <span>Переключить меню ({{ isOldMenu ? 'Полное' : 'Простое' }})</span>
  </VTooltip>
</template>
