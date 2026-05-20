export const menuConfig: Array<{ category: string; label: string; children: Array<{ id: string; label: string; code?: string }> }> = [
  {
    category: 'menu_tickets',
    label: 'Обращения',
    children: [
      { id: 'apps-tickets', label: 'Список обращений', code: 'menu_tickets_list' },
      { id: 'apps-tickets-add', label: 'Создать обращение', code: 'menu_tickets_create' },
      { id: 'apps-tickets-schedules', label: 'Расписания', code: 'menu_tickets_schedules' },
    ],
  },
  {
    category: 'menu_chat',
    label: 'Чат',
    children: [
      { id: 'apps-chat', label: 'Чат', code: 'menu_chat' },
    ],
  },
  {
    category: 'menu_kanban',
    label: 'Канбан',
    children: [
      { id: 'apps-kanban', label: 'Канбан', code: 'menu_kanban' },
    ],
  },
  {
    category: 'menu_agents',
    label: 'Агенты',
    children: [
      { id: 'apps-agents', label: 'Список агентов', code: 'menu_agents' },
    ],
  },
  {
    category: 'menu_knowledge_base',
    label: 'База знаний',
    children: [
      { id: 'apps-knowledge-base', label: 'База знаний', code: 'menu_knowledge_base' },
    ],
  },
  {
    category: 'menu_services',
    label: 'Сервисы',
    children: [
      { id: 'apps-services', label: 'Сервисы', code: 'menu_services' },
    ],
  },
  {
    category: 'menu_companies',
    label: 'Наши компании',
    children: [
      { id: 'apps-customers', label: 'Компании', code: 'menu_companies_list' },
      { id: 'apps-customers-groups', label: 'Отделы и филиалы', code: 'menu_companies_groups' },
      { id: 'apps-customer-users', label: 'Сотрудники', code: 'menu_companies_users' },
      { id: 'apps-organization-structure', label: 'Структура компании', code: 'menu_companies_structure' },
    ],
  },
  {
    category: 'menu_roles',
    label: 'Роли',
    children: [
      { id: 'apps-roles', label: 'Роли', code: 'menu_roles_list' },
      { id: 'apps-permissions', label: 'Разрешения', code: 'menu_permissions' },
    ],
  },
  {
    category: 'menu_ticket_settings',
    label: 'Настройки Тикетов',
    children: [
      { id: 'apps-queues', label: 'Очереди', code: 'menu_queues' },
      { id: 'apps-types', label: 'Типы', code: 'menu_types' },
      { id: 'apps-type-categories', label: 'Категории', code: 'menu_type_categories' },
      { id: 'apps-states', label: 'Статусы', code: 'menu_states' },
      { id: 'apps-priorities', label: 'Приоритеты', code: 'menu_priorities' },
      { id: 'apps-sla', label: 'SLA', code: 'menu_sla' },
      { id: 'apps-templates', label: 'Шаблоны', code: 'menu_templates' },
      { id: 'apps-template-queues', label: 'Очереди шаблонов', code: 'menu_template_queues' },
      { id: 'apps-workflows', label: 'Рабочие процессы', code: 'menu_workflows' },
      { id: 'apps-greetings', label: 'Приветствия', code: 'menu_greetings' },
      { id: 'apps-signatures', label: 'Подписи', code: 'menu_signatures' },
      { id: 'apps-auto-responses', label: 'Автоответы', code: 'menu_auto_responses' },
      { id: 'apps-attachments', label: 'Вложения', code: 'menu_attachments' },
      { id: 'apps-settings-ticket-settings', label: 'Конфигурация системы', code: 'menu_tickets_system_configuration' },
    ],
  },
  {
    category: 'menu_email_settings',
    label: 'Настройка Почты',
    children: [
      { id: 'apps-email-addresses', label: 'Адреса', code: 'menu_email_addresses' },
      { id: 'apps-post-master-mail-accounts', label: 'Почтовые аккаунты', code: 'menu_post_master_mail_accounts' },
    ],
  },
  {
    category: 'menu_system',
    label: 'Система',
    children: [
      { id: 'apps-calendars', label: 'Календари', code: 'menu_calendars' },
      { id: 'apps-session-management', label: 'Сессии', code: 'menu_session_management' },
      { id: 'apps-system-log', label: 'Лог', code: 'menu_system_log' },
    ],
  },
  {
    category: 'menu_backup',
    label: 'Резервное копирование',
    children: [
      { id: 'apps-backup', label: 'Резервное копирование', code: 'menu_backup' },
    ],
  },
  {
    category: 'menu_integrity_check',
    label: 'Контроль целостности',
    children: [
      { id: 'apps-integrity-check', label: 'Контроль целостности', code: 'menu_integrity_check' },
    ],
  },
]

export const categoryIcons: Record<string, string> = {
  menu_tickets: 'bx-message-detail',
  menu_chat: 'bx-chat',
  menu_kanban: 'bx-grid',
  menu_agents: 'bx-user',
  menu_knowledge_base: 'bx-book',
  menu_services: 'bx-package',
  menu_companies: 'bx-buildings',
  menu_roles: 'bx-check-shield',
  menu_ticket_settings: 'bx-detail',
  menu_email_settings: 'bx-envelope',
  menu_system: 'bx-cog',
  menu_backup: 'bx-archive',
  menu_integrity_check: 'bx-shield',
}

export const categoryColors: Record<string, string> = {
  menu_tickets: 'primary',
  menu_chat: 'info',
  menu_kanban: 'warning',
  menu_agents: 'success',
  menu_knowledge_base: 'purple',
  menu_services: 'orange',
  menu_companies: 'teal',
  menu_roles: 'error',
  menu_ticket_settings: 'blue',
  menu_email_settings: 'indigo',
  menu_system: 'brown',
  menu_backup: 'grey',
  menu_integrity_check: 'deep-purple',
}
