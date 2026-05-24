import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../../context/AppContext'
import { adminService } from '../../services/dataService'
import { useParams, useNavigate } from 'react-router-dom'
import Loading from '../../components/Loading'

export default function UserForm() {
  const { id } = useParams()
  const isEdit = !!id
  const { t } = useTranslation()
  const { lang } = useApp()
  const isAr = lang === 'ar'
  const navigate = useNavigate()
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    email: '', password: '', role: 'student',
    nameEn: '', nameAr: '',
    studentId: '', department: '', departmentAr: '',
    enrollmentYear: new Date().getFullYear(), gpa: '', totalCredits: '',
  })

  useEffect(() => {
    if (isEdit) {
      adminService.getUsers().then(users => {
        const user = users.find(u => u._id === id)
        if (user) {
          setForm(f => ({
            ...f,
            email: user.email || '',
            role: user.role || 'student',
            nameEn: user.nameEn || '',
            nameAr: user.nameAr || '',
            studentId: user.studentId || '',
            department: user.department || '',
            departmentAr: user.departmentAr || '',
            enrollmentYear: user.enrollmentYear || new Date().getFullYear(),
            gpa: user.gpa ?? '',
            totalCredits: user.totalCredits ?? '',
          }))
        }
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [id, isEdit])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!isEdit && !form.password) { setError(isAr ? 'كلمة المرور مطلوبة' : 'Password is required'); return }
    setSaving(true)
    try {
      const payload = { ...form }
      if (!isEdit) payload.password = form.password
      if (payload.gpa === '' || payload.gpa === null) delete payload.gpa
      if (payload.totalCredits === '' || payload.totalCredits === null) delete payload.totalCredits
      if (isEdit) {
        await adminService.updateUser(id, payload)
      } else {
        await adminService.createUser(payload)
      }
      navigate('/admin/users')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/users')} className="text-zinc-400 hover:text-zinc-300 transition-colors p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="page-title mb-0">
          {isEdit
            ? (isAr ? 'تعديل المستخدم' : 'Edit User')
            : (isAr ? 'مستخدم جديد' : 'New User')
          }
        </h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              {isAr ? 'الدور' : 'Role'}
            </label>
            <select value={form.role} onChange={e => set('role', e.target.value)} className="input-field">
              <option value="student">{isAr ? 'طالب' : 'Student'}</option>
              <option value="teacher">{isAr ? 'مدرس' : 'Teacher'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              {isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}
            </label>
            <input type="text" value={form.nameEn} onChange={e => set('nameEn', e.target.value)}
              className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              {isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}
            </label>
            <input type="text" value={form.nameAr} onChange={e => set('nameAr', e.target.value)}
              className="input-field" />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <input type="text" value={form.password} onChange={e => set('password', e.target.value)}
                className="input-field" required={!isEdit} minLength={6} />
            </div>
          )}
          {form.role === 'student' && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  {isAr ? 'رقم الطالب' : 'Student ID'}
                </label>
                <input type="text" value={form.studentId} onChange={e => set('studentId', e.target.value)}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  {isAr ? 'القسم (إنجليزي)' : 'Department (English)'}
                </label>
                <input type="text" value={form.department} onChange={e => set('department', e.target.value)}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  {isAr ? 'القسم (عربي)' : 'Department (Arabic)'}
                </label>
                <input type="text" value={form.departmentAr} onChange={e => set('departmentAr', e.target.value)}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  {isAr ? 'سنة التسجيل' : 'Enrollment Year'}
                </label>
                <input type="number" value={form.enrollmentYear} onChange={e => set('enrollmentYear', parseInt(e.target.value) || '')}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">GPA (0-100)</label>
                <input type="number" step="0.1" min="0" max="100" value={form.gpa} onChange={e => set('gpa', e.target.value)}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  {isAr ? 'الساعات المعتمدة' : 'Total Credits'}
                </label>
                <input type="number" value={form.totalCredits} onChange={e => set('totalCredits', parseInt(e.target.value) || '')}
                  className="input-field" />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="btn-primary flex items-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? '...' : isEdit
              ? (isAr ? 'حفظ التغييرات' : 'Save Changes')
              : (isAr ? 'إنشاء المستخدم' : 'Create User')
            }
          </button>
          <button type="button" onClick={() => navigate('/admin/users')}
            className="btn-outline">
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </form>
    </div>
  )
}