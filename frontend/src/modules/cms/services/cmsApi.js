import { http } from '@/services/http'

export const cmsApi = {
  getHealth() {
    return http.getAuth('/cms/health')
  },
  getDashboard() {
    return http.getAuth('/cms/dashboard')
  },
  getNavigation() {
    return http.getAuth('/cms/navigation')
  },
  getAuditLogs(params) {
    return http.getAuth('/cms/audit-logs', params)
  },
}
