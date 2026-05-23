import { Router } from 'express'
import store from '../store.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.get('/', protect, async (req, res, next) => {
  try {
    const courses = await store.courses.find({ isActive: true }).sort({ semester: 1, code: 1 })
    const enrolled = await store.enrollments.find({ studentId: req.user.studentId })
    const enrolledCourseIds = new Set(enrolled.map((e) => e.courseId))
    const result = courses.map((c) => ({ ...c, registered: enrolledCourseIds.has(c._id) }))
    res.json(result)
  } catch (error) {
    next(error)
  }
})

router.post('/:id/register', protect, async (req, res, next) => {
  try {
    const course = await store.courses.findOne({ _id: req.params.id })
    if (!course) return res.status(404).json({ message: 'Course not found' })

    const existing = await store.enrollments.findOne({
      studentId: req.user.studentId,
      courseId: req.params.id,
    })

    if (existing) {
      await store.enrollments.deleteOne({ _id: existing._id })
      if (course.enrolled > 0) {
        course.enrolled -= 1
        await store.courses.saveDoc(course)
      }
      return res.json({ registered: false, message: 'Unregistered successfully' })
    }

    if (course.enrolled >= course.capacity) {
      return res.status(400).json({ message: 'Course is full' })
    }

    await store.enrollments.create({ studentId: req.user.studentId, courseId: req.params.id })
    course.enrolled += 1
    await store.courses.saveDoc(course)

    res.json({ registered: true, message: 'Registered successfully' })
  } catch (error) {
    next(error)
  }
})

router.get('/my', protect, async (req, res, next) => {
  try {
    const enrolled = await store.enrollments.find({ studentId: req.user.studentId })
    const courseIds = enrolled.map((e) => e.courseId)
    const allCourses = await store.courses.find({ isActive: true })
    const courses = allCourses.filter(c => courseIds.includes(c._id))
    res.json(courses.map((c) => ({ ...c, registered: true })))
  } catch (error) {
    next(error)
  }
})

export default router
