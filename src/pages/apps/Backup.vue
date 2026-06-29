<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { $api } from '@/utils/api'
import { useToast } from '@/composables/useToast'

// Типы данных для резервного копирования
interface Backup {
  id: string
  filename: string
  path: string
  size: number
  sizeFormatted: string
  createdAt: string
  type: 'database' | 'filesystem'
}

interface ScheduleSettings {
  database: {
    enabled: boolean
    schedule: string
    retentionDays: number
  }
  filesystem: {
    enabled: boolean
    schedule: string
    retentionDays: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// Store
const searchQuery = ref('')
const itemsPerPage = ref(10)
const currentPage = ref(1)

// Данные
const backups = ref<Backup[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)
const creatingBackup = ref(false)
const backupTypeCreating = ref<'database' | 'filesystem' | null>(null)

// Настройки расписания
const scheduleSettings = ref<ScheduleSettings>({
  database: {
    enabled: false,
    schedule: '0 2 * * *',
    retentionDays: 7,
  },
  filesystem: {
    enabled: false,
    schedule: '0 3 * * *',
    retentionDays: 7,
  },
})

const scheduleDialog = ref(false)
const savingSchedule = ref(false)

// Выбранные элементы для массовых действий
const selectedItems = ref<Backup[]>([])
const isBulkActionsMenuOpen = ref(false)
const isBulkDeleteDialogOpen = ref(false)

// Загрузка списка бэкапов с пагинацией
const fetchBackups = async () => {
  try {
    loading.value = true
    error.value = null

    const response = await $api<{ data: Backup[]; pagination: Pagination }>(
      `/backup`,
      {
        query: {
          page: currentPage.value,
          limit: itemsPerPage.value,
          type: filterType.value,
        },
      },
    )

    backups.value = response.data
    total.value = response.pagination.total
  }
  catch (err: any) {
    error.value = 'Ошибка загрузки списка бэкапов'
    console.error('Error fetching backups:', err)
  }
  finally {
    loading.value = false
  }
}

// Загрузка настроек расписания
const fetchScheduleSettings = async () => {
  try {
    const data = await $api<ScheduleSettings>(`/backup/settings`)

    scheduleSettings.value = data
  }
  catch (err) {
    console.error('Error fetching schedule settings:', err)
  }
}

// Создание бэкапа базы данных
const createDatabaseBackup = async () => {
  try {
    creatingBackup.value = true
    backupTypeCreating.value = 'database'

    const result = await $api<{ success: boolean; backup: Backup }>(`/backup/database`, {
      method: 'POST',
    })

    backups.value.unshift(result.backup)
    total.value++
    showToast('Бэкап базы данных успешно создан')
    await fetchBackups()
  }
  catch (err: any) {
    showToast(err.message || 'Ошибка при создании бэкапа базы данных', 'error')
  }
  finally {
    creatingBackup.value = false
    backupTypeCreating.value = null
  }
}

// Создание бэкапа файловой системы
const createFilesystemBackup = async () => {
  try {
    creatingBackup.value = true
    backupTypeCreating.value = 'filesystem'

    const result = await $api<{ success: boolean; backup: Backup }>(`/backup/filesystem`, {
      method: 'POST',
    })

    backups.value.unshift(result.backup)
    total.value++
    showToast('Бэкап файловой системы успешно создан')
    await fetchBackups()
  }
  catch (err: any) {
    showToast(err.message || 'Ошибка при создании бэкапа файловой системы', 'error')
  }
  finally {
    creatingBackup.value = false
    backupTypeCreating.value = null
  }
}

// Удаление бэкапа
const deleteBackup = async (backup: Backup) => {
  if (!confirm(`Вы уверены, что хотите удалить бэкап ${backup.filename}?`))
    return

  try {
    await $api(`/backup/${backup.id}`, {
      method: 'DELETE',
    })
    showToast('Бэкап успешно удален')
    await fetchBackups()
  }
  catch (err: any) {
    showToast(err.message || 'Ошибка при удалении бэкапа', 'error')
  }
}

// Массовое удаление
const bulkDelete = () => {
  isBulkDeleteDialogOpen.value = true
}

const confirmBulkDelete = async () => {
  try {
    const count = selectedItems.value.length
    for (const itemId of selectedItems.value) {
      await $api(`/backup/${itemId}`, {
        method: 'DELETE',
      })
    }
    selectedItems.value = []
    showToast(`Удалено ${count} бэкапов`)
    isBulkDeleteDialogOpen.value = false
    await fetchBackups()
  }
  catch (err: any) {
    showToast('Ошибка массового удаления', 'error')
  }
}

// Скачивание бэкапа
const downloadBackup = async (backup: Backup) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/backup/${backup.id}/download`)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = backup.filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }
  catch (err: any) {
    showToast(err.message || 'Ошибка при скачивании бэкапа', 'error')
  }
}

// Сохранение настроек расписания
const saveSchedule = async () => {
  try {
    savingSchedule.value = true
    await $api(`/backup/settings`, {
      method: 'POST',
      body: scheduleSettings.value,
    })
    showToast('Настройки расписания сохранены')
    scheduleDialog.value = false
  }
  catch (err: any) {
    showToast(err.message || 'Ошибка при сохранении настроек', 'error')
  }
  finally {
    savingSchedule.value = false
  }
}

// Форматирование даты
const formatDate = (dateString: string) => {
  const date = new Date(dateString)

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Получить тип бэкапа
const getBackupTypeLabel = (type: string) => {
  return type === 'database' ? 'База данных' : 'Файловая система'
}

// Получить цвет типа бэкапа
const getBackupTypeColor = (type: string) => {
  return type === 'database' ? 'primary' : 'secondary'
}

// Фильтрация бэкапов по типу
const filterType = ref<'all' | 'database' | 'filesystem'>('all')

// Следим за изменением фильтра и сбрасываем страницу
watch(filterType, () => {
  currentPage.value = 1
  fetchBackups()
})

// watch(itemsPerPage, () => {
//  currentPage.value = 1
//  fetchBackups()
// })

// Функция для получения понятного текста расписания
const getScheduleText = (cron: string) => {
  const option = scheduleOptions.find(o => o.value === cron)

  return option ? option.title : cron
}

// watch(currentPage, () => {
//  fetchBackups()
// })

watch(itemsPerPage, () => {
  currentPage.value = 1
  fetchBackups()
})

watch(currentPage, () => {
  fetchBackups()
})

// Варианты расписания
const scheduleOptions = [
  { title: 'Каждый день в 2:00', value: '0 2 * * *' },
  { title: 'Каждый день в 3:00', value: '0 3 * * *' },
  { title: 'Каждый день в полночь', value: '0 0 * * *' },
  { title: 'Каждый час', value: '0 * * * *' },
  { title: 'Каждые 6 часов', value: '0 */6 * * *' },
  { title: 'Каждые 12 часов', value: '0 */12 * * *' },
  { title: 'Раз в неделю (Воскресенье)', value: '0 4 * * 0' },
  { title: 'Раз в неделю (Понедельник)', value: '0 4 * * 1' },
  { title: 'Раз в месяц (1 числа)', value: '0 4 1 * *' },
]

// Заголовки таблицы
const headers = [
  { title: 'Тип', key: 'type', sortable: true },
  { title: 'Имя файла', key: 'filename', sortable: true },
  { title: 'Размер', key: 'size', sortable: true },
  { title: 'Дата создания', key: 'createdAt', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Фильтрация на клиенте
const filteredBackups = computed(() => {
  let filtered = backups.value

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()

    filtered = filtered.filter(b => b.filename.toLowerCase().includes(query))
  }

  return filtered
})

// Статистика
const stats = computed(() => ({
  total: total.value,
  database: backups.value.filter(b => b.type === 'database').length,
  filesystem: backups.value.filter(b => b.type === 'filesystem').length,
  totalSize: backups.value.reduce((sum, b) => sum + b.size, 0),
}))

const formatBytes = (bytes: number) => {
  if (bytes === 0)
    return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

// Toast уведомления
const { showToast } = useToast()

// Инициализация
onMounted(() => {
  fetchBackups()
  fetchScheduleSettings()
})
</script>

<template>
  <div>
    <VRow class="match-height">
      <!-- Статистика -->
      <VCol
        cols="12"
        md="3"
      >
        <VCard class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <div>
              <p class="text-body-2 mb-1">
                Всего бэкапов
              </p>
              <h3 class="text-h4 font-weight-bold">
                {{ stats.total }}
              </h3>
            </div>
            <VAvatar
              color="primary"
              variant="tonal"
              size="48"
            >
              <VIcon
                icon="bx-archive"
                size="24"
              />
            </VAvatar>
          </div>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="3"
      >
        <VCard class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <div>
              <p class="text-body-2 mb-1">
                Базы данных
              </p>
              <h3 class="text-h4 font-weight-bold">
                {{ stats.database }}
              </h3>
            </div>
            <VAvatar
              color="success"
              variant="tonal"
              size="48"
            >
              <VIcon
                icon="bx-data"
                size="24"
              />
            </VAvatar>
          </div>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="3"
      >
        <VCard class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <div>
              <p class="text-body-2 mb-1">
                Файловые системы
              </p>
              <h3 class="text-h4 font-weight-bold">
                {{ stats.filesystem }}
              </h3>
            </div>
            <VAvatar
              color="warning"
              variant="tonal"
              size="48"
            >
              <VIcon
                icon="bx-folder"
                size="24"
              />
            </VAvatar>
          </div>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="3"
      >
        <VCard class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <div>
              <p class="text-body-2 mb-1">
                Общий размер
              </p>
              <h3 class="text-h4 font-weight-bold">
                {{ formatBytes(stats.totalSize) }}
              </h3>
            </div>
            <VAvatar
              color="info"
              variant="tonal"
              size="48"
            >
              <VIcon
                icon="bx-hdd"
                size="24"
              />
            </VAvatar>
          </div>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mt-4">
      <!-- Панель управления бэкапами -->
      <VCol
        cols="12"
        lg="8"
      >
        <VCard title="Резервные копии">
          <!-- Кнопки управления -->
          <div class="d-flex flex-wrap gap-4 pa-6">
            <VBtn
              color="primary"
              prepend-icon="bx-database"
              :loading="creatingBackup && backupTypeCreating === 'database'"
              @click="createDatabaseBackup"
            >
              Создать бэкап БД
            </VBtn>
            <VBtn
              color="secondary"
              prepend-icon="bx-folder"
              :loading="creatingBackup && backupTypeCreating === 'filesystem'"
              @click="createFilesystemBackup"
            >
              Создать бэкап файлов
            </VBtn>
            <VBtn
              variant="tonal"
              color="warning"
              prepend-icon="bx-time"
              @click="scheduleDialog = true"
            >
              Расписание
            </VBtn>
          </div>

          <VDivider />

          <!-- Панель фильтров и поиска -->
          <div class="d-flex flex-wrap gap-4 pa-6 align-center">
            <!-- Поиск -->
            <AppTextField
              v-model="searchQuery"
              placeholder="Поиск по имени файла"
              style="inline-size: 250px;"
            />

            <!-- Фильтр по типу -->
            <AppSelect
              v-model="filterType"
              :items="[
                { title: 'Все', value: 'all' },
                { title: 'Базы данных', value: 'database' },
                { title: 'Файловые системы', value: 'filesystem' },
              ]"
              style="max-width: 200px;"
              hide-details
            />

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
                <VListItem @click="() => { bulkDelete(); isBulkActionsMenuOpen = false }">
                  <VListItemTitle>Удалить выбранные</VListItemTitle>
                </VListItem>
              </VList>
            </VMenu>

            <VSpacer />

            <!-- Количество на странице -->
            <AppSelect
              v-model="itemsPerPage"
              :items="[5, 10, 20, 25, 50]"
              style="max-width: 120px;"
            />
          </div>

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
            <VAlert type="error">
              {{ error }}
            </VAlert>
          </div>

          <!-- Таблица -->
          <VDataTable
            v-model="selectedItems"
            v-model:items-per-page="itemsPerPage"
            v-model:page="currentPage"
            :headers="headers"
            :items="filteredBackups"
            show-select
            item-value="id"
            :hide-default-footer="true"
            no-data-text="Нет резервных копий"
          >
            <!-- Тип -->
            <template #item.type="{ item }">
              <VChip
                :color="getBackupTypeColor(item.type)"
                size="small"
                label
              >
                {{ getBackupTypeLabel(item.type) }}
              </VChip>
            </template>

            <!-- Имя файла -->
            <template #item.filename="{ item }">
              <div class="d-flex align-center gap-2">
                <VIcon
                  :icon="item.type === 'database' ? 'bx-data' : 'bx-folder'"
                  size="20"
                  :color="getBackupTypeColor(item.type)"
                />
                <span class="font-weight-medium">{{ item.filename }}</span>
              </div>
            </template>

            <!-- Размер -->
            <template #item.size="{ item }">
              {{ item.sizeFormatted }}
            </template>

            <!-- Дата создания -->
            <template #item.createdAt="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>

            <!-- Действия -->
            <template #item.actions="{ item }">
              <div class="d-flex gap-1">
                <IconBtn @click="downloadBackup(item)">
                  <VIcon icon="bx-download" />
                  <VTooltip activator="parent">
                    Скачать
                  </VTooltip>
                </IconBtn>
                <IconBtn
                  color="error"
                  @click="deleteBackup(item)"
                >
                  <VIcon icon="bx-trash" />
                  <VTooltip activator="parent">
                    Удалить
                  </VTooltip>
                </IconBtn>
              </div>
            </template>
          </VDataTable>

          <!-- Пагинация -->
          <div class="d-flex justify-center mt-4 pb-4">
            <VPagination
              v-model="currentPage"
              :length="Math.ceil(total / itemsPerPage) || 1"
              :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
            />
          </div>
        </VCard>
      </VCol>

      <!-- Информация о расписании -->
      <VCol
        cols="12"
        lg="4"
      >
        <VCard
          title="Настройки расписания"
          class="mb-4"
        >
          <VCardText>
            <div class="d-flex flex-column gap-4">
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center gap-2">
                  <VIcon
                    icon="bx-data"
                    color="primary"
                  />
                  <span>База данных</span>
                </div>
                <VSwitch
                  v-model="scheduleSettings.database.enabled"
                  color="primary"
                  hide-details
                  @update:model-value="scheduleDialog = true"
                />
              </div>

              <div
                v-if="scheduleSettings.database.enabled"
                class="ps-6"
              >
                <p class="text-body-2 text-medium-emphasis">
                  Расписание: {{ getScheduleText(scheduleSettings.database.schedule) }}
                </p>
                <p class="text-body-2 text-medium-emphasis">
                  Хранение: {{ scheduleSettings.database.retentionDays }} дней
                </p>
              </div>

              <VDivider />

              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center gap-2">
                  <VIcon
                    icon="bx-folder"
                    color="secondary"
                  />
                  <span>Файловая система</span>
                </div>
                <VSwitch
                  v-model="scheduleSettings.filesystem.enabled"
                  color="primary"
                  hide-details
                  @update:model-value="scheduleDialog = true"
                />
              </div>

              <div
                v-if="scheduleSettings.filesystem.enabled"
                class="ps-6"
              >
                <p class="text-body-2 text-medium-emphasis">
                  Расписание: {{ getScheduleText(scheduleSettings.filesystem.schedule) }}
                </p>
                <p class="text-body-2 text-medium-emphasis">
                  Хранение: {{ scheduleSettings.filesystem.retentionDays }} дней
                </p>
              </div>
            </div>
          </VCardText>

          <VCardActions>
            <VBtn
              variant="tonal"
              color="warning"
              block
              @click="scheduleDialog = true"
            >
              Настроить расписание
            </VBtn>
          </VCardActions>
        </VCard>

        <!-- Справка -->
        <VCard title="Справка">
          <VCardText>
            <div class="d-flex flex-column gap-3">
              <div class="d-flex align-start gap-2">
                <VIcon
                  icon="bx-info-circle"
                  color="primary"
                  size="20"
                  class="mt-1"
                />
                <div>
                  <p class="text-body-2 font-weight-medium mb-1">
                    Ручное создание
                  </p>
                  <p class="text-body-2 text-medium-emphasis">
                    Нажмите соответствующую кнопку для создания бэкапа базы данных или файловой системы.
                  </p>
                </div>
              </div>

              <div class="d-flex align-start gap-2">
                <VIcon
                  icon="bx-time"
                  color="warning"
                  size="20"
                  class="mt-1"
                />
                <div>
                  <p class="text-body-2 font-weight-medium mb-1">
                    Автоматическое расписание
                  </p>
                  <p class="text-body-2 text-medium-emphasis">
                    Настройте расписание для автоматического создания бэкапов в указанное время.
                  </p>
                </div>
              </div>

              <div class="d-flex align-start gap-2">
                <VIcon
                  icon="bx-download"
                  color="success"
                  size="20"
                  class="mt-1"
                />
                <div>
                  <p class="text-body-2 font-weight-medium mb-1">
                    Скачивание
                  </p>
                  <p class="text-body-2 text-medium-emphasis">
                    Все бэкапы хранятся локально и могут быть скачаны в любой момент.
                  </p>
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Диалог настроек расписания -->
    <VDialog
      v-model="scheduleDialog"
      max-width="600px"
    >
      <VCard title="Настройки расписания">
        <VCardText>
          <VRow>
            <!-- База данных -->
            <VCol cols="12">
              <h4 class="text-h6 mb-4">
                База данных
              </h4>
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <VSwitch
                v-model="scheduleSettings.database.enabled"
                label="Включить автоматический бэкап"
                color="primary"
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="scheduleSettings.database.retentionDays"
                label="Хранение (дней)"
                type="number"
                :disabled="!scheduleSettings.database.enabled"
              />
            </VCol>
            <VCol cols="12">
              <AppSelect
                v-model="scheduleSettings.database.schedule"
                :items="scheduleOptions"
                label="Расписание"
                :disabled="!scheduleSettings.database.enabled"
              />
            </VCol>

            <VCol cols="12">
              <VDivider class="my-4" />
            </VCol>

            <!-- Файловая система -->
            <VCol cols="12">
              <h4 class="text-h6 mb-4">
                Файловая система
              </h4>
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <VSwitch
                v-model="scheduleSettings.filesystem.enabled"
                label="Включить автоматический бэкап"
                color="primary"
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="scheduleSettings.filesystem.retentionDays"
                label="Хранение (дней)"
                type="number"
                :disabled="!scheduleSettings.filesystem.enabled"
              />
            </VCol>
            <VCol cols="12">
              <AppSelect
                v-model="scheduleSettings.filesystem.schedule"
                :items="scheduleOptions"
                label="Расписание"
                :disabled="!scheduleSettings.filesystem.enabled"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            color="error"
            variant="outlined"
            @click="scheduleDialog = false"
          >
            Отмена
          </VBtn>
          <VBtn
            color="success"
            variant="elevated"
            :loading="savingSchedule"
            @click="saveSchedule"
          >
            Сохранить
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Диалог массового удаления -->
    <VDialog
      v-model="isBulkDeleteDialogOpen"
      max-width="500px"
    >
      <VCard title="Подтверждение удаления">
        <VCardText>
          Вы уверены, что хотите удалить выбранные бэкапы? Это действие нельзя отменить.
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

  </div>
</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}
</style>
