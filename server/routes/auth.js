import { Router } from 'express'
import User from '../models/User.js'
import Student from '../models/Student.js'
import { generateToken, protect } from '../middleware/auth.js'

const router = Router()

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const student = user.studentId ? await Student.findOne({ studentId: user.studentId }) : null

    const token = generateToken(user._id)

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
      },
      student,
    })
  } catch (error) {
    next(error)
  }
})

router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    const student = user.studentId ? await Student.findOne({ studentId: user.studentId }) : null

    res.json({ user, student })
  } catch (error) {
    next(error)
  }
})

export default router
