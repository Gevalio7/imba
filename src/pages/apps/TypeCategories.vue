<script setup lang="ts">
import { $api } from '@/utils/api'
import { computed, onMounted, ref, watch } from 'vue'

// Типы данных для Категория типа
interface TypeCategories {
  id: number
  name: string
  laborHours: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}


// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Store
const searchQuery = ref('')
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

// Данные категории типов
const typeCategories = ref<TypeCategories[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Загрузка данных из API
const fetchTypeCategories = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('Fetching type categories from:', `${API_BASE}/typeCategories`)
    const data = await $api<{ typeCategories: TypeCategories[], total: number }>(`${API_BASE}/typeCategories`)
    console.log('Fetched type categories data:', data)
    typeCategories.value = data.typeCategories
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки категории типов'
    console.error('Error fetching type categories:', err)
  } finally {
    loading.value = false
  }
}

// Создание категория типа
const createTypeCategory = async (typeCategory: Omit<TypeCategories, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const newTypeCategory = await $api<TypeCategories>(`${API_BASE}/typeCategories`, {
      method: 'POST',
      body: typeCategory,
    })
    typeCategories.value.push(newTypeCategory)
    total.value++
  } catch (err) {
    console.error('Error creating type category:', err)
    throw err
  }
}

// Обновление категория типа
const updateTypeCategory = async (id: number, typeCategory: Partial<TypeCategories>) => {
  try {
    const updatedTypeCategory = await $api<TypeCategories>(`${API_BASE}/typeCategories/${id}`, {
      method: 'PUT',
      body: typeCategory,
    })
    const index = typeCategories.value.findIndex(p => p.id === id)
    if (index !== -1) {
      typeCategories.value[index] = updatedTypeCategory
    }
  } catch (err) {
    console.error('Error updating type category:', err)
    throw err
  }
}

// Удаление категория типа
const deleteTypeCategory = async (id: number) => {
  try {
    await $api(`${API_BASE}/typeCategories/${id}`, {
      method: 'DELETE',
    })
    typeCategories.value = typeCategories.value.filter(p => p.id !== id)
    total.value--
  } catch (err) {
    console.error('Error deleting type category:', err)
    throw err
  }
}

// Вычисляемые свойства для фильтрации
const filteredTypeCategories = computed(() => {
  if (!searchQuery.value) return typeCategories.value
  return typeCategories.value.filter(typeCategory =>
    typeCategory.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// Диалоги
const editDialog = ref(false)
const deleteDialog = ref(false)

const defaultItem = ref<TypeCategories>({
  id: -1,
  name: '',
  laborHours: 0,
  isActive: true,
  createdAt: '',
  updatedAt: ''
})

const editedItem = ref<TypeCategories>({ ...defaultItem.value })

const editedIndex = ref(-1)

const formTitle = computed(() => {
  return editedIndex.value === -1 ? 'Создать категорию типа' : 'Редактировать категорию типа'
})

// Методы для работы с диалогами
const editItem = (item: TypeCategories) => {
  editedIndex.value = typeCategories.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: TypeCategories) => {
  editedItem.value = { ...item }
  deleteDialog.value = true
}

const closeDelete = () => {
  deleteDialog.value = false
  editedItem.value = { ...defaultItem.value }
}

const deleteItemConfirm = async () => {
  try {
    await deleteTypeCategory(editedItem.value.id)
    closeDelete()
  } catch (err) {
    console.error('Error deleting type category:', err)
  }
}

const closeEdit = () => {
  editDialog.value = false
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
}

const save = async () => {
  try {
    if (editedIndex.value > -1) {
      await updateTypeCategory(editedItem.value.id, editedItem.value)
    } else {
      await createTypeCategory(editedItem.value)
    }
    closeEdit()
  } catch (err) {
    console.error('Error saving type category:', err)
  }
}

// Переключение статуса
const toggleStatus = async (item: TypeCategories, newStatus: boolean) => {
  try {
    await updateTypeCategory(item.id, { isActive: newStatus })
  } catch (err) {
    console.error('Error toggling status:', err)
  }
}

// Загрузка данных при монтировании
onMounted(() => {
  fetchTypeCategories()
})
</script>

<template>
  <VCard>
    <VCardText>
      <VRow>
        <VCol cols="12" sm="6">
          <VTextField
            v-model="searchQuery"
            label="Поиск"
            prepend-inner-icon="bx-search"
            single-line
            hide-details
            density="compact"
          />
        </VCol>
        <VCol cols="12" sm="6" class="d-flex justify-end">
          <VBtn color="primary" @click="editItem(defaultItem)">
            <VIcon icon="bx-plus" class="me-2" />
            Создать категорию типа
          </VBtn>
        </VCol>
      </VRow>
    </VCardText>

    <VDataTable
      :headers="[
        { title: 'Название', key: 'name', sortable: true },
        { title: 'Трудозатраты (часы)', key: 'laborHours', sortable: true },
        { title: 'Активен', key: 'isActive', sortable: false },
        { title: 'Создано', key: 'createdAt', sortable: true },
        { title: 'Действия', key: 'actions', sortable: false }
      ]"
      :items="filteredTypeCategories"
      :loading="loading"
      :items-per-page="itemsPerPage"
      :page="page"
      @update:page="page = $event"
      @update:items-per-page="itemsPerPage = $event"
      @update:sort-by="sortBy = $event"
      @update:sort-desc="orderBy = $event ? 'desc' : 'asc'"
      class="text-no-wrap"
    >
      <template #item.laborHours="{ item }">
        {{ item.laborHours }}
      </template>

      <template #item.isActive="{ item }">
        <div class="d-flex align-center gap-2">
          <VSwitch
            :model-value="item.isActive"
            @update:model-value="(val) => toggleStatus(item, val)"
          />
        </div>
      </template>

      <template #item.createdAt="{ item }">
        {{ new Date(item.createdAt).toLocaleDateString() }}
      </template>

      <template #item.actions="{ item }">
        <div class="d-flex gap-2">
          <VBtn
            icon
            variant="text"
            size="small"
            @click="editItem(item)"
          >
            <VIcon icon="bx-edit" />
          </VBtn>
          <VBtn
            icon
            variant="text"
            size="small"
            color="error"
            @click="deleteItem(item)"
          >
            <VIcon icon="bx-trash" />
          </VBtn>
        </div>
      </template>
    </VDataTable>

    <!-- Диалог редактирования -->
    <VDialog v-model="editDialog" max-width="600px">
      <VCard>
        <VCardTitle>{{ formTitle }}</VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="editedItem.name"
                label="Название *"
                required
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="editedItem.laborHours"
                label="Трудозатраты (часы)"
                type="number"
                min="0"
                step="0.5"
              />
            </VCol>
            <VCol cols="12">
              <VSwitch
                v-model="editedItem.isActive"
                label="Активен"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn @click="closeEdit">Отмена</VBtn>
          <VBtn color="primary" @click="save">Сохранить</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Диалог подтверждения удаления -->
    <VDialog v-model="deleteDialog" max-width="400px">
      <VCard>
        <VCardTitle>Подтверждение удаления</VCardTitle>
        <VCardText>
          Вы действительно хотите удалить категорию типа "{{ editedItem.name }}"?
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn @click="closeDelete">Отмена</VBtn>
          <VBtn color="error" @click="deleteItemConfirm">Удалить</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VCard>
</template>