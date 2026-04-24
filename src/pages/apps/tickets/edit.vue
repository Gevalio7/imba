<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReferenceData } from '@/composables/useReferenceData'
import { useTicketForm } from '@/composables/useTicketForm'
import { useTicketComments } from '@/composables/useTicketComments'
import { useTicketAttachments } from '@/composables/useTicketAttachments'
import { useImagePreview } from '@/composables/useImagePreview'
import { useTicketHistory } from '@/composables/useTicketHistory'
import { useQuickAnswers } from '@/composables/useQuickAnswers'

definePage({
  meta: {
    navActiveLink: 'apps-tickets',
  },
})

const router = useRouter()
const route = useRoute()

const ticketId = computed(() => {
  const id = route.query.id
  return id ? Number(id) : null
})

// Use composables
const { data: refData, fetchAll: loadReferenceData } = useReferenceData()

const {
  ticket,
  description,
  saving,
  save,
  fetchTicket,
  filteredServices,
  filteredCategories,
  hasCategoriesForType,
  categoryVisible,
  currentWorkflow,
  availableStatuses,
  loadingWorkflow,
  allowMultipleExecutorGroups,
  allowMultipleExecutors,
} = useTicketForm(ticketId)

const {
  comments,
  newComment,
  isInternalComment,
  savingComment,
  editingCommentId,
  editingCommentContent,
  deletingCommentId,
  showDeleteDialog,
  fetchComments,
  addComment,
  startEditComment,
  cancelEditComment,
  saveEditComment,
  confirmDeleteComment,
  deleteComment,
} = useTicketComments(ticketId)

const {
  existingAttachments,
  newAttachments,
  fetchAttachments,
  uploadNewAttachments,
  deleteAttachment,
  downloadAttachment,
  downloadAllAttachments,
  handleFileSelect,
  removeNewAttachment,
} = useTicketAttachments(ticketId)

const {
  imagePreview,
  imageZoom,
  openPreview,
  closePreview,
  zoomIn,
  zoomOut,
  resetZoom,
  downloadImage,
  printImage,
} = useImagePreview()

const {
  historyChanges,
  loadingHistory,
  approvalHistory,
  loadingApproval,
  statusHistory,
  loadingStatusHistory,
  fetchHistory,
  fetchApprovalHistory,
  fetchStatusHistory,
  fetchAllHistory,
} = useTicketHistory(ticketId)

// Create a computed queue ref for quick answers
const currentQueue = computed(() => ({
  quickAnswerArticleIds: []
}))

const {
  quickAnswerArticles,
  loadingQuickAnswers,
  loadQuickAnswers,
  insertQuickAnswer,
  openQuickAnswersDialog,
  closeQuickAnswersDialog,
} = useQuickAnswers(currentQueue)

// Initialize data
onMounted(async () => {
  await loadReferenceData()
  await fetchTicket()
  await fetchComments()
  await fetchAttachments()
  await fetchAllHistory()
})

// Toast notifications
const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

