import { useTranslation } from 'react-i18next'
import { useApp } from '../../context/AppContext'
import { useData } from '../../hooks/useData'
import { adminService } from '../../services/dataService'
import Loading from '../../components/Loading'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { lang } = useApp()
  const isAr = lang === 'ar'
  const { data: stats, loading } = useData(() => adminService.getStats())
  const { data: users } = useData(() => adminService.getUsers())

  if (loading) return <Loading />

  const recent = users?.filter(u => u.role !== 'admin').slice(0, 5) || []

  const cards = [
    { label: isAr ? 'إجمالي المستخدمين' : 'Total Users', value: stats?.totalUsers || 0, color: 'from-primary-500 to-primary-700' },
    { label: isAr ? 'الطلاب' : 'Students', value: stats?.totalStudents || 0, color: 'from-green-500 to-green-700' },
    { label: isAr ? 'المدرسين' : 'Teachers', value: stats?.totalTeachers || 0, color: 'from-accent-500 to-yellow-600' },
    { label: isAr ? 'المسجلين حالياً' : 'Active Users', value: stats?.activeUsers || 0, color: 'from-blue-500 to-blue-700' },
  ]

  return (
    <div>
      <h1 className="page-title">{isAr ? 'لوحة التحكم' : 'Admin Dashboard'}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <div key={i} className={`card bg-gradient-to-br ${card.color} text-white border-0`}>
            <p className="text-white/70 text-sm">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">{isAr ? 'أحدث المستخدمين' : 'Recent Users'}</h2>
          <Link to="/admin/users" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
            {isAr ? 'عرض الكل' : 'View All'}
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-zinc-500 text-sm py-8 text-center">{t('common.noData')}</p>
        ) : (
          <div className="space-y-2">
            {recent.map(u => (
              <div key={u._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-300">
                    {(isAr ? u.nameAr : u.nameEn)?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{isAr ? u.nameAr : u.nameEn}</p>
                    <p className="text-xs text-zinc-500">{u.email}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  u.role === 'student' ? 'border-green-500/20 text-green-400 bg-green-500/10'
                  : u.role === 'teacher' ? 'border-blue-500/20 text-blue-400 bg-blue-500/10'
                  : 'border-purple-500/20 text-purple-400 bg-purple-500/10'
                }`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}