import { Router } from 'express'
import store from '../store.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const filter = { isPublished: true }
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category
    }
    const news = await store.news.find(filter).sort({ date: -1 })
    res.json(news)
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const article = store.news.findOne({ _id: req.params.id })
    if (!article) return res.status(404).json({ message: 'News article not found' })
    res.json(article)
  } catch (error) {
    next(error)
  }
})

export default router
