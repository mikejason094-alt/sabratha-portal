import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  nameEn: { type: String, required: true },
  nameAr: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  department: { type: String, required: true },
  departmentAr: { type: String, required: true },
  enrollmentYear: { type: Number, required: true },
  currentSemester: { type: Number, default: 1 },
  gpa: { type: Number, default: 0 },
  totalCredits: { type: Number, default: 0 },
  profileImage: { type: String, default: null },
}, { timestamps: true, toJSON: { virtuals: true } })

export default mongoose.model('Student', studentSchema)
