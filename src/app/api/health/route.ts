import { NextResponse } from 'next/server';
import { prisma, executeWithRetry, withFreshConnection } from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Test database connection with executeWithRetry to handle prepared statement errors
    const result = await executeWithRetry(async () => {
      return await prisma.$queryRaw`SELECT NOW() as current_time, version() as db_version`;
    });
    const connectionTime = Date.now() - startTime;
    
    // Test Prisma client specifically with retry logic
    const [categoryCount, productCount] = await executeWithRetry(async () => {
      return await Promise.all([
        prisma.category.count(),
        prisma.product.count()
      ]);
    });
    
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
    
    // Try one more time with fresh connection
    try {
      const result = await withFreshConnection(async (freshPrisma) => {
        const dbResult = await freshPrisma.$queryRaw`SELECT NOW() as current_time, version() as db_version`;
        const [categoryCount, productCount] = await Promise.all([
          freshPrisma.category.count(),
          freshPrisma.product.count()
        ]);
        return { dbResult, categoryCount, productCount };
      });
      
      const totalQueryTime = Date.now() - startTime;
      
      return NextResponse.json({
        status: "healthy_with_retry",
        database: "connected",
        connection_time_ms: connectionTime,
        total_query_time_ms: totalQueryTime,
        timestamp: new Date().toISOString(),
        stats: {
          categories: result.categoryCount,
          products: result.productCount,
        },
        database_info: result.dbResult,
        performance: {
          connection: connectionTime < 500 ? "good" : connectionTime < 1000 ? "fair" : "slow",
          queries: totalQueryTime < 1000 ? "good" : totalQueryTime < 2000 ? "fair" : "slow"
        }
      });
      
    } catch (retryError) {
      const finalConnectionTime = Date.now() - startTime;
      
      return NextResponse.json({
        status: "unhealthy",
        database: "disconnected",
        connection_time_ms: finalConnectionTime,
        timestamp: new Date().toISOString(),
        error: retryError instanceof Error ? retryError.message : "Unknown error",
        original_error: error instanceof Error ? error.message : "Unknown error",
        suggestion: finalConnectionTime > 5000 
          ? "Connection timeout - check Vercel environment variables" 
          : "Database query failed - check Supabase status"
      }, { status: 503 });
    }
  }
} 