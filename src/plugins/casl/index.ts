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
    // Ensure sessionStorage contains userData / accessToken / rules when cookies exist (handle incognito/new tab)
    const getCookie = (name: string) => document.cookie.split('; ').reduce((s, c) => { const [k, v] = c.split('='); return k === name ? decodeURIComponent(v) : s }, null as string | null)

    try {
      // If cookies present but sessionStorage missing, copy from cookies/localStorage
      const cookieUser = getCookie('userData')
      const cookieToken = getCookie('accessToken')
      if (cookieUser && !sessionStorage.getItem('userData')) sessionStorage.setItem('userData', cookieUser)
      if (cookieToken && !sessionStorage.getItem('accessToken')) sessionStorage.setItem('accessToken', cookieToken)
      if (!sessionStorage.getItem('userAbilityRules') && localStorage.getItem('userAbilityRules')) {
        sessionStorage.setItem('userAbilityRules', localStorage.getItem('userAbilityRules')!)
      }
    } catch (e) {
      // ignore cookie->session sync errors
      console.warn('cookie->session sync failed', e)
    }

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
