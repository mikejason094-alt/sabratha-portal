import mongoose from 'mongoose'

let isConnected = false

export async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.warn('MONGODB_URI not set — running without database')
    return
  }
  const masked = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')
  console.log(`MONGODB_URI: ${masked}`)
  try {
    mongoose.connection.on('connected', () => { isConnected = true; console.log('MongoDB connected') })
    mongoose.connection.on('disconnected', () => { isConnected = false })
    mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message))

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 60000,
    })

    console.log('Mongoose initial connection established')
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`)
    console.warn('Server will start without database')
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
