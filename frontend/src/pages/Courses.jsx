import { useState } from 'react'
import { createLearningPath } from '../services/api'

export default function Courses() {
  const [topic, setTopic] = useState('Deep Learning')
  const [path, setPath] = useState(null)

  const onGenerate = async () => {
    const data = await createLearningPath({
      user_id: 'demo-user',
      topic,
      skill_level: 'beginner',
      target_duration_weeks: 10,
    })
    setPath(data)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Course Viewer</h2>
      <div className="card flex gap-2">
        <input className="bg-slate-800 rounded px-3 py-2 flex-1" value={topic} onChange={(e)=>setTopic(e.target.value)} />
        <button onClick={onGenerate} className="bg-indigo-600 px-4 py-2 rounded">Generate Path</button>
      </div>
      {path && (
        <div className="space-y-3">
          {path.chapters.map((c) => (
            <div className="card" key={c.title}>
              <h3 className="text-lg font-semibold">{c.title}</h3>
              <ul className="list-disc pl-6 text-slate-300">
                {c.objectives.map((o) => <li key={o}>{o}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
