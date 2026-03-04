<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, ref, watch } from 'vue'

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
  services?: Services[]
  customersGroups?: CustomersGroups[]
  serviceIds?: number[]
}

// Типы данных для Сервисы (из /services)
interface Services {
  id: number
  name: string
  comment: string
  type: string
  isActive: boolean
  createdAt: string
  updatedAt: string
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
// Данные группы клиентов
const customersGroups = ref<CustomersGroups[]>([])
const customersGroupsTotal = ref(0)
const customersGroupsLoading = ref(false)
const customersGroupsError = ref<string | null>(null)

// Загрузка данных из API
const fetchCustomersGroups = async () => {
  try {
    customersGroupsLoading.value = true
    customersGroupsError.value = null
    const data = await $fetch<{ customersGroups: CustomersGroups[], total: number }>(`${API_BASE}/customersGroups`)
    customersGroups.value = data.customersGroups
    customersGroupsTotal.value = data.total
  } catch (err) {
    customersGroupsError.value = 'Ошибка загрузки групп клиентов'
    console.error('Error fetching customersGroups:', err)
  } finally {
    customersGroupsLoading.value = false
  }
}

// Создание группы клиентов
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

// Обновление группы клиентов
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

// Удаление группы клиентов
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

// ========== КОМПАНИИ ==========
// Данные компании
const customers = ref<Customers[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Загрузка данных из API
const fetchCustomers = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await $fetch<{ customers: Customers[], total: number }>(`${API_BASE}/customers`)
    customers.value = data.customers
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки компании'
    console.error('Error fetching customers:', err)
  } finally {
    loading.value = false
  }
}

// Создание компании
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

// Обновление компании
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

// Удаление компании
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

// ========== КЛИЕНТЫ КОМПАНИИ ==========
// Данные клиентов компании
const customerUsers = ref<CustomerUsers[]>([])
const usersTotal = ref(0)
const usersLoading = ref(false)
const usersError = ref<string | null>(null)

// Загрузка клиентов из API
const fetchCustomerUsers = async () => {
  try {
    usersLoading.value = true
    usersError.value = null
    const data = await $fetch<{ customerUsers: CustomerUsers[], total: number }>(`${API_BASE}/customerUsers`)
    customerUsers.value = data.customerUsers
    usersTotal.value = data.total
  } catch (err) {
    usersError.value = 'Ошибка загрузки клиентов компании'
    console.error('Error fetching customerUsers:', err)
  } finally {
    usersLoading.value = false
  }
}

// Создание клиента компании
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

// Обновление клиента компании
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

// Удаление клиента компании
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

// Инициализация
onMounted(() => {
  fetchCustomersGroups()
  fetchCustomers()
  fetchCustomerUsers()
})

// ========== ЗАГОЛОВКИ ТАБЛИЦ ==========
// ========== ЗАГОЛОВКИ ТАБЛИЦ ==========
// Заголовки таблицы групп клиентов
const customersGroupsHeaders = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Сообщение', key: 'message', sortable: true },
  { title: 'Компания', key: 'customer', sortable: false },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Заголовки таблицы компаний
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Улица', key: 'street', sortable: true },
  { title: 'Индекс', key: 'zip', sortable: true },
  { title: 'Город', key: 'city', sortable: true },
  { title: 'Комментарий', key: 'comment', sortable: true },
  { title: 'Сервисы', key: 'services', sortable: false },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Заголовки таблицы клиентов компании
const usersHeaders = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Имя', key: 'firstName', sortable: true },
  { title: 'Фамилия', key: 'lastName', sortable: true },
  { title: 'Логин', key: 'login', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Мобильный телефон', key: 'mobilePhone', sortable: true },
  { title: 'Телеграмм акк', key: 'telegramAccount', sortable: true },
  { title: 'Компания', key: 'customer', sortable: false },
  { title: 'Группа', key: 'customersGroup', sortable: false },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// ========== ФИЛЬТРАЦИЯ ==========
// Поиск
const customersGroupsSearchQuery = ref('')
const searchQuery = ref('')
const servicesSearchQuery = ref('')
const usersSearchQuery = ref('')

// Фильтрация групп клиентов
const filteredCustomersGroups = computed(() => {
  let filtered = customersGroups.value

  if (customersGroupsStatusFilter.value !== null) {
    filtered = filtered.filter(p => p.isActive === (customersGroupsStatusFilter.value === 1))
  }

  if (customersGroupsSearchQuery.value.trim()) {
    const query = customersGroupsSearchQuery.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.message?.toLowerCase().includes(query)
    )
  }

  return filtered
})

// Сброс фильтров групп клиентов
const clearCustomersGroupsFilters = () => {
  customersGroupsStatusFilter.value = null
}

// Фильтрация компаний
const filteredCustomers = computed(() => {
  let filtered = customers.value

  if (statusFilter.value !== null) {
    // Фильтруем по isActive: 1 = true (активен), 2 = false (не активен)
    filtered = filtered.filter(p => p.isActive === (statusFilter.value === 1))
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.city?.toLowerCase().includes(query) ||
      p.street?.toLowerCase().includes(query)
    )
  }

  return filtered
})

// Фильтрация сервисов
const filteredServices = computed(() => {
  let filtered = services.value

  if (servicesStatusFilter.value !== null) {
    filtered = filtered.filter(p => p.isActive === (servicesStatusFilter.value === 1))
  }

  if (servicesSearchQuery.value.trim()) {
    const query = servicesSearchQuery.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.comment?.toLowerCase().includes(query) ||
      p.type?.toLowerCase().includes(query)
    )
  }

  return filtered
})

