import { NextResponse } from 'next/server';
import { checkDatabaseHealth, checkConnectionStatus } from '@/lib/health-check';

export async function GET() {
  const dbHealth = await checkDatabaseHealth();
  const connectionStatus = await checkConnectionStatus();

  if (!dbHealth || !connectionStatus.isConnected) {
    return NextResponse.json(
      { 
        status: 'error',
        database: dbHealth ? 'healthy' : 'unhealthy',
        connection: connectionStatus.isConnected ? 'connected' : 'disconnected'
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ 
    status: 'healthy',
    database: 'healthy',
    connection: 'connected'
  });
} 