import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../services/api'

const policyChecks = (password) => ({
  length: password.length >= 8,
  upper: /[A-Z]/.test(password),
  lower: /[a-z]/.test(password),
  number: /\d/.test(password),
  symbol: /[^A-Za-z0-9]/.test(password),
})

export default function Register({ auth }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm_password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const checks = useMemo(() => policyChecks(form.password), [form.password])
  const strong = Object.values(checks).every(Boolean)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!strong) {
      setError('Password does not meet the security policy.')
      return
    }
    if (form.password !== form.confirm_password) {
      setError('Password and re-entered password must match.')
      return
    }
    try {
      const user = await signup(form)
      auth.setUser(user)
      setSuccess('Signup successful. Redirecting to dashboard...')
      setTimeout(() => navigate('/dashboard'), 800)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Registration failed')
    }
  }

  const checkLine = (ok, label) => (
    <li className={`text-xs ${ok ? 'text-emerald-300' : 'text-slate-400'}`}>{ok ? '✓' : '•'} {label}</li>
  )

  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-100 p-4">
      <form onSubmit={submit} className="card w-full max-w-md space-y-3">
        <h2 className="text-2xl font-semibold">Create secure account</h2>
        <input className="w-full bg-slate-800 rounded p-2" placeholder="Full name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required />
        <input className="w-full bg-slate-800 rounded p-2" placeholder="Email" type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required />
        <input className="w-full bg-slate-800 rounded p-2" placeholder="Password" type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} required />
        <input className="w-full bg-slate-800 rounded p-2" placeholder="Re-enter password" type="password" value={form.confirm_password} onChange={(e)=>setForm({...form,confirm_password:e.target.value})} required />

        <ul className="grid grid-cols-1 gap-1 border border-slate-700 rounded-lg p-3 bg-slate-900/70">
          {checkLine(checks.length, 'At least 8 characters')}
          {checkLine(checks.upper, 'One uppercase letter')}
          {checkLine(checks.lower, 'One lowercase letter')}
          {checkLine(checks.number, 'One number')}
          {checkLine(checks.symbol, 'One special character')}
        </ul>

        {error && <p className="text-rose-400 text-sm">{error}</p>}
        {success && <p className="text-emerald-300 text-sm">{success}</p>}
        <button className="w-full bg-emerald-600 hover:bg-emerald-500 rounded p-2">Create account</button>
        <p className="text-sm text-slate-400">Already have an account? <Link to="/login" className="text-indigo-400">Login</Link></p>
      </form>
    </div>
  )
}
