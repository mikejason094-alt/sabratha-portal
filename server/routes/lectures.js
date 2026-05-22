import { Router } from 'express'
import Lecture from '../models/Lecture.js'
import LectureRegistration from '../models/LectureRegistration.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.get('/', protect, async (req, res, next) => {
  try {
    const lectures = await Lecture.find({ isActive: true }).sort({ day: 1, time: 1 })

    const registered = await LectureRegistration.find({ studentId: req.user.studentId })
    const registeredIds = new Set(registered.map((r) => r.lectureId.toString()))

    const result = lectures.map((l) => ({
      ...l.toObject(),
      registered: registeredIds.has(l._id.toString()),
    }))

    res.json(result)
  } catch (error) {
    next(error)
  }
})

router.post('/:id/register', protect, async (req, res, next) => {
  try {
    const lecture = await Lecture.findById(req.params.id)
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' })

    const existing = await LectureRegistration.findOne({
      studentId: req.user.studentId,
      lectureId: lecture._id,
    })

    if (existing) {
      await LectureRegistration.deleteOne({ _id: existing._id })
      return res.json({ registered: false, message: 'Unregistered successfully' })
    }

    await LectureRegistration.create({
      studentId: req.user.studentId,
      lectureId: lecture._id,
    })

    res.json({ registered: true, message: 'Registered successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
