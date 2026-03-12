import { Link } from 'react-router-dom'

const items = [
  ['Dashboard', '/'],
  ['Courses', '/courses'],
  ['Exercises', '/exercises'],
  ['Quizzes', '/quizzes'],
  ['Projects', '/projects'],
  ['AI Mentor', '/mentor'],
  ['Analytics', '/analytics'],
  ['Profile', '/profile'],
]

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen border-r border-slate-800 bg-slate-900 p-4">
      <h1 className="text-xl font-bold mb-4">Lumina AI</h1>
      <nav className="space-y-2">
        {items.map(([label, path]) => (
          <Link key={label} to={path} className="block px-3 py-2 rounded hover:bg-slate-800">{label}</Link>
        ))}
      </nav>
    </aside>
  )
}
