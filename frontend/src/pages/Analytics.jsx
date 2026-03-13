import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fetchProgress } from '../services/api'

export default function Analytics({ user }) {
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

  const chartData = useMemo(
    () =>
      progress.map((item) => ({
        module: item.module_id.slice(0, 8),
        lessons: item.completed_lessons || 0,
        chapters: item.completed_chapters || 0,
        quizzes: item.quizzes_passed || 0,
      })),
    [progress],
  )

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-100 to-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Learning Analytics</h2>
        <p className="text-slate-600">Track module progress, quiz outcomes, and learning effort over time.</p>
      </section>

      <section className="grid md:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-slate-500">Lessons</p><p className="text-3xl font-bold">{summary.completedLessons}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Chapters</p><p className="text-3xl font-bold">{summary.completedChapters}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Quizzes Passed</p><p className="text-3xl font-bold">{summary.quizzesPassed}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Minutes Spent</p><p className="text-3xl font-bold">{summary.totalTime}</p></div>
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold mb-3">Progress Chart</h3>
        {chartData.length === 0 ? (
          <p className="text-slate-500">No analytics yet. Start learning from Topics & Modules.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="module" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="lessons" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="chapters" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="quizzes" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  )
}
