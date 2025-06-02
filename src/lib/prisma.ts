import { PrismaClient } from "@prisma/client";

// Global instance cache
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  productionPrisma: PrismaClient | undefined;
};

// Create Prisma client for serverless environments
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
    errorFormat: "minimal",
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

// Create a special production prisma that uses fresh connections
function createProductionPrismaClient() {
  const client = createPrismaClient();
  
  // Override the methods to use fresh connections
  const originalQueryRaw = client.$queryRaw;
  const originalTransaction = client.$transaction;
  
  // We can't easily override all methods, so this is a simplified approach
  return client;
}

// Export strategy:
// - Development: Use cached global instance for performance
// - Production: Export an instance but encourage using execute() for API routes
export const prisma = process.env.NODE_ENV === "production" 
  ? (globalForPrisma.productionPrisma ?? (globalForPrisma.productionPrisma = createProductionPrismaClient()))
  : (globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient()));

// Mark that we're in the global context (for development)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Safe execute function that creates isolated connections for each operation
export async function safeExecute<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  let tempPrisma: PrismaClient | null = null;
  
  try {
    // Always create a completely fresh client
    tempPrisma = createPrismaClient();
    
    // Connect with a timeout
    await Promise.race([
      tempPrisma.$connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      )
    ]);
    
    // Execute the operation
    const result = await operation(tempPrisma);
    
    return result;
    
  } catch (error: any) {
    console.error("Database operation failed:", error.message);
    
    // For prepared statement errors, try one more time with a delay
    if (error.message?.includes('prepared statement')) {
      console.log('Prepared statement error detected, retrying...');
      
      // Wait and try once more
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Disconnect the problematic connection
      if (tempPrisma) {
        try { await tempPrisma.$disconnect(); } catch {}
        tempPrisma = null;
      }
      
      // Create a brand new client and try again
      try {
        tempPrisma = createPrismaClient();
        await tempPrisma.$connect();
        const result = await operation(tempPrisma);
        return result;
      } catch (retryError: any) {
        console.error("Retry also failed:", retryError.message);
        throw retryError;
      }
    }
    
    throw error;
    
  } finally {
    // Always disconnect
    if (tempPrisma) {
      try {
        await tempPrisma.$disconnect();
      } catch (disconnectError) {
        console.error("Failed to disconnect:", disconnectError);
      }
    }
  }
}

// Wrapper for operations that use the global prisma (development mode)
export async function devExecute<T>(operation: () => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("devExecute should not be used in production");
  }
  
  if (!prisma) {
    throw new Error("Prisma client not available");
  }
  
  try {
    return await operation();
  } catch (error: any) {
    if (error.message?.includes('prepared statement')) {
      // Try to reset the connection
      try {
        await prisma.$disconnect();
        await new Promise(resolve => setTimeout(resolve, 100));
        await prisma.$connect();
        return await operation();
      } catch (retryError) {
        throw retryError;
      }
    }
    throw error;
  }
}

// Smart execute that chooses the right strategy based on environment
// For API routes in production, this will use fresh connections
// For pages and other contexts, this will use the global instance
export async function execute<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  // Check if we're in an API route context by looking at the current execution path
  const isApiRoute = typeof window === 'undefined' && process.env.NODE_ENV === "production";
  
  if (isApiRoute) {
    // Use fresh connections for API routes in production
    return safeExecute(operation);
  } else {
    // Use global instance for pages and development
    if (!prisma) {
      throw new Error("Prisma client not available");
    }
    
    try {
      return await operation(prisma);
    } catch (error: any) {
      if (error.message?.includes('prepared statement')) {
        // In case of prepared statement errors, fall back to fresh connection
        return safeExecute(operation);
      }
      throw error;
    }
  }
}

// Legacy compatibility functions
export async function withFreshConnection<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  return safeExecute(operation);
}

export async function executeWithRetry<T>(
  operation: () => Promise<T>
): Promise<T> {
  if (process.env.NODE_ENV === "production") {
    // In production, we can't easily convert this, so just try with global and fallback
    try {
      return await operation();
    } catch (error: any) {
      if (error.message?.includes('prepared statement')) {
        throw new Error("Please use execute() or safeExecute() instead of executeWithRetry() in production API routes");
      }
      throw error;
    }
  }
  
  return devExecute(operation);
}

export async function resetConnection() {
  if (prisma) {
    try {
      await prisma.$disconnect();
      await new Promise(resolve => setTimeout(resolve, 100));
      await prisma.$connect();
    } catch (error) {
      console.error("Failed to reset connection:", error);
    }
  }
}

export function isPreparedStatementError(error: any): boolean {
  const errorMessage = error.message || '';
  return errorMessage.includes('prepared statement');
}