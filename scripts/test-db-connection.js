const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing database connection...');
    
    // Try to query the database
    const result = await prisma.$queryRaw`SELECT current_database(), current_user, version();`;
    console.log('Database connection successful!');
    console.log('Database info:', result);
    
    // Check if Collection table exists
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'Collection';
    `;
    
    console.log('Collection table exists:', tables.length > 0);
    
    if (tables.length > 0) {
      // Check Collection table columns
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Collection';
      `;
      
      console.log('Collection table columns:');
      console.log(columns);
    }
    
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 