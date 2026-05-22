import mongoose from 'mongoose'

const lectureSchema = new mongoose.Schema({
  courseCode: { type: String, required: true },
  courseEn: { type: String, required: true },
  courseAr: { type: String, required: true },
  day: { type: String, required: true, enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'] },
  dayEn: { type: String, required: true },
  dayAr: { type: String, required: true },
  time: { type: String, required: true },
  room: { type: String, required: true },
  instructorEn: { type: String, required: true },
  instructorAr: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, toJSON: { virtuals: true } })

export default mongoose.model('Lecture', lectureSchema)
