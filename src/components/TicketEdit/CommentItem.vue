<script setup lang="ts">
import { formatDateTime } from '@/utils/slaFormatter'
import type { TicketComment } from '@/types/ticket'
import TiptapEditor from '@/@core/components/TiptapEditor.vue'

interface Props {
  comment: TicketComment
  editingId: number | null
  editingContent: string
}

defineProps<Props>()

defineEmits<{
  'start-edit': []
  'save-edit': [content: string]
  'cancel-edit': []
  'delete': []
}>()
</script>

<template>
  <div
    class="comment-item pa-4 mb-3 rounded"
    :class="comment.isInternal ? 'internal-comment' : 'external-comment'"
  >
    <div class="d-flex justify-space-between align-start mb-2">
      <div class="d-flex align-center">
        <VAvatar
          size="32"
          color="primary"
          class="me-2"
        >
          <VImg
            v-if="comment.authorAvatar"
            :src="comment.authorAvatar"
          />
          <span
            v-else
            class="text-caption"
          >{{ (comment.authorName || comment.author || 'U').charAt(0).toUpperCase() }}</span>
        </VAvatar>
        <div>
          <div class="text-body-1 font-weight-medium">
            {{ comment.authorName || comment.author || 'Пользователь' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ formatDateTime(comment.createdAt) }}
          </div>
        </div>
      </div>
      <div class="d-flex align-center gap-1">
        <VChip
          v-if="comment.isInternal"
          size="x-small"
          color="warning"
          variant="flat"
          class="me-2"
        >
          Внутренний
        </VChip>
        <VBtn
          icon
          variant="text"
          size="small"
          @click="$emit('start-edit')"
        >
          <VIcon
            icon="bx-edit"
            size="18"
          />
        </VBtn>
        <VBtn
          icon
          variant="text"
          color="error"
          size="small"
          @click="$emit('delete')"
        >
          <VIcon
            icon="bx-trash"
            size="18"
          />
        </VBtn>
      </div>
    </div>

    <!-- Режим редактирования -->
    <div v-if="editingId === comment.id">
      <TiptapEditor
        :model-value="editingContent"
        placeholder="Редактируйте комментарий..."
        :min-height="60"
        class="mb-2"
        @update:model-value="$emit('save-edit', $event)"
      />
      <div class="d-flex gap-2 justify-end">
        <VBtn
          variant="tonal"
          size="small"
          @click="$emit('cancel-edit')"
        >
          Отмена
        </VBtn>
        <VBtn
          size="small"
          @click="$emit('save-edit', editingContent)"
        >
          Сохранить
        </VBtn>
      </div>
    </div>

    <!-- Обычный режим -->
    <div
      v-else
      class="text-body-2 comment-content"
      v-html="comment.content"
    />
  </div>
</template>

<style lang="scss" scoped>
.comment-item {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.internal-comment {
  background-color: rgba(var(--v-theme-warning), 0.05);
  border-inline-start: 3px solid rgb(var(--v-theme-warning));
}

.external-comment {
  background-color: rgba(var(--v-theme-primary), 0.02);
  border-inline-start: 3px solid rgb(var(--v-theme-primary));
}

.comment-content {
  word-break: break-word;
  padding-left: 8px;           // Отступ от левой рамки (внутренний + border)
  padding-right: 4px;

  // Хорошая типографика для богатого контента (из Tiptap / быстрых ответов)
  p {
    margin: 0 0 8px 0;
    line-height: 1.5;
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 12px 0 6px 0;
    line-height: 1.3;
    font-weight: 600;
  }

  ul, ol {
    margin: 0 0 8px 0;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }

  blockquote {
    margin: 8px 0;
    padding-left: 12px;
    border-left: 3px solid rgba(var(--v-theme-on-surface), 0.2);
    color: rgba(var(--v-theme-on-surface), 0.7);
  }

  pre {
    background: rgba(var(--v-theme-on-surface), 0.05);
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
    margin: 8px 0;
  }
}
</style>
