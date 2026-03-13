import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2, MessageCircle, Trash2, ExternalLink } from 'lucide-react'
import Layout from '../components/Layout'
import { mentor } from '../services/api'

const TOPIC_CHIPS = ['Python', 'JavaScript', 'Machine Learning', 'React', 'SQL', 'Data Science', 'Web Dev']

function UserBubble({ text }) {
  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[75%] bg-primary-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm shadow-sm">
        {text}
      </div>
    </div>
  )
}

function MentorBubble({ text, sources }) {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex gap-2.5 max-w-[80%]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
          <MessageCircle size={14} className="text-white" />
        </div>
        <div>
          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm shadow-sm text-slate-700 whitespace-pre-wrap">
            {text}
          </div>
          {sources && sources.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {sources.map((s, i) => (
                <a
                  key={i}
                  href={s.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 hover:bg-primary-50 hover:text-primary-600"
                >
                  <ExternalLink size={10} />
                  {s.title || s.source || `Source ${i+1}`}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <MessageCircle size={14} className="text-white" />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm">
          <div className="flex gap-1 items-center h-5">
            <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Mentor({ user, setUser }) {
  const [messages, setMessages] = useState([
    { role: 'mentor', text: "Hi! I'm your AI Mentor. Ask me anything about programming, data science, or any learning topic. Select a topic chip below to get started!" }
  ])
  const [input, setInput] = useState('')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (overrideMsg) => {
    const text = (overrideMsg ?? input).trim()
    if (!text || loading) return

    setMessages(m => [...m, { role: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const res = await mentor.chat({ question: text, topic: topic || undefined, user_id: user?.id })
      const data = res.data
      const reply = data.answer || data.response || data.message || data.reply || 'I am not sure about that. Can you rephrase?'
      const sources = (data.sources || data.citations || []).map(s => typeof s === 'string' ? { title: s, url: '#' } : s)
      setMessages(m => [...m, { role: 'mentor', text: reply, sources }])
    } catch {
      setMessages(m => [...m, { role: 'mentor', text: 'Sorry, I could not connect to the mentor service. Please try again.' }])
    }
    setLoading(false)
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const chipClick = chip => {
    setTopic(chip)
    send(`Tell me about ${chip}`)
  }

  return (
    <Layout user={user} setUser={setUser} title="AI Mentor">
      <div className="flex flex-col h-[calc(100vh-130px)] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-slate-500 font-medium">Topic:</span>
            {TOPIC_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => setTopic(chip)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  topic === chip
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setMessages([{ role: 'mentor', text: "Conversation cleared. What would you like to learn today?" }])
              setTopic('')
            }}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50"
          >
            <Trash2 size={13} />
            Clear
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 chat-messages">
          {messages.map((msg, i) =>
            msg.role === 'user'
              ? <UserBubble key={i} text={msg.text} />
              : <MentorBubble key={i} text={msg.text} sources={msg.sources} />
          )}
          {loading && <ThinkingBubble />}
          <div ref={bottomRef} />
        </div>

        {/* Quick starters when empty */}
        {messages.length === 1 && !loading && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {['How does Python work?', 'Explain async/await', 'What is machine learning?', 'Best practices for React'].map(q => (
              <button key={q} onClick={() => send(q)} className="text-xs px-3 py-1.5 rounded-xl border border-primary-200 text-primary-600 bg-primary-50 hover:bg-primary-100">
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-100 bg-white">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={`Ask me anything${topic ? ` about ${topic}` : ''}… (Enter to send)`}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none max-h-28 overflow-y-auto"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 flex-shrink-0"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