// Сброс фильтров компаний
const clearFilters = () => {
  statusFilter.value = null
}

// Сброс фильтров сервисов
const clearServicesFilters = () => {
  servicesStatusFilter.value = null
}

// Фильтрация клиентов компании
const filteredCustomerUsers = computed(() => {
  let filtered = customerUsers.value

  if (usersStatusFilter.value !== null) {
    filtered = filtered.filter(p => p.isActive === (usersStatusFilter.value === 1))
  }

  if (usersSearchQuery.value.trim()) {
    const query = usersSearchQuery.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.firstName?.toLowerCase().includes(query) ||
      p.lastName?.toLowerCase().includes(query) ||
      p.email?.toLowerCase().includes(query) ||
      p.login?.toLowerCase().includes(query)
    )
  }

  return filtered
})

// Получить название компании по ID
const getCustomerName = (customerId: number | undefined) => {
  if (!customerId) return 'Не назначена'
  const customer = customers.value.find(c => c.id === customerId || c.id === Number(customerId))
  return customer?.name || 'Не назначена'
}

// Получить название группы по ID
const getCustomersGroupName = (customersGroupId: number | undefined) => {
  if (!customersGroupId) return 'Не назначена'
  const group = customersGroups.value.find(g => g.id === customersGroupId || g.id === Number(customersGroupId))
  return group?.name || 'Не назначена'
}

// Сброс фильтров клиентов
const clearUsersFilters = () => {
  usersStatusFilter.value = null
}

// ========== МАССОВЫЕ ДЕЙСТВИЯ ДЛЯ ГРУПП КЛИЕНТОВ ==========
const bulkDeleteCustomersGroups = () => {
  isBulkDeleteCustomersGroupsDialogOpen.value = true
}

const bulkChangeStatusCustomersGroups = () => {
  isBulkStatusCustomersGroupsDialogOpen.value = true
}

const confirmBulkDeleteCustomersGroups = async () => {
  try {
    const count = selectedCustomersGroups.value.length
    for (const item of selectedCustomersGroups.value) {
      await deleteCustomersGroups(item.id)
    }
    selectedCustomersGroups.value = []
    showToast(`Удалено ${count} групп клиентов`)
    isBulkDeleteCustomersGroupsDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmBulkStatusChangeCustomersGroups = async () => {
  try {
    const count = selectedCustomersGroups.value.length
    for (const item of selectedCustomersGroups.value) {
      await updateCustomersGroups(item.id, {
        name: item.name,
        message: item.message,
        customerId: item.customerId,
        isActive: bulkStatusCustomersGroupsValue.value === 1
      })
    }
    selectedCustomersGroups.value = []
    showToast(`Статус изменен для ${count} групп клиентов`)
    isBulkStatusCustomersGroupsDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового изменения статуса', 'error')
  }
}

// ========== МАССОВЫЕ ДЕЙСТВИЯ ДЛЯ КОМПАНИЙ ==========
const bulkDelete = () => {
  isBulkDeleteDialogOpen.value = true
}

const bulkChangeStatus = () => {
  isBulkStatusDialogOpen.value = true
}

const confirmBulkDelete = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await deleteCustomers(item.id)
    }
    selectedItems.value = []
    showToast(`Удалено ${count} компаний`)
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmBulkStatusChange = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await updateCustomers(item.id, {
        ...item,
        isActive: bulkStatusValue.value === 1
      })
    }
    selectedItems.value = []
    showToast(`Статус изменен для ${count} компаний`)
    isBulkStatusDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового изменения статуса', 'error')
  }
}

// ========== МАССОВЫЕ ДЕЙСТВИЯ ДЛЯ СЕРВИСОВ ==========
const bulkDeleteServices = () => {
  isBulkDeleteServicesDialogOpen.value = true
}

const bulkChangeStatusServices = () => {
  isBulkStatusServicesDialogOpen.value = true
}

const confirmBulkDeleteServices = async () => {
  try {
    const count = selectedServices.value.length
    for (const item of selectedServices.value) {
      await deleteServices(item.id)
    }
    selectedServices.value = []
    showToast(`Удалено ${count} сервисов`)
    isBulkDeleteServicesDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления сервисов', 'error')
  }
}

const confirmBulkStatusChangeServices = async () => {
  try {
    const count = selectedServices.value.length
    for (const item of selectedServices.value) {
      await updateServices(item.id, {
        ...item,
        isActive: bulkStatusServicesValue.value === 1
      })
    }
    selectedServices.value = []
    showToast(`Статус изменен для ${count} сервисов`)
    isBulkStatusServicesDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового изменения статуса сервисов', 'error')
  }
}

// ========== МАССОВЫЕ ДЕЙСТВИЯ ДЛЯ КЛИЕНТОВ ==========
const bulkDeleteUsers = () => {
  isBulkDeleteUsersDialogOpen.value = true
}

const bulkChangeStatusUsers = () => {
  isBulkStatusUsersDialogOpen.value = true
}

const confirmBulkDeleteUsers = async () => {
  try {
    const count = selectedUsers.value.length
    for (const item of selectedUsers.value) {
      await deleteCustomerUsers(item.id)
    }
    selectedUsers.value = []
    showToast(`Удалено ${count} клиентов`)
    isBulkDeleteUsersDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления клиентов', 'error')
  }
}

