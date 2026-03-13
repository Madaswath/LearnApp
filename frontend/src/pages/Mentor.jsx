import { useState } from 'react'
import { askMentor } from '../services/api'

function renderStructured(answer) {
  return answer.split('\n').map((line, idx) => {
    if (line.endsWith(':')) return <p key={idx} className="mt-2 font-semibold text-slate-800">{line}</p>
    if (line.startsWith('- ') || /^\d+\.\s/.test(line)) return <p key={idx} className="ml-3 text-slate-700">{line}</p>
    return <p key={idx} className="text-slate-700">{line}</p>
  })
}

export default function Mentor({ user }) {
  const [topic, setTopic] = useState('deep-learning')
  const [question, setQuestion] = useState('How do I start learning after enrolling in a module?')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(false)

  const onAsk = async () => {
    setLoading(true)
    try {
      const data = await askMentor({ user_id: user.user_id, learning_path_id: 'active-path', topic, question })
      setAnswer(data.answer)
      setSources(data.sources || [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">AI Mentor & App Support Assistant</h2>
      <div className="card space-y-2 shadow-sm">
        <input className="w-full rounded-lg border border-slate-200 bg-white p-3" value={topic} onChange={(e)=>setTopic(e.target.value)} placeholder="Topic slug e.g. deep-learning" />
        <textarea className="w-full rounded-lg border border-slate-200 bg-white p-3" rows="4" value={question} onChange={(e)=>setQuestion(e.target.value)} placeholder="Ask concept doubts or app navigation questions" />
        <button onClick={onAsk} className="w-fit rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500">{loading ? 'Thinking...' : 'Ask Mentor'}</button>
      </div>
      {answer && (
        <div className="card space-y-2 border border-indigo-200 bg-indigo-50">
          {renderStructured(answer)}
          <p className="pt-2 text-sm font-medium text-slate-600">Sources:</p>
          <ul className="list-disc pl-6 text-sm text-slate-700">{sources.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  )
}
