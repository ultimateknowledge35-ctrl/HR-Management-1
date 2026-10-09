const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request('/auth/me'),
  changePassword: (data) => request('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),
  resetPassword: (data) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),

  // Settings
  getSettings: () => request('/settings'),
  getPublicSettings: () => request('/settings/public'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Admin Dashboard
  getAdminDashboard: () => request('/admin/dashboard'),

  // Admin Staff
  getStaff: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/staff${query ? `?${query}` : ''}`);
  },
  getStaffById: (id) => request(`/admin/staff/${id}`),
  createStaff: (data) => request('/admin/staff', { method: 'POST', body: JSON.stringify(data) }),
  updateStaff: (id, data) => request(`/admin/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStaff: (id) => request(`/admin/staff/${id}`, { method: 'DELETE' }),
  getDepartments: () => request('/admin/staff/departments'),

  // Admin Attendance
  getDailyAttendance: (date) => request(`/admin/attendance/daily${date ? `?date=${date}` : ''}`),
  markAttendance: (data) => request('/admin/attendance', { method: 'POST', body: JSON.stringify(data) }),
  markAllPresent: (date) => request('/admin/attendance/mark-all-present', { method: 'POST', body: JSON.stringify({ date }) }),
  getMonthlyAttendanceSummary: (year, month) => request(`/admin/attendance/monthly?year=${year}&month=${month}`),

  // Admin Payroll
  getPayroll: (year, month) => request(`/admin/payroll?year=${year}&month=${month}`),
  recordPayment: (data) => request('/admin/payroll/pay', { method: 'POST', body: JSON.stringify(data) }),
  getPaymentHistory: (staffId) => request(`/admin/payroll/history/${staffId}`),

  // Admin Requests
  getRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/requests${query ? `?${query}` : ''}`);
  },
  reviewRequest: (id, data) => request(`/admin/requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Admin Complaints
  getComplaints: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/complaints${query ? `?${query}` : ''}`);
  },
  updateComplaint: (id, data) => request(`/admin/complaints/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Admin Expenses
  getExpenses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/expenses${query ? `?${query}` : ''}`);
  },
  createExpense: (data) => request('/admin/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id, data) => request(`/admin/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id) => request(`/admin/expenses/${id}`, { method: 'DELETE' }),

  // Staff Portal
  getStaffProfile: () => request('/staff/profile'),
  getStaffSalary: () => request('/staff/salary'),
  getStaffRequests: () => request('/staff/requests'),
  submitStaffRequest: (data) => request('/staff/requests', { method: 'POST', body: JSON.stringify(data) }),
  getStaffComplaints: () => request('/staff/complaints'),
  submitStaffComplaint: (data) => request('/staff/complaints', { method: 'POST', body: JSON.stringify(data) }),
  getStaffAttendance: (year, month) => request(`/staff/attendance?year=${year}&month=${month}`),
};
