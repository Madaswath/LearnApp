import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProgress, fetchEnrollments } from '../services/api'

const quickActions = [
  { title: 'Discover Topics', desc: 'Search tools/topics and generate modules by level.', to: '/courses', tone: 'from-indigo-500/30 to-violet-500/20' },
  { title: 'Learning Analytics', desc: 'Review streaks, completion trends, and outcomes.', to: '/analytics', tone: 'from-cyan-500/30 to-sky-500/20' },
  { title: 'Profile & Security', desc: 'Manage personal settings and optional verifications.', to: '/profile', tone: 'from-emerald-500/30 to-teal-500/20' },
]

export default function Dashboard({ user }) {
  const [progress, setProgress] = useState([])
  const [enrollments, setEnrollments] = useState([])

  useEffect(() => {
    fetchProgress(user.user_id).then((res) => setProgress(res.progress || [])).catch(() => setProgress([]))
    fetchEnrollments(user.user_id).then((res) => setEnrollments(res.enrollments || [])).catch(() => setEnrollments([]))
  }, [user.user_id])

  const metrics = useMemo(() => {
    const lessons = progress.reduce((sum, p) => sum + (p.completed_lessons || 0), 0)
    const chapters = progress.reduce((sum, p) => sum + (p.completed_chapters || 0), 0)
    const quizzes = progress.reduce((sum, p) => sum + (p.quizzes_passed || 0), 0)
    const streak = progress.reduce((max, p) => Math.max(max, p.streak_days || 0), 0)
    return { lessons, chapters, quizzes, streak }
  }, [progress])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-600/20 via-violet-600/10 to-slate-900 p-6">
        <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
        <p className="text-slate-300 mt-2">Your AI learning cockpit is ready. Continue enrolled modules or discover a new topic today.</p>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-slate-400">Enrolled Modules</p><p className="text-3xl font-bold">{enrollments.length}</p></div>
        <div className="card"><p className="text-sm text-slate-400">Lessons Completed</p><p className="text-3xl font-bold">{metrics.lessons}</p></div>
        <div className="card"><p className="text-sm text-slate-400">Chapters Completed</p><p className="text-3xl font-bold">{metrics.chapters}</p></div>
        <div className="card"><p className="text-sm text-slate-400">Best Streak</p><p className="text-3xl font-bold">{metrics.streak}d</p></div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">Quick Access</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {quickActions.map((item) => (
            <Link key={item.title} to={item.to} className={`card bg-gradient-to-br ${item.tone} hover:scale-[1.01] transition-transform`}>
              <p className="font-semibold text-lg">{item.title}</p>
              <p className="text-sm text-slate-300 mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold mb-2">Active Module Performance</h3>
        {progress.length === 0 ? (
          <p className="text-slate-400">No progress yet. Start in Discover Topics to enroll and generate your module roadmap.</p>
        ) : (
          <div className="space-y-2">
            {progress.map((item) => (
              <div key={item.module_id} className="rounded-lg border border-slate-700/70 p-3 bg-slate-900/60">
                <p className="text-sm text-slate-300">{item.module_id}</p>
                <p className="text-sm text-slate-400">Lessons {item.completed_lessons} • Chapters {item.completed_chapters} • Quizzes {item.quizzes_passed} • Streak {item.streak_days || 0}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
