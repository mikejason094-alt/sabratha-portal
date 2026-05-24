import { Router } from 'express'
import store from '../store.js'
import { protect } from '../middleware/auth.js'

function calcGpa(semesters) {
  const allCourses = semesters.flatMap(s => s.courses || [])
  const graded = allCourses.filter(c => c.score != null)
  if (graded.length === 0) return null
  const total = graded.reduce((sum, c) => sum + c.score * c.credits, 0)
  const credits = graded.reduce((sum, c) => sum + c.credits, 0)
  return credits > 0 ? Math.round((total / credits) * 100) / 100 : null
}

const router = Router()

router.get('/profile', protect, async (req, res, next) => {
  try {
    const student = await store.students.findOne({ studentId: req.user.studentId })
    if (!student) return res.status(404).json({ message: 'Student not found' })
    const semesters = await store.semesters.find({ studentId: req.user.studentId })
    const calculatedGpa = calcGpa(semesters)
    if (calculatedGpa != null) {
      student.gpa = calculatedGpa
    }
    res.json(student)
  } catch (error) {
    next(error)
  }
})

export default router
