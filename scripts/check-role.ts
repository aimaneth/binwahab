import { execute } from '../src/lib/prisma';

async function main() {
  try {
    const user = await execute(async (prisma) => {
      return await prisma.user.findUnique({
        where: {
          email: 'manbassdumber@gmail.com',
        },
        select: {
          email: true,
          role: true,
        },
      });
    });
    console.log('User role:', user);
  } catch (error) {
    console.error('Error checking user role:', error);
  }
}

main(); 