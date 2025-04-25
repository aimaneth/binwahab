import { supabase, prisma } from './db-utils';

export async function checkDatabaseHealth() {
  try {
    // Check Supabase connection
    const { data, error } = await supabase.from('_health').select('*').limit(1);
    if (error) throw error;

    // Check Prisma connection
    await prisma.$queryRaw`SELECT 1`;
    
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

export async function checkConnectionStatus() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return {
      isConnected: !error,
      session: session
    };
  } catch (error) {
    console.error('Connection status check failed:', error);
    return {
      isConnected: false,
      session: null
    };
  }
} 