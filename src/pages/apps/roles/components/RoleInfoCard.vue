<script setup lang="ts">
const props = defineProps<{ role: any }>()
</script>

<template>
  <VCard>
    <VCardText class="py-3 px-4 d-flex align-center gap-4">
      <VAvatar
        rounded
        :size="64"
        color="primary"
        variant="tonal"
      >
        <VIcon
          icon="bx-shield"
          size="32"
        />
      </VAvatar>

      <div class="flex-1">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h6 class="text-h6 mb-1">
              {{ role.name || 'Новая роль' }}
            </h6>
            <VChip
              label
              :color="role.isActive ? 'success' : 'error'"
              size="x-small"
              class="text-capitalize"
            >
              {{ role.isActive ? 'Активен' : 'Не активен' }}
            </VChip>
          </div>
        </div>

        <div class="mt-2 text-caption text-medium-emphasis d-flex gap-3">
          <div v-if="role.id">
            ID: <strong class="ml-1">{{ role.id }}</strong>
          </div>
          <div v-if="role.createdAt">
            Создан: <strong class="ml-1">{{ new Date(role.createdAt).toLocaleDateString() }}</strong>
          </div>
        </div>
      </div>
    </VCardText>

    <VCardText class="d-flex justify-end gap-2 py-2 px-4">
      <VBtn
        variant="elevated"
        size="small"
        @click="$emit('save')"
      >
        Сохранить
      </VBtn>
      <VBtn
        variant="tonal"
        size="small"
        color="error"
        @click="$emit('cancel')"
      >
        Отмена
      </VBtn>
    </VCardText>
  </VCard>
</template>
