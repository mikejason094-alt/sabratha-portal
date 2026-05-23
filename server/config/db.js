import mongoose from 'mongoose'
import net from 'net'
import tls from 'tls'

let isConnected = false
let proxyServer = null

const SHARD_HOSTS = [
  'ac-o9zhfif-shard-00-00.fgrbzdr.mongodb.net:27017',
  'ac-o9zhfif-shard-00-01.fgrbzdr.mongodb.net:27017',
  'ac-o9zhfif-shard-00-02.fgrbzdr.mongodb.net:27017',
]
const ATLAS_USER = 'mikejason094_db_user'
const ATLAS_PASS = 'PfvF5qgSRBHmMd7j'
const ATLAS_DB = 'sabratha'
const ATLAS_AUTH_SOURCE = 'admin'

function maskURI(uri) {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')
}

// Create a TCP proxy that forwards to Atlas via our working tls.connect()
function createAtlasProxy(targetHost, targetPort) {
  const server = net.createServer((localSocket) => {
    console.log(`Proxy: local client connected, connecting to ${targetHost}:${targetPort}...`)

    // Use tls.connect() to reach Atlas (this WORKS)
    const remoteSocket = tls.connect({
      host: targetHost,
      port: targetPort,
      rejectUnauthorized: false,
    })

    remoteSocket.on('connect', () => {
      console.log('Proxy: TLS to Atlas established, bridging connections')
      localSocket.pipe(remoteSocket)
      remoteSocket.pipe(localSocket)
    })

    remoteSocket.on('error', (err) => {
      console.error(`Proxy: remote error: ${err.message}`)
      localSocket.destroy()
    })

    remoteSocket.on('end', () => localSocket.end())
    localSocket.on('error', () => remoteSocket.destroy())
    localSocket.on('end', () => remoteSocket.end())

    // Timeout
    remoteSocket.setTimeout(30000)
    remoteSocket.on('timeout', () => {
      console.error('Proxy: remote timeout')
      remoteSocket.destroy()
      localSocket.destroy()
    })
  })

  return server
}

export async function connectDB() {
  // Step 1: Start local proxy to Atlas (via working TLS)
  const targetHost = SHARD_HOSTS[0].split(':')[0]
  const targetPort = 27017
  const proxyPort = 27018 // local proxy port

  proxyServer = createAtlasProxy(targetHost, targetPort)

  await new Promise((resolve, reject) => {
    proxyServer.listen(proxyPort, '127.0.0.1', (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
  console.log(`Proxy listening on 127.0.0.1:${proxyPort} → ${targetHost}:${targetPort}`)

  // Step 2: Test the proxy with raw mongodb handshake
  const testSocket = net.connect(proxyPort, '127.0.0.1', () => {
    console.log('Proxy test: connected via localhost')
    testSocket.end()
  })
  testSocket.on('error', (err) => {
    console.error('Proxy test failed:', err.message)
  })

  // Step 3: Connect mongoose through the proxy (no TLS on driver side)
  const proxyUri = `mongodb://${ATLAS_USER}:${ATLAS_PASS}@127.0.0.1:${proxyPort}/${ATLAS_DB}?authSource=${ATLAS_AUTH_SOURCE}&serverSelectionTimeoutMS=15000&connectTimeoutMS=15000&retryWrites=false&directConnection=true`

  try {
    console.log(`Connecting Mongoose via proxy: ${maskURI(proxyUri)}`)

    mongoose.connection.on('connected', () => {
      isConnected = true
      console.log('MongoDB connected (via proxy)')
    })
    mongoose.connection.on('disconnected', () => { isConnected = false })
    mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message))

    await mongoose.connect(proxyUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 60000,
    })

    console.log('Mongoose initial connection established (via proxy)')
  } catch (error) {
    console.error(`Mongoose via proxy failed: ${error.message}`)
    // Fallback: try direct connect via Mongoose (proxy still running)
    console.log('Trying direct Mongoose connection...')
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        family: 4,
      })
      isConnected = true
      console.log('MongoDB connected directly')
    } catch (err) {
      console.error(`Direct Mongoose failed: ${err.message}`)
    }
  }
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
