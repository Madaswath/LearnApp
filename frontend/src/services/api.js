import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
})

export const signup = async (payload) => (await api.post('/auth/signup', payload)).data
export const login = async (payload) => (await api.post('/auth/login', payload)).data
export const saveProfile = async (payload) => (await api.post('/settings/profile', payload)).data
export const getProfile = async (userId) => (await api.get(`/settings/profile/${userId}`)).data

export const searchTopicModules = async (payload) => (await api.post('/topics/search', payload)).data
export const enrollModule = async (payload) => (await api.post('/enroll', payload)).data
export const fetchEnrollments = async (userId) => (await api.get(`/enrollments/${userId}`)).data

export const trackProgress = async (payload) => (await api.post('/progress/track', payload)).data
export const fetchProgress = async (userId) => (await api.get(`/progress/${userId}`)).data

export const fetchExercises = async () => (await api.get('/exercises')).data
export const submitExercise = async (payload) => (await api.post('/exercises/submit', payload)).data

export const fetchQuizzes = async () => (await api.get('/quizzes')).data
export const submitQuiz = async (payload) => (await api.post('/quizzes/submit', payload)).data

export const fetchProjects = async () => (await api.get('/projects')).data

export const fetchAgents = async () => (await api.get('/agents')).data
export const createLearningPath = async (payload) => (await api.post('/learning-path', payload)).data
export const askMentor = async (payload) => (await api.post('/mentor/chat', payload)).data
