import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  buildModule,
  completeChapter,
  completeLesson,
  enrollModule,
  fetchEnrollments,
  fetchModuleEvaluation,
  getModule,
  searchTopicModules,
  submitModuleExercise,
  submitModuleQuiz,
} from '../services/api'

export default function Courses({ user }) {
  const navigate = useNavigate()
  const [topic, setTopic] = useState('Deep Learning')
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')
  const [enrollments, setEnrollments] = useState([])
  const [activeModule, setActiveModule] = useState(null)
  const [evaluation, setEvaluation] = useState(null)
  const [exerciseInput, setExerciseInput] = useState({})

  const refreshEnrollments = () => {
    fetchEnrollments(user.user_id)
      .then((res) => setEnrollments(res.enrollments || []))
      .catch(() => setEnrollments([]))
  }

  useEffect(() => {
    refreshEnrollments()
  }, [user.user_id])

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
    refreshEnrollments()
  }

  const openOrBuildModule = async (moduleId, selectedTopic, difficulty) => {
    try {
      const existing = await getModule(user.user_id, moduleId)
      setActiveModule(existing)
      const ev = await fetchModuleEvaluation(user.user_id, moduleId)
      setEvaluation(ev)
      return
    } catch {
      // build if missing
    }

    const built = await buildModule({
      user_id: user.user_id,
      module_id: moduleId,
      topic: selectedTopic,
      difficulty,
    })
    setActiveModule(built)
    const ev = await fetchModuleEvaluation(user.user_id, moduleId)
    setEvaluation(ev)
  }

  const onOpenModule = async (module) => {
    await openOrBuildModule(module.module_id, topic, module.difficulty)
  }

  const onStartFromEnrollment = async (enrollment) => {
    await openOrBuildModule(enrollment.module_id, enrollment.topic, enrollment.difficulty)
  }

  const refreshModule = async () => {
    if (!activeModule) return
    const next = await getModule(user.user_id, activeModule.module_id)
    setActiveModule(next)
    const ev = await fetchModuleEvaluation(user.user_id, activeModule.module_id)
    setEvaluation(ev)
  }

  const markLessonDone = async (chapterId, lessonId) => {
    await completeLesson({ user_id: user.user_id, module_id: activeModule.module_id, chapter_id: chapterId, lesson_id: lessonId })
    await refreshModule()
    setMessage('Lesson marked complete.')
  }

  const submitExerciseAtChapterEnd = async (chapterId, exerciseId) => {
    const key = `${chapterId}:${exerciseId}`
    const solution = exerciseInput[key] || ''
    const res = await submitModuleExercise({
      user_id: user.user_id,
      module_id: activeModule.module_id,
      chapter_id: chapterId,
      exercise_id: exerciseId,
      solution,
    })
    await refreshModule()
    setMessage(`Exercise submitted. Score: ${res.score}`)
  }

  const markChapterDone = async (chapterId) => {
    try {
      await completeChapter({ user_id: user.user_id, module_id: activeModule.module_id, chapter_id: chapterId })
      await refreshModule()
      setMessage('Chapter marked complete.')
    } catch (err) {
      setMessage(err?.response?.data?.detail || 'Please complete all chapter tasks first.')
    }
  }

  const submitQuiz = async (chapterId, quizId, answer) => {
    const res = await submitModuleQuiz({
      user_id: user.user_id,
      module_id: activeModule.module_id,
      chapter_id: chapterId,
      quiz_id: quizId,
      answer,
    })
    await refreshModule()
    setMessage(`Quiz submitted. Score: ${res.score}/${res.total}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate(-1)} className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50">← Previous</button>
        <Link to="/dashboard" className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50">🏠 Home</Link>
      </div>
      <h2 className="text-2xl font-semibold">Topic Search & Modules</h2>
      <div className="card flex gap-2">
        <input className="bg-slate-100 rounded px-3 py-2 flex-1" value={topic} onChange={(e)=>setTopic(e.target.value)} placeholder="Search topic e.g. Deep Learning" />
        <button onClick={onSearch} className="bg-indigo-600 px-4 py-2 rounded">Search</button>
      </div>
      {message && <div className="card text-emerald-300">{message}</div>}

      <div className="card">
        <h3 className="font-semibold mb-2">My Enrollments</h3>
        {enrollments.length === 0 ? (
          <p className="text-slate-500 text-sm">No enrollments yet.</p>
        ) : (
          <ul className="list-disc pl-6 text-slate-700 text-sm space-y-1">
            {enrollments.map((en) => (
              <li key={en.id} className="flex items-center justify-between gap-2">
                <span>{en.module_title} ({en.difficulty})</span>
                <button className="bg-violet-600 px-2 py-1 rounded text-xs" onClick={() => onStartFromEnrollment(en)}>
                  Start Learning
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {result && (
        <div className="space-y-4">
          {result.modules.map((module) => (
            <div className="card" key={module.module_id}>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{module.title}</h3>
                  <p className="text-sm text-slate-500">Difficulty: {module.difficulty} • {module.estimated_hours} hours</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onEnroll(module)} className="bg-emerald-600 px-3 py-2 rounded">Enroll</button>
                  <button onClick={() => onOpenModule(module)} className="bg-violet-600 px-3 py-2 rounded">Open Module</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeModule && (
        <div className="card space-y-4">
          <h3 className="text-xl font-semibold">Active Module: {activeModule.title}</h3>
          {evaluation && (
            <div className="bg-white border border-slate-200 rounded p-3">
              <p className="text-sm">Completion: {(evaluation.completion_ratio * 100).toFixed(0)}%</p>
              <p className="text-sm text-slate-500">Next Steps:</p>
              <ul className="list-disc pl-5 text-sm text-slate-700">
                {evaluation.next_steps.map((step) => <li key={step}>{step}</li>)}
              </ul>
            </div>
          )}

          {activeModule.chapters.map((chapter) => (
            <div key={chapter.chapter_id} className="bg-white border border-slate-200 rounded p-3 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">{chapter.title}</h4>
                <button className="bg-sky-700 rounded px-3 py-1 text-sm" onClick={() => markChapterDone(chapter.chapter_id)}>
                  {chapter.completed ? 'Completed' : 'Mark Chapter Complete'}
                </button>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Lessons</p>
                {chapter.lessons.map((lesson) => (
                  <div key={lesson.lesson_id} className="flex justify-between items-center border border-slate-200 rounded p-2 mb-2">
                    <div>
                      <p className="text-sm">{lesson.title}</p>
                      <p className="text-xs text-slate-500">{lesson.concepts.join(' • ')}</p>
                    </div>
                    <button className="bg-emerald-700 rounded px-3 py-1 text-sm" onClick={() => markLessonDone(chapter.chapter_id, lesson.lesson_id)}>
                      {lesson.completed ? 'Done' : 'Complete Lesson'}
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Chapter-end Exercise</p>
                {chapter.exercises.map((exercise) => {
                  const key = `${chapter.chapter_id}:${exercise.exercise_id}`
                  return (
                    <div key={exercise.exercise_id} className="border border-slate-200 rounded p-2 mb-2 text-sm space-y-2">
                      <p>{exercise.prompt}</p>
                      <textarea
                        className="w-full bg-slate-100 rounded p-2"
                        rows="3"
                        placeholder="Submit your chapter-end exercise solution"
                        value={exerciseInput[key] || ''}
                        onChange={(e) => setExerciseInput({ ...exerciseInput, [key]: e.target.value })}
                      />
                      <button className="bg-indigo-600 rounded px-3 py-1 text-xs" onClick={() => submitExerciseAtChapterEnd(chapter.chapter_id, exercise.exercise_id)}>
                        {exercise.completed ? `Submitted (${exercise.score})` : 'Submit Exercise'}
                      </button>
                    </div>
                  )
                })}
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Chapter-end Quiz</p>
                {chapter.quizzes.map((quiz) => (
                  <div key={quiz.quiz_id} className="border border-slate-200 rounded p-2 space-y-2">
                    <p className="text-sm">{quiz.question}</p>
                    <div className="flex flex-wrap gap-2">
                      {quiz.options.map((opt) => (
                        <button key={opt} className="bg-slate-700 rounded px-2 py-1 text-xs" onClick={() => submitQuiz(chapter.chapter_id, quiz.quiz_id, opt)}>
                          {opt}
                        </button>
                      ))}
                    </div>
                    {quiz.completed && <p className="text-xs text-emerald-300">Submitted • Score: {quiz.score}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-white border border-slate-200 rounded p-3">
            <h4 className="font-semibold mb-1">End-of-Module Demo Project: {activeModule.project.title}</h4>
            <p className="text-sm text-slate-700 mb-2">{activeModule.project.description}</p>
            <ul className="list-disc pl-5 text-sm text-slate-500">
              {activeModule.project.milestones.map((m) => <li key={m}>{m}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
