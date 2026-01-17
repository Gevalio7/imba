<script setup lang="ts">
type ProcessesAutomationWidget = {
  title: string
  descriptionRu: string
  icon: string
  color: string
  count: number
  to: { name: string; query: Record<string, string> }
}

const widgets: ProcessesAutomationWidget[] = [
  {
    title: 'Веб-сервисы',
    descriptionRu: 'Создание и управление веб-сервисами.',
    icon: 'bx-server',
    color: 'primary',
    count: 0,
    to: { name: 'settings', query: { tab: 'web-services' } },
  },
  {
    title: 'Динамические поля',
    descriptionRu: 'Создание динамических полей и управление ими.',
    icon: 'bx-customize',
    color: 'success',
    count: 0,
    to: { name: 'settings', query: { tab: 'dynamic-fields' } },
  },
  {
    title: 'Динамические поля и Экраны',
    descriptionRu: 'Активация динамических полей для экранов.',
    icon: 'bx-link',
    color: 'warning',
    count: 0,
    to: { name: 'settings', query: { tab: 'dynamic-fields-screens' } },
  },
  {
    title: 'Планировщик задач',
    descriptionRu: 'Управление заданиями, основанными на событиях или времени выполнения.',
    icon: 'bx-time-five',
    color: 'info',
    count: 0,
    to: { name: 'settings', query: { tab: 'generic-agent' } },
  },
  {
    title: 'Связи свойств заявки',
    descriptionRu: 'Управление связями свойств заявки.',
    icon: 'bx-git-branch',
    color: 'secondary',
    count: 0,
    to: { name: 'settings', query: { tab: 'ticket-attribute-relations' } },
  },
  {
    title: 'Списки управления доступом (ACL)',
    descriptionRu: 'Настройка и управление ACL.',
    icon: 'bx-shield',
    color: 'error',
    count: 0,
    to: { name: 'settings', query: { tab: 'acl' } },
  },
  {
    title: 'Управление Процессами',
    descriptionRu: 'Настройка Процессов.',
    icon: 'bx-sitemap',
    color: 'primary',
    count: 0,
    to: { name: 'settings', query: { tab: 'process-management' } },
  },
]
</script>

<template>
  <VCard
    title="Процессы и автоматизация"
    subtitle="Быстрый доступ к разделам (7)"
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
            class="processes-automation-widget"
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
.processes-automation-widget {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.processes-automation-widget:hover {
  transform: translateY(-2px);
}
</style>
