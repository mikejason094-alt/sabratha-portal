import { Router } from 'express'
import store from '../store.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.get('/', protect, async (req, res, next) => {
  try {
    const lectures = await store.lectures.find({ isActive: true }).sort({ day: 1, time: 1 })
    const registered = await store.lectureRegistrations.find({ studentId: req.user.studentId })
    const registeredIds = new Set(registered.map((r) => r.lectureId))
    const result = lectures.map((l) => ({ ...l, registered: registeredIds.has(l._id) }))
    res.json(result)
  } catch (error) {
    next(error)
  }
})

router.post('/:id/register', protect, async (req, res, next) => {
  try {
    const lecture = await store.lectures.findOne({ _id: req.params.id })
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' })

    const existing = await store.lectureRegistrations.findOne({
      studentId: req.user.studentId,
      lectureId: req.params.id,
    })

    if (existing) {
      await store.lectureRegistrations.deleteOne({ _id: existing._id })
      return res.json({ registered: false, message: 'Unregistered successfully' })
    }

    await store.lectureRegistrations.create({ studentId: req.user.studentId, lectureId: req.params.id })
    res.json({ registered: true, message: 'Registered successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
