const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // First, let's create a new collection to move the product to
    const newCollection = await prisma.collection.create({
      data: {
        name: 'New Test Collection',
        slug: 'new-test-collection',
        description: 'This is another test collection',
        showOnHomePage: true,
        displaySection: 'COMPLETE',
      },
    });

    console.log(`Created new collection: ${newCollection.name} (ID: ${newCollection.id})`);

    // Get the product we want to update (using ID 1 from our previous test data)
    const productId = 1;

    // Update the product's collection using a transaction
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // First, delete the existing product collection relationships
      await tx.productCollection.deleteMany({
        where: {
          productId: productId,
        },
      });

      // Then create the new relationship
      await tx.productCollection.create({
        data: {
          productId: productId,
          collectionId: newCollection.id,
        },
      });

      // Return the updated product with its new collection
      return tx.product.findUnique({
        where: { id: productId },
        include: {
          collections: {
            include: {
              collection: true,
            },
          },
        },
      });
    });

    console.log('Product collection updated successfully:');
    console.log('Product:', updatedProduct.name);
    console.log('New collection:', updatedProduct.collections[0].collection.name);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 