import mongoose from 'mongoose'

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
}, { timestamps: true })

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true })

export default mongoose.model('Enrollment', enrollmentSchema)
