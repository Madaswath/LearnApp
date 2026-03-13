import React, { useState } from 'react'
import { User, Save, CheckCircle } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../services/api'

const LEARNING_STYLES = ['visual', 'reading', 'practice', 'mixed']
const LEARNING_PACES  = ['slow', 'medium', 'fast']

export default function Profile({ user, setUser }) {
  const [form, setForm] = useState({
    name:  user?.name  || '',
    email: user?.email || '',
    bio:   user?.bio   || '',
    learning_style: user?.learning_style || 'visual',
    pace:  user?.pace  || 'medium',
    goals: user?.goals || ''
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await api.post('/settings/profile', { user_id: user?.id, ...form })
      const updated = { ...user, name: form.name, bio: form.bio, learning_style: form.learning_style, pace: form.pace, goals: form.goals }
      setUser(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save profile.')
    }
    setSaving(false)
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en', { year: 'numeric', month: 'long' })
    : 'N/A'

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <Layout user={user} setUser={setUser} title="Profile">
      <div className="max-w-2xl mx-auto">
        {/* Avatar & name */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-2xl font-bold">{initials}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <p className="text-xs text-slate-400 mt-1">Member since {memberSince}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h3 className="font-semibold text-slate-800 text-lg">Account Settings</h3>

          {saved && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              <CheckCircle size={15} />
              Profile saved successfully!
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email <span className="text-xs text-slate-400">(read-only)</span></label>
            <input
              type="email"
              name="email"
              value={form.email}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              placeholder="Tell us about yourself…"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Learning Style</label>
              <select
                name="learning_style"
                value={form.learning_style}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
              >
                {LEARNING_STYLES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Learning Pace</label>
              <select
                name="pace"
                value={form.pace}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
              >
                {LEARNING_PACES.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Learning Goals</label>
            <textarea
              name="goals"
              value={form.goals}
              onChange={handleChange}
              rows={3}
              placeholder="What do you want to achieve? (e.g. become a full-stack developer, learn ML)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium text-sm rounded-xl hover:bg-primary-700 disabled:opacity-60"
          >
            <Save size={15} />
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
