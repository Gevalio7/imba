<script setup lang="ts">
interface Props {
  modelValue?: any
  filteredAuthorOptions: any[]
  authorSearch: string
  showCreateNewAuthor: boolean
  canCreateCustomerUserByEmail: boolean
  newAuthorEmail: string
  newAuthorFirstName: string
  newAuthorLastName: string
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: any]
  'update:search': [value: string]
  'clear': []
  'update:newAuthorFirstName': [value: string]
  'update:newAuthorLastName': [value: string]
  'create-new-author': []
}>()
</script>

<template>
  <VAutocomplete
    :model-value="modelValue"
    :items="filteredAuthorOptions"
    label="Автор"
    placeholder="Введите имя или email для поиска..."
    :search-input="authorSearch"
    clearable
    hide-no-data
    return-object
    @update:model-value="$emit('update:modelValue', $event)"
    @update:search-input="$emit('update:search', $event)"
    @click:clear="$emit('clear')"
  >
    <!-- Если показывать опцию создания -->
    <template #append-item>
      <div
        v-if="showCreateNewAuthor && canCreateCustomerUserByEmail"
        class="pa-2"
      >
        <VCard
          variant="tonal"
          color="primary"
          class="pa-3"
        >
          <div class="text-body-2 mb-2">
            <VIcon
              icon="bx-plus"
              size="small"
              class="me-1"
            />
            Создать нового сотрудника: <strong>{{ newAuthorEmail }}</strong>
          </div>
          <div class="d-flex gap-2">
            <AppTextField
              :model-value="newAuthorFirstName"
              label="Имя"
              placeholder="Имя"
              density="compact"
              hide-details
              class="flex-grow-1"
              @update:model-value="$emit('update:newAuthorFirstName', $event)"
            />
            <AppTextField
              :model-value="newAuthorLastName"
              label="Фамилия"
              placeholder="Фамилия"
              density="compact"
              hide-details
              class="flex-grow-1"
              @update:model-value="$emit('update:newAuthorLastName', $event)"
            />
            <VBtn
              color="primary"
              size="small"
              @click="$emit('create-new-author')"
            >
              Создать
            </VBtn>
          </div>
        </VCard>
      </div>
    </template>
  </VAutocomplete>
</template>
