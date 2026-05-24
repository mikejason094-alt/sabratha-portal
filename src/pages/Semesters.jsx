import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { useData } from '../hooks/useData'
import { semesterService } from '../services/dataService'
import { getStatusColor, getStatusLabel, getScoreColor } from '../utils/helpers'
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
                    : 'bg-zinc-800 border-zinc-700'}`} />
                  <div className="card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-zinc-100">{isAr ? sem.nameAr : sem.nameEn}</h3>
                          <span className={`text-xs ${getStatusColor(sem.status)}`}>
                            {isAr ? statusLabel.ar : statusLabel.en}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500 mt-0.5">{sem.year}</p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-bold text-zinc-100">{sem.courses.length}</p>
                          <p className="text-zinc-500 text-xs">{t('semesters.courses')}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-zinc-100">{sem.credits}</p>
                          <p className="text-zinc-500 text-xs">{t('semesters.credits')}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-primary-400">{sem.gpa != null ? `${sem.gpa} / 100` : '-'}</p>
                          <p className="text-zinc-500 text-xs">{t('semesters.gpa')}</p>
                        </div>
                      </div>
                    </div>

                    {sem.courses.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <div className="flex flex-wrap gap-2">
                          {sem.courses.map((c, ci) => (
                            <span key={ci} className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 border border-white/5">
                              <span className="font-mono text-zinc-500">{c.code}</span>
                              {isAr ? c.nameAr : c.nameEn}
                              {c.score != null && <span className={`font-semibold ml-1 px-1 rounded ${getScoreColor(c.score)}`}>{c.score}</span>}
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
