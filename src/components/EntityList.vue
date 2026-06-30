<script setup lang="ts" generic="T extends { id: number; isActive: boolean; [key: string]: any }">
import { computed, onMounted, ref, defineSlots } from 'vue'
import { useEntityCrud, type CrudConfig } from '@/composables/useEntityCrud'

// ========================
// Types
// ========================

export interface EntityListHeader {
  title: string
  key: string
  sortable: boolean
  width?: string
}

// ========================
// Props
// ========================

const props = defineProps<{
  /** Конфигурация для useEntityCrud */
  config: CrudConfig<T>
  /** Заголовки таблицы */
  headers: EntityListHeader[]
  /** Название карточки */
  title: string
  /** Текст кнопки «Добавить» */
  addButtonLabel?: string
  /** Subject для $can permission checks (напр. 'menu_states') */
  subject: string
  /** Плейсхолдер поиска */
  searchPlaceholder?: string
  /** Показывать ли кнопку экспорта */
  showExport?: boolean
  /** Показывать ли селектор количества строк */
  showItemsPerPage?: boolean
  /** Показывать ли фильтр по статусу по умолчанию */
  showStatusFilter?: boolean
  /** Отображать ли диалог редактирования */
  showEditDialog?: boolean
  /** Отображать ли диалог удаления */
  showDeleteDialog?: boolean
  /** Максимальная ширина диалога редактирования */
  editDialogMaxWidth?: string
  /** Название сущности в именительном падеже для заголовка диалога */
  editDialogTitleCreate?: string
  /** Название сущности в именительном падеже для заголовка диалога (редактирование) */
  editDialogTitleEdit?: string
  /** Родительский контейнер для телепортации диалогов (по умолчанию none — внутри карточки) */
  dialogAttach?: string
}>()

// ========================
// Emits
// ========================

const emit = defineEmits<{
  /** Вызывается после монтирования компонента и загрузки данных */
  'mounted': []
  /** Вызывается после успешного сохранения */
  'saved': [item: T, isNew: boolean]
  /** Вызывается после удаления */
  'deleted': [id: number]
  /** Вызывается при клике на кнопку экспорта */
  'export': []
}>()

// ========================
// Composable
// ========================

const {
  items,
  loading,
  error,
  fetchItems,
  editDialog,
  deleteDialog,
  editedItem,
  editedIndex,
  currentPage,
  itemsPerPage,
  searchQuery,
  statusFilter,
  filteredItems,
  selectedItems,
  isBulkActionsMenuOpen,
  isBulkDeleteDialogOpen,
  isBulkStatusDialogOpen,
  bulkStatusValue,
  statusOptions,
  bulkDelete,
  bulkChangeStatus,
  confirmBulkDelete,
  confirmBulkStatusChange,
  resolveStatusVariant,
  toggleStatus,
  isFilterDialogOpen,
  editItem: _editItem,
  deleteItem,
  close,
  closeDelete,
  deleteItemConfirm,
  addNewItem,
  save,
  clearFilters,
  hasActiveFilters,
} = useEntityCrud<T>({
  ...props.config,
  afterSave: (saved, isNew) => {
    emit('saved', saved as T, isNew)
    if (props.config.afterSave)
      props.config.afterSave(saved, isNew)
  },
})

// ========================
// Expose composable to parent
// ========================

defineExpose({
  items,
  loading,
  error,
  fetchItems,
  editDialog,
  deleteDialog,
  editedItem,
  editedIndex,
  currentPage,
  itemsPerPage,
  searchQuery,
  statusFilter,
  filteredItems,
  selectedItems,
  isBulkActionsMenuOpen,
  isBulkDeleteDialogOpen,
  isBulkStatusDialogOpen,
  bulkStatusValue,
  statusOptions,
  bulkDelete,
  bulkChangeStatus,
  confirmBulkDelete,
  confirmBulkStatusChange,
  resolveStatusVariant,
  toggleStatus,
  isFilterDialogOpen,
  editItem: _editItem,
  deleteItem,
  close,
  closeDelete,
  deleteItemConfirm,
  addNewItem,
  save,
  clearFilters,
})

// ========================
// Computed
// ========================

const searchAndFilterPlaceholder = computed(() => props.searchPlaceholder || `Поиск ${props.config.itemName}`)

// ========================
// Init
// ========================

onMounted(() => {
  fetchItems()
  emit('mounted')
})

// ========================
// Default slots helper
// ========================

