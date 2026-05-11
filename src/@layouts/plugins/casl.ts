import type { RouteLocationNormalized } from 'vue-router'
import type { NavGroup } from '@layouts/types'
import { useGlobalPermissions } from '@/composables/useGlobalPermissions'

export const can = (action: string | undefined, subject: string | undefined) => {
  const { can: checkPermission } = useGlobalPermissions()
  
  if (!action || !subject) return true
  
  return checkPermission(action as string, subject as string)
}

export const canRead = (subject: string): boolean => {
  const { permissionsMap, loaded } = useGlobalPermissions()
  
  // Если права еще не загружены, разрешаем
  if (!loaded.value) return true
  
  // 1. Проверяем точное совпадение
  if (permissionsMap.value.has(subject)) {
    const perm = permissionsMap.value.get(subject)!
    if (perm.read === true) return true
  }
  
  // 2. Проверяем с суффиксом _read
  const permWithSuffix = permissionsMap.value.get(`${subject}_read`)
  if (permWithSuffix?.read === true) return true
  
  // 3. Проверяем наличие любого права начинающегося с subject
  const hasAnyMatchingPermission = Array.from(permissionsMap.value.keys()).some(key => 
    key === subject || key.startsWith(`${subject}_`)
  )
  if (hasAnyMatchingPermission) return true
  
  // 4. Проверяем, есть ли права с похожим названием (для случаев menu_roles -> menu_roles_list_read)
  const similarPermissions = Array.from(permissionsMap.value.keys()).filter(key => 
    key.includes(subject)
  )
  
  if (similarPermissions.length > 0) {
    // Проверяем, есть ли среди них хотя бы одно с read=true
    return similarPermissions.some(key => {
      const perm = permissionsMap.value.get(key)
      return perm?.read === true
    })
  }
  
  return false
}

export const canViewNavMenuGroup = (item: NavGroup) => {
  // Если нет action/subject - показываем
  if (!(item.action && item.subject)) return true
  
  // Проверяем право на родителя
  const canViewParent = canRead(item.subject as string)
  console.log(`canView [${item.title}]: subject=${item.subject}, canView=${canViewParent}`)
  
  return canViewParent
}

export const canNavigate = (to: RouteLocationNormalized) => {
  const { can: checkPermission } = useGlobalPermissions()

  const targetRoute = to.matched[to.matched.length - 1]

  if (targetRoute?.meta?.action && targetRoute?.meta?.subject)
    return checkPermission(targetRoute.meta.action, targetRoute.meta.subject)

  return to.matched.some(route => checkPermission(route.meta.action, route.meta.subject))
}
