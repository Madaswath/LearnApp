import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchEnrollments, fetchModuleEvaluation, fetchProgress } from '../services/api'

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const [progress, setProgress] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [enrollmentCards, setEnrollmentCards] = useState([])

  useEffect(() => {
    fetchProgress(user.user_id).then((res) => setProgress(res.progress || [])).catch(() => setProgress([]))
    fetchEnrollments(user.user_id).then((res) => setEnrollments(res.enrollments || [])).catch(() => setEnrollments([]))
  }, [user.user_id])

  useEffect(() => {
    const load = async () => {
      if (!enrollments.length) {
        setEnrollmentCards([])
        return
      }
      const cards = await Promise.all(
        enrollments.map(async (en) => {
          let completion = 0
          try {
            const ev = await fetchModuleEvaluation(user.user_id, en.module_id)
            completion = Math.round((Number(ev?.completion_ratio || 0) || 0) * 100)
          } catch {
            completion = 0
          }
          const pg = progress.find((p) => p.module_id === en.module_id)
          return { ...en, completion, progress: pg }
        }),
      )
      setEnrollmentCards(cards)
    }
    load()
  }, [enrollments, progress, user.user_id])

  const metrics = useMemo(() => {
    const minutes = progress.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0)
    const streak = Math.max(user.streak_days || 0, progress.reduce((max, p) => Math.max(max, p.streak_days || 0), 0))
    return { totalCourses: enrollments.length, minutes, streak }
  }, [enrollments.length, progress, user.streak_days])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-100 via-violet-50 to-white p-6">
        <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
        <p className="mt-2 text-slate-600">Track your enrolled courses and continue learning from where you left off.</p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <button onClick={() => navigate('/courses')} className="card text-left hover:bg-slate-50">
          <p className="text-sm text-slate-500">Total Courses Enrolled</p>
          <p className="text-3xl font-bold">{metrics.totalCourses}</p>
        </button>
        <div className="card"><p className="text-sm text-slate-500">Total Minutes</p><p className="text-3xl font-bold">{metrics.minutes}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Login Streak</p><p className="text-3xl font-bold">{metrics.streak}d</p></div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">My Active Learning</h3>
          <Link to="/courses" className="text-sm text-indigo-600 hover:text-indigo-500">Open My Learning</Link>
        </div>
        {enrollmentCards.length === 0 ? (
          <div className="card"><p className="text-slate-500">No enrolled courses yet. Go to My Learning and search topics to enroll.</p></div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {enrollmentCards.map((card) => (
              <div key={card.id} className="card min-w-[320px] max-w-[360px] flex-shrink-0 border border-slate-200">
                <p className="font-semibold text-slate-800">{card.module_title}</p>
                <p className="text-sm text-slate-500">{card.topic}</p>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>Progress</span>
                    <span>{card.completion}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-200">
                    <div className="h-3 rounded-full bg-indigo-600" style={{ width: `${card.completion}%` }} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">Lessons {card.progress?.completed_lessons || 0} • Chapters {card.progress?.completed_chapters || 0}</p>
                <button onClick={() => navigate('/courses')} className="mt-3 rounded-lg bg-violet-600 px-3 py-2 text-sm text-white hover:bg-violet-500">Continue Learning</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
