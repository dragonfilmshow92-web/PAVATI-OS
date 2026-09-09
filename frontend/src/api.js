const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
const API_BASE = isFileProtocol ? 'http://localhost:3000/api' : '/api';

// Shared headers for every request
function getHeaders() {
  return {
    'Content-Type': 'application/json'
  };
}

// GET fetch with error resilience
async function apiFetch(url) {
  try {
    const res = await fetch(url, { headers: getHeaders() });
    return await res.json();
  } catch (err) {
    console.error('API GET error on ' + url + ':', err);
    throw err;
  }
}

// POST/PUT/DELETE fetch with JSON body and error resilience
async function apiPost(url, method = 'POST', data) {
  try {
    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: data !== undefined ? JSON.stringify(data) : undefined
    });
    return await res.json();
  } catch (err) {
    console.error(`API ${method} error on ${url}:`, err);
    throw err;
  }
}

export const api = {
  // Settings
  getSettings: () => apiFetch(`${API_BASE}/settings`),
  updateSettings: (data) => apiPost(`${API_BASE}/settings`, 'POST', data),

  // Categories & Items
  getCategories: () => apiFetch(`${API_BASE}/categories`),
  getItems: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`${API_BASE}/items${query ? `?${query}` : ''}`);
  },
  createItem: (data) => apiPost(`${API_BASE}/items`, 'POST', data),
  updateItem: (id, data) => apiPost(`${API_BASE}/items/${encodeURIComponent(id)}`, 'PUT', data),
  deleteItem: (id) => apiPost(`${API_BASE}/items/${encodeURIComponent(id)}`, 'DELETE'),
  getItemByBarcode: (barcode) => apiFetch(`${API_BASE}/items/barcode/${encodeURIComponent(barcode)}`),
  adjustStock: (data) => apiPost(`${API_BASE}/inventory/adjust`, 'POST', data),

  // Goods Receiving (GRN)
  getGRNRecords: () => apiFetch(`${API_BASE}/grn`),
  receiveGoods: (data) => apiPost(`${API_BASE}/grn/receive`, 'POST', data),

  // Suppliers
  getSuppliers: () => apiFetch(`${API_BASE}/suppliers`),
  createSupplier: (data) => apiPost(`${API_BASE}/suppliers`, 'POST', data),
  updateSupplier: (id, data) => apiPost(`${API_BASE}/suppliers/${encodeURIComponent(id)}`, 'PUT', data),
  deleteSupplier: (id) => apiPost(`${API_BASE}/suppliers/${encodeURIComponent(id)}`, 'DELETE'),

  // Customers & Khata
  getCustomers: () => apiFetch(`${API_BASE}/customers`),
  createCustomer: (data) => apiPost(`${API_BASE}/customers`, 'POST', data),
  updateCustomer: (id, data) => apiPost(`${API_BASE}/customers/${encodeURIComponent(id)}`, 'PUT', data),
  deleteCustomer: (id) => apiPost(`${API_BASE}/customers/${encodeURIComponent(id)}`, 'DELETE'),
  getCustomerHistory: (id) => apiFetch(`${API_BASE}/customers/${encodeURIComponent(id)}/history`),

  // Shifts
  getActiveShift: () => apiFetch(`${API_BASE}/shifts/active`),
  openShift: (data) => apiPost(`${API_BASE}/shifts/open`, 'POST', data),
  closeShift: (data) => apiPost(`${API_BASE}/shifts/close`, 'POST', data),

  // Checkout & Invoices
  checkout: (data) => apiPost(`${API_BASE}/cart/checkout`, 'POST', data),
  getInvoices: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`${API_BASE}/invoices${query ? `?${query}` : ''}`);
  },
  getInvoice: (no) => apiFetch(`${API_BASE}/invoices/${encodeURIComponent(no)}`),
  returnInvoiceItem: (no, data) => apiPost(`${API_BASE}/invoices/${encodeURIComponent(no)}/return`, 'POST', data),

  // UPI QR String
  getUpiPayload: (amount, invoiceNo) => apiFetch(`${API_BASE}/upi/payload?amount=${amount}&invoice_no=${invoiceNo}`),

  // Reports & Dashboard
  getReports: (range = 'all', startDate = null, endDate = null) => {
    let url = `${API_BASE}/reports?range=${encodeURIComponent(range)}`;
    if (startDate) url += `&start=${encodeURIComponent(startDate)}`;
    if (endDate) url += `&end=${encodeURIComponent(endDate)}`;
    return apiFetch(url);
  },
  getDashboardStats: () => apiFetch(`${API_BASE}/dashboard/stats`),

  // Promotions
  getPromotions: () => apiFetch(`${API_BASE}/promotions`),

  // Returns & Exchanges
  getReturns: () => apiFetch(`${API_BASE}/returns`),
  processReturn: (data) => apiPost(`${API_BASE}/returns`, 'POST', data),

  // Purchase Orders
  getPurchaseOrders: () => apiFetch(`${API_BASE}/purchase-orders`),
  createPurchaseOrder: (data) => apiPost(`${API_BASE}/purchase-orders`, 'POST', data),
  updatePurchaseOrderStatus: (id, status) => apiPost(`${API_BASE}/purchase-orders/${encodeURIComponent(id)}/status`, 'PUT', { status }),

  // Coupons
  getCoupons: () => apiFetch(`${API_BASE}/coupons`),
  createCoupon: (data) => apiPost(`${API_BASE}/coupons`, 'POST', data),
  validateCoupon: (code, cart_total = 0) => apiPost(`${API_BASE}/coupons/validate`, 'POST', { code, cart_total }),
  toggleCoupon: (id, active) => apiPost(`${API_BASE}/coupons/${encodeURIComponent(id)}`, 'PUT', { active }),
  deleteCoupon: (id) => apiPost(`${API_BASE}/coupons/${encodeURIComponent(id)}`, 'DELETE'),

  // Analytics
  getChartData: () => apiFetch(`${API_BASE}/analytics/charts`),

  // Expenses
  getExpenses: () => apiFetch(`${API_BASE}/expenses`),
  addExpense: (data) => apiPost(`${API_BASE}/expenses`, 'POST', data),
  updateExpense: (id, data) => apiPost(`${API_BASE}/expenses/${encodeURIComponent(id)}`, 'PUT', data),
  deleteExpense: (id) => apiPost(`${API_BASE}/expenses/${encodeURIComponent(id)}`, 'DELETE'),

  // ERPNext
  testERPNext: (data) => apiPost(`${API_BASE}/erpnext/test`, 'POST', data),
  syncERPNextItems: (direction = 'pull') => apiPost(`${API_BASE}/erpnext/sync/items`, 'POST', { direction }),

  // 12-Module Operations & Hub Suite
  getHubStats: () => apiFetch(`${API_BASE}/reports/hub-stats`),
  getSalesTodaySummary: () => apiFetch(`${API_BASE}/reports/today`),
  getVendorGSTReport: () => apiFetch(`${API_BASE}/reports/vendor-gst`),
  getAllBranchSales: (range = 'month', start = null, end = null) => {
    let url = `${API_BASE}/reports/all-branches?range=${encodeURIComponent(range)}`;
    if (start) url += `&start=${encodeURIComponent(start)}`;
    if (end) url += `&end=${encodeURIComponent(end)}`;
    return apiFetch(url);
  },
  getCustomerAnalysis: () => apiFetch(`${API_BASE}/reports/customer-analysis`),
  getProductActivity: (range = 'month', start = null, end = null) => {
    let url = `${API_BASE}/reports/product-activity?range=${encodeURIComponent(range)}`;
    if (start) url += `&start=${encodeURIComponent(start)}`;
    if (end) url += `&end=${encodeURIComponent(end)}`;
    return apiFetch(url);
  },
  getBackupInvoices: (query = '') => apiFetch(`${API_BASE}/reports/backup-invoices?q=${encodeURIComponent(query)}`),
  getServiceReminders: () => apiFetch(`${API_BASE}/reports/service-reminders`),
  createServiceReminder: (data) => apiPost(`${API_BASE}/reports/service-reminders`, 'POST', data),
  updateServiceReminder: (id, data) => apiPost(`${API_BASE}/reports/service-reminders/${encodeURIComponent(id)}`, 'PUT', data),
  deleteServiceReminder: (id) => apiPost(`${API_BASE}/reports/service-reminders/${encodeURIComponent(id)}`, 'DELETE')
};
