import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    if (error.response?.status !== 401) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Products
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  search: (q) => api.get('/products/search', { params: { q } }),
  getLowStock: () => api.get('/products/low-stock'),
  getBrands: () => api.get('/products/brands'),
};

// Customers
export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getOne: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  search: (q) => api.get('/customers/search', { params: { q } }),
  getBirthdays: () => api.get('/customers/birthdays'),
};

// Sales
export const salesAPI = {
  getAll: (params) => api.get('/sales', { params }),
  getOne: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  processReturn: (id, data) => api.put(`/sales/${id}/return`, data),
  getDailySummary: () => api.get('/sales/daily-summary'),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getSalesChart: (days) => api.get('/dashboard/sales-chart', { params: { days } }),
  getTopProducts: () => api.get('/dashboard/top-products'),
  getRecentSales: () => api.get('/dashboard/recent-sales'),
  getAlerts: () => api.get('/dashboard/alerts'),
};

// Prescriptions
export const prescriptionAPI = {
  getAll: (params) => api.get('/prescriptions', { params }),
  getByCustomer: (customerId) => api.get(`/prescriptions/customer/${customerId}`),
  getById: (id) => api.get(`/prescriptions/${id}`),
  create: (data) => api.post('/prescriptions', data),
  update: (id, data) => api.put(`/prescriptions/${id}`, data),
  delete: (id) => api.delete(`/prescriptions/${id}`),
};

export const inventoryAPI = {
  getPurchaseOrders: () => api.get('/inventory/po'),
  createPurchaseOrder: (data) => api.post('/inventory/po', data),
  receivePurchaseOrder: (id, data) => api.post(`/inventory/po/${id}/receive`, data),
  getAdjustments: () => api.get('/inventory/adjust'),
  adjustStock: (data) => api.post('/inventory/adjust', data),
  getSuppliers: () => api.get('/inventory/suppliers'),
  createSupplier: (data) => api.post('/inventory/suppliers', data),
};

export default api;
