import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../../context/AppContext'
import { useData } from '../../hooks/useData'
import { adminService } from '../../services/dataService'
import Loading from '../../components/Loading'

export default function NewsManagement() {
  const { t } = useTranslation()
  const { lang } = useApp()
  const isAr = lang === 'ar'
  const { data: articles, loading, setData } = useData(() => adminService.getAllNews())
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [form, setForm] = useState({
    titleEn: '', titleAr: '', summaryEn: '', summaryAr: '',
    contentEn: '', contentAr: '', category: 'announcement',
    date: new Date().toISOString().split('T')[0], author: 'Admin',
  })

  function resetForm() {
    setForm({
      titleEn: '', titleAr: '', summaryEn: '', summaryAr: '',
      contentEn: '', contentAr: '', category: 'announcement',
      date: new Date().toISOString().split('T')[0], author: 'Admin',
    })
    setEditing(null)
    setShowForm(false)
  }

  function startEdit(article) {
    setForm({
      titleEn: article.titleEn || '',
      titleAr: article.titleAr || '',
      summaryEn: article.summaryEn || '',
      summaryAr: article.summaryAr || '',
      contentEn: article.contentEn || '',
      contentAr: article.contentAr || '',
      category: article.category || 'announcement',
      date: (article.date || '').split('T')[0] || new Date().toISOString().split('T')[0],
      author: article.author || 'Admin',
    })
    setEditing(article._id)
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      if (editing) {
        const updated = await adminService.updateNews(editing, form)
        setData(articles.map(a => a._id === editing ? updated : a))
      } else {
        const created = await adminService.createNews(form)
        setData([created, ...articles])
      }
      resetForm()
      setMessage({ type: 'success', text: isAr ? 'تم الحفظ' : 'Saved' })
      setTimeout(() => setMessage(null), 3000)
    } catch (e) {
      setMessage({ type: 'error', text: e.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm(isAr ? 'هل أنت متأكد؟' : 'Are you sure?')) return
    try {
      await adminService.deleteNews(id)
      setData(articles.filter(a => a._id !== id))
      setMessage({ type: 'success', text: isAr ? 'تم الحذف' : 'Deleted' })
      setTimeout(() => setMessage(null), 3000)
    } catch (e) {
      setMessage({ type: 'error', text: e.message })
    }
  }

  if (loading) return <Loading />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">{isAr ? 'إدارة الأخبار' : 'News Management'}</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-4 py-2">
            + {isAr ? 'خبر جديد' : 'New Article'}
          </button>
        )}
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm mb-4 border ${
          message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>{message.text}</div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 border border-primary-500/20 bg-primary-500/5">
          <h2 className="section-title">{editing ? (isAr ? 'تعديل الخبر' : 'Edit Article') : (isAr ? 'خبر جديد' : 'New Article')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">{isAr ? 'العنوان (إنجليزي)' : 'Title (English)'} *</label>
              <input value={form.titleEn} onChange={e => setForm({...form, titleEn: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">{isAr ? 'العنوان (عربي)' : 'Title (Arabic)'}</label>
              <input value={form.titleAr} onChange={e => setForm({...form, titleAr: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">{isAr ? 'ملخص (إنجليزي)' : 'Summary (English)'}</label>
              <textarea value={form.summaryEn} onChange={e => setForm({...form, summaryEn: e.target.value})} className="input-field" rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">{isAr ? 'ملخص (عربي)' : 'Summary (Arabic)'}</label>
              <textarea value={form.summaryAr} onChange={e => setForm({...form, summaryAr: e.target.value})} className="input-field" rows={2} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">{isAr ? 'المحتوى (إنجليزي)' : 'Content (English)'}</label>
              <textarea value={form.contentEn} onChange={e => setForm({...form, contentEn: e.target.value})} className="input-field" rows={3} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">{isAr ? 'المحتوى (عربي)' : 'Content (Arabic)'}</label>
              <textarea value={form.contentAr} onChange={e => setForm({...form, contentAr: e.target.value})} className="input-field" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">{isAr ? 'التصنيف' : 'Category'}</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field">
                <option value="announcement">{isAr ? 'إعلان' : 'Announcement'}</option>
                <option value="event">{isAr ? 'فعالية' : 'Event'}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">{isAr ? 'التاريخ' : 'Date'}</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">{isAr ? 'الناشر' : 'Author'}</label>
              <input value={form.author} onChange={e => setForm({...form, author: e.target.value})} className="input-field" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary text-sm py-2 px-4">
              {saving ? '...' : editing ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'نشر' : 'Publish')}
            </button>
            <button type="button" onClick={resetForm} className="btn-outline text-sm py-2 px-4">
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      )}

      {articles.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-zinc-500">{isAr ? 'لا توجد أخبار' : 'No news articles'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map(a => (
            <div key={a._id} className="card flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    a.category === 'event' ? 'border-yellow-500/20 text-yellow-400 bg-yellow-500/10' : 'border-blue-500/20 text-blue-400 bg-blue-500/10'
                  }`}>
                    {a.category === 'event' ? (isAr ? 'فعالية' : 'Event') : (isAr ? 'إعلان' : 'Announcement')}
                  </span>
                  <span className="text-xs text-zinc-500">{a.date ? a.date.split('T')[0] : ''}</span>
                </div>
                <h3 className="font-medium text-zinc-100 truncate">{isAr ? (a.titleAr || a.titleEn) : a.titleEn}</h3>
                <p className="text-xs text-zinc-500 mt-0.5 truncate">{isAr ? (a.summaryAr || a.summaryEn) : a.summaryEn}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => startEdit(a)} className="text-xs px-2.5 py-1.5 bg-white/5 text-zinc-300 rounded-lg hover:bg-white/10 transition-colors">
                  {isAr ? 'تعديل' : 'Edit'}
                </button>
                <button onClick={() => handleDelete(a._id)} className="text-xs px-2.5 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">
                  {isAr ? 'حذف' : 'Del'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}