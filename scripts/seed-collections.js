const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Seeding test collections...');
    
    // Create a featured collection
    const featuredCollection = await prisma.collection.create({
      data: {
        name: 'Summer Collection 2024',
        handle: 'summer-collection-2024',
        description: 'Discover our latest summer styles',
        descriptionHtml: '<p>Discover our latest summer styles</p>',
        image: 'https://example.com/summer-collection.jpg',
        type: 'MANUAL',
        isActive: true,
        order: 1,
        showOnHomePage: true,
        displaySection: 'FEATURED',
        sortBy: 'MANUAL',
      },
    });
    
    console.log('Created featured collection:', featuredCollection);
    
    // Create a complete collection
    const completeCollection = await prisma.collection.create({
      data: {
        name: 'Spring Essentials',
        handle: 'spring-essentials',
        description: 'Must-have items for spring',
        descriptionHtml: '<p>Must-have items for spring</p>',
        image: 'https://example.com/spring-essentials.jpg',
        type: 'MANUAL',
        isActive: true,
        order: 2,
        showOnHomePage: true,
        displaySection: 'COMPLETE',
        sortBy: 'MANUAL',
      },
    });
    
    console.log('Created complete collection:', completeCollection);
    
    console.log('Successfully seeded test collections');
  } catch (error) {
    console.error('Error seeding collections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 