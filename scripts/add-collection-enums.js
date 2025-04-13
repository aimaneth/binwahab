const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding CollectionSortOption enum type to the database...');
    
    // Execute raw SQL to create the enum type
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CollectionSortOption') THEN
          CREATE TYPE "CollectionSortOption" AS ENUM (
            'MANUAL',
            'BEST_SELLING',
            'TITLE_ASC',
            'TITLE_DESC',
            'PRICE_ASC',
            'PRICE_DESC',
            'CREATED_ASC',
            'CREATED_DESC'
          );
        END IF;
      END $$;
    `;
    
    console.log('CollectionSortOption enum type added successfully!');
  } catch (error) {
    console.error('Error adding CollectionSortOption enum type:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 