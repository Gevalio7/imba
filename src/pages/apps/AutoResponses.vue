<script setup lang="ts">
import EntityList, { type EntityListHeader } from '@/components/EntityList.vue'
import type { BaseEntity } from '@/composables/useEntityCrud'

interface AutoResponses extends BaseEntity {
  name: string
  trigger: string
  response: string
  delay: number
}

definePage({
  meta: {
    action: 'read',
    subject: 'menu_auto_responses',
  },
})

const headers: EntityListHeader[] = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Триггер', key: 'trigger', sortable: true },
  { title: 'Ответ', key: 'response', sortable: true },
  { title: 'Задержка', key: 'delay', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]
</script>

<template>
  <EntityList
    :config="{
      endpoint: '/autoResponses',
      itemName: 'автоответы',
      defaultItem: {
        id: -1,
        name: '',
        trigger: '',
        response: '',
        delay: 0,
        createdAt: '',
        updatedAt: '',
        isActive: true,
      },
    }"
    :headers="headers"
    title="Автоответы"
    subject="menu_auto_responses"
    add-button-label="Добавить автоответ"
    edit-dialog-title-create="Добавить автоответ"
    edit-dialog-title-edit="Редактировать автоответ"
    search-placeholder="Поиск автоответа"
  >
    <!-- Кастомная форма редактирования -->
    <template #edit-form="{ editedItem, close, save }">
      <VRow>
        <VCol
          cols="12"
          sm="6"
        >
          <AppTextField
            v-model="editedItem.name"
            label="Название *"
          />
        </VCol>

        <VCol cols="12">
          <AppTextField
            v-model="editedItem.trigger"
            label="Триггер"
          />
        </VCol>

        <VCol cols="12">
          <AppTextField
            v-model="editedItem.response"
            label="Ответ"
          />
        </VCol>

        <VCol
          cols="12"
          sm="6"
        >
          <AppTextField
            v-model="editedItem.delay"
            label="Задержка"
            type="number"
            min="0"
          />
        </VCol>

        <VCol
          cols="12"
          sm="6"
        >
          <VSwitch
            v-model="editedItem.isActive"
            label="Активен"
            color="primary"
          />
        </VCol>
      </VRow>

      <div class="self-align-end d-flex gap-4 justify-end mt-4">
        <VBtn
          color="error"
          variant="outlined"
          @click="close"
        >
          Отмена
        </VBtn>
        <VBtn
          color="success"
          variant="elevated"
          @click="save"
        >
          Сохранить
        </VBtn>
      </div>
    </template>
  </EntityList>
</template>
