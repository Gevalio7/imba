import appsAndPages from '@/navigation/vertical/apps-and-pages'
import dashboard from '@/navigation/vertical/dashboard'

interface AbilityRule {
  action: string
  subject: string
}

// Объединяем все секции меню в порядке их отображения
const ALL_MENU = [...dashboard, ...appsAndPages]

/**
 * Возвращает имя первого пункта меню (`to`), для которого пользователь имеет
 * право `read` согласно его userAbilityRules.
 *
 * Используется для редиректа после логина или при заходе на корень сайта,
 * чтобы пользователь не попадал на страницу, которой он не может видеть в меню.
 *
 * Алгоритм: пробегаемся по `apps-and-pages.ts` сверху вниз, для каждого
 * пункта с `to`+`subject` проверяем, есть ли в правилах правило
 * `{ action: 'read', subject }` (или CASL-эквивалент). Возвращаем первое
 * совпадение или `null`, если ничего не подходит.
 *
 * @returns route name (имя маршрута для router.push({ name }))
 */
export function getFirstAccessibleRouteName(rules: AbilityRule[]): string | null {
  if (!Array.isArray(rules) || rules.length === 0)
    return null

  // Map subject -> true для быстрой проверки
  const grantedReadSubjects = new Set<string>()
  for (const rule of rules) {
    if (rule.action === 'read' && typeof rule.subject === 'string')
      grantedReadSubjects.add(rule.subject)

    // 'manage' / 'all' даёт доступ ко всему — обрабатываем как полный доступ
    if (rule.action === 'manage' && rule.subject === 'all')
      return null // null означает "разрешено всё, использовать дефолт"
  }

  // Рекурсивно обходим пункты меню
  const findFirst = (items: any[]): string | null => {
    for (const item of items) {
      if (!item || typeof item !== 'object')
        continue

      // Если это леaf-пункт с `to` и `subject` — проверяем
      if (item.to && item.subject && grantedReadSubjects.has(item.subject))
        return typeof item.to === 'string' ? item.to : item.to?.name ?? null

      // Если это группа с детьми — углубляемся
      if (Array.isArray(item.children)) {
        const found = findFirst(item.children)
        if (found)
          return found
      }
    }

    return null
  }

  return findFirst(ALL_MENU as any[])
}

/**
 * Явная карта route-name -> URL path для пунктов меню.
 *
 * Имена маршрутов в unplugin-vue-router формируются из путей по правилу
 * `/apps/knowledge-base` -> `apps-knowledge-base`, поэтому однозначно
 * восстановить путь автоматически нельзя (мы не знаем, где `/`, а где `-`).
 * Поэтому используем явную таблицу для известных пунктов меню.
 */
const ROUTE_NAME_TO_PATH: Record<string, string> = {
  'dashboards-analytics': '/dashboards/analytics',
  'apps-tickets': '/apps/tickets',
  'apps-tickets-add': '/apps/tickets/add',
  'apps-tickets-schedules': '/apps/tickets/schedules',
  'apps-chat': '/apps/chat',
  'apps-kanban': '/apps/kanban',
  'apps-agents': '/apps/agents',
  'apps-knowledge-base': '/apps/knowledge-base',
  'apps-services': '/apps/services',
  'apps-customers': '/apps/customers',
  'apps-customers-groups': '/apps/customers-groups',
  'apps-customer-users': '/apps/customer-users',
  'apps-organization-structure': '/apps/organization-structure',
  'apps-roles': '/apps/roles',
  'apps-permissions': '/apps/permissions',
  'apps-queues': '/apps/queues',
  'apps-types': '/apps/types',
  'apps-type-categories': '/apps/type-categories',
  'apps-states': '/apps/states',
  'apps-priorities': '/apps/priorities',
  'apps-sla': '/apps/sla',
  'apps-templates': '/apps/templates',
  'apps-template-queues': '/apps/template-queues',
  'apps-workflows': '/apps/workflows',
  'apps-greetings': '/apps/greetings',
  'apps-signatures': '/apps/signatures',
  'apps-auto-responses': '/apps/auto-responses',
  'apps-attachments': '/apps/attachments',
  'apps-tickets-system-configuration': '/apps/settings/ticket-settings',
  'apps-email-addresses': '/apps/email-addresses',
  'apps-post-master-mail-accounts': '/apps/post-master-mail-accounts',
  'apps-calendars': '/apps/calendars',
  'apps-session-management': '/apps/session-management',
  'apps-system-log': '/apps/system-log',
  'apps-backup': '/apps/backup',
  'apps-integrity-check': '/apps/integrity-check',
}

/**
 * Возвращает путь для редиректа. Если у пользователя нет правил —
 * возвращает дефолтный `/dashboards/analytics` (демо-страница без защиты).
 */
export function getFirstAccessibleRoutePath(rules: AbilityRule[]): string {
  const routeName = getFirstAccessibleRouteName(rules)
  if (!routeName)
    return '/dashboards/analytics'

  const path = ROUTE_NAME_TO_PATH[routeName]
  if (path)
    return path

  // Фолбэк: если имя неизвестно — пробуем сгенерировать путь по эвристике
  // (только первый сегмент превращаем в `/`-префикс)
  const idx = routeName.indexOf('-')
  if (idx === -1)
    return `/${routeName}`

  return `/${routeName.slice(0, idx)}/${routeName.slice(idx + 1)}`
}
