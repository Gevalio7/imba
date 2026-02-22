<script setup lang="ts">
// Настройки заявки: быстрые переходы к разделам.
// Важно: это НЕ "виджеты с кнопкой". Карточка сама кликабельна (как на дашбордах)
// и имеет иконку с подсветкой + счетчик записей.

type TicketSettingsWidget = {
  title: string
  description: string
  icon: string
  color: string
  // Пока без API — показываем 0. Позже можно подцепить реальные количества.
  count: number
  to: { name: string }
}

const widgets: TicketSettingsWidget[] = [
  {
    title: 'Автоответы',
    description: 'Создание и управление автоматическими ответами.',
    icon: 'bx-reply',
    color: 'primary',
    count: 0,
    to: { name: 'apps-settings-ticket-settings-AutoResponses' },
  },
  {
    title: 'Очереди',
    description: 'Создание очередей и управление ими.',
    icon: 'bx-list-ul',
    color: 'success',
    count: 0,
    to: { name: 'apps-settings-ticket-settings-Queues' },
  },
  {
    title: 'Подписи',
    description: 'Создание подписей и управление ими.',
    icon: 'bx-pen',
    color: 'secondary',
    count: 0,
    to: { name: 'apps-settings-ticket-settings-Signatures' },
  },
  {
    title: 'Приветствия',
    description: 'Создание приветствий и управление ими.',
    icon: 'bx-message-rounded-dots',
    color: 'warning',
    count: 0,
    to: { name: 'apps-settings-ticket-settings-Greetings' },
  },
  {
    title: 'Прикрепленные файлы',
    description: 'Создание вложений и управление ими.',
    icon: 'bx-paperclip',
    color: 'error',
    count: 0,
    to: { name: 'apps-settings-ticket-settings-Attachments' },
  },
  {
    title: 'Приоритеты',
    description: 'Создание приоритетов заявок и управление ими.',
    icon: 'bx-flag',
    color: 'primary',
    count: 0,
    to: { name: 'apps-settings-ticket-settings-Priorities' },
  },
  {
    title: 'Сервисы',
    description: 'Создание и управление сервисами.',
    icon: 'bx-briefcase-alt-2',
    color: 'success',
    count: 0,
    to: { name: 'apps-settings-ticket-settings-Services' },
  },
  {
    title: 'SLA',
    description: 'Соглашения об уровне сервиса и управление ими.',
    icon: 'bx-timer',
    color: 'warning',
    count: 0,
    to: { name: 'apps-settings-ticket-settings-SLA' },
  },
  {
    title: 'Состояния',
    description: 'Создание состояний заявок и управление ими.',
    icon: 'bx-toggle-left',
    color: 'info',
    count: 0,
    to: { name: 'apps-settings-ticket-settings-States' },
  },
  {
    title: 'Воркфлоу',
    description: 'Визуальный редактор жизненных циклов тикетов.',
    icon: 'bx-network-chart',
    color: 'success',
    count: 0,
    to: { name: 'apps-settings-ticket-settings-Workflows' },
  },
  {
    title: 'Типы',
    description: 'Создание типов заявок и управление ими.',
    icon: 'bx-category',
    color: 'secondary',
    count: 0,
    to: { name: 'apps-settings-ticket-settings-Types' },
  },
  {
    title: 'Шаблоны',
    description: 'Создание шаблонов и управление ими.',
    icon: 'bx-file',
    color: 'primary',
    count: 0,
    to: { name: 'apps-settings-ticket-settings-Templates' },
  },
  {
    title: 'Шаблоны ↔️ Вложения',
    description: 'Связать шаблоны с вложениями.',
    icon: 'bx-link',
    color: 'error',
    count: 0,
    to: { name: 'apps-settings-ticket-settings-TemplateAttachments' },
  },
  {
    title: 'Шаблоны ↔️ Очереди',
    description: 'Связать шаблоны с очередями.',
    icon: 'bx-link',
    color: 'success',
    count: 0,
    to: { name: 'apps-settings-ticket-settings-TemplateQueues' },
  },
]
</script>

<template>
  <VCard
    title="Настройки заявки"
    subtitle="Быстрый доступ к разделам (карточки кликабельны)"
  >
    <VCardText>
      <VRow class="match-height">
        <VCol
          v-for="w in widgets"
          :key="w.to.name"
          cols="12"
          sm="6"
          lg="4"
        >
          <VCard
            class="ticket-settings-widget"
            hover
            link
            :to="w.to"
          >
            <VCardText class="d-flex align-center justify-space-between gap-4">
              <div class="d-flex align-center gap-3">
                <VAvatar
                  rounded
                  size="44"
                  variant="tonal"
                  :color="w.color"
                >
                  <VIcon
                    :icon="w.icon"
                    size="22"
                  />
                </VAvatar>

                <div>
                  <div class="text-body-1 font-weight-medium">
                    {{ w.title }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ w.description }}
                  </div>
                </div>
              </div>

              <div class="d-flex flex-column align-end">
                <VChip
                  size="small"
                  :color="w.color"
                  variant="tonal"
                >
                  {{ w.count }}
                </VChip>
                <span class="text-caption text-medium-emphasis mt-1">
                  записей
                </span>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.ticket-settings-widget {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.ticket-settings-widget:hover {
  transform: translateY(-2px);
}
</style>
