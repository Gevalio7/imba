<script setup lang="ts">
import EntityList, { type EntityListHeader } from '@/components/EntityList.vue'
import type { BaseEntity } from '@/composables/useEntityCrud'

interface TypeCategories extends BaseEntity {
  name: string
  laborHours: number
  comment: string
}

definePage({
  meta: {
    action: 'read',
    subject: 'menu_type_categories',
  },
})

// Экземпляр EntityList — доступ через ref
// TODO: типизировать через InstanceType<typeof EntityList> после решения generic-mixin в TypeScript
const entityListRef = ref<any>(null)

const headers: EntityListHeader[] = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Трудозатраты (часы)', key: 'laborHours', sortable: true },
  { title: 'Комментарий', key: 'comment', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// === Фильтр по названиям ===
const selectedNames = ref<string[]>([])
const searchNames = ref<string | null>(null)

const uniqueNames = computed<string[]>(() => {
  if (!entityListRef.value?.items?.value) return []
  const names = (entityListRef.value.items.value as TypeCategories[]).map((p: TypeCategories) => p.name)
  return [...new Set(names)].sort()
})

watch(selectedNames, value => {
  if (value.length > 10)
    nextTick(() => selectedNames.value.pop())
})
</script>

<template>
  <EntityList
    ref="entityListRef"
    :config="{
      endpoint: '/typeCategories',
      itemName: 'категории типов',
      defaultItem: {
        id: -1,
        name: '',
        comment: '',
        laborHours: 0,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      filterCallback: (item) => {
        if (selectedNames.length > 0 && !selectedNames.includes((item as TypeCategories).name))
          return false
        return true
      },
    }"
    :headers="headers"
    title="Категории типов"
    subject="menu_type_categories"
    add-button-label="Добавить категорию типа"
    edit-dialog-title-create="Добавить категорию типа"
    edit-dialog-title-edit="Редактировать категорию типа"
    search-placeholder="Поиск категории типа"
  >
    <!-- Кастомный фильтр по названиям -->
    <template #filter-content="{ clearFilters: _clearFilters }">
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
            label="Названия категорий типов"
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

        <VCol
          cols="12"
          sm="6"
        >
          <AppTextField
            v-model="editedItem.laborHours"
            label="Трудозатраты (часы)"
            type="number"
            min="0"
            step="0.5"
          />
        </VCol>
      </VRow>

      <VRow>
        <VCol
          cols="12"
          md="6"
        >
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
