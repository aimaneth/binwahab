import { prisma } from '../src/lib/prisma';

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: 'manbassdumber@gmail.com',
      },
      select: {
        email: true,
        role: true,
      },
    });
    console.log('User role:', user);
  } catch (error) {
    console.error('Error checking user role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 