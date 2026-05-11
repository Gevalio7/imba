import BxTicket from '@core/components/icons/BxTicket.vue'
import GridColumnRight from '@core/components/icons/GridColumnRight.vue'

export default [
  { heading: 'Приложения' },
 {
    title: 'Обращения',
    icon: { icon: BxTicket },
    children: [
      { title: 'Список', to: 'apps-tickets' },
      { title: 'Создать', to: 'apps-tickets-add' },
      { title: 'Расписания', to: 'apps-tickets-schedules' },
    ],
  },
  {
    title: 'Чат',
    icon: { icon: 'bx-chat' },
    to: 'apps-chat',
  },
  
  {
    title: 'Канбан',
    icon: { icon: 'bx-grid' },
    to: 'apps-kanban',
  },
  
  {
    title: 'Агенты',
    icon: { icon: 'bx-user' },
    children: [
      { title: 'Список', to: 'apps-agents' },
    ],
  },
  {
    title: 'База знаний',
    icon: { icon: 'bx-book' },
    to: 'apps-knowledge-base',
  },
  
 {
    title: 'Сервисы',
    icon: { icon: 'bx-package' },
    to: 'apps-services',
  },
  {
    title: 'Наши компании',
    icon: { icon: GridColumnRight },
    children: [
      { title: 'Компании', to: 'apps-customers' },
      { title: 'Отделы и филиалы', to: 'apps-customers-groups' },
      { title: 'Сотрудники', to: 'apps-customer-users' },
      { title: 'Структура компании', to: 'apps-organization-structure' },
    ],
  },
  {
    title: 'Роли',
    icon: { icon: 'bx-check-shield' },
    children: [
      { title: 'Роли', to: 'apps-roles', action: 'read', subject: 'menu_roles' },
      { title: 'Разрешения', to: 'apps-permissions', action: 'read', subject: 'menu_roles' },
    ],
  },
  
  { heading: 'Справочники', action: 'read', subject: 'system_settings' },

  {
    title: 'Настройки Тикетов',
    icon: { icon: 'bx-detail' },
    children: [
      { title: 'Очереди', to: 'apps-queues', action: 'read', subject: 'system_settings' },
      { title: 'Типы', to: 'apps-types', action: 'read', subject: 'system_settings' },
      { title: 'Категории', to: 'apps-type-categories', action: 'read', subject: 'system_settings' },
      { title: 'Статусы', to: 'apps-states', action: 'read', subject: 'system_settings' },
      { title: 'Приоритеты', to: 'apps-priorities', action: 'read', subject: 'system_settings' },
      { title: 'SLA', to: 'apps-sla', action: 'read', subject: 'system_settings' },
      { title: 'Шаблоны', to: 'apps-templates', action: 'read', subject: 'system_settings' },
      { title: 'Очереди шаблонов', to: 'apps-template-queues', action: 'read', subject: 'system_settings' },
      { title: 'Рабочие процессы', to: 'apps-workflows', action: 'read', subject: 'system_settings' },
      { title: 'Приветствия', to: 'apps-greetings', action: 'read', subject: 'system_settings' },
      { title: 'Подписи', to: 'apps-signatures', action: 'read', subject: 'system_settings' },
      { title: 'Автоответы', to: 'apps-auto-responses', action: 'read', subject: 'system_settings' },
      { title: 'Вложения', to: 'apps-attachments', action: 'read', subject: 'system_settings' },
      { title: 'Конфигурация системы', to: 'apps-tickets-system-configuration', action: 'read', subject: 'system_settings' },
    ],
  },

  {
    title: 'Настройка Почты',
    icon: { icon: 'bx-envelope' },
    children: [
      { title: 'Адреса', to: 'apps-email-addresses', action: 'read', subject: 'system_settings' },
      { title: 'Почтовые аккаунты', to: 'apps-post-master-mail-accounts', action: 'read', subject: 'system_settings' },
    ],
  },
  { heading: 'Администрирование', action: 'read', subject: 'system_settings' },
  {
    title: 'Система',
    icon: { icon: 'bx-cog' },
    children: [
      { title: 'Календари', to: 'apps-calendars', action: 'read', subject: 'system_settings' },
      { title: 'Сессии', to: 'apps-session-management', action: 'read', subject: 'system_settings' },
      { title: 'Лог', to: 'apps-system-log', action: 'read', subject: 'system_settings' },
    ],
  },
  {
    title: 'Резервное копирование',
    icon: { icon: 'bx-archive' },
    to: 'apps-backup',
  },
  {
    title: 'Контроль целостности',
    icon: { icon: 'bx-shield' },
    to: 'apps-integrity-check',
  },
  { heading: 'Администрирование' },
]
