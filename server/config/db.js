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

async function tryConnectSingle(host, port, dbName, user, pass) {
  const singleUri = `mongodb://${user}:${pass}@${host}:${port}/${dbName}?ssl=true&tlsInsecure=true&authSource=admin&directConnection=true&serverSelectionTimeoutMS=20000&connectTimeoutMS=20000&socketTimeoutMS=30000&retryWrites=false&compressors=`
  const client = new MongoClient(singleUri)
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

  // Extract username, password, dbName from original URI
  let userName = '', userPass = '', dbName = ''
  try {
    const u = new URL(uri.replace('mongodb+srv://', 'mongodb://'))
    userName = u.username
    userPass = u.password
    dbName = u.pathname.replace('/', '')
  } catch (_) {}

  // Strategy 1: Try single-shard direct connection (bypasses replica set discovery)
  for (const shard of SHARD_HOSTS) {
    const [host, port] = shard.split(':')
    try {
      console.log(`Trying single-shard direct: ${host}:${port}`)
      const client = await tryConnectSingle(host, parseInt(port), dbName, userName, userPass)
      // Success! Now connect mongoose to this single shard
      const singleUri = `mongodb://${userName}:${userPass}@${host}:${port}/${dbName}?ssl=true&authSource=admin`
      await mongoose.connect(singleUri, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        family: 4,
        tls: true,
        tlsInsecure: true,
      })
      await client.close()
      isConnected = true
      console.log('MongoDB connected!')
      return
    } catch (error) {
      console.error(`Single-shard ${shard} failed: ${error.message}`)
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
