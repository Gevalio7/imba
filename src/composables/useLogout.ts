import { useToast } from '@/composables/useToast'

export const useLogout = () => {
  const { showToast } = useToast()
  const ability = useAbility()

  const getStoredUserData = () => {
    if (typeof sessionStorage === 'undefined') return null
    try {
      const data = sessionStorage.getItem('userData')
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  const eraseCookie = (name: string) => {
    try {
      const expire = 'Thu, 01 Jan 1970 00:00:00 GMT'
      const path = 'path=/;'
      document.cookie = `${name}=; ${path} expires=${expire}`
      try {
        const hostname = location.hostname
        document.cookie = `${name}=; Domain=${hostname}; ${path} expires=${expire}`
        document.cookie = `${name}=; Domain=.${hostname}; ${path} expires=${expire}`
      } catch (err) {
        // ignore
      }
    } catch (err) {
      // ignore
    }
  }

  const logout = async () => {
    try {
      const userData = getStoredUserData()
      if (userData) {
        try {
          const res = await $api<{ message?: string }>('/sessionManagement/terminate-current', { method: 'POST' })
          if (res && (res.message && /terminate/i.test(res.message) || res.message === 'Session terminated successfully')) {
            showToast('Сессия завершена на сервере', 'success')
          } else {
            console.warn('terminate-current returned unexpected response')
            showToast('Не удалось завершить сессию на сервере', 'error')
          }
        } catch (err: any) {
          console.error('Ошибка при завершении сессии на сервере:', err?.message || err)
          const errMsg = err?.data?.message || err?.message || 'Серверная ошибка'
          showToast(`Ошибка завершения сессии: ${errMsg}`, 'error')
        }
      }

      // Clear storages
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('userAbilityRules')
          sessionStorage.removeItem('userData')
          sessionStorage.removeItem('accessToken')
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('userAbilityRules')
        }
      } catch (e) {
        console.warn('Ошибка при очистке session/local storage')
      }

      // Clear cookies
      try {
        const cookieUserData = useCookie('userData')
        const cookieAccessToken = useCookie('accessToken')
        cookieUserData.value = null
        cookieAccessToken.value = null
      } catch {
        // fallback to document.cookie
      }

      try {
        if (typeof document !== 'undefined') {
          const namesToRemove = ['userData', 'accessToken', 'userAbilityRules']
          const allCookies = document.cookie ? document.cookie.split(';').map(c => c.split('=')[0].trim()) : []
          const uniqueNames = Array.from(new Set([...namesToRemove, ...allCookies]))
          uniqueNames.forEach(n => eraseCookie(n))
        }
      } catch {
        console.warn('Ошибка при попытке очистить cookie через document.cookie')
      }

      // Reset ability
      try {
        ability.update([])
      } catch (e) {
        console.warn('Ошибка при сбросе ability:')
      }

      // Wait briefly to show toast, then redirect
      try {
        await new Promise(resolve => setTimeout(resolve, 1200))
        window.location.replace('/login')
      } catch {
        window.location.href = '/login'
      }
    } catch (e) {
      // Catch-all
      console.warn('Logout failed')
      window.location.replace('/login')
    }
  }

  return { logout }
}
