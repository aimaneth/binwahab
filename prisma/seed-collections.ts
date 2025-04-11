const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Create sample collections
  const collections = [
    {
      name: 'Summer Collection',
      slug: 'summer-collection',
      description: 'Light and breezy clothing perfect for summer days',
    },
    {
      name: 'Winter Essentials',
      slug: 'winter-essentials',
      description: 'Warm and cozy items for the cold season',
    },
    {
      name: 'New Arrivals',
      slug: 'new-arrivals',
      description: 'Our latest products just in time for the season',
    },
    {
      name: 'Best Sellers',
      slug: 'best-sellers',
      description: 'Our most popular items loved by customers',
    },
  ];

  for (const collection of collections) {
    await prisma.collection.upsert({
      where: { slug: collection.slug },
      update: {},
      create: collection,
    });
  }

  console.log('Collections seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 