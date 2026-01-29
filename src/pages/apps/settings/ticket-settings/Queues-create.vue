<script setup lang="ts">
import { $fetch } from 'ofetch'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

// Типы данных для Очереди
interface Queues {
  id: number
  name: string
  description: string
  maxTickets: number
  priority: number
  isActive: boolean
  agentsGroupId?: number
  allowFollowUp: boolean
  autoResponseId?: number
  templateId?: number
  attachmentIds?: number[]
  createdAt: string
  updatedAt: string
  newTicketAutoResponseId?: number
  closedTicketAutoResponseId?: number
}

// Типы для справочников
interface AgentsGroups {
  id: number
  name: string
}

interface Signatures {
  id: number
  name: string
  content: string
  comment: string
  isActive: boolean
}

interface Templates {
  id: number
  name: string
  message: string
  isActive: boolean
}

interface Attachments {
  id: number
  name: string
  filename: string
  size: number
  mimeType: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Роутер
const router = useRouter()

const numberedSteps = [
  {
    title: 'Основное',
    subtitle: 'Настройка основных параметров очереди',
  },
  {
    title: 'Автоответы',
    subtitle: 'Выбор автоответа',
  },
  {
    title: 'Шаблоны',
    subtitle: 'Выбор шаблона',
  },
  {
    title: 'Вложения',
    subtitle: 'Выбор вложений',
  },
  {
    title: 'Предпросмотр',
    subtitle: 'Проверка выбранных настроек',
  },
]

const currentStep = ref(0)

// Данные
const loading = ref(false)
const saving = ref(false)

// Справочники
const agentsGroups = ref<AgentsGroups[]>([])
const signatures = ref<Signatures[]>([])
const templates = ref<Templates[]>([])
const attachments = ref<Attachments[]>([])

// Загрузка справочников
const fetchAgentsGroups = async () => {
  try {
    const data = await $fetch(`${API_BASE}/agentsGroups`)
    agentsGroups.value = data.agentsGroups || []
  } catch (err) {
    console.log('Error fetching agentsGroups:', err)
  }
}

const fetchSignatures = async () => {
  try {
    const data = await $fetch(`${API_BASE}/signatures`)
    signatures.value = data.signatures || []
  } catch (err) {
    console.log('Error fetching signatures:', err)
  }
}

const fetchTemplates = async () => {
  try {
    const data = await $fetch(`${API_BASE}/templates`)
    templates.value = data.templates || []
  } catch (err) {
    console.log('Error fetching templates:', err)
  }
}

const fetchAttachments = async () => {
  try {
    const data = await $fetch(`${API_BASE}/attachments`)
    attachments.value = data.attachments || []
  } catch (err) {
    console.log('Error fetching attachments:', err)
  }
}

// Форма
const queue = ref<Queues>({
  id: -1,
  name: '',
  description: '',
  maxTickets: 0,
  priority: 0,
  isActive: true,
  agentsGroupId: undefined,
  allowFollowUp: true,
  autoResponseId: undefined,
  templateId: undefined,
  attachmentIds: [],
  createdAt: '',
  updatedAt: '',
  // Новые поля для автоответов
  newTicketAutoResponseId: undefined,
  closedTicketAutoResponseId: undefined,
})

// Сохранение
const save = async () => {
  if (!queue.value.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  try {
    saving.value = true
    const dataToSend = {
      name: queue.value.name,
      description: queue.value.description,
      maxTickets: queue.value.maxTickets,
      priority: queue.value.priority,
      isActive: queue.value.isActive,
      agentsGroupId: queue.value.agentsGroupId,
      allowFollowUp: queue.value.allowFollowUp,
      autoResponseId: queue.value.autoResponseId,
      templateId: queue.value.templateId,
      attachmentIds: queue.value.attachmentIds,
      newTicketAutoResponseId: queue.value.newTicketAutoResponseId,
      closedTicketAutoResponseId: queue.value.closedTicketAutoResponseId,
    }

    await $fetch(`${API_BASE}/queues`, {
      method: 'POST',
      body: dataToSend
    })
    showToast('Очередь успешно создана')
    router.push('/apps/settings/ticket-settings/Queues')
  } catch (err) {
    showToast('Ошибка сохранения очереди', 'error')
  } finally {
    saving.value = false
  }
}

// Отмена
const cancel = () => {
  router.push('/apps/settings/ticket-settings/Queues')
}

// Инициализация
onMounted(async () => {
  await Promise.all([
    fetchAgentsGroups(),
    fetchSignatures(),
    fetchTemplates(),
    fetchAttachments()
  ])
})

// Уведомления
const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}
</script>

<template>
  <div>
    <VCard>
      <VCardTitle>
        Создание очереди (версия 2)
      </VCardTitle>

