<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, ref } from 'vue'

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

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Данные
const backups = ref<Backup[]>([])
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
  }
})

const scheduleDialog = ref(false)
const savingSchedule = ref(false)

// Загрузка списка бэкапов
const fetchBackups = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await $fetch<Backup[]>(`${API_BASE}/backup`)
    backups.value = data
  } catch (err: any) {
    error.value = 'Ошибка загрузки списка бэкапов'
    console.error('Error fetching backups:', err)
  } finally {
    loading.value = false
  }
}

// Загрузка настроек расписания
const fetchScheduleSettings = async () => {
  try {
    const data = await $fetch<ScheduleSettings>(`${API_BASE}/backup/settings`)
    scheduleSettings.value = data
  } catch (err) {
    console.error('Error fetching schedule settings:', err)
  }
}

// Создание бэкапа базы данных
const createDatabaseBackup = async () => {
  try {
    creatingBackup.value = true
    backupTypeCreating.value = 'database'
    const result = await $fetch<{ success: boolean; backup: Backup }>(`${API_BASE}/backup/database`, {
      method: 'POST'
    })
    backups.value.unshift(result.backup)
    showToast('Бэкап базы данных успешно создан')
  } catch (err: any) {
    showToast(err.message || 'Ошибка при создании бэкапа базы данных', 'error')
  } finally {
    creatingBackup.value = false
    backupTypeCreating.value = null
  }
}

// Создание бэкапа файловой системы
const createFilesystemBackup = async () => {
  try {
    creatingBackup.value = true
    backupTypeCreating.value = 'filesystem'
    const result = await $fetch<{ success: boolean; backup: Backup }>(`${API_BASE}/backup/filesystem`, {
      method: 'POST'
    })
    backups.value.unshift(result.backup)
    showToast('Бэкап файловой системы успешно создан')
  } catch (err: any) {
    showToast(err.message || 'Ошибка при создании бэкапа файловой системы', 'error')
  } finally {
    creatingBackup.value = false
    backupTypeCreating.value = null
  }
}

// Удаление бэкапа
const deleteBackup = async (backup: Backup) => {
  if (!confirm(`Вы уверены, что хотите удалить бэкап ${backup.filename}?`)) {
    return
  }

  try {
    await $fetch(`${API_BASE}/backup/${backup.id}`, {
      method: 'DELETE'
    })
    backups.value = backups.value.filter(b => b.id !== backup.id)
    showToast('Бэкап успешно удален')
  } catch (err: any) {
    showToast(err.message || 'Ошибка при удалении бэкапа', 'error')
  }
}

