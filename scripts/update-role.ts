const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.update({
      where: {
        email: 'manbassdumber@gmail.com',
      },
      data: {
        role: 'ADMIN',
      },
    });
    console.log('User role updated:', user);
  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 