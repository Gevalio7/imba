import type { RouteNamedMap, _RouterTyped } from 'unplugin-vue-router'
import { canNavigate } from '@layouts/plugins/casl'
import { getFirstAccessibleRoutePath } from '@/utils/firstAccessibleRoute'
import { $api } from '@/utils/api'

interface AbilityRule { action: string; subject: string }

const readAbilityRulesFromSession = (): AbilityRule[] => {
  if (typeof sessionStorage === 'undefined') return []
  try {
    const raw = sessionStorage.getItem('userAbilityRules')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const setupGuards = (router: _RouterTyped<RouteNamedMap & { [key: string]: any }>) => {
  // 👉 router.beforeEach
  // Docs: https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
  router.beforeEach(async to => {
    /*
     * If it's a public route, continue navigation. This kind of pages are allowed to visited by login & non-login users. Basically, without any restrictions.
     * Examples of public routes are, 404, under maintenance, etc.
     */
    if (to.meta.public)
      return

    /**
     * Check if user is logged in by checking if token & user data exists in local storage
     * Feel free to update this logic to suit your needs
     */
    const isLoggedIn = !!(useCookie('userData').value && useCookie('accessToken').value)

    /*
      If user is logged in and is trying to access login like page, redirect to first accessible page
      else allow visiting the page
      (WARN: Don't allow executing further by return statement because next code will check for permissions)
     */
    if (to.meta.unauthenticatedOnly) {
      if (isLoggedIn) {
        // Перенаправляем на первый доступный пункт меню (по правам пользователя),
        // чтобы не попадать на страницу, которая скрыта в меню.
        const rules = readAbilityRulesFromSession()
        return getFirstAccessibleRoutePath(rules)
      }
      return undefined
    }

    // Если зашли на корень `/` — отправляем на первый доступный пункт.
    if (to.path === '/') {
      const rules = readAbilityRulesFromSession()
      return getFirstAccessibleRoutePath(rules)
    }



    // Если пользователь не авторизован — перенаправляем на login (чтобы не оставлять пользователя на пустой странице)
    // Проверяем наличие токена в cookie или sessionStorage (fallback для инкогнито/новой вкладки)
    const cookieUserData = useCookie('userData')
    const cookieAccessToken = useCookie('accessToken')
    const sessAccessToken = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null
    const isActuallyLoggedIn = !!((cookieUserData.value && cookieAccessToken.value) || sessAccessToken)

    // Если маршрут публичный — продолжаем
    if (to.meta?.public) return

    // Если не авторизован и это не страница, доступная только для неавторизованных — редирект на login
    if (!isActuallyLoggedIn && !to.meta?.unauthenticatedOnly) {
      return {
        name: 'login',
        query: {
          to: to.fullPath !== '/' ? to.fullPath : undefined,
        }
      }
    }

    // Проверяем права доступа к маршруту (если указаны meta.action/meta.subject)
    // Проверяем права асинхронно
    try {
      const allowed = await canNavigate(to)
      if (!allowed && to.matched.length) {
        return isActuallyLoggedIn
          ? { name: 'not-authorized' }
          : {
              name: 'login',
              query: {
                ...to.query,
                to: to.fullPath !== '/' ? to.path : undefined,
              },
            }
      }
    } catch (err) {
      // В случае ошибок при загрузке прав — запрещаем доступ авторизованным пользователям
      console.error('Error checking navigation permission:', err)
      if (isActuallyLoggedIn) return { name: 'not-authorized' }
      return { name: 'login', query: { to: to.fullPath !== '/' ? to.path : undefined } }
    }
  })
}
