import React, { useEffect, useState } from 'react'
import { Code2, ChevronDown, ChevronUp, Loader2, CheckCircle, XCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { exercises } from '../services/api'

const TOPICS = ['All', 'Python', 'JavaScript', 'Machine Learning', 'React', 'SQL', 'Data Structures']

function DiffBadge({ level }) {
  const styles = {
    easy:   'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard:   'bg-red-100 text-red-700'
  }
  const k = (level || '').toLowerCase()
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[k] || 'bg-slate-100 text-slate-600'}`}>{level}</span>
}

function ExerciseCard({ exercise, userId }) {
  const [expanded, setExpanded] = useState(false)
  const [code, setCode] = useState(exercise.starter_code || '')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const submit = async () => {
    setSubmitting(true)
    setResult(null)
    try {
      const res = await exercises.submit({
        exercise_id: exercise.id || exercise.exercise_id,
        user_id: userId,
        code,
        answer: code
      })
      setResult(res.data)
    } catch (err) {
      setResult({ error: err.response?.data?.detail || 'Submission failed.' })
    }
    setSubmitting(false)
  }

  const passed = result && !result.error && (result.passed || result.score >= 60)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 text-left"
      >
        <div className="flex items-start gap-3">
          <Code2 size={18} className="text-primary-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">{exercise.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <DiffBadge level={exercise.difficulty} />
              {exercise.topic && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                  {exercise.topic}
                </span>
              )}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100">
          <p className="text-sm text-slate-600 my-3">{exercise.description || exercise.prompt}</p>

          <label className="block text-xs font-medium text-slate-500 mb-1.5 mt-3">Your Solution</label>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y bg-slate-50"
            placeholder="Write your code here…"
            spellCheck={false}
          />

          <button
            onClick={submit}
            disabled={submitting}
            className="mt-3 px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2"
          >
            {submitting && <Loader2 size={13} className="animate-spin" />}
            {submitting ? 'Submitting…' : 'Submit'}
          </button>

          {result && (
            <div className={`mt-4 p-4 rounded-xl border ${result.error ? 'bg-red-50 border-red-200' : passed ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
              {result.error ? (
                <p className="text-sm text-red-600">{result.error}</p>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {passed
                      ? <CheckCircle size={16} className="text-green-500" />
                      : <XCircle size={16} className="text-orange-500" />
                    }
                    <span className={`text-sm font-bold ${passed ? 'text-green-700' : 'text-orange-700'}`}>
                      {result.score != null ? `Score: ${result.score}%` : passed ? 'Passed!' : 'Needs improvement'}
                    </span>
                  </div>
                  {result.feedback && <p className="text-sm text-slate-600 mt-1">{result.feedback}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Exercises({ user, setUser }) {
  const [topic, setTopic] = useState('')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async (t) => {
    setLoading(true)
    setError('')
    try {
      const res = await exercises.getList(t || '')
      const raw = res.data?.exercises || res.data || []
      setList(Array.isArray(raw) ? raw : [])
    } catch {
      setError('Failed to load exercises.')
    }
    setLoading(false)
  }

  useEffect(() => { load('') }, [])

  const handleTopicChange = t => {
    setTopic(t)
    load(t === 'All' ? '' : t)
  }

  return (
    <Layout user={user} setUser={setUser} title="Exercises">
      <div className="mb-5 flex items-center gap-3 flex-wrap">
        {TOPICS.map(t => (
          <button
            key={t}
            onClick={() => handleTopicChange(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              (t === 'All' && !topic) || topic === t
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <Code2 size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No exercises found for this topic.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((ex, i) => (
            <ExerciseCard key={ex.id || i} exercise={ex} userId={user?.id} />
          ))}
        </div>
      )}
    </Layout>
  )
}
