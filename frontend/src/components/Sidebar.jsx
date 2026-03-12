import { Link, useLocation } from 'react-router-dom'

const items = [
  ['Dashboard', '/'],
  ['Topics & Modules', '/courses'],
  ['Exercises', '/exercises'],
  ['Quizzes', '/quizzes'],
  ['Projects', '/projects'],
  ['AI Mentor', '/mentor'],
  ['Analytics', '/analytics'],
  ['Settings', '/profile'],
]

export default function Sidebar({ user, onLogout }) {
  const location = useLocation()
  return (
    <aside className="w-72 min-h-screen border-r border-slate-800 bg-slate-900 p-4 flex flex-col">
      <div>
        <h1 className="text-xl font-bold mb-1">Lumina AI</h1>
        <p className="text-sm text-slate-400 mb-4">{user?.name}</p>
      </div>
      <nav className="space-y-2 flex-1">
        {items.map(([label, path]) => (
          <Link
            key={label}
            to={path}
            className={`block px-3 py-2 rounded hover:bg-slate-800 ${location.pathname === path ? 'bg-slate-800' : ''}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <button onClick={onLogout} className="mt-4 bg-rose-600 hover:bg-rose-500 rounded px-3 py-2">
        Logout
      </button>
    </aside>
  )
}
