import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchEnrollments, fetchModuleEvaluation, fetchProgress } from '../services/api'

const quickActions = [
  { title: 'Topics & Modules', desc: 'Search tools/topics and generate modules by level.', to: '/courses', tone: 'from-indigo-100 to-violet-50' },
  { title: 'Learning Analytics', desc: 'Review streaks, completion trends, and outcomes.', to: '/analytics', tone: 'from-cyan-100 to-sky-50' },
]

export default function Dashboard({ user }) {
  const [progress, setProgress] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [activeLearning, setActiveLearning] = useState(null)

  useEffect(() => {
    fetchProgress(user.user_id).then((res) => setProgress(res.progress || [])).catch(() => setProgress([]))
    fetchEnrollments(user.user_id).then((res) => setEnrollments(res.enrollments || [])).catch(() => setEnrollments([]))
  }, [user.user_id])

  useEffect(() => {
    const loadActiveLearning = async () => {
      if (!enrollments.length) {
        setActiveLearning(null)
        return
      }
      const latestEnrollment = enrollments[enrollments.length - 1]
      const moduleProgress = progress.find((p) => p.module_id === latestEnrollment.module_id)
      let ratio = 0
      try {
        const evaluation = await fetchModuleEvaluation(user.user_id, latestEnrollment.module_id)
        ratio = Number(evaluation?.completion_ratio || 0)
      } catch {
        ratio = 0
      }
      setActiveLearning({
        enrollment: latestEnrollment,
        progress: moduleProgress,
        completionPercent: Math.round(Math.max(0, Math.min(1, ratio)) * 100),
      })
    }

    loadActiveLearning()
  }, [enrollments, progress, user.user_id])

  const metrics = useMemo(() => {
    const quizzes = progress.reduce((sum, p) => sum + (p.quizzes_passed || 0), 0)
    const minutes = progress.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0)
    const streak = Math.max(user.streak_days || 0, progress.reduce((max, p) => Math.max(max, p.streak_days || 0), 0))
    return { quizzes, minutes, streak }
  }, [progress])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-100 via-violet-50 to-white p-6">
        <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
        <p className="text-slate-600 mt-2">Your AI learning cockpit is ready. Continue your active learning module or discover a new topic today.</p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card"><p className="text-sm text-slate-500">Quizzes Passed</p><p className="text-3xl font-bold">{metrics.quizzes}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Total Minutes</p><p className="text-3xl font-bold">{metrics.minutes}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Login Streak</p><p className="text-3xl font-bold">{metrics.streak}d</p></div>
      </section>

      <section className="card space-y-3">
        <h3 className="text-lg font-semibold">Active Learning</h3>
        {!activeLearning ? (
          <p className="text-slate-500">No active enrollment yet. Start from Topics & Modules to enroll and begin learning.</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800">{activeLearning.enrollment.module_title}</p>
                <p className="text-sm text-slate-500">{activeLearning.enrollment.topic} • {activeLearning.enrollment.difficulty}</p>
              </div>
              <Link to="/courses" className="rounded-lg bg-violet-600 px-3 py-2 text-sm text-white hover:bg-violet-500">
                Open Course
              </Link>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                <span>Progress</span>
                <span>{activeLearning.completionPercent}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${activeLearning.completionPercent}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Lessons {activeLearning.progress?.completed_lessons || 0} • Chapters {activeLearning.progress?.completed_chapters || 0}
              </p>
            </div>
          </>
        )}
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">Quick Access</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {quickActions.map((item) => (
            <Link key={item.title} to={item.to} className={`card bg-gradient-to-br ${item.tone} hover:scale-[1.01] transition-transform`}>
              <p className="font-semibold text-lg">{item.title}</p>
              <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
