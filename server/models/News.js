import mongoose from 'mongoose'

const newsSchema = new mongoose.Schema({
  titleEn: { type: String, required: true },
  titleAr: { type: String, required: true },
  summaryEn: { type: String, required: true },
  summaryAr: { type: String, required: true },
  contentEn: { type: String, required: true },
  contentAr: { type: String, required: true },
  category: { type: String, enum: ['announcement', 'event'], required: true },
  date: { type: Date, default: Date.now },
  image: { type: String, default: null },
  author: { type: String, required: true },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true, toJSON: { virtuals: true } })

export default mongoose.model('News', newsSchema)
