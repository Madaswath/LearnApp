import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import MentorWidget from './MentorWidget'

export default function Layout({ children, user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const logout = () => {
    onLogout()
    navigate('/login')
  }

  return (
    <div className="flex bg-slate-100 text-slate-900 min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-slate-200 px-4 md:px-6 flex items-center justify-between bg-white sticky top-0 z-30">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-500">Investor Demo Mode</p>
            <h2 className="font-semibold">Personalized AI Learning Workspace</h2>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-200 hover:bg-indigo-100"
              aria-label="Open user menu"
            >
              👤
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-200">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <Link onClick={() => setMenuOpen(false)} to="/dashboard" className="block px-3 py-2 text-sm hover:bg-slate-50">
                  Home Dashboard
                </Link>
                <Link onClick={() => setMenuOpen(false)} to="/profile" className="block px-3 py-2 text-sm hover:bg-slate-50">
                  Profile & Settings
                </Link>
                <button onClick={logout} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-rose-600">
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      <MentorWidget user={user} />
    </div>
  )
}
