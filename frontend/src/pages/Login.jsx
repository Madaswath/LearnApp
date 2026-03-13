import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/api'

export default function Login({ auth }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const user = await login(form)
      auth.setUser(user)
      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 text-slate-900 p-4">
      <form onSubmit={submit} className="card w-full max-w-md space-y-3">
        <h2 className="text-2xl font-semibold">Sign in</h2>
        <input className="w-full bg-slate-100 rounded p-2" placeholder="Email" type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required />
        <input className="w-full bg-slate-100 rounded p-2" placeholder="Password" type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} required />
        {error && <p className="text-rose-600 text-sm">{error}</p>}
        <button className="w-full bg-indigo-600 text-white rounded p-2">Login</button>
        <p className="text-sm text-slate-500">New user? <Link to="/register" className="text-indigo-600">Create account</Link></p>
      </form>
    </div>
  )
}
