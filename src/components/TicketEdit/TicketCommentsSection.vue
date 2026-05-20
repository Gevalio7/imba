<script setup lang="ts">
import { ref } from 'vue'
import CommentItem from './CommentItem.vue'
import CommentForm from './CommentForm.vue'
import HistoryTimeline from './HistoryTimeline.vue'
import type { Article, TicketComment } from '@/types/ticket'

interface Props {
  comments: TicketComment[]
  newComment: string
  isInternalComment: boolean
  savingComment: boolean
  editingCommentId: number | null
  editingCommentContent: string
  historyChanges: any[]
  loadingHistory: boolean
  approvalHistory: any[]
  loadingApproval: boolean
  statusHistory: any[]
  loadingStatusHistory: boolean
  showQuickAnswers: boolean
  quickAnswersLoading: boolean
  quickAnswers: Article[]
}

const props = defineProps<Props>()

defineEmits<{
  'update:newComment': [value: string]
  'update:isInternalComment': [value: boolean]
  'add-comment': []
  'start-edit-comment': [comment: TicketComment]
  'save-edit-comment': [commentId: number, content: string]
  'cancel-edit-comment': []
  'delete-comment': [commentId: number]
  'open-quick-answers': []
  'insert-quick-answer': [article: Article]
}>()

const activeTab = ref('comments')
</script>

<template>
  <VCard class="mb-6">
    <VTabs v-model="activeTab">
      <VTab value="comments">
        Комментарии
        <VChip
          v-if="comments.length > 0"
          size="x-small"
          color="primary"
          class="ms-2"
        >
          {{ comments.length }}
        </VChip>
      </VTab>
      <VTab value="history">
        История изменений
        <VChip
          v-if="historyChanges.length > 0"
          size="x-small"
          color="secondary"
          class="ms-2"
        >
          {{ historyChanges.length }}
        </VChip>
      </VTab>
      <VTab value="approval">
        История согласования
        <VChip
          v-if="approvalHistory.length > 0"
          size="x-small"
          color="success"
          class="ms-2"
        >
          {{ approvalHistory.length }}
        </VChip>
      </VTab>
      <VTab value="statusHistory">
        История переходов
        <VChip
          v-if="statusHistory.length > 0"
          size="x-small"
          color="info"
          class="ms-2"
        >
          {{ statusHistory.length }}
        </VChip>
      </VTab>
    </VTabs>

    <VCardText>
      <VWindow v-model="activeTab">
        <!-- Вкладка Комментарии -->
        <VWindowItem value="comments">
          <!-- Список комментариев -->
          <div
            v-if="comments.length > 0"
            class="comments-list mb-6"
          >
            <CommentItem
              v-for="comment in comments"
              :key="comment.id"
              :comment="comment"
              :editing-id="editingCommentId"
              :editing-content="editingCommentContent"
              @start-edit="$emit('start-edit-comment', comment)"
              @save-edit="$emit('save-edit-comment', comment.id, $event)"
              @cancel-edit="$emit('cancel-edit-comment')"
              @delete="$emit('delete-comment', comment.id)"
            />
          </div>

          <!-- Форма добавления комментария -->
          <CommentForm
            :new-comment="newComment"
            :is-internal-comment="isInternalComment"
            :saving="savingComment"
            :show-quick-answers="showQuickAnswers"
            :quick-answers-loading="quickAnswersLoading"
            :quick-answers="quickAnswers"
            @update:new-comment="$emit('update:newComment', $event)"
            @update:is-internal-comment="$emit('update:isInternalComment', $event)"
            @add="$emit('add-comment')"
            @open-quick-answers="$emit('open-quick-answers')"
            @insert-quick-answer="$emit('insert-quick-answer', $event)"
          />
        </VWindowItem>

        <!-- Вкладка История изменений -->
        <VWindowItem value="history">
          <HistoryTimeline
            :items="historyChanges"
            :loading="loadingHistory"
            type="changes"
            empty-message="История изменений пуста"
          />
        </VWindowItem>

        <!-- Вкладка История согласования -->
        <VWindowItem value="approval">
          <HistoryTimeline
            :items="approvalHistory"
            :loading="loadingApproval"
            type="approval"
            empty-message="История согласования пуста"
          />
        </VWindowItem>

        <!-- Вкладка История переходов -->
        <VWindowItem value="statusHistory">
          <HistoryTimeline
            :items="statusHistory"
            :loading="loadingStatusHistory"
            type="status"
            empty-message="История переходов пуста"
          />
        </VWindowItem>
      </VWindow>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.comments-list {
  max-block-size: 400px;
  overflow-y: auto;
}
</style>
