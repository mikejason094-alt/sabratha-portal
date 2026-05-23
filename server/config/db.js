import mongoose from 'mongoose'
import net from 'net'
import tls from 'tls'

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

// Test raw TCP connectivity to a host:port
async function testTCP(host, port, timeout = 15000) {
  return new Promise((resolve) => {
    const start = Date.now()
    const socket = new net.Socket()
    socket.setTimeout(timeout)
    socket.on('connect', () => {
      socket.destroy()
      resolve({ ok: true, ms: Date.now() - start })
    })
    socket.on('error', (err) => {
      socket.destroy()
      resolve({ ok: false, error: err.message, ms: Date.now() - start })
    })
    socket.on('timeout', () => {
      socket.destroy()
      resolve({ ok: false, error: 'timeout', ms: Date.now() - start })
    })
    socket.connect(port, host)
  })
}

// Test TLS connectivity to a host:port (after TCP)
async function testTLS(host, port, timeout = 15000) {
  return new Promise((resolve) => {
    const start = Date.now()
    const socket = new tls.TLSSocket(new net.Socket(), {
      rejectUnauthorized: false,
      requestCert: false,
    })
    socket.setTimeout(timeout)
    socket.on('connect', () => {
      // Wait briefly for TLS handshake to complete
      setTimeout(() => {
        socket.destroy()
        resolve({ ok: true, ms: Date.now() - start, authorized: socket.authorized })
      }, 2000)
    })
    socket.on('error', (err) => {
      socket.destroy()
      resolve({ ok: false, error: err.message, ms: Date.now() - start })
    })
    socket.on('timeout', () => {
      socket.destroy()
      resolve({ ok: false, error: 'timeout', ms: Date.now() - start })
    })
    socket.connect(port, host)
  })
}

function buildFallbackURI(originalUri) {
  try {
    const u = new URL(originalUri.replace('mongodb+srv://', 'mongodb://'))
    const userPass = u.username && u.password ? `${u.username}:${u.password}` : ''
    const dbName = u.pathname.replace('/', '') || ''
    const originalParams = u.searchParams.toString()
    const params = new URLSearchParams(originalParams)
    if (!params.has('ssl')) params.set('ssl', 'true')
    if (!params.has('tlsInsecure')) params.set('tlsInsecure', 'true')
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

  // ========== NETWORK DIAGNOSTICS ==========
  console.log('--- Running network diagnostics ---')
  // Test general internet connectivity
  const googleTCP = await testTCP('google.com', 443)
  console.log(`TCP google.com:443: ${googleTCP.ok ? 'OK' : 'FAIL'} (${googleTCP.ms}ms${googleTCP.error ? ', error: ' + googleTCP.error : ''})`)

  if (googleTCP.ok) {
    const googleTLS = await testTLS('google.com', 443)
    console.log(`TLS google.com:443: ${googleTLS.ok ? 'OK' : 'FAIL'} (${googleTLS.ms}ms${googleTLS.error ? ', error: ' + googleTLS.error : ''})`)
  }

  // Test Atlas shard connectivity
  for (const host of SHARD_HOSTS) {
    const [h, p] = host.split(':')
    const tcpResult = await testTCP(h, parseInt(p))
    console.log(`TCP ${h}:${p}: ${tcpResult.ok ? 'OK' : 'FAIL'} (${tcpResult.ms}ms${tcpResult.error ? ', error: ' + tcpResult.error : ''})`)
    if (tcpResult.ok) {
      const tlsResult = await testTLS(h, parseInt(p))
      console.log(`TLS ${h}:${p}: ${tlsResult.ok ? 'OK' : 'FAIL'} (${tlsResult.ms}ms${tlsResult.error ? ', error: ' + tlsResult.error : ''})`)
    }
  }
  console.log('--- End of network diagnostics ---')
  // ==========================================

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
      urisToTry.unshift(stdUri)
    } catch (err) {
      console.warn(`SRV resolution failed: ${err.message}`)
    }

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
        serverSelectionTimeoutMS: 120000,
        connectTimeoutMS: 120000,
        socketTimeoutMS: 120000,
        family: 4,
        tlsInsecure: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
      })

      console.log('Mongoose initial connection established')
      return
    } catch (error) {
      console.error(`Connection failed with URI ${maskURI(tryUri)}: ${error.message}`)
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