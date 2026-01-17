<script setup lang="ts">
type UsersGroupsRolesWidget = {
  title: string
  descriptionRu: string
  icon: string
  color: string
  count: number
  to: { name: string; query: Record<string, string> }
}

const widgets: UsersGroupsRolesWidget[] = [
  {
    title: 'Агенты',
    descriptionRu: 'Создание агентов и управление ими.',
    icon: 'bx-user',
    color: 'primary',
    count: 0,
    to: { name: 'settings', query: { tab: 'agents' } },
  },
  {
    title: 'Агенты ↔️ Группы',
    descriptionRu: 'Связать агентов с группами.',
    icon: 'bx-link',
    color: 'success',
    count: 0,
    to: { name: 'settings', query: { tab: 'agents-groups' } },
  },
  {
    title: 'Агенты ↔️ Роли',
    descriptionRu: 'Связать агентов с ролями.',
    icon: 'bx-link',
    color: 'warning',
    count: 0,
    to: { name: 'settings', query: { tab: 'agents-roles' } },
  },
  {
    title: 'Группы',
    descriptionRu: 'Создание групп и управление ими.',
    icon: 'bx-group',
    color: 'info',
    count: 0,
    to: { name: 'settings', query: { tab: 'groups' } },
  },
  {
    title: 'Клиенты',
    descriptionRu: 'Создание клиентов и управление ими.',
    icon: 'bx-user-check',
    color: 'secondary',
    count: 0,
    to: { name: 'settings', query: { tab: 'customer-users' } },
  },
  {
    title: 'Клиенты ↔️ Группы',
    descriptionRu: 'Связать клиентов с группами.',
    icon: 'bx-link',
    color: 'primary',
    count: 0,
    to: { name: 'settings', query: { tab: 'customer-users-groups' } },
  },
  {
    title: 'Клиенты ↔️ Компании',
    descriptionRu: 'Связать клиентов с компаниями.',
    icon: 'bx-link',
    color: 'success',
    count: 0,
    to: { name: 'settings', query: { tab: 'customer-users-customers' } },
  },
  {
    title: 'Клиенты ↔️ Сервисы',
    descriptionRu: 'Связать клиентов с сервисами.',
    icon: 'bx-link',
    color: 'warning',
    count: 0,
    to: { name: 'settings', query: { tab: 'customer-users-services' } },
  },
  {
    title: 'Компании',
    descriptionRu: 'Создание компаний и управление ими.',
    icon: 'bx-building-house',
    color: 'info',
    count: 0,
    to: { name: 'settings', query: { tab: 'customers' } },
  },
  {
    title: 'Компании ↔️ Группы',
    descriptionRu: 'Связать компании с группами.',
    icon: 'bx-link',
    color: 'secondary',
    count: 0,
    to: { name: 'settings', query: { tab: 'customers-groups' } },
  },
  {
    title: 'Роли',
    descriptionRu: 'Создание ролей и управление ими.',
    icon: 'bx-id-card',
    color: 'primary',
    count: 0,
    to: { name: 'settings', query: { tab: 'roles' } },
  },
  {
    title: 'Роли ↔️ Группы',
    descriptionRu: 'Связать роли с группами.',
    icon: 'bx-link',
    color: 'error',
    count: 0,
    to: { name: 'settings', query: { tab: 'roles-groups' } },
  },
]
</script>

<template>
  <VCard
    title="Пользователи, группы и роли"
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
            class="ugr-settings-widget"
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
.ugr-settings-widget {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.ugr-settings-widget:hover {
  transform: translateY(-2px);
}
</style>

