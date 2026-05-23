import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { useData } from '../hooks/useData'
import { courseService } from '../services/dataService'
import Loading from '../components/Loading'

export default function Courses() {
  const { t } = useTranslation()
  const { lang } = useApp()
  const isAr = lang === 'ar'
  const { data: courses, loading, setData } = useData(() => courseService.getAll())
  const [search, setSearch] = useState('')
  const [filterSem, setFilterSem] = useState('all')
  const [toggling, setToggling] = useState(null)

  if (loading) return <Loading />

  const semesters = [...new Set(courses?.map((c) => c.semester) || [])].sort()

  const filtered = (courses || []).filter((c) => {
    const matchSearch = isAr
      ? c.nameAr.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
      : c.nameEn.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
    const matchSem = filterSem === 'all' || c.semester === parseInt(filterSem)
    return matchSearch && matchSem
  })

  const myCourses = courses?.filter((c) => c.registered) || []

  const handleToggle = async (id) => {
    setToggling(id)
    await courseService.toggleRegistration(id)
    setData(courses.map((c) => c.id === id ? { ...c, registered: !c.registered } : c))
    setToggling(null)
  }

  return (
    <div>
      <h1 className="page-title">{t('courses.title')}</h1>

      {myCourses.length > 0 && (
        <div className="card mb-6">
          <h3 className="section-title">{t('courses.myCourses')} ({myCourses.length})</h3>
          <div className="flex flex-wrap gap-2">
            {myCourses.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-full text-sm font-medium border border-green-500/20">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {isAr ? c.nameAr : c.nameEn}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:w-auto">
            <input
              type="text"
              placeholder={t('courses.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">{t('courses.filter')}:</span>
            <select value={filterSem} onChange={(e) => setFilterSem(e.target.value)} className="input-field w-auto text-sm">
              <option value="all">{t('courses.all')}</option>
              {semesters.map((s) => (
                <option key={s} value={s}>{isAr ? `الفصل ${s}` : `Semester ${s}`}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((course) => (
            <div key={course.id} className={`card flex flex-col ${course.registered ? 'border-green-500/20 bg-green-500/5' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{course.code}</span>
                    <span className="text-xs text-zinc-500">{course.credits} {t('courses.credits')}</span>
                  </div>
                  <h3 className="font-semibold text-zinc-100 mt-1">{isAr ? course.nameAr : course.nameEn}</h3>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-zinc-400 flex-1">
                <p><span className="text-zinc-500">{t('courses.instructor')}:</span> {isAr ? course.instructorAr : course.instructorEn}</p>
                <p><span className="text-zinc-500">{t('courses.schedule')}:</span> {isAr ? course.scheduleAr : course.scheduleEn}</p>
                <p><span className="text-zinc-500">{t('courses.room')}:</span> {course.room}</p>
                <p>
                  <span className="text-zinc-500">{t('courses.capacity')}:</span> {course.enrolled}/{course.capacity}
                  <span className="ml-2 text-xs">
                    {course.enrolled >= course.capacity ? <span className="badge-danger">{t('courses.full')}</span>
                    : `${course.capacity - course.enrolled} ${t('courses.capacity').toLowerCase()}`}
                  </span>
                </p>
              </div>
              <button
                onClick={() => handleToggle(course.id)}
                disabled={toggling === course.id}
                className={`mt-4 w-full py-2 rounded-lg text-sm font-medium transition-colors
                  ${course.registered
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                    : 'btn-primary'}`}>
                {toggling === course.id ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : course.registered ? t('courses.registered') : t('courses.register')}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-zinc-500">{t('courses.noCourses')}</p>
        </div>
      )}
    </div>
  )
}
