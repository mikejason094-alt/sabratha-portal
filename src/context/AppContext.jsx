import { createContext, useContext, useEffect } from 'react'
import { useAuth } from './AuthContext'

const AppContext = createContext()

export function AppProvider({ children }) {
  const { student } = useAuth()

  useEffect(() => {
    document.documentElement.dir = 'rtl'
    document.documentElement.lang = 'ar'
  }, [])

  return (
    <AppContext.Provider value={{ student }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
