import { Ref, ref } from 'vue'
import { useUserPermissions } from '@/composables/useUserPermissions'

// Глобальный экземпляр прав доступа
let globalPermissionsInstance: ReturnType<typeof useUserPermissions> | null = null

export function useGlobalPermissions() {
  // Если экземпляр уже создан, возвращаем его
  if (globalPermissionsInstance)
    return globalPermissionsInstance

  // Создаем новый экземпляр
  globalPermissionsInstance = useUserPermissions()

  return globalPermissionsInstance
}
