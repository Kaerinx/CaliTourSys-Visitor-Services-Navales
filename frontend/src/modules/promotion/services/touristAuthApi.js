import { http } from '@/services/http'

const touristAuthPath = (path) => `/tourist-auth${path}`

export function register(payload) {
  return http.post(touristAuthPath('/register'), payload)
}

export function login(payload) {
  return http.post(touristAuthPath('/login'), payload)
}

export function me() {
  return http.get(touristAuthPath('/me'))
}

export function logout() {
  return http.post(touristAuthPath('/logout'), {})
}
