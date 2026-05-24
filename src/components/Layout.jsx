import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

const studentNav = [
  { path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', key: 'dashboard' },
  { path: '/grades', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', key: 'grades' },
  { path: '/courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', key: 'courses' },
  { path: '/lectures', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', key: 'lectures' },
  { path: '/semesters', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', key: 'semesters' },
  { path: '/news', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z', key: 'news' },
]

const teacherNav = [
  { path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', key: 'dashboard' },
  { path: '/news', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z', key: 'news' },
]

const adminNav = [
  { path: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', key: 'dashboard' },
  { path: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', key: 'users' },
  { path: '/admin/news', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z', key: 'news' },
  { path: '/admin/transcript', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', key: 'transcript' },
]

export default function Layout({ children }) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { lang, toggleLanguage, dir } = useApp()
  const { user, student, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isTeacher = user?.role === 'teacher'
  const isAdmin = user?.role === 'admin'
  const navItems = isAdmin ? adminNav : (isTeacher ? teacherNav : studentNav)

  const userTitle = isAdmin ? (lang === 'ar' ? 'لوحة الإدارة' : 'Admin Portal')
    : isTeacher ? (lang === 'ar' ? 'بوابة المدرس' : 'Teacher Portal')
    : t('header.studentPortal')

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100" dir={dir}>
      {/* Header */}
      <header className="bg-zinc-900/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 rounded-xl hover:bg-white/5 transition-colors" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                </svg>
              </button>
              <div className="w-9 h-9 bg-accent-500 rounded-xl flex items-center justify-center font-bold text-zinc-950 text-base shadow-lg shadow-accent-500/20">
                {lang === 'ar' ? 'م' : 'S'}
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-base leading-tight text-zinc-100">{t('header.instituteShort')}</h1>
                <p className="text-xs text-zinc-500">{userTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={toggleLanguage} className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/70 border border-white/10 hover:border-primary-500/40 text-zinc-400 hover:text-primary-300 text-sm font-medium transition-all duration-300 hover:shadow-primary-500/10">
                <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-bold tracking-wider uppercase">{lang === 'en' ? 'AR' : 'EN'}</span>
              </button>
              <button onClick={() => { logout(); navigate('/login') }} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-zinc-500 hover:text-zinc-300" title="Logout">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width:18,height:18}}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
              {user && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary-500/20 text-primary-300 flex items-center justify-center text-xs font-bold ring-2 ring-primary-500/30">
                    {lang === 'ar'
                      ? (student?.nameAr || user?.nameAr || '?').charAt(0)
                      : (student?.nameEn || user?.nameEn || '?').charAt(0)}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-zinc-300 max-w-[120px] truncate">
                    {lang === 'ar'
                      ? (student?.nameAr || user?.nameAr || '')
                      : (student?.nameEn || user?.nameEn || '')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-zinc-900/50 backdrop-blur-xl border-r border-white/5 shadow-2xl z-40 transition-transform duration-300 overflow-y-auto`}>
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20 shadow-sm'
                      : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}`}>
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                  <span>{t(`nav.${item.key}`)}</span>
                </Link>
              )
            })}
            <div className="pt-4 mt-4 border-t border-white/5">
              <button onClick={() => { logout(); navigate('/login') }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:bg-red-500/10 hover:text-red-400 w-full transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
              </button>
            </div>
          </nav>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)] overflow-x-auto">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-zinc-900/50 backdrop-blur-xl border-t border-white/5 py-4 text-center text-sm text-zinc-600">
        <p>&copy; {new Date().getFullYear()} HIST Sabratha — {t('header.studentPortal')}</p>
      </footer>
    </div>
  )
}
