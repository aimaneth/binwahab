import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a unique connection URL with pgbouncer parameters to prevent prepared statement conflicts
function createConnectionUrl() {
  const baseUrl = process.env.DATABASE_URL || '';
  
  // Force transaction mode and disable prepared statements to prevent corruption
  const connectionParams = new URLSearchParams({
    'pgbouncer': 'true',
    'connection_limit': '1',
    'pool_timeout': '0',
    'prepare': 'false', // Disable prepared statements completely
    'schema_only': 'false',
    'statement_cache_size': '0'
  });
  
  // Add a unique session identifier to force separate connection pools
  const sessionId = Math.random().toString(36).substring(2, 15);
  connectionParams.set('application_name', `binwahab_${sessionId}`);
  
  return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${connectionParams.toString()}`;
}

// Create fresh Prisma client with unique connection pool
function createPrismaClient(forceUnique = false) {
  const connectionUrl = forceUnique ? createConnectionUrl() : process.env.DATABASE_URL;
  
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    errorFormat: "minimal",
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
  });
}

// Main Prisma instance - in production, always create fresh to avoid connection reuse
export const prisma = process.env.NODE_ENV === "production" 
  ? createPrismaClient()
  : (globalForPrisma.prisma ?? createPrismaClient());

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Helper to ensure completely isolated connections
export async function withFreshConnection<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  let tempPrisma: PrismaClient | null = null;
  
  try {
    // Create a completely fresh connection with unique pool
    tempPrisma = createPrismaClient(true);
    
    // Connect and immediately test the connection
    await tempPrisma.$connect();
    
    // Execute a simple query to ensure the connection is clean
    await tempPrisma.$queryRaw`SELECT 1 as test`;
    
    const result = await operation(tempPrisma);
    return result;
    
  } catch (error) {
    console.error("Fresh connection operation failed:", error);
    throw error;
  } finally {
    if (tempPrisma) {
      try {
        await tempPrisma.$disconnect();
      } catch (disconnectError) {
        console.error("Failed to disconnect temp Prisma:", disconnectError);
      }
    }
  }
}

// More aggressive connection reset
export async function resetConnection() {
  try {
    await prisma.$disconnect();
    
    // Wait a bit to ensure the connection is fully closed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await prisma.$connect();
    
    // Test with a simple query
    await prisma.$queryRaw`SELECT 1 as test`;
    
  } catch (error) {
    console.error("Failed to reset connection:", error);
    throw error;
  }
}

// Detect if an error is a prepared statement corruption error
export function isPreparedStatementError(error: any): boolean {
  const errorMessage = error.message || '';
  return errorMessage.includes('prepared statement') && 
         (errorMessage.includes('does not exist') || 
          errorMessage.includes('already exists') ||
          errorMessage.includes('bind message'));
}

// Execute operation with automatic retry on prepared statement errors
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 2
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      if (isPreparedStatementError(error) && attempt < maxRetries) {
        console.log(`Attempt ${attempt} failed with prepared statement error, retrying with fresh connection...`);
        
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
}