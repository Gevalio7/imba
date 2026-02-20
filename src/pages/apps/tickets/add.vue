<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

definePage({
  meta: {
    navActiveLink: 'apps-tickets',
  },
})

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

const router = useRouter()

// Справочники
const priorities = ref<any[]>([])
const queues = ref<any[]>([])
const states = ref<any[]>([])
const types = ref<any[]>([])
const agents = ref<any[]>([])
const customers = ref<any[]>([])
const slaList = ref<any[]>([])

// Загрузка справочников
const fetchPriorities = async () => {
  try {
    const data = await $fetch(`${API_BASE}/priorities`)
    priorities.value = (data as any).priorities || []
  }
  catch (err) {
    console.error('Error fetching priorities:', err)
  }
}

const fetchQueues = async () => {
  try {
    const data = await $fetch(`${API_BASE}/queues`)
    queues.value = (data as any).queues || []
  }
  catch (err) {
    console.error('Error fetching queues:', err)
  }
}

const fetchStates = async () => {
  try {
    const data = await $fetch(`${API_BASE}/states`)
    states.value = (data as any).states || []
  }
  catch (err) {
    console.error('Error fetching states:', err)
  }
}

const fetchTypes = async () => {
  try {
    const data = await $fetch(`${API_BASE}/types`)
    types.value = (data as any).types || []
  }
  catch (err) {
    console.error('Error fetching types:', err)
  }
}

const fetchAgents = async () => {
  try {
    const data = await $fetch(`${API_BASE}/agents`)
    agents.value = (data as any).agents || []
  }
  catch (err) {
    console.error('Error fetching agents:', err)
  }
}

const fetchCustomers = async () => {
  try {
    const data = await $fetch(`${API_BASE}/customers`)
    customers.value = (data as any).customers || []
  }
  catch (err) {
    console.error('Error fetching customers:', err)
  }
}

const fetchSla = async () => {
  try {
    const data = await $fetch(`${API_BASE}/sla`)
    slaList.value = (data as any).sla || []
  }
  catch (err) {
    console.error('Error fetching SLA:', err)
  }
}

// Форма
const saving = ref(false)
const description = ref('')

const ticket = ref({
  title: '',
  typeId: undefined as number | undefined,
  priorityId: undefined as number | undefined,
  queueId: undefined as number | undefined,
  stateId: undefined as number | undefined,
  ownerId: undefined as number | undefined,
  companyId: undefined as number | undefined,
  slaId: undefined as number | undefined,
  isActive: true,
})

// Вложения
const attachments = ref<File[]>([])
const uploadingFiles = ref(false)

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    attachments.value = [...attachments.value, ...Array.from(target.files)]
  }
}

const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Агенты для выбора
const agentOptions = computed(() => {
  return agents.value.map((a: any) => ({
    title: `${a.firstName || ''} ${a.lastName || ''} (${a.login})`.trim(),
    value: a.id,
  }))
})

// Сохранение
const save = async () => {
  if (!ticket.value.title?.trim()) {
    showToast('Заголовок обязателен для заполнения', 'error')

    return
  }

  try {
    saving.value = true
    
    // Создаём тикет
    const ticketData = {
      ...ticket.value,
      description: description.value,
    }
    
    const result = await $fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      body: ticketData,
    })
    
    const newTicketId = (result as any).id || (result as any).ticket?.id
    
    // Загружаем вложения если есть
    if (attachments.value.length > 0 && newTicketId) {
      await uploadAttachments(newTicketId)
    }
    
    showToast('Тикет успешно создан')
    router.push('/apps/tickets')
  }
  catch (err) {
    console.error('Error saving ticket:', err)
    showToast('Ошибка создания тикета', 'error')
  }
  finally {
    saving.value = false
  }
}

// Загрузка вложений
const uploadAttachments = async (ticketId: number) => {
  try {
    uploadingFiles.value = true
    
    for (const file of attachments.value) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('ticketId', ticketId.toString())
      
      await $fetch(`${API_BASE}/ticketAttachments`, {
        method: 'POST',
        body: formData,
      })
    }
  }
  catch (err) {
    console.error('Error uploading attachments:', err)
    showToast('Ошибка загрузки вложений', 'error')
  }
  finally {
    uploadingFiles.value = false
  }
}

