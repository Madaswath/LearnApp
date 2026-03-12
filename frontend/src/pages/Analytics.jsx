import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { fetchProgress } from '../services/api'

export default function Analytics({ user }) {
  const [progress, setProgress] = useState([])

  useEffect(() => {
    fetchProgress(user.user_id)
      .then((res) => setProgress(res.progress || []))
      .catch(() => setProgress([]))
  }, [user.user_id])

  const chartData = useMemo(
    () =>
      progress.map((p, idx) => ({
        name: `M${idx + 1}`,
        lessons: p.completed_lessons,
        concepts: p.completed_concepts,
        minutes: p.time_spent_minutes,
      })),
    [progress],
  )

  return (
    <div className="space-y-4">
      <div className="card h-[320px]">
        <h2 className="text-xl font-semibold mb-2">Progress Trend</h2>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Line type="monotone" dataKey="lessons" stroke="#6366f1" strokeWidth={3} />
            <Line type="monotone" dataKey="concepts" stroke="#10b981" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card h-[320px]">
        <h2 className="text-xl font-semibold mb-2">Time Spent per Module</h2>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="minutes" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
