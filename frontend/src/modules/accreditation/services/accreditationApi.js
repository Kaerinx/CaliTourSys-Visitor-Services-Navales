import http from "@/services/http";

export async function registerBusinessOwner(payload) {
  const { data } = await http.post("/accreditation/auth/register", payload);
  return data;
}

export async function login(payload) {
  const { data } = await http.post("/accreditation/auth/login", payload);
  return data;
}

export async function getCurrentUser() {
  const { data } = await http.get("/accreditation/auth/me");
  return data;
}

export async function verifyEmail(token) {
  const { data } = await http.get("/accreditation/auth/verify-email", {
    params: { token },
  });
  return data;
}

export async function getDashboard() {
  const { data } = await http.get("/accreditation/dashboard");
  return data;
}

export async function updateAccount(payload) {
  const { data } = await http.patch("/accreditation/account", payload);
  return data;
}

export async function changePassword(payload) {
  const { data } = await http.patch("/accreditation/account/password", payload);
  return data;
}

export async function getBusinessProfile() {
  const { data } = await http.get("/accreditation/profile");
  return data;
}

export async function updateBusinessProfile(payload) {
  const { data } = await http.patch("/accreditation/profile", payload);
  return data;
}

export async function getApplications(params = {}) {
  const { data } = await http.get("/accreditation/applications", { params });
  return data;
}

export async function searchApplications(params = {}) {
  const { data } = await http.get("/accreditation/applications", { params });
  return data;
}

export async function getApplication(id) {
  const { data } = await http.get(`/accreditation/applications/${id}`);
  return data;
}

export async function createApplication(payload) {
  const { data } = await http.post("/accreditation/applications", payload);
  return data;
}

export async function saveApplicationDraft(id, payload) {
  const { data } = await http.patch(`/accreditation/applications/${id}/draft`, payload);
  return data;
}

export async function submitApplication(id) {
  const { data } = await http.patch(`/accreditation/applications/${id}/submit`);
  return data;
}

export async function reviewApplication(id, payload) {
  const { data } = await http.patch(`/accreditation/applications/${id}/review`, payload);
  return data;
}

export async function uploadApplicationDocument(id, formData) {
  const { data } = await http.post(`/accreditation/applications/${id}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function openApplicationDocument(id) {
  const { data } = await http.get(`/accreditation/documents/${id}/download`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(data);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function getRecords(params = {}) {
  const { data } = await http.get("/accreditation/records", { params });
  return data;
}

export async function getUsers(params = {}) {
  const { data } = await http.get("/accreditation/admin/users", { params });
  return data;
}

export async function createUser(payload) {
  const { data } = await http.post("/accreditation/admin/users", payload);
  return data;
}

export async function updateUserStatus(id, status) {
  const { data } = await http.patch(`/accreditation/admin/users/${id}/status`, { status });
  return data;
}

export async function getAuditLogs(params = {}) {
  const { data } = await http.get("/accreditation/admin/audit-logs", { params });
  return data;
}

export async function getNotifications() {
  const { data } = await http.get("/accreditation/notifications");
  return data;
}

export async function markNotificationRead(id) {
  const { data } = await http.patch(`/accreditation/notifications/${id}/read`);
  return data;
}
