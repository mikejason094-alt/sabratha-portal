import { Router } from 'express'
import bcrypt from 'bcryptjs'
import store from '../store.js'
import { generateToken, protect } from '../middleware/auth.js'

const router = Router()

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await store.users.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const student = user.studentId ? await store.students.findOne({ studentId: user.studentId }) : null

    const token = generateToken(user._id)

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        nameEn: user.nameEn,
        nameAr: user.nameAr,
      },
      student,
    })
  } catch (error) {
    next(error)
  }
})

router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await store.users.findOne({ _id: req.user._id })
    delete user.password
    const student = user.studentId ? await store.students.findOne({ studentId: user.studentId }) : null
    res.json({ user, student })
  } catch (error) {
    next(error)
  }
})

export default router
