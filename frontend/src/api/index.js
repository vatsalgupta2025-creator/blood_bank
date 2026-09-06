import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor for uniform error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('bb_user');
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

export const setToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const login = (email, password) => api.post('/auth/login', { email, password });

// Dashboard
export const getDashboardSummary = () => api.get('/dashboard/summary');

// Blood Banks
export const getBloodBanks       = ()     => api.get('/blood-banks');
export const getBloodBank        = (id)   => api.get(`/blood-banks/${id}`);
export const getBloodBankStats   = (id)   => api.get(`/blood-banks/${id}/stats`);
export const createBloodBank     = (data) => api.post('/blood-banks', data);
export const updateBloodBank     = (id, data) => api.put(`/blood-banks/${id}`, data);
export const deleteBloodBank     = (id)   => api.delete(`/blood-banks/${id}`);

// Donors
export const getDonors           = (params) => api.get('/donors', { params });
export const getDonor            = (id)     => api.get(`/donors/${id}`);
export const createDonor         = (data)   => api.post('/donors', data);
export const updateDonor         = (id, data) => api.put(`/donors/${id}`, data);
export const deleteDonor         = (id)     => api.delete(`/donors/${id}`);

// Receivers
export const getReceivers        = (params) => api.get('/receivers', { params });
export const getReceiver         = (id)     => api.get(`/receivers/${id}`);
export const createReceiver      = (data)   => api.post('/receivers', data);
export const updateReceiver      = (id, data) => api.put(`/receivers/${id}`, data);
export const deleteReceiver      = (id)     => api.delete(`/receivers/${id}`);

// Blood Units
export const getBloodUnits       = (params) => api.get('/blood-units', { params });
export const getBloodUnit        = (id)     => api.get(`/blood-units/${id}`);
export const getInventorySummary = ()       => api.get('/blood-units/inventory');
export const createBloodUnit     = (data)   => api.post('/blood-units', data);
export const updateBloodUnit     = (id, data) => api.put(`/blood-units/${id}`, data);
export const deleteBloodUnit     = (id)     => api.delete(`/blood-units/${id}`);

// Blood Requests
export const getBloodRequests    = (params) => api.get('/blood-requests', { params });
export const getBloodRequest     = (id)     => api.get(`/blood-requests/${id}`);
export const createBloodRequest  = (data)   => api.post('/blood-requests', data);
export const updateBloodRequest  = (id, data) => api.put(`/blood-requests/${id}`, data);
export const deleteBloodRequest  = (id)     => api.delete(`/blood-requests/${id}`);

// Blood Tests
export const getBloodTests       = (params) => api.get('/blood-tests', { params });
export const getBloodTest        = (id)     => api.get(`/blood-tests/${id}`);
export const createBloodTest     = (data)   => api.post('/blood-tests', data);
export const updateBloodTest     = (id, data) => api.put(`/blood-tests/${id}`, data);
export const deleteBloodTest     = (id)     => api.delete(`/blood-tests/${id}`);

// Donation Events
export const getDonationEvents   = (params) => api.get('/donation-events', { params });
export const getDonationEvent    = (id)     => api.get(`/donation-events/${id}`);
export const createDonationEvent = (data)   => api.post('/donation-events', data);
export const updateDonationEvent = (id, data) => api.put(`/donation-events/${id}`, data);
export const deleteDonationEvent = (id)     => api.delete(`/donation-events/${id}`);

// Staff
export const getStaff            = (params) => api.get('/staff', { params });
export const getStaffMember      = (id)     => api.get(`/staff/${id}`);
export const createStaffMember   = (data)   => api.post('/staff', data);
export const updateStaffMember   = (id, data) => api.put(`/staff/${id}`, data);
export const deleteStaffMember   = (id)     => api.delete(`/staff/${id}`);

export default api;
