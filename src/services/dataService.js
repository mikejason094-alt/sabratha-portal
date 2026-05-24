import { api } from './api'

export const studentService = {
  getCurrentStudent: () => null,
}

export const semesterService = {
  getAll: () => api.get('/semesters'),
  getById: (id) => api.get(`/semesters/${id}`),
  getCurrent: () => api.get('/semesters/current'),
}

export const courseService = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  getBySemester: async (semesterId) => {
    const all = await api.get('/courses')
    return all.filter((c) => c.semester === semesterId)
  },
  toggleRegistration: (courseId) => api.post(`/courses/${courseId}/register`),
  getMyCourses: () => api.get('/courses/my'),
}

export const lectureService = {
  getAll: () => api.get('/lectures'),
  getByDay: async (day) => {
    const all = await api.get('/lectures')
    return all.filter((l) => l.day === day)
  },
  getRegistered: async () => {
    const all = await api.get('/lectures')
    return all.filter((l) => l.registered)
  },
  toggleRegistration: (lectureId) => api.post(`/lectures/${lectureId}/register`),
}

export const newsService = {
  getAll: (category) => api.get(`/news${category && category !== 'all' ? `?category=${category}` : ''}`),
  getByCategory: (category) => api.get(`/news?category=${category}`),
  getById: (id) => api.get(`/news/${id}`),
}

export const teacherService = {
  getCourses: () => api.get('/teacher/courses'),
  getCourseStudents: (courseId) => api.get(`/teacher/courses/${courseId}/students`),
  getCourseGrades: (courseId) => api.get(`/teacher/courses/${courseId}/grades`),
  updateGrade: (courseId, studentId, data) => api.put(`/teacher/courses/${courseId}/grades/${studentId}`, data),
  getCourseExams: (courseId) => api.get(`/teacher/courses/${courseId}/exams`),
  createExam: (courseId, data) => api.post(`/teacher/courses/${courseId}/exams`, data),
  deleteExam: (examId) => api.delete(`/teacher/exams/${examId}`),
}

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
}

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  getUser: async (id) => {
    const users = await api.get('/admin/users')
    return users.find(u => u._id === id) || null
  },
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  resetPassword: (id) => api.put(`/admin/users/${id}/reset-password`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
}
