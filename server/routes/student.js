import { Router } from 'express'
import store from '../store.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.get('/profile', protect, async (req, res, next) => {
  try {
    const student = await store.students.findOne({ studentId: req.user.studentId })
    if (!student) return res.status(404).json({ message: 'Student not found' })
    res.json(student)
  } catch (error) {
    next(error)
  }
})

export default router
