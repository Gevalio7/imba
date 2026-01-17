<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// Типы данных для менеджера пакетов
interface Package {
  id: number
  name: string
  description: string
  version: string
  author: string
  isInstalled: boolean
  isUpgradable: boolean
  createdAt: string
  updatedAt: string
  status: number // 1 - активен, 2 - не активен
}

// Данные пакетов (демо данные)
const packages = ref<Package[]>([
  {
    id: 1,
    name: 'Ticket Management',
    description: 'Расширенное управление тикетами',
    version: '2.1.0',
    author: 'OTRS Team',
    isInstalled: true,
    isUpgradable: true,
    createdAt: '2023-01-01 10:00:00',
    updatedAt: '2023-01-01 10:00:00',
    status: 1,
  },
  {
    id: 2,
    name: 'Email Integration',
    description: 'Интеграция с почтовыми серверами',
    version: '1.5.3',
    author: 'Email Team',
    isInstalled: true,
    isUpgradable: false,
    createdAt: '2023-01-02 11:00:00',
    updatedAt: '2023-01-02 11:00:00',
    status: 1,
  },
  {
    id: 3,
    name: 'Reporting Module',
    description: 'Модуль отчетности и аналитики',
    version: '3.0.1',
    author: 'Analytics Team',
    isInstalled: true,
    isUpgradable: true,
    createdAt: '2023-01-03 12:00:00',
    updatedAt: '2023-01-03 12:00:00',
    status: 1,
  },
  {
    id: 4,
    name: 'SMS Notifications',
    description: 'SMS уведомления для клиентов',
    version: '1.2.0',
    author: 'SMS Team',
    isInstalled: false,
    isUpgradable: false,
    createdAt: '2023-01-04 13:00:00',
    updatedAt: '2023-01-04 13:00:00',
    status: 1,
  },
  {
    id: 5,
    name: 'Old Package',
    description: 'Старый пакет, больше не поддерживается',
    version: '0.5.0',
    author: 'Legacy Team',
    isInstalled: true,
    isUpgradable: false,
    createdAt: '2023-01-05 14:00:00',
    updatedAt: '2023-01-05 14:00:00',
    status: 2,
  },
  {
    id: 6,
    name: 'Test Package',
    description: 'Тестовый пакет для проверки системы',
    version: '1.0.0',
    author: 'Test Team',
    isInstalled: false,
    isUpgradable: false,
    createdAt: '2023-01-06 15:00:00',
    updatedAt: '2023-01-06 15:00:00',
    status: 1,
  },
])

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Описание', key: 'description', sortable: false },
  { title: 'Версия', key: 'version', sortable: true },
  { title: 'Автор', key: 'author', sortable: true },
  { title: 'Установлен', key: 'isInstalled', sortable: false },
  { title: 'Обновляемый', key: 'isUpgradable', sortable: false },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Статус', key: 'status', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Фильтрация
const filteredPackages = computed(() => {
  let filtered = packages.value

  if (statusFilter.value !== null) {
    filtered = filtered.filter(t => t.status === statusFilter.value)
  }

  if (isInstalledFilter.value !== null) {
    filtered = filtered.filter(t => t.isInstalled === isInstalledFilter.value)
  }

  return filtered
})

// Сброс фильтров
const clearFilters = () => {
  statusFilter.value = null
  isInstalledFilter.value = null
}

// Массовые действия
const bulkInstall = () => {
  console.log('📥 Массовая установка - вызвана')
  console.log('📋 Выбранные элементы:', selectedItems.value)
  console.log('📊 Количество выбранных элементов:', selectedItems.value.length)
  isBulkInstallDialogOpen.value = true
}

const bulkUninstall = () => {
  console.log('📤 Массовое удаление - вызвано')
  console.log('📋 Выбранные элементы:', selectedItems.value)
  console.log('📊 Количество выбранных элементов:', selectedItems.value.length)
  isBulkUninstallDialogOpen.value = true
}

