import { NextResponse } from 'next/server';
import { prisma, withFreshConnection } from '@/lib/prisma';

export async function GET() {
  try {
    // Try with main connection first
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        slug: true,
        status: true,
        stock: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(products);
    
  } catch (error: any) {
    console.error('Error fetching products:', error);
    
    // If it's a prepared statement error, try with fresh connection
    if (error.message?.includes('prepared statement') || 
        error.message?.includes('does not exist') ||
        error.message?.includes('already exists')) {
      
      console.log('Retrying with fresh connection due to prepared statement error');
      
      try {
        const products = await withFreshConnection(async (freshPrisma) => {
          return await freshPrisma.product.findMany({
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              image: true,
              slug: true,
              status: true,
              stock: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
            where: {
              status: 'ACTIVE',
            },
            orderBy: {
              createdAt: 'desc',
            },
          });
        });
        
        return NextResponse.json(products);
        
      } catch (retryError) {
        console.error('Fresh connection also failed:', retryError);
        
        // Return empty array to prevent frontend crashes
        return NextResponse.json([]);
      }
    }
    
    // For other errors, return empty array
    return NextResponse.json([]);
  }
} 