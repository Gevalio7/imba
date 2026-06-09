<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Utilities
import { createObjectUrl, isImageFile, isImageType } from '@/utils/fileUtils'

// Composables
import { useReferenceData } from '@/composables/useReferenceData'
import { useTicketForm } from '@/composables/useTicketForm'
import { useTicketComments } from '@/composables/useTicketComments'
import { useTicketAttachments } from '@/composables/useTicketAttachments'
import { useImagePreview } from '@/composables/useImagePreview'
import { useTicketHistory } from '@/composables/useTicketHistory'
import { useQuickAnswers } from '@/composables/useQuickAnswers'

// Components
import TicketScheduleDialog from '@/components/TicketEdit/TicketScheduleDialog.vue'
import TicketProperties from '@/components/TicketEdit/TicketProperties.vue'
import TicketCommentsSection from '@/components/TicketEdit/TicketCommentsSection.vue'
import AppTextField from '@/@core/components/app-form-elements/AppTextField.vue'
import TiptapEditor from '@/@core/components/TiptapEditor.vue'

// Page meta
definePage({
  meta: {
    navActiveLink: 'apps-tickets',
    action: 'read',
    subject: 'menu_tickets_list',
  },
})

const router = useRouter()
const route = useRoute()

const ticketId = computed(() => {
  const id = route.query.id
  return id ? Number(id) : null
})

// Reference data
const { data: refData, fetchAll: loadReferenceData, refreshData: refreshReferenceData } = useReferenceData()

// Main ticket form composable
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
  availableTypes,
  currentWorkflow,
  availableStatuses,
  loadingWorkflow,
  allowMultipleExecutorGroups,
  allowMultipleExecutors,
  applyDefaultsFromQueue,
} = useTicketForm(ticketId)

// Comments
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

// Attachments
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

// Image preview
const {
  imagePreview,
  imageZoom,
  openPreview,
  closePreview,
  zoomIn,
  zoomOut,
  resetZoom,
  downloadImage,
} = useImagePreview()

// History
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

// Quick answers - now wired to the actual selected queue from the ticket
const currentQueue = ref({
  quickAnswerArticleIds: [] as number[],
})

// Sync currentQueue with the real queue's quickAnswerArticleIds whenever ticket.queueId or reference data changes
watch([() => ticket.queueId, () => refData.queues], ([newQueueId]) => {
  if (!newQueueId || !refData.queues?.length) {
    currentQueue.value = { quickAnswerArticleIds: [] }
    return
  }

  const selectedQueue = refData.queues.find((q: any) => q.id === newQueueId)
  if (selectedQueue) {
    currentQueue.value = {
      quickAnswerArticleIds: Array.isArray(selectedQueue.quickAnswerArticleIds)
        ? [...selectedQueue.quickAnswerArticleIds]
        : [],
    }
    // Load the actual article content for the quick answers
    nextTick(() => loadQuickAnswers())
  }
}, { immediate: true, deep: true })

const {
  quickAnswerArticles,
  loadingQuickAnswers,
  loadQuickAnswers,
  insertQuickAnswer,
  openQuickAnswersDialog,
  closeQuickAnswersDialog,
} = useQuickAnswers(currentQueue)

// Local state
const scheduleDialog = ref(false)
const activeTab = ref('comments')
const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

// Toast helper
const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

// Управление blob URL для новых вложений (исправление утечки памяти)
// Создаём URL один раз на файл, очищаем при удалении/размонтировании
const attachmentUrlMap = ref(new Map<File, string>())

const getAttachmentUrl = (file: File): string => {
  if (attachmentUrlMap.value.has(file)) {
    return attachmentUrlMap.value.get(file)!
  }
  const url = createObjectUrl(file)
  attachmentUrlMap.value.set(file, url)
  return url
}

const cleanupAttachmentUrls = () => {
  attachmentUrlMap.value.forEach((url) => {
    if (url) URL.revokeObjectURL(url)
  })
  attachmentUrlMap.value.clear()
}

