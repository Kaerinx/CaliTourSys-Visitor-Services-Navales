import http from "@/services/http";

export async function registerBusinessOwner(payload) {
  const { data } = await http.post("/accreditation/auth/register", payload);
  return data;
}

export async function login(payload) {
  const { data } = await http.post("/accreditation/auth/login", payload);
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

export async function getApplications() {
  const { data } = await http.get("/accreditation/applications");
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

export async function getRecords() {
  const { data } = await http.get("/accreditation/records");
  return data;
}

export async function getUsers() {
  const { data } = await http.get("/accreditation/admin/users");
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

export async function getAuditLogs() {
  const { data } = await http.get("/accreditation/admin/audit-logs");
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
