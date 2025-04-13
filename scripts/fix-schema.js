const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fixing database schema...');
  
  try {
    // Add missing columns if they don't exist
    await prisma.$executeRaw`
      DO $$
      BEGIN
        -- Add descriptionHtml to Product if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'Product' AND column_name = 'descriptionHtml') THEN
          ALTER TABLE "Product" ADD COLUMN "descriptionHtml" TEXT;
        END IF;
        
        -- Add handle to Collection if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'Collection' AND column_name = 'handle') THEN
          ALTER TABLE "Collection" ADD COLUMN "handle" TEXT;
          
          -- Make handle unique
          ALTER TABLE "Collection" ADD CONSTRAINT "Collection_handle_key" UNIQUE ("handle");
          
          -- Update existing collections to have a handle based on their name
          UPDATE "Collection" SET "handle" = LOWER(REGEXP_REPLACE("name", '\s+', '-', 'g')) 
          WHERE "handle" IS NULL;
        END IF;
      END $$;
    `;
    
    console.log('Schema fixed successfully!');
  } catch (error) {
    console.error('Error fixing schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 