import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Request interceptor to attach JWT token if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const loginUser = async (credentials) => {
  const { data } = await API.post('/auth/login', credentials);
  return data;
};

export const registerCustomer = async (userData) => {
  const { data } = await API.post('/auth/register', userData);
  return data;
};

export const getMe = async () => {
  const { data } = await API.get('/auth/me');
  return data;
};

// Vehicle API calls (Requires Auth)
export const getMyVehicles = async () => {
  const { data } = await API.get('/vehicles');
  return data;
};

export const addVehicle = async (vehicleData) => {
  const { data } = await API.post('/vehicles', vehicleData);
  return data;
};

export const updateVehicle = async (id, vehicleData) => {
  const { data } = await API.put(`/vehicles/${id}`, vehicleData);
  return data;
};

export const deleteVehicle = async (id) => {
  const { data } = await API.delete(`/vehicles/${id}`);
  return data;
};

// Booking API calls (Requires Auth)
export const getAvailableSlots = async (date, duration) => {
  const { data } = await API.get(`/bookings/slots?date=${date}&duration=${duration}`);
  return data;
};

export const createBooking = async (bookingData) => {
  const { data } = await API.post('/bookings', bookingData);
  return data;
};

export const getBookingById = async (id) => {
  const { data } = await API.get(`/bookings/${id}`);
  return data;
};

export const getMyBookings = async () => {
  const { data } = await API.get('/bookings/my');
  return data;
};

export const cancelBooking = async (id) => {
  const { data } = await API.put(`/bookings/${id}/cancel`);
  return data;
};

// Payment API calls
export const createPaymentOrder = async (bookingId) => {
  const { data } = await API.post('/payments/create-order', { bookingId });
  return data;
};

export const verifyPayment = async (paymentData) => {
  const { data } = await API.post('/payments/verify', paymentData);
  return data;
};

// Global / Public Info
export const getShopSettings = async () => {
  const { data } = await API.get('/admin/settings');
  return data;
};

export const getServices = async () => {
  const { data } = await API.get('/admin/services');
  return data;
};

export const getServiceById = async (id) => {
  const { data } = await API.get(`/admin/services/${id}`);
  return data;
};

// Admin API calls (Requires Admin Auth)
export const getAdminDashboardStats = async () => {
  const { data } = await API.get('/admin/dashboard');
  return data;
};

export const getCustomers = async () => {
  const { data } = await API.get('/admin/users');
  return data;
};

export const toggleBlockUser = async (id) => {
  const { data } = await API.put(`/admin/users/${id}/block`);
  return data;
};

export const updateShopSettings = async (settingsData) => {
  const { data } = await API.put('/admin/settings', settingsData);
  return data;
};

export const getAvailability = async () => {
  const { data } = await API.get('/admin/availability');
  return data;
};

export const updateAvailability = async (availabilityData) => {
  const { data } = await API.put('/admin/availability', availabilityData);
  return data;
};

export const addService = async (serviceData) => {
  const { data } = await API.post('/admin/services', serviceData);
  return data;
};

export const updateService = async (id, serviceData) => {
  const { data } = await API.put(`/admin/services/${id}`, serviceData);
  return data;
};

export const deleteService = async (id) => {
  const { data } = await API.delete(`/admin/services/${id}`);
  return data;
};

export const getAllBookings = async () => {
  const { data } = await API.get('/admin/bookings');
  return data;
};

export const updateBookingStatusAdmin = async (id, status) => {
  const { data } = await API.put(`/admin/bookings/${id}/status`, { status });
  return data;
};

export default API;
