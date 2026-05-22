import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Grades from './pages/Grades'
import Courses from './pages/Courses'
import Lectures from './pages/Lectures'
import Semesters from './pages/Semesters'
import News from './pages/News'
import Loading from './components/Loading'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <Loading />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return children
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <Loading />

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/grades" element={<Grades />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/lectures" element={<Lectures />} />
        <Route path="/semesters" element={<Semesters />} />
        <Route path="/news" element={<News />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </AuthProvider>
  )
}
