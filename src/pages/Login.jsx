import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { t, i18n } = useTranslation()
  const { login, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState(null)

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-700 to-primary-900 p-4 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="w-44 h-44 mx-auto mb-6">
            <img src="/images/logo.png" alt="SITS Logo"
              className="w-full h-full object-contain drop-shadow-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-white drop-shadow-lg leading-relaxed">
            {isAr ? 'المعهد العالي للعلوم و التقنية - صبراتة' : 'Higher Institute of Sciences and Technology - Sabratha'}
          </h1>
          <p className="text-primary-200 mt-2 drop-shadow">
            {isAr ? 'بوابة الدخول الموحدة' : 'Unified Portal'}
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            {isAr ? 'تسجيل الدخول' : 'Sign In'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isAr ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder={isAr ? 'البريد الإلكتروني' : 'Enter your email'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder={isAr ? 'كلمة المرور' : 'Enter your password'}
                required
              />
            </div>

            {(localError || error) && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">
                {localError || error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isAr ? 'دخول' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
            <p className="text-xs text-gray-400 text-center font-medium">
              {isAr ? 'بيانات الدخول التجريبية:' : 'Demo credentials:'}
            </p>
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>{isAr ? 'طالب:' : 'Student:'} islam.alhawwari@sits.edu.ly / student123</p>
              <p>{isAr ? 'مدرس:' : 'Teacher:'} ahmed.hassan@sits.edu.ly / teacher123</p>
              <p className="text-gray-400">sara.ali - khalid.omar - mohamed.ali - omar.hassan / teacher123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
