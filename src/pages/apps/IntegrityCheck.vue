<script setup lang="ts">
import { $api } from '@/utils/api'
import { computed, onMounted, ref } from 'vue'

// Типы данных
interface ChangedFile {
  path: string
  oldHash?: string
  newHash?: string
  status: string
}

interface IntegrityStatus {
  initialized: boolean
  isOk?: boolean
  message: string
  filesScanned?: number
  filesTracked?: number
  changedFiles: ChangedFile[]
  newFiles: ChangedFile[]
  removedFiles: ChangedFile[]
  lastChecked?: string
}

// Состояние
const loading = ref(false)
const checking = ref(false)
const initializing = ref(false)
const status = ref<IntegrityStatus | null>(null)
const error = ref<string | null>(null)

// Только изменения
const showOnlyChanges = ref(false)

// Получить статус целостности
const fetchStatus = async () => {
  try {
    loading.value = true
    error.value = null
    status.value = await $api<IntegrityStatus>(`/integrity`)
  } catch (err: any) {
    error.value = err.message || 'Ошибка при проверке целостности'
    console.error('Error fetching integrity status:', err)
  } finally {
    loading.value = false
  }
}

// Проверить целостность
const checkIntegrity = async () => {
  await fetchStatus()
}

// Инициализировать хэши
const initializeHashes = async () => {
  if (!confirm('Вы уверены, что хотите создать базовые хэши? Текущие хэши будут перезаписаны.')) {
    return
  }
  
  try {
    initializing.value = true
    await $api(`/integrity/initialize`, { method: 'POST' })
    showToast('Хэши успешно инициализированы')
    await fetchStatus()
  } catch (err: any) {
    showToast(err.message || 'Ошибка при инициализации', 'error')
  } finally {
    initializing.value = false
  }
}

// Сбросить хэши
const resetHashes = async () => {
  if (!confirm('Вы уверены, что хотите сбросить все хэши? Это действие нельзя отменить.')) {
    return
  }
  
  try {
    await $api(`/integrity/reset`, { method: 'POST' })
    showToast('Хэши успешно сброшены')
    await fetchStatus()
  } catch (err: any) {
    showToast(err.message || 'Ошибка при сбросе', 'error')
  }
}

// Вычисляемые свойства
const totalChanges = computed(() => {
  if (!status.value) return 0
  return status.value.changedFiles.length + 
         status.value.newFiles.length + 
         status.value.removedFiles.length
})

const allFiles = computed(() => {
  if (!status.value) return []
  return [
    ...status.value.changedFiles.map(f => ({ ...f, type: 'changed' })),
    ...status.value.newFiles.map(f => ({ ...f, type: 'new' })),
    ...status.value.removedFiles.map(f => ({ ...f, type: 'removed' }))
  ]
})

const displayedFiles = computed(() => {
  if (showOnlyChanges.value) {
    return allFiles.value
  }
  return allFiles.value
})

// Форматирование даты
const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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
  fetchStatus()
})
</script>

