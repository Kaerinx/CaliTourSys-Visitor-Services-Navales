import { http } from '@/services/http'

export const cmsOperationsApi = {
  getMedia(params) {
    return http.getAuth('/cms/media', params)
  },
  getMediaById(id) {
    return http.getAuth(`/cms/media/${id}`)
  },
  createMedia(payload) {
    return http.postAuth('/cms/media', payload)
  },
  updateMedia(id, payload) {
    return http.patchAuth(`/cms/media/${id}`, payload)
  },
  archiveMedia(id) {
    return http.patchAuth(`/cms/media/${id}/archive`, {})
  },
  getPackageBookingRequests(params) {
    return http.getAuth('/cms/package-bookings', params)
  },
  getPackageBookingRequestById(id) {
    return http.getAuth(`/cms/package-bookings/${id}`)
  },
  createWalkInPackageBooking(payload) {
    return http.postAuth('/cms/package-bookings', payload)
  },
  deletePackageBookingRequest(id) {
    return http.deleteAuth(`/cms/package-bookings/${id}`)
  },
  updatePackageBookingSchedule(id, payload) {
    return http.patchAuth(`/cms/package-bookings/${id}/schedule`, payload)
  },
  extendPackageBookingDepositDeadline(id, payload) {
    return http.patchAuth(`/cms/package-bookings/${id}/deposit-deadline`, payload)
  },
  recordPackageBookingPayment(id, payload) {
    return http.postAuth(`/cms/package-bookings/${id}/payments`, payload)
  },
  transferPackageBookingCredit(id, payload) {
    return http.postAuth(`/cms/package-bookings/${id}/credit-transfers`, payload)
  },
  updatePackageBookingStatus(id, payload) {
    return http.patchAuth(`/cms/package-bookings/${id}/status`, payload)
  },
  verifyPackageBookingPayment(id) {
    return http.patchAuth(`/cms/package-bookings/${id}/payment/verify`, {})
  },
  rejectPackageBookingPayment(id, payload) {
    return http.patchAuth(`/cms/package-bookings/${id}/payment/reject`, payload)
  },
  updatePackageBookingNotes(id, payload) {
    return http.patchAuth(`/cms/package-bookings/${id}/notes`, payload)
  },
}

