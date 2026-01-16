<script setup lang="ts">
import type { TestEntity } from '@db/apps/test-entities/types'

// Store
const searchQuery = ref('')
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

// Update data table options
const updateOptions = (options: any) => {
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}

// Headers
const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Comment', key: 'comment', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

// Fetching entities
const { data: entitiesData, execute: fetchEntities } = await useApi<any>(createUrl('/api/apps/test-entities', {
  query: {
    q: searchQuery,
    itemsPerPage,
    page,
    sortBy,
    orderBy,
  },
}))

const entities = computed((): TestEntity[] => entitiesData.value?.testEntities || [])
const totalEntities = computed(() => entitiesData.value?.total || 0)

// Dialog
const isDialogVisible = ref(false)
const editingEntity = ref<TestEntity | null>(null)
const form = ref({
  name: '',
  comment: '',
})

// Open create dialog
const openCreateDialog = () => {
  editingEntity.value = null
  form.value = { name: '', comment: '' }
  isDialogVisible.value = true
}

// Open edit dialog
const openEditDialog = (entity: TestEntity) => {
  editingEntity.value = entity
  form.value = { name: entity.name, comment: entity.comment }
  isDialogVisible.value = true
}

// Save entity
const saveEntity = async () => {
  if (editingEntity.value) {
    // Edit
    await $api(`/api/apps/test-entities/${editingEntity.value.id}`, {
      method: 'PUT',
      body: form.value,
    })
  } else {
    // Create
    await $api('/api/apps/test-entities', {
      method: 'POST',
      body: form.value,
    })
  }
  fetchEntities()
  isDialogVisible.value = false
}

// Delete entity
const deleteEntity = async (id: number) => {
  await $api(`/api/apps/test-entities/${id}`, {
    method: 'DELETE',
  })
  fetchEntities()
}
</script>

<template>
  <VCard>
    <VCardText class="d-flex flex-wrap gap-4">
      <div class="me-3 d-flex gap-3">
        <AppSelect
          :model-value="itemsPerPage"
          :items="[
            { value: 10, title: '10' },
            { value: 25, title: '25' },
            { value: 50, title: '50' },
            { value: -1, title: 'All' },
          ]"
          style="inline-size: 6.25rem;"
          @update:model-value="itemsPerPage = parseInt($event, 10)"
        />
      </div>
      <VSpacer />

      <div class="d-flex gap-4">
        <div style="inline-size: 15.625rem;">
          <AppTextField
            v-model="searchQuery"
            placeholder="Search entities"
          />
        </div>

        <VBtn
          prepend-icon="bx-plus"
          @click="openCreateDialog"
        >
          Add Entity
        </VBtn>
      </div>
    </VCardText>

    <VDataTableServer
      v-model:items-per-page="itemsPerPage"
      v-model:page="page"
      :items="entities"
      item-value="id"
      :items-length="totalEntities"
      :headers="headers"
      class="text-no-wrap"
      @update:options="updateOptions"
    >
      <template #item.actions="{ item }">
        <IconBtn @click="openEditDialog(item)">
          <VIcon icon="bx-edit" />
        </IconBtn>

        <IconBtn @click="deleteEntity(item.id)">
          <VIcon icon="bx-trash" />
        </IconBtn>
      </template>

      <template #bottom>
        <TablePagination
          v-model:page="page"
          :items-per-page="itemsPerPage"
          :total-items="totalEntities"
        />
      </template>
    </VDataTableServer>
  </VCard>

  <!-- Dialog -->
  <VDialog
    v-model="isDialogVisible"
    max-width="500"
  >
    <VCard>
      <VCardTitle>
        {{ editingEntity ? 'Edit Entity' : 'Create Entity' }}
      </VCardTitle>
      <VCardText>
        <VForm @submit.prevent="saveEntity">
          <VTextField
            v-model="form.name"
            label="Name"
            required
          />
          <VTextarea
            v-model="form.comment"
            label="Comment"
            required
          />
        </VForm>
      </VCardText>
      <VCardActions>
        <VBtn
          variant="text"
          @click="isDialogVisible = false"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          @click="saveEntity"
        >
          Save
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
