import React, { useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Mentor from './pages/Mentor'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('learnapp_user')
    return raw ? JSON.parse(raw) : null
  })

  const auth = useMemo(
    () => ({
      user,
      setUser: (next) => {
        setUser(next)
        if (next) localStorage.setItem('learnapp_user', JSON.stringify(next))
        else localStorage.removeItem('learnapp_user')
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
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login auth={auth} />} />
        <Route path="/register" element={<Register auth={auth} />} />
        <Route path="/dashboard" element={protectedPage(Dashboard)} />
        <Route path="/courses" element={protectedPage(Courses)} />
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
