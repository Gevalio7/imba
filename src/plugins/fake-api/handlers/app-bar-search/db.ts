import type { SearchResults } from '@db/app-bar-search/types'

interface DB {
  searchItems: SearchResults[]
}

export const db: DB = {
  searchItems: [
    {
      title: 'Dashboards',
      category: 'dashboards',
      children: [
        {
          url: { name: 'dashboards-analytics' },
          icon: 'bx-bar-chart',
          title: 'Analytics Dashboard',
        },
      ],
    },
    {
      title: 'Apps',
      category: 'apps',
      children: [
        {
          url: { name: 'apps-tickets' },
          icon: 'bx-ticket',
          title: 'Tickets',
        },
        {
          url: { name: 'apps-chat' },
          icon: 'bx-chat',
          title: 'Chat',
        },
        {
          url: { name: 'apps-kanban' },
          icon: 'bx-grid',
          title: 'Kanban',
        },
        {
          url: { name: 'apps-agents-groups' },
          icon: 'bx-user',
          title: 'Agents',
        },
        {
          url: { name: 'apps-knowledge-base' },
          icon: 'bx-book',
          title: 'Knowledge Base',
        },
        {
          url: { name: 'apps-services' },
          icon: 'bx-package',
          title: 'Services',
        },
        {
          url: { name: 'apps-roles' },
          icon: 'bx-check-shield',
          title: 'Roles',
        },
      ],
    },
  ],
}