const slots = defineSlots<{
  /** Кастомный рендер колонки. Использование: #item.color="{ item }" */
  [key: `item.${string}`]: (props: { item: T }) => any
  /** Кастомный рендер заголовка колонки. Использование: #header.color="{ ... }" */
  [key: `header.${string}`]: (props: {}) => any
  /** Дополнительные элементы в тулбаре слева */
  'toolbar-prepend': (props: {}) => any
  /** Дополнительные элементы в тулбаре справа */
  'toolbar-append': (props: {}) => any
  /** Контент диалога фильтров (поверх стандартного фильтра по статусу) */
  'filter-content': (props: {
    statusFilter: typeof statusFilter
    clearFilters: () => void
  }) => any
  /** Форма редактирования */
  'edit-form': (props: {
    editedItem: typeof editedItem.value
    editedIndex: typeof editedIndex.value
    save: () => Promise<void>
    close: () => void
  }) => any
  /** Контент перед стандартными полями формы */
  'edit-form-prepend': (props: {
    editedItem: typeof editedItem.value
    editedIndex: typeof editedIndex.value
  }) => any
  /** Контент после стандартных полей формы */
  'edit-form-append': (props: {
    editedItem: typeof editedItem.value
    editedIndex: typeof editedIndex.value
  }) => any
}>
</script>