// Cancel action
const cancel = () => {
  router.push('/apps-tickets')
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex flex-wrap justify-start justify-sm-space-between gap-y-4 gap-x-6 mb-6">
      <div class="d-flex flex-column justify-center">
        <h4 class="text-h4 mb-1">
          Редактирование обращения
        </h4>
        <div
          v-if="ticket.ticketNumber"
          class="text-body-1"
        >
          #{{ ticket.ticketNumber }}
        </div>
      </div>

      <div class="d-flex gap-4 align-center flex-wrap">
        <VBtn
          variant="tonal"
          color="secondary"
          @click="cancel"
        >
          Отмена
        </VBtn>
        <VBtn
          :loading="saving"
          @click="save"
        >
          Сохранить
        </VBtn>
      </div>
    </div>

    <VRow>
      <!-- Левая колонка - Основная информация -->
      <VCol
        cols="12"
        md="8"
      >
        <!-- Основная информация -->
        <VCard class="mb-6">
          <VCardTitle class="d-flex align-center px-6 py-4">
            <h5 class="text-h5">
              Основная информация
            </h5>
          </VCardTitle>

          <VCardText>
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="ticket.title"
                  label="Заголовок *"
                  placeholder="Введите заголовок обращения"
                />
              </VCol>

              <VCol cols="12">
                <label class="v-label text-body-1 d-block mb-2">Описание</label>
                <TiptapEditor
                  v-model="description"
                  placeholder="Введите подробное описание проблемы"
                  class="border rounded"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Вложения -->
        <VCard class="mb-6">
          <VCardTitle class="d-flex align-center px-6 py-4">
            <h5 class="text-h5">
              Вложения
            </h5>
          </VCardTitle>
          <VCardText>
            <!-- Существующие вложения -->
            <div v-if="existingAttachments.length > 0" class="mb-4">
              <div class="d-flex justify-space-between align-center mb-2">
                <p class="text-body-2 mb-0">Прикрепленные файлы:</p>
                <div class="d-flex gap-2">
                  <VBtn
                    v-if="existingAttachments.length > 1"
                    variant="tonal"
                    size="small"
                    color="primary"
                    @click="downloadAllAttachments"
                  >
                    <VIcon icon="bx-download" class="me-1" />
                    Скачать все
                  </VBtn>
                </div>
              </div>
              <div class="attachments-grid d-flex flex-wrap gap-2">
                <div
                  v-for="attachment in existingAttachments"
                  :key="attachment.id"
                  class="attachment-item position-relative"
                >
                  <!-- Изображение - показываем превью -->
                  <VImg
                    v-if="isImageFile(attachment.filename)"
                    :src="`/uploads/${attachment.filename}`"
                    :alt="attachment.filename"
                    class="attachment-thumbnail rounded cursor-pointer"
                    cover
                    height="80"
                    width="80"
                    @click="openPreview(attachment)"
                  >
                    <template #placeholder>
                      <div class="d-flex align-center justify-center fill-height bg-surface-variant">
                        <VProgressCircular indeterminate size="20" />
                      </div>
                    </template>
                  </VImg>

                  <!-- Иконка для не-изображений -->
                  <VCard
                    v-else
                    class="attachment-thumbnail rounded d-flex align-center justify-center cursor-pointer"
                    height="80"
                    width="80"
                    @click="openPreview(attachment)"
                  >
                    <VIcon icon="bx-file" size="32" color="grey" />
                  </VCard>

                  <!-- Кнопка скачивания -->
                  <VBtn
                    icon
                    size="x-small"
                    color="primary"
                    class="attachment-download-btn"
                    @click.stop="downloadAttachment(attachment)"
                  >
                    <VIcon icon="bx-download" size="14" />
                  </VBtn>

                  <!-- Кнопка удаления -->
                  <VBtn
                    icon
                    size="x-small"
                    color="error"
                    class="attachment-delete-btn"
                    @click="deleteAttachment(attachment.id)"
                  >
                    <VIcon icon="bx-x" size="14" />
                  </VBtn>

                  <!-- Название файла -->
                  <div class="text-caption text-truncate text-center mt-1" style="max-width: 80px;">
                    {{ attachment.filename }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Новые файлы для загрузки -->
            <div v-if="newAttachments.length > 0" class="mb-4">
              <p class="text-body-2 mb-2">Новые файлы:</p>
              <div class="attachments-grid d-flex flex-wrap gap-2">
                <div
                  v-for="(file, index) in newAttachments"
                  :key="index"
                  class="attachment-item position-relative"
                >
                  <!-- Превью для новых изображений -->
                  <VImg
                    v-if="isImageType(file)"
                    :src="createObjectUrl(file)"
                    :alt="file.name"
                    class="attachment-thumbnail rounded"
                    cover
                    height="80"
                    width="80"
                  >
                    <template #placeholder>
                      <div class="d-flex align-center justify-center fill-height bg-surface-variant">
                        <VProgressCircular indeterminate size="20" />
                      </div>
                    </template>
                  </VImg>

                  <!-- Иконка для не-изображений -->
                  <VCard
                    v-else
                    class="attachment-thumbnail rounded d-flex align-center justify-center"
                    height="80"
                    width="80"
                  >
                    <VIcon icon="bx-file" size="32" color="grey" />
                  </VCard>

                  <!-- Кнопка удаления -->
                  <VBtn
                    icon
                    size="x-small"
                    color="error"
                    class="attachment-delete-btn"
                    @click="removeNewAttachment(index)"
                  >
                    <VIcon icon="bx-x" size="14" />
                  </VBtn>

                  <!-- Название файла -->
                  <div class="text-caption text-truncate text-center mt-1" style="max-width: 80px;">
                    {{ file.name }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Drop Zone -->
            <div class="drop-zone pa-6 text-center">
              <VIcon
                icon="bx-cloud-upload"
                size="36"
                color="primary"
                class="mb-2"
              />
              <p class="text-body-2 mb-2">
                Перетащите файлы сюда или
              </p>
              <VBtn
                variant="tonal"
                color="primary"
                size="small"
                tag="label"
                class="cursor-pointer"
              >
                <input
                  type="file"
                  multiple
                  hidden
                  @change="handleFileSelect"
                >
                Выберите файлы
              </VBtn>
            </div>
          </VCardText>
        </VCard>

        <!-- Комментарии и история -->
        <TicketCommentsSection
          :comments="comments"
          :new-comment="newComment"
          :is-internal-comment="isInternalComment"
          :saving-comment="savingComment"
          :editing-comment-id="editingCommentId"
          :editing-comment-content="editingCommentContent"
          :history-changes="historyChanges"
          :loading-history="loadingHistory"
          :approval-history="approvalHistory"
          :loading-approval="loadingApproval"
          :status-history="statusHistory"
          :loading-status-history="loadingStatusHistory"
          :show-quick-answers="true"
          :quick-answers-loading="loadingQuickAnswers"
          :quick-answers="quickAnswerArticles"
          @update:newComment="(value) => newComment = value"
          @update:isInternalComment="(value) => isInternalComment = value"
          @add-comment="addComment"
          @start-edit-comment="startEditComment"
          @save-edit-comment="saveEditComment"
          @cancel-edit-comment="cancelEditComment"
          @delete-comment="confirmDeleteComment"
          @open-quick-answers="openQuickAnswersDialog"
          @insert-quick-answer="insertQuickAnswer"
        />
      </VCol>

      <!-- Правая колонка - Свойства тикета -->
      <VCol
        cols="12"
        md="4"
      >
        <TicketProperties
          :ticket="ticket"
          :reference-data="refData"
          :available-statuses="availableStatuses"
          :current-workflow="currentWorkflow"
          :allow-multiple-executor-groups="allowMultipleExecutorGroups"
          :allow-multiple-executors="allowMultipleExecutors"
          :filtered-services="filteredServices"
          :filtered-categories="filteredCategories"
          :has-categories-for-type="hasCategoriesForType"
          :category-visible="categoryVisible"
        />
      </VCol>
    </VRow>

    <!-- Snackbar -->
    <VSnackbar
      v-model="isToastVisible"
      :color="toastColor"
      timeout="3000"
    >
      {{ toastMessage }}
    </VSnackbar>

    <!-- Диалог подтверждения удаления комментария -->
    <VDialog
      v-model="showDeleteDialog"
      max-width="400"
    >
      <VCard>
        <VCardTitle>Удаление комментария</VCardTitle>
        <VCardText>
          Вы уверены, что хотите удалить этот комментарий? Это действие нельзя отменить.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="tonal"
            @click="showDeleteDialog = false"
          >
            Отмена
          </VBtn>
          <VBtn
            color="error"
            @click="deleteComment"
          >
            Удалить
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Превью изображения -->
    <VDialog
      v-model="imagePreview.show"
      max-width="90%"
      width="auto"
    >
      <VCard class="pa-2">
        <VCardTitle class="d-flex justify-space-between align-center">
          <span class="text-truncate">{{ imagePreview.filename }}</span>
          <div class="d-flex align-center gap-1">
            <!-- Кнопки управления зумом -->
            <VBtn
              icon
              variant="text"
              size="small"
              :disabled="imageZoom <= 25"
              @click="zoomOut"
            >
              <VIcon icon="bx-zoom-out" />
            </VBtn>
            <VChip
              size="small"
              variant="tonal"
              class="mx-1"
              @click="resetZoom"
              style="cursor: pointer"
            >
              {{ imageZoom }}%
            </VChip>
            <VBtn
              icon
              variant="text"
              size="small"
              :disabled="imageZoom >= 300"
              @click="zoomIn"
            >
              <VIcon icon="bx-zoom-in" />
            </VBtn>

            <VDivider vertical class="mx-2" />

            <!-- Кнопка скачивания -->
            <VBtn
              icon
              variant="text"
              size="small"
              @click="downloadImage"
            >
              <VIcon icon="bx-download" />
            </VBtn>

            <!-- Кнопка печати -->
            <VBtn
              icon
              variant="text"
              size="small"
            >
              <VIcon icon="bx-printer" />
            </VBtn>

            <VDivider vertical class="mx-2" />

            <!-- Кнопка закрытия -->
            <VBtn
              icon
              variant="text"
              size="small"
              @click="closePreview"
            >
              <VIcon icon="bx-x" />
            </VBtn>
          </div>
        </VCardTitle>
        <VCardText class="d-flex justify-center align-center pa-0" style="overflow: auto;">
          <VImg
            :src="imagePreview.src"
            :alt="imagePreview.filename"
            :max-height="imageZoom > 100 ? 'none' : '80vh'"
            :max-width="imageZoom > 100 ? 'none' : '90vw'"
            :height="imageZoom > 100 ? `${imageZoom}%` : 'auto'"
            :width="imageZoom > 100 ? `${imageZoom}%` : 'auto'"
            contain
            :style="imageZoom > 100 ? 'object-fit: contain;' : ''"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="tonal"
            @click="closePreview"
          >
            Закрыть
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script lang="ts">
// Import utilities
import { formatDate } from '@/utils/slaFormatter'
import { isImageFile, isImageType, createObjectUrl } from '@/utils/fileUtils'
import TicketProperties from '@/components/TicketEdit/TicketProperties.vue'
import TicketCommentsSection from '@/components/TicketEdit/TicketCommentsSection.vue'

// Active tab for comments/history
const activeTab = ref('comments')
</script>

<style lang="scss" scoped>
.drop-zone {
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 6px;
  transition: border-color 0.2s;

  &:hover {
    border-color: rgba(var(--v-theme-primary), 0.5);
  }
}

.comments-list {
  max-block-size: 400px;
  overflow-y: auto;
}

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
}

// Стили для миниатюр вложений
.attachments-grid {
  .attachment-item {
    &:hover {
      .attachment-download-btn,
      .attachment-delete-btn {
        opacity: 1;
      }
    }
  }

  .attachment-thumbnail {
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  .attachment-download-btn {
    position: absolute;
    top: -8px;
    left: -8px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .attachment-delete-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    opacity: 0;
    transition: opacity 0.2s;
  }
}
</style>