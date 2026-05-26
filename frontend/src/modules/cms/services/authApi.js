import { http } from '@/services/http'

export const authApi = {
  login(payload) {
    return http.post('/auth/login', payload)
  },
  logout() {
    return http.postAuth('/auth/logout', {})
  },
  refresh() {
    return http.post('/auth/refresh', {})
  },
  me() {
    return http.getAuth('/auth/me')
  },
}
