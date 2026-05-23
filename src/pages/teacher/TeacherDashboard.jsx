import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useData } from '../../hooks/useData'
import { teacherService } from '../../services/dataService'
import Loading from '../../components/Loading'

export default function TeacherDashboard() {
  const { t, i18n } = useTranslation()
  const { lang } = useApp()
  const isAr = lang === 'ar'
  const { data: courses, loading } = useData(() => teacherService.getCourses())

  if (loading) return <Loading />

  return (
    <div>
      <h1 className="page-title">{isAr ? 'لوحة التحكم' : 'Teacher Dashboard'}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white">
          <p className="text-primary-200 text-sm">{isAr ? 'المقررات التي تدرسها' : 'My Courses'}</p>
          <p className="text-3xl font-bold mt-1">{courses?.length || 0}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-500 to-green-700 text-white">
          <p className="text-green-200 text-sm">{isAr ? 'إجمالي الطلاب المسجلين' : 'Total Enrolled Students'}</p>
          <p className="text-3xl font-bold mt-1">
            {courses?.reduce((sum, c) => sum + (c.enrolled || 0), 0) || 0}
          </p>
        </div>
        <div className="card bg-gradient-to-br from-accent-500 to-yellow-600 text-white">
          <p className="text-yellow-200 text-sm">{isAr ? 'الامتحانات القادمة' : 'Upcoming Exams'}</p>
          <p className="text-3xl font-bold mt-1">-</p>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">{isAr ? 'مقرراتي الدراسية' : 'My Courses'}</h2>
        {(!courses || courses.length === 0) ? (
          <p className="text-zinc-500 text-sm py-8 text-center">{t('common.noData')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {courses.map((course) => (
              <Link key={course._id} to={`/courses/${course._id}`}
                className="block p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary-500/20 hover:bg-white/[0.07] transition-all">
                <h3 className="font-semibold text-zinc-100">{isAr ? course.nameAr : course.nameEn}</h3>
                <p className="text-sm text-zinc-500 mt-1">{course.code}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                  <span>{isAr ? 'السعة:' : 'Capacity:'} {course.enrolled}/{course.capacity}</span>
                  <span>{course.scheduleEn}</span>
                  <span>{course.room}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
