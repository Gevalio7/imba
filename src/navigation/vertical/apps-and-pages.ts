import BxTicket from '@core/components/icons/BxTicket.vue'

export default [
  { heading: 'Приложения' },
  
  {
    title: 'Почта',
    icon: { icon: 'bx-envelope' },
    to: 'apps-email',
  },
  {
    title: 'Чат',
    icon: { icon: 'bx-chat' },
    to: 'apps-chat',
  },
  {
    title: 'Календарь',
    icon: { icon: 'bx-calendar' },
    to: 'apps-calendar',
  },
  {
    title: 'Канбан',
    icon: { icon: 'bx-grid' },
    to: 'apps-kanban',
  },
  {
    title: 'Тикеты',
    icon: { icon: BxTicket },
    children: [
      { title: 'Список', to: 'apps-tickets' },
      { title: 'Создать', to: 'apps-tickets-add' },
    ],
  },
  
  { heading: 'Пользователи и группы' },
  
  {
    title: 'Агенты',
    icon: { icon: 'bx-user' },
    children: [
      { title: 'Список', to: 'apps-agents' },
      { title: 'Группы', to: 'apps-agents-groups' },
    ],
  },
  {
    title: 'Клиенты',
    icon: { icon: 'bx-user' },
    children: [
      { title: 'Список', to: 'apps-customer-users' },
      { title: 'Компании', to: 'apps-customer-users-customers' },
    ],
  },
  {
    title: 'Организация',
    icon: { icon: 'bx-sitemap' },
    children: [
      { title: 'Компании', to: 'apps-customers' },
      { title: 'Группы клиентов', to: 'apps-customers-groups' },
      { title: 'Структура', to: 'apps-organization-structure' },
    ],
  },
  {
    title: 'Роли',
    icon: { icon: 'bx-check-shield' },
    to: 'apps-roles',
  },

  { heading: 'Заявки (настройки)' },
  
  {
    title: 'Заявки',
    icon: { icon: 'bx-detail' },
    children: [
      { title: 'Очереди', to: 'apps-queues' },
      { title: 'Типы', to: 'apps-types' },
      { title: 'Статусы', to: 'apps-states' },
      { title: 'Приоритеты', to: 'apps-priorities' },
      { title: 'SLA', to: 'apps-sla' },
      { title: 'Шаблоны', to: 'apps-templates' },
      { title: 'Очереди шаблонов', to: 'apps-template-queues' },
      { title: 'Рабочие процессы', to: 'apps-workflows' },
      { title: 'Приветствия', to: 'apps-greetings' },
      { title: 'Подписи', to: 'apps-signatures' },
      { title: 'Автоответы', to: 'apps-auto-responses' },
      { title: 'Вложения', to: 'apps-attachments' },
      { title: 'Услуги', to: 'apps-services' },
    ],
  },

  { heading: 'Коммуникации' },
  
  {
    title: 'Email',
    icon: { icon: 'bx-notification' },
    children: [
      { title: 'Адреса', to: 'apps-email-addresses' },
      { title: 'Почтовые аккаунты', to: 'apps-post-master-mail-accounts' },
    ],
  },

  { heading: 'Администрирование' },
  
  {
    title: 'Система',
    icon: { icon: 'bx-cog' },
    children: [
      { title: 'Календари', to: 'apps-calendars' },
      { title: 'Сессии', to: 'apps-session-management' },
      { title: 'Лог', to: 'apps-system-log' },
    ],
  },
]
