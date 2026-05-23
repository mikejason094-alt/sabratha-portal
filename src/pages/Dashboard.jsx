import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useData } from '../hooks/useData'
import { semesterService, lectureService, newsService } from '../services/dataService'
import StatCard from '../components/StatCard'
import Loading from '../components/Loading'

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const { student, lang } = useApp()
  const isAr = lang === 'ar'
  const { data: semesters } = useData(() => semesterService.getAll())
  const { data: lectures } = useData(() => lectureService.getRegistered())
  const { data: news } = useData(() => newsService.getAll())

  const currentSem = semesters?.find((s) => s.status === 'in-progress')

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']
  const today = dayNames[new Date().getDay()]
  const todayLectures = lectures?.filter((l) => l.day === today) || []

  const recentNews = news?.slice(0, 3) || []

  return (
    <div>
      <h1 className="page-title">{t('dashboard.title')}</h1>

      {student && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-7 text-white mb-8 border border-primary-500/20 shadow-lg shadow-primary-900/20">
          <h2 className="text-xl font-bold">{t('dashboard.welcome', { name: isAr ? student.nameAr : student.nameEn })}</h2>
          <p className="text-primary-300/80 mt-1 text-sm">{t('dashboard.studentId')}: {student.id}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title={t('dashboard.currentGpa')}
          value={student?.gpa || '-'}
          color="green"
          icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
        <StatCard
          title={t('dashboard.completedCredits')}
          value={student?.totalCredits || 0}
          subtitle="Credit Hours"
          color="blue"
          icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
        <StatCard
          title={t('dashboard.currentSemester')}
          value={currentSem ? (isAr ? currentSem.nameAr : currentSem.nameEn) : '-'}
          color="yellow"
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
        <StatCard
          title={t('dashboard.department')}
          value={isAr ? student?.departmentAr : student?.department}
          color="primary"
          icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">{t('dashboard.upcomingLectures')}</h3>
            <Link to="/lectures" className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors">{t('dashboard.viewAll')}</Link>
          </div>
          {todayLectures.length > 0 ? (
            <div className="space-y-2">
              {todayLectures.map((lec) => (
                <div key={lec.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/[0.07] transition-colors">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-zinc-100 truncate">{isAr ? lec.courseAr : lec.courseEn}</p>
                    <p className="text-xs text-zinc-500">{lec.time} — {lec.room}</p>
                  </div>
                  <span className="badge-info text-xs">{isAr ? lec.dayAr : lec.dayEn}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-600 text-sm py-8 text-center">{t('dashboard.noUpcoming')}</p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">{t('dashboard.recentNews')}</h3>
            <Link to="/news" className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors">{t('dashboard.viewAll')}</Link>
          </div>
          {recentNews.length > 0 ? (
            <div className="space-y-2">
              {recentNews.map((article) => (
                <Link key={article.id} to="/news" className="block p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-colors">
                  <p className="font-medium text-sm text-zinc-100">{isAr ? article.titleAr : article.titleEn}</p>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{isAr ? article.summaryAr : article.summaryEn}</p>
                  <p className="text-xs text-zinc-600 mt-1">{article.date}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-zinc-600 text-sm py-8 text-center">{t('common.noData')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
