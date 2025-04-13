const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding descriptionHtml column to Collection table...');
    
    // Use raw SQL to add the column
    await prisma.$executeRaw`
      ALTER TABLE "Collection" 
      ADD COLUMN IF NOT EXISTS "descriptionHtml" TEXT;
    `;
    
    console.log('Successfully added descriptionHtml column to Collection table');
  } catch (error) {
    console.error('Error adding descriptionHtml column:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 