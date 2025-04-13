const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding sortBy column to Collection table...');
    
    // Use raw SQL to add the column
    await prisma.$executeRaw`
      ALTER TABLE "Collection" 
      ADD COLUMN IF NOT EXISTS "sortBy" TEXT;
    `;
    
    console.log('Successfully added sortBy column to Collection table');
  } catch (error) {
    console.error('Error adding sortBy column:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 