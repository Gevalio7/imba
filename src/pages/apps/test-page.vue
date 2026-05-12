<script setup lang="ts">
definePage({
  meta: {
    pageTitle: 'Тестовая страница',
  },
})
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <VCard>
          <VCardTitle>
            <h2>Тестовая страница</h2>
          </VCardTitle>
          <VCardText>
            <p>Это тестовая страница для проверки работы бокового меню и системы разрешений.</p>

            <VRow class="mt-4">
              <VCol cols="12" md="6">
                <VCard variant="outlined">
                  <VCardTitle>Информация о пользователе</VCardTitle>
                  <VCardText>
                    <p><strong>Время:</strong> {{ new Date().toLocaleString() }}</p>
                    <p><strong>URL:</strong> {{ $route.fullPath }}</p>
                  </VCardText>
                </VCard>
              </VCol>

              <VCol cols="12" md="6">
                <VCard variant="outlined">
                  <VCardTitle>Тестовые элементы</VCardTitle>
                  <VCardText>
                    <VBtn color="primary" class="me-2 mb-2">
                      Кнопка 1
                    </VBtn>
                    <VBtn color="secondary" class="me-2 mb-2">
                      Кнопка 2
                    </VBtn>
                    <VChip color="success" class="me-2 mb-2">
                      Чип 1
                    </VChip>
                    <VChip color="info">
                      Чип 2
                    </VChip>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>

            <VRow class="mt-4">
              <VCol cols="12">
                <VCard variant="outlined">
                  <VCardTitle>Статус разрешений</VCardTitle>
                  <VCardText>
                    <VChip
                      v-if="$permissions?.canRead('menu_roles')"
                      color="success"
                      class="me-2"
                    >
                      menu_roles: доступен
                    </VChip>
                    <VChip
                      v-else
                      color="error"
                      class="me-2"
                    >
                      menu_roles: недоступен
                    </VChip>

                    <VChip
                      v-if="$permissions?.canRead('system_settings')"
                      color="success"
                      class="me-2"
                    >
                      system_settings: доступен
                    </VChip>
                    <VChip
                      v-else
                      color="error"
                      class="me-2"
                    >
                      system_settings: недоступен
                    </VChip>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
/* Дополнительные стили при необходимости */
</style>