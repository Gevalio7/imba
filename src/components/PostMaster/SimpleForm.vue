<script setup lang="ts">
import { reactive, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  mode: 'create' | 'edit'
  queues: any[]
  initialData?: any
  testingRowId?: number | null
  testingSmtpRowId?: number | null
  canTestForm?: boolean
}>(), {
  initialData: undefined,
  testingRowId: null,
  testingSmtpRowId: null,
  canTestForm: false,
})

const emit = defineEmits<{
  save: [data: any]
  cancel: []
  testConnection: [item: any]
  testSmtp: [account: any]
}>()

const form = reactive<any>({
  id: undefined,
  name: '',
  type: 'IMAP',
  login: '',
  password: '',
  host: '',
  port: 143,
  imapFolder: 'INBOX',
  trusted: false,
  dispatchingBy: 'Queue',
  queueId: undefined,
  authenticationType: 'password',
  comment: '',
  oauth2TokenConfigID: undefined,
  isActive: true,
  smtpHost: undefined,
  smtpPort: undefined,
  smtpSecure: 'none',
  smtpUser: undefined,
  smtpPassword: undefined,
  smtpAuthType: undefined,
  smtpFromEmail: undefined,
  smtpFromName: undefined,
  useForOutgoing: false,
})

const passwordVisible = ref(false)
const smtpPasswordVisible = ref(false)

watch(() => props.initialData, (val) => {
  if (val) {
    console.log('SimpleForm: initialData received', val)
    // Нормализуем данные для селектов
    const normalizedData: any = { ...val }
    // smtpSecure приходит как boolean, преобразуем в строку
    if (normalizedData.smtpSecure === false) {
      normalizedData.smtpSecure = 'none'
    }
    else if (normalizedData.smtpSecure === true) {
      normalizedData.smtpSecure = 'ssl'
    }
    else if (normalizedData.smtpSecure === null || normalizedData.smtpSecure === undefined) {
      normalizedData.smtpSecure = 'none'
    }
    // imapFolder приходит пустой строкой, ставим значение по умолчанию
    if (normalizedData.imapFolder === '' || normalizedData.imapFolder === null || normalizedData.imapFolder === undefined) {
      normalizedData.imapFolder = 'INBOX'
    }
    // Преобразуем null в undefined для select-ов (Vuetify не работает с null)
    Object.keys(normalizedData).forEach(key => {
      if (normalizedData[key] === null) {
        normalizedData[key] = undefined
      }
    })
    // Удаляем только служебные поля
    delete normalizedData.createdAt
    delete normalizedData.updatedAt
    // Копируем все поля из initialData в form, кроме служебных
    Object.keys(normalizedData).forEach(key => {
      (form as any)[key] = normalizedData[key]
    })
    console.log('SimpleForm: form updated', form)
  }
}, { deep: true, immediate: true })

const typeOptions = [
  { title: 'IMAP', value: 'IMAP' },
  { title: 'IMAPS', value: 'IMAPS' },
  { title: 'IMAPTLS', value: 'IMAPTLS' },
  { title: 'MSGraph', value: 'MSGraph' },
  { title: 'POP3', value: 'POP3' },
  { title: 'POP3S', value: 'POP3S' },
  { title: 'POP3TLS', value: 'POP3TLS' },
]

const authenticationTypeOptions = [
  { title: 'OAuth2 Token', value: 'oauth2_token' },
  { title: 'Password', value: 'password' },
]

const smtpSecureOptions = [
  { title: 'None', value: 'none' },
  { title: 'STARTTLS', value: 'starttls' },
  { title: 'SSL/TLS', value: 'ssl' },
]

const dispatchingByOptions = [
  { title: 'Queue', value: 'Queue' },
  { title: 'From', value: 'From' },
]

const onCancel = () => emit('cancel')
const onSubmit = () => {
  // Конвертируем smtpSecure обратно в boolean для бэкенда
  const formData: any = { ...form }
  if (formData.smtpSecure === 'none' || formData.smtpSecure === 'starttls') {
    formData.smtpSecure = false
  }
  else if (formData.smtpSecure === 'ssl') {
    formData.smtpSecure = true
  }
  else {
    // Удаляем если неопределено
    delete formData.smtpSecure
  }
  // Удаляем id и служебные поля при сохранении
  delete formData.id
  delete formData.createdAt
  delete formData.updatedAt
  emit('save', formData)
}
const testConnection = () => emit('testConnection', form)
const testSmtpConnection = () => emit('testSmtp', form)
</script>