// Отслеживаем удаление файлов для revoke
watch(newAttachments, (newFiles, oldFiles) => {
  if (oldFiles) {
    oldFiles.forEach((file) => {
      if (!newFiles.includes(file)) {
        const url = attachmentUrlMap.value.get(file)
        if (url) {
          URL.revokeObjectURL(url)
          attachmentUrlMap.value.delete(file)
        }
      }
    })
  }
}, { deep: true })

onBeforeUnmount(() => {
  cleanupAttachmentUrls()
})

// Watcher для изменения очереди - автозаполнение наблюдателей и групп наблюдателей
// (для ручного создания/изменения тикета)
watch(() => ticket.queueId, async (newQueueId, oldQueueId) => {
  // Пропускаем: начальную инициализацию формы
  if (oldQueueId === undefined && !newQueueId) {
    return
  }
  
  // Пропускаем: начальную загрузку существующего тикета
  if (ticketId.value && oldQueueId === undefined) {
    console.log('[EDIT-Q-QUEUE-WATCHER] Initial load, skipping auto-apply')
    return
  }
  // Пропускаем: сброс формы (newQueueId === null/undefined)
  if (!newQueueId) {
    console.log('[EDIT-Q-QUEUE-WATCHER] Queue cleared, skipping')
    return
  }

  // Дополнительная проверка: справочники должны быть загружены
  if (!refData.queues || refData.queues.length === 0) {
    console.log('[EDIT-Q-QUEUE-WATCHER] Reference data not loaded yet, skipping')
    return
  }

  console.log('[EDIT-Q-QUEUE-WATCHER] Queue changed', { from: oldQueueId, to: newQueueId })
  // forceUpdate = false — НЕ перезаписываем уже заполненные поля, только добавляем наблюдателей если их нет
  await applyDefaultsFromQueue(newQueueId, false)
})

// Data loading
onMounted(async () => {
  try {
    // Справочные данные загружаем всегда
    await loadReferenceData()

    // Для данных тикета проверяем наличие ticketId, чтобы избежать лишних API вызовов
    if (ticketId.value) {
      await fetchTicket()
      await fetchComments()
      await fetchAttachments()
      await fetchAllHistory()
    } else {
      showToast('ID обращения не указан в URL', 'warning')
    }
  } catch (error: any) {
    console.error('Ошибка загрузки данных в onMounted:', error)
    showToast('Ошибка загрузки данных. Попробуйте обновить страницу.', 'error')
  }
})

// Actions
const cancel = () => {
  router.push('/apps/tickets')
}

const refreshData = async () => {
  try {
    await refreshReferenceData()
    showToast('Справочные данные обновлены', 'success')
  } catch (error) {
    showToast('Ошибка обновления данных', 'error')
  }
}

const handleSave = async () => {
  try {
    await save()
    showToast('Обращение успешно сохранено', 'success')
  } catch (error: any) {
    const message = error.message || 'Ошибка при сохранении обращения'
    showToast(message, 'error')
  }
}

const openScheduleDialog = () => {
  scheduleDialog.value = true
}

const onScheduleUpdate = () => {
  showToast('Расписание обновлено', 'success')
}

// Обработчики обновления из TicketCommentsSection (вынесены из шаблона для производительности)
const updateNewComment = (value: string) => {
  newComment.value = value
}

