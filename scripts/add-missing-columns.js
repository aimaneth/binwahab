const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding missing columns to Collection table...');
    
    // Add each column individually with proper SQL syntax
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Collection' AND column_name = 'metaTitle'
        ) THEN
          ALTER TABLE "Collection" ADD COLUMN "metaTitle" TEXT;
        END IF;
      END $$;
    `;
    console.log('Added metaTitle column if it didn\'t exist');
    
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Collection' AND column_name = 'metaDescription'
        ) THEN
          ALTER TABLE "Collection" ADD COLUMN "metaDescription" TEXT;
        END IF;
      END $$;
    `;
    console.log('Added metaDescription column if it didn\'t exist');
    
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Collection' AND column_name = 'metaKeywords'
        ) THEN
          ALTER TABLE "Collection" ADD COLUMN "metaKeywords" TEXT;
        END IF;
      END $$;
    `;
    console.log('Added metaKeywords column if it didn\'t exist');
    
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Collection' AND column_name = 'ogImage'
        ) THEN
          ALTER TABLE "Collection" ADD COLUMN "ogImage" TEXT;
        END IF;
      END $$;
    `;
    console.log('Added ogImage column if it didn\'t exist');
    
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Collection' AND column_name = 'twitterImage'
        ) THEN
          ALTER TABLE "Collection" ADD COLUMN "twitterImage" TEXT;
        END IF;
      END $$;
    `;
    console.log('Added twitterImage column if it didn\'t exist');
    
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
    console.log('Added publishedAt column if it didn\'t exist');
    
    console.log('Successfully added all missing columns to Collection table');
    
    // Verify the columns
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Collection'
      ORDER BY column_name;
    `;
    
    console.log('Current Collection table columns:');
    console.log(columns);
    
  } catch (error) {
    console.error('Error adding columns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 