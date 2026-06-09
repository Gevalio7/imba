<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  VCard,
  VCardText,
  VRow,
  VCol,
  VAlert,
  VSwitch,
  VBtn,
  VIcon,
  VProgressCircular,
  VWindow,
  VWindowItem,
  VTabs,
  VTab,
} from 'vuetify/components'

export interface Queue {
  id: number
  name: string
  description: string
  maxTickets: number
  priority: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PostMasterMailAccount {
  id: number
  name: string
  type: 'IMAP' | 'IMAPS' | 'IMAPTLS' | 'MSGraph' | 'POP3' | 'POP3S' | 'POP3TLS'
  authenticationType: 'oauth2_token' | 'password'
  login: string
  password?: string
  host: string
  port?: number
  imapFolder?: string
  trusted: boolean
  dispatchingBy: 'Queue' | 'From'
  queueId?: number
  comment?: string
  oauth2TokenConfigID?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  smtpHost?: string
  smtpPort?: number
  smtpSecure?: boolean
  smtpUser?: string
  smtpPassword?: string
  smtpAuthType?: string
  smtpFromEmail?: string
  smtpFromName?: string
  useForOutgoing?: boolean
}

interface Props {
  mode: 'create' | 'edit'
  initialData?: Partial<PostMasterMailAccount>
  queues: Queue[]
  typeOptions: { title: string; value: string }[]
  authenticationTypeOptions: { title: string; value: string }[]
  smtpSecureOptions: { title: string; value: string }[]
  dispatchingByOptions: { title: string; value: string }[]
  testingRowId: number | null
  testingSmtpRowId: number | null
  canTestForm: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialData: undefined,
})

const emit = defineEmits<{
  (e: 'save', data: Omit<PostMasterMailAccount, 'id' | 'createdAt' | 'updatedAt'>): void
  (e: 'cancel'): void
  (e: 'test-connection'): void
  (e: 'test-smtp'): void
}>()

const defaultItem: PostMasterMailAccount = {
  id: -1,
  name: '',
  type: 'IMAP',
  authenticationType: 'password',
  login: '',
  password: '',
  host: '',
  port: undefined,
  imapFolder: '',
  trusted: false,
  dispatchingBy: 'Queue',
  queueId: undefined,
  comment: '',
  oauth2TokenConfigID: undefined,
  isActive: true,
  createdAt: '',
  updatedAt: '',
  smtpHost: '',
  smtpPort: undefined,
  smtpSecure: false,
  smtpUser: '',
  smtpPassword: '',
  smtpAuthType: 'password',
  smtpFromEmail: '',
  smtpFromName: '',
  useForOutgoing: true,
}

const activeTab = ref(0)
const showPassword = ref(false)
const showSmtpPassword = ref(false)

const editedItem = ref<PostMasterMailAccount>(
  props.mode === 'edit' && props.initialData
    ? ({ ...defaultItem, ...props.initialData } as PostMasterMailAccount)
    : { ...defaultItem },
)

watch(
  () => props.initialData,
  (newData) => {
    if (props.mode === 'edit' && newData) {
      editedItem.value = { ...defaultItem, ...newData } as PostMasterMailAccount
    }
  },
)

const title = computed(() => {
  return props.mode === 'edit' ? 'Редактировать почтовый аккаунт' : 'Добавить почтовый аккаунт'
})

const helpText = computed(() => {
  return props.mode === 'edit'
    ? 'Измените данные почтового аккаунта'
    : 'Заполните данные для создания нового почтового аккаунта'
})

const handleCancel = () => {
  activeTab.value = 0
  showPassword.value = false
  showSmtpPassword.value = false
  emit('cancel')
}

