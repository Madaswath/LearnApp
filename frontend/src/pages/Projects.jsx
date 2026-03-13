import React, { useEffect, useState } from 'react'
import { Briefcase, ChevronDown, ChevronUp } from 'lucide-react'
import Layout from '../components/Layout'
import { projects } from '../services/api'

const TOPICS = ['All', 'Python', 'JavaScript', 'Machine Learning', 'React', 'SQL', 'Data Structures']

const diffStyles = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced:     'bg-purple-100 text-purple-700'
}

function ProjectCard({ project }) {
  const [expanded, setExpanded] = useState(false)
  const reqs = project.requirements || project.specs || []
  const diff = (project.difficulty || project.level || '').toLowerCase()

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-slate-800 leading-tight">{project.title}</h4>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0 ${diffStyles[diff] || 'bg-slate-100 text-slate-600'}`}>
            {project.difficulty || project.level}
          </span>
        </div>

        {project.topic && (
          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100 mb-2">
            {project.topic}
          </span>
        )}

        <p className="text-sm text-slate-500 line-clamp-3">{project.description}</p>
      </div>

      {reqs.length > 0 && (
        <div className="border-t border-slate-100">
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <span>View Requirements ({reqs.length})</span>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {expanded && (
            <ul className="px-5 pb-4 space-y-1.5">
              {reqs.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 flex-shrink-0" />
                  {typeof r === 'string' ? r : r.text || r.description || JSON.stringify(r)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default function Projects({ user, setUser }) {
  const [topic, setTopic] = useState('')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async t => {
    setLoading(true)
    setError('')
    try {
      const res = await projects.getList(t || '')
      const raw = res.data?.projects || res.data || []
      setList(Array.isArray(raw) ? raw : [])
    } catch { setError('Failed to load projects.') }
    setLoading(false)
  }

  useEffect(() => { load('') }, [])

  const handleTopicChange = t => {
    setTopic(t)
    load(t === 'All' ? '' : t)
  }

  return (
    <Layout user={user} setUser={setUser} title="Projects">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <Briefcase size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No projects found for this topic.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {list.map((p, i) => <ProjectCard key={p.id || i} project={p} />)}
        </div>
      )}
    </Layout>
  )
}
