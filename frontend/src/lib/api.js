import axios from 'axios';

// All API calls go through Next.js App Router API routes
const API_URL = '/api';

const getImageUrl = (path) => {
  if (!path) return null;
  
  // Cloudinary or absolute URLs — return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Relative paths (legacy local uploads)
  let normalizedPath = path.replace(/\\/g, '/');
  if (!normalizedPath.startsWith('/')) normalizedPath = '/' + normalizedPath;
  
  // Point to Backend for legacy uploads
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
  return `${BACKEND_URL}${normalizedPath}`;
};

const api = axios.create({
  baseURL: API_URL,
});

export { API_URL, getImageUrl };

// Request interceptor — no longer sends JWT Bearer tokens (Supabase cookies handle auth)
// Kept for backward compatibility with any components that still set localStorage token
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Members API
export const membersAPI = {
  list: (params) => api.get('/members', { params }),
  get: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  suspend: (id) => api.put(`/members/${id}/suspend`),
  activate: (id) => api.put(`/members/${id}/activate`),
  getQRCode: (id) => api.get(`/members/${id}/qrcode`),
  delete: (id) => api.delete(`/members/${id}`),
};

// Plans API
export const plansAPI = {
  list: (params) => api.get('/plans', { params }),
  create: (data) => api.post('/plans', data),
  update: (id, data) => api.put(`/plans/${id}`, data),
  delete: (id) => api.delete(`/plans/${id}`),
};

// Payments API
export const paymentsAPI = {
  list: (params) => api.get('/payments', { params }),
  create: (data) => api.post('/payments', data),
  getReceipt: (id) => api.get(`/payments/${id}/receipt`),
  dailyReport: (params) => api.get('/payments/daily-report', { params }),
  monthlyReport: (params) => api.get('/payments/monthly-report', { params }),
  export: (params) => api.get('/payments/export', { params, responseType: 'blob' }),
};

// Check-ins API
export const checkinsAPI = {
  list: (params) => api.get('/checkins', { params }),
  create: (data) => api.post('/checkins', data),
  frequency: (memberId, params) => api.get(`/checkins/frequency/${memberId}`, { params }),
};

// Dashboard API
export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
};

// Reports API
export const reportsAPI = {
  revenueByPlan: (params) => api.get('/reports/revenue-by-plan', { params }),
  defaulters: () => api.get('/reports/defaulters'),
  memberGrowth: (params) => api.get('/reports/member-growth', { params }),
  lowFrequency: (params) => api.get('/reports/low-frequency', { params }),
  export: (params) => api.get('/reports/export', { params }),
};

// Users API
export const usersAPI = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateProfile: (data) => api.put('/users/profile', data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Expenses API
export const expensesAPI = {
  list: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// Accounting API
export const accountingAPI = {
  summary: (params) => api.get('/accounting/summary', { params }),
  trends: (params) => api.get('/accounting/trends', { params }),
};

// Fixed Costs API
export const fixedCostsAPI = {
  list: () => api.get('/fixed-costs'),
  create: (data) => api.post('/fixed-costs', data),
  delete: (id) => api.delete(`/fixed-costs/${id}`),
};

// Settings API
export const settingsAPI = {
  get: () => api.get('/settings'),
  updateBackground: (data) => api.post('/settings/background', data),
  removeBackground: (key = 'background_image') => api.delete(`/settings/background?key=${key}`),
  updateSetting: (key, value) => api.post('/settings', { key, value }),
  exportDatabase: () => api.get('/settings/export-database', { responseType: 'blob' }),
  restoreDatabase: (data) => api.post('/settings/restore-database', data),
};

// Products API
export const productsAPI = {
  list: (params) => api.get('/products', { params }),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  recordSale: (data) => api.post('/products/sales', data),
  listSales: () => api.get('/products/sales'),
};

// Notifications API
export const notificationsAPI = {
  list: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications/clear-all'),
};

export default api;
