import api from './axiosInstance';

// ── Dashboard ──
export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentRequests: () => api.get('/dashboard/recent-requests'),
};

// ── Inbox ──
export const inboxService = {
  getInbox: (limit = 20) => api.get(`/inbox?limit=${limit}`),
  markRead: (id) => api.post(`/inbox/${id}/mark-read`),
  syncToWorkItems: () => api.post('/inbox/sync-to-workitems'),
};

// ── Review Queue ──
export const reviewService = {
  getPending: () => api.get('/review-queue/pending'),
  resolve: (data) => api.post('/review-queue/resolve', data),
};

// ── Parts ──
export const partsService = {
  getAll: () => api.get('/parts'),
  search: (query) => api.get(`/parts/search?query=${encodeURIComponent(query)}`),
  getById: (id) => api.get(`/parts/${id}`),
  create: (data) => api.post('/parts', data),
  update: (id, data) => api.put(`/parts/${id}`, data),
  delete: (id) => api.delete(`/parts/${id}`),
};

// ── Customers ──
export const customerService = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// ── Quotations ──
export const quotationService = {
  getAll: () => api.get('/quotations'),
  getById: (id) => api.get(`/quotations/${id}`),
  downloadPdf: (id) => api.get(`/quotations/${id}/pdf`, { responseType: 'blob' }),
  updateStatus: (id, status) => api.put(`/quotations/${id}/status`, { status }),
};

// ── Invoices ──
export const invoiceService = {
  getAll: () => api.get('/invoices'),
  getById: (id) => api.get(`/invoices/${id}`),
  updateStatus: (id, status) => api.put(`/invoices/${id}/status`, { status }),
};

// ── Processing Requests ──
export const processingService = {
  getAll: () => api.get('/processing-requests'),
  getById: (id) => api.get(`/processing-requests/${id}`),
  getLogs: (id) => api.get(`/processing-requests/${id}/logs`),
};
