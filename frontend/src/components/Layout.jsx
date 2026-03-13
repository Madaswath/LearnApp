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
    <div className="flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-slate-800/70 px-4 md:px-6 flex items-center justify-between bg-slate-950/70 backdrop-blur sticky top-0 z-30">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Investor Demo Mode</p>
            <h2 className="font-semibold">Personalized AI Learning Workspace</h2>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700"
              aria-label="Open user menu"
            >
              👤
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-700">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
                <Link onClick={() => setMenuOpen(false)} to="/profile" className="block px-3 py-2 text-sm hover:bg-slate-800">
                  Profile & Settings
                </Link>
                <button onClick={logout} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-800 text-rose-300">
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
