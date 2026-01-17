<script setup lang="ts">
type CommunicationWidget = {
  titleRu: string
  descriptionRu: string
  icon: string
  color: string
  count: number
  to: { name: string; query: Record<string, string> }
}

const widgets: CommunicationWidget[] = [
  {
    titleRu: 'OAuth2',
    descriptionRu: 'Управление OAuth2 ключами (токенами) и их конфигурациями.',
    icon: 'bx-key',
    color: 'primary',
    count: 0,
    to: { name: 'settings', query: { tab: 'oauth2' } },
  },
  {
    titleRu: 'PGP ключи',
    descriptionRu: 'Управления PGP ключами для шифрования почтовых сообщений.',
    icon: 'bx-lock-alt',
    color: 'success',
    count: 0,
    to: { name: 'settings', query: { tab: 'pgp-keys' } },
  },
  {
    titleRu: 'Адреса электронной почты',
    descriptionRu: 'Задать адрес отправителя для этой системы.',
    icon: 'bx-envelope',
    color: 'info',
    count: 0,
    to: { name: 'settings', query: { tab: 'email-addresses' } },
  },
  {
    titleRu: 'Журнал сеансов связи',
    descriptionRu: 'Показать записи журнала сеансов связи.',
    icon: 'bx-list-check',
    color: 'secondary',
    count: 0,
    to: { name: 'settings', query: { tab: 'communication-log' } },
  },
  {
    titleRu: 'Сертификаты S/MIME',
    descriptionRu: 'Управление S/MIME сертификатами для шифрования почты.',
    icon: 'bx-badge-check',
    color: 'warning',
    count: 0,
    to: { name: 'settings', query: { tab: 'smime-certificates' } },
  },
  {
    titleRu: 'Уведомление администратором',
    descriptionRu: 'Отправить уведомление пользователям.',
    icon: 'bx-bell',
    color: 'error',
    count: 0,
    to: { name: 'settings', query: { tab: 'admin-notification' } },
  },
  {
    titleRu: 'Уведомления о мероприятиях',
    descriptionRu: 'Создание и управление уведомлениями по мероприятиям.',
    icon: 'bx-calendar-event',
    color: 'primary',
    count: 0,
    to: { name: 'settings', query: { tab: 'appointment-notifications' } },
  },
  {
    titleRu: 'Уведомления по заявкам',
    descriptionRu: 'Создание и управление уведомлениями по заявкам.',
    icon: 'bx-bell',
    color: 'success',
    count: 0,
    to: { name: 'settings', query: { tab: 'ticket-notifications' } },
  },
  {
    titleRu: 'Учетные записи почты для PostMaster',
    descriptionRu: 'Управление учётными записями POP3 или IMAP для получения почтовых сообщений.',
    icon: 'bx-mail-send',
    color: 'warning',
    count: 0,
    to: { name: 'settings', query: { tab: 'postmaster-mail-accounts' } },
  },
  {
    titleRu: 'Фильтры PostMaster (входящей почты)',
    descriptionRu: 'Фильтрация входящей почты.',
    icon: 'bx-filter-alt',
    color: 'info',
    count: 0,
    to: { name: 'settings', query: { tab: 'postmaster-filters' } },
  },
]
</script>

<template>
  <VCard
    title="Каналы связи и уведомления"
    subtitle="Быстрый доступ к разделам (10)"
  >
    <VCardText>
      <VRow class="match-height">
        <VCol
          v-for="w in widgets"
          :key="w.to.query.tab"
          cols="12"
          sm="6"
          lg="4"
        >
          <VCard
            class="communication-settings-widget"
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
                    {{ w.titleRu }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ w.descriptionRu }}
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
.communication-settings-widget {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.communication-settings-widget:hover {
  transform: translateY(-2px);
}
</style>
