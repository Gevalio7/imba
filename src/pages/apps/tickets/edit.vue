<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

const router = useRouter()
const route = useRoute()

const ticketId = computed(() => {
  const id = route.query.id
  return id ? Number(id) : null
})

// Данные
const loading = ref(false)
const saving = ref(false)

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
  } catch (err) { console.log('Error fetching priorities:', err) }
}

const fetchQueues = async () => {
  try {
    const data = await $fetch(`${API_BASE}/queues`)
    queues.value = (data as any).queues || []
  } catch (err) { console.log('Error fetching queues:', err) }
}

const fetchStates = async () => {
  try {
    const data = await $fetch(`${API_BASE}/states`)
    states.value = (data as any).states || []
  } catch (err) { console.log('Error fetching states:', err) }
}

const fetchTypes = async () => {
  try {
    const data = await $fetch(`${API_BASE}/types`)
    types.value = (data as any).types || []
  } catch (err) { console.log('Error fetching types:', err) }
}

const fetchAgents = async () => {
  try {
    const data = await $fetch(`${API_BASE}/agents`)
    agents.value = (data as any).agents || []
  } catch (err) { console.log('Error fetching agents:', err) }
}

const fetchCustomers = async () => {
  try {
    const data = await $fetch(`${API_BASE}/customers`)
    customers.value = (data as any).customers || []
  } catch (err) { console.log('Error fetching customers:', err) }
}

const fetchSla = async () => {
  try {
    const data = await $fetch(`${API_BASE}/sla`)
    slaList.value = (data as any).sla || []
  } catch (err) { console.log('Error fetching sla:', err) }
}

// Форма
const ticket = ref({
  id: -1,
  ticketNumber: '',
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

// Загрузка тикета
const fetchTicket = async () => {
  if (!ticketId.value) return

  try {
    loading.value = true
    const data = await $fetch(`${API_BASE}/tickets/${ticketId.value}`)
    const t = data as any
    ticket.value = {
      id: t.id,
      ticketNumber: t.ticketNumber || '',
      title: t.title || '',
      typeId: t.typeId || undefined,
      priorityId: t.priorityId || undefined,
      queueId: t.queueId || undefined,
      stateId: t.stateId || undefined,
      ownerId: t.ownerId || undefined,
      companyId: t.companyId || undefined,
      slaId: t.slaId || undefined,
      isActive: t.isActive !== undefined ? t.isActive : true,
    }
  } catch (err) {
    console.error('Error fetching ticket:', err)
    showToast('Ошибка загрузки тикета', 'error')
  } finally {
    loading.value = false
  }
}

// Сохранение
const save = async () => {
  if (!ticket.value.title?.trim()) {
    showToast('Заголовок обязателен для заполнения', 'error')
    return
  }

  try {
    saving.value = true
    await $fetch(`${API_BASE}/tickets/${ticketId.value}`, {
      method: 'PUT',
      body: ticket.value,
    })
    showToast('Тикет успешно обновлён')
    router.push('/apps/tickets')
  } catch (err) {
    showToast('Ошибка сохранения тикета', 'error')
  } finally {
    saving.value = false
  }
}

// Отмена
const cancel = () => {
  router.push('/apps/tickets')
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
  await fetchTicket()
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
        Редактирование тикета
      </VCardTitle>

      <div v-if="loading" class="d-flex justify-center pa-6">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <VCardText v-else>
        <VRow>
          <VCol cols="12">
            <h6 class="text-h6 font-weight-medium">
              Основное
            </h6>
            <p class="mb-0">
              Редактируйте информацию о тикете
            </p>
          </VCol>

          <VCol cols="12" md="6">
            <AppTextField
              v-model="ticket.ticketNumber"
              label="Номер тикета"
              disabled
            />
          </VCol>

          <VCol cols="12" md="6">
            <AppTextField
              v-model="ticket.title"
              label="Заголовок *"
              placeholder="Введите заголовок тикета"
            />
          </VCol>

          <VCol cols="12" md="6">
            <AppSelect
              v-model="ticket.typeId"
              :items="types"
              item-title="name"
              item-value="id"
              label="Тип"
              placeholder="Выберите тип"
              clearable
            />
          </VCol>

          <VCol cols="12" md="6">
            <AppSelect
              v-model="ticket.priorityId"
              :items="priorities"
              item-title="name"
              item-value="id"
              label="Приоритет"
              placeholder="Выберите приоритет"
              clearable
            />
          </VCol>

          <VCol cols="12" md="6">
            <AppSelect
              v-model="ticket.queueId"
              :items="queues"
              item-title="name"
              item-value="id"
              label="Очередь"
              placeholder="Выберите очередь"
              clearable
            />
          </VCol>

          <VCol cols="12" md="6">
            <AppSelect
              v-model="ticket.stateId"
              :items="states"
              item-title="name"
              item-value="id"
              label="Статус"
              placeholder="Выберите статус"
              clearable
            />
          </VCol>

          <VCol cols="12" md="6">
            <AppSelect
              v-model="ticket.ownerId"
              :items="agents.map((a: any) => ({ name: `${a.firstName || ''} ${a.lastName || ''} (${a.login})`.trim(), id: a.id }))"
              item-title="name"
              item-value="id"
              label="Владелец"
              placeholder="Выберите владельца"
              clearable
            />
          </VCol>

          <VCol cols="12" md="6">
            <AppSelect
              v-model="ticket.companyId"
              :items="customers"
              item-title="name"
              item-value="id"
              label="Компания"
              placeholder="Выберите компанию"
              clearable
            />
          </VCol>

          <VCol cols="12" md="6">
            <AppSelect
              v-model="ticket.slaId"
              :items="slaList"
              item-title="name"
              item-value="id"
              label="SLA"
              placeholder="Выберите SLA"
              clearable
            />
          </VCol>

          <VCol cols="12" md="6">
            <VSwitch
              v-model="ticket.isActive"
              label="Активен"
              color="primary"
              hide-details
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardText v-if="!loading">
        <div class="d-flex flex-wrap gap-4 justify-space-between mt-8">
          <VBtn
            color="secondary"
            variant="tonal"
            @click="cancel"
          >
            Отмена
          </VBtn>

          <VBtn
            color="success"
            :loading="saving"
            @click="save"
          >
            Сохранить
          </VBtn>
        </div>
      </VCardText>
    </VCard>

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
