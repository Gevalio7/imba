<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { $api } from '@/utils/api'
import PostMasterMailAccountForm from '@/pages/apps/PostMasterMailAccountForm.vue'


const router = useRouter()

definePage({
  meta: {
    navActiveLink: 'apps-post-master-mail-accounts',
    action: 'create',
    subject: 'menu_post_master_mail_accounts'
  }
})

const queues = ref<any[]>([])
const queuesLoading = ref(false)

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

const fetchQueues = async () => {
  try {
    queuesLoading.value = true
    const data = await $api<{ queues: any[]; total: number }>(`/queues`)
    queues.value = data.queues
  }
  catch (err) {
    console.error('Error fetching queues:', err)
  }
  finally {
    queuesLoading.value = false
  }
}

const handleSave = async (data: any) => {
  try {
    await $api(`/postMasterMailAccounts`, {
      method: 'POST',
      body: data,
    })
    router.push('/apps/PostMasterMailAccounts')
  }
  catch (err) {
    console.error('Error creating account:', err)
  }
}

const handleCancel = () => {
  router.push('/apps/PostMasterMailAccounts')
}

onMounted(async () => {
  await fetchQueues()
})
</script>

<template>
  <div>
    <div class="d-flex flex-wrap justify-start justify-sm-space-between gap-y-4 gap-x-6 mb-6">
      <div class="d-flex flex-column justify-center">
        <h4 class="text-h4 mb-1">
          Создание почтового аккаунта
        </h4>
        <div class="text-body-1">
          Заполните данные для создания нового почтового аккаунта
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

    <VRow>
      <VCol cols="12">
<PostMasterMailAccountForm
           mode="create"
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
         />
      </VCol>
    </VRow>
  </div>
</template>
