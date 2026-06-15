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

    <div v-if="loading" class="d-flex justify-center pa-6">
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>

    <div v-else-if="account">
      <VRow>
        <VCol cols="12">
          <SimpleForm
            :key="account?.id"
            mode="edit"
            :initial-data="account"
            :queues="queues"
            :testing-row-id="testingRowId"
            :testing-smtp-row-id="testingSmtpRowId"
            @save="handleSave"
            @cancel="handleCancel"
            @test-connection="testConnectionForItem"
            @test-smtp="testSmtpConnection"
          />
        </VCol>
      </VRow>
    </div>

    <div v-else class="d-flex justify-center pa-6">
      <VAlert type="warning">
        Почтовый аккаунт не найден или у вас нет прав на его просмотр
      </VAlert>
    </div>

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
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { $api } from '@/utils/api'
import SimpleForm from '@/components/PostMaster/SimpleForm.vue'

const router = useRouter()
const route = useRoute()

definePage({
  meta: {
    navActiveLink: 'apps-post-master-mail-accounts',
    action: 'update',
    subject: 'menu_post_master_mail_accounts'
  }
})

const ticketId = computed(() => {
  const id = route.query.id
  return id ? Number(id) : null
})

const account = ref<any | null>(null)
const loading = ref(true)
const queues = ref<any[]>([])
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

const testingRowId = ref<number | null>(null)
const testingSmtpRowId = ref<number | null>(null)

const testConnectionForItem = async (item: any) => {
  try {
    testingRowId.value = item.id
    const res = await $api(`/postMasterMailAccounts/${item.id}/test`, {
      method: 'POST',
    })
    if (res && res.success) {
      showToast('Подключение успешно: сервер ответил, логин и пароль верны', 'success')
    }
    else {
      const msg = getApiErrorMessage(res)
      showToast(`Ошибка подключения: ${msg}`, 'error')
    }
  }
  catch (err: any) {
    console.error('Error testing connection for item:', err)
    const msg = getApiErrorMessage(err)
    showToast(`Ошибка подключения: ${msg}`, 'error')
  }
  finally {
    testingRowId.value = null
  }
}

const testSmtpConnection = async (account: any) => {
  try {
    testingSmtpRowId.value = account.id
    const res = await $api(`/postMasterMailAccounts/${account.id}/test-smtp`, {
      method: 'POST',
    })
    if (res && res.success) {
      showToast('SMTP подключение успешно', 'success')
    }
    else {
      const msg = getApiErrorMessage(res)
      showToast(`Ошибка SMTP: ${msg}`, 'error')
    }
  }
  catch (err: any) {
    console.error('Error testing SMTP connection:', err)
    const msg = getApiErrorMessage(err)
    // Детали ошибки в консоль
    console.log('SMTP error details:', {
      message: err?.message,
      data: err?.data,
      response: err?.response?._data,
      url: err?.response?.url,
      status: err?.response?.status,
    })
    showToast(`Ошибка SMTP: ${msg}`, 'error')
  }
  finally {
    testingSmtpRowId.value = null
  }
}

const getApiErrorMessage = (errOrRes: any): string => {
  if (!errOrRes)
    return 'Неизвестная ошибка'
  const data = errOrRes?.data ?? errOrRes?.response?._data ?? errOrRes?.data?.data ?? errOrRes
  if (data?.message)
    return data.message
  if (typeof data === 'string')
    return data
  if (data?.error)
    return data.error
  if (errOrRes?.message)
    return errOrRes.message
  if (errOrRes?.response?.statusText)
    return errOrRes.response.statusText
  return 'Неизвестная ошибка'
}

const handleSave = async (data: any) => {
  // Валидация обязательных полей
  if (!data.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }
  
  if (!data.login?.trim()) {
    showToast('Логин обязателен для заполнения', 'error')
    return
  }
  
  if (!data.host?.trim()) {
    showToast('Хост обязателен для заполнения', 'error')
    return
  }

  try {
    saving.value = true
    if (ticketId.value) {
      await $api(`/postMasterMailAccounts/${ticketId.value}`, {
        method: 'PUT',
        body: data,
      })
    }
    showToast('Почтовый аккаунт успешно обновлён')
    router.push('/apps/PostMasterMailAccounts')
  }
  catch (err) {
    console.error('Error updating account:', err)
    showToast('Ошибка обновления почтового аккаунта', 'error')
  }
  finally {
    saving.value = false
  }
}

const handleCancel = () => {
  router.push('/apps/PostMasterMailAccounts')
}

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

onMounted(async () => {
  await fetchQueues()
  if (ticketId.value) {
    await fetchAccount(ticketId.value)
  } else {
    console.warn('No ticket ID in query params')
    loading.value = false
  }
})
</script>

