import { Link, useLocation } from 'react-router-dom'

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const items = [
    { label: 'Dashboard', to: '/dashboard', icon: '🏠' },
    { label: 'Analytics', to: '/analytics', icon: '📊' },
  ]

  return (
    <aside
      className={`${collapsed ? 'w-20' : 'w-64'} hidden md:flex min-h-screen border-r border-slate-200 bg-white flex-col transition-all duration-300`}
    >
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold tracking-wide text-indigo-700">LearnApp</h1>
            <p className="text-xs text-slate-500">Learning workspace</p>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className="h-10 w-10 rounded-xl border border-slate-300 hover:bg-slate-100 transition-colors"
        >
          {collapsed ? '☰' : '✕'}
        </button>
      </div>

      <nav className="p-3 space-y-2">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
              location.pathname === item.to ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <span>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 mt-auto text-xs text-slate-500">
        {!collapsed && <p>Use top-right user menu for Profile/Settings and floating chat for AI mentor.</p>}
      </div>
    </aside>
  )
}
