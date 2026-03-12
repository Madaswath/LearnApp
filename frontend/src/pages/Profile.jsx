import { useState } from 'react'
import { saveProfile } from '../services/api'

export default function Profile({ user }) {
  const [form, setForm] = useState({
    user_id: user.user_id,
    full_name: user.name || '',
    bio: '',
    location: '',
    learning_style: '',
    pace: '',
    goals: [],
  })
  const [goalsInput, setGoalsInput] = useState('')
  const [message, setMessage] = useState('')

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

  return (
    <form onSubmit={submit} className="card max-w-2xl space-y-3">
      <h2 className="text-2xl font-semibold">Settings • Profile</h2>
      <input className="bg-slate-800 rounded p-2" placeholder="Full name" value={form.full_name} onChange={(e)=>setForm({...form,full_name:e.target.value})} />
      <input className="bg-slate-800 rounded p-2" placeholder="Location" value={form.location} onChange={(e)=>setForm({...form,location:e.target.value})} />
      <textarea className="bg-slate-800 rounded p-2" rows="3" placeholder="Bio" value={form.bio} onChange={(e)=>setForm({...form,bio:e.target.value})} />
      <input className="bg-slate-800 rounded p-2" placeholder="Learning style (visual/auditory/etc)" value={form.learning_style} onChange={(e)=>setForm({...form,learning_style:e.target.value})} />
      <input className="bg-slate-800 rounded p-2" placeholder="Pace (slow/normal/fast)" value={form.pace} onChange={(e)=>setForm({...form,pace:e.target.value})} />
      <input className="bg-slate-800 rounded p-2" placeholder="Goals (comma separated)" value={goalsInput} onChange={(e)=>setGoalsInput(e.target.value)} />
      <button className="bg-indigo-600 rounded px-4 py-2 w-fit">Save Settings</button>
      {message && <p className="text-emerald-300">{message}</p>}
    </form>
  )
}
