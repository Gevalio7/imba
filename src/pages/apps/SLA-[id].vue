<script setup lang="ts">
import { $fetch } from 'ofetch';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Типы данных для SLA
interface SLA {
   id: number
   name: string
   description: string
   type: string // тип SLA
   responseTime: number // в минутах - время первого ответа
   resolutionTime: number // в минутах - время обновления
   solutionTime: number // в минутах - время решения
   minIncidentTime: number // в минутах - минимальное время между инцидентами
   responseNotification: number // процент уведомления для первого ответа
   updateNotification: number // процент уведомления для обновления
   solutionNotification: number // процент уведомления для решения
   calendarId?: number
   calendarName?: string
   serviceIds?: number[]
   serviceNames?: string[]
   isActive: boolean
   createdAt: string
   updatedAt: string
}

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Роутер
const route = useRoute()
const router = useRouter()

const numberedSteps = [
  {
    title: 'Основное',
    subtitle: 'Настройка основных параметров',
  },
  {
    title: 'Эскалации',
    subtitle: 'Настройка времени эскалаций',
  },
  {
    title: 'Календарь и сервисы',
    subtitle: 'Выбор календаря и сервисов',
  },
]

const currentStep = ref(0)


// Данные
const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)

// Справочники
const calendars = ref([])
const services = ref([])

// Загрузка справочников
const fetchCalendars = async () => {
   try {
     const data = await $fetch(`${API_BASE}/calendars`)
     calendars.value = data.calendars || []
   } catch (err) {
     console.log('Error fetching calendars:', err)
   }
}

const fetchServices = async () => {
   try {
     const data = await $fetch(`${API_BASE}/services`)
     services.value = data.services || []
   } catch (err) {
     console.log('Error fetching services:', err)
   }
}

// Форма
const sla = ref<SLA>({
   id: -1,
   name: '',
   description: '',
   type: '',
   responseTime: 15,
   resolutionTime: 4,
   solutionTime: 0,
   minIncidentTime: 10,
   responseNotification: 20,
   updateNotification: 80,
   solutionNotification: 80,
   calendarId: undefined,
   serviceIds: [],
   createdAt: '',
   updatedAt: '',
   isActive: true,
})

const isNew = ref(true)

// Загрузка SLA
const fetchSLA = async (id: number) => {
   try {
     loading.value = true
     error.value = null
     const data = await $fetch<SLA>(`${API_BASE}/sla/${id}`)
     sla.value = data
     isNew.value = false
   } catch (err) {
     error.value = 'Ошибка загрузки SLA'
     console.error('Error fetching SLA:', err)
   } finally {
     loading.value = false
   }
}

// Сохранение
const save = async () => {
   if (!sla.value.name?.trim()) {
     showToast('Название обязательно для заполнения', 'error')
     return
   }

   try {
     saving.value = true
     const dataToSend = {
       name: sla.value.name,
       description: sla.value.description,
       type: sla.value.type,
       responseTime: sla.value.responseTime,
       resolutionTime: sla.value.resolutionTime,
       solutionTime: sla.value.solutionTime,
       minIncidentTime: sla.value.minIncidentTime,
       responseNotification: sla.value.responseNotification,
       updateNotification: sla.value.updateNotification,
       solutionNotification: sla.value.solutionNotification,
       calendarId: sla.value.calendarId,
       services: sla.value.serviceIds,
       isActive: sla.value.isActive
     }

     if (isNew.value) {
       await $fetch(`${API_BASE}/sla`, {
         method: 'POST',
         body: dataToSend
       })
       showToast('SLA успешно создан')
     } else {
       await $fetch(`${API_BASE}/sla/${sla.value.id}`, {
         method: 'PUT',
         body: dataToSend
       })
       showToast('SLA успешно сохранен')
     }
     router.push('/apps/settings/ticket-settings/SLA')
   } catch (err) {
     showToast('Ошибка сохранения SLA', 'error')
   } finally {
     saving.value = false
   }
}

// Отмена
const cancel = () => {
   router.push('/apps/SLA')
}

