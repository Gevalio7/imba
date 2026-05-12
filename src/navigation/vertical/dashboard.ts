export default [
  {
    title: 'Дашборды',
    icon: { icon: 'bx-home-smile' },
    children: [
      {
        title: 'Аналитика',
        to: 'dashboards-analytics',
        action: 'read',
        subject: 'menu_dashboard',
      },
    ],
    badgeContent: '5',
    badgeClass: 'bg-error',
  },
]
