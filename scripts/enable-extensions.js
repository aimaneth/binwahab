const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  
  try {
    // Create extensions schema if it doesn't exist
    await prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS extensions;`
    
    // Enable required extensions
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;`
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;`
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA extensions;`
    
    console.log('Extensions enabled successfully')
  } catch (error) {
    console.error('Error enabling extensions:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 