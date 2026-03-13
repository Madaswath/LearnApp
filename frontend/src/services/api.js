import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const raw = localStorage.getItem('lumina_user')
  if (raw) {
    try {
      const user = JSON.parse(raw)
      if (user?.token) config.headers.Authorization = `Bearer ${user.token}`
    } catch {
      // ignore parse errors
    }
  }
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('lumina_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const auth = {
  signup: data => api.post('/auth/signup', data),
  login: data => api.post('/auth/login', data)
}

export const knowledge = {
  getTopics: () => api.get('/knowledge/topics'),
  search: (topic, q) => api.get(`/knowledge/${topic}`, { params: { q } })
}

export const courses = {
  search: query => api.post('/topics/search', { query }),
  enroll: data => api.post('/enroll', data),
  getEnrollments: userId => api.get(`/enrollments/${userId}`),
  buildModule: data => api.post('/modules/build', data),
  getModule: (userId, moduleId) => api.get(`/modules/${userId}/${moduleId}`),
  getEvaluation: (userId, moduleId) => api.get(`/modules/${userId}/${moduleId}/evaluation`)
}

export const modules = {
  completeLesson: data => api.post('/modules/lesson/complete', data),
  completeChapter: data => api.post('/modules/chapter/complete', data)
}

export const exercises = {
  getList: topic => api.get('/exercises', { params: topic ? { topic } : {} }),
  submit: data => api.post('/exercises/submit', data)
}

export const quizzes = {
  getList: topic => api.get('/quizzes', { params: topic ? { topic } : {} }),
  submit: data => api.post('/quizzes/submit', data)
}

export const projects = {
  getList: topic => api.get('/projects', { params: topic ? { topic } : {} })
}

export const mentor = {
  chat: data => api.post('/mentor/chat', data)
}

export const progress = {
  track: data => api.post('/progress/track', data),
  get: userId => api.get(`/progress/${userId}`)
}

export const metrics = {
  get: () => api.get('/metrics')
}

export const submitExercise = data => api.post('/modules/exercise/submit', data)
export const submitQuiz = data => api.post('/modules/quiz/submit', data)

export default api
