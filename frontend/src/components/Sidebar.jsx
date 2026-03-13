import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Code2, CheckSquare,
  Briefcase, MessageCircle, BarChart2, User
} from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses',   icon: BookOpen,        label: 'Courses' },
  { to: '/exercises', icon: Code2,           label: 'Exercises' },
  { to: '/quizzes',   icon: CheckSquare,     label: 'Quizzes' },
  { to: '/projects',  icon: Briefcase,       label: 'Projects' },
  { to: '/mentor',    icon: MessageCircle,   label: 'AI Mentor' },
  { to: '/analytics', icon: BarChart2,       label: 'Analytics' },
  { to: '/profile',   icon: User,            label: 'Profile' }
]

export default function Sidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-tight">Lumina AI</p>
            <p className="text-xs text-slate-400">Learning Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-primary-50 text-primary-700 border border-primary-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon size={17} className={active ? 'text-primary-600' : 'text-slate-400'} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100">
        <p className="text-xs text-slate-400">Lumina AI v1.0</p>
      </div>
    </aside>
  )
}
