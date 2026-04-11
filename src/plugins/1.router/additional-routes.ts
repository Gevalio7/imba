import type { RouteRecordRaw } from 'vue-router/auto'
import { useCookie } from '@/@core/composable/useCookie'

// 👉 Redirects
export const redirects: RouteRecordRaw[] = [
  // ℹ️ We are redirecting to different pages based on role.
  // NOTE: Role is just for UI purposes. ACL is based on abilities.
  {
    path: '/',
    name: 'index',
    redirect: to => {
      // TODO: Get type from backend
      const userData = useCookie<Record<string, unknown> | null | undefined>('userData')
      const userRole = userData.value?.role

      if (userRole === 'admin')
        return { name: 'dashboards-analytics' }
      if (userRole === 'client')
        return { name: 'access-control' }

      return { name: 'login', query: to.query }
    },
  },
  {
    path: '/pages/account-settings',
    name: 'pages-account-settings',
    redirect: () => ({ name: 'pages-account-settings-tab', params: { tab: 'account' } }),
  },

]

export const routes: RouteRecordRaw[] = [
  // RoleCards - страница списка ролей
  {
    path: '/apps/roles/cards',
    name: 'apps-roles-cards',
    component: () => import('@/views/apps/roles/RoleCards.vue'),
  },
  // SystemConfiguration - страница Конфигурация системы
  {
    path: '/apps/tickets/system-configuration',
    name: 'apps-tickets-system-configuration',
    component: () => import('@/pages/apps/settings/ticket-settings/SystemConfiguration.vue'),
  },
  // Backup - страница резервного копирования
  {
    path: '/apps/backup',
    name: 'apps-backup',
    component: () => import('@/pages/apps/Backup.vue'),
  },
  // IntegrityCheck - страница контроля целостности
  {
    path: '/apps/integrity-check',
    name: 'apps-integrity-check',
    component: () => import('@/pages/apps/IntegrityCheck.vue'),
  },
  // QueuesAddEdit - страница создания/редактирования очереди
  {
    path: '/apps/queues/add',
    name: 'apps-queues-add',
    component: () => import('@/pages/apps/QueuesAddEdit.vue'),
  },
  {
    path: '/apps/queues/:id',
    name: 'apps-queues-edit',
    component: () => import('@/pages/apps/QueuesAddEdit.vue'),
  },
]
