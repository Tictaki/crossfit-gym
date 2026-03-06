import axios from 'axios';

const getBaseURL = () => {
  // In the browser, always use relative /api so the Next.js proxy handles it
  if (typeof window !== 'undefined') {
    if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('your-backend-url')) {
      let url = process.env.NEXT_PUBLIC_API_URL;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      if (!url.endsWith('/api')) {
        url = url.replace(/\/$/, '') + '/api';
      }
      return url;
    }
    const { hostname, port } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:3001/api`;
    }
    // On Vercel: use relative path, the proxy route at /api/[...path] handles it
    return '/api';
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl && !apiUrl.includes('your-backend-url')) return apiUrl;
  return 'http://localhost:3001/api';
};

const API_URL = getBaseURL();

// Upload URL must always be the absolute Railway backend root (not relative)
const getUploadURL = () => {
  if (typeof window !== 'undefined') {
    const { hostname, protocol, port } = window.location;
    
    // If we're on localhost, use local backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:3001`;
    }
    
    // If we're on a local IP (e.g. 192.168.x.x), use that same IP for backend
    // This allows mobile devices on the same network to see images
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      return `${protocol}//${hostname}:3001`;
    }

    // If we have a valid environment variable, use it
    if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('your-backend-url')) {
       return process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '');
    }

    // If we're on Vercel or any other production domain
    // Always point directly to the Railway backend
    return 'https://crossfit-gym-production-944c.up.railway.app';
  }
  return 'http://localhost:3001';
};

const ROOT_URL = getUploadURL();

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Normalize Windows paths if any
  let normalizedPath = path.replace(/\\/g, '/');
  
  // If the path doesn't start with a slash and doesn't start with uploads/
  // and is just a filename, it might need to be resolved properly.
  // At the very least, ensure a valid URL is formed.
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }
  
  return `${ROOT_URL}${normalizedPath}`;
};

const api = axios.create({
  baseURL: API_URL,
});

export { API_URL, ROOT_URL as UPLOAD_URL, getImageUrl };

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
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

// Members API (Uploads go direct to backend)
export const membersAPI = {
  list: (params) => api.get('/members', { params }),
  get: (id) => api.get(`/members/${id}`),
  create: (data) => api.post(`${ROOT_URL}/api/members`, data),
  update: (id, data) => api.put(`${ROOT_URL}/api/members/${id}`, data),
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
  getReceipt: (id) => api.get(`/payments/${id}/receipt`, { responseType: 'blob' }),
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
};

// Users API (Uploads go direct to backend)
export const usersAPI = {
  list: () => api.get('/users'),
  create: (data) => api.post(`${ROOT_URL}/api/users`, data),
  update: (id, data) => api.put(`${ROOT_URL}/api/users/${id}`, data),
  updateProfile: (data) => api.put(`${ROOT_URL}/api/users/profile`, data),
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

// Settings API (Uploads go direct to backend)
export const settingsAPI = {
  get: () => api.get('/settings'),
  updateBackground: (data) => api.post(`${ROOT_URL}/api/settings/background`, data),
  removeBackground: (key = 'background_image') => api.delete(`/settings/background?key=${key}`),
};

// Products API (Uploads go direct to backend)
export const productsAPI = {
  list: (params) => api.get('/products', { params }),
  create: (data) => api.post(`${ROOT_URL}/api/products`, data),
  update: (id, data) => api.put(`${ROOT_URL}/api/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  recordSale: (data) => api.post('/products/sales', data),
  listSales: () => api.get('/products/sales'),
  getLocalIP: () => api.get('/products/local-ip'),
};

export default api;
