<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import EntityList, { type EntityListHeader } from '@/components/EntityList.vue'
import type { BaseEntity } from '@/composables/useEntityCrud'

// Типы данных для Состояние
interface States extends BaseEntity {
  name: string
  comment: string
  type: string
  color: string
}

// Экземпляр EntityList — доступ через ref
// TODO: типизировать через InstanceType<typeof EntityList> после решения generic-mixin в TypeScript
const entityListRef = ref<any>(null)

// Заголовки таблицы
const headers: EntityListHeader[] = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Тип', key: 'type', sortable: true },
  { title: 'Цвет', key: 'color', sortable: true },
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
  const names = (entityListRef.value.items.value as States[]).map((p: States) => p.name)
  return [...new Set(names)].sort()
})

// Опции типа
const typeOptions = [
  'Закрыта', 'Новая', 'Объединенные', 'Ожидает автозакрытия',
  'Ожидает напоминания', 'Открыта', 'Удалена', 'Эскалирована',
]

watch(selectedNames, value => {
  if (value.length > 10)
    setTimeout(() => selectedNames.value.pop())
})
</script>

<template>
  <div>
    <EntityList
      ref="entityListRef"
      :config="{
        endpoint: '/states',
        itemName: 'состояния',
        defaultItem: {
          id: -1, name: '', comment: '', type: '', color: '',
          createdAt: '', updatedAt: '', isActive: true,
        },
      }"
      :headers="headers"
      :subject="'menu_states'"
      :title="'Состояния'"
      :add-button-label="'Добавить состояние'"
      :edit-dialog-title-create="'Добавить состояние'"
      :edit-dialog-title-edit="'Редактировать состояние'"
      search-placeholder="Поиск состояния"
      show-export
      show-items-per-page
      show-status-filter
      show-edit-dialog
      show-delete-dialog
      edit-dialog-max-width="600px"
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
              label="Названия состояний"
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

      <!-- Кастомная колонка "Цвет" -->
      <template #item.color="{ item }">
        <div class="d-flex align-center gap-2">
          <div
            class="color-circle"
            :style="{ backgroundColor: item.color }"
          />
          <span>{{ item.color }}</span>
        </div>
      </template>

      <!-- Кастомная форма редактирования -->
      <template #edit-form="{ editedItem, editedIndex, save, close }">
        <VRow>
          <VCol cols="12" sm="6">
            <AppTextField v-model="editedItem.name" label="Название *" />
          </VCol>
          <VCol cols="12" sm="6">
            <AppSelect v-model="editedItem.type" :items="typeOptions" label="Тип" />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="12" md="6">
            <AppTextField v-model="editedItem.color" label="Цвет" type="color" />
          </VCol>
          <VCol cols="12" md="6">
            <VSwitch
              v-model="editedItem.isActive"
              :label="editedItem.isActive ? 'Активен' : 'Не активен'"
              color="primary"
              density="compact"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="12">
            <AppTextarea
              v-model="editedItem.comment"
              label="Комментарий"
              rows="3"
              placeholder="Введите комментарий..."
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

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}

.color-circle {
  display: inline-block;
  border: 1px solid #ddd;
  border-radius: 50%;
  block-size: 20px;
  inline-size: 20px;
}
</style>
