import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, CheckCircle, XCircle } from 'lucide-react'
import { auth } from '../services/api'

function checkStrength(pw) {
  const checks = {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    lower:   /[a-z]/.test(pw),
    digit:   /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw)
  }
  const score = Object.values(checks).filter(Boolean).length
  return { checks, score }
}

const strengthLabel = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500']

export default function Register({ setUser }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { checks, score } = checkStrength(form.password)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    if (score < 4) return setError('Password is too weak. Ensure it meets all requirements.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')

    setLoading(true)
    try {
      await auth.signup({ name: form.name, email: form.email, password: form.password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const reqItem = (ok, label) => (
    <div className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-slate-400'}`}>
      {ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
      {label}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 mb-4 shadow-lg">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Lumina AI</h1>
          <p className="text-slate-500 mt-1">Create your learning account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Get started free</h2>

          {success && (
            <div className="mb-5 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
              Account created! Redirecting to login…
            </div>
          )}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Smith"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Strength bar */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= score ? strengthColor[score] : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">{strengthLabel[score]}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {reqItem(checks.length,  '8+ characters')}
                    {reqItem(checks.upper,   'Uppercase letter')}
                    {reqItem(checks.lower,   'Lowercase letter')}
                    {reqItem(checks.digit,   'Number')}
                    {reqItem(checks.special, 'Special character')}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
              <input
                type="password"
                name="confirm"
                required
                value={form.confirm}
                onChange={handleChange}
                placeholder="Repeat your password"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
              {form.confirm && form.password !== form.confirm && (
                <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm mt-2"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
