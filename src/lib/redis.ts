import Redis from 'ioredis';

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  
  // Return null if no Redis URL is configured
  return null;
};

// Create Redis instance only if URL is available
const redisUrl = getRedisUrl();
export const redis = redisUrl ? new Redis(redisUrl) : null;

// Graceful error handling for Redis connection
if (redis) {
  redis.on('error', (error: Error) => {
    console.warn('Redis connection error:', error);
  });

  redis.on('connect', () => {
    console.log('Connected to Redis successfully');
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  redis?.disconnect();
});

process.on('SIGINT', () => {
  redis?.disconnect();
}); 