import bcrypt from 'bcryptjs'

let idCounter = 1
function newId() { return String(idCounter++) }

function clone(obj) { return JSON.parse(JSON.stringify(obj)) }

function matchQuery(obj, query) {
  for (const [key, val] of Object.entries(query)) {
    if (key === '_id') { if (obj._id !== val) return false }
    else if (val && typeof val === 'object' && '$in' in val) { if (!val.$in.includes(obj[key])) return false }
    else { if (obj[key] !== val) return false }
  }
  return true
}

class Collection {
  constructor(name) { this.name = name; this.docs = [] }

  _addHooks(doc) {
    if (this.name === 'users') {
      doc.toObject = () => { const { password, ...rest } = doc; return rest }
    } else { doc.toObject = () => clone(doc) }
    return doc
  }

  insertOne(data) {
    const doc = { ...data, _id: newId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    this._addHooks(doc)
    this.docs.push(doc)
    return doc
  }

  insertMany(arr) { return arr.map(d => this.insertOne(d)) }

  findOne(query) {
    for (const doc of this.docs) { if (matchQuery(doc, query)) return this._addHooks(clone(doc)) }
    return null
  }

  findById(id) { return this.findOne({ _id: id }) }

  find(query = {}) {
    const results = []
    for (const doc of this.docs) { if (matchQuery(doc, query)) results.push(this._addHooks(clone(doc))) }
    const q = { _results: results }
    q.sort = function (sortObj) {
      const field = Object.keys(sortObj)[0]; const dir = sortObj[field]
      this._results.sort((a, b) => {
        if (a[field] < b[field]) return -1 * dir
        if (a[field] > b[field]) return 1 * dir
        return 0
      })
      return this
    }
    q.then = (resolve) => resolve(this._results)
    q.exec = async () => this._results
    return q
  }

  create(data) { return this.insertOne(data) }
  deleteOne(query) {
    const idx = this.docs.findIndex(d => matchQuery(d, query))
    if (idx >= 0) { this.docs.splice(idx, 1); return { deletedCount: 1 } }
    return { deletedCount: 0 }
  }
  async saveDoc(doc) {
    const idx = this.docs.findIndex(d => d._id === doc._id)
    if (idx >= 0) { doc.updatedAt = new Date().toISOString(); this.docs[idx] = doc }
  }

  updateOne(query, updates) {
    const idx = this.docs.findIndex(d => matchQuery(d, query))
    if (idx < 0) return null
    Object.assign(this.docs[idx], updates, { updatedAt: new Date().toISOString() })
    return this.docs[idx]
  }
}

export default class MemStore {
  constructor() {
    this.users = new Collection('users')
    this.students = new Collection('students')
    this.semesters = new Collection('semesters')
    this.courses = new Collection('courses')
    this.lectures = new Collection('lectures')
    this.news = new Collection('news')
    this.enrollments = new Collection('enrollments')
    this.lectureRegistrations = new Collection('lectureRegistrations')
    this.exams = new Collection('exams')
    this.courseGrades = new Collection('courseGrades')
  }

  async init() {}

