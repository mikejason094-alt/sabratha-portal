import { Router } from 'express'
import store from '../store.js'
import { protect } from '../middleware/auth.js'

function calcSemGpa(courses) {
  if (!courses || courses.length === 0) return null
  const graded = courses.filter(c => c.score != null)
  if (graded.length === 0) return null
  const total = graded.reduce((sum, c) => sum + c.score * c.credits, 0)
  const credits = graded.reduce((sum, c) => sum + c.credits, 0)
  return credits > 0 ? Math.round((total / credits) * 100) / 100 : null
}

const router = Router()

router.get('/', protect, async (req, res, next) => {
  try {
    const semesters = await store.semesters.find({ studentId: req.user.studentId }).sort({ semesterNumber: 1 })
    const withGpa = semesters.map(s => {
      if (s.gpa == null) {
        const calculated = calcSemGpa(s.courses)
        if (calculated != null) s.gpa = calculated
      }
      return s
    })
    res.json(withGpa)
  } catch (error) {
    next(error)
  }
})

router.get('/current', protect, async (req, res, next) => {
  try {
    const current = await store.semesters.findOne({ studentId: req.user.studentId, status: 'in-progress' })
    res.json(current)
  } catch (error) {
    next(error)
  }
})

router.get('/:id', protect, async (req, res, next) => {
  try {
    const semester = await store.semesters.findOne({ _id: req.params.id, studentId: req.user.studentId })
    if (!semester) return res.status(404).json({ message: 'Semester not found' })
    res.json(semester)
  } catch (error) {
    next(error)
  }
})

export default router
