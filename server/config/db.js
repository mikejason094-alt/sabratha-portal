import store from '../store.js'

let isConnected = false

export async function connectDB() {
  console.log('Initializing store...')
  await store.init()
  await store.seed()
  isConnected = true
  console.log('Store ready')
}

export function getDBStatus() {
  return isConnected
}

export async function waitForDB(timeoutMs = 30000) {
  return isConnected
}
