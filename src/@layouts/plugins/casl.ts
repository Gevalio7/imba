import type { RouteLocationNormalized } from 'vue-router'
import type { NavGroup } from '@layouts/types'
import { useGlobalPermissions } from '@/composables/useGlobalPermissions'

export const can = (action: string | undefined, subject: string | undefined) => {
  const { can: checkPermission } = useGlobalPermissions()

  if (!action || !subject)
    return true

  return checkPermission(action as string, subject as string)
}

export const canRead = (subject: string): boolean => {
  const { permissionsMap, loaded } = useGlobalPermissions()

  // Если права ещё не загружены, разрешаем (загрузка асинхронна, чтобы не моргало меню)
  if (!loaded.value)
    return true

  const map = permissionsMap.value as any

  // 1. Точное совпадение
  if (map[subject]?.read === true)
    return true

  // 2. Совпадение с суффиксом _read (на случай если subject передан без суффикса)
  if (map[`${subject}_read`]?.read === true)
    return true

  // 3. Иерархия: если subject — это «группа», ищем дочерние коды вида `${subject}_*_read`
  for (const key of Object.keys(map)) {
    if (key.startsWith(`${subject}_`) && map[key].read === true)
      return true
  }

  return false
}

export const canViewNavMenuGroup = (item: NavGroup) => {
  const hasOwnPerm = !!(item.action && item.subject)
  const children = item.children ?? []

  // Если у группы нет ни своих прав, ни детей — это не защищаемый пункт, показываем
  if (!hasOwnPerm && children.length === 0)
    return true

  // Если у группы есть свои права — проверяем их
  if (hasOwnPerm && canRead(item.subject as string))
    return true

  // Иначе показываем группу, если хотя бы один РЕАЛЬНО защищённый дочерний пункт доступен.
  // Дочерние пункты без `subject` НЕ дают видимость родительской группе,
  // чтобы не было «разрешено по умолчанию» из-за случайного пропуска subject.
  for (const child of children) {
    if ('children' in child) {
      // Вложенные группы — рекурсивно
      if (canViewNavMenuGroup(child as unknown as NavGroup))
        return true
      continue
    }
    if (child.action && child.subject && canRead(child.subject as string))
      return true
  }

  return false
}

export const canNavigate = async (to: RouteLocationNormalized) => {
  const gp = useGlobalPermissions()

  // ensure permissions are loaded before making navigation decision
  try {
    await gp.ensureLoaded()
  }
  catch (e) {
    // ignore - ensureLoaded handles its own errors
  }

  const { can: checkPermission } = gp
  const targetRoute = to.matched[to.matched.length - 1]

  if (targetRoute?.meta?.action && targetRoute?.meta?.subject)
    return checkPermission(targetRoute.meta.action, targetRoute.meta.subject)

  return to.matched.some(route => checkPermission(route.meta.action, route.meta.subject))
}
