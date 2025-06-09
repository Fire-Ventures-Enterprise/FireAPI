const redis = require('redis');
const config = require('./config');
const logger = require('../middleware/logger');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      host: config.database.redis.host,
      port: config.database.redis.port,
      password: config.database.redis.password,
      db: config.database.redis.db,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    await redisClient.connect();
    
    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    redisClient.on('disconnect', () => {
      logger.warn('Disconnected from Redis');
    });

    return redisClient;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

module.exports = {
  connectRedis,
  getRedisClient
};
