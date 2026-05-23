import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApp } from '../../context/AppContext'
import { teacherService } from '../../services/dataService'
import Loading from '../../components/Loading'

const GRADE_OPTIONS = [
  { grade: 'A+', points: 4.0 }, { grade: 'A', points: 4.0 },
  { grade: 'A-', points: 3.7 }, { grade: 'B+', points: 3.3 },
  { grade: 'B', points: 3.0 }, { grade: 'B-', points: 2.7 },
  { grade: 'C+', points: 2.3 }, { grade: 'C', points: 2.0 },
  { grade: 'C-', points: 1.7 }, { grade: 'D+', points: 1.3 },
  { grade: 'D', points: 1.0 }, { grade: 'F', points: 0.0 },
]

export default function TeacherCourseDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [course, setCourse] = useState(null)
  const [students, setStudents] = useState([])
  const [grades, setGrades] = useState([])
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('students')
  const [editingStudent, setEditingStudent] = useState(null)
  const [gradeForm, setGradeForm] = useState({ grade: '', points: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Exam form
  const [showExamForm, setShowExamForm] = useState(false)
  const [examForm, setExamForm] = useState({ titleEn: '', titleAr: '', date: '', time: '', duration: 60, room: '', maxScore: 100, type: 'exam' })
  const [examSaving, setExamSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    try {
      const [studentsData, gradesData, examsData] = await Promise.all([
        teacherService.getCourseStudents(id),
        teacherService.getCourseGrades(id),
        teacherService.getCourseExams(id),
      ])
      setCourse(studentsData.course)
      setStudents(studentsData.students)
      setGrades(gradesData)
      setExams(examsData)
    } catch (e) {
      setMessage({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  function getGrade(studentId) {
    return grades.find(g => g.studentId === studentId)
  }

  function startEdit(student) {
    const existing = getGrade(student.studentId)
    setEditingStudent(student)
    setGradeForm({ grade: existing?.grade || '', points: existing?.points ?? '' })
  }

  async function saveGrade() {
    if (!gradeForm.grade) return
    const opt = GRADE_OPTIONS.find(g => g.grade === gradeForm.grade)
    const points = opt ? opt.points : parseFloat(gradeForm.points)
    if (isNaN(points)) return

    setSaving(true)
    try {
      const result = await teacherService.updateGrade(id, editingStudent.studentId, { grade: gradeForm.grade, points })
      await loadData()
      setEditingStudent(null)
      setMessage({ type: 'success', text: isAr ? 'تم حفظ الدرجة' : 'Grade saved' })
      setTimeout(() => setMessage(null), 3000)
    } catch (e) {
      setMessage({ type: 'error', text: e.message })
    } finally {
      setSaving(false)
    }
  }

  async function createExam(e) {
    e.preventDefault()
    setExamSaving(true)
    try {
      await teacherService.createExam(id, examForm)
      setShowExamForm(false)
      setExamForm({ titleEn: '', titleAr: '', date: '', time: '', duration: 60, room: '', maxScore: 100, type: 'exam' })
      const examsData = await teacherService.getCourseExams(id)
      setExams(examsData)
      setMessage({ type: 'success', text: isAr ? 'تم إنشاء الامتحان' : 'Exam created' })
      setTimeout(() => setMessage(null), 3000)
    } catch (e) {
      setMessage({ type: 'error', text: e.message })
    } finally {
      setExamSaving(false)
    }
  }

  async function deleteExam(examId) {
    if (!confirm(isAr ? 'هل أنت متأكد؟' : 'Are you sure?')) return
    try {
      await teacherService.deleteExam(examId)
      setExams(exams.filter(e => e._id !== examId))
    } catch (e) {
      setMessage({ type: 'error', text: e.message })
    }
  }

  if (loading) return <Loading />
  if (!course) return <p className="text-zinc-500 text-center py-12">{t('common.noData')}</p>

  const tabs = [
    { id: 'students', label: isAr ? 'الطلاب' : 'Students' },
    { id: 'exams', label: isAr ? 'الامتحانات' : 'Exams' },
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link to="/" className="text-primary-400 hover:text-primary-300 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="page-title mb-0">{isAr ? course.nameAr : course.nameEn}</h1>
          <p className="text-sm text-zinc-500">{course.code} — {course.scheduleEn} — {course.room}</p>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-2.5 rounded-xl text-sm mb-4 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-1 mb-4 border-b border-white/5">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary-400 text-primary-300' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'students' && (
        <div className="card">
          <h2 className="section-title">{isAr ? 'الطلاب المسجلون' : 'Enrolled Students'} ({students.length})</h2>
          {students.length === 0 ? (
            <p className="text-zinc-500 text-sm py-8 text-center">{t('common.noData')}</p>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left">
                    <th className="pb-2 font-medium text-zinc-500">{isAr ? 'الاسم' : 'Name'}</th>
                    <th className="pb-2 font-medium text-zinc-500">{isAr ? 'المعرف' : 'ID'}</th>
                    <th className="pb-2 font-medium text-zinc-500">{isAr ? 'الدرجة' : 'Grade'}</th>
                    <th className="pb-2 font-medium text-zinc-500">{isAr ? 'النقاط' : 'Points'}</th>
                    <th className="pb-2 font-medium text-zinc-500">{isAr ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const g = getGrade(student.studentId)
                    return (
                      <tr key={student.studentId} className="border-b border-white/5">
                        <td className="py-2 text-zinc-100">{isAr ? student.nameAr : student.nameEn}</td>
                        <td className="py-2 text-zinc-500">{student.studentId}</td>
                        <td className="py-2">
                          {editingStudent?.studentId === student.studentId ? (
                            <select value={gradeForm.grade}
                              onChange={e => {
                                const opt = GRADE_OPTIONS.find(g => g.grade === e.target.value)
                                setGradeForm({ grade: e.target.value, points: opt ? opt.points : '' })
                              }}
                              className="input-field text-sm py-1 px-2 w-20">
                              <option value="">--</option>
                              {GRADE_OPTIONS.map(o => <option key={o.grade} value={o.grade}>{o.grade}</option>)}
                            </select>
                          ) : (
                            <span className={g?.grade ? 'font-medium text-zinc-200' : 'text-zinc-600'}>{g?.grade || '-'}</span>
                          )}
                        </td>
                        <td className="py-2 text-zinc-400">{g?.points ?? '-'}</td>
                        <td className="py-2">
                          {editingStudent?.studentId === student.studentId ? (
                            <div className="flex gap-1">
                              <button onClick={saveGrade} disabled={saving}
                                className="text-xs px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600">
                                {saving ? '...' : isAr ? 'حفظ' : 'Save'}
                              </button>
                              <button onClick={() => setEditingStudent(null)}
                                className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700 transition-colors">
                                {isAr ? 'إلغاء' : 'Cancel'}
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => startEdit(student)}
                              className="text-xs px-2 py-1 bg-white/5 text-zinc-400 rounded hover:bg-white/10 transition-colors">
                              {isAr ? 'تعديل' : 'Edit'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'exams' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">{isAr ? 'الامتحانات' : 'Exams'}</h2>
            <button onClick={() => setShowExamForm(!showExamForm)}
              className="btn-primary text-sm py-1.5 px-3">
              {isAr ? 'إضافة امتحان' : 'Add Exam'}
            </button>
          </div>

          {showExamForm && (
            <form onSubmit={createExam} className="card mb-4 p-4 border border-primary-500/20 bg-primary-500/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">{isAr ? 'العنوان (إنجليزي)' : 'Title (English)'}</label>
                  <input value={examForm.titleEn} onChange={e => setExamForm({ ...examForm, titleEn: e.target.value })} className="input-field text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">{isAr ? 'العنوان (عربي)' : 'Title (Arabic)'}</label>
                  <input value={examForm.titleAr} onChange={e => setExamForm({ ...examForm, titleAr: e.target.value })} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">{isAr ? 'التاريخ' : 'Date'}</label>
                  <input type="date" value={examForm.date} onChange={e => setExamForm({ ...examForm, date: e.target.value })} className="input-field text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">{isAr ? 'الوقت' : 'Time'}</label>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">{isAr ? 'المدة (دقائق)' : 'Duration (min)'}</label>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">{isAr ? 'القاعة' : 'Room'}</label>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">{isAr ? 'الدرجة القصوى' : 'Max Score'}</label>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">{isAr ? 'النوع' : 'Type'}</label>
                  <select value={examForm.type} onChange={e => setExamForm({ ...examForm, type: e.target.value })} className="input-field text-sm">
                    <option value="quiz">{isAr ? 'اختبار قصير' : 'Quiz'}</option>
                    <option value="midterm">{isAr ? 'منتصف الفصل' : 'Midterm'}</option>
                    <option value="final">{isAr ? 'نهائي' : 'Final'}</option>
                    <option value="exam">{isAr ? 'امتحان' : 'Exam'}</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button type="submit" disabled={examSaving} className="btn-primary text-sm py-1.5 px-4">
                  {examSaving ? '...' : isAr ? 'إنشاء' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowExamForm(false)} className="text-sm py-1.5 px-4 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-700 transition-colors">
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          )}

          {exams.length === 0 && !showExamForm ? (
            <p className="text-zinc-500 text-sm py-8 text-center">{t('common.noData')}</p>
          ) : (
            <div className="space-y-3">
              {exams.map(exam => (
                <div key={exam._id} className="card flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-zinc-100">{isAr ? exam.titleAr || exam.titleEn : exam.titleEn}</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      {exam.date} {exam.time ? `- ${exam.time}` : ''} | {exam.duration}{isAr ? ' دقيقة' : ' min'} | {exam.room || '-'} | {isAr ? 'الدرجة:' : 'Score:'} {exam.maxScore}
                      <span className="ml-2 px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">{exam.type}</span>
                    </p>
                  </div>
                  <button onClick={() => deleteExam(exam._id)} className="text-red-500 hover:text-red-600 p-1" title={isAr ? 'حذف' : 'Delete'}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
