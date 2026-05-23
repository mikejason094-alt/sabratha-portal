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
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 })
    isConnected = true
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`)
    console.error('Connection string host:', uri.split('@')[1]?.split('/')[0] || 'unknown')
    console.warn('Server will start without database')
  }
}

export function getDBStatus() {
  return isConnected
}
