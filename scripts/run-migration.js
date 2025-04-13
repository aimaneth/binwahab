const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Running migration to add sortBy column to Collection table...');
    
    // Execute the first SQL statement to add the column
    await prisma.$executeRaw`
      ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "sortBy" TEXT NOT NULL DEFAULT 'MANUAL';
    `;
    
    console.log('Added sortBy column to Collection table');
    
    // Execute the second SQL statement to update existing records
    await prisma.$executeRaw`
      UPDATE "Collection" SET "sortBy" = 'MANUAL' WHERE "sortBy" IS NULL;
    `;
    
    console.log('Updated existing records with default value');
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 