<template>
  <div>
    <VRow class="match-height">
      <!-- Статус целостности -->
      <VCol cols="12" md="4">
        <VCard class="pa-4">
          <div class="d-flex flex-column align-center text-center">
            <!-- Иконка статуса -->
            <VAvatar 
              :color="!status?.initialized ? 'warning' : (status?.isOk ? 'success' : 'error')" 
              size="80" 
              class="mb-4"
            >
              <VIcon 
                :icon="!status?.initialized ? 'bx-help-circle' : (status?.isOk ? 'bx-check-shield' : 'bx-alert')" 
                size="40" 
              />
            </VAvatar>

            <!-- Заголовок -->
            <h3 class="text-h5 mb-2">
              {{ !status?.initialized ? 'Не инициализировано' : (status?.isOk ? 'Целостность подтверждена' : 'Обнаружены изменения') }}
            </h3>

            <!-- Сообщение -->
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ status?.message }}
            </p>

            <!-- Кнопки -->
            <div class="d-flex flex-column gap-2" style="width: 100%;">
              <VBtn
                color="primary"
                variant="elevated"
                :loading="initializing"
                :disabled="!status?.initialized"
                @click="initializeHashes"
              >
                <VIcon icon="bx-refresh" class="me-2" />
                Пересоздать хэши
              </VBtn>
              
              <VBtn
                color="warning"
                variant="tonal"
                :loading="checking"
                :disabled="!status?.initialized"
                @click="checkIntegrity"
              >
                <VIcon icon="bx-search" class="me-2" />
                Проверить целостность
              </VBtn>

              <VBtn
                color="error"
                variant="outlined"
                :disabled="!status?.initialized"
                @click="resetHashes"
              >
                <VIcon icon="bx-trash" class="me-2" />
                Сбросить хэши
              </VBtn>
            </div>
          </div>
        </VCard>
      </VCol>

      <!-- Статистика -->
      <VCol cols="12" md="8">
        <VRow>
          <!-- Всего файлов -->
          <VCol cols="12" sm="6">
            <VCard class="pa-4">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <p class="text-body-2 mb-1">Файлов проверено</p>
                  <h3 class="text-h4 font-weight-bold">{{ status?.filesScanned || 0 }}</h3>
                </div>
                <VAvatar color="primary" variant="tonal" size="48">
                  <VIcon icon="bx-file" size="24" />
                </VAvatar>
              </div>
            </VCard>
          </VCol>

          <!-- Отслеживается -->
          <VCol cols="12" sm="6">
            <VCard class="pa-4">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <p class="text-body-2 mb-1">Файлов отслеживается</p>
                  <h3 class="text-h4 font-weight-bold">{{ status?.filesTracked || 0 }}</h3>
                </div>
                <VAvatar color="info" variant="tonal" size="48">
                  <VIcon icon="bx-track" size="24" />
                </VAvatar>
              </div>
            </VCard>
          </VCol>

          <!-- Изменено -->
          <VCol cols="12" sm="4">
            <VCard class="pa-4">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <p class="text-body-2 mb-1">Изменено</p>
                  <h3 class="text-h4 font-weight-bold text-warning">{{ status?.changedFiles?.length || 0 }}</h3>
                </div>
                <VAvatar color="warning" variant="tonal" size="48">
                  <VIcon icon="bx-edit" size="24" />
                </VAvatar>
              </div>
            </VCard>
          </VCol>

          <!-- Новые -->
          <VCol cols="12" sm="4">
            <VCard class="pa-4">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <p class="text-body-2 mb-1">Новые</p>
                  <h3 class="text-h4 font-weight-bold text-success">{{ status?.newFiles?.length || 0 }}</h3>
                </div>
                <VAvatar color="success" variant="tonal" size="48">
                  <VIcon icon="bx-plus" size="24" />
                </VAvatar>
              </div>
            </VCard>
          </VCol>

          <!-- Удалено -->
          <VCol cols="12" sm="4">
            <VCard class="pa-4">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <p class="text-body-2 mb-1">Удалено</p>
                  <h3 class="text-h4 font-weight-bold text-error">{{ status?.removedFiles?.length || 0 }}</h3>
                </div>
                <VAvatar color="error" variant="tonal" size="48">
                  <VIcon icon="bx-minus" size="24" />
                </VAvatar>
              </div>
            </VCard>
          </VCol>
        </VRow>
      </VCol>
    </VRow>

    <!-- Список изменений -->
    <VCard class="mt-4" title="Детали изменений">
      <div class="pa-4 d-flex flex-wrap gap-4 align-center">
        <VSwitch
          v-model="showOnlyChanges"
          label="Показать только изменения"
          color="primary"
          hide-details
        />
        <VSpacer />
        <span v-if="status?.lastChecked" class="text-body-2 text-medium-emphasis">
          Последняя проверка: {{ formatDate(status.lastChecked) }}
        </span>
      </div>

      <VDivider />

      <!-- Загрузка -->
      <div v-if="loading" class="d-flex justify-center pa-6">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <!-- Нет данных -->
      <div v-else-if="!status?.initialized" class="d-flex flex-column align-center justify-center pa-12">
        <VIcon icon="bx-shield-quarter" size="64" color="warning" class="mb-4" />
        <p class="text-body-1 text-medium-emphasis mb-2">Целостность не инициализирована</p>
        <p class="text-body-2 text-medium-emphasis">
          Нажмите "Пересоздать хэши" для создания базовых хэшей всех файлов
        </p>
      </div>

      <!-- Список изменений пуст -->
      <div v-else-if="displayedFiles.length === 0" class="d-flex flex-column align-center justify-center pa-12">
        <VIcon icon="bx-check-shield" size="64" color="success" class="mb-4" />
        <p class="text-body-1 text-medium-emphasis">
          {{ showOnlyChanges ? 'Нет изменений' : 'Все файлы в порядке' }}
        </p>
      </div>

      <!-- Таблица изменений -->
      <VTable v-else hover>
        <thead>
          <tr>
            <th>Тип</th>
            <th>Файл</th>
            <th>Хэш</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="file in displayedFiles" :key="file.path">
            <td>
              <VChip
                :color="file.type === 'changed' ? 'warning' : (file.type === 'new' ? 'success' : 'error')"
                size="small"
                label
              >
                {{ file.type === 'changed' ? 'Изменен' : (file.type === 'new' ? 'Новый' : 'Удален') }}
              </VChip>
            </td>
            <td>
              <code class="text-body-2">{{ file.path }}</code>
            </td>
            <td>
              <code class="text-body-2 text-medium-emphasis">
                {{ file.oldHash?.substring(0, 12) || file.newHash?.substring(0, 12) || '-' }}
              </code>
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCard>

    <!-- Toast -->
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
