<template>
  <div class="h-100 d-flex align-center justify-md-space-between justify-center">
    <!-- 👉 Footer: left content -->
    <span class="d-flex align-center d-inline-block text-body-1 text-medium-emphasis">
      &copy;
      {{ new Date().getFullYear() }}
      Сделано с
      <VIcon
        icon="bx-bxs-heart"
        color="error"
        size="1.25rem"
        class="mx-1"
      />
      в DREAM DESK
    </span>
    <!-- 👉 Footer: right content -->
    <span class="d-md-flex gap-x-4 text-primary d-none">
      <!-- Можно добавить свои ссылки -->
      <!--
        <a href="#" target="noopener noreferrer">Documentation</a>
        <a href="#" target="noopener noreferrer">Support</a>
      -->
    </span>
  </div>
</template>
