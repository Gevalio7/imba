import type { App } from 'vue'

import { createMongoAbility } from '@casl/ability'
import { abilitiesPlugin } from '@casl/vue'
import type { Rule } from './ability'

/**
 * Читаем ability rules из storage.
 * Приоритет: sessionStorage → localStorage (fallback для новых вкладок).
 * Cookie не подходит — лимит 4KB, а при 100+ правилах JSON > 7KB.
 */
function getInitialRules(): Rule[] {
  if (typeof window === 'undefined') return []
  try {
    // 1. sessionStorage (текущая вкладка, заполняется при логине)
    const session = sessionStorage.getItem('userAbilityRules')
    if (session) {
      const parsed = JSON.parse(session)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }

    // 2. localStorage (общий между вкладками — fallback для новой вкладки)
    const local = localStorage.getItem('userAbilityRules')
    if (local) {
      const parsed = JSON.parse(local)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Синхронизируем в sessionStorage для последующих чтений
        sessionStorage.setItem('userAbilityRules', local)
        return parsed
      }
    }

    return []
  } catch {
    return []
  }
}

export default function (app: App) {
  const initialAbility = createMongoAbility(getInitialRules())

  app.use(abilitiesPlugin, initialAbility, {
    useGlobalProperties: true,
  })
}
