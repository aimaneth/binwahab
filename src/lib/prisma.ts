import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create fresh Prisma client for each serverless invocation
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    errorFormat: "minimal",
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

// NEVER cache Prisma client in production serverless to avoid prepared statement issues
export const prisma = process.env.NODE_ENV === "production" 
  ? createPrismaClient()
  : (globalForPrisma.prisma ?? createPrismaClient());

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Helper to ensure clean connections
export async function withFreshConnection<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  let tempPrisma: PrismaClient | null = null;
  
  try {
    // Create a completely fresh connection for this operation
    tempPrisma = createPrismaClient();
    
    await tempPrisma.$connect();
    const result = await operation(tempPrisma);
    return result;
    
  } catch (error) {
    console.error("Database operation failed:", error);
    throw error;
  } finally {
    if (tempPrisma) {
      await tempPrisma.$disconnect();
    }
  }
}

// Reset connection if we get prepared statement errors
export async function resetConnection() {
  try {
    await prisma.$disconnect();
    await prisma.$connect();
  } catch (error) {
    console.error("Failed to reset connection:", error);
  }
}