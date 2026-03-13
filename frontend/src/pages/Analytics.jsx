import React, { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { TrendingUp, Award, Flame, CheckCircle, BarChart2 } from 'lucide-react'
import Layout from '../components/Layout'
import { progress } from '../services/api'

const PIE_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2']

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-1">
        <Icon size={18} className={color || 'text-primary-600'} />
        <span className="text-sm text-slate-500 font-medium">{label}</span>
      </div>
      <p className="text-3xl font-bold text-slate-800">{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function Analytics({ user, setUser }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    progress.get(user.id)
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => { setError('Failed to load analytics.'); setLoading(false) })
  }, [user?.id])

  if (loading) return (
    <Layout user={user} setUser={setUser} title="Analytics">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
      </div>
    </Layout>
  )

  if (error) return (
    <Layout user={user} setUser={setUser} title="Analytics">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>
    </Layout>
  )

  const summary = data?.summary || {}
  const activities = data?.recent_activities || data?.activities || []
  const activityTimeline = data?.activity_timeline || data?.daily_activity || []
  const quizByTopic = data?.quiz_scores_by_topic || data?.topic_scores || []
  const topicDist = data?.topic_distribution || data?.time_by_topic || []

  // Build chart data
  const lineData = activityTimeline.length
    ? activityTimeline.map(d => ({ date: d.date || d.day, count: d.count || d.activities || 0 }))
    : Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i))
        return { date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }), count: 0 }
      })

  const barData = quizByTopic.length
    ? quizByTopic.map(d => ({ topic: d.topic, score: Math.round(d.score || d.avg_score || 0) }))
    : []

  const pieData = topicDist.length
    ? topicDist.map(d => ({ name: d.topic, value: d.count || d.hours || d.minutes || 1 }))
    : []

  const streak = data?.streak || data?.current_streak || 0
  const totalActivities = summary.total_activities ?? activities.length

  return (
    <Layout user={user} setUser={setUser} title="Analytics">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={BarChart2}  label="Total Activities"   value={totalActivities}                                              color="text-primary-600" />
        <StatCard icon={CheckCircle} label="Lessons Completed" value={summary.lessons_completed ?? '—'}                             color="text-green-600" />
        <StatCard icon={Award}      label="Avg Quiz Score"     value={summary.avg_quiz_score != null ? `${Math.round(summary.avg_quiz_score)}%` : '—'} color="text-amber-500" />
        <StatCard icon={Flame}      label="Learning Streak"    value={`${streak} day${streak !== 1 ? 's' : ''}`} sub="Keep it up!" color="text-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Activity Line Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-600" /> Activity Over Time
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Activities" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quiz Scores BarChart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Award size={16} className="text-amber-500" /> Quiz Scores by Topic
          </h3>
          {barData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No quiz data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="topic" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [`${v}%`, 'Score']} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="score" fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Distribution PieChart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Topic Distribution</h3>
          {pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Recent Activity</h3>
          {activities.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No recent activity.</p>
          ) : (
            <ul className="space-y-3">
              {activities.slice(0, 8).map((act, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary-400 mt-1.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 truncate">{act.description || act.activity || act.type}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {act.topic && <span className="text-xs text-slate-400">{act.topic}</span>}
                      {act.result != null && (
                        <span className={`text-xs font-medium ${act.result >= 60 ? 'text-green-600' : 'text-orange-500'}`}>
                          {act.result}%
                        </span>
                      )}
                      {act.created_at && (
                        <span className="text-xs text-slate-300">
                          {new Date(act.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  )
}