const updateIsInternalComment = (value: boolean) => {
  isInternalComment.value = value
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
          variant="outlined"
          color="primary"
          @click="refreshData"
        >
          <VIcon
            icon="bx-refresh"
            class="me-2"
          />
          Обновить данные
        </VBtn>
        <VBtn
          variant="tonal"
          color="primary"
          @click="openScheduleDialog"
        >
          <VIcon
            icon="bx-calendar"
            class="me-2"
          />
          Расписание
        </VBtn>
        <VBtn
          v-if="$can('write', 'menu_tickets_list')"
          :loading="saving"
          @click="handleSave"
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
            <div
              v-if="existingAttachments.length > 0"
              class="mb-4"
            >
              <div class="d-flex justify-space-between align-center mb-2">
                <p class="text-body-2 mb-0">
                  Прикрепленные файлы:
                </p>
                <div class="d-flex gap-2">
                  <VBtn
                    v-if="existingAttachments.length > 1"
                    variant="tonal"
                    size="small"
                    color="primary"
                    @click="downloadAllAttachments"
                  >
                    <VIcon
                      icon="bx-download"
                      class="me-1"
                    />
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
                        <VProgressCircular
                          indeterminate
                          size="20"
                        />
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
                    <VIcon
                      icon="bx-file"
                      size="32"
                      color="grey"
                    />
                  </VCard>

                  <!-- Кнопка скачивания -->
                  <VBtn
                    icon
                    size="x-small"
                    color="primary"
                    class="attachment-download-btn"
                    @click.stop="downloadAttachment(attachment)"
                  >
                    <VIcon
                      icon="bx-download"
                      size="14"
                    />
                  </VBtn>

                  <!-- Кнопка удаления -->
                  <VBtn
                    icon
                    size="x-small"
                    color="error"
                    class="attachment-delete-btn"
                    @click="deleteAttachment(attachment.id)"
                  >
                    <VIcon
                      icon="bx-x"
                      size="14"
                    />
                  </VBtn>

                  <!-- Название файла -->
                  <div
                    class="text-caption text-truncate text-center mt-1"
                    style="max-width: 80px;"
                  >
                    {{ attachment.filename }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Новые файлы для загрузки -->
            <div
              v-if="newAttachments.length > 0"
              class="mb-4"
            >
              <p class="text-body-2 mb-2">
                Новые файлы:
              </p>
              <div class="attachments-grid d-flex flex-wrap gap-2">
                <div
                  v-for="(file, index) in newAttachments"
                  :key="index"
                  class="attachment-item position-relative"
                >
                  <!-- Превью для новых изображений -->
                  <VImg
                    v-if="isImageType(file)"
                    :src="getAttachmentUrl(file)"
                    :alt="file.name"
                    class="attachment-thumbnail rounded"
                    cover
                    height="80"
                    width="80"
                  >
                    <template #placeholder>
                      <div class="d-flex align-center justify-center fill-height bg-surface-variant">
                        <VProgressCircular
                          indeterminate
                          size="20"
                        />
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
                    <VIcon
                      icon="bx-file"
                      size="32"
                      color="grey"
                    />
                  </VCard>

                  <!-- Кнопка удаления -->
                  <VBtn
                    icon
                    size="x-small"
                    color="error"
                    class="attachment-delete-btn"
                    @click="removeNewAttachment(index)"
                  >
                    <VIcon
                      icon="bx-x"
                      size="14"
                    />
                  </VBtn>

                  <!-- Название файла -->
                  <div
                    class="text-caption text-truncate text-center mt-1"
                    style="max-width: 80px;"
                  >
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
           @update:new-comment="updateNewComment"
           @update:is-internal-comment="updateIsInternalComment"
          @add-comment="addComment"
          @start-edit-comment="startEditComment"
          @save-edit-comment="saveEditComment"
          @cancel-edit-comment="cancelEditComment"
          @delete-comment="confirmDeleteComment"
          @open-quick-answers="openQuickAnswersDialog"
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
           :available-types="availableTypes"
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
              style="cursor: pointer"
              @click="resetZoom"
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

            <VDivider
              vertical
              class="mx-2"
            />

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

            <VDivider
              vertical
              class="mx-2"
            />

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
        <VCardText
          class="d-flex justify-center align-center pa-0"
          style="overflow: auto;"
        >
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

    <!-- Диалог расписания -->
    <TicketScheduleDialog
      v-if="scheduleDialog"
      v-model="scheduleDialog"
      :schedule="null"
      :saving="false"
      :ticket-id="ticketId"
      @update="onScheduleUpdate"
    />
  </div>
</template>

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
