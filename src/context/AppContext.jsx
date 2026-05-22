import { createContext, useContext, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from './AuthContext'

const AppContext = createContext()

export function AppProvider({ children }) {
  const { i18n } = useTranslation()
  const { student } = useAuth()
  const [dir, setDir] = useState('ltr')
  const [lang, setLang] = useState('en')

  useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = lang
  }, [dir, lang])

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'ar' : 'en'
    setLang(newLang)
    setDir(newLang === 'ar' ? 'rtl' : 'ltr')
    i18n.changeLanguage(newLang)
  }

  return (
    <AppContext.Provider value={{ student, lang, dir, toggleLanguage }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
