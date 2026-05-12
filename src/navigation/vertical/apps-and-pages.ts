import BxTicket from '@core/components/icons/BxTicket.vue'
import GridColumnRight from '@core/components/icons/GridColumnRight.vue'

export default [
  { heading: 'Приложения' },
  {
    title: 'Обращения',
    icon: { icon: BxTicket },
    children: [
      { title: 'Список', to: 'apps-tickets', action: 'read', subject: 'menu_tickets_list' },
      { title: 'Создать', to: 'apps-tickets-add', action: 'read', subject: 'menu_tickets_create' },
      { title: 'Расписания', to: 'apps-tickets-schedules', action: 'read', subject: 'menu_tickets_schedules' },
    ],
  },
  {
    title: 'Чат',
    icon: { icon: 'bx-chat' },
    to: 'apps-chat',
    action: 'read',
    subject: 'menu_chat',
  },

  {
    title: 'Канбан',
    icon: { icon: 'bx-grid' },
    to: 'apps-kanban',
    action: 'read',
    subject: 'menu_kanban',
  },

  {
    title: 'Агенты',
    icon: { icon: 'bx-user' },
    children: [
      { title: 'Список', to: 'apps-agents', action: 'read', subject: 'menu_agents' },
    ],
  },
  {
    title: 'База знаний',
    icon: { icon: 'bx-book' },
    to: 'apps-knowledge-base',
    action: 'read',
    subject: 'menu_knowledge_base',
  },

  {
    title: 'Сервисы',
    icon: { icon: 'bx-package' },
    to: 'apps-services',
    action: 'read',
    subject: 'menu_services',
  },
  {
    title: 'Наши компании',
    icon: { icon: GridColumnRight },
    children: [
      { title: 'Компании', to: 'apps-customers', action: 'read', subject: 'menu_companies_list' },
      { title: 'Отделы и филиалы', to: 'apps-customers-groups', action: 'read', subject: 'menu_companies_groups' },
      { title: 'Сотрудники', to: 'apps-customer-users', action: 'read', subject: 'menu_companies_users' },
      { title: 'Структура компании', to: 'apps-organization-structure', action: 'read', subject: 'menu_companies_structure' },
    ],
  },
  {
    title: 'Роли',
    icon: { icon: 'bx-check-shield' },
    children: [
      { title: 'Роли', to: 'apps-roles', action: 'read', subject: 'menu_roles_list' },
      { title: 'Разрешения', to: 'apps-permissions', action: 'read', subject: 'menu_permissions' },
    ],
  },

  { heading: 'Справочники' },

  {
    title: 'Настройки Тикетов',
    icon: { icon: 'bx-detail' },
    children: [
      { title: 'Очереди', to: 'apps-queues', action: 'read', subject: 'menu_queues' },
      { title: 'Типы', to: 'apps-types', action: 'read', subject: 'menu_types' },
      { title: 'Категории', to: 'apps-type-categories', action: 'read', subject: 'menu_type_categories' },
      { title: 'Статусы', to: 'apps-states', action: 'read', subject: 'menu_states' },
      { title: 'Приоритеты', to: 'apps-priorities', action: 'read', subject: 'menu_priorities' },
      { title: 'SLA', to: 'apps-sla', action: 'read', subject: 'menu_sla' },
      { title: 'Шаблоны', to: 'apps-templates', action: 'read', subject: 'menu_templates' },
      { title: 'Очереди шаблонов', to: 'apps-template-queues', action: 'read', subject: 'menu_template_queues' },
      { title: 'Рабочие процессы', to: 'apps-workflows', action: 'read', subject: 'menu_workflows' },
      { title: 'Приветствия', to: 'apps-greetings', action: 'read', subject: 'menu_greetings' },
      { title: 'Подписи', to: 'apps-signatures', action: 'read', subject: 'menu_signatures' },
      { title: 'Автоответы', to: 'apps-auto-responses', action: 'read', subject: 'menu_auto_responses' },
      { title: 'Вложения', to: 'apps-attachments', action: 'read', subject: 'menu_attachments' },
      { title: 'Конфигурация системы', to: 'apps-tickets-system-configuration', action: 'read', subject: 'menu_tickets_system_configuration' },
    ],
  },

  {
    title: 'Настройка Почты',
    icon: { icon: 'bx-envelope' },
    children: [
      { title: 'Адреса', to: 'apps-email-addresses', action: 'read', subject: 'menu_email_addresses' },
      { title: 'Почтовые аккаунты', to: 'apps-post-master-mail-accounts', action: 'read', subject: 'menu_post_master_mail_accounts' },
    ],
  },
  { heading: 'Администрирование' },
  {
    title: 'Система',
    icon: { icon: 'bx-cog' },
    children: [
      { title: 'Календари', to: 'apps-calendars', action: 'read', subject: 'menu_calendars' },
      { title: 'Сессии', to: 'apps-session-management', action: 'read', subject: 'menu_session_management' },
      { title: 'Лог', to: 'apps-system-log', action: 'read', subject: 'menu_system_log' },
    ],
  },
  {
    title: 'Резервное копирование',
    icon: { icon: 'bx-archive' },
    to: 'apps-backup',
    action: 'read',
    subject: 'menu_backup',
  },
  {
    title: 'Контроль целостности',
    icon: { icon: 'bx-shield' },
    to: 'apps-integrity-check',
    action: 'read',
    subject: 'menu_integrity_check',
  },
]