// Отмена
const cancel = () => {
  router.push('/apps/tickets')
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

// Инициализация
onMounted(async () => {
  await Promise.all([
    fetchPriorities(),
    fetchQueues(),
    fetchStates(),
    fetchTypes(),
    fetchAgents(),
    fetchCustomers(),
    fetchSla(),
  ])
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex flex-wrap justify-start justify-sm-space-between gap-y-4 gap-x-6 mb-6">
      <div class="d-flex flex-column justify-center">
        <h4 class="text-h4 mb-1">
          Создание тикета
        </h4>
        <div class="text-body-1">
          Заполните информацию для создания нового тикета
        </div>
      </div>

      <div class="d-flex gap-4 align-center flex-wrap">
        <VBtn
          variant="tonal"
          color="secondary"
          @click="cancel"
        >
          Отмена
        </VBtn>
        <VBtn
          :loading="saving"
          @click="save"
        >
          Создать тикет
        </VBtn>
      </div>
    </div>

    <VRow>
      <!-- Левая колонка - Основная информация -->
      <VCol
        cols="12"
        md="8"
      >
        <!-- Основная информация -->
        <VCard class="mb-6">
          <VCardTitle class="d-flex align-center px-6 py-4">
            <h5 class="text-h5">
              Основная информация
            </h5>
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="ticket.title"
                  label="Заголовок *"
                  placeholder="Введите заголовок тикета"
                />
              </VCol>

              <VCol cols="12">
                <label class="v-label text-body-1 d-block mb-2">Описание</label>
                <TiptapEditor
                  v-model="description"
                  placeholder="Введите подробное описание проблемы"
                  class="border rounded"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Вложения -->
        <VCard class="mb-6">
          <VCardTitle class="d-flex align-center px-6 py-4">
            <h5 class="text-h5">
              Вложения
            </h5>
          </VCardTitle>
          <VCardText>
            <!-- Drop Zone -->
            <div class="drop-zone pa-8 text-center mb-4">
              <VIcon
                icon="bx-cloud-upload"
                size="48"
                color="primary"
                class="mb-2"
              />
              <p class="text-body-1 mb-2">
                Перетащите файлы сюда или
              </p>
              <VBtn
                variant="tonal"
                color="primary"
                tag="label"
                class="cursor-pointer"
              >
                <input
                  type="file"
                  multiple
                  hidden
                  @change="handleFileSelect"
                >
                Выберите файлы
              </VBtn>
            </div>

            <!-- Список выбранных файлов -->
            <VList
              v-if="attachments.length > 0"
              class="border rounded"
            >
              <VListItem
                v-for="(file, index) in attachments"
                :key="index"
                class="py-3"
              >
                <template #prepend>
                  <VIcon
                    icon="bx-file"
                    class="me-3"
                  />
                </template>

                <VListItemTitle>{{ file.name }}</VListItemTitle>
                <VListItemSubtitle>{{ formatFileSize(file.size) }}</VListItemSubtitle>

                <template #append>
                  <VBtn
                    icon
                    variant="text"
                    color="error"
                    size="small"
                    @click="removeAttachment(index)"
                  >
                    <VIcon icon="bx-x" />
                  </VBtn>
                </template>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Правая колонка - Свойства тикета -->
      <VCol
        cols="12"
        md="4"
      >
        <!-- Свойства -->
        <VCard class="mb-6">
          <VCardTitle class="d-flex align-center px-6 py-4">
            <h5 class="text-h5">
              Свойства
            </h5>
          </VCardTitle>
          <VCardText>
            <div class="d-flex flex-column gap-y-4">
              <AppSelect
                v-model="ticket.typeId"
                :items="types"
                item-title="name"
                item-value="id"
                label="Тип"
                placeholder="Выберите тип"
                clearable
              />

              <AppSelect
                v-model="ticket.priorityId"
                :items="priorities"
                item-title="name"
                item-value="id"
                label="Приоритет"
                placeholder="Выберите приоритет"
                clearable
              />

              <AppSelect
                v-model="ticket.queueId"
                :items="queues"
                item-title="name"
                item-value="id"
                label="Очередь"
                placeholder="Выберите очередь"
                clearable
              />

              <AppSelect
                v-model="ticket.stateId"
                :items="states"
                item-title="name"
                item-value="id"
                label="Статус"
                placeholder="Выберите статус"
                clearable
              />

              <AppSelect
                v-model="ticket.ownerId"
                :items="agentOptions"
                label="Владелец"
                placeholder="Выберите владельца"
                clearable
              />

              <AppSelect
                v-model="ticket.companyId"
                :items="customers"
                item-title="name"
                item-value="id"
                label="Компания"
                placeholder="Выберите компанию"
                clearable
              />

              <AppSelect
                v-model="ticket.slaId"
                :items="slaList"
                item-title="name"
                item-value="id"
                label="SLA"
                placeholder="Выберите SLA"
                clearable
              />

              <VDivider class="my-2" />

              <div class="d-flex align-center justify-space-between">
                <span>Активен</span>
                <VSwitch
                  v-model="ticket.isActive"
                  color="primary"
                  density="compact"
                  hide-details
                />
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Snackbar -->
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
.drop-zone {
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 6px;
  transition: border-color 0.2s;

  &:hover {
    border-color: rgba(var(--v-theme-primary), 0.5);
  }
}
</style>

<style lang="scss">
.ProseMirror {
  p {
    margin-block-end: 0;
  }

  padding: 0.5rem;
  min-block-size: 150px;
  outline: none;

  p.is-editor-empty:first-child::before {
    block-size: 0;
    color: #adb5bd;
    content: attr(data-placeholder);
    float: inline-start;
    pointer-events: none;
  }
}
</style>
