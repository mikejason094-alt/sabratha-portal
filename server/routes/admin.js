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

// News CRUD
router.get('/news', async (req, res, next) => {
  try {
    const all = (await store.news.find()) || []
    let news = req.query.category && req.query.category !== 'all'
      ? all.filter(a => a.category === req.query.category)
      : all
    news.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    res.json(news)
  } catch (e) { next(e) }
})

router.post('/news', async (req, res, next) => {
  try {
    const { titleEn, titleAr, summaryEn, summaryAr, contentEn, contentAr, category, date, image, author } = req.body
    if (!titleEn) return res.status(400).json({ message: 'Title is required' })
    const article = await store.news.insertOne({
      titleEn, titleAr: titleAr || titleEn,
      summaryEn: summaryEn || '', summaryAr: summaryAr || '',
      contentEn: contentEn || '', contentAr: contentAr || '',
      category: category || 'announcement',
      date: date || new Date().toISOString(),
      image: image || null,
      author: author || 'Admin',
      isPublished: true,
    })
    res.status(201).json(article)
  } catch (e) { next(e) }
})

router.put('/news/:id', async (req, res, next) => {
  try {
    const existing = await store.news.findOne({ _id: req.params.id })
    if (!existing) return res.status(404).json({ message: 'News not found' })
    const { titleEn, titleAr, summaryEn, summaryAr, contentEn, contentAr, category, date, image, author, isPublished } = req.body
    const updates = {}
    if (titleEn !== undefined) updates.titleEn = titleEn
    if (titleAr !== undefined) updates.titleAr = titleAr
    if (summaryEn !== undefined) updates.summaryEn = summaryEn
    if (summaryAr !== undefined) updates.summaryAr = summaryAr
    if (contentEn !== undefined) updates.contentEn = contentEn
    if (contentAr !== undefined) updates.contentAr = contentAr
    if (category !== undefined) updates.category = category
    if (date !== undefined) updates.date = date
    if (image !== undefined) updates.image = image
    if (author !== undefined) updates.author = author
    if (isPublished !== undefined) updates.isPublished = isPublished
    await store.news.updateOne({ _id: req.params.id }, updates)
    const updated = await store.news.findOne({ _id: req.params.id })
    res.json(updated)
  } catch (e) { next(e) }
})

router.delete('/news/:id', async (req, res, next) => {
  try {
    const existing = await store.news.findOne({ _id: req.params.id })
    if (!existing) return res.status(404).json({ message: 'News not found' })
    await store.news.deleteOne({ _id: req.params.id })
    res.json({ message: 'News deleted' })
  } catch (e) { next(e) }
})

// Transcript
router.get('/transcript/:studentId', async (req, res, next) => {
  try {
    const student = await store.students.findOne({ studentId: req.params.studentId })
    if (!student) return res.status(404).json({ message: 'Student not found' })
    const semesters = await store.semesters.find({ studentId: req.params.studentId }).sort({ semesterNumber: 1 })
    const user = await store.users.findOne({ studentId: req.params.studentId })
    const allCourses = semesters.flatMap(s => s.courses || [])
    const graded = allCourses.filter(c => c.score != null)
    const totalPoints = graded.reduce((sum, c) => sum + c.score * c.credits, 0)
    const totalCredits = graded.reduce((sum, c) => sum + c.credits, 0)
    const overallGpa = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : null
    res.json({ student, semesters, user, overallGpa })
  } catch (e) { next(e) }
})

export default router