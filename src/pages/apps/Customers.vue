<script setup lang="ts">
import EntityList, { type EntityListHeader } from '@/components/EntityList.vue'
import type { BaseEntity } from '@/composables/useEntityCrud'

interface Customers extends BaseEntity {
  name: string
  street: string
  zip: string
  city: string
  comment: string
}

definePage({
  meta: {
    action: 'read',
    subject: 'menu_companies_list',
  },
})

const headers: EntityListHeader[] = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Улица', key: 'street', sortable: true },
  { title: 'Индекс', key: 'zip', sortable: true },
  { title: 'Город', key: 'city', sortable: true },
  { title: 'Комментарий', key: 'comment', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]
</script>

<template>
  <EntityList
    :config="{
      endpoint: '/customers',
      itemName: 'компании',
      defaultItem: {
        id: -1,
        name: '',
        street: '',
        zip: '',
        city: '',
        comment: '',
        createdAt: '',
        updatedAt: '',
        isActive: true,
      },
      customFilter: (item, query) => {
        const c = item as Customers
        return (
          c.name?.toLowerCase().includes(query)
          || c.city?.toLowerCase().includes(query)
          || c.street?.toLowerCase().includes(query)
          || c.comment?.toLowerCase().includes(query)
        )
      },
    }"
    :headers="headers"
    title="Компании"
    subject="menu_companies_list"
    add-button-label="Добавить компанию"
    edit-dialog-title-create="Добавить компанию"
    edit-dialog-title-edit="Редактировать компанию"
    search-placeholder="Поиск компании"
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
            v-model="editedItem.street"
            label="Улица"
          />
        </VCol>

        <VCol cols="12">
          <AppTextField
            v-model="editedItem.zip"
            label="Индекс"
          />
        </VCol>

        <VCol cols="12">
          <AppTextField
            v-model="editedItem.city"
            label="Город"
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