const confirmBulkStatusChangeUsers = async () => {
  try {
    const count = selectedUsers.value.length
    for (const item of selectedUsers.value) {
      await updateCustomerUsers(item.id, {
        firstName: item.firstName,
        lastName: item.lastName,
        login: item.login,
        email: item.email,
        mobilePhone: item.mobilePhone,
        telegramAccount: item.telegramAccount,
        isActive: bulkStatusUsersValue.value === 1
      })
    }
    selectedUsers.value = []
    showToast(`Статус изменен для ${count} клиентов`)
    isBulkStatusUsersDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового изменения статуса клиентов', 'error')
  }
}

const resolveStatusVariant = (isActive: boolean) => {
  if (isActive)
    return { color: 'primary', text: 'Активен' }
  else
    return { color: 'error', text: 'Не активен' }
}

// ========== ПАГИНАЦИЯ ==========
// Пагинация групп клиентов
const customersGroupsCurrentPage = ref(1)
const customersGroupsItemsPerPage = ref(10)

// Пагинация компаний
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Пагинация сервисов
const servicesCurrentPage = ref(1)
const servicesItemsPerPage = ref(10)

// Пагинация клиентов
const usersCurrentPage = ref(1)
const usersItemsPerPage = ref(10)

// ========== ФИЛЬТРЫ ==========
// Фильтры групп клиентов
const customersGroupsStatusFilter = ref<number | null>(null)
const isCustomersGroupsFilterDialogOpen = ref(false)

// Фильтры компаний
const statusFilter = ref<number | null>(null)
const isFilterDialogOpen = ref(false)

// Фильтры сервисов
const servicesStatusFilter = ref<number | null>(null)
const isServicesFilterDialogOpen = ref(false)

// Фильтры клиентов
const usersStatusFilter = ref<number | null>(null)
const isUsersFilterDialogOpen = ref(false)

// ========== МАССОВЫЕ ДЕЙСТВИЯ ==========
// Массовые действия для групп клиентов
const selectedCustomersGroups = ref<CustomersGroups[]>([])
const isBulkCustomersGroupsActionsMenuOpen = ref(false)
const isBulkDeleteCustomersGroupsDialogOpen = ref(false)
const isBulkStatusCustomersGroupsDialogOpen = ref(false)
const bulkStatusCustomersGroupsValue = ref<number>(1)

// Массовые действия для компаний
const selectedItems = ref<any[]>([])
const isBulkActionsMenuOpen = ref(false)
const isBulkDeleteDialogOpen = ref(false)
const isBulkStatusDialogOpen = ref(false)
const bulkStatusValue = ref<number>(1)

// Массовые действия для сервисов
const selectedServices = ref<any[]>([])
const isBulkServicesActionsMenuOpen = ref(false)
const isBulkDeleteServicesDialogOpen = ref(false)
const isBulkStatusServicesDialogOpen = ref(false)
const bulkStatusServicesValue = ref<number>(1)

// Массовые действия для клиентов
const selectedUsers = ref<CustomerUsers[]>([])
const isBulkUsersActionsMenuOpen = ref(false)
const isBulkDeleteUsersDialogOpen = ref(false)
const isBulkStatusUsersDialogOpen = ref(false)
const bulkStatusUsersValue = ref<number>(1)

// Отслеживание изменений выбранных элементов компаний
watch(selectedItems, () => {
  // Можно добавить логику при изменении выбранных элементов
}, { deep: true })

// Отслеживание изменений выбранных сервисов
watch(selectedServices, () => {
  // Можно добавить логику при изменении выбранных сервисов
}, { deep: true })

// ========== ДИАЛОГИ ==========
// Диалоги групп клиентов
const editCustomersGroupsDialog = ref(false)
const deleteCustomersGroupsDialog = ref(false)

const defaultCustomersGroupsItem = ref<CustomersGroups>({
  id: -1,
  name: '',
  message: '',
  customerId: undefined,
  createdAt: '',
  updatedAt: '',
  isActive: true,
})

const editedCustomersGroupsItem = ref<CustomersGroups>({ ...defaultCustomersGroupsItem.value })
const editedCustomersGroupsIndex = ref(-1)

// Диалоги компаний
const editDialog = ref(false)
const deleteDialog = ref(false)

// Диалоги сервисов
const editServiceDialog = ref(false)
const deleteServiceDialog = ref(false)

// Диалоги клиентов
const editUserDialog = ref(false)
const deleteUserDialog = ref(false)

const defaultItem = ref<Customers>({
  id: -1,
  name: '',
  street: '',
  zip: '',
  city: '',
  comment: '',
  createdAt: '',
  updatedAt: '',
  isActive: true,
  services: [],
})

const editedItem = ref<Customers>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Выбранные сервисы для редактирования
const selectedServiceIds = ref<number[]>([])

// Данные для редактирования сервиса
const defaultServiceItem = ref<Services>({
  id: -1,
  name: '',
  comment: '',
  type: '',
  createdAt: '',
  updatedAt: '',
  isActive: true,
})

const editedServiceItem = ref<Services>({ ...defaultServiceItem.value })
const editedServiceIndex = ref(-1)

