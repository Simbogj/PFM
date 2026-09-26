import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefresh);
          original.headers.Authorization = `Bearer ${accessToken}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (data) => api.post('/auth/refresh', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// ── Accounts ─────────────────────────────────────────────────
export const accountsAPI = {
  getAll: () => api.get('/accounts'),
  getOne: (id) => api.get(`/accounts/${id}`),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
  getTransactions: (id, params) => api.get(`/accounts/${id}/transactions`, { params }),
  reconcile: (id, data) => api.post(`/accounts/${id}/reconcile`, data),
};

// ── Transactions ──────────────────────────────────────────────
export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getOne: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getCategories: () => api.get('/transactions/categories'),
  createCategory: (data) => api.post('/transactions/categories', data),
};

// ── Transfers ─────────────────────────────────────────────────
export const transfersAPI = {
  getAll: (params) => api.get('/transfers', { params }),
  create: (data) => api.post('/transfers', data),
  delete: (id) => api.delete(`/transfers/${id}`),
};

// ── Income ───────────────────────────────────────────────────
export const incomeAPI = {
  getAll: (params) => api.get('/income', { params }),
  create: (data) => api.post('/income', data),
  createSalary: (data) => api.post('/income/salary', data),
  getSalaryRecords: (params) => api.get('/income/salary', { params }),
};

// ── Expenses ─────────────────────────────────────────────────
export const expensesAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getByCategory: (params) => api.get('/expenses/by-category', { params }),
  create: (data) => api.post('/expenses', data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// ── Savings ──────────────────────────────────────────────────
export const savingsAPI = {
  getAll: () => api.get('/savings'),
  getOne: (id) => api.get(`/savings/${id}`),
  create: (data) => api.post('/savings', data),
  update: (id, data) => api.put(`/savings/${id}`, data),
  delete: (id) => api.delete(`/savings/${id}`),
  deposit: (id, data) => api.post(`/savings/${id}/deposit`, data),
  withdraw: (id, data) => api.post(`/savings/${id}/withdraw`, data),
  getTransactions: (id) => api.get(`/savings/${id}/transactions`),
};

// ── Lending ──────────────────────────────────────────────────
export const lendingAPI = {
  getAll: (params) => api.get('/lendings', { params }),
  getOne: (id) => api.get(`/lendings/${id}`),
  create: (data) => api.post('/lendings', data),
  update: (id, data) => api.put(`/lendings/${id}`, data),
  recordPayment: (id, data) => api.post(`/lendings/${id}/payment`, data),
};

// ── Borrowing ─────────────────────────────────────────────────
export const borrowingAPI = {
  getAll: (params) => api.get('/borrowings', { params }),
  getOne: (id) => api.get(`/borrowings/${id}`),
  create: (data) => api.post('/borrowings', data),
  update: (id, data) => api.put(`/borrowings/${id}`, data),
  repay: (id, data) => api.post(`/borrowings/${id}/repay`, data),
};

// ── Payments ─────────────────────────────────────────────────
export const paymentsAPI = {
  getAll: (params) => api.get('/payments', { params }),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  pay: (id, data) => api.post(`/payments/${id}/pay`, data),
  delete: (id) => api.delete(`/payments/${id}`),
};

// ── Budgets ──────────────────────────────────────────────────
export const budgetsAPI = {
  getAll: (params) => api.get('/budgets', { params }),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
};

// ── Goals ─────────────────────────────────────────────────────
export const goalsAPI = {
  getAll: () => api.get('/goals'),
  getOne: (id) => api.get(`/goals/${id}`),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

// ── Reports ──────────────────────────────────────────────────
export const reportsAPI = {
  getCashFlow: (params) => api.get('/reports/cash-flow', { params }),
  getNetWorth: () => api.get('/reports/net-worth'),
  getMonthlySummary: (params) => api.get('/reports/monthly-summary', { params }),
  getAccountStatement: (params) => api.get('/reports/account-statement', { params }),
  getCalendarEvents: (params) => api.get('/reports/calendar-events', { params }),
};

export default api;
