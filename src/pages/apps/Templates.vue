<script setup lang="ts">
import EntityList, { type EntityListHeader } from '@/components/EntityList.vue'
import TemplateEditorDialog from '@/components/TemplateEditorDialog.vue'
import type { Template } from '@/types/template.types'

definePage({
  meta: {
    action: 'read',
    subject: 'menu_templates',
  },
})

const entityListRef = ref<any>(null)

const headers: EntityListHeader[] = [
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

const addNewTemplate = () => {
  editingTemplate.value = null
  advancedEditorOpen.value = true
}

const onTemplateSaved = () => {
  entityListRef.value?.fetchItems()
}

const onTemplateDeleted = () => {
  entityListRef.value?.fetchItems()
}
</script>

<template>
  <div>
    <EntityList
      ref="entityListRef"
      :config="{
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
      }"
      :headers="headers"
      title="Шаблоны"
      subject="menu_templates"
      add-button-label="Добавить шаблон"
      edit-dialog-title-create="Новый шаблон"
      edit-dialog-title-edit="Редактировать шаблон"
      search-placeholder="Поиск шаблона"
    >
      <!-- Действия: редактирование через TemplateEditorDialog -->
      <template #item.actions="{ item }">
        <div class="d-flex gap-1">
          <IconBtn
            v-if="$can('write', 'menu_templates')"
            @click="editItem(item as Template)"
          >
            <VIcon icon="bx-edit" />
          </IconBtn>
          <IconBtn
            v-if="$can('delete', 'menu_templates')"
            @click="entityListRef?.deleteItem(item)"
          >
            <VIcon icon="bx-trash" />
          </IconBtn>
        </div>
      </template>

      <!-- Форма редактирования: перенаправляет в TemplateEditorDialog -->
      <template #edit-form="{ close: _c, save: _s }">
        <p class="text-body-1 mb-4">
          Для создания и редактирования шаблонов используется расширенный редактор.
        </p>
        <div class="d-flex justify-end gap-4">
          <VBtn
            color="error"
            variant="outlined"
            @click="entityListRef?.close()"
          >
            Отмена
          </VBtn>
          <VBtn
            color="primary"
            variant="elevated"
            prepend-icon="bx-edit-alt"
            @click="entityListRef?.close(); addNewTemplate()"
          >
            Открыть редактор
          </VBtn>
        </div>
      </template>
    </EntityList>

    <!-- Advanced Template Editor -->
    <TemplateEditorDialog
      v-model="advancedEditorOpen"
      :template="editingTemplate"
      @saved="onTemplateSaved"
      @deleted="onTemplateDeleted"
    />
  </div>
</template>
