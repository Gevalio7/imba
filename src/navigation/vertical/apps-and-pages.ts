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
      { title: 'Список', to: 'apps-agents-groups' },
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
      { title: 'Роли', to: 'apps-roles' },
      { title: 'Список ролей', to: 'apps-roles-cards' },
      { title: 'Разрешения', to: 'apps-permissions' },
    ],
  },
  
  { heading: 'Справочники' },

  {
    title: 'Настройки Тикетов',
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
      { title: 'Конфигурация системы', to: 'apps-tickets-system-configuration' },
    ],
  },

  {
    title: 'Настройка Почты',
    icon: { icon: 'bx-envelope' },
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
