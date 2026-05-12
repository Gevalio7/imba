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
})
