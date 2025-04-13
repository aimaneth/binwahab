const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding publishedAt column to Collection table...');
    
    // Execute raw SQL to add the column if it doesn't exist
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Collection' AND column_name = 'publishedAt'
        ) THEN
          ALTER TABLE "Collection" ADD COLUMN "publishedAt" TIMESTAMP(3);
        END IF;
      END $$;
    `;
    
    console.log('Successfully added publishedAt column to Collection table');
  } catch (error) {
    console.error('Error adding publishedAt column:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 