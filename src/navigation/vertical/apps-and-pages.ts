
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
    title: 'Tickets',
    icon: { icon: 'bx-ticket' },
    children: [
      { title: 'Список', to: 'apps-tickets' },
      { title: 'Создать', to: { path: '/apps/tickets/add' } },
    ],
  },
  {
    title: 'Settings',
    icon: { icon: 'bx-cog' },
    children: [
      {
        title: 'Administration',
        children: [
          { title: 'Overview', to: 'apps-settings-administration-administration-settings' },
          { title: 'Calendars', to: 'apps-settings-administration-calendars' },
          { title: 'General Catalog', to: 'apps-settings-administration-general-catalog' },
          { title: 'Package Manager', to: 'apps-settings-administration-package-manager' },
          { title: 'Performance Log', to: 'apps-settings-administration-performance-log' },
          { title: 'Session Management', to: 'apps-settings-administration-session-management' },
          { title: 'SQL Box', to: 'apps-settings-administration-sql-box' },
          { title: 'Support Data Collector', to: 'apps-settings-administration-support-data-collector' },
          { title: 'System Configuration', to: 'apps-settings-administration-system-configuration' },
          { title: 'System File Support', to: 'apps-settings-administration-system-file-support' },
          { title: 'System Log', to: 'apps-settings-administration-system-log' },
          { title: 'System Maintenance', to: 'apps-settings-administration-system-maintenance' },
          { title: 'Translation', to: 'apps-settings-administration-translation' },
        ],
      },
      {
        title: 'Communication & Notifications',
        children: [
          { title: 'Admin Notification', to: 'apps-settings-communication-notifications-admin-notification' },
          { title: 'Appointment Notifications', to: 'apps-settings-communication-notifications-appointment-notifications' },
          { title: 'Communication Log', to: 'apps-settings-communication-notifications-communication-log' },
          { title: 'Communication Notifications Settings', to: 'apps-settings-communication-notifications-communication-notifications-settings' },
          { title: 'Email Addresses', to: 'apps-settings-communication-notifications-email-addresses' },
          { title: 'OAuth2', to: 'apps-settings-communication-notifications-oauth2' },
          { title: 'PGP Keys', to: 'apps-settings-communication-notifications-pgp-keys' },
          { title: 'Post Master Filters', to: 'apps-settings-communication-notifications-post-master-filters' },
          { title: 'Post Master Mail Accounts', to: 'apps-settings-communication-notifications-post-master-mail-accounts' },
          { title: 'SMIME Certificates', to: 'apps-settings-communication-notifications-smime-certificates' },
          { title: 'Ticket Notifications', to: 'apps-settings-communication-notifications-ticket-notifications' },
        ],
      },
      {
        title: 'Processes & Automation',
        children: [
          { title: 'ACL', to: 'apps-settings-processes-automation-acl' },
          { title: 'Dynamic Fields', to: 'apps-settings-processes-automation-dynamic-fields' },
          { title: 'Dynamic Fields Screens', to: 'apps-settings-processes-automation-dynamic-fields-screens' },
          { title: 'Generic Agent', to: 'apps-settings-processes-automation-generic-agent' },
          { title: 'Processes Automation Settings', to: 'apps-settings-processes-automation-processes-automation-settings' },
          { title: 'Process Management', to: 'apps-settings-processes-automation-process-management' },
          { title: 'Ticket Attribute Relations', to: 'apps-settings-processes-automation-ticket-attribute-relations' },
          { title: 'Web Services', to: 'apps-settings-processes-automation-web-services' },
        ],
      },
      {
        title: 'Ticket Settings',
        children: [
          { title: 'Attachments', to: 'apps-settings-ticket-settings-attachments' },
          { title: 'Auto Responses', to: 'apps-settings-ticket-settings-auto-responses' },
          { title: 'Greetings', to: 'apps-settings-ticket-settings-greetings' },
          { title: 'Priorities', to: 'apps-settings-ticket-settings-priorities' },
          { title: 'Queue Auto Response', to: 'apps-settings-ticket-settings-queue-auto-response' },
          { title: 'Queues', to: 'apps-settings-ticket-settings-queues' },
          { title: 'Services', to: 'apps-settings-ticket-settings-services' },
          { title: 'Signatures', to: 'apps-settings-ticket-settings-signatures' },
          { title: 'SLA', to: 'apps-settings-ticket-settings-sla' },
          { title: 'States', to: 'apps-settings-ticket-settings-states' },
          { title: 'Template Attachments', to: 'apps-settings-ticket-settings-template-attachments' },
          { title: 'Template Queues', to: 'apps-settings-ticket-settings-template-queues' },
          { title: 'Templates', to: 'apps-settings-ticket-settings-templates' },
          { title: 'Types', to: 'apps-settings-ticket-settings-types' },
        ],
      },
      {
        title: 'Users, Groups & Roles',
        children: [
          { title: 'Agents', to: 'apps-settings-users-groups-roles-agents' },
          { title: 'Agents Groups', to: 'apps-settings-users-groups-roles-agents-groups' },
          { title: 'Agents Roles', to: 'apps-settings-users-groups-roles-agents-roles' },
          { title: 'Customers', to: 'apps-settings-users-groups-roles-customers' },
          { title: 'Customers Groups', to: 'apps-settings-users-groups-roles-customers-groups' },
          { title: 'Customer Users', to: 'apps-settings-users-groups-roles-customer-users' },
          { title: 'Customer Users Customers', to: 'apps-settings-users-groups-roles-customer-users-customers' },
          { title: 'Customer Users Groups', to: 'apps-settings-users-groups-roles-customer-users-groups' },
          { title: 'Customer Users Services', to: 'apps-settings-users-groups-roles-customer-users-services' },
          { title: 'Groups', to: 'apps-settings-users-groups-roles-groups' },
          { title: 'Roles', to: 'apps-settings-users-groups-roles-roles' },
          { title: 'Roles Groups', to: 'apps-settings-users-groups-roles-roles-groups' },
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
