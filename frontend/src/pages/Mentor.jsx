import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { askMentor } from '../services/api'

export default function Mentor({ user }) {
  const navigate = useNavigate()
  const [topic, setTopic] = useState('deep-learning')
  const [question, setQuestion] = useState('How do I start learning after enrolling in a module?')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState([])

  const onAsk = async () => {
    const data = await askMentor({ user_id: user.user_id, learning_path_id: 'active-path', topic, question })
    setAnswer(data.answer)
    setSources(data.sources || [])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate(-1)} className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50">← Previous</button>
        <Link to="/dashboard" className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50">🏠 Home</Link>
      </div>

      <h2 className="text-2xl font-semibold">AI Mentor & App Support Assistant</h2>
      <div className="card space-y-2">
        <input className="w-full bg-slate-100 rounded p-3" value={topic} onChange={(e)=>setTopic(e.target.value)} placeholder="Topic slug e.g. deep-learning" />
        <textarea className="w-full bg-slate-100 rounded p-3" rows="4" value={question} onChange={(e)=>setQuestion(e.target.value)} placeholder="Ask concept doubts or app navigation questions" />
        <button onClick={onAsk} className="bg-emerald-600 text-white px-4 py-2 rounded">Ask Mentor</button>
      </div>
      {answer && (
        <div className="card">
          <p className="mb-3 text-slate-800">{answer}</p>
          <p className="text-slate-500 text-sm">Sources:</p>
          <ul className="list-disc pl-6 text-slate-700">{sources.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  )
}
