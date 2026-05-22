import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { useData } from '../hooks/useData'
import { semesterService } from '../services/dataService'
import { getStatusColor, getStatusLabel } from '../utils/helpers'
import Loading from '../components/Loading'

export default function Semesters() {
  const { t } = useTranslation()
  const { lang } = useApp()
  const isAr = lang === 'ar'
  const { data: semesters, loading } = useData(() => semesterService.getAll())

  if (loading) return <Loading />

  return (
    <div>
      <h1 className="page-title">{t('semesters.title')}</h1>

      <div className="card mb-6">
        <h2 className="section-title">{t('semesters.timeline')}</h2>
        <div className="relative">
          <div className="timeline-line" />
          <div className="space-y-0">
            {semesters?.map((sem, idx) => {
              const statusLabel = getStatusLabel(sem.status)
              const isLast = idx === semesters.length - 1
              return (
                <div key={sem.id} className="relative pl-10 pb-6 last:pb-0">
                  <div className={`absolute left-2.5 w-4 h-4 rounded-full border-2 z-10
                    ${sem.status === 'completed' ? 'bg-green-500 border-green-500'
                    : sem.status === 'in-progress' ? 'bg-yellow-400 border-yellow-400 animate-pulse'
                    : 'bg-white border-gray-300'}`} />
                  <div className="card border-0 shadow-sm bg-gray-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{isAr ? sem.nameAr : sem.nameEn}</h3>
                          <span className={`text-xs ${getStatusColor(sem.status)}`}>
                            {isAr ? statusLabel.ar : statusLabel.en}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{sem.year}</p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-bold text-gray-900">{sem.courses.length}</p>
                          <p className="text-gray-500 text-xs">{t('semesters.courses')}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-gray-900">{sem.credits}</p>
                          <p className="text-gray-500 text-xs">{t('semesters.credits')}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-primary-600">{sem.gpa?.toFixed(2) || '-'}</p>
                          <p className="text-gray-500 text-xs">{t('semesters.gpa')}</p>
                        </div>
                      </div>
                    </div>

                    {sem.courses.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex flex-wrap gap-2">
                          {sem.courses.map((c, ci) => (
                            <span key={ci} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded text-xs text-gray-700 border border-gray-200">
                              <span className="font-mono text-gray-400">{c.code}</span>
                              {isAr ? c.nameAr : c.nameEn}
                              {c.grade && <span className={`font-semibold ml-1 ${c.grade.startsWith('A') ? 'text-green-600' : c.grade.startsWith('B') ? 'text-blue-600' : 'text-yellow-600'}`}>{c.grade}</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
