import { useEffect, useState } from 'react'
import { fetchProgress } from '../services/api'

export default function Dashboard({ user }) {
  const [progress, setProgress] = useState([])

  useEffect(() => {
    fetchProgress(user.user_id)
      .then((res) => setProgress(res.progress || []))
      .catch(() => setProgress([]))
  }, [user.user_id])

  const totalLessons = progress.reduce((sum, p) => sum + p.completed_lessons, 0)
  const totalConcepts = progress.reduce((sum, p) => sum + p.completed_concepts, 0)
  const totalMinutes = progress.reduce((sum, p) => sum + p.time_spent_minutes, 0)

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Welcome back, {user.name}</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="card"><p className="text-slate-400">Lessons Completed</p><p className="text-3xl font-bold">{totalLessons}</p></div>
        <div className="card"><p className="text-slate-400">Concepts Mastered</p><p className="text-3xl font-bold">{totalConcepts}</p></div>
        <div className="card"><p className="text-slate-400">Time Spent (min)</p><p className="text-3xl font-bold">{totalMinutes}</p></div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Module Progress</h3>
        <div className="space-y-2">
          {progress.length === 0 ? (
            <p className="text-slate-400">No activity yet. Search a topic and enroll in a module to begin.</p>
          ) : (
            progress.map((item) => (
              <div key={item.module_id} className="border border-slate-800 rounded p-2">
                <p className="text-sm text-slate-300">Module: {item.module_id}</p>
                <p className="text-sm">Lessons: {item.completed_lessons} • Concepts: {item.completed_concepts} • Minutes: {item.time_spent_minutes}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
