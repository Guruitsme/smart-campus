import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('sc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('sc_token');
      await SecureStore.deleteItemAsync('sc_user');
    }
    return Promise.reject(error);
  }
);

export default api;

export const authService = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const studentService = {
  getDashboard: () => api.get('/students/dashboard'),
  getMarks: () => api.get('/students/marks'),
  getTimetable: () => api.get('/students/timetable'),
};

export const attendanceService = {
  getMyAttendance: () => api.get('/attendance/my-attendance'),
};

export const notesService = {
  getNotes: (params) => api.get('/notes', { params }),
};

export const assignmentService = {
  getAssignments: () => api.get('/assignments'),
};

export const announcementService = {
  getAnnouncements: (params) => api.get('/announcements', { params }),
};

export const notificationService = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
};
