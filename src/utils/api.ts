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
    if (response) {
      // Если 401 — сессия/токен недействителен. Не делаем автоматический редирект здесь,
      // чтобы не прерывать текущие операции и позволить UI обработать ошибку (rollback, toast).
      if (response.status === 401) {
        console.error('API returned 401 Unauthorized. Caller should handle logout/reauthentication.', response)
      }
      // Логируем 403/401 для диагностики
      if (response.status === 403) {
        console.warn('API returned 403 Forbidden', response)
      }
    }

    // Пробрасываем ошибку дальше, чтобы вызвавший код мог её обработать
    return Promise.reject(response)
  },
})
