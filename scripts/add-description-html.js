const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding descriptionHtml column to Collection table...');
    
    // Execute raw SQL to add the column if it doesn't exist
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Collection' AND column_name = 'descriptionHtml'
        ) THEN
          ALTER TABLE "Collection" ADD COLUMN "descriptionHtml" TEXT;
        END IF;
      END $$;
    `;
    
    console.log('Successfully added descriptionHtml column to Collection table');
  } catch (error) {
    console.error('Error adding descriptionHtml column:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 