  async seed() {
    if (this.users.findOne({ email: 'islam.alhawwari@sits.edu.ly' })) { console.log('MemStore already seeded'); return }
    console.log('Seeding memory store...')

    // Admin account
    const adminPw = await bcrypt.hash('admin123', 12)
    this.users.insertOne({ email: 'admin@sits.edu.ly', password: adminPw, role: 'admin', nameEn: 'System Admin', nameAr: 'مدير النظام', isActive: true })

    // Student account
    const studentPw = await bcrypt.hash('student123', 12)
    this.users.insertOne({ email: 'islam.alhawwari@sits.edu.ly', password: studentPw, role: 'student', studentId: 'STU-2024-001', isActive: true })
    this.students.insertOne({ studentId: 'STU-2024-001', nameEn: 'Islam Almuneer Alhawwari', nameAr: 'إسلام المنير الحواري', email: 'islam.alhawwari@sits.edu.ly', department: 'Software Engineering', departmentAr: 'هندسة البرمجيات', enrollmentYear: 2024, currentSemester: 3, gpa: 86, totalCredits: 42 })

    // Teacher accounts
    const teacherPw = await bcrypt.hash('teacher123', 12)
    const t1 = this.users.insertOne({ email: 'ahmed.hassan@sits.edu.ly', password: teacherPw, role: 'teacher', nameEn: 'Dr. Ahmed', nameAr: 'د. أحمد', department: 'Software Engineering', departmentAr: 'هندسة البرمجيات', isActive: true })
    const t2 = this.users.insertOne({ email: 'sara.ali@sits.edu.ly', password: teacherPw, role: 'teacher', nameEn: 'Dr. Sara', nameAr: 'د. سارة', department: 'Software Engineering', departmentAr: 'هندسة البرمجيات', isActive: true })
    const t3 = this.users.insertOne({ email: 'khalid.omar@sits.edu.ly', password: teacherPw, role: 'teacher', nameEn: 'Dr. Khalid', nameAr: 'د. خالد', department: 'Mathematics', departmentAr: 'الرياضيات', isActive: true })
    const t4 = this.users.insertOne({ email: 'mohamed.ali@sits.edu.ly', password: teacherPw, role: 'teacher', nameEn: 'Dr. Mohamed', nameAr: 'د. محمد', department: 'Software Engineering', departmentAr: 'هندسة البرمجيات', isActive: true })
    const t5 = this.users.insertOne({ email: 'omar.hassan@sits.edu.ly', password: teacherPw, role: 'teacher', nameEn: 'Dr. Omar', nameAr: 'د. عمر', department: 'Software Engineering', departmentAr: 'هندسة البرمجيات', isActive: true })

    // Courses with teacherId
    const courses = this.courses.insertMany([
      { code: 'CS101', nameEn: 'Introduction to Programming', nameAr: 'مقدمة في البرمجة', credits: 3, instructorEn: 'Dr. Ahmed', instructorAr: 'د. أحمد', teacherId: t1._id, scheduleEn: 'Sun/Tue 10:00-11:30', scheduleAr: 'الأحد/الثلاثاء 10:00-11:30', room: 'Lab 1', capacity: 30, enrolled: 25, semester: 1, isActive: true },
      { code: 'CS102', nameEn: 'Object-Oriented Programming', nameAr: 'البرمجة كائنية التوجه', credits: 3, instructorEn: 'Dr. Sara', instructorAr: 'د. سارة', teacherId: t2._id, scheduleEn: 'Mon/Wed 10:00-11:30', scheduleAr: 'الإثنين/الأربعاء 10:00-11:30', room: 'Lab 2', capacity: 30, enrolled: 22, semester: 2, isActive: true },
      { code: 'MATH101', nameEn: 'Calculus I', nameAr: 'التفاضل والتكامل I', credits: 3, instructorEn: 'Dr. Khalid', instructorAr: 'د. خالد', teacherId: t3._id, scheduleEn: 'Sun/Tue 08:30-10:00', scheduleAr: 'الأحد/الثلاثاء 08:30-10:00', room: 'Hall A', capacity: 50, enrolled: 45, semester: 1, isActive: true },
      { code: 'MATH102', nameEn: 'Calculus II', nameAr: 'التفاضل والتكامل II', credits: 3, instructorEn: 'Dr. Khalid', instructorAr: 'د. خالد', teacherId: t3._id, scheduleEn: 'Mon/Wed 08:30-10:00', scheduleAr: 'الإثنين/الأربعاء 08:30-10:00', room: 'Hall A', capacity: 50, enrolled: 40, semester: 2, isActive: true },
      { code: 'CS201', nameEn: 'Data Structures', nameAr: 'هياكل البيانات', credits: 3, instructorEn: 'Dr. Ahmed', instructorAr: 'د. أحمد', teacherId: t1._id, scheduleEn: 'Sun/Tue 11:30-13:00', scheduleAr: 'الأحد/الثلاثاء 11:30-13:00', room: 'Lab 1', capacity: 30, enrolled: 20, semester: 3, isActive: true },
      { code: 'CS202', nameEn: 'Database Systems', nameAr: 'أنظمة قواعد البيانات', credits: 3, instructorEn: 'Dr. Sara', instructorAr: 'د. سارة', teacherId: t2._id, scheduleEn: 'Mon/Wed 11:30-13:00', scheduleAr: 'الإثنين/الأربعاء 11:30-13:00', room: 'Lab 2', capacity: 30, enrolled: 18, semester: 3, isActive: true },
      { code: 'CS301', nameEn: 'Software Engineering', nameAr: 'هندسة البرمجيات', credits: 3, instructorEn: 'Dr. Mohamed', instructorAr: 'د. محمد', teacherId: t4._id, scheduleEn: 'Tue/Thu 10:00-11:30', scheduleAr: 'الثلاثاء/الخميس 10:00-11:30', room: 'Hall B', capacity: 35, enrolled: 15, semester: 4, isActive: true },
      { code: 'CS302', nameEn: 'Web Development', nameAr: 'تطوير الويب', credits: 3, instructorEn: 'Dr. Omar', instructorAr: 'د. عمر', teacherId: t5._id, scheduleEn: 'Sun/Tue 13:00-14:30', scheduleAr: 'الأحد/الثلاثاء 13:00-14:30', room: 'Lab 3', capacity: 25, enrolled: 12, semester: 4, isActive: true },
    ])

    this.semesters.insertMany([
      { studentId: 'STU-2024-001', semesterNumber: 1, nameEn: 'First Semester', nameAr: 'الفصل الدراسي الأول', year: '2024', status: 'completed', gpa: 80, credits: 15, courses: [{ code: 'CS101', nameEn: 'Introduction to Programming', nameAr: 'مقدمة في البرمجة', credits: 3, grade: 'B+', points: 3.3, score: 83 }, { code: 'MATH101', nameEn: 'Calculus I', nameAr: 'التفاضل والتكامل I', credits: 3, grade: 'A-', points: 3.7, score: 90 }] },
      { studentId: 'STU-2024-001', semesterNumber: 2, nameEn: 'Second Semester', nameAr: 'الفصل الدراسي الثاني', year: '2024', status: 'completed', gpa: 88, credits: 15, courses: [{ code: 'CS102', nameEn: 'Object-Oriented Programming', nameAr: 'البرمجة كائنية التوجه', credits: 3, grade: 'A', points: 4.0, score: 95 }, { code: 'MATH102', nameEn: 'Calculus II', nameAr: 'التفاضل والتكامل II', credits: 3, grade: 'B+', points: 3.3, score: 83 }] },
      { studentId: 'STU-2024-001', semesterNumber: 3, nameEn: 'Third Semester', nameAr: 'الفصل الدراسي الثالث', year: '2025', status: 'in-progress', gpa: null, credits: 12, courses: [{ code: 'CS201', nameEn: 'Data Structures', nameAr: 'هياكل البيانات', credits: 3, grade: null, points: null, score: null }, { code: 'CS202', nameEn: 'Database Systems', nameAr: 'أنظمة قواعد البيانات', credits: 3, grade: null, points: null, score: null }] },
    ])
    this.lectures.insertMany([
      { courseCode: 'CS101', courseEn: 'Introduction to Programming', courseAr: 'مقدمة في البرمجة', day: 'sunday', dayEn: 'Sunday', dayAr: 'الأحد', time: '10:00-11:30', room: 'Lab 1', instructorEn: 'Dr. Ahmed', instructorAr: 'د. أحمد', isActive: true },
      { courseCode: 'CS101', courseEn: 'Introduction to Programming', courseAr: 'مقدمة في البرمجة', day: 'tuesday', dayEn: 'Tuesday', dayAr: 'الثلاثاء', time: '10:00-11:30', room: 'Lab 1', instructorEn: 'Dr. Ahmed', instructorAr: 'د. أحمد', isActive: true },
      { courseCode: 'CS201', courseEn: 'Data Structures', courseAr: 'هياكل البيانات', day: 'sunday', dayEn: 'Sunday', dayAr: 'الأحد', time: '11:30-13:00', room: 'Lab 1', instructorEn: 'Dr. Ahmed', instructorAr: 'د. أحمد', isActive: true },
      { courseCode: 'CS201', courseEn: 'Data Structures', courseAr: 'هياكل البيانات', day: 'tuesday', dayEn: 'Tuesday', dayAr: 'الثلاثاء', time: '11:30-13:00', room: 'Lab 1', instructorEn: 'Dr. Ahmed', instructorAr: 'د. أحمد', isActive: true },
      { courseCode: 'CS202', courseEn: 'Database Systems', courseAr: 'أنظمة قواعد البيانات', day: 'monday', dayEn: 'Monday', dayAr: 'الإثنين', time: '11:30-13:00', room: 'Lab 2', instructorEn: 'Dr. Sara', instructorAr: 'د. سارة', isActive: true },
      { courseCode: 'CS202', courseEn: 'Database Systems', courseAr: 'أنظمة قواعد البيانات', day: 'wednesday', dayEn: 'Wednesday', dayAr: 'الأربعاء', time: '11:30-13:00', room: 'Lab 2', instructorEn: 'Dr. Sara', instructorAr: 'د. سارة', isActive: true },
      { courseCode: 'MATH101', courseEn: 'Calculus I', courseAr: 'التفاضل والتكامل I', day: 'sunday', dayEn: 'Sunday', dayAr: 'الأحد', time: '08:30-10:00', room: 'Hall A', instructorEn: 'Dr. Khalid', instructorAr: 'د. خالد', isActive: true },
      { courseCode: 'MATH101', courseEn: 'Calculus I', courseAr: 'التفاضل والتكامل I', day: 'tuesday', dayEn: 'Tuesday', dayAr: 'الثلاثاء', time: '08:30-10:00', room: 'Hall A', instructorEn: 'Dr. Khalid', instructorAr: 'د. خالد', isActive: true },
    ])
    this.news.insertMany([
      { titleEn: 'Welcome to the New Academic Year', titleAr: 'مرحباً بكم في العام الدراسي الجديد', summaryEn: 'The new academic year 2025-2026 has begun with exciting updates.', summaryAr: 'بدأ العام الدراسي الجديد 2025-2026 مع تحديثات مثيرة.', contentEn: 'We are pleased to announce the start of the new academic year 2025-2026. Students can now view their schedules and enroll in courses through the student portal.', contentAr: 'يسرنا الإعلان عن بدء العام الدراسي الجديد 2025-2026. يمكن للطلاب الآن الاطلاع على جداولهم والتسجيل في المقررات الدراسية من خلال بوابة الطالب.', category: 'announcement', date: new Date().toISOString(), image: null, author: 'Admin', isPublished: true },
      { titleEn: 'Software Engineering Workshop', titleAr: 'ورشة هندسة البرمجيات', summaryEn: 'A hands-on workshop on modern software engineering practices.', summaryAr: 'ورشة عملية حول ممارسات هندسة البرمجيات الحديثة.', contentEn: 'The department is organizing a two-day workshop on software engineering best practices including agile methodologies, version control, and CI/CD pipelines.', contentAr: 'ينظم القسم ورشة عمل لمدة يومين حول أفضل ممارسات هندسة البرمجيات بما في ذلك المنهجيات الرشيقة والتحكم في الإصدارات وخطوط أنابيب CI/CD.', category: 'event', date: new Date().toISOString(), image: null, author: 'Academic Affairs', isPublished: true },
    ])

    // Sample exams
    this.exams.insertMany([
      { courseId: courses[0]._id, titleEn: 'Midterm Exam', titleAr: 'امتحان منتصف الفصل', date: '2025-04-15', time: '10:00', duration: 120, room: 'Hall A', maxScore: 100, type: 'midterm', createdBy: t1._id },
      { courseId: courses[4]._id, titleEn: 'Quiz 1', titleAr: 'اختبار قصير 1', date: '2025-03-20', time: '11:00', duration: 30, room: 'Lab 1', maxScore: 20, type: 'quiz', createdBy: t1._id },
      { courseId: courses[5]._id, titleEn: 'Final Exam', titleAr: 'الامتحان النهائي', date: '2025-06-10', time: '09:00', duration: 180, room: 'Hall B', maxScore: 150, type: 'final', createdBy: t2._id },
    ])

    // Sample course grades
    this.courseGrades.insertMany([
      { courseId: courses[0]._id, studentId: 'STU-2024-001', semesterNumber: 1, grade: 'B+', points: 3.3, score: 83, updatedBy: t1._id },
      { courseId: courses[2]._id, studentId: 'STU-2024-001', semesterNumber: 1, grade: 'A-', points: 3.7, score: 90, updatedBy: t3._id },
      { courseId: courses[1]._id, studentId: 'STU-2024-001', semesterNumber: 2, grade: 'A', points: 4.0, score: 95, updatedBy: t2._id },
      { courseId: courses[3]._id, studentId: 'STU-2024-001', semesterNumber: 2, grade: 'B+', points: 3.3, score: 83, updatedBy: t3._id },
    ])

    console.log('MemStore seeded')
  }
}
