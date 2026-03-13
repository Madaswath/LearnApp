import { useState } from 'react'
import { askMentor } from '../services/api'

export default function MentorWidget({ user }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am Lumina support mentor. Ask about learning topics or app navigation.' },
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
        <div className="mb-3 w-80 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <h4 className="font-semibold">AI Mentor</h4>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="max-h-72 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-indigo-600/30 ml-8' : 'bg-slate-800 mr-8'}`}
              >
                {m.content}
              </div>
            ))}
          </div>
          <form onSubmit={send} className="p-3 border-t border-slate-700 flex gap-2">
            <input
              className="flex-1 bg-slate-800 rounded-lg px-3 py-2 text-sm"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask mentor or app help..."
            />
            <button className="bg-indigo-600 hover:bg-indigo-500 rounded-lg px-3 py-2 text-sm">
              {loading ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-xl text-2xl"
        aria-label="Open AI mentor"
      >
        💬
      </button>
    </div>
  )
}
