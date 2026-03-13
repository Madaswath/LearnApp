import { useEffect, useState } from 'react'
import { fetchQuizzes, submitQuiz, trackProgress } from '../services/api'

export default function Quizzes({ user }) {
  const [quizzes, setQuizzes] = useState([])
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState('')

  useEffect(() => {
    fetchQuizzes().then(setQuizzes).catch(() => setQuizzes([]))
  }, [])

  const setAnswer = (quizId, questionId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [quizId]: { ...(prev[quizId] || {}), [questionId]: option },
    }))
  }

  const onSubmit = async (quiz) => {
    const submission = await submitQuiz({
      user_id: user.user_id,
      quiz_id: quiz.id,
      answers: answers[quiz.id] || {},
    })
    await trackProgress({
      user_id: user.user_id,
      module_id: 'quiz-practice',
      lessons_completed: 0,
      concepts_completed: 1,
      minutes_spent: 10,
    })
    setResult(`${quiz.title}: ${submission.score}/${submission.total}`)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Quizzes</h2>
      {result && <div className="card text-emerald-300">{result}</div>}
      {quizzes.map((quiz) => (
        <div key={quiz.id} className="card space-y-3">
          <h3 className="font-semibold">{quiz.title} <span className="text-xs text-slate-400">({quiz.difficulty})</span></h3>
          {quiz.questions.map((q) => (
            <div key={q.id} className="bg-slate-800 rounded p-3 space-y-2">
              <p>{q.question}</p>
              <div className="grid md:grid-cols-2 gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswer(quiz.id, q.id, opt)}
                    className={`text-left px-3 py-2 rounded border ${answers[quiz.id]?.[q.id] === opt ? 'border-indigo-500 bg-slate-700' : 'border-slate-700'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => onSubmit(quiz)} className="bg-indigo-600 px-4 py-2 rounded">Submit Quiz</button>
        </div>
      ))}
    </div>
  )
}
