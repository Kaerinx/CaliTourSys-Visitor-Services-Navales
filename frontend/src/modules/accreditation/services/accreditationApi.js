import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/+$/, "");

const http = axios.create({
  baseURL: API_BASE_URL,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const backendMessage = error.response?.data?.error?.message;
    if (backendMessage && !error.response.data.message) {
      error.response.data.message = backendMessage;
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      if (window.location.pathname.startsWith("/accreditation/app")) {
        window.location.assign("/accreditation/login");
      }
    }
    return Promise.reject(error);
  }
);

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

export async function uploadBusinessProfileImages(formData) {
  const { data } = await http.post("/accreditation/profile/images", formData);
  return data;
}

export async function deleteBusinessProfileImage(id) {
  const { data } = await http.delete(`/accreditation/profile/images/${id}`);
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

export async function deleteDraftApplication(id) {
  const { data } = await http.delete(`/accreditation/applications/${id}`);
  return data;
}

export async function reviewApplication(id, payload) {
  const { data } = await http.patch(`/accreditation/applications/${id}/review`, payload);
  return data;
}

export async function uploadApplicationDocument(id, formData) {
  const { data } = await http.post(`/accreditation/applications/${id}/documents`, formData);
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

export async function getOwnerRatings() {
  const { data } = await http.get("/accreditation/ratings");
  return data;
}

export async function getProductInquiries(params = {}) {
  const { data } = await http.get("/accreditation/product-inquiries", { params });
  return data;
}

export async function updateProductInquiryStatus(id, status) {
  const { data } = await http.patch(`/accreditation/product-inquiries/${id}/status`, {
    status,
  });
  return data;
}