// Инициализация
onMounted(async () => {
   await Promise.all([fetchCalendars(), fetchServices()])
   const id = route.params.id as string
   if (id && id !== 'new') {
     await fetchSLA(parseInt(id))
   }
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
         {{ isNew ? 'Создание SLA' : 'Редактирование SLA' }}
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
             <VWindowItem>
               <VRow>
                 <VCol cols="12">
                   <h6 class="text-h6 font-weight-medium">
                     Основное
                   </h6>
                   <p class="mb-0">
                     Введите основные параметры SLA
                   </p>
                 </VCol>

                 <VCol
                   cols="12"
                   md="6"
                 >
                   <AppTextField
                     v-model="sla.name"
                     label="Название *"
                   />
                 </VCol>

                 <VCol
                   cols="12"
                   md="6"
                 >
                   <AppSelect
                     v-model="sla.type"
                     :items="[
                       { title: 'Доступность', value: 'availability' },
                       { title: 'Время восстановления', value: 'recovery_time' },
                       { title: 'Время реакции', value: 'reaction_time' },
                       { title: 'Другое', value: 'other' },
                       { title: 'Относительная скорость решения', value: 'relative_solution_speed' },
                       { title: 'Ошибки финансовые операции', value: 'financial_operations_errors' }
                     ]"
                     label="Тип SLA"
                     placeholder="Выберите тип SLA"
                   />
                 </VCol>

                 <VCol cols="12">
                   <AppTextarea
                     v-model="sla.description"
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
                     v-model="sla.isActive"
                     label="Активен"
                     color="primary"
                   />
                 </VCol>
               </VRow>
             </VWindowItem>

             <VWindowItem>
               <VRow>
                 <VCol cols="12">
                   <h6 class="text-h6 font-weight-medium">
                     Эскалации
                   </h6>
                   <p class="mb-0">
                     Настройте время эскалаций и уведомлений
                   </p>
                 </VCol>

                 <!-- Блок 1 -->
                 <VCol cols="12">
                   <VCard variant="outlined" class="mb-4">
                     <VCardTitle class="text-subtitle-1">Эскалация - время первого ответа</VCardTitle>
                     <VCardText>
                       <VRow>
                         <VCol cols="12" md="6">
                           <AppTextField
                             v-model="sla.responseTime"
                             label="Время (минут)"
                             type="number"
                             min="0"
                             step="0.25"
                           />
                         </VCol>
                         <VCol cols="12" md="6">
                           <AppTextField
                             v-model="sla.responseNotification"
                             label="Уведомление от (%)"
                             type="number"
                             min="0"
                             max="100"
                           />
                         </VCol>
                       </VRow>
                     </VCardText>
                   </VCard>
                 </VCol>

                 <!-- Блок 2 -->
                 <VCol cols="12">
                   <VCard variant="outlined" class="mb-4">
                     <VCardTitle class="text-subtitle-1">Эскалация - время обновления</VCardTitle>
                     <VCardText>
                       <VRow>
                         <VCol cols="12" md="6">
                           <AppTextField
                             v-model="sla.resolutionTime"
                             label="Время (минут)"
                             type="number"
                             min="0"
                             step="0.25"
                           />
                         </VCol>
                         <VCol cols="12" md="6">
                           <AppTextField
                             v-model="sla.updateNotification"
                             label="Уведомление от (%)"
                             type="number"
                             min="0"
                             max="100"
                           />
                         </VCol>
                       </VRow>
                     </VCardText>
                   </VCard>
                 </VCol>

                 <!-- Блок 3 -->
                 <VCol cols="12">
                   <VCard variant="outlined" class="mb-4">
                     <VCardTitle class="text-subtitle-1">Эскалация - время решения</VCardTitle>
                     <VCardText>
                       <VRow>
                         <VCol cols="12" md="6">
                           <AppTextField
                             v-model="sla.solutionTime"
                             label="Время (минут)"
                             type="number"
                             min="0"
                             step="0.25"
                           />
                         </VCol>
                         <VCol cols="12" md="6">
                           <AppTextField
                             v-model="sla.solutionNotification"
                             label="Уведомление от (%)"
                             type="number"
                             min="0"
                             max="100"
                           />
                         </VCol>
                       </VRow>
                     </VCardText>
                   </VCard>
                 </VCol>

                 <!-- Блок 4 -->
                 <VCol cols="12">
                   <VCard variant="outlined" class="mb-4">
                     <VCardTitle class="text-subtitle-1">Минимальное время между инцидентами</VCardTitle>
                     <VCardText>
                       <VRow>
                         <VCol cols="12" md="6">
                           <AppTextField
                             v-model="sla.minIncidentTime"
                             label="Время (минут)"
                             type="number"
                             min="0"
                             step="0.25"
                           />
                         </VCol>
                       </VRow>
                     </VCardText>
                   </VCard>
                 </VCol>

                 <VCol cols="12">
                   <small class="text-caption">0 — без эскалации - 24 часов = 1440 минут - С учетом только рабочего времени.</small>
                 </VCol>
               </VRow>
             </VWindowItem>

             <VWindowItem>
               <VRow>
                 <VCol cols="12">
                   <h6 class="text-h6 font-weight-medium">
                     Календарь и сервисы
                   </h6>
                   <p class="mb-0">
                     Выберите календарь и сервисы для SLA
                   </p>
                 </VCol>

                 <VCol cols="12" md="6">
                   <VRow>
                     <VCol cols="12">
                       <AppSelect
                         v-model="sla.calendarId"
                         :items="calendars"
                         item-title="name"
                         item-value="id"
                         label="Календарь"
                         clearable
                         placeholder="Выберите календарь"
                       />
                     </VCol>
                     <VCol cols="12">
                       <AppSelect
                         v-model="sla.serviceIds"
                         :items="services"
                         item-title="name"
                         item-value="id"
                         label="Сервисы"
                         multiple
                         chips
                         clearable
                         placeholder="Выберите сервисы"
                       />
                     </VCol>
                   </VRow>
                 </VCol>
                 <VCol cols="12" md="6">
                   <VCard variant="outlined" class="pa-4">
                     <h4>Описание</h4>
                     <p><strong>Календарь:</strong> Определяет рабочие часы и праздники для расчета времени SLA. Время считается только в рабочие часы согласно выбранному календарю.</p>
                     <p><strong>Сервисы:</strong> Список сервисов, к которым применяется данное SLA. SLA будет действовать только для выбранных сервисов.</p>
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
