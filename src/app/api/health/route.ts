import { NextResponse } from 'next/server';
import { execute } from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Use execute to ensure clean connections
    const result = await execute(async (prismaClient) => {
      const dbResult = await prismaClient.$queryRaw`SELECT NOW() as current_time, version() as db_version`;
      const [categoryCount, productCount] = await Promise.all([
        prismaClient.category.count(),
        prismaClient.product.count()
      ]);
      return { dbResult, categoryCount, productCount };
    });
    
    const totalQueryTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      connection_time_ms: totalQueryTime,
      total_query_time_ms: totalQueryTime,
      timestamp: new Date().toISOString(),
      stats: {
        categories: result.categoryCount,
        products: result.productCount,
      },
      database_info: result.dbResult,
      performance: {
        connection: totalQueryTime < 500 ? "good" : totalQueryTime < 1000 ? "fair" : "slow",
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