// Скачивание бэкапа
const downloadBackup = async (backup: Backup) => {
  try {
    const response = await fetch(`${API_BASE}/backup/${backup.id}/download`)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = backup.filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (err: any) {
    showToast(err.message || 'Ошибка при скачивании бэкапа', 'error')
  }
}

// Сохранение настроек расписания
const saveSchedule = async () => {
  try {
    savingSchedule.value = true
    await $fetch(`${API_BASE}/backup/settings`, {
      method: 'POST',
      body: scheduleSettings.value
    })
    showToast('Настройки расписания сохранены')
    scheduleDialog.value = false
  } catch (err: any) {
    showToast(err.message || 'Ошибка при сохранении настроек', 'error')
  } finally {
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
    minute: '2-digit'
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

const filteredBackups = computed(() => {
  if (filterType.value === 'all') {
    return backups.value
  }
  return backups.value.filter(b => b.type === filterType.value)
})

// Статистика
const stats = computed(() => ({
  total: backups.value.length,
  database: backups.value.filter(b => b.type === 'database').length,
  filesystem: backups.value.filter(b => b.type === 'filesystem').length,
  totalSize: backups.value.reduce((sum, b) => sum + b.size, 0)
}))

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Toast уведомления
const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

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
      <VCol cols="12" md="3">
        <VCard class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <div>
              <p class="text-body-2 mb-1">Всего бэкапов</p>
              <h3 class="text-h4 font-weight-bold">{{ stats.total }}</h3>
            </div>
            <VAvatar color="primary" variant="tonal" size="48">
              <VIcon icon="bx-archive" size="24" />
            </VAvatar>
          </div>
        </VCard>
      </VCol>

      <VCol cols="12" md="3">
        <VCard class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <div>
              <p class="text-body-2 mb-1">Базы данных</p>
              <h3 class="text-h4 font-weight-bold">{{ stats.database }}</h3>
            </div>
            <VAvatar color="success" variant="tonal" size="48">
              <VIcon icon="bx-data" size="24" />
            </VAvatar>
          </div>
        </VCard>
      </VCol>

      <VCol cols="12" md="3">
        <VCard class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <div>
              <p class="text-body-2 mb-1">Файловые системы</p>
              <h3 class="text-h4 font-weight-bold">{{ stats.filesystem }}</h3>
            </div>
            <VAvatar color="warning" variant="tonal" size="48">
              <VIcon icon="bx-folder" size="24" />
            </VAvatar>
          </div>
        </VCard>
      </VCol>

      <VCol cols="12" md="3">
        <VCard class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <div>
              <p class="text-body-2 mb-1">Общий размер</p>
              <h3 class="text-h4 font-weight-bold">{{ formatBytes(stats.totalSize) }}</h3>
            </div>
            <VAvatar color="info" variant="tonal" size="48">
              <VIcon icon="bx-hdd" size="24" />
            </VAvatar>
          </div>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mt-4">
      <!-- Панель управления бэкапами -->
      <VCol cols="12" lg="8">
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

          <!-- Фильтр -->
          <div class="pa-6">
            <AppSelect
              v-model="filterType"
              :items="[
                { title: 'Все', value: 'all' },
                { title: 'Базы данных', value: 'database' },
                { title: 'Файловые системы', value: 'filesystem' },
              ]"
              label="Тип бэкапа"
              style="max-width: 250px;"
            />
          </div>

          <!-- Индикатор загрузки -->
          <div v-if="loading" class="d-flex justify-center pa-6">
            <VProgressCircular indeterminate color="primary" />
          </div>

          <!-- Сообщение об ошибке -->
          <div v-else-if="error" class="d-flex justify-center pa-6">
            <VAlert type="error">
              {{ error }}
            </VAlert>
          </div>

          <!-- Список бэкапов -->
          <div v-else-if="filteredBackups.length > 0">
            <VTable hover>
              <thead>
                <tr>
                  <th>Тип</th>
                  <th>Имя файла</th>
                  <th>Размер</th>
                  <th>Дата создания</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="backup in filteredBackups" :key="backup.id">
                  <td>
                    <VChip
                      :color="getBackupTypeColor(backup.type)"
                      size="small"
                      label
                    >
                      {{ getBackupTypeLabel(backup.type) }}
                    </VChip>
                  </td>
                  <td>
                    <div class="d-flex align-center gap-2">
                      <VIcon 
                        :icon="backup.type === 'database' ? 'bx-data' : 'bx-folder'" 
                        size="20"
                        :color="getBackupTypeColor(backup.type)"
                      />
                      <span class="font-weight-medium">{{ backup.filename }}</span>
                    </div>
                  </td>
                  <td>{{ backup.sizeFormatted }}</td>
                  <td>{{ formatDate(backup.createdAt) }}</td>
                  <td>
                    <div class="d-flex gap-1">
                      <IconBtn @click="downloadBackup(backup)">
                        <VIcon icon="bx-download" />
                        <VTooltip activator="parent">Скачать</VTooltip>
                      </IconBtn>
                      <IconBtn color="error" @click="deleteBackup(backup)">
                        <VIcon icon="bx-trash" />
                        <VTooltip activator="parent">Удалить</VTooltip>
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </div>

          <!-- Нет данных -->
          <div v-else class="d-flex flex-column align-center justify-center pa-12">
            <VIcon icon="bx-archive" size="64" color="disabled" class="mb-4" />
            <p class="text-body-1 text-medium-emphasis">Нет резервных копий</p>
            <p class="text-body-2 text-medium-emphasis">Создайте первый бэкап, нажав на кнопку выше</p>
          </div>
        </VCard>
      </VCol>

      <!-- Информация о расписании -->
      <VCol cols="12" lg="4">
        <VCard title="Настройки расписания" class="mb-4">
          <VCardText>
            <div class="d-flex flex-column gap-4">
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center gap-2">
                  <VIcon icon="bx-data" color="primary" />
                  <span>База данных</span>
                </div>
                <VSwitch
                  v-model="scheduleSettings.database.enabled"
                  color="primary"
                  hide-details
                  @update:model-value="scheduleDialog = true"
                />
              </div>
              
              <div v-if="scheduleSettings.database.enabled" class="ps-6">
                <p class="text-body-2 text-medium-emphasis">Расписание: {{ scheduleSettings.database.schedule }}</p>
                <p class="text-body-2 text-medium-emphasis">Хранение: {{ scheduleSettings.database.retentionDays }} дней</p>
              </div>

              <VDivider />

              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center gap-2">
                  <VIcon icon="bx-folder" color="secondary" />
                  <span>Файловая система</span>
                </div>
                <VSwitch
                  v-model="scheduleSettings.filesystem.enabled"
                  color="secondary"
                  hide-details
                  @update:model-value="scheduleDialog = true"
                />
              </div>

              <div v-if="scheduleSettings.filesystem.enabled" class="ps-6">
                <p class="text-body-2 text-medium-emphasis">Расписание: {{ scheduleSettings.filesystem.schedule }}</p>
                <p class="text-body-2 text-medium-emphasis">Хранение: {{ scheduleSettings.filesystem.retentionDays }} дней</p>
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
                <VIcon icon="bx-info-circle" color="primary" size="20" class="mt-1" />
                <div>
                  <p class="text-body-2 font-weight-medium mb-1">Ручное создание</p>
                  <p class="text-body-2 text-medium-emphasis">
                    Нажмите соответствующую кнопку для создания бэкапа базы данных или файловой системы.
                  </p>
                </div>
              </div>
              
              <div class="d-flex align-start gap-2">
                <VIcon icon="bx-time" color="warning" size="20" class="mt-1" />
                <div>
                  <p class="text-body-2 font-weight-medium mb-1">Автоматическое расписание</p>
                  <p class="text-body-2 text-medium-emphasis">
                    Настройте расписание для автоматического создания бэкапов в указанное время.
                  </p>
                </div>
              </div>

              <div class="d-flex align-start gap-2">
                <VIcon icon="bx-download" color="success" size="20" class="mt-1" />
                <div>
                  <p class="text-body-2 font-weight-medium mb-1">Скачивание</p>
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
    <VDialog v-model="scheduleDialog" max-width="600px">
      <VCard title="Настройки расписания">
        <VCardText>
          <VRow>
            <!-- База данных -->
            <VCol cols="12">
              <h4 class="text-h6 mb-4">База данных</h4>
            </VCol>
            <VCol cols="12" sm="6">
              <VSwitch
                v-model="scheduleSettings.database.enabled"
                label="Включить автоматический бэкап"
                color="primary"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="scheduleSettings.database.retentionDays"
                label="Хранение (дней)"
                type="number"
                :disabled="!scheduleSettings.database.enabled"
              />
            </VCol>
            <VCol cols="12">
              <AppTextField
                v-model="scheduleSettings.database.schedule"
                label="Расписание (cron)"
                placeholder="0 2 * * *"
                :disabled="!scheduleSettings.database.enabled"
                hint="Формат: минута час день_месяца месяц день_недели"
                persistent-hint
              />
            </VCol>

            <VCol cols="12">
              <VDivider class="my-4" />
            </VCol>

            <!-- Файловая система -->
            <VCol cols="12">
              <h4 class="text-h6 mb-4">Файловая система</h4>
            </VCol>
            <VCol cols="12" sm="6">
              <VSwitch
                v-model="scheduleSettings.filesystem.enabled"
                label="Включить автоматический бэкап"
                color="secondary"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="scheduleSettings.filesystem.retentionDays"
                label="Хранение (дней)"
                type="number"
                :disabled="!scheduleSettings.filesystem.enabled"
              />
            </VCol>
            <VCol cols="12">
              <AppTextField
                v-model="scheduleSettings.filesystem.schedule"
                label="Расписание (cron)"
                placeholder="0 3 * * *"
                :disabled="!scheduleSettings.filesystem.enabled"
                hint="Формат: минута час день_месяца месяц день_недели"
                persistent-hint
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

    <!-- Toast уведомления -->
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
.v-card {
  margin-block-end: 1rem;
}
</style>
