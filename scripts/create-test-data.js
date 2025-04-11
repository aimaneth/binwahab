const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Create a test product
    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        description: 'This is a test product',
        price: 99.99,
        stock: 10,
        slug: 'test-product',
      },
    });

    console.log(`Created product: ${product.name} (ID: ${product.id})`);

    // Create a test collection
    const collection = await prisma.collection.create({
      data: {
        name: 'Test Collection',
        slug: 'test-collection',
        description: 'This is a test collection',
        showOnHomePage: true,
        displaySection: 'FEATURED',
      },
    });

    console.log(`Created collection: ${collection.name} (ID: ${collection.id})`);

    // Create a product collection relationship
    const productCollection = await prisma.productCollection.create({
      data: {
        productId: product.id,
        collectionId: collection.id,
      },
    });

    console.log(`Created product collection relationship: Product ID ${productCollection.productId}, Collection ID ${productCollection.collectionId}`);

    console.log('Test data created successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 