// Опции типа сервиса
const typeOptions = [
  'Обучение',
  'Демонстрация',
  'Другое',
  'Интерфейсная часть',
  'Конечный сервис пользователя',
  'Контракт поддержки',
  'Планирование',
  'Сервисная часть',
  'Составление отчетов',
  'Управление ИТ',
  'Эксплуатация',
  'Ит'
]

// Выбранные сотрудники для редактирования
const selectedCustomerUserIds = ref<number[]>([])

// Данные для редактирования клиента
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
  createdAt: '',
  updatedAt: '',
  isActive: true,
})

const editedUserItem = ref<CustomerUsers>({ ...defaultUserItem.value })
const editedUserIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// ========== МЕТОДЫ ГРУПП КЛИЕНТОВ ==========
const editCustomersGroupsItem = (item: CustomersGroups) => {
  editedCustomersGroupsIndex.value = customersGroups.value.indexOf(item)
  editedCustomersGroupsItem.value = { ...item }
  editCustomersGroupsDialog.value = true
}

const deleteCustomersGroupsItem = (item: CustomersGroups) => {
  editedCustomersGroupsIndex.value = customersGroups.value.indexOf(item)
  editedCustomersGroupsItem.value = { ...item }
  deleteCustomersGroupsDialog.value = true
}

const closeCustomersGroups = () => {
  editCustomersGroupsDialog.value = false
  editedCustomersGroupsIndex.value = -1
  editedCustomersGroupsItem.value = { ...defaultCustomersGroupsItem.value }
}

const closeCustomersGroupsDelete = () => {
  deleteCustomersGroupsDialog.value = false
  editedCustomersGroupsIndex.value = -1
  editedCustomersGroupsItem.value = { ...defaultCustomersGroupsItem.value }
}

