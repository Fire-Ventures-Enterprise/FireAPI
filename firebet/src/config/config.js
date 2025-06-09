const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/firebet',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: process.env.REDIS_DB || 0
    }
  },

  // Authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'firebet-jwt-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // External APIs
  apis: {
    rapidApi: {
      key: process.env.RAPIDAPI_KEY || '',
      baseUrl: 'https://api-basketball.p.rapidapi.com'
    },
    sportsData: {
      key: process.env.SPORTS_DATA_API_KEY || '',
      baseUrl: 'https://api.sportsdata.io'
    },
    fireApi: {
      baseUrl: process.env.FIRE_API_BASE_URL || 'https://web-production-81c6a.up.railway.app',
      apiKey: process.env.FIRE_API_KEY || ''
    }
  },

  // Sports configuration
  sports: {
    supportedSports: ['basketball', 'soccer', 'baseball', 'americanFootball', 'hockey'],
    defaultCacheTTL: 300, // 5 minutes
    predictionFactors: {
      soccer: [
        'referee', 'weather', 'venue', 'travelDistance', 'timeChange', 
        'injuries', 'managers', 'managersH2HRecords', 'nightOrDayMatch', 
        'regularSeason', 'playoffs', 'worldCup'
      ],
      basketball: [
        'referee', 'venue', 'travelDistance', 'timeChange', 'injuries', 
        'coaches', 'coachesH2HRecords', 'backToBackGames', 'restDays', 
        'regularSeason', 'playoffs', 'altitude'
      ]
    }
  },

  // Real-time features
  realtime: {
    socketPort: process.env.SOCKET_PORT || 3001,
    updateIntervals: {
      odds: 30000,      // 30 seconds
      scores: 15000,    // 15 seconds
      predictions: 300000 // 5 minutes
    }
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/firebet.log'
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    message: 'Too many requests from this IP'
  }
};
