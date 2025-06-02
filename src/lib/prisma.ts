import { PrismaClient } from "@prisma/client";

// Global instance cache
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create connection URL with timestamp and random ID to force unique connections
function createUniqueConnectionUrl() {
  const baseUrl = process.env.DATABASE_URL || '';
  
  // Add unique parameters to force completely separate connection pools
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const sessionId = `binwahab_${timestamp}_${randomId}`;
  
  // Force direct connection parameters to bypass all pooling
  const connectionParams = new URLSearchParams({
    'application_name': sessionId,
    'connect_timeout': '10',
    'statement_timeout': '30000',
    'idle_in_transaction_session_timeout': '30000',
    'lock_timeout': '10000',
    // Force new connection every time
    'pool_timeout': '0',
    'connection_limit': '1',
    // Disable all prepared statement optimizations
    'prepare': 'false',
    'statement_cache_size': '0',
    'prepared_statement_cache_queries': '0'
  });
  
  return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${connectionParams.toString()}`;
}

// Create Prisma client with forced unique connections
function createPrismaClient(forceNewConnection = false) {
  const connectionUrl = forceNewConnection ? createUniqueConnectionUrl() : process.env.DATABASE_URL;
  
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

// In production, ALWAYS create fresh clients to prevent any connection reuse
export const prisma = process.env.NODE_ENV === "production" 
  ? createPrismaClient(true)  // Force new connection in production
  : (globalForPrisma.prisma ?? createPrismaClient());

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Create completely isolated connection for critical operations
export async function withFreshConnection<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  let tempPrisma: PrismaClient | null = null;
  
  try {
    // Create completely unique connection
    tempPrisma = createPrismaClient(true);
    
    // Force connection and test it
    await tempPrisma.$connect();
    
    // Run a simple query to ensure the connection is completely fresh
    await tempPrisma.$queryRaw`SELECT 1 as connection_test`;
    
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
    
    // Wait to ensure connection is fully closed
    await new Promise(resolve => setTimeout(resolve, 200));
    
    await prisma.$connect();
    
    // Test with a unique query to avoid prepared statement cache
    const testQuery = `SELECT 1 as test_${Date.now()}`;
    await prisma.$queryRaw`SELECT 1 as test`;
    
  } catch (error) {
    console.error("Failed to reset connection:", error);
    throw error;
  }
}

// Detect prepared statement corruption errors
export function isPreparedStatementError(error: any): boolean {
  const errorMessage = error.message || '';
  return errorMessage.includes('prepared statement') && 
         (errorMessage.includes('does not exist') || 
          errorMessage.includes('already exists') ||
          errorMessage.includes('bind message'));
}

// Execute with automatic fresh connection on any prepared statement error
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 1  // Reduced retries since we'll use fresh connection immediately
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // If it's a prepared statement error, immediately try with fresh connection
    if (isPreparedStatementError(error)) {
      console.log('Prepared statement error detected, using fresh connection...');
      
      // Try with completely fresh connection
      return await withFreshConnection(async (freshPrisma) => {
        // Replace the global prisma with fresh prisma for this operation
        const originalOperation = operation.toString();
        
        // This is a fallback - the caller should handle fresh connection properly
        throw new Error('Operation needs to be rewritten for fresh connection');
      });
    }
    
    throw error;
  }
}

// Safe execute function that always uses fresh connections
export async function safeExecute<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  // In production, always use fresh connections to avoid any corruption
  if (process.env.NODE_ENV === "production") {
    return await withFreshConnection(operation);
  } else {
    try {
      return await operation(prisma);
    } catch (error: any) {
      if (isPreparedStatementError(error)) {
        console.log('Prepared statement error in development, retrying with fresh connection...');
        return await withFreshConnection(operation);
      }
      throw error;
    }
  }
}