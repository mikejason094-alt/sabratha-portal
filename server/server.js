import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import { connectDB, getDBStatus, waitForDB } from './config/db.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import studentRoutes from './routes/student.js'
import semesterRoutes from './routes/semesters.js'
import courseRoutes from './routes/courses.js'
import lectureRoutes from './routes/lectures.js'
import newsRoutes from './routes/news.js'
import { seedDatabase } from './seedData.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 5000
const isProd = process.env.NODE_ENV === 'production'

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: getDBStatus() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/semesters', semesterRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/lectures', lectureRoutes)
app.use('/api/news', newsRoutes)

if (isProd) {
  const publicPath = path.resolve(__dirname, '..', 'dist')
  app.use(express.static(publicPath))
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'))
  })
}

app.use(errorHandler)

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
})

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err)
})

async function start() {
  console.log('Starting server...')
  console.log(`Node version: ${process.version}`)
  console.log(`NODE_ENV: ${isProd}`)
  console.log(`PORT: ${PORT}`)
  await connectDB()
  const dbReady = await waitForDB()
  if (dbReady) {
    try { await seedDatabase() } catch (e) { console.error('Auto-seed error:', e.message) }
  } else {
    console.warn('Database not ready after 30s — skipping auto-seed')
  }
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${isProd ? 'production' : 'development'})`)
  })
}

start()
