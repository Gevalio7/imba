<script setup lang="ts">
import { ref } from 'vue'
import { useShareMenu } from '@/composables/useShareMenu'
import { createObjectUrl, isImageFile, isImageType } from '@/utils/fileUtils'
import type { TicketAttachment } from '@/types/ticket'

interface Props {
  ticketNumber: string
  existingAttachments: TicketAttachment[]
  newAttachments: File[]
}

const props = defineProps<Props>()

defineEmits<{
  preview: [attachment: TicketAttachment]
  download: [attachment: TicketAttachment]
  delete: [attachmentId: number]
  'download-all': []
  'remove-new': [index: number]
  'file-select': [event: Event]
}>()

const showShareMenu = ref(false)

const { shareToTelegram, shareToMail, shareToEmail } = useShareMenu(
  () => props.ticketNumber,
  () => props.existingAttachments,
)
</script>

<template>
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
            <VMenu
              v-model="showShareMenu"
              :close-on-content-click="false"
              location="bottom end"
            >
              <template #activator="{ props }">
                <VBtn
                  v-if="existingAttachments.length > 0"
                  v-bind="props"
                  icon
                  variant="tonal"
                  size="small"
                  color="info"
                >
                  <VIcon icon="bx-share" />
                </VBtn>
              </template>
              <VList
                density="compact"
                nav
              >
                <VListItem
                  prepend-icon="bxl-telegram"
                  title="Telegram"
                  @click="shareToTelegram"
                />
                <VListItem
                  prepend-icon="bxl-mail.ru"
                  title="Mail.ru"
                  @click="shareToMail"
                />
                <VListItem
                  prepend-icon="bx-envelope"
                  title="Email"
                  @click="shareToEmail"
                />
              </VList>
            </VMenu>

            <VBtn
              v-if="existingAttachments.length > 1"
              variant="tonal"
              size="small"
              color="primary"
              @click="$emit('download-all')"
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
              @click="$emit('preview', attachment)"
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
              @click="$emit('preview', attachment)"
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
              @click.stop="$emit('download', attachment)"
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
              @click.stop="$emit('delete', attachment.id)"
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
              :src="createObjectUrl(file)"
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
              @click="$emit('remove-new', index)"
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
            @change="$emit('file-select', $event)"
          >
          Выберите файлы
        </VBtn>
      </div>
    </VCardText>
  </VCard>
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
