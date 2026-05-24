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
    const adminUser = this.users.findOne({ email: 'admin@sits.edu.ly' })
    if (!adminUser) {
      console.log('Seeding admin account...')
      const adminPw = await bcrypt.hash('admin123', 12)
      this.users.insertOne({ email: 'admin@sits.edu.ly', password: adminPw, role: 'admin', nameEn: 'System Admin', nameAr: 'مدير النظام', isActive: true })
      console.log('Admin seeded')
    }

    // Clean up any old seed data
    console.log('Cleaning up old seed data...')
    const nonUserCollections = ['students', 'semesters', 'courses', 'lectures', 'news', 'enrollments', 'lectureRegistrations', 'exams', 'courseGrades']

    const allUsers = this.users.find({})
    for (const u of allUsers) {
      if (u.email !== 'admin@sits.edu.ly') {
        this.users.deleteOne({ _id: u._id })
      }
    }

    for (const colName of nonUserCollections) {
      const col = this[colName]
      if (col) {
        const docs = col.find({})
        for (const d of docs) {
          col.deleteOne({ _id: d._id })
        }
      }
    }

    console.log('Cleanup complete. Only admin remains.')
  }
}
