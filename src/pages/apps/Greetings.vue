<script setup lang="ts">
import EntityList, { type EntityListHeader } from '@/components/EntityList.vue'
import type { BaseEntity } from '@/composables/useEntityCrud'

definePage({
  meta: {
    navActiveLink: 'apps-greetings',
    action: 'read',
    subject: 'menu_greetings',
  },
})

interface Greetings extends BaseEntity {
  name: string
  content: string
  comment: string
}

const headers: EntityListHeader[] = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Содержание', key: 'content', sortable: false },
  { title: 'Комментарий', key: 'comment', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

const stripHtmlTags = (html: string) => html.replace(/<[^>]*>/g, '')
</script>

<template>
  <div>
    <EntityList
      :config="{
        endpoint: '/greetings',
        itemName: 'приветствия',
        defaultItem: {
          id: -1, name: '', content: '', comment: '',
          createdAt: '', updatedAt: '', isActive: true,
        },
      }"
      :headers="headers"
      :subject="'menu_greetings'"
      :title="'Приветствия'"
      add-button-label="Добавить приветствие"
      :edit-dialog-title-create="'Добавить приветствие'"
      :edit-dialog-title-edit="'Редактировать приветствие'"
      search-placeholder="Поиск приветствий"
      show-export
      show-items-per-page
      show-status-filter
      show-edit-dialog
      show-delete-dialog
    >
      <!-- Содержание (обрезаем HTML) -->
      <template #item.content="{ item }">
        <span
          class="text-body-2 text-truncate d-inline-block"
          style="max-inline-size: 300px;"
        >
          {{ stripHtmlTags(item.content) || '-' }}
        </span>
      </template>

      <!-- Кастомная форма редактирования (TiptapEditor) -->
      <template #edit-form="{ editedItem, save, close }">
        <VRow>
          <VCol cols="12">
            <AppTextField v-model="editedItem.name" label="Название *" />
          </VCol>
          <VCol cols="12">
            <TiptapEditor
              v-model="editedItem.content"
              placeholder="Содержание"
              style="border: 1px solid #ccc; border-radius: 4px; min-block-size: 200px;"
            />
          </VCol>
          <VCol cols="12">
            <AppTextarea
              v-model="editedItem.comment"
              label="Комментарий"
              rows="3"
              placeholder="Введите комментарий..."
            />
          </VCol>
          <VCol cols="12">
            <VSwitch
              v-model="editedItem.isActive"
              label="Активен"
              color="primary"
            />
          </VCol>
        </VRow>
        <div class="self-align-end d-flex gap-4 justify-end mt-4">
          <VBtn color="error" variant="outlined" @click="close">Отмена</VBtn>
          <VBtn color="success" variant="elevated" @click="save">Сохранить</VBtn>
        </div>
      </template>
    </EntityList>
  </div>
</template>
