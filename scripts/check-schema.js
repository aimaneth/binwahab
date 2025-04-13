const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking database schema...');
  
  try {
    // Check if descriptionHtml exists in Product table
    const productColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Product' AND column_name = 'descriptionHtml';
    `;
    
    console.log('Product columns:', productColumns);
    
    // Check if handle exists in Collection table
    const collectionColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Collection' AND column_name = 'handle';
    `;
    
    console.log('Collection columns:', collectionColumns);
    
    // Check if handle is unique in Collection table
    const uniqueConstraints = await prisma.$queryRaw`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'Collection' AND constraint_type = 'UNIQUE';
    `;
    
    console.log('Collection unique constraints:', uniqueConstraints);
    
    console.log('Schema check completed!');
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 