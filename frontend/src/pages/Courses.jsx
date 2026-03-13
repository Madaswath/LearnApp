import { useEffect, useState } from 'react'
import {
  buildModule,
  completeChapter,
  completeLesson,
  enrollModule,
  fetchEnrollments,
  getModule,
  searchTopicModules,
  submitModuleQuiz,
} from '../services/api'

export default function Courses({ user }) {
  const [topic, setTopic] = useState('Deep Learning')
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')
  const [enrollments, setEnrollments] = useState([])
  const [activeModule, setActiveModule] = useState(null)

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

  const onOpenModule = async (module) => {
    try {
      const existing = await getModule(user.user_id, module.module_id)
      setActiveModule(existing)
      return
    } catch {
      // build if missing
    }

    const built = await buildModule({
      user_id: user.user_id,
      module_id: module.module_id,
      topic,
      difficulty: module.difficulty,
    })
    setActiveModule(built)
  }

  const refreshModule = async () => {
    if (!activeModule) return
    const next = await getModule(user.user_id, activeModule.module_id)
    setActiveModule(next)
  }

  const markLessonDone = async (chapterId, lessonId) => {
    await completeLesson({ user_id: user.user_id, module_id: activeModule.module_id, chapter_id: chapterId, lesson_id: lessonId })
    await refreshModule()
    setMessage('Lesson marked complete.')
  }

  const markChapterDone = async (chapterId) => {
    await completeChapter({ user_id: user.user_id, module_id: activeModule.module_id, chapter_id: chapterId })
    await refreshModule()
    setMessage('Chapter marked complete.')
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
      <h2 className="text-2xl font-semibold">Topic Search & Modules</h2>
      <div className="card flex gap-2">
        <input className="bg-slate-800 rounded px-3 py-2 flex-1" value={topic} onChange={(e)=>setTopic(e.target.value)} placeholder="Search topic e.g. Deep Learning" />
        <button onClick={onSearch} className="bg-indigo-600 px-4 py-2 rounded">Search</button>
      </div>
      {message && <div className="card text-emerald-300">{message}</div>}

      <div className="card">
        <h3 className="font-semibold mb-2">My Enrollments</h3>
        {enrollments.length === 0 ? (
          <p className="text-slate-400 text-sm">No enrollments yet.</p>
        ) : (
          <ul className="list-disc pl-6 text-slate-300 text-sm">
            {enrollments.map((en) => <li key={en.id}>{en.module_title} ({en.difficulty})</li>)}
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
                  <p className="text-sm text-slate-400">Difficulty: {module.difficulty} • {module.estimated_hours} hours</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onEnroll(module)} className="bg-emerald-600 px-3 py-2 rounded">Enroll</button>
                  <button onClick={() => onOpenModule(module)} className="bg-violet-600 px-3 py-2 rounded">Open Module</button>
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

      {activeModule && (
        <div className="card space-y-4">
          <h3 className="text-xl font-semibold">Active Module: {activeModule.title}</h3>
          {activeModule.chapters.map((chapter) => (
            <div key={chapter.chapter_id} className="bg-slate-900 border border-slate-800 rounded p-3 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">{chapter.title}</h4>
                <button className="bg-sky-700 rounded px-3 py-1 text-sm" onClick={() => markChapterDone(chapter.chapter_id)}>
                  {chapter.completed ? 'Completed' : 'Mark Chapter Complete'}
                </button>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-1">Lessons</p>
                {chapter.lessons.map((lesson) => (
                  <div key={lesson.lesson_id} className="flex justify-between items-center border border-slate-800 rounded p-2 mb-2">
                    <div>
                      <p className="text-sm">{lesson.title}</p>
                      <p className="text-xs text-slate-400">{lesson.concepts.join(' • ')}</p>
                    </div>
                    <button className="bg-emerald-700 rounded px-3 py-1 text-sm" onClick={() => markLessonDone(chapter.chapter_id, lesson.lesson_id)}>
                      {lesson.completed ? 'Done' : 'Complete Lesson'}
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-1">Exercises</p>
                {chapter.exercises.map((exercise) => (
                  <div key={exercise.exercise_id} className="border border-slate-800 rounded p-2 mb-2 text-sm">
                    {exercise.prompt}
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-1">Quiz</p>
                {chapter.quizzes.map((quiz) => (
                  <div key={quiz.quiz_id} className="border border-slate-800 rounded p-2 space-y-2">
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

          <div className="bg-slate-900 border border-slate-800 rounded p-3">
            <h4 className="font-semibold mb-1">Demo Project: {activeModule.project.title}</h4>
            <p className="text-sm text-slate-300 mb-2">{activeModule.project.description}</p>
            <ul className="list-disc pl-5 text-sm text-slate-400">
              {activeModule.project.milestones.map((m) => <li key={m}>{m}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
