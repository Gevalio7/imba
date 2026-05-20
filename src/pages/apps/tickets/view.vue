<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReferenceData } from '@/composables/useReferenceData'
import { useTicketForm } from '@/composables/useTicketForm'

definePage({
  meta: {
    navActiveLink: 'apps-tickets',
    action: 'read',
    subject: 'menu_tickets_list',
  },
})

const router = useRouter()
const route = useRoute()

const ticketId = computed(() => {
  const id = route.query.id

  return id ? Number(id) : null
})

const { data: refData, fetchAll: loadReferenceData } = useReferenceData()

const {
  ticket,
  description,
  fetchTicket,
} = useTicketForm(ticketId)

onMounted(async () => {
  await loadReferenceData()
  await fetchTicket()
})

const formatDate = (dateStr: string | null) => {
  if (!dateStr)
    return '-'
  const date = new Date(dateStr)

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Формат отображения автора
const ownerDisplay = computed(() => {
  const owner = ticket.ownerId

  // Если owner это объект (VAutocomplete return-object)
  if (!owner)
    return '-'
  try {
    if (typeof owner === 'object') {
      // Если есть удобное поле title (используется в VAutocomplete)
      if ((owner as any).title)
        return (owner as any).title

      // Поля firstName/lastName/email/login
      const fn = (owner as any).firstName || ''
      const ln = (owner as any).lastName || ''
      const login = (owner as any).login || ''
      const email = (owner as any).email ? ` (${(owner as any).email})` : ''
      const name = `${fn} ${ln}`.trim()
      if (name)
        return `${name}${email}`.trim()
      if (login)
        return `${login}${email}`.trim()
    }

    // Если owner это число (id) — ищем в справочнике customerUsers
    if (typeof owner === 'number') {
      const u = (refData.customerUsers || []).find((c: any) => c && c.id === owner)
      if (u) {
        const name = `${u.firstName || ''} ${u.lastName || ''}`.trim()
        const email = u.email ? ` (${u.email})` : ''
        const company = u.customerName ? ` [${u.customerName}]` : ''

        return `${name || u.login || 'Неизвестно'}${email}${company}`
      }
    }

    // Если owner это строка (возможно email)
    if (typeof owner === 'string')
      return owner
  }
  catch (e) {
    console.error('Error formatting owner display:', e)
  }

  return '-'
})

const goBack = () => router.push('/apps/tickets')
</script>

<template>
  <div>
    <div class="d-flex flex-wrap justify-start justify-sm-space-between gap-y-4 gap-x-6 mb-6">
      <div class="d-flex flex-column justify-center">
        <h4 class="text-h4 mb-1">
          Просмотр обращения
        </h4>
        <div class="text-body-1">
          #{{ ticket.ticketNumber }}
        </div>
      </div>
      <div class="d-flex gap-4 align-center flex-wrap">
        <VBtn
          variant="tonal"
          color="secondary"
          @click="goBack"
        >
          Назад
        </VBtn>
      </div>
    </div>

    <VRow>
      <VCol
        cols="12"
        md="8"
      >
        <VCard class="mb-6">
          <VCardTitle class="d-flex align-center px-6 py-4">
            <h5 class="text-h5">
              Основная информация
            </h5>
          </VCardTitle>
          <VCardText>
            <div class="mb-4">
              <h6 class="text-subtitle-1">
                Заголовок
              </h6>
              <div class="text-body-1">
                {{ ticket.title || '-' }}
              </div>
            </div>

            <div class="mb-4">
              <h6 class="text-subtitle-1">
                Описание
              </h6>
              <div
                v-if="description"
                class="prose"
                v-html="description"
              />
              <div
                v-else
                class="text-body-2 text-medium-emphasis"
              >
                Нет описания
              </div>
            </div>

            <div class="mb-4">
              <h6 class="text-subtitle-1">
                Вложения
              </h6>
              <div v-if="ticket.id">
                <!-- Простое отображение списка вложений будет загружаться отдельно через API при необходимости -->
                <div class="text-body-2 text-medium-emphasis">
                  Вложения можно просмотреть на странице редактирования (если есть права)
                </div>
              </div>
              <div
                v-else
                class="text-body-2 text-medium-emphasis"
              >
                -
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="4"
      >
        <VCard class="mb-6">
          <VCardTitle class="d-flex align-center px-6 py-4">
            <h5 class="text-h5">
              Свойства
            </h5>
          </VCardTitle>
          <VCardText>
            <div class="d-flex flex-column gap-y-3">
              <div><strong>Тип:</strong> {{ (refData.types || []).find(t => t.id === ticket.typeId)?.name || '-' }}</div>
              <div><strong>Категория:</strong> {{ (refData.typeCategories || []).find(c => c.id === ticket.categoryId)?.name || '-' }}</div>
              <div><strong>Приоритет:</strong> {{ (refData.priorities || []).find(p => p.id === ticket.priorityId)?.name || '-' }}</div>
              <div><strong>Очередь:</strong> {{ (refData.queues || []).find(q => q.id === ticket.queueId)?.name || '-' }}</div>
              <div><strong>Статус:</strong> {{ (refData.states || []).find(s => s.id === ticket.stateId)?.name || '-' }}</div>
              <div><strong>Автор:</strong> {{ ownerDisplay }}</div>
              <div><strong>Компания:</strong> {{ (refData.customers || []).find(c => c.id === ticket.companyId)?.name || '-' }}</div>
              <div><strong>Сервис:</strong> {{ (refData.services || []).find(s => s.id === ticket.serviceId)?.name || '-' }}</div>
              <div><strong>Создано:</strong> {{ formatDate(ticket.createdAt) }}</div>
              <div><strong>Обновлено:</strong> {{ formatDate(ticket.updatedAt) }}</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.prose {
  line-height: 1.6;
}
</style>
