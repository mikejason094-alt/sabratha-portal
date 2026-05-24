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
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherCourseDetail from './pages/teacher/TeacherCourseDetail'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import UserForm from './pages/admin/UserForm'
import NewsManagement from './pages/admin/NewsManagement'
import Loading from './components/Loading'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <Loading />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return children
}

function StudentRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/grades" element={<Grades />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/lectures" element={<Lectures />} />
      <Route path="/semesters" element={<Semesters />} />
      <Route path="/news" element={<News />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function TeacherRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TeacherDashboard />} />
      <Route path="/courses/:id" element={<TeacherCourseDetail />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<UserManagement />} />
      <Route path="/admin/users/new" element={<UserForm />} />
      <Route path="/admin/users/:id/edit" element={<UserForm />} />
      <Route path="/admin/news" element={<NewsManagement />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

function AppRoutes() {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) return <Loading />

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  const isTeacher = user?.role === 'teacher'
  const isAdmin = user?.role === 'admin'

  if (isAdmin) {
    return (
      <Layout>
        <AdminRoutes />
      </Layout>
    )
  }

  return (
    <Layout>
      {isTeacher ? <TeacherRoutes /> : <StudentRoutes />}
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
