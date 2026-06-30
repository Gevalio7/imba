<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import EntityList, { type EntityListHeader } from '@/components/EntityList.vue'
import type { BaseEntity } from '@/composables/useEntityCrud'

definePage({
  meta: {
    navActiveLink: 'apps-signatures',
    action: 'read',
    subject: 'menu_signatures',
  },
})

interface Signatures extends BaseEntity {
  name: string
  content: string
  comment: string
}

const entityListRef = ref<any>(null)

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

// === Кастомный фильтр по названиям ===
const selectedNames = ref<string[]>([])
const searchNames = ref<string | null>(null)

const uniqueNames = computed<string[]>(() => {
  if (!entityListRef.value?.items?.value) return []
  const names = (entityListRef.value.items.value as Signatures[]).map((p: Signatures) => p.name)
  return [...new Set(names)].sort()
})

watch(selectedNames, value => {
  if (value.length > 10)
    nextTick(() => selectedNames.value.pop())
})
</script>

<template>
  <div>
    <EntityList
      ref="entityListRef"
      :config="{
        endpoint: '/signatures',
        itemName: 'подписи',
        defaultItem: {
          id: -1, name: '', content: '', comment: '',
          createdAt: '', updatedAt: '', isActive: true,
        },
        filterCallback: (item) => {
          if (selectedNames.length > 0 && !selectedNames.includes(item.name))
            return false
          return true
        },
      }"
      :headers="headers"
      :subject="'menu_signatures'"
      :title="'Подписи'"
      add-button-label="Добавить подпись"
      :edit-dialog-title-create="'Добавить подпись'"
      :edit-dialog-title-edit="'Редактировать подпись'"
      search-placeholder="Поиск подписей"
      show-export
      show-items-per-page
      show-status-filter
      show-edit-dialog
      show-delete-dialog
    >
      <!-- Кастомный фильтр: выбор по названиям -->
      <template #filter-content>
        <VRow>
          <VCol cols="12">
            <AppCombobox
              v-model="selectedNames"
              v-model:search-input="searchNames"
              :items="uniqueNames"
              hide-selected
              :hide-no-data="false"
              placeholder="Выберите названия"
              hint="Максимум 10 названий"
              label="Названия подписей"
              multiple
              persistent-hint
            >
              <template #no-data>
                <VListItem>
                  <VListItemTitle>
                    Нет результатов для "<strong>{{ searchNames }}</strong>"
                  </VListItemTitle>
                </VListItem>
              </template>
            </AppCombobox>
          </VCol>
        </VRow>
      </template>

      <!-- Содержание (обрезаем HTML) -->
      <template #item.content="{ item }">
        <span
          class="text-body-2 text-truncate d-inline-block"
          style="max-inline-size: 300px;"
        >
          {{ (item.content || '').replace(/<[^>]*>/g, '') || '-' }}
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
              placeholder="Message"
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
