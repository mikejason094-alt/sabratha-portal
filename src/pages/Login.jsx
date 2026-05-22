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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-700 to-primary-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl font-bold text-primary-900">{isAr ? 'م' : 'S'}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{isAr ? 'معهد صبراتة للتقنية و العلوم التطبيقية' : 'Sabratha Institute of Technical Sciences'}</h1>
          <p className="text-primary-200 mt-2">{t('header.studentPortal')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
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

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              {isAr ? 'بيانات الدخول التجريبية:' : 'Demo credentials:'}
            </p>
            <p className="text-xs text-gray-500 text-center mt-1">
              islam.alhawwari@sits.edu.ly / student123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
