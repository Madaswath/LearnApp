import { useState } from 'react'
import { askMentor } from '../services/api'

export default function MentorWidget({ user }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am Lumina AI mentor. Ask learning or app-navigation questions.' },
  ])

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim() || loading) return
    const question = text.trim()
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setText('')
    setLoading(true)
    try {
      const res = await askMentor({
        user_id: user.user_id,
        learning_path_id: 'general-support',
        topic: 'deep-learning',
        question,
      })
      setMessages((prev) => [...prev, { role: 'assistant', content: res.answer }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'I could not answer now. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="mb-3 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-indigo-50">
            <h4 className="font-semibold text-indigo-700">AI Mentor</h4>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-900">✕</button>
          </div>
          <div className="max-h-72 overflow-y-auto p-3 space-y-2 bg-slate-50">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-indigo-100 ml-8' : 'bg-white mr-8 border border-slate-200'}`}
              >
                {m.content}
              </div>
            ))}
          </div>
          <form onSubmit={send} className="p-3 border-t border-slate-200 flex gap-2 bg-white">
            <input
              className="flex-1 bg-slate-100 rounded-lg px-3 py-2 text-sm"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask mentor or app help..."
            />
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 text-sm">
              {loading ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-xl text-2xl text-white"
        aria-label="Open AI mentor"
      >
        💬
      </button>
    </div>
  )
}
