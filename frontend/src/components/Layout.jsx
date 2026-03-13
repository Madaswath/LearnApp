import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Bell } from 'lucide-react'
import Sidebar from './Sidebar'

export default function Layout({ user, setUser, children, title }) {
  const navigate = useNavigate()

  const logout = () => {
    setUser(null)
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div>
            {title && <h1 className="text-lg font-semibold text-slate-800">{title}</h1>}
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-700 leading-tight">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
