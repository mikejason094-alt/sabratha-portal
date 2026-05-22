import mongoose from 'mongoose'

const courseGradeSchema = new mongoose.Schema({
  code: { type: String, required: true },
  nameEn: { type: String, required: true },
  nameAr: { type: String, required: true },
  credits: { type: Number, required: true },
  grade: { type: String, default: null },
  points: { type: Number, default: null },
}, { _id: false })

const semesterSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  semesterNumber: { type: Number, required: true },
  nameEn: { type: String, required: true },
  nameAr: { type: String, required: true },
  year: { type: String, required: true },
  status: { type: String, enum: ['completed', 'in-progress', 'upcoming'], default: 'upcoming' },
  gpa: { type: Number, default: null },
  credits: { type: Number, default: 0 },
  courses: [courseGradeSchema],
}, { timestamps: true, toJSON: { virtuals: true } })

export default mongoose.model('Semester', semesterSchema)
