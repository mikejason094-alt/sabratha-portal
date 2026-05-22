import mongoose from 'mongoose'

const lectureRegistrationSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  lectureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true },
}, { timestamps: true })

lectureRegistrationSchema.index({ studentId: 1, lectureId: 1 }, { unique: true })

export default mongoose.model('LectureRegistration', lectureRegistrationSchema)
