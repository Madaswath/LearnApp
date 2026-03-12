import { useState } from 'react'
import { askMentor } from '../services/api'

export default function Mentor() {
  const [question, setQuestion] = useState('Explain backpropagation in simple terms')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState([])

  const onAsk = async () => {
    const data = await askMentor({ user_id: 'demo-user', learning_path_id: 'demo-path', question })
    setAnswer(data.answer)
    setSources(data.sources || [])
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">AI Mentor</h2>
      <div className="card space-y-2">
        <textarea className="w-full bg-slate-800 rounded p-3" rows="4" value={question} onChange={(e)=>setQuestion(e.target.value)} />
        <button onClick={onAsk} className="bg-emerald-600 px-4 py-2 rounded">Ask Mentor</button>
      </div>
      {answer && (
        <div className="card">
          <p className="mb-3">{answer}</p>
          <p className="text-slate-400 text-sm">Sources:</p>
          <ul className="list-disc pl-6 text-slate-300">{sources.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  )
}
