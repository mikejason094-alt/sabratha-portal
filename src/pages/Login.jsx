import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { t, i18n } = useTranslation()
  const { lang, toggleLanguage } = useApp()
  const { login, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => { setLoaded(true) }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setLocalError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isAr = i18n.language === 'ar'

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-zinc-950" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Language Toggle */}
      <div className="fixed top-5 right-5 z-50">
        <button onClick={toggleLanguage}
          className="group flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-zinc-900/70 backdrop-blur-xl border border-white/10 hover:border-primary-500/40 text-zinc-400 hover:text-primary-300 text-sm font-medium transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-primary-500/10 hover:bg-zinc-900/90">
          <svg className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="tracking-wider text-xs font-semibold uppercase">{lang === 'en' ? 'العربية' : 'English'}</span>
          <span className="h-3 w-px bg-white/10" />
          <span className="text-xs font-bold text-primary-400 group-hover:text-primary-300 transition-colors">{lang === 'en' ? 'AR' : 'EN'}</span>
        </button>
      </div>
      {/* Left: Background Image Panel */}
      <div className={`hidden lg:flex lg:w-[55%] relative items-center justify-center ${loaded ? 'animate-fade-in' : 'opacity-0'}`}>
        <div className="absolute inset-0">
          <img
            src="/images/sabratha-bg.jpg"
            alt="Sabratha Roman Theatre"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/70 to-zinc-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 text-center px-12 -mt-20">
          <div className={`${loaded ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            <img
              src="/images/logo.png"
              alt="SITS Logo"
              className="w-36 h-36 mx-auto mb-8 drop-shadow-2xl brightness-110"
            />
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight drop-shadow-2xl">
              {isAr ? 'المعهد العالي للعلوم\nوالتقنية - صبراتة' : 'Higher Institute of\nSciences and Technology'}
            </h1>
            <p className="text-xl text-zinc-300 mt-4 font-light tracking-wide">
              {isAr ? 'حيث يلتقي التراث بالابتكار' : 'Where Heritage Meets Innovation'}
            </p>
            <div className="mt-12 flex items-center justify-center gap-3 text-zinc-500 text-sm">
              <div className="h-px w-12 bg-zinc-700" />
              <span>Sabratha, Libya</span>
              <div className="h-px w-12 bg-zinc-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Right: Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-950 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-900/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent-900/5 via-transparent to-transparent" />

        <div className={`w-full max-w-md relative ${loaded ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
          {/* Mobile logo (hidden on desktop) */}
          <div className="lg:hidden text-center mb-10">
            <img
              src="/images/logo.png"
              alt="SITS Logo"
              className="w-28 h-28 mx-auto mb-4 drop-shadow-xl brightness-110"
            />
            <h1 className="text-xl font-bold text-white leading-relaxed">
              {isAr ? 'المعهد العالي للعلوم والتقنية - صبراتة' : 'Higher Institute of Sciences and Technology'}
            </h1>
            <p className="text-zinc-500 mt-1 text-sm">
              {isAr ? 'بوابة الدخول الموحدة' : 'Unified Portal'}
            </p>
          </div>

          {/* Glass Card */}
          <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-8 lg:p-10">
            <h2 className="text-2xl font-semibold text-white mb-2">
              {isAr ? 'مرحباً بعودتك' : 'Welcome back'}
            </h2>
            <p className="text-zinc-400 text-sm mb-8">
              {isAr ? 'سجل دخولك للوصول إلى البوابة' : 'Sign in to access the portal'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  {isAr ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 transition-all duration-200"
                  placeholder={isAr ? 'البريد الإلكتروني' : 'Enter your email'}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 transition-all duration-200"
                  placeholder={isAr ? 'كلمة المرور' : 'Enter your password'}
                  required
                />
              </div>

              {(localError || error) && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                  {localError || error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-primary-500 hover:bg-primary-400 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isAr ? 'تسجيل الدخول' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 space-y-2">
              <p className="text-xs text-zinc-600 text-center font-medium tracking-wider uppercase">
                {isAr ? 'بيانات الدخول التجريبية' : 'Demo Credentials'}
              </p>
              <div className="text-xs text-zinc-500 text-center space-y-1.5 bg-white/[0.02] rounded-xl px-4 py-3">
                <p>
                  <span className="text-zinc-400 font-medium">{isAr ? 'طالب:' : 'Student:'}</span>
                  <span className="text-zinc-500"> islam.alhawwari@sits.edu.ly / student123</span>
                </p>
                <p>
                  <span className="text-zinc-400 font-medium">{isAr ? 'مدرس:' : 'Teacher:'}</span>
                  <span className="text-zinc-500"> ahmed.hassan@sits.edu.ly / teacher123</span>
                </p>
                <p>
                  <span className="text-zinc-400 font-medium">{isAr ? 'مشرف:' : 'Admin:'}</span>
                  <span className="text-zinc-500"> admin@sits.edu.ly / admin123</span>
                </p>
                <p className="text-zinc-600">sara.ali · khalid.omar · mohamed.ali · omar.hassan / teacher123</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-zinc-700 text-xs mt-8">
            &copy; {new Date().getFullYear()} HIST Sabratha · {isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
          </p>
        </div>
      </div>
    </div>
  )
}
