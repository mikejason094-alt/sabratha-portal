import pkg from 'pg'
const { Pool } = pkg

let idCounter = Date.now()
function newId() { return String(++idCounter) }

function buildQueryJson(query) {
  const entries = {}
  for (const [key, val] of Object.entries(query)) {
    if (val && typeof val === 'object' && '$in' in val) {
      // $in handled separately
      continue
    }
    entries[key] = val
  }
  return entries
}

function buildWhereClause(query, paramIndex) {
  const clauses = []
  const params = []
  let idx = paramIndex

  for (const [key, val] of Object.entries(query)) {
    if (val && typeof val === 'object' && '$in' in val) {
      const placeholders = val.$in.map((_, i) => `$${idx + i + 1}`).join(',')
      clauses.push(`data->>'${key}' IN (${placeholders})`)
      params.push(...val.$in.map(String))
      idx += val.$in.length
    } else {
      clauses.push(`data @> $${idx + 1}::jsonb`)
      params.push(JSON.stringify({ [key]: val }))
      idx++
    }
  }
  return { clauses, params, nextIdx: idx }
}

class Collection {
  constructor(pool, name) {
    this.pool = pool
    this.name = name
    this.docs = [] // mirror for findOne fast-path
  }

  async _init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        collection VARCHAR(100) NOT NULL,
        doc_id VARCHAR(100) NOT NULL,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(collection, doc_id)
      )
    `)
    await this.pool.query('CREATE INDEX IF NOT EXISTS idx_docs_collection ON documents(collection)')
    await this.pool.query('CREATE INDEX IF NOT EXISTS idx_docs_gin ON documents USING gin(data)')
  }

  async _loadAll() {
    const result = await this.pool.query(
      'SELECT doc_id, data FROM documents WHERE collection = $1', [this.name]
    )
    this.docs = result.rows.map(r => ({ ...r.data, _id: r.doc_id }))
  }

  _wrapDoc(data) {
    const doc = { ...data }
    if (this.name === 'users') {
      doc.toObject = () => { const { password, ...rest } = doc; return rest }
    } else {
      doc.toObject = () => ({ ...doc })
    }
    return doc
  }

  async _save(doc) {
    await this.pool.query(`
      INSERT INTO documents (collection, doc_id, data, created_at, updated_at)
      VALUES ($1, $2, $3::jsonb, $4, $4)
      ON CONFLICT (collection, doc_id)
      DO UPDATE SET data = $3::jsonb, updated_at = NOW()
    `, [this.name, doc._id, JSON.stringify(doc), new Date().toISOString()])
  }

  async findOne(query) {
    const q = buildWhereClause(query, 1)
    let result
    if (q.clauses.length === 0) {
      result = await this.pool.query('SELECT data FROM documents WHERE collection = $1 LIMIT 1', [this.name])
    } else {
      const sql = `SELECT data FROM documents WHERE collection = $${q.nextIdx + 1} AND ${q.clauses.join(' AND ')} LIMIT 1`
      result = await this.pool.query(sql, [...q.params, this.name])
    }
    if (!result.rows[0]) return null
    return this._wrapDoc(result.rows[0].data)
  }

  async findById(id) { return this.findOne({ _id: id }) }

  find(query = {}) {
    const self = this
    const q = buildWhereClause(query, 1)
    const sql = q.clauses.length === 0
      ? `SELECT data, doc_id FROM documents WHERE collection = $${q.nextIdx + 1}`
      : `SELECT data, doc_id FROM documents WHERE collection = $${q.nextIdx + 1} AND ${q.clauses.join(' AND ')}`

    const params = [...q.params, this.name]
    let sortField = null, sortDir = 1

    const qObj = {
      _promise: null,
      sort(sortObj) {
        const field = Object.keys(sortObj)[0]
        sortField = field
        sortDir = sortObj[field]
        return this
      },
      then(resolve) {
        if (!this._promise) this._promise = self._execFind(sql, params, sortField, sortDir)
        return this._promise.then(resolve)
      },
      async exec() {
        if (!this._promise) this._promise = self._execFind(sql, params, sortField, sortDir)
        return this._promise
      },
    }
    return qObj
  }

  async _execFind(sql, params, sortField, sortDir) {
    const result = await this.pool.query(sql, params)
    let docs = result.rows.map(r => {
      const doc = this._wrapDoc(r.data)
      doc._id = r.doc_id
      return doc
    })
    if (sortField) {
      docs.sort((a, b) => {
        const av = a[sortField] ?? '', bv = b[sortField] ?? ''
        if (av < bv) return -1 * sortDir
        if (av > bv) return 1 * sortDir
        return 0
      })
    }
    return docs
  }

  async insertOne(data) {
    const doc = { ...data, _id: newId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    if (this.name === 'users') {
      doc.toObject = () => { const { password, ...rest } = doc; return rest }
    } else {
      doc.toObject = () => ({ ...doc })
    }
    await this._save(doc)
    this.docs.push(doc)
    return doc
  }

  async insertMany(arr) {
    const results = []
    for (const data of arr) results.push(await this.insertOne(data))
    return results
  }

  async create(data) { return this.insertOne(data) }

  async deleteOne(query) {
    const q = buildWhereClause(query, 1)
    if (q.clauses.length === 0) return { deletedCount: 0 }
    const sql = `DELETE FROM documents WHERE collection = $${q.nextIdx + 1} AND ${q.clauses.join(' AND ')}`
    const result = await this.pool.query(sql, [...q.params, this.name])
    this.docs = this.docs.filter(d => {
      for (const [k, v] of Object.entries(query)) {
        if (d[k] !== v) return true
      }
      return false
    })
    return { deletedCount: result.rowCount }
  }

  async saveDoc(doc) {
    await this._save(doc)
    const idx = this.docs.findIndex(d => d._id === doc._id)
    if (idx >= 0) this.docs[idx] = doc
  }
}

export default class PGStore {
  constructor(connectionString) {
    this.pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
    this.users = new Collection(this.pool, 'users')
    this.students = new Collection(this.pool, 'students')
    this.semesters = new Collection(this.pool, 'semesters')
    this.courses = new Collection(this.pool, 'courses')
    this.lectures = new Collection(this.pool, 'lectures')
    this.news = new Collection(this.pool, 'news')
    this.enrollments = new Collection(this.pool, 'enrollments')
    this.lectureRegistrations = new Collection(this.pool, 'lectureRegistrations')
    this.exams = new Collection(this.pool, 'exams')
    this.courseGrades = new Collection(this.pool, 'courseGrades')
  }

  async init() {
    for (const col of Object.values(this).filter(v => v instanceof Collection)) {
      await col._init()
    }
  }

  async seed() {
    const existing = await this.users.findOne({ email: 'islam.alhawwari@sits.edu.ly' })
    if (existing) { console.log('DB already seeded'); return }

    console.log('Seeding PostgreSQL data...')
    const bcrypt = (await import('bcryptjs')).default
    const studentPw = await bcrypt.hash('student123', 12)
    const teacherPw = await bcrypt.hash('teacher123', 12)

    // Student
    await this.users.insertOne({ email: 'islam.alhawwari@sits.edu.ly', password: studentPw, role: 'student', studentId: 'STU-2024-001', isActive: true })
    await this.students.insertOne({ studentId: 'STU-2024-001', nameEn: 'Islam Almuneer Alhawwari', nameAr: 'إسلام المنير الحواري', email: 'islam.alhawwari@sits.edu.ly', department: 'Software Engineering', departmentAr: 'هندسة البرمجيات', enrollmentYear: 2024, currentSemester: 3, gpa: 3.45, totalCredits: 42 })

    // Teachers
    const t1 = await this.users.insertOne({ email: 'ahmed.hassan@sits.edu.ly', password: teacherPw, role: 'teacher', nameEn: 'Dr. Ahmed', nameAr: 'د. أحمد', department: 'Software Engineering', departmentAr: 'هندسة البرمجيات', isActive: true })
    const t2 = await this.users.insertOne({ email: 'sara.ali@sits.edu.ly', password: teacherPw, role: 'teacher', nameEn: 'Dr. Sara', nameAr: 'د. سارة', department: 'Software Engineering', departmentAr: 'هندسة البرمجيات', isActive: true })
    const t3 = await this.users.insertOne({ email: 'khalid.omar@sits.edu.ly', password: teacherPw, role: 'teacher', nameEn: 'Dr. Khalid', nameAr: 'د. خالد', department: 'Mathematics', departmentAr: 'الرياضيات', isActive: true })
    const t4 = await this.users.insertOne({ email: 'mohamed.ali@sits.edu.ly', password: teacherPw, role: 'teacher', nameEn: 'Dr. Mohamed', nameAr: 'د. محمد', department: 'Software Engineering', departmentAr: 'هندسة البرمجيات', isActive: true })
    const t5 = await this.users.insertOne({ email: 'omar.hassan@sits.edu.ly', password: teacherPw, role: 'teacher', nameEn: 'Dr. Omar', nameAr: 'د. عمر', department: 'Software Engineering', departmentAr: 'هندسة البرمجيات', isActive: true })

    await this.semesters.insertMany([
      { studentId: 'STU-2024-001', semesterNumber: 1, nameEn: 'First Semester', nameAr: 'الفصل الدراسي الأول', year: '2024', status: 'completed', gpa: 3.2, credits: 15, courses: [{ code: 'CS101', nameEn: 'Introduction to Programming', nameAr: 'مقدمة في البرمجة', credits: 3, grade: 'B+', points: 3.3 }, { code: 'MATH101', nameEn: 'Calculus I', nameAr: 'التفاضل والتكامل I', credits: 3, grade: 'A-', points: 3.7 }] },
      { studentId: 'STU-2024-001', semesterNumber: 2, nameEn: 'Second Semester', nameAr: 'الفصل الدراسي الثاني', year: '2024', status: 'completed', gpa: 3.5, credits: 15, courses: [{ code: 'CS102', nameEn: 'Object-Oriented Programming', nameAr: 'البرمجة كائنية التوجه', credits: 3, grade: 'A', points: 4.0 }, { code: 'MATH102', nameEn: 'Calculus II', nameAr: 'التفاضل والتكامل II', credits: 3, grade: 'B+', points: 3.3 }] },
      { studentId: 'STU-2024-001', semesterNumber: 3, nameEn: 'Third Semester', nameAr: 'الفصل الدراسي الثالث', year: '2025', status: 'in-progress', gpa: null, credits: 12, courses: [{ code: 'CS201', nameEn: 'Data Structures', nameAr: 'هياكل البيانات', credits: 3, grade: null, points: null }, { code: 'CS202', nameEn: 'Database Systems', nameAr: 'أنظمة قواعد البيانات', credits: 3, grade: null, points: null }] },
    ])

    const courses = await this.courses.insertMany([
      { code: 'CS101', nameEn: 'Introduction to Programming', nameAr: 'مقدمة في البرمجة', credits: 3, instructorEn: 'Dr. Ahmed', instructorAr: 'د. أحمد', teacherId: t1._id, scheduleEn: 'Sun/Tue 10:00-11:30', scheduleAr: 'الأحد/الثلاثاء 10:00-11:30', room: 'Lab 1', capacity: 30, enrolled: 25, semester: 1, isActive: true },
      { code: 'CS102', nameEn: 'Object-Oriented Programming', nameAr: 'البرمجة كائنية التوجه', credits: 3, instructorEn: 'Dr. Sara', instructorAr: 'د. سارة', teacherId: t2._id, scheduleEn: 'Mon/Wed 10:00-11:30', scheduleAr: 'الإثنين/الأربعاء 10:00-11:30', room: 'Lab 2', capacity: 30, enrolled: 22, semester: 2, isActive: true },
      { code: 'MATH101', nameEn: 'Calculus I', nameAr: 'التفاضل والتكامل I', credits: 3, instructorEn: 'Dr. Khalid', instructorAr: 'د. خالد', teacherId: t3._id, scheduleEn: 'Sun/Tue 08:30-10:00', scheduleAr: 'الأحد/الثلاثاء 08:30-10:00', room: 'Hall A', capacity: 50, enrolled: 45, semester: 1, isActive: true },
      { code: 'MATH102', nameEn: 'Calculus II', nameAr: 'التفاضل والتكامل II', credits: 3, instructorEn: 'Dr. Khalid', instructorAr: 'د. خالد', teacherId: t3._id, scheduleEn: 'Mon/Wed 08:30-10:00', scheduleAr: 'الإثنين/الأربعاء 08:30-10:00', room: 'Hall A', capacity: 50, enrolled: 40, semester: 2, isActive: true },
      { code: 'CS201', nameEn: 'Data Structures', nameAr: 'هياكل البيانات', credits: 3, instructorEn: 'Dr. Ahmed', instructorAr: 'د. أحمد', teacherId: t1._id, scheduleEn: 'Sun/Tue 11:30-13:00', scheduleAr: 'الأحد/الثلاثاء 11:30-13:00', room: 'Lab 1', capacity: 30, enrolled: 20, semester: 3, isActive: true },
      { code: 'CS202', nameEn: 'Database Systems', nameAr: 'أنظمة قواعد البيانات', credits: 3, instructorEn: 'Dr. Sara', instructorAr: 'د. سارة', teacherId: t2._id, scheduleEn: 'Mon/Wed 11:30-13:00', scheduleAr: 'الإثنين/الأربعاء 11:30-13:00', room: 'Lab 2', capacity: 30, enrolled: 18, semester: 3, isActive: true },
      { code: 'CS301', nameEn: 'Software Engineering', nameAr: 'هندسة البرمجيات', credits: 3, instructorEn: 'Dr. Mohamed', instructorAr: 'د. محمد', teacherId: t4._id, scheduleEn: 'Tue/Thu 10:00-11:30', scheduleAr: 'الثلاثاء/الخميس 10:00-11:30', room: 'Hall B', capacity: 35, enrolled: 15, semester: 4, isActive: true },
      { code: 'CS302', nameEn: 'Web Development', nameAr: 'تطوير الويب', credits: 3, instructorEn: 'Dr. Omar', instructorAr: 'د. عمر', teacherId: t5._id, scheduleEn: 'Sun/Tue 13:00-14:30', scheduleAr: 'الأحد/الثلاثاء 13:00-14:30', room: 'Lab 3', capacity: 25, enrolled: 12, semester: 4, isActive: true },
    ])

    await this.lectures.insertMany([
      { courseCode: 'CS101', courseEn: 'Introduction to Programming', courseAr: 'مقدمة في البرمجة', day: 'sunday', dayEn: 'Sunday', dayAr: 'الأحد', time: '10:00-11:30', room: 'Lab 1', instructorEn: 'Dr. Ahmed', instructorAr: 'د. أحمد', isActive: true },
      { courseCode: 'CS101', courseEn: 'Introduction to Programming', courseAr: 'مقدمة في البرمجة', day: 'tuesday', dayEn: 'Tuesday', dayAr: 'الثلاثاء', time: '10:00-11:30', room: 'Lab 1', instructorEn: 'Dr. Ahmed', instructorAr: 'د. أحمد', isActive: true },
      { courseCode: 'CS201', courseEn: 'Data Structures', courseAr: 'هياكل البيانات', day: 'sunday', dayEn: 'Sunday', dayAr: 'الأحد', time: '11:30-13:00', room: 'Lab 1', instructorEn: 'Dr. Ahmed', instructorAr: 'د. أحمد', isActive: true },
      { courseCode: 'CS201', courseEn: 'Data Structures', courseAr: 'هياكل البيانات', day: 'tuesday', dayEn: 'Tuesday', dayAr: 'الثلاثاء', time: '11:30-13:00', room: 'Lab 1', instructorEn: 'Dr. Ahmed', instructorAr: 'د. أحمد', isActive: true },
      { courseCode: 'CS202', courseEn: 'Database Systems', courseAr: 'أنظمة قواعد البيانات', day: 'monday', dayEn: 'Monday', dayAr: 'الإثنين', time: '11:30-13:00', room: 'Lab 2', instructorEn: 'Dr. Sara', instructorAr: 'د. سارة', isActive: true },
      { courseCode: 'CS202', courseEn: 'Database Systems', courseAr: 'أنظمة قواعد البيانات', day: 'wednesday', dayEn: 'Wednesday', dayAr: 'الأربعاء', time: '11:30-13:00', room: 'Lab 2', instructorEn: 'Dr. Sara', instructorAr: 'د. سارة', isActive: true },
      { courseCode: 'MATH101', courseEn: 'Calculus I', courseAr: 'التفاضل والتكامل I', day: 'sunday', dayEn: 'Sunday', dayAr: 'الأحد', time: '08:30-10:00', room: 'Hall A', instructorEn: 'Dr. Khalid', instructorAr: 'د. خالد', isActive: true },
      { courseCode: 'MATH101', courseEn: 'Calculus I', courseAr: 'التفاضل والتكامل I', day: 'tuesday', dayEn: 'Tuesday', dayAr: 'الثلاثاء', time: '08:30-10:00', room: 'Hall A', instructorEn: 'Dr. Khalid', instructorAr: 'د. خالد', isActive: true },
    ])

    await this.news.insertMany([
      { titleEn: 'Welcome to the New Academic Year', titleAr: 'مرحباً بكم في العام الدراسي الجديد', summaryEn: 'The new academic year 2025-2026 has begun with exciting updates.', summaryAr: 'بدأ العام الدراسي الجديد 2025-2026 مع تحديثات مثيرة.', contentEn: 'We are pleased to announce the start of the new academic year 2025-2026. Students can now view their schedules and enroll in courses through the student portal.', contentAr: 'يسرنا الإعلان عن بدء العام الدراسي الجديد 2025-2026. يمكن للطلاب الآن الاطلاع على جداولهم والتسجيل في المقررات الدراسية من خلال بوابة الطالب.', category: 'announcement', date: new Date().toISOString(), image: null, author: 'Admin', isPublished: true },
      { titleEn: 'Software Engineering Workshop', titleAr: 'ورشة هندسة البرمجيات', summaryEn: 'A hands-on workshop on modern software engineering practices.', summaryAr: 'ورشة عملية حول ممارسات هندسة البرمجيات الحديثة.', contentEn: 'The department is organizing a two-day workshop on software engineering best practices including agile methodologies, version control, and CI/CD pipelines.', contentAr: 'ينظم القسم ورشة عمل لمدة يومين حول أفضل ممارسات هندسة البرمجيات بما في ذلك المنهجيات الرشيقة والتحكم في الإصدارات وخطوط أنابيب CI/CD.', category: 'event', date: new Date().toISOString(), image: null, author: 'Academic Affairs', isPublished: true },
    ])

    // Sample exams
    await this.exams.insertMany([
      { courseId: courses[0]._id, titleEn: 'Midterm Exam', titleAr: 'امتحان منتصف الفصل', date: '2025-04-15', time: '10:00', duration: 120, room: 'Hall A', maxScore: 100, type: 'midterm', createdBy: t1._id },
      { courseId: courses[4]._id, titleEn: 'Quiz 1', titleAr: 'اختبار قصير 1', date: '2025-03-20', time: '11:00', duration: 30, room: 'Lab 1', maxScore: 20, type: 'quiz', createdBy: t1._id },
      { courseId: courses[5]._id, titleEn: 'Final Exam', titleAr: 'الامتحان النهائي', date: '2025-06-10', time: '09:00', duration: 180, room: 'Hall B', maxScore: 150, type: 'final', createdBy: t2._id },
    ])

    // Sample course grades
    await this.courseGrades.insertMany([
      { courseId: courses[0]._id, studentId: 'STU-2024-001', semesterNumber: 1, grade: 'B+', points: 3.3, updatedBy: t1._id },
      { courseId: courses[2]._id, studentId: 'STU-2024-001', semesterNumber: 1, grade: 'A-', points: 3.7, updatedBy: t3._id },
      { courseId: courses[1]._id, studentId: 'STU-2024-001', semesterNumber: 2, grade: 'A', points: 4.0, updatedBy: t2._id },
      { courseId: courses[3]._id, studentId: 'STU-2024-001', semesterNumber: 2, grade: 'B+', points: 3.3, updatedBy: t3._id },
    ])

    console.log('PostgreSQL seeded successfully')
  }
}
