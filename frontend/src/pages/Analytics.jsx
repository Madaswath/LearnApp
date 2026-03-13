import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchProgress } from '../services/api'

export default function Analytics({ user }) {
  const navigate = useNavigate()
  const [progress, setProgress] = useState([])

  useEffect(() => {
    fetchProgress(user.user_id).then((res) => setProgress(res.progress || [])).catch(() => setProgress([]))
  }, [user.user_id])

  const summary = useMemo(() => {
    const completedLessons = progress.reduce((acc, p) => acc + (p.completed_lessons || 0), 0)
    const completedChapters = progress.reduce((acc, p) => acc + (p.completed_chapters || 0), 0)
    const quizzesPassed = progress.reduce((acc, p) => acc + (p.quizzes_passed || 0), 0)
    const totalTime = progress.reduce((acc, p) => acc + (p.time_spent_minutes || 0), 0)
    return { completedLessons, completedChapters, quizzesPassed, totalTime }
  }, [progress])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate(-1)} className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50">← Previous</button>
        <Link to="/dashboard" className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50">🏠 Home</Link>
      </div>

      <section className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-100 to-white p-6">
        <h2 className="text-2xl font-semibold">Learning Analytics</h2>
        <p className="text-slate-600">Track your progress, streak, and module performance trends.</p>
      </section>

      <section className="grid md:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-slate-500">Lessons</p><p className="text-3xl font-bold">{summary.completedLessons}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Chapters</p><p className="text-3xl font-bold">{summary.completedChapters}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Quizzes Passed</p><p className="text-3xl font-bold">{summary.quizzesPassed}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Minutes Spent</p><p className="text-3xl font-bold">{summary.totalTime}</p></div>
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold mb-3">Module Breakdown</h3>
        {progress.length === 0 ? (
          <p className="text-slate-500">No analytics yet. Start learning from Topics & Modules.</p>
        ) : (
          <div className="space-y-2">
            {progress.map((item) => (
              <div key={item.module_id} className="rounded-lg border border-slate-200 p-3 bg-slate-50 text-sm">
                <p className="font-medium">{item.module_id}</p>
                <p className="text-slate-500">
                  Lessons {item.completed_lessons} • Chapters {item.completed_chapters} • Quizzes {item.quizzes_passed} • Streak {item.streak_days || 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
