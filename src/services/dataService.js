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

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
}
