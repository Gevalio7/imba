
export default [
  { heading: 'Apps & Pages' },
  {
    title: 'Ecommerce',
    icon: { icon: 'bx-cart-alt' },
    children: [
      {
        title: 'Dashboard',
        to: 'apps-ecommerce-dashboard',
      },
      {
        title: 'Product',
        children: [
          { title: 'List', to: 'apps-ecommerce-product-list' },
          { title: 'Add', to: 'apps-ecommerce-product-add' },
          { title: 'Category', to: 'apps-ecommerce-product-category-list' },
        ],
      },
      {
        title: 'Order',
        children: [
          { title: 'List', to: 'apps-ecommerce-order-list' },
          { title: 'Details', to: { name: 'apps-ecommerce-order-details-id', params: { id: '9042' } } },
        ],
      },
      {
        title: 'Customer',
        children: [
          { title: 'List', to: 'apps-ecommerce-customer-list' },
          { title: 'Details', to: { name: 'apps-ecommerce-customer-details-id', params: { id: 478426 } } },
        ],
      },
      {
        title: 'Manage Review',
        to: 'apps-ecommerce-manage-review',
      },
      {
        title: 'Referrals',
        to: 'apps-ecommerce-referrals',
      },
      {
        title: 'Settings',
        to: 'apps-ecommerce-settings',
      },
    ],
  },
  {
    title: 'Academy',
    icon: { icon: 'bx-book-open' },
    children: [
      { title: 'Dashboard', to: 'apps-academy-dashboard' },
      { title: 'My Course', to: 'apps-academy-my-course' },
      { title: 'Course Details', to: 'apps-academy-course-details' },
    ],
  },
  {
    title: 'Logistics',
    icon: { icon: 'bx-car' },
    children: [
      { title: 'Dashboard', to: 'apps-logistics-dashboard' },
      { title: 'Fleet', to: 'apps-logistics-fleet' },
    ],
  },
  {
    title: 'Email',
    icon: { icon: 'bx-envelope' },
    to: 'apps-email',
  },
  {
    title: 'Chat',
    icon: { icon: 'bx-chat' },
    to: 'apps-chat',
  },
  {
    title: 'Calendar',
    icon: { icon: 'bx-calendar' },
    to: 'apps-calendar',
  },
  {
    title: 'Kanban',
    icon: { icon: 'bx-grid' },
    to: 'apps-kanban',
  },
  {
    title: 'Invoice',
    icon: { icon: 'bx-food-menu' },

    children: [
      { title: 'List', to: 'apps-invoice-list' },
      { title: 'Preview', to: { name: 'apps-invoice-preview-id', params: { id: '5036' } } },
      { title: 'Edit', to: { name: 'apps-invoice-edit-id', params: { id: '5036' } } },
      { title: 'Add', to: 'apps-invoice-add' },
    ],
  },
  {
    title: 'User',
    icon: { icon: 'bx-user' },
    children: [
      { title: 'List', to: 'apps-user-list' },
      { title: 'View', to: { name: 'apps-user-view-id', params: { id: 21 } } },
    ],
  },
  {
    title: 'Test Entities',
    icon: { icon: 'bx-test-tube' },
    to: 'apps-test-entities',
  },
  {
    title: 'Настройки',
    icon: { icon: 'bx-cog' },
    children: [
      {
        title: 'Администрирование',
        children: [
          { title: 'Обзор', to: 'apps-settings-administration-administration-settings' },
          { title: 'Календари', to: 'apps-settings-administration-calendars' },
          { title: 'Общий каталог', to: 'apps-settings-administration-general-catalog' },
          { title: 'Менеджер пакетов', to: 'apps-settings-administration-package-manager' },
          { title: 'Журнал производительности', to: 'apps-settings-administration-performance-log' },
          { title: 'Управление сессиями', to: 'apps-settings-administration-session-management' },
          { title: 'SQL запросы', to: 'apps-settings-administration-sql-box' },
          { title: 'Сбор данных для  поддержки ', to: 'apps-settings-administration-support-data-collector' },
          { title: 'Конфигурация системы', to: 'apps-settings-administration-system-configuration' },
          { title: 'Поддержка файлов системы', to: 'apps-settings-administration-system-file-support' },
          { title: 'Системный журанал', to: 'apps-settings-administration-system-log' },
          { title: 'Обслуживание системы', to: 'apps-settings-administration-system-maintenance' },
          { title: 'Переводы', to: 'apps-settings-administration-translation' },
        ],
      },
      {
        title: 'Коммуникации и уведомления',
        children: [
          { title: 'Уведомления администратора', to: 'apps-settings-communication-notifications-admin-notification' },
          { title: 'Уведомления по заявкам', to: 'apps-settings-communication-notifications-appointment-notifications' },
          { title: 'Журнал сеансов связи', to: 'apps-settings-communication-notifications-communication-log' },
          { title: 'Уведомление по мероприятиям', to: 'apps-settings-communication-notifications-communication-notifications-settings' },
          { title: 'Адреса Емайл', to: 'apps-settings-communication-notifications-email-addresses' },
          { title: 'OAuth2', to: 'apps-settings-communication-notifications-oauth2' },
          { title: 'PGP ключи', to: 'apps-settings-communication-notifications-pgp-keys' },
          { title: 'Фильтры входящей почты', to: 'apps-settings-communication-notifications-post-master-filters' },
          { title: 'Учетные записи POP3', to: 'apps-settings-communication-notifications-post-master-mail-accounts' },
          { title: 'Сертификаты MIME', to: 'apps-settings-communication-notifications-smime-certificates' },
          { title: 'Уведомления по заявкам', to: 'apps-settings-communication-notifications-ticket-notifications' },
        ],
      },
      {
        title: 'Процессы и автоматизация',
        children: [
          { title: 'Управление доступом', to: 'apps-settings-processes-automation-acl' },
          { title: 'Динамические поля', to: 'apps-settings-processes-automation-dynamic-fields' },
          { title: 'Динамические поля и экраны', to: 'apps-settings-processes-automation-dynamic-fields-screens' },
          { title: 'Generic Agent', to: 'apps-settings-processes-automation-generic-agent' },
          { title: 'Планировщик задач', to: 'apps-settings-processes-automation-processes-automation-settings' },
          { title: 'Управление Процессами', to: 'apps-settings-processes-automation-process-management' },
          { title: 'Связи свойств заявки', to: 'apps-settings-processes-automation-ticket-attribute-relations' },
          { title: 'Web Сервисы', to: 'apps-settings-processes-automation-web-services' },
        ],
      },
      {
        title: 'Настройки заявок',
        children: [
          { title: 'Прикрепленные файлы', to: 'apps-settings-ticket-settings-attachments' },
          { title: 'Автоответы', to: 'apps-settings-ticket-settings-auto-responses' },
          { title: 'Приветствия', to: 'apps-settings-ticket-settings-greetings' },
          { title: 'Приоритеты', to: 'apps-settings-ticket-settings-priorities' },
          { title: 'Очереди  Автоответы', to: 'apps-settings-ticket-settings-queue-auto-response' },
          { title: 'Очереди', to: 'apps-settings-ticket-settings-queues' },
          { title: 'Сервисы', to: 'apps-settings-ticket-settings-services' },
          { title: 'Подписи', to: 'apps-settings-ticket-settings-signatures' },
          { title: 'SLA', to: 'apps-settings-ticket-settings-sla' },
          { title: 'Состояния', to: 'apps-settings-ticket-settings-states' },
          { title: 'Шаблоны Вложения', to: 'apps-settings-ticket-settings-template-attachments' },
          { title: 'Template Шаблоны Очереди', to: 'apps-settings-ticket-settings-template-queues' },
          { title: 'Шаблоны', to: 'apps-settings-ticket-settings-templates' },
          { title: 'Типы', to: 'apps-settings-ticket-settings-types' },
        ],
      },
      {
        title: 'Пользователи группы Роли',
        children: [
          { title: 'Агенты', to: 'apps-settings-users-groups-roles-agents' },
          { title: 'Группы агентов', to: 'apps-settings-users-groups-roles-agents-groups' },
          { title: 'Агенты Роли', to: 'apps-settings-users-groups-roles-agents-roles' },
          { title: 'Клиенты', to: 'apps-settings-users-groups-roles-customers' },
          { title: 'Группы клиентов', to: 'apps-settings-users-groups-roles-customers-groups' },
          { title: 'Customer Users', to: 'apps-settings-users-groups-roles-customer-users' },
          { title: 'Customer Users Customers', to: 'apps-settings-users-groups-roles-customer-users-customers' },
          { title: 'Customer Users Groups', to: 'apps-settings-users-groups-roles-customer-users-groups' },
          { title: 'Customer Users Services', to: 'apps-settings-users-groups-roles-customer-users-services' },
          { title: 'Группы', to: 'apps-settings-users-groups-roles-groups' },
          { title: 'Роли', to: 'apps-settings-users-groups-roles-roles' },
          { title: 'Роли группы', to: 'apps-settings-users-groups-roles-roles-groups' },
          { title: 'Users Groups Roles Settings', to: 'apps-settings-users-groups-roles-users-groups-roles-settings' },
        ],
      },
    ],
  },
  {
    title: 'Roles & Permissions',
    icon: { icon: 'bx-check-shield' },
    children: [
      { title: 'Roles', to: 'apps-roles' },
      { title: 'Permissions', to: 'apps-permissions' },
    ],
  },

  {
    title: 'Pages',
    icon: { icon: 'bx-file' },
    children: [
      { title: 'User Profile', to: { name: 'pages-user-profile-tab', params: { tab: 'profile' } } },
      { title: 'Account Settings', to: { name: 'pages-account-settings-tab', params: { tab: 'account' } } },
      { title: 'Pricing', to: 'pages-pricing' },
      { title: 'FAQ', to: 'pages-faq' },
      {
        title: 'Miscellaneous',
        children: [
          { title: 'Coming Soon', to: 'pages-misc-coming-soon', target: '_blank' },
          { title: 'Under Maintenance', to: 'pages-misc-under-maintenance', target: '_blank' },
          { title: 'Page Not Found - 404', to: { path: '/pages/misc/not-found' }, target: '_blank' },
          { title: 'Not Authorized - 401', to: { path: '/pages/misc/not-authorized' }, target: '_blank' },
        ],
      },
    ],
  },
  {
    title: 'Authentication',
    icon: { icon: 'bx-shield' },
    children: [
      {
        title: 'Login',
        children: [
          { title: 'Login v1', to: 'pages-authentication-login-v1', target: '_blank' },
          { title: 'Login v2', to: 'pages-authentication-login-v2', target: '_blank' },
        ],
      },
      {
        title: 'Register',
        children: [
          { title: 'Register v1', to: 'pages-authentication-register-v1', target: '_blank' },
          { title: 'Register v2', to: 'pages-authentication-register-v2', target: '_blank' },
          { title: 'Register Multi-Steps', to: 'pages-authentication-register-multi-steps', target: '_blank' },
        ],
      },
      {
        title: 'Verify Email',
        children: [
          { title: 'Verify Email v1', to: 'pages-authentication-verify-email-v1', target: '_blank' },
          { title: 'Verify Email v2', to: 'pages-authentication-verify-email-v2', target: '_blank' },
        ],
      },
      {
        title: 'Forgot Password',
        children: [
          { title: 'Forgot Password v1', to: 'pages-authentication-forgot-password-v1', target: '_blank' },
          { title: 'Forgot Password v2', to: 'pages-authentication-forgot-password-v2', target: '_blank' },
        ],
      },
      {
        title: 'Reset Password',
        children: [
          { title: 'Reset Password v1', to: 'pages-authentication-reset-password-v1', target: '_blank' },
          { title: 'Reset Password v2', to: 'pages-authentication-reset-password-v2', target: '_blank' },
        ],
      },
      {
        title: 'Two Steps',
        children: [
          { title: 'Two Steps v1', to: 'pages-authentication-two-steps-v1', target: '_blank' },
          { title: 'Two Steps v2', to: 'pages-authentication-two-steps-v2', target: '_blank' },
        ],
      },
    ],
  },
  {
    title: 'Wizard Examples',
    icon: { icon: 'bx-dots-horizontal' },
    children: [
      { title: 'Checkout', to: { name: 'wizard-examples-checkout' } },
      { title: 'Property Listing', to: { name: 'wizard-examples-property-listing' } },
      { title: 'Create Deal', to: { name: 'wizard-examples-create-deal' } },
    ],
  },
  {
    title: 'Dialog Examples',
    icon: { icon: 'bx-square' },
    to: 'pages-dialog-examples',
  },
]
