import mongoose from 'mongoose'

let isConnected = false

// Hardcoded shard hosts from the Atlas SRV resolution (fallback if DNS fails)
const SHARD_HOSTS = [
  'ac-o9zhfif-shard-00-00.fgrbzdr.mongodb.net:27017',
  'ac-o9zhfif-shard-00-01.fgrbzdr.mongodb.net:27017',
  'ac-o9zhfif-shard-00-02.fgrbzdr.mongodb.net:27017',
]
const REPLICA_SET = 'atlas-10vmuy-shard-0'

function maskURI(uri) {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')
}

function buildFallbackURI(originalUri) {
  // Extract user:pass and dbName from original SRV URI
  try {
    const u = new URL(originalUri.replace('mongodb+srv://', 'mongodb://'))
    const userPass = u.username && u.password ? `${u.username}:${u.password}` : ''
    const dbName = u.pathname.replace('/', '') || ''
    const originalParams = u.searchParams.toString()
    const params = new URLSearchParams(originalParams)
    if (!params.has('ssl')) params.set('ssl', 'true')
    if (!params.has('replicaSet')) params.set('replicaSet', REPLICA_SET)
    if (!params.has('authSource')) params.set('authSource', 'admin')
    if (!params.has('retryWrites')) params.set('retryWrites', 'true')
    const auth = userPass ? `${userPass}@` : ''
    return `mongodb://${auth}${SHARD_HOSTS.join(',')}/${dbName}?${params.toString()}`
  } catch {
    return null
  }
}

export async function connectDB() {
  let uri = process.env.MONGODB_URI
  if (!uri) {
    console.warn('MONGODB_URI not set — running without database')
    return
  }
  console.log(`MONGODB_URI: ${maskURI(uri)}`)

  // Try 3 URI strategies in order:
  const urisToTry = [uri]

  // 1. If SRV, try converting via DNS resolution
  if (uri.startsWith('mongodb+srv://')) {
    try {
      const { resolveSrv, resolveTxt } = await import('node:dns/promises')
      const url = new URL(uri.replace('mongodb+srv://', 'mongodb://'))
      const hostname = url.hostname
      const srvRecords = await resolveSrv(`_mongodb._tcp.${hostname}`)
      let txtRecord = ''
      try {
        const txtResults = await resolveTxt(hostname)
        txtRecord = txtResults.flat().join('')
      } catch (_) { /* optional */ }
      const hosts = srvRecords.map(r => `${r.name}:${r.port}`).join(',')
      const userPass = url.username && url.password ? `${url.username}:${url.password}@` : ''
      const dbName = url.pathname.replace('/', '')
      const params = new URLSearchParams(url.searchParams.toString())
      if (txtRecord) {
        const txtParams = new URLSearchParams(txtRecord)
        for (const [k, v] of txtParams) { if (!params.has(k)) params.set(k, v) }
      }
      if (!params.has('ssl')) params.set('ssl', 'true')
      if (!params.has('authSource')) params.set('authSource', 'admin')
      const stdUri = `mongodb://${userPass}${hosts}/${dbName}?${params.toString()}`
      console.log(`Converted to standard URI: ${maskURI(stdUri)}`)
      urisToTry.unshift(stdUri) // prefer the resolved URI
    } catch (err) {
      console.warn(`SRV resolution failed: ${err.message}`)
    }

    // 2. Hardcoded fallback (skip DNS entirely)
    const fallback = buildFallbackURI(uri)
    if (fallback) {
      console.log(`Hardcoded fallback URI: ${maskURI(fallback)}`)
      urisToTry.push(fallback)
    }
  }

  // Try each URI with connection options
  for (const tryUri of urisToTry) {
    try {
      mongoose.connection.on('connected', () => { isConnected = true; console.log('MongoDB connected') })
      mongoose.connection.on('disconnected', () => { isConnected = false })
      mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message))

      await mongoose.connect(tryUri, {
        serverSelectionTimeoutMS: 60000,
        connectTimeoutMS: 60000,
        socketTimeoutMS: 120000,
        family: 4,
      })

      console.log('Mongoose initial connection established')
      return // success!
    } catch (error) {
      console.error(`Connection failed with URI ${maskURI(tryUri)}: ${error.message}`)
      // Disconnect before trying next URI
      try { await mongoose.disconnect() } catch (_) {}
    }
  }

  console.warn('All MongoDB connection attempts failed. Server will start without database.')
}

export function getDBStatus() {
  return mongoose.connection.readyState === 1
}

export async function waitForDB(timeoutMs = 30000) {
  if (getDBStatus()) return true
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), timeoutMs)
    mongoose.connection.once('connected', () => {
      clearTimeout(timeout)
      resolve(true)
    })
  })
}