const saveCustomersGroups = async () => {
  if (!editedCustomersGroupsItem.value.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  try {
    if (editedCustomersGroupsIndex.value > -1) {
      await updateCustomersGroups(editedCustomersGroupsItem.value.id, {
        name: editedCustomersGroupsItem.value.name,
        message: editedCustomersGroupsItem.value.message,
        customerId: editedCustomersGroupsItem.value.customerId,
        isActive: editedCustomersGroupsItem.value.isActive
      })
      showToast('Группа клиентов успешно сохранена')
    } else {
      await createCustomersGroups({
        name: editedCustomersGroupsItem.value.name,
        message: editedCustomersGroupsItem.value.message,
        customerId: editedCustomersGroupsItem.value.customerId,
        isActive: editedCustomersGroupsItem.value.isActive
      })
      showToast('Группа клиентов успешно добавлена')
    }
    closeCustomersGroups()
  } catch (err) {
    showToast('Ошибка сохранения группы клиентов', 'error')
  }
}

const deleteCustomersGroupsConfirm = async () => {
  try {
    await deleteCustomersGroups(editedCustomersGroupsItem.value.id)
    showToast('Группа клиентов успешно удалена')
    closeCustomersGroupsDelete()
  } catch (err) {
    showToast('Ошибка удаления группы клиентов', 'error')
  }
}

// Переключение статуса группы клиентов
const toggleCustomersGroupsStatus = async (item: CustomersGroups, newValue: boolean) => {
  try {
    await updateCustomersGroups(item.id, {
      name: item.name,
      message: item.message,
      customerId: item.customerId,
      isActive: newValue
    })
    showToast('Статус группы клиентов изменен')
  } catch (err) {
    showToast('Ошибка изменения статуса', 'error')
  }
}

// Добавление новой группы клиентов
const addNewCustomersGroups = () => {
  editedCustomersGroupsItem.value = { ...defaultCustomersGroupsItem.value }
  editedCustomersGroupsIndex.value = -1
  editCustomersGroupsDialog.value = true
}

// ========== МЕТОДЫ КОМПАНИЙ ==========
const editItem = (item: Customers) => {
  editedIndex.value = customers.value.indexOf(item)
  editedItem.value = { ...item }
  // Устанавливаем выбранные сервисы
  selectedServiceIds.value = item.services?.map(s => s.id) || []
  editDialog.value = true
}

const deleteItem = (item: Customers) => {
  editedIndex.value = customers.value.indexOf(item)
  editedItem.value = { ...item }
  deleteDialog.value = true
}

const close = () => {
  editDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
  selectedServiceIds.value = []
}

const closeDelete = () => {
  deleteDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
}

const save = async () => {
  if (!editedItem.value.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  try {
    if (editedIndex.value > -1) {
      // Обновление существующего
      await updateCustomers(editedItem.value.id, {
        ...editedItem.value,
        isActive: editedItem.value.isActive,
        serviceIds: selectedServiceIds.value
      })
      showToast('Компания успешно сохранена')
    } else {
      // Добавление нового
      await createCustomers({
        ...editedItem.value,
        isActive: editedItem.value.isActive,
        serviceIds: selectedServiceIds.value
      })
      showToast('Компания успешно добавлена')
    }
    close()
  } catch (err) {
    showToast('Ошибка сохранения компании', 'error')
  }
}

const deleteItemConfirm = async () => {
  try {
    await deleteCustomers(editedItem.value.id)
    showToast('Компания успешно удалена')
    closeDelete()
  } catch (err) {
    showToast('Ошибка удаления компании', 'error')
  }
}

// Переключение статуса компании
const toggleStatus = async (item: Customers, newValue: boolean) => {
  try {
    await updateCustomers(item.id, {
      ...item,
      isActive: newValue
    })
    showToast('Статус компании изменен')
  } catch (err) {
    showToast('Ошибка изменения статуса', 'error')
  }
}

// ========== МЕТОДЫ СЕРВИСОВ ==========
const editServiceItem = (item: Services) => {
  editedServiceIndex.value = services.value.indexOf(item)
  editedServiceItem.value = { ...item }
  editServiceDialog.value = true
}

const deleteServiceItem = (item: Services) => {
  editedServiceIndex.value = services.value.indexOf(item)
  editedServiceItem.value = { ...item }
  deleteServiceDialog.value = true
}

const closeService = () => {
  editServiceDialog.value = false
  editedServiceIndex.value = -1
  editedServiceItem.value = { ...defaultServiceItem.value }
}

const closeServiceDelete = () => {
  deleteServiceDialog.value = false
  editedServiceIndex.value = -1
  editedServiceItem.value = { ...defaultServiceItem.value }
}

const saveService = async () => {
  if (!editedServiceItem.value.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  try {
    // Подготовка данных для отправки (исключаем лишние поля)
    const serviceData = {
      name: editedServiceItem.value.name,
      comment: editedServiceItem.value.comment || '',
      type: editedServiceItem.value.type || '',
      isActive: editedServiceItem.value.isActive
    }

    if (editedServiceIndex.value > -1) {
      // Обновление существующего
      await updateServices(editedServiceItem.value.id, serviceData)
      showToast('Сервис успешно сохранен')
    } else {
      // Добавление нового
      await createServices(serviceData)
      // Перезагружаем данные что бы получить актуальный список с сервера
      await fetchServices()
      showToast('Сервис успешно добавлен')
    }
    closeService()
  } catch (err) {
    showToast('Ошибка сохранения сервиса', 'error')
  }
}

const deleteServiceItemConfirm = async () => {
  try {
    await deleteServices(editedServiceItem.value.id)
    showToast('Сервис успешно удален')
    closeServiceDelete()
  } catch (err) {
    showToast('Ошибка удаления сервиса', 'error')
  }
}

// Переключение статуса сервиса
const toggleServiceStatus = async (item: Services, newValue: boolean) => {
  try {
    await updateServices(item.id, {
      ...item,
      isActive: newValue
    })
    showToast('Статус сервиса изменен')
  } catch (err) {
    showToast('Ошибка изменения статуса', 'error')
  }
}

// ========== МЕТОДЫ КЛИЕНТОВ ==========
const editUserItem = (item: CustomerUsers) => {
  editedUserIndex.value = customerUsers.value.indexOf(item)
  editedUserItem.value = { ...item }
  editUserDialog.value = true
}

const deleteUserItem = (item: CustomerUsers) => {
  editedUserIndex.value = customerUsers.value.indexOf(item)
  editedUserItem.value = { ...item }
  deleteUserDialog.value = true
}

const closeUser = () => {
  editUserDialog.value = false
  editedUserIndex.value = -1
  editedUserItem.value = { ...defaultUserItem.value }
}

const closeUserDelete = () => {
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
      // Обновление существующего
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
      showToast('Клиент успешно сохранен')
    } else {
      // Добавление нового
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
      showToast('Клиент успешно добавлен')
    }
    closeUser()
  } catch (err) {
    showToast('Ошибка сохранения клиента', 'error')
  }
}

const deleteUserItemConfirm = async () => {
  try {
    await deleteCustomerUsers(editedUserItem.value.id)
    showToast('Клиент успешно удален')
    closeUserDelete()
  } catch (err) {
    showToast('Ошибка удаления клиента', 'error')
  }
}

// Переключение статуса клиента
const toggleUserStatus = async (item: CustomerUsers, newValue: boolean) => {
  try {
    await updateCustomerUsers(item.id, {
      firstName: item.firstName,
      lastName: item.lastName,
      login: item.login,
      email: item.email,
      mobilePhone: item.mobilePhone,
      telegramAccount: item.telegramAccount,
      isActive: newValue
    })
    showToast('Статус клиента изменен')
  } catch (err) {
    showToast('Ошибка изменения статуса', 'error')
  }
}

// Уведомления
const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

// Добавление нового клиент
const addNewCustomers = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}

// Добавление нового сервиса
const addNewService = () => {
  editedServiceItem.value = { ...defaultServiceItem.value }
  editedServiceIndex.value = -1
  editServiceDialog.value = true
}

