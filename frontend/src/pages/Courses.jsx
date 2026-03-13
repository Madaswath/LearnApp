import { useEffect, useMemo, useState } from 'react'
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
  const [topic, setTopic] = useState('Deep Learning')
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')
  const [enrollments, setEnrollments] = useState([])
  const [activeModule, setActiveModule] = useState(null)
  const [activeChapterId, setActiveChapterId] = useState(null)
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
    setMessage(`✅ Enrolled in ${enrolled.module_title} (${enrolled.difficulty}).`)
    refreshEnrollments()
  }

  const openOrBuildModule = async (moduleId, selectedTopic, difficulty) => {
    try {
      const existing = await getModule(user.user_id, moduleId)
      setActiveModule(existing)
      setActiveChapterId(existing.chapters?.[0]?.chapter_id || null)
      const ev = await fetchModuleEvaluation(user.user_id, moduleId)
      setEvaluation(ev)
      return
    } catch {
      // build if missing
    }

    const built = await buildModule({ user_id: user.user_id, module_id: moduleId, topic: selectedTopic, difficulty })
    setActiveModule(built)
    setActiveChapterId(built.chapters?.[0]?.chapter_id || null)
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
    setMessage('✅ Lesson marked complete.')
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
    setMessage(`✅ Exercise submitted. Score: ${res.score}`)
  }

  const markChapterDone = async (chapterId) => {
    try {
      await completeChapter({ user_id: user.user_id, module_id: activeModule.module_id, chapter_id: chapterId })
      await refreshModule()
      setMessage('✅ Chapter marked complete.')
    } catch (err) {
      setMessage(`⚠️ ${err?.response?.data?.detail || 'Please complete all chapter tasks first.'}`)
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
    setMessage(`✅ Quiz submitted. Score: ${res.score}/${res.total}`)
  }

  const activeChapter = useMemo(
    () => activeModule?.chapters?.find((c) => c.chapter_id === activeChapterId) || activeModule?.chapters?.[0],
    [activeChapterId, activeModule],
  )

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Topic Search & Modules</h2>
      <div className="card flex gap-2 shadow-sm">
        <input
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Search topic e.g. Deep Learning"
        />
        <button onClick={onSearch} className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500">Search</button>
      </div>
      {message && <div className="card border border-indigo-200 bg-indigo-50 text-indigo-700">{message}</div>}

      <div className="card shadow-sm">
        <h3 className="mb-2 font-semibold">My Enrollments</h3>
        {enrollments.length === 0 ? (
          <p className="text-sm text-slate-500">No enrollments yet.</p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-700">
            {enrollments.map((en) => (
              <li key={en.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <span>{en.module_title} ({en.difficulty})</span>
                <button className="rounded-lg bg-violet-600 px-3 py-1 text-xs text-white hover:bg-violet-500" onClick={() => onStartFromEnrollment(en)}>
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
            <div className="card shadow-sm" key={module.module_id}>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{module.title}</h3>
                  <p className="text-sm text-slate-500">Difficulty: {module.difficulty} • {module.estimated_hours} hours</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onEnroll(module)} className="rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-500">Enroll</button>
                  <button onClick={() => onOpenModule(module)} className="rounded-lg bg-violet-600 px-3 py-2 text-white hover:bg-violet-500">Open Module</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeModule && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="card h-fit space-y-3 shadow-sm">
            <h3 className="text-lg font-semibold">Continuous Learning</h3>
            <p className="text-sm text-slate-500">{activeModule.title}</p>
            <div className="space-y-2">
              {activeModule.chapters.map((chapter) => (
                <button
                  key={chapter.chapter_id}
                  onClick={() => setActiveChapterId(chapter.chapter_id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left ${activeChapterId === chapter.chapter_id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <p className="font-medium text-sm">{chapter.title}</p>
                  <p className="text-xs text-slate-500">Lessons: {chapter.lessons.length} • Quizzes: {chapter.quizzes.length} • Exercises: {chapter.exercises.length}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="card space-y-4 shadow-sm">
            <h3 className="text-xl font-semibold">{activeChapter?.title}</h3>
            {evaluation && (
              <div>
                <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                  <span>Module Completion</span>
                  <span>{(evaluation.completion_ratio * 100).toFixed(0)}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-200">
                  <div className="h-3 rounded-full bg-indigo-600" style={{ width: `${(evaluation.completion_ratio * 100).toFixed(0)}%` }} />
                </div>
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                  {evaluation.next_steps.map((step) => <li key={step}>{step}</li>)}
                </ul>
              </div>
            )}

            {activeChapter && (
              <>
                <div>
                  <p className="mb-2 text-sm text-slate-500">Lessons</p>
                  {activeChapter.lessons.map((lesson) => (
                    <div key={lesson.lesson_id} className="mb-2 flex items-center justify-between rounded-lg border border-slate-200 p-3">
                      <div>
                        <p className="text-sm font-medium">{lesson.title}</p>
                        <p className="text-xs text-slate-500">{lesson.concepts.join(' • ')}</p>
                      </div>
                      <button className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-500" onClick={() => markLessonDone(activeChapter.chapter_id, lesson.lesson_id)}>
                        {lesson.completed ? 'Done' : 'Complete'}
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="mb-2 text-sm text-slate-500">Chapter Exercise</p>
                  {activeChapter.exercises.map((exercise) => {
                    const key = `${activeChapter.chapter_id}:${exercise.exercise_id}`
                    return (
                      <div key={exercise.exercise_id} className="mb-2 space-y-2 rounded-lg border border-slate-200 p-3 text-sm">
                        <p>{exercise.prompt}</p>
                        <textarea
                          className="w-full rounded-lg border border-slate-200 bg-white p-2"
                          rows="3"
                          placeholder="Submit your chapter-end exercise solution"
                          value={exerciseInput[key] || ''}
                          onChange={(e) => setExerciseInput({ ...exerciseInput, [key]: e.target.value })}
                        />
                        <button className="rounded-lg bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-500" onClick={() => submitExerciseAtChapterEnd(activeChapter.chapter_id, exercise.exercise_id)}>
                          {exercise.completed ? `Submitted (${exercise.score})` : 'Submit Exercise'}
                        </button>
                      </div>
                    )
                  })}
                </div>

                <div>
                  <p className="mb-2 text-sm text-slate-500">Chapter Quiz</p>
                  {activeChapter.quizzes.map((quiz) => (
                    <div key={quiz.quiz_id} className="space-y-2 rounded-lg border border-slate-200 p-3">
                      <p className="text-sm">{quiz.question}</p>
                      <div className="flex flex-wrap gap-2">
                        {quiz.options.map((opt) => (
                          <button key={opt} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-100" onClick={() => submitQuiz(activeChapter.chapter_id, quiz.quiz_id, opt)}>
                            {opt}
                          </button>
                        ))}
                      </div>
                      {quiz.completed && <p className="text-xs text-emerald-600">Submitted • Score: {quiz.score}</p>}
                    </div>
                  ))}
                </div>

                <button className="w-fit rounded-lg bg-sky-700 px-3 py-2 text-sm text-white hover:bg-sky-600" onClick={() => markChapterDone(activeChapter.chapter_id)}>
                  {activeChapter.completed ? 'Chapter Completed' : 'Mark Chapter Complete'}
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
