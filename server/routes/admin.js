import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import store from '../store.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()
router.use(protect, adminOnly)

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&'
  let pw = ''
  for (let i = 0; i < 12; i++) pw += chars[crypto.randomInt(0, chars.length)]
  return pw
}

router.get('/users', async (req, res, next) => {
  try {
    const { role, search } = req.query
    let users = await store.users.find()
    if (role && role !== 'all') users = users.filter(u => u.role === role)
    if (search) {
      const q = search.toLowerCase()
      users = users.filter(u =>
        (u.nameEn && u.nameEn.toLowerCase().includes(q)) ||
        (u.nameAr && u.nameAr.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      )
    }
    users.forEach(u => delete u.password)
    res.json(users.sort((a, b) => (a.nameEn || '').localeCompare(b.nameEn || '')))
  } catch (e) { next(e) }
})

router.post('/users', async (req, res, next) => {
  try {
    const { email, password, role, nameEn, nameAr, studentId, department, departmentAr, enrollmentYear, gpa, totalCredits } = req.body
    if (!email || !password || !role) return res.status(400).json({ message: 'Email, password, and role are required' })
    const existing = await store.users.findOne({ email: email.toLowerCase() })
    if (existing) return res.status(409).json({ message: 'Email already exists' })
    const hashed = await bcrypt.hash(password, 12)
    const userData = { email: email.toLowerCase(), password: hashed, role, nameEn, nameAr, isActive: true }
    if (role === 'student' && studentId) userData.studentId = studentId
    const user = await store.users.insertOne(userData)
    if (role === 'student') {
      await store.students.insertOne({
        studentId, nameEn, nameAr, email: email.toLowerCase(),
        department: department || '', departmentAr: departmentAr || '',
        enrollmentYear: enrollmentYear || new Date().getFullYear(),
        currentSemester: 1, gpa: gpa || 0, totalCredits: totalCredits || 0,
      })
    }
    delete user.password
    res.status(201).json(user)
  } catch (e) { next(e) }
})

router.put('/users/:id', async (req, res, next) => {
  try {
    const { nameEn, nameAr, email, role, studentId, department, departmentAr, enrollmentYear, gpa, totalCredits, isActive } = req.body
    const user = await store.users.findOne({ _id: req.params.id })
    if (!user) return res.status(404).json({ message: 'User not found' })
    const updates = {}
    if (nameEn !== undefined) updates.nameEn = nameEn
    if (nameAr !== undefined) updates.nameAr = nameAr
    if (email !== undefined) updates.email = email.toLowerCase()
    if (role !== undefined) updates.role = role
    if (studentId !== undefined) updates.studentId = studentId
    if (isActive !== undefined) updates.isActive = isActive
    if (Object.keys(updates).length > 0) await store.users.updateOne({ _id: req.params.id }, updates)
    if (role === 'student' || user.role === 'student') {
      const studentUpdates = {}
      if (nameEn !== undefined) studentUpdates.nameEn = nameEn
      if (nameAr !== undefined) studentUpdates.nameAr = nameAr
      if (email !== undefined) studentUpdates.email = email.toLowerCase()
      if (department !== undefined) studentUpdates.department = department
      if (departmentAr !== undefined) studentUpdates.departmentAr = departmentAr
      if (enrollmentYear !== undefined) studentUpdates.enrollmentYear = enrollmentYear
      if (gpa !== undefined) studentUpdates.gpa = gpa
      if (totalCredits !== undefined) studentUpdates.totalCredits = totalCredits
      if (studentId !== undefined) studentUpdates.studentId = studentId
      if (Object.keys(studentUpdates).length > 0) {
        const sid = studentId || user.studentId
        if (sid) await store.students.updateOne({ studentId: sid }, studentUpdates)
      }
    }
    const updated = await store.users.findOne({ _id: req.params.id })
    delete updated.password
    res.json(updated)
  } catch (e) { next(e) }
})

router.put('/users/:id/reset-password', async (req, res, next) => {
  try {
    const user = await store.users.findOne({ _id: req.params.id })
    if (!user) return res.status(404).json({ message: 'User not found' })
    const newPassword = generatePassword()
    const hashed = await bcrypt.hash(newPassword, 12)
    await store.users.updateOne({ _id: req.params.id }, { password: hashed })
    res.json({ message: 'Password reset successful', newPassword })
  } catch (e) { next(e) }
})

router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await store.users.findOne({ _id: req.params.id })
    if (!user) return res.status(404).json({ message: 'User not found' })
    await store.users.updateOne({ _id: req.params.id }, { isActive: false })
    res.json({ message: 'User deactivated' })
  } catch (e) { next(e) }
})

router.get('/stats', async (req, res, next) => {
  try {
    const users = await store.users.find()
    const totalUsers = users.length
    const totalStudents = users.filter(u => u.role === 'student').length
    const totalTeachers = users.filter(u => u.role === 'teacher').length
    const totalAdmins = users.filter(u => u.role === 'admin').length
    const activeUsers = users.filter(u => u.isActive !== false).length
    const students = await store.students.find()
    res.json({ totalUsers, totalStudents, totalTeachers, totalAdmins, activeUsers, totalStudentRecords: students.length })
  } catch (e) { next(e) }
})

export default router