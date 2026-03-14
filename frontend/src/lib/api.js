import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sc_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiry
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('sc_refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          localStorage.setItem('sc_token', data.token);
          original.headers.Authorization = `Bearer ${data.token}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  logout: () => api.post('/auth/logout'),
};

// ─── Students ────────────────────────────────────────────────────────────────
export const studentAPI = {
  getDashboard: () => api.get('/students/dashboard'),
  getMarks: () => api.get('/students/marks'),
  getTimetable: () => api.get('/students/timetable'),
};

// ─── Faculty ─────────────────────────────────────────────────────────────────
export const facultyAPI = {
  getDashboard: () => api.get('/faculty/dashboard'),
  uploadMarks: (data) => api.post('/faculty/marks', data),
  getPerformance: (subjectId, params) => api.get(`/faculty/performance/${subjectId}`, { params }),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStudents: (params) => api.get('/admin/students', { params }),
  getFaculty: (params) => api.get('/admin/faculty', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getSubjects: (params) => api.get('/admin/subjects', { params }),
  createSubject: (data) => api.post('/admin/subjects', data),
  updateSubject: (id, data) => api.put(`/admin/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/admin/subjects/${id}`),
  uploadTimetable: (data) => api.post('/admin/timetable', data),
};

// ─── Notes ───────────────────────────────────────────────────────────────────
export const notesAPI = {
  getNotes: (params) => api.get('/notes', { params }),
  getNoteById: (id) => api.get(`/notes/${id}`),
  uploadNote: (formData) => api.post('/notes', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateNote: (id, data) => api.put(`/notes/${id}`, data),
  deleteNote: (id) => api.delete(`/notes/${id}`),
};

// ─── Attendance ──────────────────────────────────────────────────────────────
export const attendanceAPI = {
  markAttendance: (data) => api.post('/attendance', data),
  getMyAttendance: () => api.get('/attendance/my-attendance'),
  getBySubject: (subjectId, params) => api.get(`/attendance/subject/${subjectId}`, { params }),
  updateAttendance: (id, data) => api.put(`/attendance/${id}`, data),
};

// ─── Assignments ─────────────────────────────────────────────────────────────
export const assignmentAPI = {
  getAssignments: (params) => api.get('/assignments', { params }),
  createAssignment: (formData) => api.post('/assignments', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  submitAssignment: (id, formData) => api.post(`/assignments/${id}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getSubmissions: (id) => api.get(`/assignments/${id}/submissions`),
  gradeSubmission: (submissionId, data) => api.put(`/assignments/submissions/${submissionId}/grade`, data),
  deleteAssignment: (id) => api.delete(`/assignments/${id}`),
};

// ─── Feedback ────────────────────────────────────────────────────────────────
export const feedbackAPI = {
  submitFeedback: (data) => api.post('/feedback', data),
  getAnalytics: (facultyId, params) => api.get(`/feedback/analytics/${facultyId}`, { params }),
  getAllAnalytics: (params) => api.get('/feedback/analytics', { params }),
};

// ─── Announcements ───────────────────────────────────────────────────────────
export const announcementAPI = {
  getAnnouncements: (params) => api.get('/announcements', { params }),
  getById: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// ─── Subjects ────────────────────────────────────────────────────────────────
export const subjectAPI = {
  getAll: (params) => api.get('/subjects', { params }),
};
