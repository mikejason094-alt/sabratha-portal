import mongoose from 'mongoose'

let isConnected = false

export async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.warn('MONGODB_URI not set — running without database')
    return
  }
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    isConnected = true
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`)
    console.warn('Server will start without database — API endpoints will return errors')
  }
}

export function getDBStatus() {
  return isConnected
}
