<script setup lang="ts">
type AdministrationWidget = {
  title: string
  descriptionRu: string
  icon: string
  color: string
  count: number
  to: { name: string; query: Record<string, string> }
}

const widgets: AdministrationWidget[] = [
  {
    title: 'SQL-запросы',
    descriptionRu: 'Выполнить SQL-запросы.',
    icon: 'bx-data',
    color: 'primary',
    count: 0,
    to: { name: 'settings', query: { tab: 'sql-box' } },
  },
  {
    title: 'Системные файлы',
    descriptionRu: 'Управление системными файлами.',
    icon: 'bx-folder',
    color: 'success',
    count: 0,
    to: { name: 'settings', query: { tab: 'system-file-support' } },
  },
  {
    title: 'Переводы',
    descriptionRu: 'Управление переводами.',
    icon: 'bx-translate',
    color: 'warning',
    count: 0,
    to: { name: 'settings', query: { tab: 'translation' } },
  },
  {
    title: 'Журнал производительности',
    descriptionRu: 'Просмотр результатов измерения производительности.',
    icon: 'bx-line-chart',
    color: 'info',
    count: 0,
    to: { name: 'settings', query: { tab: 'performance-log' } },
  },
  {
    title: 'Календари',
    descriptionRu: 'Создание календарей и управление ими.',
    icon: 'bx-calendar',
    color: 'secondary',
    count: 0,
    to: { name: 'settings', query: { tab: 'calendars' } },
  },
  {
    title: 'Менеджер пакетов',
    descriptionRu: 'Управление дополнениями.',
    icon: 'bx-package',
    color: 'primary',
    count: 0,
    to: { name: 'settings', query: { tab: 'package-manager' } },
  },
  {
    title: 'Настройка системы',
    descriptionRu: 'Редактировать настройки конфигурации системы.',
    icon: 'bx-cog',
    color: 'success',
    count: 0,
    to: { name: 'settings', query: { tab: 'system-configuration' } },
  },
  {
    title: 'Обслуживание системы',
    descriptionRu: 'Управлять периодом обслуживания.',
    icon: 'bx-wrench',
    color: 'warning',
    count: 0,
    to: { name: 'settings', query: { tab: 'system-maintenance' } },
  },
  {
    title: 'Общий каталог',
    descriptionRu: 'Создание и управление Общим каталогом.',
    icon: 'bx-book',
    color: 'info',
    count: 0,
    to: { name: 'settings', query: { tab: 'general-catalog' } },
  },
  {
    title: 'Сбор данных для поддержки',
    descriptionRu: 'Управление данными для поддержки.',
    icon: 'bx-support',
    color: 'secondary',
    count: 0,
    to: { name: 'settings', query: { tab: 'support-data-collector' } },
  },
  {
    title: 'Системный журнал',
    descriptionRu: 'Просмотр системных сообщений.',
    icon: 'bx-file',
    color: 'primary',
    count: 0,
    to: { name: 'settings', query: { tab: 'system-log' } },
  },
  {
    title: 'Управление сеансами',
    descriptionRu: 'Управление активными сеансами.',
    icon: 'bx-time-five',
    color: 'error',
    count: 0,
    to: { name: 'settings', query: { tab: 'session-management' } },
  },
]
</script>

<template>
  <VCard
    title="Администрирование"
    subtitle="Быстрый доступ к разделам (12)"
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
            class="administration-widget"
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
.administration-widget {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.administration-widget:hover {
  transform: translateY(-2px);
}
</style>
