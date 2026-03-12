import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
})

export const fetchAgents = async () => (await api.get('/agents')).data
export const createLearningPath = async (payload) => (await api.post('/learning-path', payload)).data
export const askMentor = async (payload) => (await api.post('/mentor/chat', payload)).data
