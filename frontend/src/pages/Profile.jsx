import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getProfile, saveProfile } from '../services/api'

export default function Profile({ user }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    user_id: user.user_id,
    full_name: user.name || '',
    bio: '',
    location: '',
    learning_style: '',
    pace: '',
    goals: [],
    email: user.email || '',
    email_verified: false,
    phone: '',
    phone_verified: false,
  })
  const [goalsInput, setGoalsInput] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    getProfile(user.user_id)
      .then((data) => {
        setForm((prev) => ({ ...prev, ...data }))
        setGoalsInput((data.goals || []).join(', '))
      })
      .catch(() => {})
  }, [user.user_id])

  const submit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      goals: goalsInput
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
    }
    await saveProfile(payload)
    setMessage('Settings saved successfully.')
  }

  const verifyEmail = () => {
    setForm((prev) => ({ ...prev, email_verified: true }))
    setMessage('Email marked as verified (optional demo flow).')
  }

  const verifyPhone = () => {
    if (!form.phone) {
      setMessage('Add phone number first to verify.')
      return
    }
    setForm((prev) => ({ ...prev, phone_verified: true }))
    setMessage('Phone marked as verified (optional demo flow).')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate(-1)} className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50">← Previous</button>
        <Link to="/dashboard" className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50">🏠 Home</Link>
      </div>

      <form onSubmit={submit} className="card max-w-3xl space-y-4">
        <h2 className="text-2xl font-semibold">Profile & Security Settings</h2>

        <div className="grid md:grid-cols-2 gap-3">
          <input className="bg-slate-100 rounded p-2" placeholder="Full name" value={form.full_name || ''} onChange={(e)=>setForm({...form,full_name:e.target.value})} />
          <input className="bg-slate-100 rounded p-2" placeholder="Location" value={form.location || ''} onChange={(e)=>setForm({...form,location:e.target.value})} />
        </div>

        <textarea className="bg-slate-100 rounded p-2 w-full" rows="3" placeholder="Bio" value={form.bio || ''} onChange={(e)=>setForm({...form,bio:e.target.value})} />

        <div className="grid md:grid-cols-2 gap-3">
          <input className="bg-slate-100 rounded p-2" placeholder="Learning style" value={form.learning_style || ''} onChange={(e)=>setForm({...form,learning_style:e.target.value})} />
          <input className="bg-slate-100 rounded p-2" placeholder="Pace" value={form.pace || ''} onChange={(e)=>setForm({...form,pace:e.target.value})} />
        </div>

        <input className="bg-slate-100 rounded p-2 w-full" placeholder="Goals (comma separated)" value={goalsInput} onChange={(e)=>setGoalsInput(e.target.value)} />

        <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50">
          <h3 className="font-semibold">Account Security (Optional)</h3>
          <div className="grid md:grid-cols-[1fr_auto] gap-2 items-center">
            <input className="bg-white border border-slate-200 rounded p-2" placeholder="Email" value={form.email || ''} onChange={(e)=>setForm({...form,email:e.target.value,email_verified:false})} />
            <button type="button" onClick={verifyEmail} className="bg-indigo-600 text-white hover:bg-indigo-500 rounded px-3 py-2">
              {form.email_verified ? 'Email Verified ✓' : 'Verify Email'}
            </button>
          </div>
          <div className="grid md:grid-cols-[1fr_auto] gap-2 items-center">
            <input className="bg-white border border-slate-200 rounded p-2" placeholder="Phone number" value={form.phone || ''} onChange={(e)=>setForm({...form,phone:e.target.value,phone_verified:false})} />
            <button type="button" onClick={verifyPhone} className="bg-indigo-600 text-white hover:bg-indigo-500 rounded px-3 py-2">
              {form.phone_verified ? 'Phone Verified ✓' : 'Verify Phone'}
            </button>
          </div>
        </div>

        <button className="bg-emerald-600 text-white hover:bg-emerald-500 rounded px-4 py-2 w-fit">Save Settings</button>
        {message && <p className="text-emerald-700">{message}</p>}
      </form>
    </div>
  )
}
