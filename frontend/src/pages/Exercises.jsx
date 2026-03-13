import { useEffect, useState } from 'react'
import { fetchExercises, submitExercise, trackProgress } from '../services/api'

export default function Exercises({ user }) {
  const [items, setItems] = useState([])
  const [solutions, setSolutions] = useState({})
  const [result, setResult] = useState('')

  useEffect(() => {
    fetchExercises().then(setItems).catch(() => setItems([]))
  }, [])

  const onSubmit = async (exerciseId, moduleId = 'general-practice') => {
    const response = await submitExercise({
      user_id: user.user_id,
      exercise_id: exerciseId,
      solution: solutions[exerciseId] || '',
    })
    await trackProgress({
      user_id: user.user_id,
      module_id: moduleId,
      lessons_completed: 0,
      concepts_completed: 1,
      minutes_spent: 15,
    })
    setResult(`Exercise ${exerciseId}: ${response.score}% - ${response.feedback}`)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Exercises</h2>
      {result && <div className="card text-emerald-300">{result}</div>}
      {items.map((item) => (
        <div key={item.id} className="card space-y-2">
          <p className="font-semibold">{item.title} <span className="text-xs text-slate-400">({item.difficulty})</span></p>
          <p className="text-slate-300 text-sm">{item.prompt}</p>
          <textarea
            className="w-full bg-slate-800 rounded p-2"
            rows="4"
            placeholder="Write your solution..."
            value={solutions[item.id] || ''}
            onChange={(e) => setSolutions({ ...solutions, [item.id]: e.target.value })}
          />
          <button className="bg-indigo-600 px-4 py-2 rounded" onClick={() => onSubmit(item.id)}>
            Submit Exercise
          </button>
        </div>
      ))}
    </div>
  )
}
