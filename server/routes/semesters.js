import { Router } from 'express'
import Semester from '../models/Semester.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.get('/', protect, async (req, res, next) => {
  try {
    const semesters = await Semester.find({ studentId: req.user.studentId }).sort({ semesterNumber: 1 })
    res.json(semesters)
  } catch (error) {
    next(error)
  }
})

router.get('/current', protect, async (req, res, next) => {
  try {
    const current = await Semester.findOne({
      studentId: req.user.studentId,
      status: 'in-progress',
    })
    res.json(current)
  } catch (error) {
    next(error)
  }
})

router.get('/:id', protect, async (req, res, next) => {
  try {
    const semester = await Semester.findOne({
      _id: req.params.id,
      studentId: req.user.studentId,
    })
    if (!semester) return res.status(404).json({ message: 'Semester not found' })
    res.json(semester)
  } catch (error) {
    next(error)
  }
})

export default router
