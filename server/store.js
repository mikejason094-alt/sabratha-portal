import PGStore from './pgstore.js'

const dbUrl = process.env.DATABASE_URL

let store

if (dbUrl) {
  console.log('Using PostgreSQL store')
  store = new PGStore(dbUrl)
} else {
  console.log('Using in-memory store (DATABASE_URL not set)')
  const { default: MemStore } = await import('./memstore.js')
  store = new MemStore()
}

export default store
