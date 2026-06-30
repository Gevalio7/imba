<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useEntityCrud } from '@/composables/useEntityCrud'
import TemplateEditorDialog from '@/components/TemplateEditorDialog.vue'
import type { Template } from '@/types/template.types'

// Универсальный CRUD
const {
  items: templates,
  loading,
  error,
  fetchItems: fetchTemplates,
  editDialog,
  deleteDialog,
  editedItem,
  editedIndex,
  currentPage,
  itemsPerPage,
  statusFilter,
  filteredItems: filteredTemplates,
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
  clearFilters,
  deleteItem,
  close: closeEdit,
  closeDelete,
  createItem,
  updateItem,
  deleteItemById,
} = useEntityCrud<Template>({
  endpoint: '/templates',
  itemName: 'шаблона',
  defaultItem: {
    id: -1,
    name: '',
    message: '',
    version: 0,
    usageCount: 0,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
})

onMounted(() => fetchTemplates())

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Сообщение', key: 'message', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// === TemplateEditorDialog integration ===
const advancedEditorOpen = ref(false)
const editingTemplate = ref<Template | null>(null)

const editItem = (item: Template) => {
  editingTemplate.value = { ...item }
  advancedEditorOpen.value = true
}

const addNewTemplates = () => {
  editingTemplate.value = null
  advancedEditorOpen.value = true
}

const onTemplateSaved = (saved: Template) => {
  fetchTemplates()
}

const onTemplateDeleted = (id: number) => {
  templates.value = templates.value.filter(t => t.id !== id)
}

// === Сохранение (для стандартного диалога, с валидацией) ===
const save = async () => {
  if (!editedItem.value.name?.trim()) {
    return
  }

  try {
    if (editedIndex.value > -1) {
      const { id, createdAt, updatedAt, ...payload } = editedItem.value
      await updateItem(editedItem.value.id, payload)
    }
    else {
      const { id, createdAt, updatedAt, ...payload } = editedItem.value
      await createItem(payload)
    }
    closeEdit()
  }
  catch (err) {
    console.error('Error saving template:', err)
  }
}

// === Удаление с обработкой ошибок ===
const deleteItemConfirm = async () => {
  try {
    await deleteItemById(editedItem.value.id)
    closeDelete()
  }
  catch (err: any) {
    console.error('Error deleting template:', err)
  }
}
</script>

<template>
  <div>
    <VCard title="Шаблоны">
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

      <div
        v-else
        class="d-flex flex-wrap gap-4 pa-6"
      >
        <div class="d-flex align-center">
          <!-- Поиск -->
          <AppTextField
            placeholder="Поиск шаблоны"
            style="inline-size: 250px;"
            class="me-3"
          />
        </div>

        <!-- Кнопка фильтра -->
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="bx-filter"
          @click="isFilterDialogOpen = true"
        >
          Фильтр
        </VBtn>

        <!-- Кнопка массовых действий -->
        <VMenu
          v-model="isBulkActionsMenuOpen"
          :close-on-content-click="false"
        >
          <template #activator="{ props }">
            <VBtn
              variant="tonal"
              color="secondary"
              prepend-icon="bx-dots-vertical-rounded"
              :disabled="selectedItems.length === 0"
              v-bind="props"
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
          <AppSelect
            v-model="itemsPerPage"
            :items="[5, 10, 20, 25, 50]"
          />
          <!-- Экспорт -->
          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="bx-export"
          >
            Экспорт
          </VBtn>

          <VBtn
            v-if="$can('write', 'menu_templates')"
            color="primary"
            prepend-icon="bx-plus"
            @click="addNewTemplates"
          >
            Добавить шаблон
          </VBtn>
        </div>
      </div>

      <!-- Диалог фильтров -->
      <VDialog
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
            Вы уверены, что хотите удалить выбранные шаблоны? Это действие нельзя отменить.
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

      <!-- Advanced Template Editor (по ТЗ) -->
      <TemplateEditorDialog
        v-model="advancedEditorOpen"
        :template="editingTemplate"
        @saved="onTemplateSaved"
        @deleted="onTemplateDeleted"
      />

      <VDivider />

      <!-- Таблица -->
      <VDataTable
        v-model="selectedItems"
        v-model:items-per-page="itemsPerPage"
        v-model:page="currentPage"
        :headers="headers"
        :items="filteredTemplates"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Активен -->
        <template #item.isActive="{ item }">
          <div class="d-flex align-center gap-2">
            <VSwitch
              :model-value="item.isActive"
              color="primary"
              hide-details
              @update:model-value="(val) => toggleStatus(item, val)"
            />
            <VChip
              v-bind="resolveStatusVariant(item.isActive)"
              density="compact"
              label
              size="small"
            />
          </div>
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn
              v-if="$can('write', 'menu_templates')"
              @click="editItem(item)"
            >
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn
              v-if="$can('delete', 'menu_templates')"
              @click="deleteItem(item)"
            >
              <VIcon icon="bx-trash" />
            </IconBtn>
          </div>
        </template>
      </VDataTable>

      <!-- Пагинация -->
      <div class="d-flex justify-center mt-4 pb-4">
        <VPagination
          v-model="currentPage"
          :length="Math.ceil(filteredTemplates.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать шаблон' : 'Добавить шаблон'">
        <VCardText>
          <VRow>
            <!-- Название -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.name"
                label="Название *"
              />
            </VCol>

            <!-- Сообщение -->
            <VCol cols="12">
              <AppTextarea
                v-model="editedItem.message"
                label="Сообщение"
                rows="3"
                placeholder="Введите сообщение..."
              />
            </VCol>

            <!-- Активен -->
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
        </VCardText>

        <VCardText>
          <div class="self-align-end d-flex gap-4 justify-end">
            <VBtn
              color="error"
              variant="outlined"
              @click="closeEdit"
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
      v-model="deleteDialog"
      max-width="500px"
    >
      <VCard title="Вы уверены, что хотите удалить этот шаблон?">
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
