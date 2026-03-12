import { useState } from 'react'
import { enrollModule, searchTopicModules, trackProgress } from '../services/api'

export default function Courses({ user }) {
  const [topic, setTopic] = useState('Deep Learning')
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')

  const onSearch = async () => {
    setMessage('')
    const data = await searchTopicModules({ topic })
    setResult(data)
  }

  const onEnroll = async (module) => {
    const enrolled = await enrollModule({
      user_id: user.user_id,
      topic,
      module_id: module.module_id,
      module_title: module.title,
      difficulty: module.difficulty,
    })
    setMessage(`Enrolled in ${enrolled.module_title} (${enrolled.difficulty}).`)
  }

  const onActivity = async (module) => {
    await trackProgress({
      user_id: user.user_id,
      module_id: module.module_id,
      lessons_completed: 1,
      concepts_completed: 2,
      minutes_spent: 20,
    })
    setMessage(`Progress updated for ${module.title}.`)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Topic Search & Modules</h2>
      <div className="card flex gap-2">
        <input className="bg-slate-800 rounded px-3 py-2 flex-1" value={topic} onChange={(e)=>setTopic(e.target.value)} placeholder="Search topic e.g. Deep Learning" />
        <button onClick={onSearch} className="bg-indigo-600 px-4 py-2 rounded">Search</button>
      </div>
      {message && <div className="card text-emerald-300">{message}</div>}
      {result && (
        <div className="space-y-4">
          {result.modules.map((module) => (
            <div className="card" key={module.module_id}>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{module.title}</h3>
                  <p className="text-sm text-slate-400">Difficulty: {module.difficulty} • {module.estimated_hours} hours</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onEnroll(module)} className="bg-emerald-600 px-3 py-2 rounded">Enroll</button>
                  <button onClick={() => onActivity(module)} className="bg-sky-600 px-3 py-2 rounded">Track Activity</button>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {module.lessons.map((lesson) => (
                  <div key={lesson.lesson_title} className="bg-slate-800 rounded p-3">
                    <p className="font-medium">{lesson.lesson_title}</p>
                    <ul className="list-disc pl-5 text-sm text-slate-300">
                      {lesson.concepts.map((concept) => <li key={concept}>{concept}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
