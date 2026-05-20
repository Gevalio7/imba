import type { App } from 'vue'

import { createMongoAbility } from '@casl/ability'
import { abilitiesPlugin } from '@casl/vue'
import type { Rule } from './ability'
import { $api } from '@/utils/api'

/**
 * Читаем ability rules из storage.
 * Приоритет: sessionStorage → localStorage (fallback для новых вкладок).
 * Cookie не подходит — лимит 4KB, а при 100+ правилах JSON > 7KB.
 */
function getInitialRules(): Rule[] {
  if (typeof window === 'undefined')
    return []
  try {
    // Ensure sessionStorage contains userData / accessToken / rules when cookies exist (handle incognito/new tab)
    const getCookie = (name: string) => document.cookie.split('; ').reduce((s, c) => {
      const [k, v] = c.split('=')

      return k === name ? decodeURIComponent(v) : s
    }, null as string | null)

    try {
      const cookieUser = getCookie('userData')
      const cookieToken = getCookie('accessToken')

      // Validate token locally (exp) helper
      const isJwtValid = (token: string | null) => {
        if (!token)
          return false
        try {
          const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
          if (payload && typeof payload.exp === 'number')
            return payload.exp * 1000 > Date.now()

          return true
        }
        catch (e) { return false }
      }

      // If cookie token exists and looks valid, confirm with server via /api/auth/me before trusting cookies
      if (cookieToken && isJwtValid(cookieToken)) {
        // perform non-blocking server check; if OK, sync cookies -> session
        // Server check for /auth/me removed — session/localStorage sync is handled elsewhere
        // (This avoids 404 caused by $api initialization timing in early plugin execution.)
        // If needed, re-enable with an explicit fetch to backend URL after app init.

      }

      // Note: we don't block on server check above; if it succeeds it will sync sessionStorage asynchronously
    }
    catch (e) {
      console.warn('cookie->session sync failed', e)
    }

    // 1. sessionStorage (текущая вкладка, заполняется при логине)
    const session = sessionStorage.getItem('userAbilityRules')
    if (session) {
      try {
        const parsed = JSON.parse(session)

        // Respect timestamp TTL (24h)
        const ts = Number(sessionStorage.getItem('userAbilityRules_ts') || '0')
        const TTL = 24 * 60 * 60 * 1000
        if (Date.now() - ts > TTL) {
          // expired - ignore and try localStorage
        }
        else if (Array.isArray(parsed) && parsed.length > 0) { return parsed }
      }
      catch (e) {
        // malformed -> continue to local
      }
    }

    // 2. localStorage (общий между вкладками — fallback для новой вкладки)
    const local = localStorage.getItem('userAbilityRules')
    if (local) {
      try {
        const parsed = JSON.parse(local)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Синхронизируем в sessionStorage для последующих чтений and stamp
          sessionStorage.setItem('userAbilityRules', local)
          sessionStorage.setItem('userAbilityRules_ts', String(Date.now()))

          return parsed
        }
      }
      catch (e) { /* ignore */ }
    }

    return []
  }
  catch {
    return []
  }
}

export default function (app: App) {
  const initialAbility = createMongoAbility(getInitialRules())

  app.use(abilitiesPlugin, initialAbility, {
    useGlobalProperties: true,
  })
}
