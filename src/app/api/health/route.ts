import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Test database connection with a simple query
    const result = await prisma.$queryRaw`SELECT NOW() as current_time, version() as db_version`;
    const connectionTime = Date.now() - startTime;
    
    // Test Prisma client specifically
    const categoryCount = await prisma.category.count();
    const productCount = await prisma.product.count();
    const totalQueryTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      connection_time_ms: connectionTime,
      total_query_time_ms: totalQueryTime,
      timestamp: new Date().toISOString(),
      stats: {
        categories: categoryCount,
        products: productCount,
      },
      database_info: result,
      performance: {
        connection: connectionTime < 500 ? "good" : connectionTime < 1000 ? "fair" : "slow",
        queries: totalQueryTime < 1000 ? "good" : totalQueryTime < 2000 ? "fair" : "slow"
      }
    });
    
  } catch (error) {
    const connectionTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: "unhealthy",
      database: "disconnected",
      connection_time_ms: connectionTime,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      suggestion: connectionTime > 5000 
        ? "Connection timeout - check Vercel environment variables" 
        : "Database query failed - check Supabase status"
    }, { status: 503 });
  }
} 