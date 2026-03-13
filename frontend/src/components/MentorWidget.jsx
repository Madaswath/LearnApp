import { useState } from 'react'
import { askMentor } from '../services/api'

const renderLines = (text) =>
  text.split('\n').map((line, i) => (
    <p key={i} className={line.endsWith(':') ? 'font-semibold text-slate-800' : 'text-slate-700'}>
      {line}
    </p>
  ))

export default function MentorWidget({ user }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am LearnApp mentor. Ask learning or app-navigation questions.' },
  ])

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim() || loading) return
    const question = text.trim()
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setText('')
    setLoading(true)
    try {
      const res = await askMentor({ user_id: user.user_id, learning_path_id: 'general-support', topic: 'deep-learning', question })
      setMessages((prev) => [...prev, { role: 'assistant', content: res.answer }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Summary:\n- I could not answer now.\nNext Steps:\n1. Try again in a moment.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="mb-3 w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 bg-indigo-50 px-4 py-3">
            <h4 className="font-semibold text-indigo-700">AI Mentor</h4>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-900">✕</button>
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto bg-slate-50 p-3">
            {messages.map((m, i) => (
              <div key={`${m.role}-${i}`} className={`rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'ml-10 bg-indigo-100' : 'mr-10 border border-slate-200 bg-white'}`}>
                {renderLines(m.content)}
              </div>
            ))}
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-slate-200 bg-white p-3">
            <input className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask mentor or app help..." />
            <button className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500">{loading ? '...' : 'Send'}</button>
          </form>
        </div>
      )}
      <button onClick={() => setOpen((v) => !v)} className="h-14 w-14 rounded-full bg-indigo-600 text-2xl text-white shadow-xl hover:bg-indigo-500" aria-label="Open AI mentor">
        💬
      </button>
    </div>
  )
}
