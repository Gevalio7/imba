<template>
  <div>
    <div class="d-flex flex-wrap justify-start justify-sm-space-between gap-y-4 gap-x-6 mb-6">
      <div class="d-flex flex-column justify-center">
        <h4 class="text-h4 mb-1">
          Редактирование почтового аккаунта
        </h4>
        <div class="text-body-1">
          Измените данные почтового аккаунта
        </div>
      </div>

      <div class="d-flex gap-4 align-center flex-wrap">
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="bx-arrow-back"
          @click="handleCancel"
        >
          Назад к списку
        </VBtn>
      </div>
    </div>

    <div
      v-if="loading"
      class="d-flex justify-center pa-6"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>

    <template v-else-if="account">
      <VRow>
        <VCol cols="12">
          <PostMasterMailAccountForm
            mode="edit"
            :initial-data="account"
            :queues="queues"
            :type-options="typeOptions"
            :authentication-type-options="authenticationTypeOptions"
            :smtp-secure-options="smtpSecureOptions"
            :dispatching-by-options="dispatchingByOptions"
            :testing-row-id="testingRowId"
            :testing-smtp-row-id="testingSmtpRowId"
            :can-test-form="canTestForm"
            @save="handleSave"
            @cancel="handleCancel"
            @test-connection="testConnection"
            @test-smtp="testSmtpConnection"
          />
        </VCol>
      </VRow>
    </template>

    <VSnackbar
      v-model="isToastVisible"
      :color="toastColor"
      timeout="3000"
    >
      {{ toastMessage }}
    </VSnackbar>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { $api } from '@/utils/api'
import { useGlobalPermissions } from '@/composables/useGlobalPermissions'
import PostMasterMailAccountForm from '@/pages/apps/PostMasterMailAccountForm.vue'

const router = useRouter()
const route = useRoute()
const { ensureLoaded } = useGlobalPermissions()

definePage({
  meta: {
    navActiveLink: 'apps-post-master-mail-accounts',
    action: 'update',
    subject: 'menu_post_master_mail_accounts'
  }
})

const account = ref<any | null>(null)
const loading = ref(true)
const queues = ref<any[]>([])

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

const testingRowId = ref<number | null>(null)
const testingSmtpRowId = ref<number | null>(null)
const canTestForm = ref(false)
const saving = ref(false)
const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const fetchQueues = async () => {
  try {
    const data = await $api<{ queues: any[]; total: number }>(`/queues`)
    queues.value = data.queues
  }
  catch (err) {
    console.error('Error fetching queues:', err)
  }
}

const fetchAccount = async (id: number) => {
  try {
    loading.value = true
    console.log('Fetching account with ID:', id)
    const data = await $api<any>(`/postMasterMailAccounts/${id}`)
    console.log('API response:', data)
    account.value = data
  }
  catch (err) {
    console.error('Error fetching account:', err)
    showToast('Ошибка загрузки почтового аккаунта', 'error')
  }
  finally {
    loading.value = false
  }
}

const handleSave = async (data: any) => {
  try {
    saving.value = true
    const id = Number(route.params.id)
    await $api(`/postMasterMailAccounts/${id}`, {
      method: 'PUT',
      body: data,
    })
    router.push('/apps/PostMasterMailAccounts')
  }
  catch (err) {
    console.error('Error updating account:', err)
  }
  finally {
    saving.value = false
  }
}

const handleCancel = () => {
  router.push('/apps/PostMasterMailAccounts')
}

const testConnection = async () => {
  testingRowId.value = Number(route.params.id)
  try {
    await $api(`/postMasterMailAccounts/${route.params.id}/test`, {
      method: 'POST',
    })
  }
  catch (err) {
    console.error('Error testing connection:', err)
  }
  finally {
    testingRowId.value = null
  }
}

const testSmtpConnection = async () => {
  testingSmtpRowId.value = Number(route.params.id)
  try {
    await $api(`/postMasterMailAccounts/${route.params.id}/test-smtp`, {
      method: 'POST',
    })
  }
  catch (err) {
    console.error('Error testing SMTP connection:', err)
  }
  finally {
    testingSmtpRowId.value = null
  }
}

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

onMounted(async () => {
  await ensureLoaded()
  await fetchQueues()
  const id = Number(route.params.id)
  await fetchAccount(id)
})
</script>

