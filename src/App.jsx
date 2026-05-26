import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Loading from './components/Loading'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Grades = lazy(() => import('./pages/Grades'))
const Courses = lazy(() => import('./pages/Courses'))
const Lectures = lazy(() => import('./pages/Lectures'))
const Semesters = lazy(() => import('./pages/Semesters'))
const News = lazy(() => import('./pages/News'))
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'))
const TeacherCourseDetail = lazy(() => import('./pages/teacher/TeacherCourseDetail'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const UserManagement = lazy(() => import('./pages/admin/UserManagement'))
const UserForm = lazy(() => import('./pages/admin/UserForm'))
const NewsManagement = lazy(() => import('./pages/admin/NewsManagement'))
const Transcript = lazy(() => import('./pages/admin/Transcript'))

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
      <Route path="/admin/transcript" element={<Transcript />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

function AppRoutes() {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) return <Loading />

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
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
