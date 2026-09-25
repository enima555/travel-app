import axios from 'axios'

const BASE = 'https://travel-app-doee.onrender.com/api'
const api = axios.create({ baseURL: BASE })

// Trips
export const getTrips = () => api.get('/trips/').then(r => r.data)
export const getTrip = (id) => api.get(`/trips/${id}`).then(r => r.data)
export const createTrip = (data) => api.post('/trips/', data).then(r => r.data)
export const updateTrip = (id, data) => api.patch(`/trips/${id}`, data).then(r => r.data)
export const deleteTrip = (id) => api.delete(`/trips/${id}`)

// Journal
export const getJournal = () => api.get('/journal/').then(r => r.data)
export const getJournalForTrip = (tid) => api.get(`/journal/trip/${tid}`).then(r => r.data)
export const createEntry = (data) => api.post('/journal/', data).then(r => r.data)
export const deleteEntry = (id) => api.delete(`/journal/${id}`)

// Gmail
export const getGmailAuth = () => api.get('/gmail/auth').then(r => r.data)
export const connectGmail = () => api.get('/gmail/auth').then(r => r.data)
export const getGmailStatus = () => api.get('/gmail/status').then(r => r.data)
export const scanGmail = () => api.get('/gmail/scan').then(r => r.data)

// AI
export const askAI = (question) => api.post('/ai/chat', { question }).then(r => r.data)
export const chatAI = (question) => api.post('/ai/chat', { question }).then(r => r.data)
export const detectTrip = (text) => api.post('/ai/detect', { text }).then(r => r.data)
