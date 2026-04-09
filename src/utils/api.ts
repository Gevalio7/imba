import { $fetch } from 'ofetch'

export const $api = $fetch.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  onRequest({ options }) {
    const accessToken = useCookie('accessToken').value
    if (accessToken) {
      options.headers = new Headers(options.headers || {})
      options.headers.set('Authorization', `Bearer ${accessToken}`)
    }
  },
})
