import bcrypt from 'bcryptjs'

let idCounter = 1
function newId() { return String(idCounter++) }

function clone(obj) { return JSON.parse(JSON.stringify(obj)) }

function matchQuery(obj, query) {
  for (const [key, val] of Object.entries(query)) {
    if (key === '_id') {
      if (obj._id !== val) return false
    } else if (val && typeof val === 'object' && '$in' in val) {
      if (!val.$in.includes(obj[key])) return false
    } else {
      if (obj[key] !== val) return false
    }
  }
  return true
}

class Collection {
  constructor(name) { this.name = name; this.docs = [] }

  _addHooks(doc) {
    if (this.name === 'users') {
      doc.toObject = () => { const { password, ...rest } = doc; return rest }
    } else {
      doc.toObject = () => clone(doc)
    }
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
    q.select = function (fields) {
      if (fields.startsWith('-')) { const exclude = fields.slice(1); this._results = this._results.map(r => { const { [exclude]: _, ...rest } = r; return rest }) }
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
}

// Store singleton
const store = {
  users: new Collection('users'),
  students: new Collection('students'),
  semesters: new Collection('semesters'),
  courses: new Collection('courses'),
  lectures: new Collection('lectures'),
  news: new Collection('news'),
  enrollments: new Collection('enrollments'),
  lectureRegistrations: new Collection('lectureRegistrations'),

  async seed() {
    const existing = this.users.findOne({ email: 'islam.alhawwari@sits.edu.ly' })
    if (existing) { console.log('Store already seeded'); return }

    console.log('Seeding store data...')

    const hashedPassword = await bcrypt.hash('student123', 12)
    const user = this.users.insertOne({
      email: 'islam.alhawwari@sits.edu.ly',
      password: hashedPassword,
      role: 'student',
      studentId: 'STU-2024-001',
      isActive: true,
    })
    // Attach comparePassword for login
    user.comparePassword = async (pw) => bcrypt.compare(pw, hashedPassword)

    this.students.insertOne({
      studentId: 'STU-2024-001',
      nameEn: 'Islam Almuneer Alhawwari',
      nameAr: 'إسلام المنير الحواري',
      email: 'islam.alhawwari@sits.edu.ly',
      department: 'Software Engineering',
      departmentAr: 'هندسة البرمجيات',
      enrollmentYear: 2024,
      currentSemester: 3,
      gpa: 3.45,
      totalCredits: 42,
    })

    this.semesters.insertMany([
      { studentId: 'STU-2024-001', semesterNumber: 1, nameEn: 'First Semester', nameAr: 'الفصل الدراسي الأول', year: '2024', status: 'completed', gpa: 3.2, credits: 15, courses: [
        { code: 'CS101', nameEn: 'Introduction to Programming', nameAr: 'مقدمة في البرمجة', credits: 3, grade: 'B+', points: 3.3 },
        { code: 'MATH101', nameEn: 'Calculus I', nameAr: 'التفاضل والتكامل I', credits: 3, grade: 'A-', points: 3.7 },
      ]},
      { studentId: 'STU-2024-001', semesterNumber: 2, nameEn: 'Second Semester', nameAr: 'الفصل الدراسي الثاني', year: '2024', status: 'completed', gpa: 3.5, credits: 15, courses: [
        { code: 'CS102', nameEn: 'Object-Oriented Programming', nameAr: 'البرمجة كائنية التوجه', credits: 3, grade: 'A', points: 4.0 },
        { code: 'MATH102', nameEn: 'Calculus II', nameAr: 'التفاضل والتكامل II', credits: 3, grade: 'B+', points: 3.3 },
      ]},
      { studentId: 'STU-2024-001', semesterNumber: 3, nameEn: 'Third Semester', nameAr: 'الفصل الدراسي الثالث', year: '2025', status: 'in-progress', gpa: null, credits: 12, courses: [
        { code: 'CS201', nameEn: 'Data Structures', nameAr: 'هياكل البيانات', credits: 3, grade: null, points: null },
        { code: 'CS202', nameEn: 'Database Systems', nameAr: 'أنظمة قواعد البيانات', credits: 3, grade: null, points: null },
      ]},
    ])

    this.courses.insertMany([
      { code: 'CS101', nameEn: 'Introduction to Programming', nameAr: 'مقدمة في البرمجة', credits: 3, instructorEn: 'Dr. Ahmed', instructorAr: 'د. أحمد', scheduleEn: 'Sun/Tue 10:00-11:30', scheduleAr: 'الأحد/الثلاثاء 10:00-11:30', room: 'Lab 1', capacity: 30, enrolled: 25, semester: 1, isActive: true },
      { code: 'CS102', nameEn: 'Object-Oriented Programming', nameAr: 'البرمجة كائنية التوجه', credits: 3, instructorEn: 'Dr. Sara', instructorAr: 'د. سارة', scheduleEn: 'Mon/Wed 10:00-11:30', scheduleAr: 'الإثنين/الأربعاء 10:00-11:30', room: 'Lab 2', capacity: 30, enrolled: 22, semester: 2, isActive: true },
      { code: 'MATH101', nameEn: 'Calculus I', nameAr: 'التفاضل والتكامل I', credits: 3, instructorEn: 'Dr. Khalid', instructorAr: 'د. خالد', scheduleEn: 'Sun/Tue 08:30-10:00', scheduleAr: 'الأحد/الثلاثاء 08:30-10:00', room: 'Hall A', capacity: 50, enrolled: 45, semester: 1, isActive: true },
      { code: 'MATH102', nameEn: 'Calculus II', nameAr: 'التفاضل والتكامل II', credits: 3, instructorEn: 'Dr. Khalid', instructorAr: 'د. خالد', scheduleEn: 'Mon/Wed 08:30-10:00', scheduleAr: 'الإثنين/الأربعاء 08:30-10:00', room: 'Hall A', capacity: 50, enrolled: 40, semester: 2, isActive: true },
      { code: 'CS201', nameEn: 'Data Structures', nameAr: 'هياكل البيانات', credits: 3, instructorEn: 'Dr. Ahmed', instructorAr: 'د. أحمد', scheduleEn: 'Sun/Tue 11:30-13:00', scheduleAr: 'الأحد/الثلاثاء 11:30-13:00', room: 'Lab 1', capacity: 30, enrolled: 20, semester: 3, isActive: true },
      { code: 'CS202', nameEn: 'Database Systems', nameAr: 'أنظمة قواعد البيانات', credits: 3, instructorEn: 'Dr. Sara', instructorAr: 'د. سارة', scheduleEn: 'Mon/Wed 11:30-13:00', scheduleAr: 'الإثنين/الأربعاء 11:30-13:00', room: 'Lab 2', capacity: 30, enrolled: 18, semester: 3, isActive: true },
      { code: 'CS301', nameEn: 'Software Engineering', nameAr: 'هندسة البرمجيات', credits: 3, instructorEn: 'Dr. Mohamed', instructorAr: 'د. محمد', scheduleEn: 'Tue/Thu 10:00-11:30', scheduleAr: 'الثلاثاء/الخميس 10:00-11:30', room: 'Hall B', capacity: 35, enrolled: 15, semester: 4, isActive: true },
      { code: 'CS302', nameEn: 'Web Development', nameAr: 'تطوير الويب', credits: 3, instructorEn: 'Dr. Omar', instructorAr: 'د. عمر', scheduleEn: 'Sun/Tue 13:00-14:30', scheduleAr: 'الأحد/الثلاثاء 13:00-14:30', room: 'Lab 3', capacity: 25, enrolled: 12, semester: 4, isActive: true },
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

    console.log('Store seeded successfully')
  },
}

export default store
