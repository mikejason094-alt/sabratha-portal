import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import studentRoutes from './routes/student.js'
import semesterRoutes from './routes/semesters.js'
import courseRoutes from './routes/courses.js'
import lectureRoutes from './routes/lectures.js'
import newsRoutes from './routes/news.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 5000
const isProd = process.env.NODE_ENV === 'production'

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}))

app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/semesters', semesterRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/lectures', lectureRoutes)
app.use('/api/news', newsRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

if (isProd) {
  const publicPath = path.resolve(__dirname, '..', 'dist')
  app.use(express.static(publicPath))
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'))
  })
}

app.use(errorHandler)

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${isProd ? 'production' : 'development'})`)
  })
})
