import store from '../store.js'

let isConnected = false

export async function connectDB() {
  console.log('Starting in-memory database...')
  await store.seed()
  isConnected = true
  console.log('In-memory database ready')
}

export function getDBStatus() {
  return isConnected
}

export async function waitForDB(timeoutMs = 30000) {
  return isConnected
}
