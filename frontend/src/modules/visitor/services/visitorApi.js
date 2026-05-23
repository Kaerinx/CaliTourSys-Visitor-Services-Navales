import http from '@/services/http'

function listFrom(response, preferredKeys = []) {
  if (Array.isArray(response)) return response

  for (const key of preferredKeys) {
    if (Array.isArray(response?.[key])) return response[key]
  }

  return response?.data || response?.records || response?.items || []
}

function normalizeStatusPayload(statusOrPayload) {
  return typeof statusOrPayload === 'string' ? { status: statusOrPayload } : statusOrPayload
}

const visitorApi = {
  login(payload) {
    return http.post('/auth/login', payload)
  },

  me() {
    return http.get('/auth/me')
  },

  updateProfile(payload) {
    return http.patch('/auth/profile', payload)
  },

  changePassword(payload) {
    return http.patch('/auth/password', payload)
  },

  dashboardSummary(params) {
    return http.get('/dashboard/summary', params)
  },

  receptionistSummary(params) {
    return http.get('/dashboard/receptionist-summary', params)
  },

  visitorSummary(params) {
    return http.get('/reports/visitor-summary', params)
  },

  visitorTrend(params) {
    return http.get('/reports/visitor-trend', params)
  },

  classification(params) {
    return http.get('/reports/classification', params)
  },

  exportVisitorSummary(params) {
    return http.get('/reports/visitor-summary/export', params)
  },

  async getVisitors(params) {
    const response = await http.get('/visitors', params)
    return listFrom(response, ['visitors', 'visitor_records'])
  },

  getVisitor(id) {
    return http.get(`/visitors/${id}`)
  },

  createVisitor(payload) {
    return http.post('/visitors', payload)
  },

  updateVisitor(id, payload) {
    return http.patch(`/visitors/${id}`, payload)
  },

  updateVisitorStatus(id, statusOrPayload) {
    return http.patch(`/visitors/${id}/status`, normalizeStatusPayload(statusOrPayload))
  },

  deleteVisitor(id) {
    return http.delete(`/visitors/${id}`)
  },

  createInquiry(payload) {
    return http.post('/inquiries', payload)
  },

  async getInquiries(params) {
    const response = await http.get('/inquiries', params)
    return listFrom(response, ['inquiries'])
  },

  getInquiry(id) {
    return http.get(`/inquiries/${id}`)
  },

  respondInquiry(id, payload) {
    return http.patch(`/inquiries/${id}/respond`, payload)
  },

  updateInquiryStatus(id, statusOrPayload) {
    return http.patch(`/inquiries/${id}/status`, normalizeStatusPayload(statusOrPayload))
  },

  async getEstablishments(params) {
    const response = await http.get('/establishments', params)
    return listFrom(response, ['establishments'])
  },

  createEstablishment(payload) {
    return http.post('/establishments', payload)
  },

  updateEstablishment(id, payload) {
    return http.patch(`/establishments/${id}`, payload)
  },

  deleteEstablishment(id) {
    return http.delete(`/establishments/${id}`)
  },

  async getUsers(params) {
    const response = await http.get('/users', params)
    return listFrom(response, ['users'])
  },

  createUser(payload) {
    return http.post('/users', payload)
  },

  updateUser(id, payload) {
    return http.patch(`/users/${id}`, payload)
  },

  deactivateUser(id) {
    return http.delete(`/users/${id}`)
  },

  deleteUser(id) {
    return http.delete(`/users/${id}`)
  },
}

visitorApi.auth = {
  login: visitorApi.login,
  me: visitorApi.me,
  updateProfile: visitorApi.updateProfile,
  changePassword: visitorApi.changePassword,
}

visitorApi.profile = {
  update: visitorApi.updateProfile,
  changePassword: visitorApi.changePassword,
}

visitorApi.dashboard = {
  summary: visitorApi.dashboardSummary,
  receptionistSummary: visitorApi.receptionistSummary,
}

visitorApi.reports = {
  summary: visitorApi.visitorSummary,
  visitorSummary: visitorApi.visitorSummary,
  trend: visitorApi.visitorTrend,
  visitorTrend: visitorApi.visitorTrend,
  classification: visitorApi.classification,
  exportSummary: visitorApi.exportVisitorSummary,
}

visitorApi.visitors = Object.assign((params) => visitorApi.getVisitors(params), {
  list: visitorApi.getVisitors,
  get: visitorApi.getVisitor,
  create: visitorApi.createVisitor,
  update: visitorApi.updateVisitor,
  updateStatus: visitorApi.updateVisitorStatus,
  delete: visitorApi.deleteVisitor,
})

visitorApi.inquiries = Object.assign((params) => visitorApi.getInquiries(params), {
  list: visitorApi.getInquiries,
  get: visitorApi.getInquiry,
  create: visitorApi.createInquiry,
  respond: visitorApi.respondInquiry,
  updateStatus: visitorApi.updateInquiryStatus,
})

visitorApi.establishments = Object.assign((params) => visitorApi.getEstablishments(params), {
  list: visitorApi.getEstablishments,
  create: visitorApi.createEstablishment,
  update: visitorApi.updateEstablishment,
  delete: visitorApi.deleteEstablishment,
})

visitorApi.users = Object.assign((params) => visitorApi.getUsers(params), {
  list: visitorApi.getUsers,
  create: visitorApi.createUser,
  update: visitorApi.updateUser,
  deactivate: visitorApi.deactivateUser,
  delete: visitorApi.deleteUser,
})

export { visitorApi }
export default visitorApi
