import React, { useEffect, useState } from 'react'
import { CheckSquare, Loader2, Trophy, ChevronRight } from 'lucide-react'
import Layout from '../components/Layout'
import { quizzes } from '../services/api'

const TOPICS = ['All', 'Python', 'JavaScript', 'Machine Learning', 'React', 'SQL', 'Data Structures']

function QuizCard({ quiz, userId }) {
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const questions = quiz.questions || []
  const answered = Object.keys(answers).length
  const total = questions.length
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0

  const setAnswer = (qIdx, val) => setAnswers(a => ({ ...a, [qIdx]: val }))

  const submit = async () => {
    setSubmitting(true)
    try {
      const res = await quizzes.submit({
        quiz_id: quiz.id || quiz.quiz_id,
        user_id: userId,
        answers: Object.entries(answers).map(([idx, answer]) => ({
          question_id: questions[idx]?.id || questions[idx]?.question_id || parseInt(idx),
          answer
        }))
      })
      setResult(res.data)
    } catch (err) {
      setResult({ error: err.response?.data?.detail || 'Submission failed.' })
    }
    setSubmitting(false)
  }

  if (result) {
    const score = result.score ?? result.percentage ?? 0
    const passed = score >= 60
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-3">
          <Trophy size={20} className={passed ? 'text-amber-500' : 'text-slate-400'} />
          <h4 className="font-semibold text-slate-800">{quiz.title}</h4>
        </div>
        {result.error ? (
          <p className="text-sm text-red-500">{result.error}</p>
        ) : (
          <div className={`rounded-xl p-4 ${passed ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
            <p className={`text-2xl font-bold ${passed ? 'text-green-700' : 'text-orange-700'}`}>{Math.round(score)}%</p>
            <p className={`text-sm ${passed ? 'text-green-600' : 'text-orange-600'}`}>{passed ? '✓ Passed!' : 'Keep practicing!'}</p>
            {result.feedback && <p className="text-xs text-slate-600 mt-2">{result.feedback}</p>}
          </div>
        )}
        <button onClick={() => { setStarted(false); setResult(null); setAnswers({}) }} className="mt-3 text-sm text-primary-600 hover:underline">
          Retake quiz
        </button>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-slate-800">{quiz.title}</h4>
            <p className="text-sm text-slate-500 mt-0.5">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
          </div>
          {quiz.topic && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">{quiz.topic}</span>
          )}
        </div>
        {quiz.description && <p className="text-sm text-slate-500 mb-4">{quiz.description}</p>}
        <button
          onClick={() => setStarted(true)}
          disabled={questions.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-60"
        >
          Start Quiz <ChevronRight size={15} />
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-slate-800">{quiz.title}</h4>
        <span className="text-sm text-slate-500">{answered}/{total} answered</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 mb-5">
        <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-5">
        {questions.map((q, qi) => (
          <div key={qi} className="pb-4 border-b border-slate-100 last:border-0">
            <p className="text-sm font-medium text-slate-800 mb-3">
              <span className="text-primary-600 font-bold mr-1">{qi + 1}.</span>
              {q.question || q.text}
            </p>
            <div className="space-y-2">
              {(q.options || q.choices || []).map((opt, oi) => {
                const val = typeof opt === 'string' ? opt : opt.text || opt.value || String(oi)
                const selected = answers[qi] === val
                return (
                  <label key={oi} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border transition-colors ${selected ? 'bg-primary-50 border-primary-300' : 'border-transparent hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name={`q-${qi}`}
                      value={val}
                      checked={selected}
                      onChange={() => setAnswer(qi, val)}
                      className="text-primary-600 accent-primary-600"
                    />
                    <span className="text-sm text-slate-700">{val}</span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={submitting || answered === 0}
        className="mt-4 w-full py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 size={14} className="animate-spin" />}
        {submitting ? 'Submitting…' : 'Submit Quiz'}
      </button>
    </div>
  )
}

export default function Quizzes({ user, setUser }) {
  const [topic, setTopic] = useState('')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async t => {
    setLoading(true)
    setError('')
    try {
      const res = await quizzes.getList(t || '')
      const raw = res.data?.quizzes || res.data || []
      setList(Array.isArray(raw) ? raw : [])
    } catch { setError('Failed to load quizzes.') }
    setLoading(false)
  }

  useEffect(() => { load('') }, [])

  const handleTopicChange = t => {
    setTopic(t)
    load(t === 'All' ? '' : t)
  }

  return (
    <Layout user={user} setUser={setUser} title="Quizzes">
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
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <CheckSquare size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No quizzes found for this topic.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((q, i) => (
            <QuizCard key={q.id || i} quiz={q} userId={user?.id} />
          ))}
        </div>
      )}
    </Layout>
  )
}
