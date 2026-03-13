import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { BookOpen, CheckCircle, Trophy, Code2, TrendingUp, Flame } from 'lucide-react'
import Layout from '../components/Layout'
import { progress, metrics } from '../services/api'

const QUICK_TOPICS = [
  { name: 'Python',        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', emoji: '🐍' },
  { name: 'JavaScript',   color: 'bg-blue-100 text-blue-800 border-blue-200',       emoji: '⚡' },
  { name: 'Machine Learning', color: 'bg-purple-100 text-purple-800 border-purple-200', emoji: '🤖' }
]

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon size={22} className={color} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard({ user, setUser }) {
  const navigate = useNavigate()
  const [prog, setProg] = useState(null)
  const [met, setMet] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    Promise.allSettled([
      progress.get(user.id),
      metrics.get()
    ]).then(([progRes, metRes]) => {
      if (progRes.status === 'fulfilled') setProg(progRes.value.data)
      if (metRes.status === 'fulfilled') setMet(metRes.value.data)
      setLoading(false)
    })
  }, [user?.id])

  const activities = prog?.recent_activities || prog?.activities || []
  const summary = prog?.summary || {}
  const weeklyData = prog?.weekly_activity || met?.weekly_activity || []

  const chartData = weeklyData.length
    ? weeklyData.map(d => ({ day: d.day || d.date, count: d.count || d.activities || 0 }))
    : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => ({ day, count: 0 }))

  return (
    <Layout user={user} setUser={setUser} title="Dashboard">
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          Welcome back, {user?.name?.split(' ')[0] || 'Learner'} 👋
        </h2>
        <p className="text-slate-500 mt-1">Here's what's happening with your learning journey.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={BookOpen}    label="Enrolled Courses"   value={summary.enrolled_courses   ?? met?.total_enrollments ?? '—'} color="text-primary-600" bg="bg-primary-50" />
        <StatCard icon={CheckCircle} label="Lessons Completed"  value={summary.lessons_completed  ?? '—'} color="text-green-600"   bg="bg-green-50" />
        <StatCard icon={Trophy}      label="Avg Quiz Score"     value={summary.avg_quiz_score != null ? `${Math.round(summary.avg_quiz_score)}%` : '—'} color="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={Code2}       label="Exercises Done"     value={summary.exercises_completed ?? '—'} color="text-purple-600"  bg="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-primary-600" />
            <h3 className="font-semibold text-slate-800">Weekly Activity</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip formatter={v => [v, 'Activities']} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              <Bar dataKey="count" fill="#2563eb" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={18} className="text-orange-500" />
            <h3 className="font-semibold text-slate-800">Recent Activity</h3>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />)}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No activity yet. Start learning!</p>
          ) : (
            <ul className="space-y-2.5">
              {activities.slice(0, 5).map((act, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full bg-primary-400 mt-1.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-slate-700 truncate">{act.description || act.activity || act.type}</p>
                    <p className="text-xs text-slate-400">{act.topic || ''}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Start */}
      <div>
        <h3 className="font-semibold text-slate-800 mb-4">Quick Start</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {QUICK_TOPICS.map(({ name, color, emoji }) => (
            <div key={name} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{emoji}</span>
                <div>
                  <p className="font-semibold text-slate-800">{name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${color}`}>Popular</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/courses', { state: { topic: name } })}
                className="mt-auto w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Search Courses
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
