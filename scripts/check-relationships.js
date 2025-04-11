const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Get all products
    const products = await prisma.product.findMany({
      include: {
        collections: true
      }
    });

    console.log(`Found ${products.length} products`);
    
    // Get all collections
    const collections = await prisma.collection.findMany({
      include: {
        products: true
      }
    });

    console.log(`Found ${collections.length} collections`);
    
    // Get all product collections
    const productCollections = await prisma.productCollection.findMany({
      include: {
        product: true,
        collection: true
      }
    });

    console.log(`Found ${productCollections.length} product collections`);
    
    // Check for orphaned product collections
    const orphanedProductCollections = productCollections.filter(pc => {
      const productExists = products.some(p => p.id === pc.productId);
      const collectionExists = collections.some(c => c.id === pc.collectionId);
      return !productExists || !collectionExists;
    });

    if (orphanedProductCollections.length > 0) {
      console.log(`Found ${orphanedProductCollections.length} orphaned product collections:`);
      orphanedProductCollections.forEach(pc => {
        console.log(`- Product ID: ${pc.productId}, Collection ID: ${pc.collectionId}`);
      });
    } else {
      console.log('No orphaned product collections found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 