<template>
  <VCard title="Почтовый аккаунт">
    <VCardText>
      <VRow>
        <VCol cols="12" md="6">
          <AppTextField v-model="form.name" label="Название *" required />
        </VCol>
        <VCol cols="12" md="6">
          <AppSelect v-model="form.type" :items="typeOptions" item-title="title" item-value="value" label="Тип *" required />
        </VCol>
        <VCol cols="12" md="6">
          <AppTextField v-model="form.login" label="Логин *" required />
        </VCol>
        <VCol cols="12" md="6">
          <AppTextField
            v-model="form.password"
            label="Пароль"
            :type="passwordVisible ? 'text' : 'password'"
          >
            <template #append-inner>
              <VIcon
                :icon="passwordVisible ? 'bx-show' : 'bx-hide'"
                @click="passwordVisible = !passwordVisible"
                style="cursor: pointer;"
              />
            </template>
          </AppTextField>
        </VCol>
        <VCol cols="12" md="6">
          <AppTextField v-model="form.host" label="Хост *" required />
        </VCol>
        <VCol cols="12" md="6">
          <AppTextField v-model="form.port" label="Порт" type="number" />
        </VCol>
        <VCol cols="12" md="6">
          <AppSelect v-model="form.authenticationType" :items="authenticationTypeOptions" item-title="title" item-value="value" label="Тип аутентификации" />
        </VCol>
        <VCol cols="12" md="6">
          <AppTextField v-model="form.imapFolder" label="Папка IMAP" />
        </VCol>
        <VCol cols="12" md="6">
          <AppSelect v-model="form.dispatchingBy" :items="dispatchingByOptions" item-title="title" item-value="value" label="Маршрутизация" />
        </VCol>
        <VCol cols="12" md="6" v-if="form.dispatchingBy === 'Queue'">
          <AppSelect v-model="form.queueId" :items="queues" item-title="name" item-value="id" label="Очередь" clearable />
        </VCol>
        <VCol cols="12">
          <AppTextField v-model="form.comment" label="Комментарий" multiline rows="3" />
        </VCol>
        <VCol cols="12">
          <VSwitch v-model="form.isActive" color="primary" label="Активен" />
        </VCol>
        <VCol cols="12">
          <VSwitch v-model="form.trusted" color="primary" label="Доверенный" />
        </VCol>

        <VCol cols="12">
          <h6 class="text-h6 mb-4">SMTP настройки</h6>
          <VRow>
            <VCol cols="12" md="6">
              <AppTextField v-model="form.smtpHost" label="SMTP хост" />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField v-model="form.smtpPort" label="SMTP порт" type="number" />
            </VCol>
            <VCol cols="12" md="6">
              <AppSelect v-model="form.smtpSecure" :items="smtpSecureOptions" item-title="title" item-value="value" label="SMTP безопасность" />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField v-model="form.smtpUser" label="SMTP пользователь" />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="form.smtpPassword"
                label="SMTP пароль"
                :type="smtpPasswordVisible ? 'text' : 'password'"
              >
                <template #append-inner>
                  <VIcon
                    :icon="smtpPasswordVisible ? 'bx-show' : 'bx-hide'"
                    @click="smtpPasswordVisible = !smtpPasswordVisible"
                    style="cursor: pointer;"
                  />
                </template>
              </AppTextField>
            </VCol>
            <VCol cols="12" md="6">
              <AppSelect v-model="form.smtpAuthType" :items="[{ title: 'password', value: 'password' }, { title: 'none', value: 'none' }]" item-title="title" item-value="value" label="SMTP аутентификация" />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField v-model="form.smtpFromEmail" label="SMTP от (email)" />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField v-model="form.smtpFromName" label="SMTP от (имя)" />
            </VCol>
            <VCol cols="12">
              <VSwitch v-model="form.useForOutgoing" color="primary" label="Использовать для исходящей почты" />
            </VCol>
          </VRow>
        </VCol>
      </VRow>
    </VCardText>

    <VDivider />

    <VCardText class="d-flex justify-end gap-4">
      <VBtn variant="tonal" color="secondary" @click="onCancel">Отмена</VBtn>
      <VBtn v-if="mode === 'edit'" variant="tonal" color="secondary" prepend-icon="bx-search" :disabled="testingRowId !== null || testingSmtpRowId !== null" @click="testConnection">Тест IMAP</VBtn>
      <VBtn v-if="mode === 'edit'" variant="tonal" color="secondary" prepend-icon="bx-envelope" :disabled="testingRowId !== null || testingSmtpRowId !== null" @click="testSmtpConnection">Тест SMTP</VBtn>
      <VBtn color="primary" @click="onSubmit">{{ mode === 'create' ? 'Создать' : 'Сохранить' }}</VBtn>
    </VCardText>
  </VCard>
</template>
