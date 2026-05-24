import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { useData } from '../hooks/useData'
import { semesterService } from '../services/dataService'
import { calculateGpa, getScoreColor } from '../utils/helpers'
import Loading from '../components/Loading'

function GpaChart({ semesters }) {
  const { lang } = useApp()
  const completed = semesters?.filter((s) => s.gpa != null) || []
  if (completed.length === 0) return null

  const maxGpa = 100
  const chartHeight = 160

  return (
    <div className="mt-6">
      <h3 className="section-title">GPA Trend</h3>
      <div className="flex items-end gap-3 h-40">
        {completed.map((sem) => {
          const height = (sem.gpa / maxGpa) * chartHeight
          return (
            <div key={sem.id} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-zinc-300">{sem.gpa.toFixed(1)}</span>
              <div className="w-full bg-primary-900/30 rounded-t relative" style={{ height: `${height}px` }}>
                <div className="absolute bottom-0 left-0 right-0 bg-primary-500 rounded-t opacity-80" style={{ height: '100%' }} />
              </div>
              <span className="text-xs text-zinc-500 text-center leading-tight">{lang === 'ar' ? sem.nameAr : sem.nameEn}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Grades() {
  const { t } = useTranslation()
  const { lang, student } = useApp()
  const isAr = lang === 'ar'
  const { data: semesters, loading } = useData(() => semesterService.getAll())
  const [activeSem, setActiveSem] = useState('all')

  if (loading) return <Loading />

  const completed = semesters?.filter((s) => s.courses.some((c) => c.score != null)) || []
  const filtered = activeSem === 'all' ? completed : completed.filter((s) => s.id === parseInt(activeSem))

  const overallGpa = calculateGpa(completed.flatMap((s) => s.courses))

  return (
    <div>
      <h1 className="page-title">{t('grades.title')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-sm text-zinc-500">{t('grades.cumulativeGpa')}</p>
          <p className="text-3xl font-bold text-primary-400 mt-1">{overallGpa || student?.gpa || '-'} <span className="text-sm text-zinc-500">/ 100</span></p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-zinc-500">{t('grades.totalCredits')}</p>
          <p className="text-3xl font-bold text-zinc-100 mt-1">{student?.totalCredits || 0}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-zinc-500">{t('grades.semester')}</p>
          <p className="text-3xl font-bold text-zinc-100 mt-1">{completed.length}</p>
        </div>
      </div>

      <div className="card mb-6">
        <GpaChart semesters={semesters} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-medium text-zinc-400">{t('grades.semester')}:</span>
        <select value={activeSem} onChange={(e) => setActiveSem(e.target.value)} className="input-field w-auto text-sm">
          <option value="all">{t('grades.overall')}</option>
          {semesters?.filter((s) => s.status === 'completed').map((s) => (
            <option key={s.id} value={s.id}>{isAr ? s.nameAr : s.nameEn}</option>
          ))}
        </select>
      </div>

      {filtered.length > 0 ? filtered.map((sem) => (
        <div key={sem.id} className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-zinc-100">{isAr ? sem.nameAr : sem.nameEn} ({sem.year})</h3>
            <span className="text-sm font-medium text-primary-400">{t('grades.gpa')}: {sem.gpa?.toFixed(1) || '-'}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2 px-2 text-zinc-500 font-medium">{t('grades.code')}</th>
                  <th className="text-left py-2 px-2 text-zinc-500 font-medium">{t('grades.course')}</th>
                  <th className="text-center py-2 px-2 text-zinc-500 font-medium">{t('grades.credits')}</th>
                  <th className="text-center py-2 px-2 text-zinc-500 font-medium">{t('grades.grade')}</th>
                </tr>
              </thead>
              <tbody>
                {sem.courses.map((course, idx) => (
                  <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="py-2.5 px-2 text-zinc-500 font-mono text-xs">{course.code}</td>
                    <td className="py-2.5 px-2 font-medium text-zinc-200">{isAr ? course.nameAr : course.nameEn}</td>
                    <td className="py-2.5 px-2 text-center text-zinc-300">{course.credits}</td>
                    <td className="py-2.5 px-2 text-center">
                      {course.score != null ? (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getScoreColor(course.score)}`}>
                          {course.score}
                        </span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )) : (
        <div className="card text-center py-12">
          <p className="text-zinc-600">{t('grades.noData')}</p>
        </div>
      )}
    </div>
  )
}
