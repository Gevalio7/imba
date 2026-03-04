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
      { title: 'Создать', to: { path: '/apps/tickets/add' } },
    ],
  },
  {
    title: 'Пользователи',
    icon: { icon: 'bx-user' },
    children: [
      { title: 'Список', to: 'apps-settings-users-groups-roles-customer-users' },
      { title: 'Создать', to: { path: '/apps/tickets/add' } },     
    ],
  },
  {
    title: 'Агенты',
    icon: { icon: 'bx-user' },
    children: [
      { title: 'Список', to: 'apps-settings-users-groups-roles-agents-groups' },
      { title: 'Создать', to: { path: '/apps/tickets/add' } },
     
    ],
  },
  

   {
    title: 'Организация',
    icon: { icon: 'bx-user' },
    children: [
      { title: 'Список', to: 'apps-settings-users-groups-roles-customers' },
      { title: 'Создать', to: { path: '/apps/tickets/add' } },
     
    ],
  },
  {
    title: 'Роли и разрешения',
    icon: { icon: 'bx-check-shield' },
    children: [
      { title: 'Роли', to: 'apps-roles' },
     
    ],
  },
  
  { heading: 'Настройки' },
  
  {
    title: 'Заявки (настройки)',
    icon: { icon: 'bx-detail' },
    children: [
      { title: 'Вложения', to: 'apps-settings-ticket-settings-attachments' },
      { title: 'Автоответы', to: 'apps-settings-ticket-settings-auto-responses' },
      { title: 'Приветствия', to: 'apps-settings-ticket-settings-greetings' },
      { title: 'Приоритеты', to: 'apps-settings-ticket-settings-priorities' },
      { title: 'Автоответы очереди', to: 'apps-settings-ticket-settings-queue-auto-response' },
      { title: 'Очереди', to: 'apps-settings-ticket-settings-queues' },
      { title: 'Услуги', to: 'apps-settings-ticket-settings-services' },
      { title: 'Подписи', to: 'apps-settings-ticket-settings-signatures' },
      { title: 'SLA', to: 'apps-settings-ticket-settings-sla' },
      { title: 'Статусы', to: 'apps-settings-ticket-settings-states' },
      { title: 'Вложения шаблонов', to: 'apps-settings-ticket-settings-template-attachments' },
      { title: 'Очереди шаблонов', to: 'apps-settings-ticket-settings-template-queues' },
      { title: 'Шаблоны', to: 'apps-settings-ticket-settings-templates' },
      { title: 'Типы', to: 'apps-settings-ticket-settings-types' },
      { title: 'Рабочие процессы', to: 'apps-settings-ticket-settings-workflows' },
    ],
  },
  {
    title: 'Пользователи и группы',
    icon: { icon: 'bx-group' },
    children: [
      
 
      { title: 'Группы клиентов', to: 'apps-settings-users-groups-roles-customers-groups' },
      { title: 'Клиенты', to: 'apps-settings-users-groups-roles-customer-users' },
      { title: 'Клиенты компаний', to: 'apps-settings-users-groups-roles-customer-users-customers' },
      { title: 'Роли', to: 'apps-settings-users-groups-roles-roles' },
    ],
  },
  {
    title: 'Коммуникации и уведомления',
    icon: { icon: 'bx-notification' },
    children: [
      { title: 'Email адреса', to: 'apps-settings-communication-notifications-email-addresses' },
      { title: 'Почтовые аккаунты', to: 'apps-settings-communication-notifications-post-master-mail-accounts' },
    ],
  },
  {
    title: 'Администрирование',
    icon: { icon: 'bx-cog' },
    children: [
      { title: 'Календари', to: 'apps-settings-administration-calendars' },
      { title: 'Управление сессиями', to: 'apps-settings-administration-session-management' },
      { title: 'Системный лог', to: 'apps-settings-administration-system-log' },
    ],
  },
]
