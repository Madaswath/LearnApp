import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../services/api'

export default function Register({ auth }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const user = await signup(form)
      auth.setUser(user)
      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-100 p-4">
      <form onSubmit={submit} className="card w-full max-w-md space-y-3">
        <h2 className="text-2xl font-semibold">Sign up</h2>
        <input className="w-full bg-slate-800 rounded p-2" placeholder="Full name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required />
        <input className="w-full bg-slate-800 rounded p-2" placeholder="Email" type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required />
        <input className="w-full bg-slate-800 rounded p-2" placeholder="Password" type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} required />
        {error && <p className="text-rose-400 text-sm">{error}</p>}
        <button className="w-full bg-emerald-600 rounded p-2">Create account</button>
        <p className="text-sm text-slate-400">Already have an account? <Link to="/login" className="text-indigo-400">Login</Link></p>
      </form>
    </div>
  )
}
