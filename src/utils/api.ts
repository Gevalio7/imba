import { $fetch } from 'ofetch'

export const $api = $fetch.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  onRequest({ options }) {
    let accessToken = null
    if (typeof sessionStorage !== 'undefined') {
      accessToken = sessionStorage.getItem('accessToken')
    }
    if (accessToken) {
      options.headers = new Headers(options.headers || {})
      options.headers.set('Authorization', `Bearer ${accessToken}`)
    }
  },
  onResponseError({ response }) {
    if (response.status === 401) {
      // Очищаем токен и перенаправляем на логин
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('accessToken')
      }
      window.location.href = '/login'
    }
  },
})
