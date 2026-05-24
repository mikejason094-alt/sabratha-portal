import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../../context/AppContext'
import { adminService } from '../../services/dataService'
import Loading from '../../components/Loading'

export default function Transcript() {
  const { t } = useTranslation()
  const { lang } = useApp()
  const isAr = lang === 'ar'
  const printRef = useRef()
  const [search, setSearch] = useState('')
  const [students, setStudents] = useState([])
  const [selected, setSelected] = useState(null)
  const [transcript, setTranscript] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    if (!search.trim()) return
    setSearched(true)
    setError(null)
    try {
      const users = await adminService.getUsers()
      const q = search.toLowerCase()
      const matches = users.filter(u =>
        u.role === 'student' && (
          (u.nameEn || '').toLowerCase().includes(q) ||
          (u.nameAr || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.studentId || '').toLowerCase().includes(q)
        )
      )
      setStudents(matches)
      if (matches.length === 0) setError(isAr ? 'لا يوجد طالب بهذا الاسم' : 'No student found')
    } catch (e) {
      setError(e.message)
    }
  }

  async function loadTranscript(studentId) {
    setLoading(true)
    setError(null)
    try {
      const data = await adminService.getTranscript(studentId)
      setTranscript(data)
      setSelected(studentId)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  const semGpa = (courses) => {
    const graded = (courses || []).filter(c => c.score != null)
    if (graded.length === 0) return null
    const total = graded.reduce((sum, c) => sum + c.score * c.credits, 0)
    const credits = graded.reduce((sum, c) => sum + c.credits, 0)
    return credits > 0 ? Math.round((total / credits) * 100) / 100 : null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print-hidden">
        <h1 className="page-title mb-0">{isAr ? 'كشف الدرجات' : 'Transcript'}</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4 print-hidden">{error}</div>
      )}

      {/* Search */}
      <div className="card mb-6 print-hidden">
        <div className="flex gap-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={isAr ? 'ابحث عن طالب بالاسم أو الرقم...' : 'Search student by name or ID...'}
            className="input-field flex-1" />
          <button onClick={handleSearch} className="btn-primary text-sm px-5">
            {isAr ? 'بحث' : 'Search'}
          </button>
        </div>

        {searched && students.length > 0 && (
          <div className="mt-3 space-y-1">
            {students.map(s => (
              <button key={s._id} onClick={() => loadTranscript(s.studentId)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-between
                  ${selected === s.studentId ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20' : 'bg-white/5 text-zinc-300 hover:bg-white/10 border border-transparent'}`}>
                <span>{isAr ? s.nameAr || s.nameEn : s.nameEn || s.nameAr}</span>
                <span className="text-xs text-zinc-500">{s.studentId} — {s.email}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Transcript */}
      {loading && <Loading />}

      {transcript && !loading && (
        <>
          <div className="print-hidden mb-4 flex gap-3">
            <button onClick={handlePrint} className="btn-primary text-sm px-5 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {isAr ? 'طباعة' : 'Print'}
            </button>
            <button onClick={() => { setTranscript(null); setSelected(null) }} className="btn-outline text-sm px-4">
              {isAr ? 'جديد' : 'New Search'}
            </button>
          </div>

          <div ref={printRef} className="card !bg-white !text-black !border-zinc-200 print:!shadow-none print:!rounded-none print:!p-8">
            {/* Header */}
            <div className="text-center border-b-2 border-zinc-800 pb-4 mb-6 print:border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-100 print:text-black">
                {isAr ? 'المعهد العالي للعلوم والتقنية - صبراتة' : 'Higher Institute of Sciences and Technology - Sabratha'}
              </h2>
              <h3 className="text-base font-semibold text-zinc-300 print:text-zinc-700 mt-1">
                {isAr ? 'كشف الدرجات الأكاديمي' : 'Academic Transcript'}
              </h3>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-zinc-500 print:text-zinc-600">{isAr ? 'الاسم' : 'Name'}: <span className="text-zinc-100 print:text-black font-medium">{isAr ? transcript.student.nameAr : transcript.student.nameEn}</span></p>
                <p className="text-zinc-500 print:text-zinc-600 mt-1">{isAr ? 'الرقم' : 'ID'}: <span className="text-zinc-100 print:text-black font-medium">{transcript.student.studentId}</span></p>
              </div>
              <div>
                <p className="text-zinc-500 print:text-zinc-600">{isAr ? 'القسم' : 'Department'}: <span className="text-zinc-100 print:text-black font-medium">{isAr ? transcript.student.departmentAr : transcript.student.department}</span></p>
                <p className="text-zinc-500 print:text-zinc-600 mt-1">{isAr ? 'سنة الالتحاق' : 'Enrollment'}: <span className="text-zinc-100 print:text-black font-medium">{transcript.student.enrollmentYear}</span></p>
              </div>
            </div>

            {/* Semesters */}
            {transcript.semesters.map((sem, idx) => {
              const sgpa = sem.gpa || semGpa(sem.courses)
              return (
                <div key={sem._id || idx} className="mb-6">
                  <div className="flex items-center justify-between border-b border-zinc-700 print:border-zinc-300 pb-1 mb-2">
                    <h4 className="font-semibold text-zinc-100 print:text-black text-sm">
                      {isAr ? sem.nameAr : sem.nameEn} ({sem.year})
                    </h4>
                    <span className="text-xs text-zinc-400 print:text-zinc-600">
                      {isAr ? 'المعدل' : 'GPA'}: {sgpa != null ? `${sgpa} / 100` : '-'} | {isAr ? 'الساعات' : 'Credits'}: {sem.credits}
                    </span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-700 print:border-zinc-300">
                        <th className="text-left py-1.5 text-zinc-500 print:text-zinc-600 font-medium">{isAr ? 'الرمز' : 'Code'}</th>
                        <th className="text-left py-1.5 text-zinc-500 print:text-zinc-600 font-medium">{isAr ? 'المقرر' : 'Course'}</th>
                        <th className="text-center py-1.5 text-zinc-500 print:text-zinc-600 font-medium">{isAr ? 'الساعات' : 'Credits'}</th>
                        <th className="text-center py-1.5 text-zinc-500 print:text-zinc-600 font-medium">{isAr ? 'الدرجة' : 'Score'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(sem.courses || []).map((c, ci) => (
                        <tr key={ci} className="border-b border-zinc-800/50 print:border-zinc-200">
                          <td className="py-1.5 text-zinc-400 print:text-zinc-600 font-mono">{c.code}</td>
                          <td className="py-1.5 text-zinc-100 print:text-black">{isAr ? c.nameAr : c.nameEn}</td>
                          <td className="py-1.5 text-center text-zinc-100 print:text-black">{c.credits}</td>
                          <td className="py-1.5 text-center font-semibold text-zinc-100 print:text-black">{c.score != null ? c.score : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}

            {/* Overall GPA */}
            <div className="border-t-2 border-zinc-700 print:border-zinc-800 pt-3 mt-4 flex justify-between text-sm">
              <span className="font-bold text-zinc-100 print:text-black">{isAr ? 'المعدل التراكمي' : 'Cumulative GPA'}</span>
              <span className="font-bold text-zinc-100 print:text-black text-base">{transcript.overallGpa || '-'} / 100</span>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-zinc-700 print:border-zinc-300 text-center text-xs text-zinc-500 print:text-zinc-600">
              <p>{isAr ? 'هذا الكشف معتمد من المعهد العالي للعلوم والتقنية - صبراتة' : 'This transcript is issued by the Higher Institute of Sciences and Technology - Sabratha'}</p>
              <p className="mt-1">{isAr ? 'تاريخ الطباعة' : 'Printed on'}: {new Date().toLocaleDateString(isAr ? 'ar-LY' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}