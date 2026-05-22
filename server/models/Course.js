import mongoose from 'mongoose'

const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  nameEn: { type: String, required: true },
  nameAr: { type: String, required: true },
  credits: { type: Number, required: true },
  instructorEn: { type: String, required: true },
  instructorAr: { type: String, required: true },
  scheduleEn: { type: String, required: true },
  scheduleAr: { type: String, required: true },
  room: { type: String, required: true },
  capacity: { type: Number, required: true },
  enrolled: { type: Number, default: 0 },
  semester: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, toJSON: { virtuals: true } })

export default mongoose.model('Course', courseSchema)
