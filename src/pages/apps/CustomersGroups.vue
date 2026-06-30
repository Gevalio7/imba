<script setup lang="ts">
import EntityList, { type EntityListHeader } from '@/components/EntityList.vue'
import type { BaseEntity } from '@/composables/useEntityCrud'
import { $api } from '@/utils/api'

interface CustomersGroups extends BaseEntity {
  name: string
  message: string
  customerId?: number
}

interface Customer {
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

definePage({
  meta: {
    action: 'read',
    subject: 'menu_companies_groups',
  },
})

const headers: EntityListHeader[] = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Сообщение', key: 'message', sortable: true },
  { title: 'Компания', key: 'customer', sortable: false },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Данные компаний для селекта в форме
const customers = ref<Customer[]>([])

const fetchCustomers = async () => {
  try {
    const data = await $api<{ customers: Customer[]; total: number }>('/customers')
    customers.value = data.customers
  }
  catch (err) {
    console.error('Error fetching customers:', err)
  }
}

const getCustomerName = (customerId: number | undefined) => {
  if (!customerId) return 'Не назначена'
  const customer = customers.value.find(c => c.id === customerId || c.id === Number(customerId))
  return customer?.name || 'Не назначена'
}
</script>

<template>
  <EntityList
    :config="{
      endpoint: '/customersGroups',
      itemName: 'группы клиентов',
      defaultItem: {
        id: -1,
        name: '',
        message: '',
        customerId: undefined,
        createdAt: '',
        updatedAt: '',
        isActive: true,
      },
    }"
    :headers="headers"
    title="Группы клиентов"
    subject="menu_companies_groups"
    add-button-label="Добавить группу клиентов"
    edit-dialog-title-create="Добавить группу клиентов"
    edit-dialog-title-edit="Редактировать группу клиентов"
    search-placeholder="Поиск группы клиентов"
    @mounted="fetchCustomers"
  >
    <!-- Кастомная колонка: название компании -->
    <template #item.customer="{ item }">
      {{ getCustomerName((item as CustomersGroups).customerId) }}
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

        <VCol cols="12">
          <AppTextarea
            v-model="editedItem.message"
            label="Сообщение"
            rows="3"
            placeholder="Введите сообщение..."
          />
        </VCol>

        <VCol
          cols="12"
          sm="6"
        >
          <AppSelect
            v-model="editedItem.customerId"
            :items="customers"
            item-title="name"
            item-value="id"
            label="Компания"
            placeholder="Выберите компанию"
            clearable
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

      <div class="d-flex gap-4 justify-end mt-4">
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
