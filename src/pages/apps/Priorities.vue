<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import EntityList, { type EntityListHeader } from '@/components/EntityList.vue'
import type { BaseEntity } from '@/composables/useEntityCrud'

definePage({
  meta: {
    navActiveLink: 'apps-priorities',
    action: 'read',
    subject: 'menu_priorities',
  },
})

interface Priorities extends BaseEntity {
  name: string
  color: string
}

const entityListRef = ref<any>(null)

const headers: EntityListHeader[] = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Цвет', key: 'color', sortable: true },
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
  const names = (entityListRef.value.items.value as Priorities[]).map((p: Priorities) => p.name)
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
        endpoint: '/priorities',
        itemName: 'приоритеты',
        defaultItem: {
          id: -1, name: '', color: '',
          createdAt: '', updatedAt: '', isActive: true,
        },
        filterCallback: (item) => {
          if (selectedNames.length > 0 && !selectedNames.includes(item.name))
            return false
          return true
        },
      }"
      :headers="headers"
      :subject="'menu_priorities'"
      :title="'Приоритеты'"
      add-button-label="Добавить приоритет"
      :edit-dialog-title-create="'Добавить приоритет'"
      :edit-dialog-title-edit="'Редактировать приоритет'"
      search-placeholder="Поиск приоритетов"
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
              label="Названия приоритетов"
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
      <template #edit-form="{ editedItem, save, close }">
        <VRow>
          <VCol cols="12" sm="6">
            <AppTextField v-model="editedItem.name" label="Название *" />
          </VCol>
          <VCol cols="12" md="6">
            <AppTextField v-model="editedItem.color" label="Цвет" type="color" />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="12" md="6">
            <VSwitch
              v-model="editedItem.isActive"
              :label="editedItem.isActive ? 'Активен' : 'Не активен'"
              color="primary"
              density="compact"
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
.color-circle {
  display: inline-block;
  border: 1px solid #ddd;
  border-radius: 50%;
  block-size: 20px;
  inline-size: 20px;
}
</style>