<template>
  <div>
    <VCard :title="title">
      <!-- Индикатор загрузки -->
      <div
        v-if="loading"
        class="d-flex justify-center pa-6"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>

      <!-- Сообщение об ошибке -->
      <div
        v-else-if="error"
        class="d-flex justify-center pa-6"
      >
        <VAlert
          type="error"
          class="ma-4"
        >
          {{ error }}
        </VAlert>
      </div>

      <!-- Тулбар -->
      <div
        v-else
        class="d-flex flex-wrap gap-4 pa-6"
      >
        <div class="d-flex align-center">
          <!-- Поиск -->
          <AppTextField
            v-model="searchQuery"
            :placeholder="searchAndFilterPlaceholder"
            style="inline-size: 250px;"
            class="me-3"
            clearable
            clear-icon="bx-x"
          />
        </div>

        <!-- Слот тулбара (слева) -->
        <slot
          name="toolbar-prepend"
          v-bind="{}"
        />

        <!-- Кнопка фильтра -->
        <VBtn
          v-if="showStatusFilter !== false"
          variant="tonal"
          color="secondary"
          :prepend-icon="hasActiveFilters ? 'bx-x' : 'bx-filter'"
          @click="hasActiveFilters ? clearFilters() : isFilterDialogOpen = true"
        >
          {{ hasActiveFilters ? 'Сбросить фильтр' : 'Фильтр' }}
        </VBtn>

        <!-- Кнопка массовых действий -->
        <VMenu
          v-model="isBulkActionsMenuOpen"
          :close-on-content-click="false"
        >
          <template #activator="{ props: menuProps }">
            <VBtn
              variant="tonal"
              color="secondary"
              prepend-icon="bx-dots-vertical-rounded"
              :disabled="selectedItems.length === 0"
              v-bind="menuProps"
            >
              Действия ({{ selectedItems.length }})
            </VBtn>
          </template>
          <VList>
            <VListItem
              @click="() => {
                bulkDelete()
                isBulkActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Удалить</VListItemTitle>
            </VListItem>
            <VListItem
              @click="() => {
                bulkChangeStatus()
                isBulkActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Изменить статус</VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>

        <VSpacer />
        <div class="d-flex gap-4 flex-wrap align-center">
          <!-- Селектор количества строк -->
          <AppSelect
            v-if="showItemsPerPage !== false"
            v-model="itemsPerPage"
            :items="[5, 10, 20, 25, 50]"
          />

          <!-- Кнопка экспорта -->
          <VBtn
            v-if="showExport !== false"
            variant="tonal"
            color="secondary"
            prepend-icon="bx-export"
            @click="emit('export')"
          >
            Экспорт
          </VBtn>

          <!-- Слот тулбара (справа) -->
          <slot
            name="toolbar-append"
            v-bind="{}"
          />

          <!-- Кнопка добавления -->
          <VBtn
            v-if="$can('write', subject)"
            color="primary"
            prepend-icon="bx-plus"
            @click="addNewItem"
          >
            {{ addButtonLabel || 'Добавить' }}
          </VBtn>
        </div>
      </div>

      <!-- Диалог фильтров -->
      <VDialog
        v-if="showStatusFilter !== false"
        v-model="isFilterDialogOpen"
        max-width="500px"
      >
        <VCard title="Фильтры">
          <VCardText>
            <VRow>
              <VCol cols="12">
                <AppSelect
                  v-model="statusFilter"
                  placeholder="Статус"
                  :items="[
                    { title: 'Активен', value: 1 },
                    { title: 'Не активен', value: 2 },
                  ]"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>
            </VRow>

            <!-- Кастомный контент фильтра -->
            <slot
              name="filter-content"
              :statusFilter="statusFilter"
              :clearFilters="clearFilters"
            />
          </VCardText>

          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                variant="text"
                @click="clearFilters"
              >
                Сбросить
              </VBtn>
              <VBtn
                color="error"
                variant="outlined"
                @click="isFilterDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="isFilterDialogOpen = false"
              >
                Применить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог массового удаления -->
      <VDialog
        v-model="isBulkDeleteDialogOpen"
        max-width="500px"
      >
        <VCard title="Подтверждение удаления">
          <VCardText>
            Вы уверены, что хотите удалить выбранные {{ config.itemName }}? Это действие нельзя отменить.
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                color="error"
                variant="outlined"
                @click="isBulkDeleteDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="confirmBulkDelete"
              >
                Удалить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог массового изменения статуса -->
      <VDialog
        v-model="isBulkStatusDialogOpen"
        max-width="500px"
      >
        <VCard title="Изменить статус">
          <VCardText>
            <AppSelect
              v-model="bulkStatusValue"
              :items="statusOptions"
              item-title="text"
              item-value="value"
              label="Новый статус"
            />
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                color="error"
                variant="outlined"
                @click="isBulkStatusDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="confirmBulkStatusChange"
              >
                Применить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <VDivider />

      <!-- Таблица -->
      <VDataTable
        v-model="selectedItems"
        v-model:items-per-page="itemsPerPage"
        v-model:page="currentPage"
        :headers="headers"
        :items="filteredItems"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Кастомные колонки (пробрасываются из родителя) -->
        <template
          v-for="header in headers"
          :key="header.key"
          #[`item.${header.key}`]="slotProps"
        >
          <!-- Сначала проверяем слот из родителя -->
          <template v-if="$slots[`item.${header.key}`]">
            <slot
              :name="`item.${header.key}`"
              :item="slotProps.item"
            />
          </template>
          <!-- Стандартный рендер для isActive -->
          <template v-else-if="header.key === 'isActive'">
            <div class="d-flex align-center gap-2">
              <VSwitch
                :model-value="slotProps.item.isActive"
                color="primary"
                hide-details
                @update:model-value="(val: any) => toggleStatus(slotProps.item as T, val)"
              />
              <VChip
                v-bind="resolveStatusVariant(slotProps.item.isActive)"
                density="compact"
                label
                size="small"
              />
            </div>
          </template>
          <!-- Стандартный рендер для actions -->
          <template v-else-if="header.key === 'actions'">
            <div class="d-flex gap-1">
              <IconBtn
                v-if="$can('write', subject)"
                @click="_editItem(slotProps.item as T)"
              >
                <VIcon icon="bx-edit" />
              </IconBtn>
              <IconBtn
                v-if="$can('delete', subject)"
                @click="deleteItem(slotProps.item as T)"
              >
                <VIcon icon="bx-trash" />
              </IconBtn>
            </div>
          </template>
          <!-- Стандартный рендер для остальных колонок (просто текст) -->
          <template v-else>
            {{ (slotProps.item as any)[header.key] ?? '-' }}
          </template>
        </template>

        <!-- Кастомные заголовки -->
        <template
          v-for="header in headers"
          :key="`header-${header.key}`"
          #[`header.${header.key}`]="slotProps"
        >
          <slot
            :name="`header.${header.key}`"
            v-bind="slotProps"
          >
            {{ header.title }}
          </slot>
        </template>
      </VDataTable>

      <!-- Пагинация -->
      <div class="d-flex justify-center mt-4 pb-4">
        <VPagination
          v-model="currentPage"
          :length="Math.ceil(filteredItems.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-if="showEditDialog !== false"
      v-model="editDialog"
      :max-width="editDialogMaxWidth || '600px'"
    >
      <VCard :title="editedIndex > -1 ? (editDialogTitleEdit || 'Редактировать') : (editDialogTitleCreate || 'Добавить')">
        <VCardText>
          <slot
            name="edit-form-prepend"
            :editedItem="editedItem"
            :editedIndex="editedIndex"
          />

          <VRow>
            <!-- Поле имя (по умолчанию) -->
            <VCol
              v-if="!$slots['edit-form']"
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.name"
                label="Название *"
              />
            </VCol>

            <!-- Активен (по умолчанию) -->
            <VCol
              v-if="!$slots['edit-form']"
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

          <!-- Кастомная форма редактирования -->
          <slot
            name="edit-form"
            :editedItem="editedItem"
            :editedIndex="editedIndex"
            :save="save"
            :close="close"
          />

          <slot
            name="edit-form-append"
            :editedItem="editedItem"
            :editedIndex="editedIndex"
          />
        </VCardText>

        <VCardText v-if="!$slots['edit-form']">
          <div class="self-align-end d-flex gap-4 justify-end">
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
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог удаления -->
    <VDialog
      v-if="showDeleteDialog !== false"
      v-model="deleteDialog"
      max-width="500px"
    >
      <VCard :title="`Вы уверены, что хотите удалить этот ${config.itemName}?`">
        <VCardText>
          <div class="d-flex justify-center gap-4">
            <VBtn
              color="error"
              variant="outlined"
              @click="closeDelete"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="deleteItemConfirm"
            >
              Удалить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}
</style>
