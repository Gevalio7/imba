import type { App } from 'vue'
import { useGlobalPermissions } from '@/composables/useGlobalPermissions'

export default function (app: App) {
  // Инициализируем систему прав доступа
  const { loadPermissions } = useGlobalPermissions()
  
  // Загружаем права доступа при инициализации приложения
  loadPermissions().catch(err => {
    console.error('Failed to load permissions on app initialization:', err)
  })
  
  // Делаем систему прав доступа доступной глобально
  app.config.globalProperties.$permissions = useGlobalPermissions()
}