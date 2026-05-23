import { Router } from 'express'
import store from '../store.js'
import { protect } from '../middleware/auth.js'

const router = Router()

// All teacher routes require auth
router.use(protect)

// Verify teacher role
router.use((req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Teacher access required' })
  }
  next()
})

// Get my courses (courses I teach)
router.get('/courses', async (req, res, next) => {
  try {
    const courses = await store.courses.find({ teacherId: req.user._id, isActive: true }).sort({ semester: 1, code: 1 })
    res.json(courses)
  } catch (error) { next(error) }
})

// Get enrolled students for a course
router.get('/courses/:id/students', async (req, res, next) => {
  try {
    const course = await store.courses.findOne({ _id: req.params.id, teacherId: req.user._id })
    if (!course) return res.status(404).json({ message: 'Course not found' })

    const enrollments = await store.enrollments.find({ courseId: req.params.id })
    const studentIds = enrollments.map(e => e.studentId)
    const students = []
    for (const sid of studentIds) {
      const s = await store.students.findOne({ studentId: sid })
      if (s) students.push(s)
    }
    res.json({ course, students })
  } catch (error) { next(error) }
})

// Get grades for a course
router.get('/courses/:id/grades', async (req, res, next) => {
  try {
    const course = await store.courses.findOne({ _id: req.params.id, teacherId: req.user._id })
    if (!course) return res.status(404).json({ message: 'Course not found' })

    const grades = await store.courseGrades.find({ courseId: req.params.id })
    // Enrich with student names
    const enriched = []
    for (const g of grades) {
      const s = await store.students.findOne({ studentId: g.studentId })
      enriched.push({ ...g, studentNameEn: s?.nameEn, studentNameAr: s?.nameAr })
    }
    res.json(enriched)
  } catch (error) { next(error) }
})

// Update a student's grade
router.put('/courses/:courseId/grades/:studentId', async (req, res, next) => {
  try {
    const course = await store.courses.findOne({ _id: req.params.courseId, teacherId: req.user._id })
    if (!course) return res.status(404).json({ message: 'Course not found' })

    const { grade, points } = req.body
    if (!grade || points === undefined) {
      return res.status(400).json({ message: 'Grade and points are required' })
    }

    const existing = await store.courseGrades.findOne({ courseId: req.params.courseId, studentId: req.params.studentId })
    if (existing) {
      existing.grade = grade
      existing.points = points
      existing.updatedBy = req.user._id
      await store.courseGrades.saveDoc(existing)
      res.json(existing)
    } else {
      const created = await store.courseGrades.create({
        courseId: req.params.courseId,
        studentId: req.params.studentId,
        semesterNumber: course.semester,
        grade, points,
        updatedBy: req.user._id,
      })
      res.json(created)
    }
  } catch (error) { next(error) }
})

// Get exams for a course
router.get('/courses/:id/exams', async (req, res, next) => {
  try {
    const course = await store.courses.findOne({ _id: req.params.id, teacherId: req.user._id })
    if (!course) return res.status(404).json({ message: 'Course not found' })

    const exams = await store.exams.find({ courseId: req.params.id }).sort({ date: 1 })
    res.json(exams)
  } catch (error) { next(error) }
})

// Create exam
router.post('/courses/:id/exams', async (req, res, next) => {
  try {
    const course = await store.courses.findOne({ _id: req.params.id, teacherId: req.user._id })
    if (!course) return res.status(404).json({ message: 'Course not found' })

    const { titleEn, titleAr, date, time, duration, room, maxScore, type } = req.body
    if (!titleEn || !date) return res.status(400).json({ message: 'Title and date are required' })

    const exam = await store.exams.create({
      courseId: req.params.id,
      titleEn, titleAr: titleAr || titleEn,
      date, time, duration: duration || 60,
      room, maxScore: maxScore || 100,
      type: type || 'exam',
      createdBy: req.user._id,
    })
    res.status(201).json(exam)
  } catch (error) { next(error) }
})

// Update exam
router.put('/exams/:id', async (req, res, next) => {
  try {
    const exam = await store.exams.findOne({ _id: req.params.id })
    if (!exam) return res.status(404).json({ message: 'Exam not found' })

    const course = await store.courses.findOne({ _id: exam.courseId, teacherId: req.user._id })
    if (!course) return res.status(403).json({ message: 'Not authorized' })

    Object.assign(exam, req.body, { updatedAt: new Date().toISOString() })
    await store.exams.saveDoc(exam)
    res.json(exam)
  } catch (error) { next(error) }
})

// Delete exam
router.delete('/exams/:id', async (req, res, next) => {
  try {
    const exam = await store.exams.findOne({ _id: req.params.id })
    if (!exam) return res.status(404).json({ message: 'Exam not found' })

    const course = await store.courses.findOne({ _id: exam.courseId, teacherId: req.user._id })
    if (!course) return res.status(403).json({ message: 'Not authorized' })

    await store.exams.deleteOne({ _id: req.params.id })
    res.json({ message: 'Exam deleted' })
  } catch (error) { next(error) }
})

export default router
