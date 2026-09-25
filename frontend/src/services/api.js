import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Trips
export const getTrips = () => api.get('/trips/')
export const createTrip = (data) => api.post('/trips/', data)
export const updateTrip = (id, data) => api.patch(`/trips/${id}`, data)
export const deleteTrip = (id) => api.delete(`/trips/${id}`)

// Journal
export const getJournal = () => api.get('/journal/')
export const createEntry = (data) => api.post('/journal/', data)
export const deleteEntry = (id) => api.delete(`/journal/${id}`)

// Gmail
export const getGmailStatus = () => api.get('/gmail/status')
export const scanGmail = () => api.get('/gmail/scan')
export const connectGmail = () => { window.location.href = '/api/gmail/auth' }

// AI
export const chatAI = (question) => api.post('/ai/chat', { question })
export const detectTrip = (text) => api.post('/ai/detect', { text })
