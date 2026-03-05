<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, ref } from 'vue'

// Типы данных для Группа клиентов
interface CustomersGroups {
  id: number
  name: string
  message: string
  customerId?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Типы данных для Компания
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
  customersGroups?: CustomersGroups[]
}

// Типы данных для Клиенты компании
interface CustomerUsers {
  id: number
  firstName: string
  lastName: string
  login: string
  email: string
  mobilePhone: string
  telegramAccount: string
  customerId?: number
  customersGroupId?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// ========== ГРУППЫ КЛИЕНТОВ ==========
const customersGroups = ref<CustomersGroups[]>([])
const customersGroupsLoading = ref(false)
const customersGroupsError = ref<string | null>(null)

const fetchCustomersGroups = async () => {
  try {
    customersGroupsLoading.value = true
    customersGroupsError.value = null
    const data = await $fetch<{ customersGroups: CustomersGroups[], total: number }>(`${API_BASE}/customersGroups`)
    customersGroups.value = data.customersGroups
  } catch (err) {
    customersGroupsError.value = 'Ошибка загрузки групп клиентов'
    console.error('Error fetching customersGroups:', err)
  } finally {
    customersGroupsLoading.value = false
  }
}

// ========== КОМПАНИИ ==========
const customers = ref<Customers[]>([])
const customersLoading = ref(false)
const customersError = ref<string | null>(null)

const fetchCustomers = async () => {
  try {
    customersLoading.value = true
    customersError.value = null
    const data = await $fetch<{ customers: Customers[], total: number }>(`${API_BASE}/customers`)
    customers.value = data.customers
  } catch (err) {
    customersError.value = 'Ошибка загрузки компаний'
    console.error('Error fetching customers:', err)
  } finally {
    customersLoading.value = false
  }
}

// ========== КЛИЕНТЫ КОМПАНИИ ==========
const customerUsers = ref<CustomerUsers[]>([])
const usersLoading = ref(false)
const usersError = ref<string | null>(null)

const fetchCustomerUsers = async () => {
  try {
    usersLoading.value = true
    usersError.value = null
    const data = await $fetch<{ customerUsers: CustomerUsers[], total: number }>(`${API_BASE}/customerUsers`)
    customerUsers.value = data.customerUsers
  } catch (err) {
    usersError.value = 'Ошибка загрузки клиентов компании'
    console.error('Error fetching customerUsers:', err)
  } finally {
    usersLoading.value = false
  }
}

// ========== CRUD ДЛЯ КОМПАНИЙ ==========
const createCustomers = async (item: Omit<Customers, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<Customers>(`${API_BASE}/customers`, {
      method: 'POST',
      body: item
    })
    customers.value.push(data)
    return data
  } catch (err) {
    console.error('Error creating customers:', err)
    throw err
  }
}

const updateCustomers = async (id: number, item: Omit<Customers, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<Customers>(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      body: item
    })
    const index = customers.value.findIndex(p => p.id === id)
    if (index !== -1) {
      customers.value[index] = data
    }
    return data
  } catch (err) {
    console.error('Error updating customers:', err)
    throw err
  }
}

const deleteCustomers = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/customers/${id}`, {
      method: 'DELETE'
    })
    const index = customers.value.findIndex(p => p.id === id)
    if (index !== -1) {
      customers.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Error deleting customers:', err)
    throw err
  }
}

// ========== CRUD ДЛЯ ГРУПП КЛИЕНТОВ ==========
const createCustomersGroups = async (item: Omit<CustomersGroups, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<CustomersGroups>(`${API_BASE}/customersGroups`, {
      method: 'POST',
      body: item
    })
    customersGroups.value.push(data)
    return data
  } catch (err) {
    console.error('Error creating customersGroups:', err)
    throw err
  }
}

const updateCustomersGroups = async (id: number, item: Omit<CustomersGroups, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<CustomersGroups>(`${API_BASE}/customersGroups/${id}`, {
      method: 'PUT',
      body: item
    })
    const index = customersGroups.value.findIndex(p => p.id === id)
    if (index !== -1) {
      customersGroups.value[index] = data
    }
    return data
  } catch (err) {
    console.error('Error updating customersGroups:', err)
    throw err
  }
}

const deleteCustomersGroups = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/customersGroups/${id}`, {
      method: 'DELETE'
    })
    const index = customersGroups.value.findIndex(p => p.id === id)
    if (index !== -1) {
      customersGroups.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Error deleting customersGroups:', err)
    throw err
  }
}

