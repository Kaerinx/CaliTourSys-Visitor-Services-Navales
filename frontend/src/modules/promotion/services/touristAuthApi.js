import { http } from '@/services/http'

const touristAuthPath = (path) => `/tourist-auth${path}`

export function register(payload) {
  return http.post(touristAuthPath('/register'), payload)
}

export function login(payload) {
  return http.post(touristAuthPath('/login'), payload)
}

export function me() {
  return http.getTourist(touristAuthPath('/me'))
}

export function logout() {
  return http.postTourist(touristAuthPath('/logout'), {})
}

export function updateProfile(payload) {
  return http.patchTourist(touristAuthPath('/profile'), payload)
}

export function changePassword(payload) {
  return http.patchTourist(touristAuthPath('/password'), payload)
}
