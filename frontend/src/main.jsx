import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Exercises from './pages/Exercises'
import Quizzes from './pages/Quizzes'
import Projects from './pages/Projects'
import Mentor from './pages/Mentor'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('lumina_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const handleSetUser = newUser => {
    if (newUser) {
      localStorage.setItem('lumina_user', JSON.stringify(newUser))
    } else {
      localStorage.removeItem('lumina_user')
    }
    setUser(newUser)
  }

  const sharedProps = { user, setUser: handleSetUser }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={<Login {...sharedProps} />} />
        <Route path="/register" element={<Register {...sharedProps} />} />
        <Route path="/dashboard" element={<ProtectedRoute user={user}><Dashboard {...sharedProps} /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute user={user}><Courses {...sharedProps} /></ProtectedRoute>} />
        <Route path="/exercises" element={<ProtectedRoute user={user}><Exercises {...sharedProps} /></ProtectedRoute>} />
        <Route path="/quizzes" element={<ProtectedRoute user={user}><Quizzes {...sharedProps} /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute user={user}><Projects {...sharedProps} /></ProtectedRoute>} />
        <Route path="/mentor" element={<ProtectedRoute user={user}><Mentor {...sharedProps} /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute user={user}><Analytics {...sharedProps} /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute user={user}><Profile {...sharedProps} /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
