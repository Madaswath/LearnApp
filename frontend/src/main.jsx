import React, { useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Exercises from './pages/Exercises'
import Quizzes from './pages/Quizzes'
import Projects from './pages/Projects'
import Mentor from './pages/Mentor'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('lumina_user')
    return raw ? JSON.parse(raw) : null
  })

  const auth = useMemo(
    () => ({
      user,
      setUser: (next) => {
        setUser(next)
        if (next) localStorage.setItem('lumina_user', JSON.stringify(next))
        else localStorage.removeItem('lumina_user')
      },
    }),
    [user],
  )

  const protectedPage = (Component) =>
    auth.user ? (
      <Layout user={auth.user} onLogout={() => auth.setUser(null)}>
        <Component user={auth.user} />
      </Layout>
    ) : (
      <Navigate to="/login" replace />
    )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login auth={auth} />} />
        <Route path="/register" element={<Register auth={auth} />} />
        <Route path="/" element={protectedPage(Dashboard)} />
        <Route path="/courses" element={protectedPage(Courses)} />
        <Route path="/exercises" element={protectedPage(Exercises)} />
        <Route path="/quizzes" element={protectedPage(Quizzes)} />
        <Route path="/projects" element={protectedPage(Projects)} />
        <Route path="/mentor" element={protectedPage(Mentor)} />
        <Route path="/analytics" element={protectedPage(Analytics)} />
        <Route path="/profile" element={protectedPage(Profile)} />
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
