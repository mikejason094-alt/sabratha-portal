import mongoose from 'mongoose'
import { MongoClient } from 'mongodb'
import net from 'net'
import tls from 'tls'

let isConnected = false

const SHARD_HOSTS = [
  'ac-o9zhfif-shard-00-00.fgrbzdr.mongodb.net:27017',
  'ac-o9zhfif-shard-00-01.fgrbzdr.mongodb.net:27017',
  'ac-o9zhfif-shard-00-02.fgrbzdr.mongodb.net:27017',
]
const REPLICA_SET = 'atlas-10vmuy-shard-0'

function maskURI(uri) {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')
}

// Try to connect with TLS options that match our working tls.connect() test
async function tryMongoConnect(uri) {
  const opts = {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 60000,
    family: 4,
    tls: true,
    tlsInsecure: true,
    directConnection: true,
  }
  const client = new MongoClient(uri, opts)
  await client.connect()
  return client
}

function buildFallbackURI(originalUri) {
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

  // Network diagnostics
  try {
    console.log('--- Running network diagnostics ---')
    const socket = tls.connect({ host: SHARD_HOSTS[0].split(':')[0], port: 27017, rejectUnauthorized: false })
    await new Promise((resolve, reject) => {
      socket.setTimeout(10000)
      socket.on('connect', resolve)
      socket.on('error', reject)
      socket.on('timeout', () => reject(new Error('timeout')))
    })
    socket.destroy()
    console.log('Raw TLS to Atlas shard: OK')
  } catch (e) {
    console.log(`Raw TLS to Atlas shard: FAILED (${e.message})`)
  }
  console.log('--- End ---')

  // Build URIs to try
  const urisToTry = [uri]

  if (uri.startsWith('mongodb+srv://')) {
    try {
      const { resolveSrv, resolveTxt } = await import('node:dns/promises')
      const url = new URL(uri.replace('mongodb+srv://', 'mongodb://'))
      const srvRecords = await resolveSrv(`_mongodb._tcp.${url.hostname}`)
      let txtRecord = ''
      try { const r = await resolveTxt(url.hostname); txtRecord = r.flat().join('') } catch (_) {}
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
      console.log(`Converted URI: ${maskURI(stdUri)}`)
      urisToTry.unshift(stdUri)
    } catch (err) {
      console.warn(`SRV conversion failed: ${err.message}`)
    }
    const fallback = buildFallbackURI(uri)
    if (fallback) {
      console.log(`Fallback URI: ${maskURI(fallback)}`)
      urisToTry.push(fallback)
    }
  }

  // Try each URI: first with raw MongoClient, then fallback to mongoose
  for (const tryUri of urisToTry) {
    // Try raw MongoDB driver first (bypasses Mongoose)
    try {
      console.log(`Trying MongoClient with: ${maskURI(tryUri)}`)
      const client = await tryMongoConnect(tryUri)
      console.log('MongoClient connected!')
      // Now initialize Mongoose using the same connection
      await mongoose.connect(tryUri, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        family: 4,
        tls: true,
        tlsInsecure: true,
      })
      await client.close()
      isConnected = true
      console.log('MongoDB connected (via Mongoose)')
      return
    } catch (error) {
      console.error(`MongoClient failed with ${maskURI(tryUri)}: ${error.message}`)
    }

    // Fallback: try mongoose directly
    try {
      console.log(`Trying Mongoose with: ${maskURI(tryUri)}`)
      mongoose.connection.on('connected', () => { isConnected = true; console.log('MongoDB connected') })
      mongoose.connection.on('disconnected', () => { isConnected = false })
      await mongoose.connect(tryUri, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        family: 4,
        tls: true,
        tlsInsecure: true,
      })
      console.log('Mongoose connected')
      return
    } catch (error) {
      console.error(`Mongoose failed with ${maskURI(tryUri)}: ${error.message}`)
      try { await mongoose.disconnect() } catch (_) {}
    }
  }

  console.warn('All MongoDB connection attempts failed.')
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
