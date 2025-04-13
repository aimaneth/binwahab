const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding publishedAt column to Collection table...');
    
    // Use raw SQL to add the column
    await prisma.$executeRaw`
      ALTER TABLE "Collection" 
      ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
    `;
    
    console.log('Successfully added publishedAt column to Collection table');
  } catch (error) {
    console.error('Error adding publishedAt column:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 