const bulkUpdate = () => {
  console.log('🔄 Массовое обновление - вызвано')
  console.log('📋 Выбранные элементы:', selectedItems.value)
  console.log('📊 Количество выбранных элементов:', selectedItems.value.length)
  isBulkUpdateDialogOpen.value = true
}

const confirmBulkInstall = () => {
  const count = selectedItems.value.length
  selectedItems.value.forEach(item => {
    const index = packages.value.findIndex(t => t.id === item.id)
    if (index !== -1) {
      packages.value[index].isInstalled = true
      packages.value[index].version = '1.0.0' // Устанавливаем базовую версию
    }
  })
  selectedItems.value = []
  showToast(`Установлено ${count} пакетов`)
  isBulkInstallDialogOpen.value = false
}

const confirmBulkUninstall = () => {
  const count = selectedItems.value.length
  selectedItems.value.forEach(item => {
    const index = packages.value.findIndex(t => t.id === item.id)
    if (index !== -1) {
      packages.value[index].isInstalled = false
    }
  })
  selectedItems.value = []
  showToast(`Удалено ${count} пакетов`)
  isBulkUninstallDialogOpen.value = false
}

const confirmBulkUpdate = () => {
  const count = selectedItems.value.length
  selectedItems.value.forEach(item => {
    const index = packages.value.findIndex(t => t.id === item.id)
    if (index !== -1 && packages.value[index].isUpgradable) {
      const currentVersion = packages.value[index].version
      const versionParts = currentVersion.split('.').map(Number)
      versionParts[2] += 1 // Увеличиваем патч-версию
      packages.value[index].version = versionParts.join('.')
      packages.value[index].isUpgradable = false
    }
  })
  selectedItems.value = []
  showToast(`Обновлено ${count} пакетов`)
  isBulkUpdateDialogOpen.value = false
}

const resolveStatusVariant = (status: number) => {
  if (status === 1)
    return { color: 'primary', text: 'Активен' }
  else
    return { color: 'error', text: 'Не активен' }
}

// Пагинация
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Фильтры
const statusFilter = ref<number | null>(null)
const isInstalledFilter = ref<boolean | null>(null)
const isFilterDialogOpen = ref(false)

// Массовые действия
const selectedItems = ref<any[]>([])
const isBulkActionsMenuOpen = ref(false)
const isBulkInstallDialogOpen = ref(false)
const isBulkUninstallDialogOpen = ref(false)
const isBulkUpdateDialogOpen = ref(false)

// Отслеживание изменений выбранных элементов
watch(selectedItems, (newValue) => {
  console.log('✅ Изменение выбранных элементов')
  console.log('📋 Новое значение selectedItems:', newValue)
  console.log('📊 Количество выбранных:', newValue.length)
  console.log('🔍 Детали выбранных элементов:', JSON.stringify(newValue, null, 2))
}, { deep: true })

// Диалоги
const editDialog = ref(false)
const deleteDialog = ref(false)

const defaultItem = ref<Package>({
  id: -1,
  name: '',
  description: '',
  version: '1.0.0',
  author: '',
  isInstalled: false,
  isUpgradable: false,
  createdAt: '',
  updatedAt: '',
  status: 1,
})

const editedItem = ref<Package>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Методы
const editItem = (item: Package) => {
  editedIndex.value = packages.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: Package) => {
  editedIndex.value = packages.value.indexOf(item)
  editedItem.value = { ...item }
  deleteDialog.value = true
}

const close = () => {
  editDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
}

const closeDelete = () => {
  deleteDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
}

