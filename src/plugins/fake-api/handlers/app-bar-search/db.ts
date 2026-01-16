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
        {
          url: { name: 'dashboards-crm' },
          icon: 'bx-doughnut-chart',
          title: 'CRM Dashboard',
        },
        {
          url: { name: 'dashboards-ecommerce' },
          icon: 'bx-cart',
          title: 'ECommerce Dashboard',
        },
        {
          url: { name: 'dashboards-academy' },
          icon: 'bx-book-open',
          title: 'Academy Dashboard',
        },
        {
          url: { name: 'dashboards-logistics' },
          icon: 'bx-car',
          title: 'Logistics Dashboard',
        },
      ],
    },
    {
      title: 'Front Pages',
      category: 'frontPages',
      children: [
        {
          url: { name: 'front-pages-landing-page' },
          icon: 'bx-file',
          title: 'Landing Front',
        },
        {
          url: { name: 'front-pages-pricing' },
          title: 'Pricing Front',
          icon: 'bx-file',
        },
        {
          url: { name: 'front-pages-payment' },
          icon: 'bx-file',
          title: 'Payment Front',
        },
        {
          url: { name: 'front-pages-checkout' },
          icon: 'bx-file',
          title: 'Checkout Front',
        },
        {
          url: { name: 'front-pages-help-center' },
          icon: 'bx-file',
          title: 'Help Center Front',
        },
      ],
    },
    {
      title: 'Apps & Pages',
      category: 'appsPages',
      children: [
        {
          url: { name: 'apps-email' },
          icon: 'bx-envelope',
          title: 'Email',
        },
        {
          url: { name: 'apps-chat' },
          icon: 'bx-chat',
          title: 'Chat',
        },
        {
          url: { name: 'apps-calendar' },
          icon: 'bx-calendar',
          title: 'Calendar',
        },
        {
          title: 'Kanban',
          icon: 'mdi-arrow-all',
          url: { name: 'apps-kanban' },
        },
        {
          url: { name: 'apps-ecommerce-dashboard' },
          icon: 'bx-cart',
          title: 'ECommerce Dashboard',
        },
        {
          url: { name: 'apps-ecommerce-product-list' },
          icon: 'bx-list-ul',
          title: 'Ecommerce - Product List',
        },
        {
          url: { name: 'apps-ecommerce-product-add' },
          icon: 'bx-radio-circle-marked',
          title: 'Ecommerce - Add Product',
        },
        {
          url: { name: 'apps-ecommerce-product-category-list' },
          icon: 'bx-list-ul',
          title: 'Ecommerce - Category List',
        },
        {
          url: { name: 'apps-ecommerce-order-list' },
          icon: 'bx-list-ul',
          title: 'Ecommerce - Order List',
        },
        {
          url: { name: 'apps-ecommerce-order-details-id', params: { id: '9042' } },
          icon: 'bx-list-check',
          title: 'Ecommerce - Order Details',
        },
        {
          url: { name: 'apps-ecommerce-customer-list' },
          icon: 'bx-user',
          title: 'Ecommerce - Customer List',
        },
        {
          url: { name: 'apps-ecommerce-customer-details-id', params: { id: '478426', tab: 'security' } },
          icon: 'bx-list-ul',
          title: 'Ecommerce - Customer Details',
        },
        {
          url: { name: 'apps-ecommerce-manage-review' },
          icon: 'bx-bxs-quote-alt-right',
          title: 'Ecommerce - Manage Review',
        },
        {
          url: { name: 'apps-ecommerce-referrals' },
          icon: 'bx-group',
          title: 'Ecommerce - Referrals',
        },
        {
          url: { name: 'apps-ecommerce-settings' },
          icon: 'bx-cog',
          title: 'Ecommerce - Settings',
        },
        {
          url: { name: 'apps-academy-dashboard' },
          icon: 'bx-book-open',
          title: 'Academy - Dashboard',
        },
        {
          url: { name: 'apps-academy-my-course' },
          icon: 'bx-list-ul',
          title: 'Academy - My Courses',
        },
        {
          url: { name: 'apps-academy-course-details' },
          icon: 'bx-list-ul',
          title: 'Academy - Course Details',
        },
        {
          url: { name: 'apps-logistics-dashboard' },
          icon: 'bx-car',
          title: 'Logistics - Dashboard',
        },
        {
          url: { name: 'apps-logistics-fleet' },
          icon: 'bx-car',
          title: 'Logistics - fleet',
        },
        {
          url: { name: 'apps-invoice-list' },
          icon: 'bx-list-ul',
          title: 'Invoice List',
        },
        {
          url: { name: 'apps-invoice-preview-id', params: { id: '5036' } },
          icon: 'bx-file',
          title: 'Invoice Preview',
        },
        {
          url: { name: 'apps-invoice-edit-id', params: { id: '5036' } },
          icon: 'bx-file',
          title: 'Invoice Edit',
        },
        {
          url: { name: 'apps-invoice-add' },
          icon: 'bx-bxs-file-plus',
          title: 'Invoice Add',
        },
        {
          url: { name: 'apps-user-list' },
          icon: 'bx-group',
          title: 'User List',
        },
        {
          url: { name: 'apps-user-view-id', params: { id: 21 } },
          icon: 'bx-show',
          title: 'User View',
        },
        {
          url: { name: 'pages-user-profile-tab', params: { tab: 'profile' } },
          icon: 'bx-user-circle',
          title: 'User Profile - Profile',
        },
        {
          url: { name: 'pages-account-settings-tab', params: { tab: 'account' } },
          icon: 'bx-user-circle',
          title: 'Account Settings - Account',
        },
        {
          url: { name: 'pages-account-settings-tab', params: { tab: 'security' } },
          icon: 'bx-lock-open',
          title: 'Account Settings - Security',
        },
        {
          url: { name: 'pages-account-settings-tab', params: { tab: 'billing-plans' } },
          icon: 'bx-dollar',
          title: 'Account Settings - Billing',
        },
        {
          url: { name: 'pages-account-settings-tab', params: { tab: 'notification' } },
          icon: 'bx-bell',
          title: 'Account Settings - Notifications',
        },
        {
          url: { name: 'pages-account-settings-tab', params: { tab: 'connection' } },
          icon: 'bx-link',
          title: 'Account Settings - Connections',
        },
        {
          url: { name: 'pages-pricing' },
          icon: 'bx-dollar',
          title: 'Pricing',
        },
        {
          url: { name: 'pages-faq' },
          icon: 'bx-help-circle',
          title: 'FAQ',
        },
        {
          url: { name: 'pages-misc-coming-soon' },
          icon: 'bx-time-five',
          title: 'Coming Soon',
        },
        {
          url: { name: 'pages-misc-under-maintenance' },
          icon: 'bx-cog',
          title: 'Under Maintenance',
        },
        {
          url: { path: '/pages/misc/page-not-found' },
          icon: 'bx-error-circle',
          title: 'Page Not Found - 404',
        },
        {
          url: { path: '/pages/misc/not-authorized' },
          icon: 'bx-user-x',
          title: 'Not Authorized - 401',
        },
        {
          url: { name: 'pages-authentication-login-v1' },
          icon: 'bx-log-in',
          title: 'Login V1',
        },
        {
          url: { name: 'pages-authentication-login-v2' },
          icon: 'bx-log-in',
          title: 'Login V2',
        },
        {
          url: { name: 'pages-authentication-register-v1' },
          icon: 'bx-user-plus',
          title: 'Register V1',
        },
        {
          url: { name: 'pages-authentication-register-v2' },
          icon: 'bx-user-plus',
          title: 'Register V2',
        },
        {
          icon: 'bx-envelope',
          title: 'Verify Email V1',
          url: { name: 'pages-authentication-verify-email-v1' },
        },
        {
          icon: 'bx-envelope',
          title: 'Verify Email V2',
          url: { name: 'pages-authentication-verify-email-v2' },
        },
        {
          url: { name: 'pages-authentication-forgot-password-v1' },
          icon: 'bx-lock',
          title: 'Forgot Password V1',
        },
        {
          url: { name: 'pages-authentication-forgot-password-v2' },
          icon: 'bx-lock',
          title: 'Forgot Password V2',
        },
        {
          url: { name: 'pages-authentication-reset-password-v1' },
          icon: 'bx-help-circle',
          title: 'Reset Password V1',
        },
        {
          url: { name: 'pages-authentication-reset-password-v2' },
          icon: 'bx-help-circle',
          title: 'Reset Password V2',
        },
        {
          icon: 'bx-devices',
          title: 'Two Steps V1',
          url: { name: 'pages-authentication-two-steps-v1' },
        },
        {
          icon: 'bx-devices',
          title: 'Two Steps V2',
          url: { name: 'pages-authentication-two-steps-v2' },
        },
        {
          url: { name: 'pages-dialog-examples' },
          icon: 'bx-square',
          title: 'Dialog Examples',
        },
        {
          url: { name: 'pages-authentication-register-multi-steps' },
          icon: 'bx-user-plus',
          title: 'Register Multi-Steps',
        },
        {
          url: { name: 'wizard-examples-checkout' },
          icon: 'bx-cart',
          title: 'Wizard - Checkout',
        },
        {
          url: { name: 'wizard-examples-create-deal' },
          icon: 'bx-gift',
          title: 'Wizard - create deal',
        },
        {
          url: { name: 'wizard-examples-property-listing' },
          icon: 'bx-home',
          title: 'Wizard - Property Listing',
        },
        {
          url: { name: 'apps-roles' },
          icon: 'bx-check-shield',
          title: 'Roles',
        },
        {
          url: { name: 'apps-permissions' },
          icon: 'bx-check-shield',
          title: 'Permissions',
        },
      ],
    },
    {
      title: 'User Interface',
      category: 'userInterface',
      children: [
        {
          url: { name: 'pages-typography' },
          icon: 'bx-font',
          title: 'Typography',
        },
        {
          url: { name: 'pages-icons' },
          icon: 'bx-box',
          title: 'Icons',
        },
        {
          url: { name: 'pages-cards-card-basic' },
          icon: 'bx-credit-card',
          title: 'Card Basic',
        },
        {
          url: { name: 'pages-cards-card-advance' },
          icon: 'bx-id-card',
          title: 'Card Advance',
        },
        {
          url: { name: 'pages-cards-card-statistics' },
          icon: 'bx-bar-chart',
          title: 'Card Statistics',
        },
        {
          url: { name: 'pages-cards-card-widgets' },
          icon: 'bx-bar-chart',
          title: 'Card widgets',
        },
        {
          url: { name: 'pages-cards-card-gamifications' },
          icon: 'bx-collection',
          title: 'Card Gamifications',
        },
        {
          url: { name: 'pages-cards-card-actions' },
          icon: 'bx-mouse',
          title: 'Card Actions',
        },
        {
          url: { name: 'components-alert' },
          icon: 'bx-error',
          title: 'Alerts',
        },
        {
          url: { name: 'components-avatar' },
          icon: 'bx-user-circle',
          title: 'Avatars',
        },
        {
          url: { name: 'components-badge' },
          icon: 'bx-badge',
          title: 'Badges',
        },
        {
          url: { name: 'components-button' },
          icon: 'bx-plus-circle',
          title: 'Buttons',
        },
        {
          url: { name: 'components-chip' },
          icon: 'bx-square',
          title: 'Chips',
        },
        {
          url: { name: 'components-dialog' },
          icon: 'bx-square',
          title: 'Dialogs',
        },
        {
          url: { name: 'components-list' },
          icon: 'bx-list-ul',
          title: 'List',
        },
        {
          url: { name: 'components-menu' },
          icon: 'bx-menu',
          title: 'Menu',
        },
        {
          url: { name: 'components-pagination' },
          icon: 'bx-skip-next-circle',
          title: 'Pagination',
        },
        {
          url: { name: 'components-progress-circular' },
          icon: 'bx-loader-circle',
          title: 'Progress Circular',
        },
        {
          url: { name: 'components-progress-linear' },
          icon: 'bx-loader-circle',
          title: 'Progress Linear',
        },
        {
          url: { name: 'components-expansion-panel' },
          icon: 'bx-align-middle',
          title: 'Expansion Panel',
        },
        {
          url: { name: 'components-snackbar' },
          icon: 'bx-message-dots',
          title: 'Snackbar',
        },
        {
          url: { name: 'components-tabs' },
          icon: 'bx-window-alt',
          title: 'Tabs',
        },
        {
          url: { name: 'components-timeline' },
          icon: 'bx-move-horizontal',
          title: 'Timeline',
        },
        {
          url: { name: 'components-tooltip' },
          icon: 'bx-message',
          title: 'Tooltip',
        },
        {
          url: { name: 'extensions-tour' },
          icon: 'bx-cube',
          title: 'Tour',
        },
        {
          url: { name: 'extensions-swiper' },
          icon: 'bx-image',
          title: 'Swiper',
        },
      ],
    },
    {
      title: 'Forms & Tables',
      category: 'formsTables',
      children: [
        {
          url: { name: 'forms-textfield' },
          icon: 'bx-text',
          title: 'TextField',
        },
        {
          url: { name: 'forms-select' },
          icon: 'bx-list-check',
          title: 'Select',
        },
        {
          url: { name: 'forms-checkbox' },
          icon: 'bx-check-square',
          title: 'Checkbox',
        },
        {
          url: { name: 'forms-radio' },
          icon: 'bx-radio-circle-marked',
          title: 'Radio',
        },
        {
          url: { name: 'forms-combobox' },
          icon: 'bx-check-square',
          title: 'Combobox',
        },
        {
          url: { name: 'forms-date-time-picker' },
          icon: 'bx-calendar',
          title: 'Date Time picker',
        },
        {
          url: { name: 'forms-textarea' },
          icon: 'bx-note',
          title: 'Textarea',
        },
        {
          url: { name: 'forms-switch' },
          icon: 'bx-toggle-right',
          title: 'Switch',
        },
        {
          url: { name: 'forms-file-input' },
          icon: 'bx-upload',
          title: 'File Input',
        },
        {
          url: { name: 'forms-editors' },
          icon: 'bx-edit',
          title: 'Editors',
        },
        {
          url: { name: 'forms-rating' },
          icon: 'bx-star',
          title: 'Form Rating',
        },
        {
          url: { name: 'forms-slider' },
          icon: 'bx-slider',
          title: 'Slider',
        },
        {
          url: { name: 'forms-range-slider' },
          icon: 'bx-slider',
          title: 'Range Slider',
        },
        {
          url: { name: 'forms-form-layouts' },
          icon: 'bx-cube',
          title: 'Form Layouts',
        },
        {
          url: { name: 'forms-form-validation' },
          icon: 'bx-check-circle',
          title: 'Form Validation',
        },
        {
          url: { name: 'forms-custom-input' },
          icon: 'bx-detail',
          title: 'Custom Input',
        },
        {
          url: { name: 'forms-autocomplete' },
          icon: 'bx-align-left',
          title: 'Autocomplete',
        },
        {
          url: { name: 'tables-data-table' },
          icon: 'bx-table',
          title: 'Data Table',
        },
        {
          url: { name: 'tables-simple-table' },
          icon: 'bx-table',
          title: 'Simple Table',
        },
        {
          url: { name: 'forms-form-wizard-numbered' },
          icon: 'bx-align-middle',
          title: 'Form Wizard Numbered',
        },
        {
          url: { name: 'forms-form-wizard-icons' },
          icon: 'bx-align-middle',
          title: 'Form Wizard Icons',
        },
      ],
    },
    {
      title: 'Chart & Misc',
      category: 'chartsMisc',
      children: [
        {
          url: { name: 'charts-apex-chart' },
          icon: 'bx-line-chart',
          title: 'Apex Charts',
        },
        {
          url: { name: 'charts-chartjs' },
          icon: 'bx-network-chart',
          title: 'ChartJS',
        },
        {
          url: { name: 'access-control' },
          icon: 'bx-shield',
          title: 'Access Control (ACL)',
        },
      ],
    },
  ],
}
