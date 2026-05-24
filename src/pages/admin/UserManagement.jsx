import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../../context/AppContext'
import { useData } from '../../hooks/useData'
import { adminService } from '../../services/dataService'
import Loading from '../../components/Loading'
import { Link } from 'react-router-dom'

export default function UserManagement() {
  const { t } = useTranslation()
  const { lang } = useApp()
  const isAr = lang === 'ar'
  const { data: users, loading, setData } = useData(() => adminService.getUsers())
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [actionMsg, setActionMsg] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [resettingId, setResettingId] = useState(null)
  const [newPw, setNewPw] = useState(null)

  if (loading) return <Loading />

  const filtered = (users || []).filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (u.nameEn || '').toLowerCase().includes(q) ||
           (u.nameAr || '').toLowerCase().includes(q) ||
           (u.email || '').toLowerCase().includes(q)
  })

  async function handleResetPassword(id) {
    setResettingId(id)
    try {
      const result = await adminService.resetPassword(id)
      setNewPw(result.newPassword)
      setActionMsg({ type: 'success', text: isAr ? 'تم إعادة تعيين كلمة المرور' : 'Password reset successful' })
      setTimeout(() => setNewPw(null), 15000)
    } catch (e) {
      setActionMsg({ type: 'error', text: e.message })
    } finally {
      setResettingId(null)
    }
  }

  async function handleDelete(id) {
    try {
      await adminService.deleteUser(id)
      setData(users.map(u => u._id === id ? { ...u, isActive: false } : u))
      setActionMsg({ type: 'success', text: isAr ? 'تم إلغاء تنشيط المستخدم' : 'User deactivated' })
    } catch (e) {
      setActionMsg({ type: 'error', text: e.message })
    }
    setConfirmDelete(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">{isAr ? 'إدارة المستخدمين' : 'User Management'}</h1>
        <Link to="/admin/users/new" className="btn-primary text-sm px-4 py-2">
          + {isAr ? 'مستخدم جديد' : 'New User'}
        </Link>
      </div>

      {actionMsg && (
        <div className={`px-4 py-3 rounded-xl text-sm mb-4 border flex items-center justify-between ${
          actionMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="text-current opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}

      {newPw && (
        <div className="px-4 py-3 rounded-xl text-sm mb-4 bg-primary-500/10 text-primary-300 border border-primary-500/20">
          <strong>{isAr ? 'كلمة المرور الجديدة:' : 'New password:'}</strong> <code className="text-base font-bold text-primary-200 select-all">{newPw}</code>
          <p className="text-primary-400/70 mt-1">{isAr ? 'انسخها الآن — لن تظهر مرة أخرى' : 'Copy it now — it won\'t be shown again'}</p>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث بالاسم أو البريد الإلكتروني...' : 'Search by name or email...'}
            className="input-field flex-1" />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field w-auto">
            <option value="all">{isAr ? 'جميع الأدوار' : 'All Roles'}</option>
            <option value="student">{isAr ? 'طلاب' : 'Students'}</option>
            <option value="teacher">{isAr ? 'مدرسين' : 'Teachers'}</option>
            <option value="admin">{isAr ? 'مشرفين' : 'Admins'}</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-zinc-500">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-4 text-zinc-500 font-medium">{isAr ? 'الاسم' : 'Name'}</th>
                  <th className="text-left py-3 px-4 text-zinc-500 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-zinc-500 font-medium">{isAr ? 'الدور' : 'Role'}</th>
                  <th className="text-center py-3 px-4 text-zinc-500 font-medium">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="text-right py-3 px-4 text-zinc-500 font-medium">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u._id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-zinc-100">{isAr ? u.nameAr || u.nameEn : u.nameEn || u.nameAr}</p>
                        {u.studentId && <p className="text-xs text-zinc-500">{u.studentId}</p>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        u.role === 'student' ? 'border-green-500/20 text-green-400 bg-green-500/10'
                        : u.role === 'teacher' ? 'border-blue-500/20 text-blue-400 bg-blue-500/10'
                        : 'border-purple-500/20 text-purple-400 bg-purple-500/10'
                      }`}>{u.role}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.isActive !== false ? (
                        <span className="badge-success">{isAr ? 'نشط' : 'Active'}</span>
                      ) : (
                        <span className="badge-danger">{isAr ? 'غير نشط' : 'Inactive'}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/users/${u._id}/edit`}
                          className="text-xs px-2.5 py-1.5 bg-white/5 text-zinc-300 rounded-lg hover:bg-white/10 transition-colors">
                          {isAr ? 'تعديل' : 'Edit'}
                        </Link>
                        <button onClick={() => handleResetPassword(u._id)} disabled={resettingId === u._id}
                          className="text-xs px-2.5 py-1.5 bg-primary-500/10 text-primary-300 rounded-lg hover:bg-primary-500/20 transition-colors disabled:opacity-50">
                          {resettingId === u._id ? '...' : isAr ? 'إعادة كلمة المرور' : 'Reset PW'}
                        </button>
                        {u.role !== 'admin' && (
                          confirmDelete === u._id ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleDelete(u._id)}
                                className="text-xs px-2 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">OK</button>
                              <button onClick={() => setConfirmDelete(null)}
                                className="text-xs px-2 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg">X</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(u._id)}
                              className="text-xs px-2.5 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">
                              {isAr ? 'حذف' : 'Del'}
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}