      <VCardText>
        <!-- 👉 Stepper -->
        <AppStepper
          v-model:current-step="currentStep"
          :items="numberedSteps"
          class="stepper-icon-step-bg"
        />
      </VCardText>

      <VDivider />

      <VCardText>
        <!-- 👉 stepper content -->
        <VForm>
          <VWindow
            v-model="currentStep"
            class="disable-tab-transition"
          >
            <!-- Шаг 1: Основное -->
            <VWindowItem>
              <VRow>
                <VCol cols="12">
                  <h6 class="text-h6 font-weight-medium">
                    Основное
                  </h6>
                  <p class="mb-0">
                    Введите основные параметры очереди
                  </p>
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="queue.name"
                    label="Название очереди *"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppSelect
                    v-model="queue.agentsGroupId"
                    :items="agentsGroups"
                    item-title="name"
                    item-value="id"
                    label="Группа агентов"
                    placeholder="Выберите группу агентов"
                    clearable
                  />
                </VCol>

                <VCol cols="12">
                  <AppTextarea
                    v-model="queue.description"
                    label="Описание"
                    rows="3"
                    placeholder="Введите описание..."
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VSwitch
                    v-model="queue.allowFollowUp"
                    label="Последующее обращение разрешено"
                    color="primary"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VSwitch
                    v-model="queue.isActive"
                    label="Активно"
                    color="primary"
                  />
                </VCol>
              </VRow>
            </VWindowItem>

            <!-- Шаг 2: Автоответы -->
            <VWindowItem>
              <VRow>
                <VCol cols="12">
                  <h6 class="text-h6 font-weight-medium">
                    Автоответы
                  </h6>
                  <p class="mb-0">
                    Выберите автоответы для разных состояний заявки
                  </p>
                </VCol>

                <VCol cols="12" md="6">
                  <AppSelect
                    v-model="queue.newTicketAutoResponseId"
                    :items="signatures.filter(s => s.isActive)"
                    item-title="name"
                    item-value="id"
                    label="Автоответ для новой заявки"
                    placeholder="Выберите автоответ"
                    clearable
                  />
                </VCol>

                <VCol cols="12" md="6">
                  <AppSelect
                    v-model="queue.closedTicketAutoResponseId"
                    :items="signatures.filter(s => s.isActive)"
                    item-title="name"
                    item-value="id"
                    label="Автоответ для закрытой заявки"
                    placeholder="Выберите автоответ"
                    clearable
                  />
                </VCol>

                <VCol cols="12" v-if="queue.newTicketAutoResponseId">
                  <VCard variant="outlined" class="pa-4">
                    <h4>Предпросмотр автоответа для новой заявки</h4>
                    <p><strong>Название:</strong> {{ signatures.find(s => s.id === queue.newTicketAutoResponseId)?.name }}</p>
                    <p><strong>Комментарий:</strong> {{ signatures.find(s => s.id === queue.newTicketAutoResponseId)?.comment }}</p>
                    <div v-html="signatures.find(s => s.id === queue.newTicketAutoResponseId)?.content"></div>
                  </VCard>
                </VCol>

                <VCol cols="12" v-if="queue.closedTicketAutoResponseId">
                  <VCard variant="outlined" class="pa-4">
                    <h4>Предпросмотр автоответа для закрытой заявки</h4>
                    <p><strong>Название:</strong> {{ signatures.find(s => s.id === queue.closedTicketAutoResponseId)?.name }}</p>
                    <p><strong>Комментарий:</strong> {{ signatures.find(s => s.id === queue.closedTicketAutoResponseId)?.comment }}</p>
                    <div v-html="signatures.find(s => s.id === queue.closedTicketAutoResponseId)?.content"></div>
                  </VCard>
                </VCol>
              </VRow>
            </VWindowItem>

            <!-- Шаг 3: Шаблоны -->
            <VWindowItem>
              <VRow>
                <VCol cols="12">
                  <h6 class="text-h6 font-weight-medium">
                    Шаблоны
                  </h6>
                  <p class="mb-0">
                    Выберите шаблон для очереди
                  </p>
                </VCol>

                <VCol cols="12">
                  <AppSelect
                    v-model="queue.templateId"
                    :items="templates.filter(t => t.isActive)"
                    item-title="name"
                    item-value="id"
                    label="Шаблон"
                    placeholder="Выберите шаблон"
                    clearable
                  />
                </VCol>

                <VCol cols="12" v-if="queue.templateId">
                  <VCard variant="outlined" class="pa-4">
                    <h4>Предпросмотр шаблона</h4>
                    <p><strong>Название:</strong> {{ templates.find(t => t.id === queue.templateId)?.name }}</p>
                    <p><strong>Сообщение:</strong></p>
                    <div v-html="templates.find(t => t.id === queue.templateId)?.message"></div>
                  </VCard>
                </VCol>
              </VRow>
            </VWindowItem>

