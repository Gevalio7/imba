<script setup lang="ts">
import type { Article } from '@/types/ticket'

interface Props {
  modelValue: boolean
  articles: Article[]
  loading: boolean
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: boolean]
  insert: [article: Article]
}>()
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="600"
    scrollable
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <VCard title="Быстрые ответы">
      <VCardText>
        <div
          v-if="loading"
          class="d-flex justify-center pa-4"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>
        <div
          v-else-if="articles.length === 0"
          class="text-center text-medium-emphasis pa-4"
        >
          Нет привязанных статей к этой очереди
        </div>
        <VList v-else>
          <VListItem
            v-for="article in articles"
            :key="article.id"
            class="mb-2 border rounded"
          >
            <VListItemTitle class="font-weight-medium">
              {{ article.title }}
            </VListItemTitle>
            <VListItemSubtitle class="text-truncate mt-1">
              {{ article.content?.substring(0, 150) || 'Без содержания' }}...
            </VListItemSubtitle>
            <template #append>
              <VBtn
                variant="tonal"
                color="primary"
                size="small"
                @click="$emit('insert', article)"
              >
                Добавить
              </VBtn>
            </template>
          </VListItem>
        </VList>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="grey"
          variant="outlined"
          @click="$emit('update:modelValue', false)"
        >
          Закрыть
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
