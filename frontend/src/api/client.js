import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

api.interceptors.request.use(config => {
  const stored = localStorage.getItem('opf_auth')
  if (stored) {
    try {
      const { token } = JSON.parse(stored)
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch {}
  }
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('opf_auth')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

export const getStats = () => api.get('/stats/').then(r => r.data)
export const getOpportunities = (params = {}) => api.get('/opportunities/', { params }).then(r => r.data)
export const getAccounts = (params = {}) => api.get('/accounts/', { params }).then(r => r.data)
export const getAccount = (id) => api.get(`/accounts/${id}`).then(r => r.data)
export const getTravelSuggestions = (city, state) =>
  api.get('/travel/', { params: { city, state } }).then(r => r.data)
export const getConferences = () => api.get('/conferences/').then(r => r.data)
export const getEBXPriorities = (conferenceId) =>
  api.get(`/ebx/priorities/${conferenceId}`).then(r => r.data)
export const getEBXAssignments = (conferenceId) =>
  api.get(`/ebx/assignments/${conferenceId}`).then(r => r.data)
export const createEBXAssignment = (body) =>
  api.post('/ebx/assignments', body).then(r => r.data)
export const deleteEBXAssignment = (id) =>
  api.delete(`/ebx/assignments/${id}`).then(r => r.data)
export const getUsers = () => api.get('/users/').then(r => r.data)
export const getConferenceAttendees = (conferenceId) =>
  api.get(`/conference-attendees/${conferenceId}`).then(r => r.data)
export const createConferenceAttendee = (body) =>
  api.post('/conference-attendees/', body).then(r => r.data)
export const updateConferenceAttendee = (id, body) =>
  api.put(`/conference-attendees/${id}`, body).then(r => r.data)
export const deleteConferenceAttendee = (id) =>
  api.delete(`/conference-attendees/${id}`).then(r => r.data)
export const getTravelPlans = () => api.get('/travel-plans/').then(r => r.data)
export const createTravelPlan = (body) => api.post('/travel-plans/', body).then(r => r.data)
export const deleteTravelPlan = (id) => api.delete(`/travel-plans/${id}`).then(r => r.data)
export const getAdminTenants = () => api.get('/admin/tenants').then(r => r.data)
