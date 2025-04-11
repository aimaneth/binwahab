const { PrismaClient: PrismaClientLib } = require('@prisma/client');

const migrationPrisma = new PrismaClientLib();

async function migrateProductImages() {
  try {
    console.log('Starting product images migration...');
    
    // Get all products with their existing image
    const products = await migrationPrisma.product.findMany({
      where: {
        image: {
          not: null
        }
      },
      select: {
        id: true,
        image: true
      }
    });
    
    console.log(`Found ${products.length} products with images to migrate`);
    
    // Migrate each product's image to the new ProductImage model
    for (const product of products) {
      if (product.image) {
        // Create a new ProductImage record
        await migrationPrisma.productImage.create({
          data: {
            url: product.image,
            order: 0, // Set as the first image
            productId: product.id
          }
        });
        
        console.log(`Migrated image for product ${product.id}`);
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await migrationPrisma.$disconnect();
  }
}

// Run the migration
migrateProductImages(); 