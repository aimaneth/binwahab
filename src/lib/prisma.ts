import { PrismaClient } from "@prisma/client";

// Global instance cache for development only
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with aggressive connection settings for serverless
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

// In production, NEVER reuse connections. In development, cache for performance.
export const prisma = process.env.NODE_ENV === "production" 
  ? null  // Don't export a global instance in production
  : (globalForPrisma.prisma ?? createPrismaClient());

if (process.env.NODE_ENV !== "production" && prisma) {
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
export async function execute<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  if (process.env.NODE_ENV === "production") {
    return safeExecute(operation);
  } else {
    if (!prisma) {
      throw new Error("Prisma client not available in development");
    }
    return devExecute(() => operation(prisma));
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
  // This is problematic since operation() might use global prisma
  // In production, we can't easily convert this, so throw an error
  if (process.env.NODE_ENV === "production") {
    throw new Error("executeWithRetry not supported in production - use safeExecute or execute instead");
  }
  
  return devExecute(operation);
}

export async function resetConnection() {
  if (process.env.NODE_ENV !== "production" && prisma) {
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