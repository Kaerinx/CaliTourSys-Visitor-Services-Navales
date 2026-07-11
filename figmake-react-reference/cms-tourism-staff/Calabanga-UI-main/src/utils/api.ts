import { projectId, publicAnonKey } from './supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-15ff0e9f`;

const headers = {
  'Authorization': `Bearer ${publicAnonKey}`,
  'Content-Type': 'application/json',
};

// Generic API call function
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// OTOP API
export const otopAPI = {
  getProducts: () => apiCall('/otop/products'),
  getProduct: (id: string) => apiCall(`/otop/products/${id}`),
  createProduct: (data: any) => apiCall('/otop/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => apiCall(`/otop/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => apiCall(`/otop/products/${id}`, { method: 'DELETE' }),
  
  getCategories: () => apiCall('/otop/categories'),
  createCategory: (data: any) => apiCall('/otop/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) => apiCall(`/otop/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => apiCall(`/otop/categories/${id}`, { method: 'DELETE' }),
};

// Business API
export const businessAPI = {
  getBusinesses: () => apiCall('/business/businesses'),
  getBusiness: (id: string) => apiCall(`/business/businesses/${id}`),
  createBusiness: (data: any) => apiCall('/business/businesses', { method: 'POST', body: JSON.stringify(data) }),
  updateBusiness: (id: string, data: any) => apiCall(`/business/businesses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBusiness: (id: string) => apiCall(`/business/businesses/${id}`, { method: 'DELETE' }),
  approveBusiness: (id: string, data: any) => apiCall(`/business/businesses/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
  rejectBusiness: (id: string, data: any) => apiCall(`/business/businesses/${id}/reject`, { method: 'POST', body: JSON.stringify(data) }),
  
  // Business types methods (using local state for now, can be enhanced later)
  getBusinessTypes: async () => {
    // For now, return empty array - types are managed locally in the component
    // Can be enhanced to store in KV store if needed
    return [];
  },
};

// Development API
export const developmentAPI = {
  getEvents: () => apiCall('/development/events'),
  getEvent: (id: string) => apiCall(`/development/events/${id}`),
  createEvent: (data: any) => apiCall('/development/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id: string, data: any) => apiCall(`/development/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id: string) => apiCall(`/development/events/${id}`, { method: 'DELETE' }),
  
  getPackages: () => apiCall('/development/packages'),
  createPackage: (data: any) => apiCall('/development/packages', { method: 'POST', body: JSON.stringify(data) }),
  updatePackage: (id: string, data: any) => apiCall(`/development/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePackage: (id: string) => apiCall(`/development/packages/${id}`, { method: 'DELETE' }),
};

// Visitor API
export const visitorAPI = {
  getSpots: () => apiCall('/visitor/spots'),
  getSpot: (id: string) => apiCall(`/visitor/spots/${id}`),
  
  getInquiries: () => apiCall('/visitor/inquiries'),
  getInquiry: (id: string) => apiCall(`/visitor/inquiries/${id}`),
  createInquiry: (data: any) => apiCall('/visitor/inquiries', { method: 'POST', body: JSON.stringify(data) }),
  updateInquiry: (id: string, data: any) => apiCall(`/visitor/inquiries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInquiry: (id: string) => apiCall(`/visitor/inquiries/${id}`, { method: 'DELETE' }),
  respondToInquiry: (id: string, data: any) => apiCall(`/visitor/inquiries/${id}/respond`, { method: 'POST', body: JSON.stringify(data) }),
  
  getAnalytics: () => apiCall('/visitor/analytics/stats'),
  updateAnalytics: (data: any) => apiCall('/visitor/analytics/stats', { method: 'POST', body: JSON.stringify(data) }),
};

// Reports API
export const reportsAPI = {
  getAllReports: () => apiCall('/reports/all'),
  getReport: (id: string) => apiCall(`/reports/${id}`),
  deleteReport: (id: string) => apiCall(`/reports/${id}`, { method: 'DELETE' }),
  
  generateOTOPReport: (data: any) => apiCall('/reports/generate/otop', { method: 'POST', body: JSON.stringify(data) }),
  generateBusinessReport: (data: any) => apiCall('/reports/generate/business', { method: 'POST', body: JSON.stringify(data) }),
  generateEventsReport: (data: any) => apiCall('/reports/generate/events', { method: 'POST', body: JSON.stringify(data) }),
  generateVisitorReport: (data: any) => apiCall('/reports/generate/visitor', { method: 'POST', body: JSON.stringify(data) }),
  
  getAnalyticsSummary: () => apiCall('/reports/analytics/summary'),
};