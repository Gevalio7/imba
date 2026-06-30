<script setup lang="ts">
import EntityList, { type EntityListHeader } from '@/components/EntityList.vue'
import type { BaseEntity } from '@/composables/useEntityCrud'
import { $api } from '@/utils/api'
import { useToast } from '@/composables/useToast'

interface Services extends BaseEntity {
  name: string
  comment: string
  type: string
  customers?: Customers[]
  attachments?: Attachment[]
  sla?: SLA | null
  hasAttachments?: boolean
}

interface Customers {
  id: number
  name: string
  street: string
  zip: string
  city: string
  comment: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Attachment {
  id: number
  serviceId: number
  fileName: string
  filePath: string
  fileSize: number | null
  mimeType: string | null
  uploadedBy: number | null
  createdAt: string
}

interface SLA {
  id: number
  name: string
  comment: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const API_BASE = import.meta.env.VITE_API_BASE_URL

definePage({
  meta: {
    action: 'read',
    subject: 'menu_services',
  },
})

// Экземпляр EntityList для доступа к диалогу
const entityListRef = ref<any>(null)

const headers: EntityListHeader[] = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Комментарий', key: 'comment', sortable: true },
  { title: 'Тип', key: 'type', sortable: true },
  { title: 'Компании', key: 'customers', sortable: false },
  { title: '', key: 'hasAttachments', sortable: false },
  { title: 'SLA', key: 'sla', sortable: false },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// === Справочники ===
const customers = ref<Customers[]>([])
const customersLoading = ref(false)
const slas = ref<SLA[]>([])
const slasLoading = ref(false)

const fetchCustomers = async () => {
  try {
    customersLoading.value = true
    const data = await $api<{ customers: Customers[]; total: number }>(`${API_BASE}/customers`)
    customers.value = data.customers || []
  }
  catch (err) {
    console.error('Error fetching customers:', err)
  }
  finally {
    customersLoading.value = false
  }
}

const fetchSLAs = async () => {
  try {
    slasLoading.value = true
    const data = await $api<{ sla: SLA[]; total: number }>(`${API_BASE}/sla`)
    slas.value = data.sla || []
  }
  catch (err) {
    console.error('Error fetching SLAs:', err)
  }
  finally {
    slasLoading.value = false
  }
}

// === Типы опций ===
const typeOptions = [
  'Обучение', 'Демонстрация', 'Другое', 'Интерфейсная часть',
  'Конечный сервис пользователя', 'Контракт поддержки', 'Планирование',
  'Сервисная часть', 'Составление отчетов', 'Управление ИТ', 'Эксплуатация', 'Ит',
]

// === Фильтры (через EntityList filterCallback) ===
const selectedNames = ref<string[]>([])
const selectedTypes = ref<string[]>([])
const searchNames = ref<string | null>(null)

const uniqueNames = computed<string[]>(() => {
  if (!entityListRef.value?.items?.value) return []
  const names = (entityListRef.value.items.value as Services[]).map((p: Services) => p.name)
  return [...new Set(names)].sort()
})

watch(selectedNames, value => {
  if (value.length > 10)
    nextTick(() => selectedNames.value.pop())
})

// === Кастомный editItem (загрузка полных данных) ===
const editedItem = ref<any>({
  id: -1, name: '', comment: '', type: '',
  createdAt: '', updatedAt: '', isActive: true,
})
const selectedCustomerIds = ref<number[]>([])
const uploadedFiles = ref<File[]>([])
const existingAttachments = ref<Attachment[]>([])
const selectedSLAId = ref<number | null>(null)

const editItem = async (item: any) => {
  try {
    const fullItem = await $api<Services>(`${API_BASE}/services/${item.id}`)
    editedItem.value = { ...fullItem }
    selectedCustomerIds.value = fullItem.customers?.map(c => c.id) || []
    existingAttachments.value = fullItem.attachments || []
    uploadedFiles.value = []
    selectedSLAId.value = fullItem.sla?.id || null
  }
  catch {
    editedItem.value = { ...item }
    selectedCustomerIds.value = item.customers?.map(c => c.id) || []
    existingAttachments.value = item.attachments || []
    uploadedFiles.value = []
    selectedSLAId.value = item.sla?.id || null
  }
  entityListRef.value.editDialog.value = true
}

const addNewItem = () => {
  editedItem.value = {
    id: -1, name: '', comment: '', type: '',
    createdAt: '', updatedAt: '', isActive: true,
  }
  selectedCustomerIds.value = []
  uploadedFiles.value = []
  existingAttachments.value = []
  selectedSLAId.value = null
  entityListRef.value.editDialog.value = true
}

const { showToast } = useToast()

const uploadFiles = async (serviceId: number) => {
  if (uploadedFiles.value.length === 0) return
  const formData = new FormData()
  uploadedFiles.value.forEach(file => formData.append('files', file))
  await $api(`${API_BASE}/services/${serviceId}/attachments`, {
    method: 'POST', body: formData,
  })
}

const save = async () => {
  if (!editedItem.value.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  try {
    const customerIds = selectedCustomerIds.value.map((item: any) =>
      typeof item === 'object' && item !== null ? item.id : item,
    )
    const slaId = selectedSLAId.value
      ? (typeof selectedSLAId.value === 'object' ? (selectedSLAId.value as any).id : selectedSLAId.value)
      : null

    const serviceData = {
      name: editedItem.value.name,
      comment: editedItem.value.comment || '',
      type: editedItem.value.type || '',
      isActive: editedItem.value.isActive,
      customerIds,
      slaId,
    }

    const isEdit = editedItem.value.id !== -1 && editedItem.value.id > 0
    if (isEdit) {
      await $api(`${API_BASE}/services/${editedItem.value.id}`, {
        method: 'PUT', body: serviceData,
      })
      if (uploadedFiles.value.length > 0)
        await uploadFiles(editedItem.value.id)
    }
    else {
      const created = await $api<Services>(`${API_BASE}/services`, {
        method: 'POST', body: serviceData,
      })
      if (uploadedFiles.value.length > 0 && created.id)
        await uploadFiles(created.id)
    }

    showToast('Сервис успешно сохранен')
    entityListRef.value.close()
    entityListRef.value.fetchItems()
  }
  catch (err) {
    showToast('Ошибка сохранения сервиса', 'error')
  }
}

const close = () => {
  entityListRef.value.close()
  selectedCustomerIds.value = []
  uploadedFiles.value = []
  existingAttachments.value = []
  selectedSLAId.value = null
}

const removeAttachment = async (attachmentId: number) => {
  try {
    await $api(`${API_BASE}/services/${editedItem.value.id}/attachments/${attachmentId}`, { method: 'DELETE' })
    existingAttachments.value = existingAttachments.value.filter(a => a.id !== attachmentId)
    showToast('Файл удален')
  }
  catch { showToast('Ошибка удаления файла', 'error') }
}

const downloadAttachment = async (attachment: Attachment) => {
  try {
    const response = await fetch(`${API_BASE}/services/${editedItem.value.id}/attachments/${attachment.id}/download`)
    if (!response.ok) throw new Error('Download failed')
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = attachment.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
  catch { showToast('Ошибка скачивания файла', 'error') }
}
</script>

<template>
  <EntityList
    ref="entityListRef"
    :config="{
      endpoint: '/services',
      itemName: 'сервисы',
      defaultItem: {
        id: -1, name: '', comment: '', type: '',
        createdAt: '', updatedAt: '', isActive: true,
      },
      filterCallback: (item) => {
        const s = item as Services
        if (selectedNames.length > 0 && !selectedNames.includes(s.name))
          return false
        if (selectedTypes.length > 0 && !selectedTypes.includes(s.type))
          return false
        return true
      },
    }"
    :headers="headers"
    title="Сервисы"
    subject="menu_services"
    add-button-label="Добавить сервис"
    edit-dialog-title-create="Добавить сервис"
    edit-dialog-title-edit="Редактировать сервис"
    search-placeholder="Поиск сервиса"
    edit-dialog-max-width="600px"
    @mounted="() => { fetchCustomers(); fetchSLAs() }"
  >
    <!-- Кастомные колонки -->
    <template #item.customers="{ item }">
      <div class="d-flex flex-wrap gap-1">
        <VChip
          v-for="customer in (item as Services).customers"
          :key="customer.id"
          size="small"
          color="success"
          variant="outlined"
        >
          {{ customer.name }}
        </VChip>
        <span
          v-if="!(item as Services).customers?.length"
          class="text-disabled"
        >Нет компаний</span>
      </div>
    </template>

    <template #header.hasAttachments>
      <VTooltip location="top">
        <template #activator="{ props }">
          <VIcon v-bind="props" icon="bx-paperclip" size="20" />
        </template>
        <span>Документы</span>
      </VTooltip>
    </template>
    <template #item.hasAttachments="{ item }">
      <VTooltip
        v-if="(item as Services).hasAttachments"
        location="top"
      >
        <template #activator="{ props }">
          <VIcon v-bind="props" icon="bx-paperclip" color="primary" size="24" />
        </template>
        <span>Есть прикрепленные документы</span>
      </VTooltip>
      <span v-else class="text-disabled">—</span>
    </template>

    <template #item.sla="{ item }">
      <VChip
        v-if="(item as Services).sla"
        size="small"
        color="info"
        variant="outlined"
      >
        {{ (item as Services).sla!.name }}
      </VChip>
      <span v-else class="text-disabled">Нет SLA</span>
    </template>

    <template #item.actions="{ item }">
      <div class="d-flex gap-1">
        <IconBtn
          v-if="$can('write', 'menu_services')"
          @click="editItem(item)"
        >
          <VIcon icon="bx-edit" />
        </IconBtn>
        <IconBtn
          v-if="$can('delete', 'menu_services')"
          @click="entityListRef?.deleteItem(item)"
        >
          <VIcon icon="bx-trash" />
        </IconBtn>
      </div>
    </template>

    <!-- Фильтр по названиям + типам -->
    <template #filter-content="{ clearFilters: _clearFilters }">
      <VRow>
        <VCol cols="12">
          <AppCombobox
            v-model="selectedNames"
            v-model:search-input="searchNames"
            :items="[]"
            hide-selected
            :hide-no-data="false"
            placeholder="Выберите названия"
            hint="Максимум 10 названий"
            label="Названия сервисов"
            multiple
            persistent-hint
          >
            <template #no-data>
              <VListItem>
                <VListItemTitle>
                  Начните вводить название...
                </VListItemTitle>
              </VListItem>
            </template>
          </AppCombobox>
        </VCol>
        <VCol cols="12">
          <AppCombobox
            v-model="selectedTypes"
            :items="typeOptions"
            placeholder="Выберите типы"
            label="Типы сервисов"
            multiple
            clearable
            chips
          />
        </VCol>
      </VRow>
    </template>

    <!-- Кастомная форма -->
    <template #edit-form="{ editedItem: _ei, editedIndex: _ei2, save: _s, close: _c }">
      <VRow>
        <VCol cols="12" sm="6">
          <AppTextField v-model="editedItem.name" label="Название *" />
        </VCol>
        <VCol cols="12" sm="6">
          <AppSelect
            v-model="editedItem.type"
            :items="typeOptions"
            label="Тип"
            placeholder="Выберите тип"
            clearable
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
          <AppCombobox
            v-model="selectedCustomerIds"
            :items="customers"
            item-title="name"
            item-value="id"
            label="Компании"
            placeholder="Выберите компании"
            multiple
            chips
            closable-chips
            :loading="customersLoading"
            hint="Выберите одну или несколько компаний"
            persistent-hint
          />
        </VCol>
        <VCol cols="12">
          <VFileInput
            v-model="uploadedFiles"
            label="Документы"
            placeholder="Выберите файлы для загрузки"
            multiple
            chips
            prepend-icon="bx-paperclip"
            hint="Выберите файлы для прикрепления к сервису"
            persistent-hint
          />
          <div v-if="existingAttachments.length > 0" class="mt-4">
            <p class="text-body-2 mb-2">Прикрепленные файлы:</p>
            <VList density="compact">
              <VListItem
                v-for="attachment in existingAttachments"
                :key="attachment.id"
                :title="attachment.fileName"
                :subtitle="attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(1)} КБ` : ''"
                class="px-0"
              >
                <template #append>
                  <div class="d-flex gap-1">
                    <IconBtn color="primary" size="small" @click="downloadAttachment(attachment)">
                      <VIcon icon="bx-download" size="18" />
                    </IconBtn>
                    <IconBtn color="error" size="small" @click="removeAttachment(attachment.id)">
                      <VIcon icon="bx-trash" size="18" />
                    </IconBtn>
                  </div>
                </template>
                <template #prepend>
                  <VIcon icon="bx-file" size="20" />
                </template>
              </VListItem>
            </VList>
          </div>
        </VCol>
        <VCol cols="12">
          <AppSelect
            v-model="selectedSLAId"
            :items="slas"
            item-title="name"
            item-value="id"
            label="SLA"
            placeholder="Выберите SLA"
            clearable
            :loading="slasLoading"
            hint="Выберите SLA для сервиса"
            persistent-hint
          />
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

      <div class="self-align-end d-flex gap-4 justify-end mt-4">
        <VBtn color="error" variant="outlined" @click="close">Отмена</VBtn>
        <VBtn color="success" variant="elevated" @click="save">Сохранить</VBtn>
      </div>
    </template>
  </EntityList>
</template>