// ========== CRUD ДЛЯ КЛИЕНТОВ КОМПАНИИ ==========
const createCustomerUsers = async (item: Omit<CustomerUsers, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<CustomerUsers>(`${API_BASE}/customerUsers`, {
      method: 'POST',
      body: item
    })
    customerUsers.value.push(data)
    return data
  } catch (err) {
    console.error('Error creating customerUsers:', err)
    throw err
  }
}

const updateCustomerUsers = async (id: number, item: Omit<CustomerUsers, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<CustomerUsers>(`${API_BASE}/customerUsers/${id}`, {
      method: 'PUT',
      body: item
    })
    const index = customerUsers.value.findIndex(p => p.id === id)
    if (index !== -1) {
      customerUsers.value[index] = data
    }
    return data
  } catch (err) {
    console.error('Error updating customerUsers:', err)
    throw err
  }
}

const deleteCustomerUsers = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/customerUsers/${id}`, {
      method: 'DELETE'
    })
    const index = customerUsers.value.findIndex(p => p.id === id)
    if (index !== -1) {
      customerUsers.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Error deleting customerUsers:', err)
    throw err
  }
}

// Обновление клиента компании (для drag&drop)
const updateCustomerUsersGroup = async (userId: number, customersGroupId: number | null) => {
  try {
    const user = customerUsers.value.find(u => u.id === userId)
    if (!user) return
    
    await $fetch<CustomerUsers>(`${API_BASE}/customerUsers/${userId}`, {
      method: 'PUT',
      body: {
        firstName: user.firstName,
        lastName: user.lastName,
        login: user.login,
        email: user.email,
        mobilePhone: user.mobilePhone,
        telegramAccount: user.telegramAccount,
        customerId: user.customerId,
        customersGroupId: customersGroupId,
        isActive: user.isActive
      }
    })
    
    // Обновляем локально
    const userIndex = customerUsers.value.findIndex(u => u.id === userId)
    if (userIndex !== -1) {
      customerUsers.value[userIndex].customersGroupId = customersGroupId ?? undefined
    }
    showToast('Сотрудник перемещен в другую группу')
  } catch (err) {
    console.error('Error updating customerUsers group:', err)
    showToast('Ошибка перемещения сотрудника', 'error')
  }
}

// Инициализация
onMounted(() => {
  fetchCustomersGroups()
  fetchCustomers()
  fetchCustomerUsers()
})

// ========== ОРГАНИЗАЦИОННАЯ СТРУКТУРА ==========
const groupsWithUsers = computed(() => {
  return customersGroups.value.map(group => ({
    ...group,
    users: customerUsers.value.filter(u => u.customersGroupId === group.id)
  }))
})

const companiesWithGroups = computed(() => {
  return customers.value.map(company => ({
    ...company,
    groups: groupsWithUsers.value.filter(g => g.customerId === company.id)
  }))
})

const usersWithoutGroup = computed(() => {
  return customerUsers.value.filter(u => !u.customersGroupId)
})

// ========== DRAG & DROP ==========
const draggedUser = ref<CustomerUsers | null>(null)
const dragOverGroupId = ref<number | null>(null)

const onDragStart = (user: CustomerUsers, event: DragEvent) => {
  draggedUser.value = user
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(user.id))
  }
}

const onDragEnd = () => {
  draggedUser.value = null
  dragOverGroupId.value = null
}

const onDragOver = (groupId: number, event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOverGroupId.value = groupId
}

const onDragLeave = () => {
  dragOverGroupId.value = null
}

const onDrop = async (groupId: number, event: DragEvent) => {
  event.preventDefault()
  if (draggedUser.value) {
    await updateCustomerUsersGroup(draggedUser.value.id, groupId)
  }
  draggedUser.value = null
  dragOverGroupId.value = null
}

const onDropWithoutGroup = async (event: DragEvent) => {
  event.preventDefault()
  if (draggedUser.value) {
    await updateCustomerUsersGroup(draggedUser.value.id, null)
  }
  draggedUser.value = null
  dragOverGroupId.value = null
}

// ========== УВЕДОМЛЕНИЯ ==========
const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

// Генерирует инициалы для аватара
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
}

// Генерирует цвет на основе имени
const getColorFromName = (name: string) => {
  const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// ========== ДИАЛОГИ И МЕТОДЫ ДЛЯ КОМПАНИЙ ==========
const editCompanyDialog = ref(false)
const deleteCompanyDialog = ref(false)

const defaultCompanyItem = ref<Customers>({
  id: -1,
  name: '',
  street: '',
  zip: '',
  city: '',
  comment: '',
  isActive: true,
  createdAt: '',
  updatedAt: '',
})

const editedCompanyItem = ref<Customers>({ ...defaultCompanyItem.value })
const editedCompanyIndex = ref(-1)

const openAddCompanyDialog = () => {
  editedCompanyItem.value = { ...defaultCompanyItem.value }
  editedCompanyIndex.value = -1
  editCompanyDialog.value = true
}

const openEditCompanyDialog = (company: Customers) => {
  editedCompanyIndex.value = customers.value.indexOf(company)
  editedCompanyItem.value = { ...company }
  editCompanyDialog.value = true
}

const openDeleteCompanyDialog = (company: Customers) => {
  editedCompanyIndex.value = customers.value.indexOf(company)
  editedCompanyItem.value = { ...company }
  deleteCompanyDialog.value = true
}

const closeCompanyDialog = () => {
  editCompanyDialog.value = false
  editedCompanyIndex.value = -1
  editedCompanyItem.value = { ...defaultCompanyItem.value }
}

const closeCompanyDeleteDialog = () => {
  deleteCompanyDialog.value = false
  editedCompanyIndex.value = -1
  editedCompanyItem.value = { ...defaultCompanyItem.value }
}

const saveCompany = async () => {
  if (!editedCompanyItem.value.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  try {
    if (editedCompanyIndex.value > -1) {
      await updateCustomers(editedCompanyItem.value.id, {
        name: editedCompanyItem.value.name,
        street: editedCompanyItem.value.street,
        zip: editedCompanyItem.value.zip,
        city: editedCompanyItem.value.city,
        comment: editedCompanyItem.value.comment,
        isActive: editedCompanyItem.value.isActive
      })
      showToast('Компания успешно сохранена')
    } else {
      await createCustomers({
        name: editedCompanyItem.value.name,
        street: editedCompanyItem.value.street,
        zip: editedCompanyItem.value.zip,
        city: editedCompanyItem.value.city,
        comment: editedCompanyItem.value.comment,
        isActive: editedCompanyItem.value.isActive
      })
      showToast('Компания успешно добавлена')
    }
    closeCompanyDialog()
  } catch (err) {
    showToast('Ошибка сохранения компании', 'error')
  }
}

const deleteCompanyConfirm = async () => {
  try {
    await deleteCustomers(editedCompanyItem.value.id)
    showToast('Компания успешно удалена')
    closeCompanyDeleteDialog()
  } catch (err) {
    showToast('Ошибка удаления компании', 'error')
  }
}

// ========== ДИАЛОГИ И МЕТОДЫ ДЛЯ ГРУПП ==========
const editGroupDialog = ref(false)
const deleteGroupDialog = ref(false)

const defaultGroupItem = ref<CustomersGroups>({
  id: -1,
  name: '',
  message: '',
  customerId: undefined,
  isActive: true,
  createdAt: '',
  updatedAt: '',
})

const editedGroupItem = ref<CustomersGroups>({ ...defaultGroupItem.value })
const editedGroupIndex = ref(-1)

const openAddGroupDialog = (customerId?: number) => {
  editedGroupItem.value = { ...defaultGroupItem.value, customerId }
  editedGroupIndex.value = -1
  editGroupDialog.value = true
}

const openEditGroupDialog = (group: CustomersGroups) => {
  editedGroupIndex.value = customersGroups.value.indexOf(group)
  editedGroupItem.value = { ...group }
  editGroupDialog.value = true
}

const openDeleteGroupDialog = (group: CustomersGroups) => {
  editedGroupIndex.value = customersGroups.value.indexOf(group)
  editedGroupItem.value = { ...group }
  deleteGroupDialog.value = true
}

const closeGroupDialog = () => {
  editGroupDialog.value = false
  editedGroupIndex.value = -1
  editedGroupItem.value = { ...defaultGroupItem.value }
}

const closeGroupDeleteDialog = () => {
  deleteGroupDialog.value = false
  editedGroupIndex.value = -1
  editedGroupItem.value = { ...defaultGroupItem.value }
}

const saveGroup = async () => {
  if (!editedGroupItem.value.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  try {
    if (editedGroupIndex.value > -1) {
      await updateCustomersGroups(editedGroupItem.value.id, {
        name: editedGroupItem.value.name,
        message: editedGroupItem.value.message,
        customerId: editedGroupItem.value.customerId,
        isActive: editedGroupItem.value.isActive
      })
      showToast('Группа успешно сохранена')
    } else {
      await createCustomersGroups({
        name: editedGroupItem.value.name,
        message: editedGroupItem.value.message,
        customerId: editedGroupItem.value.customerId,
        isActive: editedGroupItem.value.isActive
      })
      showToast('Группа успешно добавлена')
    }
    closeGroupDialog()
  } catch (err) {
    showToast('Ошибка сохранения группы', 'error')
  }
}

const deleteGroupConfirm = async () => {
  try {
    await deleteCustomersGroups(editedGroupItem.value.id)
    showToast('Группа успешно удалена')
    closeGroupDeleteDialog()
  } catch (err) {
    showToast('Ошибка удаления группы', 'error')
  }
}

// ========== ДИАЛОГИ И МЕТОДЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ==========
const editUserDialog = ref(false)
const deleteUserDialog = ref(false)

const defaultUserItem = ref<CustomerUsers>({
  id: -1,
  firstName: '',
  lastName: '',
  login: '',
  email: '',
  mobilePhone: '',
  telegramAccount: '',
  customerId: undefined,
  customersGroupId: undefined,
  isActive: true,
  createdAt: '',
  updatedAt: '',
})

const editedUserItem = ref<CustomerUsers>({ ...defaultUserItem.value })
const editedUserIndex = ref(-1)

const openAddUserDialog = (customerId?: number, customersGroupId?: number) => {
  editedUserItem.value = { ...defaultUserItem.value, customerId, customersGroupId }
  editedUserIndex.value = -1
  editUserDialog.value = true
}

const openEditUserDialog = (user: CustomerUsers) => {
  editedUserIndex.value = customerUsers.value.indexOf(user)
  editedUserItem.value = { ...user }
  editUserDialog.value = true
}

const openDeleteUserDialog = (user: CustomerUsers) => {
  editedUserIndex.value = customerUsers.value.indexOf(user)
  editedUserItem.value = { ...user }
  deleteUserDialog.value = true
}

const closeUserDialog = () => {
  editUserDialog.value = false
  editedUserIndex.value = -1
  editedUserItem.value = { ...defaultUserItem.value }
}

const closeUserDeleteDialog = () => {
  deleteUserDialog.value = false
  editedUserIndex.value = -1
  editedUserItem.value = { ...defaultUserItem.value }
}

const saveUser = async () => {
  if (!editedUserItem.value.firstName?.trim() || !editedUserItem.value.lastName?.trim()) {
    showToast('Имя и Фамилия обязательны для заполнения', 'error')
    return
  }

  try {
    if (editedUserIndex.value > -1) {
      await updateCustomerUsers(editedUserItem.value.id, {
        firstName: editedUserItem.value.firstName,
        lastName: editedUserItem.value.lastName,
        login: editedUserItem.value.login,
        email: editedUserItem.value.email,
        mobilePhone: editedUserItem.value.mobilePhone,
        telegramAccount: editedUserItem.value.telegramAccount,
        customerId: editedUserItem.value.customerId,
        customersGroupId: editedUserItem.value.customersGroupId,
        isActive: editedUserItem.value.isActive
      })
      showToast('Сотрудник успешно сохранен')
    } else {
      await createCustomerUsers({
        firstName: editedUserItem.value.firstName,
        lastName: editedUserItem.value.lastName,
        login: editedUserItem.value.login,
        email: editedUserItem.value.email,
        mobilePhone: editedUserItem.value.mobilePhone,
        telegramAccount: editedUserItem.value.telegramAccount,
        customerId: editedUserItem.value.customerId,
        customersGroupId: editedUserItem.value.customersGroupId,
        isActive: editedUserItem.value.isActive
      })
      showToast('Сотрудник успешно добавлен')
    }
    closeUserDialog()
  } catch (err) {
    showToast('Ошибка сохранения сотрудника', 'error')
  }
}

const deleteUserConfirm = async () => {
  try {
    await deleteCustomerUsers(editedUserItem.value.id)
    showToast('Сотрудник успешно удален')
    closeUserDeleteDialog()
  } catch (err) {
    showToast('Ошибка удаления сотрудника', 'error')
  }
}

// ========== ПОЛУЧИТЬ НАЗВАНИЕ КОМПАНИИ ==========
const getCustomerName = (customerId: number | undefined) => {
  if (!customerId) return 'Не назначена'
  const customer = customers.value.find(c => c.id === customerId)
  return customer?.name || 'Не назначена'
}

// ========== ПОЛУЧИТЬ НАЗВАНИЕ ГРУППЫ ==========
const getGroupName = (groupId: number | undefined) => {
  if (!groupId) return 'Нет группы'
  const group = customersGroups.value.find(g => g.id === groupId)
  return group?.name || 'Нет группы'
}
</script>

<template>
  <div class="organization-structure">
    <VCard title="Организационная структура">
      <!-- Панель управления -->
      <div class="pa-4 pb-0">
        <VBtn
          color="primary"
          prepend-icon="bx-plus"
          @click="openAddCompanyDialog()"
        >
          Добавить компанию
        </VBtn>
      </div>

      <!-- Индикатор загрузки -->
      <div v-if="customersLoading || usersLoading" class="d-flex justify-center pa-6">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <!-- Сообщение об ошибке -->
      <div v-else-if="customersError || usersError" class="d-flex justify-center pa-6">
        <VAlert type="error" class="ma-4">
          {{ customersError || usersError }}
        </VAlert>
      </div>

      <div v-else class="pa-4">
        <!-- Компании -->
        <div v-if="companiesWithGroups.length > 0" class="companies-container">
          <div 
            v-for="company in companiesWithGroups" 
            :key="company.id" 
            class="company-widget mb-6"
          >
            <!-- Виджет компании -->
            <VCard class="company-card" variant="outlined">
              <VCardText>
                <div class="d-flex align-center justify-space-between">
                  <div class="d-flex align-center gap-3">
                    <VAvatar color="primary" size="48">
                      <span class="text-h6">{{ company.name?.[0] || 'К' }}</span>
                    </VAvatar>
                    <div>
                      <div class="text-h6">{{ company.name }}</div>
                      <div class="text-caption text-medium-emphasis">
                        {{ company.city || 'Город не указан' }}
                      </div>
                    </div>
                  </div>
                  
                  <div class="d-flex align-center gap-1">
                    <!-- Кнопки действий для компании -->
                    <VBtn
                      icon
                      variant="text"
                      size="small"
                      @click="openAddGroupDialog(company.id)"
                    >
                      <VIcon icon="bx-folder-plus" />
                      <VTooltip activator="parent" location="top">Добавить группу</VTooltip>
                    </VBtn>
                    <VBtn
                      icon
                      variant="text"
                      size="small"
                      @click="openEditCompanyDialog(company)"
                    >
                      <VIcon icon="bx-edit" />
                      <VTooltip activator="parent" location="top">Редактировать компанию</VTooltip>
                    </VBtn>
                    <VBtn
                      icon
                      variant="text"
                      size="small"
                      color="error"
                      @click="openDeleteCompanyDialog(company)"
                    >
                      <VIcon icon="bx-trash" />
                      <VTooltip activator="parent" location="top">Удалить компанию</VTooltip>
                    </VBtn>
                    
                    <!-- Кружочки групп -->
                    <template v-if="company.groups.length > 0">
                      <VAvatar 
                        v-for="(group, idx) in company.groups.slice(0, 4)" 
                        :key="group.id"
                        size="32" 
                        :color="getColorFromName(group.name)"
                        class="group-avatar"
                      >
                        <span class="text-caption">{{ group.name?.[0] || 'Г' }}</span>
                      </VAvatar>
                      <VAvatar 
                        v-if="company.groups.length > 4" 
                        size="32" 
                        color="grey"
                        class="group-avatar-more"
                      >
                        <span class="text-caption">+{{ company.groups.length - 4 }}</span>
                      </VAvatar>
                    </template>
                    <span v-else class="text-medium-emphasis">Нет групп</span>
                  </div>
                </div>
              </VCardText>
            </VCard>

            <!-- Группы внутри компании -->
            <div class="groups-container ms-8 mt-4">
              <div 
                v-for="group in company.groups" 
                :key="group.id" 
                class="group-widget mb-4"
                :class="{ 'drag-over': dragOverGroupId === group.id }"
                @dragover="onDragOver(group.id, $event)"
                @dragleave="onDragLeave"
                @drop="onDrop(group.id, $event)"
              >
                <!-- Виджет группы -->
                <VCard class="group-card" variant="tonal">
                  <VCardText>
                    <div class="d-flex align-center justify-space-between">
                      <div class="d-flex align-center gap-2">
                        <VIcon icon="bx-group" size="small" />
                        <span class="font-weight-medium">{{ group.name }}</span>
                      </div>
                      
                      <div class="d-flex align-center gap-1">
                        <!-- Кнопки действий для группы -->
                        <VBtn
                          icon
                          variant="text"
                          size="x-small"
                          @click="openAddUserDialog(company.id, group.id)"
                        >
                          <VIcon icon="bx-user-plus" size="18" />
                          <VTooltip activator="parent" location="top">Добавить сотрудника</VTooltip>
                        </VBtn>
                        <VBtn
                          icon
                          variant="text"
                          size="x-small"
                          @click="openEditGroupDialog(group)"
                        >
                          <VIcon icon="bx-edit" size="18" />
                          <VTooltip activator="parent" location="top">Редактировать группу</VTooltip>
                        </VBtn>
                        <VBtn
                          icon
                          variant="text"
                          size="x-small"
                          color="error"
                          @click="openDeleteGroupDialog(group)"
                        >
                          <VIcon icon="bx-trash" size="18" />
                          <VTooltip activator="parent" location="top">Удалить группу</VTooltip>
                        </VBtn>
                        
                        <!-- Кружочки сотрудников -->
                        <template v-if="group.users.length > 0">
                          <VAvatar 
                            v-for="user in group.users.slice(0, 4)" 
                            :key="user.id"
                            size="28" 
                            :color="getColorFromName(user.firstName + user.lastName)"
                            class="user-avatar"
                          >
                            <span class="text-caption">{{ getInitials(user.firstName, user.lastName) }}</span>
                          </VAvatar>
                          <VAvatar 
                            v-if="group.users.length > 4" 
                            size="28" 
                            color="grey"
                            class="user-avatar-more"
                          >
                            <span class="text-caption">+{{ group.users.length - 4 }}</span>
                          </VAvatar>
                        </template>
                        <VChip size="small" variant="text" class="ms-2">
                          {{ group.users.length }} чел.
                        </VChip>
                      </div>
                    </div>

                    <!-- Сотрудники группы -->
                    <div class="users-list mt-3">
                      <div 
                        v-for="user in group.users" 
                        :key="user.id"
                        class="user-widget mb-2"
                        draggable="true"
                        @dragstart="onDragStart(user, $event)"
                        @dragend="onDragEnd"
                      >
                        <VCard variant="outlined" class="user-card">
                          <VCardText class="py-2 px-3">
                            <div class="d-flex align-center gap-3">
                              <VAvatar :color="getColorFromName(user.firstName + user.lastName)" size="40">
                                <span v-if="user.firstName || user.lastName">
                                  {{ getInitials(user.firstName, user.lastName) }}
                                </span>
                                <VIcon v-else icon="bx-user" />
                              </VAvatar>
                              
                              <div class="flex-grow-1">
                                <div class="font-weight-medium">
                                  {{ user.firstName }} {{ user.lastName }}
                                </div>
                                <div class="d-flex flex-wrap gap-2 mt-1">
                                  <VChip 
                                    v-if="user.email" 
                                    size="x-small" 
                                    variant="text"
                                    prepend-icon="bx-envelope"
                                  >
                                    {{ user.email }}
                                  </VChip>
                                  <VChip 
                                    v-if="user.mobilePhone" 
                                    size="x-small" 
                                    variant="text"
                                    prepend-icon="bx-phone"
                                  >
                                    {{ user.mobilePhone }}
                                  </VChip>
                                  <VChip 
                                    v-if="user.telegramAccount" 
                                    size="x-small" 
                                    variant="text"
                                    prepend-icon="bxl-telegram"
                                  >
                                    {{ user.telegramAccount }}
                                  </VChip>
                                </div>
                              </div>
                              
                              <!-- Кнопки действий для пользователя -->
                              <div class="d-flex gap-1">
                                <VBtn
                                  icon
                                  variant="text"
                                  size="x-small"
                                  @click.stop="openEditUserDialog(user)"
                                >
                                  <VIcon icon="bx-edit" size="16" />
                                </VBtn>
                                <VBtn
                                  icon
                                  variant="text"
                                  size="x-small"
                                  color="error"
                                  @click.stop="openDeleteUserDialog(user)"
                                >
                                  <VIcon icon="bx-trash" size="16" />
                                </VBtn>
                              </div>
                            </div>
                          </VCardText>
                        </VCard>
                      </div>

                      <div v-if="group.users.length === 0" class="text-center py-4 text-medium-emphasis">
                        Перетащите сотрудников сюда
                      </div>
                    </div>
                  </VCardText>
                </VCard>
              </div>

              <!-- Если у компании нет групп -->
              <div v-if="company.groups.length === 0" class="text-center py-4 text-medium-emphasis">
                Нет групп в этой компании
              </div>
            </div>
          </div>
        </div>

        <!-- Сотрудники без группы -->
        <div 
          class="no-group-section mt-6"
          :class="{ 'drag-over': dragOverGroupId === -1 }"
          @dragover="(e) => { e.preventDefault(); dragOverGroupId = -1 }"
          @dragleave="onDragLeave"
          @drop="onDropWithoutGroup"
        >
          <VCard variant="outlined" class="no-group-card">
            <VCardText>
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center gap-2">
                  <VIcon icon="bx-user-plus" />
                  <span class="font-weight-medium">Сотрудники без группы</span>
                </div>
                <div class="d-flex align-center gap-2">
                  <VBtn
                    size="small"
                    variant="tonal"
                    prepend-icon="bx-plus"
                    @click="openAddUserDialog()"
                  >
                    Добавить сотрудника
                  </VBtn>
                  <VChip size="small">{{ usersWithoutGroup.length }} чел.</VChip>
                </div>
              </div>

              <div class="users-grid">
                <div 
                  v-for="user in usersWithoutGroup" 
                  :key="user.id"
                  class="user-widget"
                  draggable="true"
                  @dragstart="onDragStart(user, $event)"
                  @dragend="onDragEnd"
                >
                  <VCard variant="tonal" class="user-card">
                    <VCardText class="py-2 px-3">
                      <div class="d-flex align-center gap-3">
                        <VAvatar :color="getColorFromName(user.firstName + user.lastName)" size="40">
                          <span v-if="user.firstName || user.lastName">
                            {{ getInitials(user.firstName, user.lastName) }}
                          </span>
                          <VIcon v-else icon="bx-user" />
                        </VAvatar>
                        
                        <div class="flex-grow-1">
                          <div class="font-weight-medium">
                            {{ user.firstName }} {{ user.lastName }}
                          </div>
                          <div class="d-flex flex-wrap gap-1 mt-1">
                            <VChip 
                              v-if="user.email" 
                              size="x-small" 
                              variant="text"
                              prepend-icon="bx-envelope"
                            >
                              {{ user.email }}
                            </VChip>
                            <VChip 
                              v-if="user.mobilePhone" 
                              size="x-small" 
                              variant="text"
                              prepend-icon="bx-phone"
                            >
                              {{ user.mobilePhone }}
                            </VChip>
                            <VChip 
                              v-if="user.telegramAccount" 
                              size="x-small" 
                              variant="text"
                              prepend-icon="bxl-telegram"
                            >
                              {{ user.telegramAccount }}
                            </VChip>
                          </div>
                        </div>
                        
                        <!-- Кнопки действий для пользователя -->
                        <div class="d-flex gap-1">
                          <VBtn
                            icon
                            variant="text"
                            size="small"
                            @click="openEditUserDialog(user)"
                          >
                            <VIcon icon="bx-edit" />
                          </VBtn>
                          <VBtn
                            icon
                            variant="text"
                            size="small"
                            color="error"
                            @click="openDeleteUserDialog(user)"
                          >
                            <VIcon icon="bx-trash" />
                          </VBtn>
                        </div>
                      </div>
                    </VCardText>
                  </VCard>
                </div>

                <div v-if="usersWithoutGroup.length === 0" class="text-center py-4 text-medium-emphasis">
                  Все сотрудники распределены по группам
                </div>
              </div>
            </VCardText>
          </VCard>
        </div>
      </div>
    </VCard>

    <!-- Диалог редактирования компании -->
    <VDialog v-model="editCompanyDialog" max-width="600px">
      <VCard :title="editedCompanyIndex > -1 ? 'Редактировать компанию' : 'Добавить компанию'">
        <VCardText>
          <VRow>
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedCompanyItem.name"
                label="Название *"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedCompanyItem.city"
                label="Город"
              />
            </VCol>
            <VCol cols="12">
              <AppTextField
                v-model="editedCompanyItem.street"
                label="Улица"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedCompanyItem.zip"
                label="Индекс"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <VSwitch
                v-model="editedCompanyItem.isActive"
                label="Активен"
                color="primary"
              />
            </VCol>
            <VCol cols="12">
              <AppTextarea
                v-model="editedCompanyItem.comment"
                label="Комментарий"
                rows="3"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardText class="d-flex justify-end gap-4">
          <VBtn color="error" variant="outlined" @click="closeCompanyDialog">Отмена</VBtn>
          <VBtn color="success" variant="elevated" @click="saveCompany">Сохранить</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог удаления компании -->
    <VDialog v-model="deleteCompanyDialog" max-width="500px">
      <VCard title="Подтверждение удаления">
        <VCardText>
          Вы уверены, что хотите удалить компанию "{{ editedCompanyItem.name }}"? Это действие нельзя отменить.
        </VCardText>
        <VCardText class="d-flex justify-center gap-4">
          <VBtn color="error" variant="outlined" @click="closeCompanyDeleteDialog">Отмена</VBtn>
          <VBtn color="success" variant="elevated" @click="deleteCompanyConfirm">Удалить</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог редактирования группы -->
    <VDialog v-model="editGroupDialog" max-width="600px">
      <VCard :title="editedGroupIndex > -1 ? 'Редактировать группу' : 'Добавить группу'">
        <VCardText>
          <VRow>
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedGroupItem.name"
                label="Название *"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <VSwitch
                v-model="editedGroupItem.isActive"
                label="Активна"
                color="primary"
              />
            </VCol>
            <VCol cols="12">
              <AppTextarea
                v-model="editedGroupItem.message"
                label="Сообщение"
                rows="3"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardText class="d-flex justify-end gap-4">
          <VBtn color="error" variant="outlined" @click="closeGroupDialog">Отмена</VBtn>
          <VBtn color="success" variant="elevated" @click="saveGroup">Сохранить</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог удаления группы -->
    <VDialog v-model="deleteGroupDialog" max-width="500px">
      <VCard title="Подтверждение удаления">
        <VCardText>
          Вы уверены, что хотите удалить группу "{{ editedGroupItem.name }}"? Это действие нельзя отменить.
        </VCardText>
        <VCardText class="d-flex justify-center gap-4">
          <VBtn color="error" variant="outlined" @click="closeGroupDeleteDialog">Отмена</VBtn>
          <VBtn color="success" variant="elevated" @click="deleteGroupConfirm">Удалить</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог редактирования пользователя -->
    <VDialog v-model="editUserDialog" max-width="600px">
      <VCard :title="editedUserIndex > -1 ? 'Редактировать сотрудника' : 'Добавить сотрудника'">
        <VCardText>
          <VRow>
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedUserItem.firstName"
                label="Имя *"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedUserItem.lastName"
                label="Фамилия *"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedUserItem.login"
                label="Логин"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedUserItem.email"
                label="Email"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedUserItem.mobilePhone"
                label="Мобильный телефон"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedUserItem.telegramAccount"
                label="Телеграм"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <VSwitch
                v-model="editedUserItem.isActive"
                label="Активен"
                color="primary"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardText class="d-flex justify-end gap-4">
          <VBtn color="error" variant="outlined" @click="closeUserDialog">Отмена</VBtn>
          <VBtn color="success" variant="elevated" @click="saveUser">Сохранить</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог удаления пользователя -->
    <VDialog v-model="deleteUserDialog" max-width="500px">
      <VCard title="Подтверждение удаления">
        <VCardText>
          Вы уверены, что хотите удалить сотрудника "{{ editedUserItem.firstName }} {{ editedUserItem.lastName }}"? Это действие нельзя отменить.
        </VCardText>
        <VCardText class="d-flex justify-center gap-4">
          <VBtn color="error" variant="outlined" @click="closeUserDeleteDialog">Отмена</VBtn>
          <VBtn color="success" variant="elevated" @click="deleteUserConfirm">Удалить</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Уведомления -->
    <VSnackbar
      v-model="isToastVisible"
      :color="toastColor"
      timeout="3000"
    >
      {{ toastMessage }}
    </VSnackbar>
  </div>
</template>

<style lang="scss" scoped>
.organization-structure {
  .company-card {
    border-left: 4px solid rgb(var(--v-theme-primary));
  }

  .group-card {
    border-left: 4px solid rgb(var(--v-theme-secondary));
    transition: all 0.2s ease;

    &.drag-over {
      background-color: rgba(var(--v-theme-primary), 0.1);
      border-color: rgb(var(--v-theme-primary));
    }
  }

  .user-card {
    cursor: grab;
    transition: all 0.2s ease;

    &:hover {
      transform: translateX(4px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &:active {
      cursor: grabbing;
    }
  }

  .group-avatar,
  .user-avatar {
    margin-inline-start: -8px;
    border: 2px solid white;

    &:first-child {
      margin-inline-start: 0;
    }
  }

  .group-avatar-more,
  .user-avatar-more {
    margin-inline-start: -8px;
    border: 2px solid white;
    font-size: 10px;
  }

  .no-group-card {
    border-left: 4px solid rgb(var(--v-theme-warning));

    &.drag-over {
      background-color: rgba(var(--v-theme-warning), 0.1);
    }
  }

  .users-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 8px;
  }

  .users-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
