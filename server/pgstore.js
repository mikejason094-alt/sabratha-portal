import pkg from 'pg'
const { Pool } = pkg

let idCounter = Date.now()
function newId() { return String(++idCounter) }

function matchQuery(obj, query) {
  for (const [key, val] of Object.entries(query)) {
    if (key === '_id') { if (obj._id !== val) return false }
    else if (val && typeof val === 'object' && '$in' in val) { if (!val.$in.includes(obj[key])) return false }
    else { if (obj[key] !== val) return false }
  }
  return true
}

class Collection {
  constructor(pool, name) {
    this.pool = pool
    this.name = name
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
  }

  async _allDocs() {
    const result = await this.pool.query(
      'SELECT doc_id, data FROM documents WHERE collection = $1 ORDER BY id',
      [this.name]
    )
    return result.rows.map(r => ({ ...r.data, _id: r.doc_id }))
  }

  _wrapDoc(doc) {
    if (this.name === 'users' && doc) {
      doc.toObject = () => { const { password, ...rest } = doc; return rest }
    } else if (doc) {
      doc.toObject = () => ({ ...doc })
    }
    return doc
  }

  async _save(doc) {
    await this.pool.query(`
      INSERT INTO documents (collection, doc_id, data, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $4)
      ON CONFLICT (collection, doc_id)
      DO UPDATE SET data = $3, updated_at = NOW()
    `, [this.name, doc._id, doc, new Date().toISOString()])
  }

  async findOne(query) {
    if (query._id) {
      const result = await this.pool.query(
        'SELECT data FROM documents WHERE collection = $1 AND doc_id = $2 LIMIT 1',
        [this.name, query._id]
      )
      if (!result.rows[0]) return null
      return this._wrapDoc({ ...result.rows[0].data, _id: result.rows[0].data._id || query._id })
    }
    // For non-_id queries, load all and filter in JS
    const docs = await this._allDocs()
    for (const doc of docs) {
      if (matchQuery(doc, query)) return this._wrapDoc(doc)
    }
    return null
  }

  async findById(id) { return this.findOne({ _id: id }) }

  async find(query = {}) {
    const docs = await this._allDocs()
    const results = docs.filter(d => matchQuery(d, query))
    results.forEach(d => this._wrapDoc(d))
    const q = { _results: results }
    q.sort = function (sortObj) {
      const field = Object.keys(sortObj)[0]
      const dir = sortObj[field]
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

  async insertOne(data) {
    const doc = { ...data, _id: newId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    this._wrapDoc(doc)
    await this._save(doc)
    return doc
  }

  async insertMany(arr) {
    const results = []
    for (const data of arr) results.push(await this.insertOne(data))
    return results
  }

  async create(data) { return this.insertOne(data) }

  async deleteOne(query) {
    if (query._id) {
      const result = await this.pool.query(
        'DELETE FROM documents WHERE collection = $1 AND doc_id = $2',
        [this.name, query._id]
      )
      return { deletedCount: result.rowCount }
    }
    const docs = await this._allDocs()
    for (const doc of docs) {
      if (matchQuery(doc, query)) {
        await this.pool.query('DELETE FROM documents WHERE collection = $1 AND doc_id = $2', [this.name, doc._id])
        return { deletedCount: 1 }
      }
    }
    return { deletedCount: 0 }
  }

  async saveDoc(doc) {
    await this._save(doc)
  }

  async updateOne(query, updates) {
    const doc = await this.findOne(query)
    if (!doc) return null
    Object.assign(doc, updates, { updatedAt: new Date().toISOString() })
    await this._save(doc)
    return doc
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
    // Create the table once (first collection's _init creates it)
    await this.users._init()
  }

  async seed() {
    const bcrypt = (await import('bcryptjs')).default

    // Ensure admin exists
    const adminUser = await this.users.findOne({ email: 'admin@sits.edu.ly' })
    if (!adminUser) {
      console.log('Seeding admin account...')
      const adminPw = await bcrypt.hash('admin123', 12)
      await this.users.insertOne({ email: 'admin@sits.edu.ly', password: adminPw, role: 'admin', nameEn: 'System Admin', nameAr: 'مدير النظام', isActive: true })
      console.log('Admin seeded')
    }

    // Clean up any old seed data (non-admin users + all non-user collections)
    console.log('Cleaning up old seed data...')
    // Collect all non-user collection names
    const nonUserCollections = ['students', 'semesters', 'courses', 'lectures', 'news', 'enrollments', 'lectureRegistrations', 'exams', 'courseGrades']

    // Remove non-admin users
    const allUsers = await this.users.find({})
    for (const u of allUsers) {
      if (u.email !== 'admin@sits.edu.ly') {
        await this.users.deleteOne({ _id: u._id })
      }
    }

    // Clean all non-user collections
    for (const colName of nonUserCollections) {
      const col = this[colName]
      if (col) {
        const docs = await col.find({})
        for (const d of docs) {
          await col.deleteOne({ _id: d._id })
        }
      }
    }

    console.log('Cleanup complete. Only admin remains.')
  }
}

