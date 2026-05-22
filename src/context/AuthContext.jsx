import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, setToken, getStoredToken } from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = getStoredToken()
    if (token) {
      api.get('/auth/me')
        .then((data) => {
          setUser(data.user)
          setStudent(data.student)
        })
        .catch(() => {
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    setError(null)
    try {
      const data = await api.post('/auth/login', { email, password })
      setToken(data.token)
      setUser(data.user)
      setStudent(data.student)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setStudent(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, student, loading, error, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
