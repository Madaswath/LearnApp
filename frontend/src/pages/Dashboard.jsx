import { useEffect, useMemo, useState } from 'react'
import { fetchProgress, fetchEnrollments } from '../services/api'

const quickTabs = [
  { title: 'Topics & Modules', desc: 'Search, enroll, and start learning flow', path: '/courses' },
  { title: 'AI Mentor', desc: 'Get concept help and app-navigation support', path: '/mentor' },
  { title: 'Analytics', desc: 'Track progress, streak, and performance trends', path: '/analytics' },
  { title: 'Settings', desc: 'Update profile and learning preferences', path: '/profile' },
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
      <div>
        <h2 className="text-3xl font-bold mb-1">Welcome, {user.name}</h2>
        <p className="text-slate-400">Investor demo dashboard for personalized module learning and AI mentorship.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="card"><p className="text-slate-400 text-sm">Enrolled Modules</p><p className="text-3xl font-bold">{enrollments.length}</p></div>
        <div className="card"><p className="text-slate-400 text-sm">Lessons Completed</p><p className="text-3xl font-bold">{metrics.lessons}</p></div>
        <div className="card"><p className="text-slate-400 text-sm">Chapters Completed</p><p className="text-3xl font-bold">{metrics.chapters}</p></div>
        <div className="card"><p className="text-slate-400 text-sm">Best Streak (days)</p><p className="text-3xl font-bold">{metrics.streak}</p></div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3">Quick Access</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {quickTabs.map((tab) => (
            <a key={tab.title} href={tab.path} className="card hover:border-indigo-500 transition-colors">
              <p className="text-lg font-semibold">{tab.title}</p>
              <p className="text-slate-400 text-sm">{tab.desc}</p>
            </a>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Performance Snapshot</h3>
        {progress.length === 0 ? (
          <p className="text-slate-400">No activity yet. Start from Topics & Modules and complete chapter-end tasks.</p>
        ) : (
          <div className="space-y-2">
            {progress.map((item) => (
              <div key={item.module_id} className="border border-slate-800 rounded p-2 text-sm">
                <p className="text-slate-300">Module: {item.module_id}</p>
                <p>Lessons {item.completed_lessons} • Chapters {item.completed_chapters} • Quizzes {item.quizzes_passed} • Streak {item.streak_days || 0}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
