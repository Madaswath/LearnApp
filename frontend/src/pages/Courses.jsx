import { useEffect, useMemo, useState } from 'react'
import {
  buildModule,
  completeChapter,
  completeCourse,
  completeLesson,
  enrollModule,
  fetchEnrollments,
  fetchKnowledgeTopics,
  fetchModuleEvaluation,
  getModule,
  searchTopicModules,
  submitModuleExercise,
  submitModuleQuiz,
} from '../services/api'

export default function Courses({ user }) {
  const [topic, setTopic] = useState('Deep Learning')
  const [topics, setTopics] = useState([])
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')
  const [enrollments, setEnrollments] = useState([])
  const [activeModule, setActiveModule] = useState(null)
  const [activeChapterId, setActiveChapterId] = useState(null)
  const [activeLessonId, setActiveLessonId] = useState(null)
  const [evaluation, setEvaluation] = useState(null)
  const [exerciseInput, setExerciseInput] = useState({})

  const refreshEnrollments = () => fetchEnrollments(user.user_id).then((res) => setEnrollments(res.enrollments || [])).catch(() => setEnrollments([]))

  useEffect(() => {
    refreshEnrollments()
    fetchKnowledgeTopics()
      .then((res) => setTopics(res.topics || []))
      .catch(() => setTopics(['python', 'sql', 'statistics-for-data-science', 'machine-learning', 'deep-learning', 'nlp']))
  }, [user.user_id])

  const onSearch = async (topicValue = topic) => {
    setMessage('')
    const data = await searchTopicModules({ topic: topicValue })
    setTopic(topicValue)
    setResult(data)
  }

  const onEnroll = async (module) => {
    const enrolled = await enrollModule({
      user_id: user.user_id,
      topic,
      module_id: module.module_id,
      module_title: module.title,
    })
    setMessage(`✅ Enrolled in ${enrolled.module_title}.`)
    refreshEnrollments()
  }

  const openOrBuildModule = async (moduleId, selectedTopic) => {
    try {
      const existing = await getModule(user.user_id, moduleId)
      setActiveModule(existing)
      const firstChapter = existing.chapters?.[0]
      setActiveChapterId(firstChapter?.chapter_id || null)
      setActiveLessonId(firstChapter?.lessons?.[0]?.lesson_id || null)
      setEvaluation(await fetchModuleEvaluation(user.user_id, moduleId))
      return
    } catch {
      // build if missing
    }

    const built = await buildModule({ user_id: user.user_id, module_id: moduleId, topic: selectedTopic })
    setActiveModule(built)
    const firstChapter = built.chapters?.[0]
    setActiveChapterId(firstChapter?.chapter_id || null)
    setActiveLessonId(firstChapter?.lessons?.[0]?.lesson_id || null)
    setEvaluation(await fetchModuleEvaluation(user.user_id, moduleId))
  }

  const refreshModule = async () => {
    if (!activeModule) return
    const next = await getModule(user.user_id, activeModule.module_id)
    setActiveModule(next)
    setEvaluation(await fetchModuleEvaluation(user.user_id, activeModule.module_id))
  }

  const activeChapter = useMemo(
    () => activeModule?.chapters?.find((c) => c.chapter_id === activeChapterId) || activeModule?.chapters?.[0],
    [activeChapterId, activeModule],
  )

  const lessonIndex = useMemo(
    () => activeChapter?.lessons?.findIndex((l) => l.lesson_id === activeLessonId) ?? -1,
    [activeChapter, activeLessonId],
  )

  const activeLesson = lessonIndex >= 0 ? activeChapter?.lessons?.[lessonIndex] : activeChapter?.lessons?.[0]

  const goPreviousSection = () => {
    if (!activeChapter?.lessons?.length) return
    const idx = lessonIndex >= 0 ? lessonIndex : 0
    if (idx > 0) setActiveLessonId(activeChapter.lessons[idx - 1].lesson_id)
  }

  const goNextSection = () => {
    if (!activeChapter?.lessons?.length) return
    const idx = lessonIndex >= 0 ? lessonIndex : 0
    if (idx < activeChapter.lessons.length - 1) setActiveLessonId(activeChapter.lessons[idx + 1].lesson_id)
  }

  const markLessonDone = async () => {
    if (!activeLesson || !activeChapter || !activeModule) return
    await completeLesson({ user_id: user.user_id, module_id: activeModule.module_id, chapter_id: activeChapter.chapter_id, lesson_id: activeLesson.lesson_id })
    await refreshModule()
    setMessage('✅ Lesson marked complete.')
  }

  const submitExerciseAtChapterEnd = async (exerciseId) => {
    if (!activeChapter || !activeModule) return
    const key = `${activeChapter.chapter_id}:${exerciseId}`
    const res = await submitModuleExercise({ user_id: user.user_id, module_id: activeModule.module_id, chapter_id: activeChapter.chapter_id, exercise_id: exerciseId, solution: exerciseInput[key] || '' })
    await refreshModule()
    setMessage(`✅ Exercise submitted. Score: ${res.score}`)
  }

  const submitQuiz = async (quizId, answer) => {
    if (!activeChapter || !activeModule) return
    const res = await submitModuleQuiz({ user_id: user.user_id, module_id: activeModule.module_id, chapter_id: activeChapter.chapter_id, quiz_id: quizId, answer })
    await refreshModule()
    setMessage(`✅ Quiz submitted. Score: ${res.score}/${res.total}`)
  }

  const markChapterDone = async () => {
    if (!activeChapter || !activeModule) return
    try {
      await completeChapter({ user_id: user.user_id, module_id: activeModule.module_id, chapter_id: activeChapter.chapter_id })
      await refreshModule()
      setMessage('✅ Chapter marked complete.')
    } catch (err) {
      setMessage(`⚠️ ${err?.response?.data?.detail || 'Please complete all chapter tasks first.'}`)
    }
  }

  const submitCourse = async () => {
    if (!activeModule) return
    try {
      await completeCourse({ user_id: user.user_id, module_id: activeModule.module_id })
      await refreshModule()
      setMessage('✅ Course completed and saved in real time.')
    } catch (err) {
      setMessage(`⚠️ ${err?.response?.data?.detail || 'Complete all chapters before submitting the course.'}`)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">My Learning</h2>

      <div className="card flex gap-2 shadow-sm">
        <input className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Search topic to generate full course" />
        <button onClick={() => onSearch(topic)} className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500">Generate Course</button>
      </div>

      <section className="card shadow-sm">
        <h3 className="mb-3 font-semibold">Topics</h3>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <button key={t} onClick={() => onSearch(t.replace(/-/g, ' '))} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50">
              {t.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </section>

      {message && <div className="card border border-indigo-200 bg-indigo-50 text-indigo-700">{message}</div>}

      <section className="card shadow-sm">
        <h3 className="mb-2 font-semibold">Enrolled Courses</h3>
        {enrollments.length === 0 ? <p className="text-sm text-slate-500">No enrollments yet.</p> : (
          <div className="space-y-2">
            {enrollments.map((en) => (
              <div key={en.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span>{en.module_title}</span>
                <button className="rounded-lg bg-violet-600 px-3 py-1 text-xs text-white hover:bg-violet-500" onClick={() => openOrBuildModule(en.module_id, en.topic)}>Start / Continue</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {result && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Courses for: {result.topic}</h3>
          {result.modules.map((module) => (
            <div className="card shadow-sm" key={module.module_id}>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{module.title}</h3>
                  <p className="text-sm text-slate-500">{module.estimated_hours} hours</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onEnroll(module)} className="rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-500">Enroll</button>
                  <button onClick={() => openOrBuildModule(module.module_id, result.topic)} className="rounded-lg bg-violet-600 px-3 py-2 text-white hover:bg-violet-500">Open Course</button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {activeModule && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="card h-fit space-y-3 shadow-sm">
            <h3 className="text-lg font-semibold">Course Content Index</h3>
            <p className="text-sm text-slate-500">{activeModule.title}</p>
            <div className="space-y-2">
              {activeModule.chapters.map((chapter) => (
                <div key={chapter.chapter_id} className={`rounded-lg border p-2 ${activeChapterId === chapter.chapter_id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                  <button onClick={() => { setActiveChapterId(chapter.chapter_id); setActiveLessonId(chapter.lessons?.[0]?.lesson_id || null) }} className="w-full text-left">
                    <p className="font-medium text-sm">{chapter.title}</p>
                  </button>
                  <ul className="mt-1 space-y-1">
                    {chapter.lessons.map((lesson) => (
                      <li key={lesson.lesson_id}>
                        <button onClick={() => { setActiveChapterId(chapter.chapter_id); setActiveLessonId(lesson.lesson_id) }} className={`text-xs ${activeLessonId === lesson.lesson_id ? 'text-indigo-700 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}>
                          • {lesson.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </aside>

          <section className="card space-y-4 shadow-sm">
            <h3 className="text-xl font-semibold">{activeChapter?.title}</h3>
            {evaluation && (
              <div>
                <div className="mb-1 flex items-center justify-between text-sm text-slate-600"><span>Course Completion</span><span>{(evaluation.completion_ratio * 100).toFixed(0)}%</span></div>
                <div className="h-3 w-full rounded-full bg-slate-200"><div className="h-3 rounded-full bg-indigo-600" style={{ width: `${(evaluation.completion_ratio * 100).toFixed(0)}%` }} /></div>
              </div>
            )}

            {activeLesson && (
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-semibold">Lesson: {activeLesson.title}</p>
                <p className="mt-1 text-xs text-slate-600">{activeLesson.concepts.join(' • ')}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={goPreviousSection} className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50">Previous Section</button>
                  <button onClick={goNextSection} className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50">Next Section</button>
                  <button onClick={markLessonDone} className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-500">Mark Lesson Complete</button>
                </div>
              </div>
            )}

            {activeChapter?.exercises.map((exercise) => {
              const key = `${activeChapter.chapter_id}:${exercise.exercise_id}`
              return (
                <div key={exercise.exercise_id} className="space-y-2 rounded-lg border border-slate-200 p-3 text-sm">
                  <p>{exercise.prompt}</p>
                  <textarea className="w-full rounded-lg border border-slate-200 bg-white p-2" rows="3" value={exerciseInput[key] || ''} onChange={(e) => setExerciseInput({ ...exerciseInput, [key]: e.target.value })} />
                  <button className="rounded-lg bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-500" onClick={() => submitExerciseAtChapterEnd(exercise.exercise_id)}>{exercise.completed ? `Submitted (${exercise.score})` : 'Submit Assessment'}</button>
                </div>
              )
            })}

            {activeChapter?.quizzes.map((quiz) => (
              <div key={quiz.quiz_id} className="space-y-2 rounded-lg border border-slate-200 p-3">
                <p className="text-sm">{quiz.question}</p>
                <div className="flex flex-wrap gap-2">
                  {quiz.options.map((opt) => (
                    <button key={opt} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-100" onClick={() => submitQuiz(quiz.quiz_id, opt)}>{opt}</button>
                  ))}
                </div>
                {quiz.completed && <p className="text-xs text-emerald-600">Submitted • Score: {quiz.score}</p>}
              </div>
            ))}

            <div className="flex flex-wrap gap-2">
              <button className="rounded-lg bg-sky-700 px-3 py-2 text-sm text-white hover:bg-sky-600" onClick={markChapterDone}>{activeChapter?.completed ? 'Chapter Completed' : 'Mark Chapter Complete'}</button>
              <button className="rounded-lg bg-violet-700 px-3 py-2 text-sm text-white hover:bg-violet-600" onClick={submitCourse}>Submit Course</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
