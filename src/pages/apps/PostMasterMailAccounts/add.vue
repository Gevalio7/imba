<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { $api } from '@/utils/api'
import { useGlobalPermissions } from '@/composables/useGlobalPermissions'
// Временный импорт простой формы
import SimpleForm from '@/components/PostMaster/SimpleForm.vue'

const router = useRouter()
const { ensureLoaded } = useGlobalPermissions()

definePage({
  meta: {
    navActiveLink: 'apps-post-master-mail-accounts',
    action: 'create',
    subject: 'menu_post_master_mail_accounts'
  }
})

const queues = ref<any[]>([])
const loading = ref(false)
const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

const fetchQueues = async () => {
  try {
    loading.value = true
    const data = await $api<{ queues: any[]; total: number }>(`/queues`)
    queues.value = data.queues
    console.log('Queues loaded:', queues.value.length)
  }
  catch (err) {
    console.error('Error fetching queues:', err)
  }
  finally {
    loading.value = false
  }
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
    console.log('Saving data:', data)
    // smtpSecure уже конвертирован в SimpleForm.onSubmit, но на всякий случай
    const saveData = {
      ...data,
      type: 'IMAP',
      authenticationType: 'password',
      isActive: true,
      dispatchingBy: 'Queue',
      trusted: false,
    }
    // Конвертируем smtpSecure в boolean если остался строкой
    if (saveData.smtpSecure === 'none' || saveData.smtpSecure === 'starttls') {
      saveData.smtpSecure = false
    }
    else if (saveData.smtpSecure === 'ssl') {
      saveData.smtpSecure = true
    }
    await $api(`/postMasterMailAccounts`, {
      method: 'POST',
      body: saveData,
    })
    showToast('Почтовый аккаунт успешно создан')
    router.push('/apps/PostMasterMailAccounts')
  }
  catch (err) {
    console.error('Error creating account:', err)
    showToast('Ошибка создания почтового аккаунта', 'error')
  }
}

const handleCancel = () => {
  router.push('/apps/PostMasterMailAccounts')
}

onMounted(async () => {
  await ensureLoaded()
  await fetchQueues()
})
</script>

<template>
  <div>
    <div class="d-flex flex-wrap justify-start justify-sm-space-between gap-y-4 gap-x-6 mb-6">
      <div class="d-flex flex-column justify-center">
        <h4 class="text-h4 mb-1">
          Создание почтового аккаунта (ТЕСТ)
        </h4>
        <div class="text-body-1">
          Упрощенная форма для тестирования
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
      <VProgressCircular indeterminate color="primary" />
    </div>

    <VRow v-else>
      <VCol cols="12">
<SimpleForm
           mode="create"
           :queues="queues"
           @save="handleSave"
           @cancel="handleCancel"
         />

         <VSnackbar v-model="isToastVisible" :color="toastColor" location="top">
           {{ toastMessage }}
         </VSnackbar>
       </VCol>
     </VRow>
   </div>
 </template>
