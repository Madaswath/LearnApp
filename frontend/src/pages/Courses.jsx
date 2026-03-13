import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, BookOpen, CheckCircle, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import Layout from '../components/Layout'
import { courses, modules } from '../services/api'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [])
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
      {msg}
    </div>
  )
}

function LevelBadge({ level }) {
  const styles = { beginner: 'bg-green-100 text-green-700', intermediate: 'bg-blue-100 text-blue-700', advanced: 'bg-purple-100 text-purple-700' }
  const key = (level || '').toLowerCase()
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${styles[key] || 'bg-slate-100 text-slate-600'}`}>{level}</span>
}

function LessonItem({ lesson, userId, moduleId, onComplete }) {
  const [completing, setCompleting] = useState(false)
  const [done, setDone] = useState(lesson.completed || false)

  const complete = async () => {
    setCompleting(true)
    try {
      await modules.completeLesson({ user_id: userId, module_id: moduleId, lesson_id: lesson.id || lesson.lesson_id })
      setDone(true)
      onComplete && onComplete()
    } catch {}
    setCompleting(false)
  }

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50">
      <div className="flex items-center gap-2">
        <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-500' : 'bg-slate-200'}`}>
          {done && <CheckCircle size={12} className="text-white" />}
        </span>
        <span className={`text-sm ${done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
          {lesson.title || lesson.name}
        </span>
      </div>
      {!done && (
        <button onClick={complete} disabled={completing} className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 disabled:opacity-60">
          {completing ? '…' : 'Complete'}
        </button>
      )}
    </div>
  )
}

function ChapterAccordion({ chapter, userId, moduleId, onChapterComplete }) {
  const [open, setOpen] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [done, setDone] = useState(chapter.completed || false)
  const lessons = chapter.lessons || []

  const completeChapter = async () => {
    setCompleting(true)
    try {
      await modules.completeChapter({ user_id: userId, module_id: moduleId, chapter_id: chapter.id || chapter.chapter_id })
      setDone(true)
      onChapterComplete && onChapterComplete()
    } catch {}
    setCompleting(false)
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          <span className={`text-sm font-medium ${done ? 'text-slate-400' : 'text-slate-800'}`}>
            {chapter.title || chapter.name}
          </span>
          {done && <CheckCircle size={14} className="text-green-500" />}
        </div>
        <span className="text-xs text-slate-400">{lessons.length} lessons</span>
      </button>
      {open && (
        <div className="px-3 py-2 space-y-0.5">
          {lessons.map((lesson, idx) => (
            <LessonItem key={idx} lesson={lesson} userId={userId} moduleId={moduleId} />
          ))}
          {!done && (
            <button onClick={completeChapter} disabled={completing} className="mt-2 w-full py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-60">
              {completing ? 'Marking…' : 'Mark chapter complete'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ModuleView({ mod, userId }) {
  const chapters = mod.chapters || mod.content?.chapters || []
  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <BookOpen size={16} className="text-primary-600" />
        {mod.title || 'Course Content'}
      </h4>
      {chapters.length === 0 ? (
        <p className="text-sm text-slate-400">No chapters available.</p>
      ) : (
        chapters.map((ch, i) => (
          <ChapterAccordion key={i} chapter={ch} userId={userId} moduleId={mod.module_id || mod.id} />
        ))
      )}
    </div>
  )
}

function EnrollmentCard({ enr, user, onBuild }) {
  const [building, setBuilding] = useState(false)
  const [mod, setMod] = useState(null)
  const [loadingMod, setLoadingMod] = useState(false)

  const build = async () => {
    setBuilding(true)
    try {
      const res = await courses.buildModule({
        user_id: user.id, topic: enr.topic, level: enr.level, module_id: enr.module_id
      })
      setMod(res.data)
      onBuild && onBuild(res.data)
    } catch {}
    setBuilding(false)
  }

  const loadModule = async () => {
    if (!enr.module_id) return build()
    setLoadingMod(true)
    try {
      const res = await courses.getModule(user.id, enr.module_id)
      setMod(res.data)
    } catch { build() }
    setLoadingMod(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="font-semibold text-slate-800">{enr.title || enr.topic}</h4>
          <p className="text-sm text-slate-500 mt-0.5">{enr.topic}</p>
        </div>
        <LevelBadge level={enr.level} />
      </div>
      <div className="flex gap-2">
        <button
          onClick={loadModule}
          disabled={loadingMod || building}
          className="flex-1 py-2 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-60"
        >
          {loadingMod ? 'Loading…' : 'Continue Learning'}
        </button>
        <button
          onClick={build}
          disabled={building}
          className="flex-1 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 disabled:opacity-60"
        >
          {building ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Build Course'}
        </button>
      </div>
      {mod && <ModuleView mod={mod} userId={user.id} />}
    </div>
  )
}

export default function Courses({ user, setUser }) {
  const location = useLocation()
  const [query, setQuery] = useState(location.state?.topic || '')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [enrollments, setEnrollments] = useState([])
  const [loadingEnr, setLoadingEnr] = useState(true)
  const [toast, setToast] = useState(null)
  const [enrollingIdx, setEnrollingIdx] = useState(null)

  const loadEnrollments = async () => {
    if (!user?.id) return
    setLoadingEnr(true)
    try {
      const res = await courses.getEnrollments(user.id)
      setEnrollments(res.data?.enrollments || res.data || [])
    } catch {}
    setLoadingEnr(false)
  }

  useEffect(() => { loadEnrollments() }, [user?.id])
  useEffect(() => { if (location.state?.topic) handleSearch(location.state.topic) }, [])

  const handleSearch = async (overrideTopic) => {
    const q = overrideTopic ?? query
    if (!q.trim()) return
    setSearching(true)
    setSearchError('')
    try {
      const res = await courses.search(q.trim())
      const raw = res.data?.courses || res.data?.results || res.data || []
      setResults(Array.isArray(raw) ? raw.slice(0, 3) : [])
    } catch (err) {
      setSearchError('Search failed. Please try again.')
    }
    setSearching(false)
  }

  const handleEnroll = async (course, idx) => {
    setEnrollingIdx(idx)
    try {
      await courses.enroll({ user_id: user.id, topic: course.topic || query, level: course.level, title: course.title })
      setToast({ msg: `Enrolled in ${course.title || course.topic}!`, type: 'success' })
      loadEnrollments()
    } catch (err) {
      setToast({ msg: err.response?.data?.detail || 'Enrollment failed.', type: 'error' })
    }
    setEnrollingIdx(null)
  }

  return (
    <Layout user={user} setUser={setUser} title="Courses">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Search Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-slate-800 mb-4 text-lg">Find Courses</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search topic (e.g. Python, React, Machine Learning)"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
          <button
            onClick={() => handleSearch()}
            disabled={searching}
            className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-60 text-sm font-medium flex items-center gap-2"
          >
            {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Search
          </button>
        </div>

        {searchError && <p className="mt-3 text-sm text-red-500">{searchError}</p>}

        {results.length > 0 && (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {results.map((course, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-4 hover:border-primary-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-slate-800 text-sm">{course.title}</h4>
                  <LevelBadge level={course.level} />
                </div>
                <p className="text-xs text-slate-500 mb-3 line-clamp-3">{course.description}</p>
                {course.duration && <p className="text-xs text-slate-400 mb-3">⏱ {course.duration}</p>}
                <button
                  onClick={() => handleEnroll(course, idx)}
                  disabled={enrollingIdx === idx}
                  className="w-full py-2 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-60"
                >
                  {enrollingIdx === idx ? 'Enrolling…' : 'Enroll'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Enrollments */}
      <div>
        <h3 className="font-semibold text-slate-800 text-lg mb-4">My Enrollments</h3>
        {loadingEnr ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
            <BookOpen size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No enrollments yet. Search and enroll in a course above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrollments.map((enr, i) => (
              <EnrollmentCard key={i} enr={enr} user={user} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
