<script setup lang="ts">
import { ref } from 'vue'
import QuickAnswersDialog from './QuickAnswersDialog.vue'
import type { Article } from '@/types/ticket'

interface Props {
  newComment: string
  isInternalComment: boolean
  saving: boolean
  showQuickAnswers: boolean
  quickAnswersLoading: boolean
  quickAnswers: Article[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:newComment': [value: string]
  'update:isInternalComment': [value: boolean]
  'add': []
  'open-quick-answers': []
  'insert-quick-answer': [article: Article]
}>()

// Dialog state
const showQuickAnswersDialog = ref(false)

// Handle quick answer insertion
const handleInsertQuickAnswer = (article: Article) => {
  // Insert the article content into the comment field
  emit('update:newComment', article.content || '')

  // Close the dialog
  showQuickAnswersDialog.value = false
}

// Handle opening quick answers dialog
const openQuickAnswersDialog = () => {
  showQuickAnswersDialog.value = true
  emit('open-quick-answers')
}
</script>

<template>
  <div class="comment-form">
    <div class="d-flex align-center gap-2 mb-2">
      <VBtn
        v-if="showQuickAnswers"
        variant="tonal"
        size="small"
        color="primary"
        @click="openQuickAnswersDialog"
      >
        <VIcon
          icon="bx-book"
          class="me-1"
        />
        Быстрые ответы
      </VBtn>
    </div>
    <AppTextarea
      :model-value="newComment"
      placeholder="Напишите комментарий..."
      rows="3"
      auto-grow
      class="mb-3"
      @update:model-value="$emit('update:newComment', $event)"
    />
    <div class="d-flex justify-space-between align-center">
      <VCheckbox
        :model-value="isInternalComment"
        label="Внутренний комментарий (только для агентов)"
        density="compact"
        hide-details
        color="warning"
        @update:model-value="$emit('update:isInternalComment', $event)"
      />
      <VBtn
        :loading="saving"
        :disabled="!newComment.trim()"
        @click="$emit('add')"
      >
        <VIcon
          icon="bx-send"
          class="me-2"
        />
        Отправить
      </VBtn>
    </div>

    <!-- Диалог быстрых ответов -->
    <QuickAnswersDialog
      v-model="showQuickAnswersDialog"
      :articles="quickAnswers"
      :loading="quickAnswersLoading"
      @insert="handleInsertQuickAnswer"
    />
  </div>
</template>
