import { Router } from 'express'
import Course from '../models/Course.js'
import Enrollment from '../models/Enrollment.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.get('/', protect, async (req, res, next) => {
  try {
    const courses = await Course.find({ isActive: true }).sort({ semester: 1, code: 1 })

    const enrolled = await Enrollment.find({ studentId: req.user.studentId })
    const enrolledCourseIds = new Set(enrolled.map((e) => e.courseId.toString()))

    const result = courses.map((c) => ({
      ...c.toObject(),
      registered: enrolledCourseIds.has(c._id.toString()),
    }))

    res.json(result)
  } catch (error) {
    next(error)
  }
})

router.post('/:id/register', protect, async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) return res.status(404).json({ message: 'Course not found' })

    const existing = await Enrollment.findOne({
      studentId: req.user.studentId,
      courseId: course._id,
    })

    if (existing) {
      await Enrollment.deleteOne({ _id: existing._id })
      if (course.enrolled > 0) course.enrolled -= 1
      await course.save()
      return res.json({ registered: false, message: 'Unregistered successfully' })
    }

    if (course.enrolled >= course.capacity) {
      return res.status(400).json({ message: 'Course is full' })
    }

    await Enrollment.create({
      studentId: req.user.studentId,
      courseId: course._id,
    })
    course.enrolled += 1
    await course.save()

    res.json({ registered: true, message: 'Registered successfully' })
  } catch (error) {
    next(error)
  }
})

router.get('/my', protect, async (req, res, next) => {
  try {
    const enrolled = await Enrollment.find({ studentId: req.user.studentId })
    const courseIds = enrolled.map((e) => e.courseId)
    const courses = await Course.find({ _id: { $in: courseIds }, isActive: true })
    res.json(courses.map((c) => ({ ...c.toObject(), registered: true })))
  } catch (error) {
    next(error)
  }
})

export default router
