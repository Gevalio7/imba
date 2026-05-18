<template>
  <VCard>
    <VCardText class="pt-6">
      <VAvatar
        rounded
        :size="120"
        color="primary"
        variant="tonal"
        class="mb-4"
      >
        <VIcon icon="bx-shield" size="60" />
      </VAvatar>

      <h5 class="text-h5 mt-4">
        {{ role.name || 'Новая роль' }}
      </h5>

      <VChip
        label
        :color="role.isActive ? 'success' : 'error'"
        size="small"
        class="text-capitalize mt-4"
      >
        {{ role.isActive ? 'Активен' : 'Не активен' }}
      </VChip>
    </VCardText>

    <VCardText>
      <h5 class="text-h5">
        Информация
      </h5>

      <VDivider class="my-4" />

      <VList class="card-list mt-2">
        <VListItem v-if="role.id">
          <VListItemTitle>
            <h6 class="text-h6">
              ID:
              <span class="text-body-1">{{ role.id }}</span>
            </h6>
          </VListItemTitle>
        </VListItem>

        <VListItem v-if="role.createdAt">
          <VListItemTitle>
            <h6 class="text-h6">
              Создан:
              <span class="text-body-1">{{ new Date(role.createdAt).toLocaleDateString() }}</span>
            </h6>
          </VListItemTitle>
        </VListItem>

        <VListItem v-if="role.updatedAt">
          <VListItemTitle>
            <h6 class="text-h6">
              Изменен:
              <span class="text-body-1">{{ new Date(role.updatedAt).toLocaleDateString() }}</span>
            </h6>
          </VListItemTitle>
        </VListItem>
      </VList>
    </VCardText>

    <VCardText class="d-flex justify-center gap-x-4">
      <VBtn
        variant="elevated"
        @click="$emit('save')"
      >
        <slot name="saveLabel">Сохранить</slot>
      </VBtn>

      <VBtn
        variant="tonal"
        color="error"
        @click="$emit('cancel')"
      >
        Отмена
      </VBtn>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
const props = defineProps<{ role: any }>()
</script>

