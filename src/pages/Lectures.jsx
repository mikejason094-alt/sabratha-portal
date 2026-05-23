import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { useData } from '../hooks/useData'
import { lectureService } from '../services/dataService'
import Loading from '../components/Loading'

const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']

export default function Lectures() {
  const { t } = useTranslation()
  const { lang } = useApp()
  const isAr = lang === 'ar'
  const { data: lectures, loading, setData } = useData(() => lectureService.getAll())
  const [activeDay, setActiveDay] = useState(new Date().getDay())
  const [toggling, setToggling] = useState(null)

  if (loading) return <Loading />

  const dayIndex = activeDay === 0 ? 6 : activeDay - 1
  const dayKey = days[dayIndex] || 'sunday'

  const dayLectures = lectures?.filter((l) => l.day === dayKey) || []
  const registeredLectures = lectures?.filter((l) => l.registered) || []
  const uniqueRegisteredCourses = [...new Set(registeredLectures.map((l) => l.courseCode))]

  const handleToggle = async (id) => {
    setToggling(id)
    await lectureService.toggleRegistration(id)
    setData(lectures.map((l) => l.id === id ? { ...l, registered: !l.registered } : l))
    setToggling(null)
  }

  return (
    <div>
      <h1 className="page-title">{t('lectures.title')}</h1>

      {uniqueRegisteredCourses.length > 0 && (
        <div className="card mb-6">
          <h3 className="section-title">{t('lectures.myLectures')} ({uniqueRegisteredCourses.length})</h3>
          <div className="flex flex-wrap gap-2">
            {uniqueRegisteredCourses.map((code) => {
              const lec = lectures?.find((l) => l.courseCode === code)
              return (
                <span key={code} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 text-primary-400 rounded-full text-sm font-medium border border-primary-500/20">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {isAr ? lec?.courseAr : lec?.courseEn}
                </span>
              )
            })}
          </div>
        </div>
      )}

      <div className="card mb-6">
        <h3 className="section-title">{t('lectures.weekly')}</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {days.map((day, idx) => {
            const dayLabelsEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
            const dayLabelsAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
            const isActive = day === dayKey
            return (
              <button
                key={day}
                onClick={() => setActiveDay(idx + 1)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive ? 'bg-primary-500 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-300'}`}>
                {isAr ? dayLabelsAr[idx] : dayLabelsEn[idx]}
              </button>
            )
          })}
        </div>

        {dayLectures.length > 0 ? (
          <div className="space-y-3">
            {dayLectures.map((lec) => (
              <div key={lec.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary-500/20 transition-colors">
                <div className="w-12 h-12 bg-accent-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-100">{isAr ? lec.courseAr : lec.courseEn}</p>
                  <p className="text-sm text-zinc-500">{lec.time} — {t('lectures.room')}: {lec.room}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{isAr ? lec.instructorAr : lec.instructorEn}</p>
                </div>
                <button
                  onClick={() => handleToggle(lec.id)}
                  disabled={toggling === lec.id}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${lec.registered
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                      : 'bg-primary-500/10 text-primary-300 border border-primary-500/20 hover:bg-primary-500/20'}`}>
                  {toggling === lec.id ? (
                    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : lec.registered ? t('lectures.registered') : t('lectures.register')}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-zinc-500">{t('lectures.noLectures')}</p>
        )}
      </div>
    </div>
  )
}
