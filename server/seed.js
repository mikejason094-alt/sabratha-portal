import 'dotenv/config'
import mongoose from 'mongoose'
import { seedDatabase } from './seedData.js'

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')
    await seedDatabase()
    await mongoose.disconnect()
    console.log('Seed complete')
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

seed()