// Добавление нового клиента
const addNewUser = () => {
  editedUserItem.value = { ...defaultUserItem.value }
  editedUserIndex.value = -1
  editUserDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="Компании">

      <!-- Индикатор загрузки -->
      <div v-if="loading" class="d-flex justify-center pa-6">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <!-- Сообщение об ошибке -->
      <div v-else-if="error" class="d-flex justify-center pa-6">
        <VAlert type="error" class="ma-4">
          {{ error }}
        </VAlert>
      </div>

      <div v-else class="d-flex flex-wrap gap-4 pa-6">
        <div class="d-flex align-center">
          <!-- Поиск -->
          <AppTextField
            v-model="searchQuery"
            placeholder="Поиск компании"
            style="inline-size: 250px;"
            class="me-3"
            clearable
            clear-icon="bx-x"
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
            color="primary"
            prepend-icon="bx-plus"
            @click="addNewCustomers"
          >
            Добавить компанию
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
            Вы уверены, что хотите удалить выбранные компании? Это действие нельзя отменить.
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
        :items="filteredCustomers"
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
              @update:model-value="(val) => toggleStatus(item, val ?? false)"
              color="primary"
              hide-details
            />
            <VChip
              v-bind="resolveStatusVariant(item.isActive)"
              density="compact"
              label
              size="small"
            />
          </div>
        </template>

        <!-- Сервисы -->
        <template #item.services="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <VChip
              v-for="service in item.services"
              :key="service.id"
              size="small"
              color="primary"
              variant="outlined"
            >
              {{ service.name }}
            </VChip>
            <span v-if="!item.services || item.services.length === 0" class="text-disabled">
              Нет сервисов
            </span>
          </div>
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn @click="editItem(item)">
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn @click="deleteItem(item)">
              <VIcon icon="bx-trash" />
            </IconBtn>
          </div>
        </template>
      </VDataTable>

      <!-- Пагинация -->
      <div class="d-flex justify-center mt-4 pb-4">
        <VPagination
          v-model="currentPage"
          :length="Math.ceil(filteredCustomers.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать компанию' : 'Добавить компанию'">
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

            <!-- Улица -->
            <VCol
              cols="12"
              
            >
              <AppTextField
                v-model="editedItem.street"
                label="Улица"
              />
            </VCol>

            <!-- Индекс -->
            <VCol
              cols="12"
              
            >
              <AppTextField
                v-model="editedItem.zip"
                label="Индекс"
              />
            </VCol>

            <!-- Город -->
            <VCol
              cols="12"
              
            >
              <AppTextField
                v-model="editedItem.city"
                label="Город"
              />
            </VCol>

            <!-- Комментарий -->
            <VCol
              cols="12"
              
            >
              <AppTextarea
                v-model="editedItem.comment"
                label="Комментарий"
                rows="3"
                placeholder="Введите комментарий..."
              />
            </VCol>

            <!-- Сервисы -->
            <VCol
              cols="12"
            >
              <AppSelect
                v-model="selectedServiceIds"
                :items="services"
                item-title="name"
                item-value="id"
                label="Сервисы"
                placeholder="Выберите сервисы"
                multiple
                chips
                clearable
                hint="Выберите сервисы для компании"
                persistent-hint
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
      v-model="deleteDialog"
      max-width="500px"
    >
      <VCard title="Вы уверены, что хотите удалить эту компанию?">
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

  <!-- ========== ТАБЛИЦА ГРУПП КЛИЕНТОВ ========== -->
  <div>
    <VCard title="Группы клиентов">

      <!-- Индикатор загрузки -->
      <div v-if="customersGroupsLoading" class="d-flex justify-center pa-6">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <!-- Сообщение об ошибке -->
      <div v-else-if="customersGroupsError" class="d-flex justify-center pa-6">
        <VAlert type="error" class="ma-4">
          {{ customersGroupsError }}
        </VAlert>
      </div>

      <div v-else class="d-flex flex-wrap gap-4 pa-6">
        <div class="d-flex align-center">
          <!-- Поиск -->
          <AppTextField
            v-model="customersGroupsSearchQuery"
            placeholder="Поиск групп клиентов"
            style="inline-size: 250px;"
            class="me-3"
            clearable
            clear-icon="bx-x"
          />
        </div>

        <!-- Кнопка фильтра -->
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="bx-filter"
          @click="isCustomersGroupsFilterDialogOpen = true"
        >
          Фильтр
        </VBtn>

        <!-- Кнопка массовых действий -->
        <VMenu
          v-model="isBulkCustomersGroupsActionsMenuOpen"
          :close-on-content-click="false"
        >
          <template #activator="{ props }">
            <VBtn
              variant="tonal"
              color="secondary"
              prepend-icon="bx-dots-vertical-rounded"
              :disabled="selectedCustomersGroups.length === 0"
              v-bind="props"
            >
              Действия ({{ selectedCustomersGroups.length }})
            </VBtn>
          </template>
          <VList>
            <VListItem
              @click="() => {
                bulkDeleteCustomersGroups()
                isBulkCustomersGroupsActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Удалить</VListItemTitle>
            </VListItem>
            <VListItem
              @click="() => {
                bulkChangeStatusCustomersGroups()
                isBulkCustomersGroupsActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Изменить статус</VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>

        <VSpacer />
        <div class="d-flex gap-4 flex-wrap align-center">
          <AppSelect
            v-model="customersGroupsItemsPerPage"
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
            color="primary"
            prepend-icon="bx-plus"
            @click="addNewCustomersGroups"
          >
            Добавить группу
          </VBtn>
        </div>
      </div>

      <!-- Диалог фильтров групп клиентов -->
      <VDialog
        v-model="isCustomersGroupsFilterDialogOpen"
        max-width="500px"
      >
        <VCard title="Фильтры">
          <VCardText>
            <VRow>
              <VCol cols="12">
                <AppSelect
                  v-model="customersGroupsStatusFilter"
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
                @click="clearCustomersGroupsFilters"
              >
                Сбросить
              </VBtn>
              <VBtn
                color="error"
                variant="outlined"
                @click="isCustomersGroupsFilterDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="isCustomersGroupsFilterDialogOpen = false"
              >
                Применить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог массового удаления групп клиентов -->
      <VDialog
        v-model="isBulkDeleteCustomersGroupsDialogOpen"
        max-width="500px"
      >
        <VCard title="Подтверждение удаления">
          <VCardText>
            Вы уверены, что хотите удалить выбранные группы клиентов? Это действие нельзя отменить.
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                color="error"
                variant="outlined"
                @click="isBulkDeleteCustomersGroupsDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="confirmBulkDeleteCustomersGroups"
              >
                Удалить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог массового изменения статуса групп клиентов -->
      <VDialog
        v-model="isBulkStatusCustomersGroupsDialogOpen"
        max-width="500px"
      >
        <VCard title="Изменить статус">
          <VCardText>
            <AppSelect
              v-model="bulkStatusCustomersGroupsValue"
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
                @click="isBulkStatusCustomersGroupsDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="confirmBulkStatusChangeCustomersGroups"
              >
                Применить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <VDivider />

      <!-- Таблица групп клиентов -->
      <VDataTable
        v-model="selectedCustomersGroups"
        v-model:items-per-page="customersGroupsItemsPerPage"
        v-model:page="customersGroupsCurrentPage"
        :headers="customersGroupsHeaders"
        :items="filteredCustomersGroups"
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
              @update:model-value="(val: boolean | null) => toggleCustomersGroupsStatus(item, val ?? false)"
              color="primary"
              hide-details
            />
            <VChip
              v-bind="resolveStatusVariant(item.isActive)"
              density="compact"
              label
              size="small"
            />
          </div>
        </template>

        <!-- Компания -->
        <template #item.customer="{ item }">
          <VChip
            size="small"
            color="primary"
            variant="tonal"
          >
            {{ getCustomerName(item.customerId) }}
          </VChip>
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn @click="editCustomersGroupsItem(item)">
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn @click="deleteCustomersGroupsItem(item)">
              <VIcon icon="bx-trash" />
            </IconBtn>
          </div>
        </template>
      </VDataTable>

      <!-- Пагинация -->
      <div class="d-flex justify-center mt-4 pb-4">
        <VPagination
          v-model="customersGroupsCurrentPage"
          :length="Math.ceil(filteredCustomersGroups.length / customersGroupsItemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования группы клиентов -->
    <VDialog
      v-model="editCustomersGroupsDialog"
      max-width="600px"
    >
      <VCard :title="editedCustomersGroupsIndex > -1 ? 'Редактировать группу клиентов' : 'Добавить группу клиентов'">
        <VCardText>
          <VRow>
            <!-- Название -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedCustomersGroupsItem.name"
                label="Название *"
              />
            </VCol>

            <!-- Сообщение -->
            <VCol cols="12">
              <AppTextarea
                v-model="editedCustomersGroupsItem.message"
                label="Сообщение"
                rows="3"
                placeholder="Введите сообщение..."
              />
            </VCol>

            <!-- Компания -->
            <VCol cols="12" sm="6">
              <AppSelect
                v-model="editedCustomersGroupsItem.customerId"
                :items="customers"
                item-title="name"
                item-value="id"
                label="Компания"
                placeholder="Выберите компанию"
                clearable
              />
            </VCol>

            <!-- Активен -->
            <VCol cols="12" sm="6">
              <VSwitch
                v-model="editedCustomersGroupsItem.isActive"
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
              @click="closeCustomersGroups"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="saveCustomersGroups"
            >
              Сохранить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог удаления группы клиентов -->
    <VDialog
      v-model="deleteCustomersGroupsDialog"
      max-width="500px"
    >
      <VCard title="Вы уверены, что хотите удалить эту группу клиентов?">
        <VCardText>
          <div class="d-flex justify-center gap-4">
            <VBtn
              color="error"
              variant="outlined"
              @click="closeCustomersGroupsDelete"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="deleteCustomersGroupsConfirm"
            >
              Удалить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </div>

  <!-- ========== ТАБЛИЦА КЛИЕНТОВ КОМПАНИИ ========== -->
  <div>
    <VCard title="Клиенты Компании">

      <!-- Индикатор загрузки -->
      <div v-if="usersLoading" class="d-flex justify-center pa-6">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <!-- Сообщение об ошибке -->
      <div v-else-if="usersError" class="d-flex justify-center pa-6">
        <VAlert type="error" class="ma-4">
          {{ usersError }}
        </VAlert>
      </div>

      <div v-else class="d-flex flex-wrap gap-4 pa-6">
        <div class="d-flex align-center">
          <!-- Поиск -->
          <AppTextField
            placeholder="Поиск клиентов"
            style="inline-size: 250px;"
            class="me-3"
          />
        </div>

        <!-- Кнопка фильтра -->
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="bx-filter"
          @click="isUsersFilterDialogOpen = true"
        >
          Фильтр
        </VBtn>

        <!-- Кнопка массовых действий -->
        <VMenu
          v-model="isBulkUsersActionsMenuOpen"
          :close-on-content-click="false"
        >
          <template #activator="{ props }">
            <VBtn
              variant="tonal"
              color="secondary"
              prepend-icon="bx-dots-vertical-rounded"
              :disabled="selectedUsers.length === 0"
              v-bind="props"
            >
              Действия ({{ selectedUsers.length }})
            </VBtn>
          </template>
          <VList>
            <VListItem
              @click="() => {
                bulkDeleteUsers()
                isBulkUsersActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Удалить</VListItemTitle>
            </VListItem>
            <VListItem
              @click="() => {
                bulkChangeStatusUsers()
                isBulkUsersActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Изменить статус</VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>

        <VSpacer />
        <div class="d-flex gap-4 flex-wrap align-center">
          <AppSelect
            v-model="usersItemsPerPage"
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
            color="primary"
            prepend-icon="bx-plus"
            @click="addNewUser"
          >
            Добавить клиента
          </VBtn>
        </div>
      </div>

      <!-- Диалог фильтров клиентов -->
      <VDialog
        v-model="isUsersFilterDialogOpen"
        max-width="500px"
      >
        <VCard title="Фильтры">
          <VCardText>
            <VRow>
              <VCol cols="12">
                <AppSelect
                  v-model="usersStatusFilter"
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
                @click="clearUsersFilters"
              >
                Сбросить
              </VBtn>
              <VBtn
                color="error"
                variant="outlined"
                @click="isUsersFilterDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="isUsersFilterDialogOpen = false"
              >
                Применить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог массового удаления клиентов -->
      <VDialog
        v-model="isBulkDeleteUsersDialogOpen"
        max-width="500px"
      >
        <VCard title="Подтверждение удаления">
          <VCardText>
            Вы уверены, что хотите удалить выбранных клиентов? Это действие нельзя отменить.
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                color="error"
                variant="outlined"
                @click="isBulkDeleteUsersDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="confirmBulkDeleteUsers"
              >
                Удалить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог массового изменения статуса клиентов -->
      <VDialog
        v-model="isBulkStatusUsersDialogOpen"
        max-width="500px"
      >
        <VCard title="Изменить статус">
          <VCardText>
            <AppSelect
              v-model="bulkStatusUsersValue"
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
                @click="isBulkStatusUsersDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="confirmBulkStatusChangeUsers"
              >
                Применить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <VDivider />

      <!-- Таблица клиентов -->
      <VDataTable
        v-model="selectedUsers"
        v-model:items-per-page="usersItemsPerPage"
        v-model:page="usersCurrentPage"
        :headers="usersHeaders"
        :items="filteredCustomerUsers"
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
              @update:model-value="(val) => toggleUserStatus(item, val ?? false)"
              color="primary"
              hide-details
            />
            <VChip
              v-bind="resolveStatusVariant(item.isActive)"
              density="compact"
              label
              size="small"
            />
          </div>
        </template>

        <!-- Компания -->
        <template #item.customer="{ item }">
          <VChip
            size="small"
            color="primary"
            variant="tonal"
          >
            {{ getCustomerName(item.customerId) }}
          </VChip>
        </template>

        <!-- Группа -->
        <template #item.customersGroup="{ item }">
          <VChip
            size="small"
            color="secondary"
            variant="tonal"
          >
            {{ getCustomersGroupName(item.customersGroupId) }}
          </VChip>
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn @click="editUserItem(item)">
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn @click="deleteUserItem(item)">
              <VIcon icon="bx-trash" />
            </IconBtn>
          </div>
        </template>
      </VDataTable>

      <!-- Пагинация -->
      <div class="d-flex justify-center mt-4 pb-4">
        <VPagination
          v-model="usersCurrentPage"
          :length="Math.ceil(filteredCustomerUsers.length / usersItemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования клиента -->
    <VDialog
      v-model="editUserDialog"
      max-width="600px"
    >
      <VCard :title="editedUserIndex > -1 ? 'Редактировать клиента' : 'Добавить клиента'">
        <VCardText>
          <VRow>

            <!-- Имя -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedUserItem.firstName"
                label="Имя *"
              />
            </VCol>

            <!-- Фамилия -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedUserItem.lastName"
                label="Фамилия *"
              />
            </VCol>

            <!-- Логин -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedUserItem.login"
                label="Логин"
              />
            </VCol>

            <!-- Email -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedUserItem.email"
                label="Email"
              />
            </VCol>

            <!-- Мобильный телефон -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedUserItem.mobilePhone"
                label="Мобильный телефон"
              />
            </VCol>

            <!-- Телеграмм акк -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedUserItem.telegramAccount"
                label="Телеграмм акк"
              />
            </VCol>

            <!-- Компания -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedUserItem.customerId"
                :items="customers"
                item-title="name"
                item-value="id"
                label="Компания"
                placeholder="Выберите компанию"
                clearable
              />
            </VCol>

            <!-- Группа клиентов -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedUserItem.customersGroupId"
                :items="customersGroups"
                item-title="name"
                item-value="id"
                label="Группа клиентов"
                placeholder="Выберите группу"
                clearable
              />
            </VCol>

            <!-- Активен -->
            <VCol
              cols="12"
              sm="6"
            >
              <VSwitch
                v-model="editedUserItem.isActive"
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
              @click="closeUser"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="saveUser"
            >
              Сохранить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог удаления клиента -->
    <VDialog
      v-model="deleteUserDialog"
      max-width="500px"
    >
      <VCard title="Вы уверены, что хотите удалить этого клиента?">
        <VCardText>
          <div class="d-flex justify-center gap-4">
            <VBtn
              color="error"
              variant="outlined"
              @click="closeUserDelete"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="deleteUserItemConfirm"
            >
              Удалить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </div>

  <!-- Уведомления -->
  <VSnackbar
    v-model="isToastVisible"
    :color="toastColor"
    timeout="3000"
  >
    {{ toastMessage }}
  </VSnackbar>
</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}
</style>