const handleSave = () => {
  if (!editedItem.value.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }
  if (!editedItem.value.type?.trim()) {
    showToast('Тип протокола обязателен для заполнения', 'error')
    return
  }
  if (!editedItem.value.authenticationType?.trim()) {
    showToast('Тип аутентификации обязателен для заполнения', 'error')
    return
  }
  if (!editedItem.value.login?.trim()) {
    showToast('Логин обязателен для заполнения', 'error')
    return
  }
  if (!editedItem.value.host?.trim()) {
    showToast('Хост обязателен для заполнения', 'error')
    return
  }
  if (
    editedItem.value.authenticationType === 'password'
    && !editedItem.value.password?.trim()
  ) {
    showToast('Пароль обязателен при выборе аутентификации по паролю', 'error')
    return
  }

  const dataToSave: Omit<PostMasterMailAccount, 'id' | 'createdAt' | 'updatedAt'> = {
    ...editedItem.value,
  }
  if (dataToSave.password) {
    dataToSave.password = dataToSave.password.toString().trim()
  }

  emit('save', dataToSave)
}

const handleTestConnection = () => {
  emit('test-connection')
}

const handleTestSmtp = () => {
  emit('test-smtp')
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const toggleSmtpPassword = () => {
  showSmtpPassword.value = !showSmtpPassword.value
}

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
  <VCard :title="title">
    <VCardText>
       <p class="text-body-2 text-medium-emphasis mb-4">
         {{ helpText }}
       </p>

       <VTabs v-model="activeTab" class="mb-4">
         <VTab>Входящая почта</VTab>
         <VTab>SMTP настройки</VTab>
       </VTabs>

       <VWindow v-model="activeTab" class="mb-4">
        <VWindowItem value="0">
          <VCardText>
            <VRow>
              <VCol cols="12" sm="6">
                <AppTextField
                  v-model="editedItem.name"
                  label="Название *"
                  placeholder="Введите название аккаунта"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <AppSelect
                  v-model="editedItem.type"
                  label="Тип протокола *"
                  :items="typeOptions"
                  item-title="title"
                  item-value="value"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <AppSelect
                  v-model="editedItem.authenticationType"
                  label="Тип аутентификации *"
                  :items="authenticationTypeOptions"
                  item-title="title"
                  item-value="value"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField
                  v-model="editedItem.host"
                  label="Хост *"
                  placeholder="mail.example.com"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField
                  v-model.number="editedItem.port"
                  label="Порт"
                  type="number"
                  placeholder="993"
                />
              </VCol>

              <VCol
                v-if="editedItem.host?.toString().toLowerCase().includes('gmail.com')"
                cols="12"
              >
                <VAlert
                  type="info"
                  variant="tonal"
                  density="compact"
                >
                  Для Gmail используйте <strong>пароль приложения (App Password)</strong>, а не обычный пароль аккаунта.
                  <a
                    href="https://support.google.com/accounts/answer/185833"
                    target="_blank"
                    rel="noopener"
                  >
                    Инструкция по созданию
                  </a>
                </VAlert>
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField
                  v-model="editedItem.login"
                  label="Логин *"
                  placeholder="user@example.com"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField
                  v-model="editedItem.password"
                  label="Пароль *"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Введите пароль"
                >
                  <template #append-inner>
                    <IconBtn
                      variant="text"
                      density="compact"
                      @click="togglePassword"
                    >
                      <VIcon :icon="showPassword ? 'bx-show' : 'bx-hide'" />
                    </IconBtn>
                  </template>
                </AppTextField>
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField
                  v-model="editedItem.imapFolder"
                  label="IMAP папка"
                  placeholder="INBOX"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VSwitch
                  v-model="editedItem.trusted"
                  label="Доверенный аккаунт"
                  color="primary"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <AppSelect
                  v-model="editedItem.dispatchingBy"
                  label="Маршрутизация"
                  :items="dispatchingByOptions"
                  item-title="title"
                  item-value="value"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <AppSelect
                  v-model="editedItem.queueId"
                  label="Очередь"
                  :items="queues.map(q => ({ title: q.name, value: q.id }))"
                  item-title="title"
                  item-value="value"
                  clearable
                  clear-icon="bx-x"
                  placeholder="Выберите очередь"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField
                  v-model="editedItem.oauth2TokenConfigID"
                  label="OAuth2 Token Config ID"
                  type="number"
                  placeholder="ID конфигурации OAuth2"
                />
              </VCol>

              <VCol cols="12">
                <AppTextarea
                  v-model="editedItem.comment"
                  label="Комментарий"
                  rows="2"
                  placeholder="Введите комментарий..."
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VSwitch
                  v-model="editedItem.isActive"
                  label="Активен"
                  color="primary"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VWindowItem>

        <VWindowItem value="1">
          <VCardText>
            <VRow>
              <VCol cols="12" class="text-body-2 text-secondary mb-4">
                Настройки для отправки исходящих писем (уведомления, ответы). Если не заполнены, будут использованы настройки входящей почты.
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField
                  v-model="editedItem.smtpHost"
                  label="SMTP хост *"
                  placeholder="smtp.example.com"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField
                  v-model.number="editedItem.smtpPort"
                  label="SMTP порт *"
                  type="number"
                  placeholder="587"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <AppSelect
                  v-model="editedItem.smtpSecure"
                  label="Защита *"
                  :items="smtpSecureOptions"
                  item-title="title"
                  item-value="value"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField
                  v-model="editedItem.smtpUser"
                  label="SMTP логин"
                  placeholder="user@example.com (если отличается от IMAP)"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField
                  v-model="editedItem.smtpPassword"
                  label="SMTP пароль"
                  :type="showSmtpPassword ? 'text' : 'password'"
                  placeholder="Оставьте пустым, если совпадает с IMAP"
                >
                  <template #append-inner>
                    <IconBtn
                      variant="text"
                      density="compact"
                      @click="toggleSmtpPassword"
                    >
                      <VIcon :icon="showSmtpPassword ? 'bx-show' : 'bx-hide'" />
                    </IconBtn>
                  </template>
                </AppTextField>
              </VCol>

              <VCol cols="12" sm="6">
                <AppSelect
                  v-model="editedItem.smtpAuthType"
                  label="Тип аутентификации SMTP"
                  :items="authenticationTypeOptions"
                  item-title="title"
                  item-value="value"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField
                  v-model="editedItem.smtpFromEmail"
                  label="Email отправителя *"
                  placeholder="noreply@example.com"
                  type="email"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField
                  v-model="editedItem.smtpFromName"
                  label="Имя отправителя"
                  placeholder="Service Desk"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VSwitch
                  v-model="editedItem.useForOutgoing"
                  label="Использовать для исходящих писем"
                  color="primary"
                />
              </VCol>

              <VCol cols="12" class="d-flex gap-2">
                <VBtn
                  color="secondary"
                  variant="tonal"
                  :disabled="testingSmtpRowId === editedItem.id"
                  @click="handleTestSmtp"
                >
                  <VProgressCircular
                    v-if="testingSmtpRowId === editedItem.id"
                    indeterminate
                    size="18"
                    width="2"
                    color="primary"
                  />
                  <span v-else>Проверить SMTP подключение</span>
                </VBtn>
              </VCol>
            </VRow>
          </VCardText>
        </VWindowItem>
      </VWindow>
    </VCardText>

    <VCardText>
      <div class="self-align-end d-flex gap-4 justify-end">
        <VBtn
          color="secondary"
          variant="tonal"
          :disabled="testingRowId === -1"
          @click="handleTestConnection"
        >
          <VProgressCircular
            v-if="testingRowId === -1"
            indeterminate
            size="18"
            width="2"
            color="primary"
          />
          <span v-else>Проверить IMAP подключение</span>
        </VBtn>

        <VBtn
          color="error"
          variant="outlined"
          @click="handleCancel"
        >
          Отмена
        </VBtn>
        <VBtn
          color="success"
          variant="elevated"
          @click="handleSave"
        >
          Сохранить
        </VBtn>
      </div>
    </VCardText>

    <VSnackbar
      v-model="isToastVisible"
      :color="toastColor"
      timeout="3000"
    >
      {{ toastMessage }}
    </VSnackbar>
  </VCard>
</template>