            <!-- Шаг 4: Вложения -->
            <VWindowItem>
              <VRow>
                <VCol cols="12">
                  <h6 class="text-h6 font-weight-medium">
                    Вложения
                  </h6>
                  <p class="mb-0">
                    Выберите вложения для очереди
                  </p>
                </VCol>

                <VCol cols="12">
                  <AppSelect
                    v-model="queue.attachmentIds"
                    :items="attachments.filter(a => a.isActive)"
                    item-title="name"
                    item-value="id"
                    label="Вложения"
                    placeholder="Выберите вложения"
                    multiple
                    chips
                    clearable
                  />
                </VCol>

                <VCol cols="12" v-if="queue.attachmentIds && queue.attachmentIds.length > 0">
                  <VCard variant="outlined" class="pa-4">
                    <h4>Выбранные вложения</h4>
                    <div v-for="id in queue.attachmentIds || []" :key="id">
                      <p><strong>{{ attachments.find(a => a.id === id)?.name }}</strong></p>
                      <p>{{ attachments.find(a => a.id === id)?.filename }} ({{ attachments.find(a => a.id === id)?.size }} bytes)</p>
                      <VDivider class="my-2" />
                    </div>
                  </VCard>
                </VCol>
              </VRow>
            </VWindowItem>

            <!-- Шаг 5: Предпросмотр -->
            <VWindowItem>
              <VRow>
                <VCol cols="12">
                  <h6 class="text-h6 font-weight-medium">
                    Предпросмотр
                  </h6>
                  <p class="mb-0">
                    Проверьте выбранные настройки
                  </p>
                </VCol>

                <VCol cols="12">
                  <VCard variant="outlined" class="pa-4">
                    <h4>Основные настройки</h4>
                    <p><strong>Название:</strong> {{ queue.name }}</p>
                    <p><strong>Описание:</strong> {{ queue.description }}</p>
                    <p><strong>Группа агентов:</strong> {{ agentsGroups.find(g => g.id === queue.agentsGroupId)?.name || 'Не выбрана' }}</p>
                    <p><strong>Последующее обращение разрешено:</strong> {{ queue.allowFollowUp ? 'Да' : 'Нет' }}</p>
                    <p><strong>Активно:</strong> {{ queue.isActive ? 'Да' : 'Нет' }}</p>
                  </VCard>
                </VCol>

                <VCol cols="12">
                  <VCard variant="outlined" class="pa-4">
                    <h4>Автоответы</h4>
                    <p><strong>Для новой заявки:</strong> {{ queue.newTicketAutoResponseId ? signatures.find(s => s.id === queue.newTicketAutoResponseId)?.name : 'Не выбран' }}</p>
                    <p><strong>Для закрытой заявки:</strong> {{ queue.closedTicketAutoResponseId ? signatures.find(s => s.id === queue.closedTicketAutoResponseId)?.name : 'Не выбран' }}</p>
                  </VCard>
                </VCol>

                <VCol cols="12">
                  <VCard variant="outlined" class="pa-4">
                    <h4>Шаблон</h4>
                    <p v-if="queue.templateId">{{ templates.find(t => t.id === queue.templateId)?.name }}</p>
                    <p v-else>Не выбран</p>
                  </VCard>
                </VCol>

                <VCol cols="12">
                  <VCard variant="outlined" class="pa-4">
                    <h4>Вложения</h4>
                    <p v-if="queue.attachmentIds && queue.attachmentIds.length > 0">
                      {{ queue.attachmentIds.map(id => attachments.find(a => a.id === id)?.name).join(', ') }}
                    </p>
                    <p v-else>Не выбраны</p>
                  </VCard>
                </VCol>
              </VRow>
            </VWindowItem>
          </VWindow>

          <div class="d-flex flex-wrap gap-4 justify-space-between mt-8">
            <VBtn
              color="secondary"
              variant="tonal"
              :disabled="currentStep === 0"
              @click="currentStep--"
            >
              <VIcon
                icon="bx-left-arrow-alt"
                start
                class="flip-in-rtl"
              />
              Назад
            </VBtn>

            <VBtn
              v-if="numberedSteps.length - 1 === currentStep"
              color="success"
              :loading="saving"
              @click="save"
            >
              Сохранить
            </VBtn>

            <VBtn
              v-else
              @click="currentStep++"
            >
              Далее

              <VIcon
                icon="bx-right-arrow-alt"
                end
                class="flip-in-rtl"
              />
            </VBtn>
          </div>
        </VForm>
      </VCardText>

    </VCard>

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
.v-card {
  margin-block-end: 1rem;
}
</style>
