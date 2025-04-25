import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

// Supabase client for client-side operations (auth, realtime, etc.)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Prisma client for server-side database operations
// This uses DATABASE_URL from .env which should never be exposed to the client
export const prisma = new PrismaClient({
  log: ['error']
});

// Simple retry mechanism for Prisma operations
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return withRetry(operation, retries - 1);
    }
    throw error;
  }
}

// Add retry middleware to Prisma
prisma.$use(async (params, next) => {
  return await withRetry(() => next(params));
}); 