const save = () => {
  if (!editedItem.value.name.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  if (!editedItem.value.description.trim()) {
    showToast('Описание обязательно для заполнения', 'error')
    return
  }

  if (!editedItem.value.author.trim()) {
    showToast('Автор обязателен для заполнения', 'error')
    return
  }

  if (editedIndex.value > -1) {
    editedItem.value.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    Object.assign(packages.value[editedIndex.value], editedItem.value)
    showToast('Пакет успешно сохранен')
  } else {
    // Добавление нового
    const newId = Math.max(...packages.value.map(t => t.id)) + 1
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    editedItem.value.id = newId
    editedItem.value.createdAt = now
    editedItem.value.updatedAt = now
    packages.value.push({ ...editedItem.value })
    showToast('Пакет успешно добавлен')
  }
  close()
}

const deleteItemConfirm = () => {
  packages.value.splice(editedIndex.value, 1)
  showToast('Пакет успешно удален')
  closeDelete()
}

// Установка пакета
const installPackage = (item: Package) => {
  const index = packages.value.findIndex(t => t.id === item.id)
  if (index !== -1) {
    packages.value[index].isInstalled = true
    packages.value[index].version = '1.0.0'
    showToast(`Пакет ${item.name} успешно установлен`)
  }
}

// Удаление пакета
const uninstallPackage = (item: Package) => {
  const index = packages.value.findIndex(t => t.id === item.id)
  if (index !== -1) {
    packages.value[index].isInstalled = false
    showToast(`Пакет ${item.name} успешно удален`)
  }
}

// Обновление пакета
const updatePackage = (item: Package) => {
  const index = packages.value.findIndex(t => t.id === item.id)
  if (index !== -1 && packages.value[index].isUpgradable) {
    const currentVersion = packages.value[index].version
    const versionParts = currentVersion.split('.').map(Number)
    versionParts[2] += 1 // Увеличиваем патч-версию
    packages.value[index].version = versionParts.join('.')
    packages.value[index].isUpgradable = false
    showToast(`Пакет ${item.name} успешно обновлен до версии ${packages.value[index].version}`)
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

// Добавление нового пакета
const addNewPackage = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="Менеджер пакетов">
      <VCardText>
        <p class="text-body-1">
          Управление дополнениями.
        </p>
        <p class="text-body-2 text-medium-emphasis">
          Manage add-ons.
        </p>
      </VCardText>

      <div class="d-flex flex-wrap gap-4 pa-6">
        <div class="d-flex align-center">
          <!-- Поиск -->
          <AppTextField
            placeholder="Поиск пакетов"
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
              @click="() => {
                console.log('🖱️ Клик по кнопке Действия')
                console.log('📊 Количество выбранных:', selectedItems.length)
                console.log('🔍 Выбранные элементы:', selectedItems)
                console.log('🚪 Состояние меню до клика:', isBulkActionsMenuOpen)
              }"
            >
              Действия ({{ selectedItems.length }})
            </VBtn>
          </template>
          <VList>
            <VListItem
              @click="() => {
                console.log('📥 Клик по пункту Установить')
                bulkInstall()
                isBulkActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Установить</VListItemTitle>
            </VListItem>
            <VListItem
              @click="() => {
                console.log('📤 Клик по пункту Удалить')
                bulkUninstall()
                isBulkActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Удалить</VListItemTitle>
            </VListItem>
            <VListItem
              @click="() => {
                console.log('🔄 Клик по пункту Обновить')
                bulkUpdate()
                isBulkActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Обновить</VListItemTitle>
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
            @click="addNewPackage"
          >
            Добавить пакет
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
              <VCol cols="12">
                <AppSelect
                  v-model="isInstalledFilter"
                  placeholder="Установлен"
                  :items="[
                    { title: 'Да', value: true },
                    { title: 'Нет', value: false },
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

      <!-- Диалог массовой установки -->
      <VDialog
        v-model="isBulkInstallDialogOpen"
        max-width="500px"
      >
        <VCard title="Массовая установка">
          <VCardText>
            Вы уверены, что хотите установить выбранные пакеты?
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                color="error"
                variant="outlined"
                @click="isBulkInstallDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="confirmBulkInstall"
              >
                Установить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог массового удаления -->
      <VDialog
        v-model="isBulkUninstallDialogOpen"
        max-width="500px"
      >
        <VCard title="Массовое удаление">
          <VCardText>
            Вы уверены, что хотите удалить выбранные пакеты? Это действие нельзя отменить.
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                color="error"
                variant="outlined"
                @click="isBulkUninstallDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="confirmBulkUninstall"
              >
                Удалить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог массового обновления -->
      <VDialog
        v-model="isBulkUpdateDialogOpen"
        max-width="500px"
      >
        <VCard title="Массовое обновление">
          <VCardText>
            Вы уверены, что хотите обновить выбранные пакеты?
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                color="error"
                variant="outlined"
                @click="isBulkUpdateDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="confirmBulkUpdate"
              >
                Обновить
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
        :items="filteredPackages"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        @update:model-value="(val) => {
          console.log('📊 VDataTable model-value изменен:', val)
          console.log('📊 Тип данных:', typeof val, Array.isArray(val))
          console.log('📊 Количество выбранных:', val ? val.length : 0)
        }"
      >
        <!-- Описание -->
        <template #item.description="{ item }">
          <div style=" overflow: hidden;max-inline-size: 250px; text-overflow: ellipsis; white-space: pre-line;">
            {{ item.description }}
          </div>
        </template>

        <!-- Автор -->
        <template #item.author="{ item }">
          <div style=" overflow: hidden;max-inline-size: 150px; text-overflow: ellipsis; white-space: pre-line;">
            {{ item.author }}
          </div>
        </template>

        <!-- Установлен -->
        <template #item.isInstalled="{ item }">
          <VChip
            :color="item.isInstalled ? 'success' : 'default'"
            size="small"
            label
          >
            {{ item.isInstalled ? 'Да' : 'Нет' }}
          </VChip>
        </template>

        <!-- Обновляемый -->
        <template #item.isUpgradable="{ item }">
          <VChip
            :color="item.isUpgradable ? 'warning' : 'default'"
            size="small"
            label
          >
            {{ item.isUpgradable ? 'Да' : 'Нет' }}
          </VChip>
        </template>

        <!-- Статус -->
        <template #item.status="{ item }">
          <VChip
            v-bind="resolveStatusVariant(item.status)"
            density="default"
            label
            size="small"
          />
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn
              v-if="!item.isInstalled"
              size="small"
              color="primary"
              @click="installPackage(item)"
            >
              Установить
            </VBtn>
            <VBtn
              v-if="item.isInstalled"
              size="small"
              color="error"
              @click="uninstallPackage(item)"
            >
              Удалить
            </VBtn>
            <VBtn
              v-if="item.isInstalled && item.isUpgradable"
              size="small"
              color="warning"
              @click="updatePackage(item)"
            >
              Обновить
            </VBtn>
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
          :length="Math.ceil(filteredPackages.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать пакет' : 'Добавить пакет'">
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

            <!-- Версия -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.version"
                label="Версия *"
              />
            </VCol>

            <!-- Автор -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.author"
                label="Автор *"
              />
            </VCol>

            <!-- Описание -->
            <VCol cols="12">
              <AppTextarea
                v-model="editedItem.description"
                label="Описание пакета *"
                rows="3"
                placeholder="Введите описание пакета..."
              />
            </VCol>

            <!-- Установлен -->
            <VCol
              cols="12"
              sm="6"
            >
              <VSwitch
                v-model="editedItem.isInstalled"
                label="Установлен"
              />
            </VCol>

            <!-- Обновляемый -->
            <VCol
              cols="12"
              sm="6"
            >
              <VSwitch
                v-model="editedItem.isUpgradable"
                label="Обновляемый"
              />
            </VCol>

            <!-- Статус -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.status"
                :items="statusOptions"
                item-title="text"
                item-value="value"
                label="Статус"
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
      <VCard title="Вы уверены, что хотите удалить этот пакет?">
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
