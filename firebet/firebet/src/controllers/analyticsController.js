const { validationResult } = require('express-validator');
const User = require('../models/User');
const Bet = require('../models/Bet');
const Game = require('../models/Game');
const Prediction = require('../models/Prediction');
const Sport = require('../models/Sport');
const logger = require('../middleware/logger');
const { getRedisClient } = require('../config/redis');

// Get overall analytics dashboard
const getAnalyticsDashboard = async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '24h':
        startDate = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
    }

    // Check cache first
    const cacheKey = `analytics:dashboard:${timeframe}`;
    const redisClient = getRedisClient();
    
    try {
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        return res.json(JSON.parse(cachedResult));
      }
    } catch (cacheError) {
      logger.warn('Analytics cache retrieval failed:', cacheError);
    }

    // Parallel queries for performance
    const [
      totalUsers,
      activeUsers,
      totalBets,
      totalPredictions,
      totalGames,
      userGrowth,
      bettingVolume,
      predictionAccuracy,
      sportPopularity
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ 
        isActive: true, 
        lastLogin: { $gte: startDate } 
      }),
      Bet.countDocuments({ 
        placedAt: { $gte: startDate } 
      }),
      Prediction.countDocuments({ 
        createdAt: { $gte: startDate } 
      }),
      Game.countDocuments({ 
        startTime: { $gte: startDate } 
      }),
      getUserGrowthData(startDate),
      getBettingVolumeData(startDate),
      getPredictionAccuracyData(startDate),
      getSportPopularityData(startDate)
    ]);

    const dashboard = {
      overview: {
        totalUsers,
        activeUsers,
        totalBets,
        totalPredictions,
        totalGames,
        userEngagementRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
      },
      trends: {
        userGrowth,
        bettingVolume,
        predictionAccuracy
      },
      insights: {
        sportPopularity,
        topPerformingFactors: await getTopPerformingFactors(startDate),
        riskDistribution: await getRiskDistribution(startDate)
      },
      timeframe,
      lastUpdated: new Date().toISOString()
    };

    // Cache the result for 10 minutes
    try {
      await redisClient.setEx(cacheKey, 600, JSON.stringify({
        success: true,
        data: { dashboard }
      }));
    } catch (cacheError) {
      logger.warn('Analytics cache storage failed:', cacheError);
    }

    res.json({
      success: true,
      data: { dashboard }
    });

  } catch (error) {
    logger.error('Get analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics dashboard',
      error: error.message
    });
  }
};

// Get user analytics
const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { timeframe = '30d' } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate date range
    const now = new Date();
    const startDate = getStartDate(timeframe, now);

    // Get user's betting data
    const userBets = await Bet.find({
      user: userId,
      placedAt: { $gte: startDate }
    }).populate('game', 'sport league');

    // Calculate user analytics
    const analytics = {
      profile: {
        totalBets: userBets.length,
        totalStaked: userBets.reduce((sum, bet) => sum + bet.stake, 0),
        totalWinnings: userBets.reduce((sum, bet) => sum + (bet.result?.actualPayout || 0), 0),
        winRate: calculateWinRate(userBets),
        roi: user.calculateROI(),
        averageStake: userBets.length > 0 ? userBets.reduce((sum, bet) => sum + bet.stake, 0) / userBets.length : 0
      },
      performance: {
        winningStreak: calculateWinningStreak(userBets),
        bestBet: getBestBet(userBets),
        worstBet: getWorstBet(userBets),
        monthlyPerformance: getMonthlyPerformance(userBets)
      },
      preferences: {
        favoriteSports: getFavoriteSports(userBets),
        favoriteMarkets: getFavoriteMarkets(userBets),
        riskProfile: assessRiskProfile(userBets)
      },
      insights: {
        recommendations: generateUserRecommendations(user, userBets),
        strengths: identifyStrengths(userBets),
        improvements: identifyImprovements(userBets)
      }
    };

    res.json({
      success: true,
      data: { analytics }
    });

  } catch (error) {
    logger.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user analytics',
      error: error.message
    });
  }
};

// Get prediction performance analytics
const getPredictionPerformance = async (req, res) => {
  try {
    const { sport, timeframe = '30d' } = req.query;
    
    const startDate = getStartDate(timeframe, new Date());
    
    let query = {
      createdAt: { $gte: startDate },
      status: 'settled'
    };
    
    if (sport) {
      query.sport = sport;
    }

    const predictions = await Prediction.find(query)
      .populate('game', 'sport league');

    // Calculate performance metrics
    const performance = {
      total: predictions.length,
      correct: predictions.filter(p => p.result?.outcome === 'win').length,
      accuracy: 0,
      confidenceAnalysis: analyzeConfidenceLevels(predictions),
      sportBreakdown: analyzeSportPerformance(predictions),
      factorEffectiveness: analyzeFactorEffectiveness(predictions),
      trends: analyzePredictionTrends(predictions)
    };

    performance.accuracy = performance.total > 0 ? 
      (performance.correct / performance.total) * 100 : 0;

    res.json({
      success: true,
      data: { performance }
    });

  } catch (error) {
    logger.error('Get prediction performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prediction performance',
      error: error.message
    });
  }
};

// Get betting trends
const getBettingTrends = async (req, res) => {
  try {
    const { sport, timeframe = '30d' } = req.query;
    
    const startDate = getStartDate(timeframe, new Date());
    
    let query = {
      placedAt: { $gte: startDate }
    };

    // Get betting data
    const bets = await Bet.find(query)
      .populate('game', 'sport league startTime')
      .sort({ placedAt: 1 });

    // Filter by sport if specified
    const filteredBets = sport ? 
      bets.filter(bet => bet.game?.sport === sport) : bets;

    const trends = {
      volume: calculateVolumetrends(filteredBets),
      popularMarkets: getPopularMarkets(filteredBets),
      averageOdds: calculateAverageOdds(filteredBets),
      stakeDistribution: getStakeDistribution(filteredBets),
      timePatterns: getTimePatterns(filteredBets),
      successRates: getSuccessRates(filteredBets)
    };

    res.json({
      success: true,
      data: { trends }
    });

  } catch (error) {
    logger.error('Get betting trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get betting trends',
      error: error.message
    });
  }
};

// Get system health metrics
const getSystemHealth = async (req, res) => {
  try {
    const health = {
      services: {
        database: await checkDatabaseHealth(),
        redis: await checkRedisHealth(),
        predictions: await checkPredictionHealth(),
        sports: await checkSportsHealth()
      },
      performance: {
        averageResponseTime: await getAverageResponseTime(),
        errorRate: await getErrorRate(),
        cacheHitRate: await getCacheHitRate()
      },
      usage: {
        activeUsers: await getActiveUsersCount(),
        dailyPredictions: await getDailyPredictionsCount(),
        dailyBets: await getDailyBetsCount()
      },
      lastChecked: new Date().toISOString()
    };

    // Calculate overall health score
    const healthScore = calculateHealthScore(health);
    health.overallHealth = healthScore;

    res.json({
      success: true,
      data: { health }
    });

  } catch (error) {
    logger.error('Get system health error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system health',
      error: error.message
    });
  }
};

// Helper functions
const getStartDate = (timeframe, now) => {
  switch (timeframe) {
    case '24h': return new Date(now - 24 * 60 * 60 * 1000);
    case '7d': return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case '90d': return new Date(now - 90 * 24 * 60 * 60 * 1000);
    default: return new Date(now - 30 * 24 * 60 * 60 * 1000);
  }
};

const getUserGrowthData = async (startDate) => {
  const users = await User.find({
    createdAt: { $gte: startDate }
  }).select('createdAt');

  // Group by day
  const dailyGrowth = {};
  users.forEach(user => {
    const date = user.createdAt.toISOString().split('T')[0];
    dailyGrowth[date] = (dailyGrowth[date] || 0) + 1;
  });

  return Object.entries(dailyGrowth).map(([date, count]) => ({
    date,
    newUsers: count
  }));
};

const getBettingVolumeData = async (startDate) => {
  const bets = await Bet.find({
    placedAt: { $gte: startDate }
  }).select('placedAt stake');

  const dailyVolume = {};
  bets.forEach(bet => {
    const date = bet.placedAt.toISOString().split('T')[0];
    if (!dailyVolume[date]) {
      dailyVolume[date] = { count: 0, volume: 0 };
    }
    dailyVolume[date].count += 1;
    dailyVolume[date].volume += bet.stake;
  });

  return Object.entries(dailyVolume).map(([date, data]) => ({
    date,
    betCount: data.count,
    totalVolume: data.volume
  }));
};

const getPredictionAccuracyData = async (startDate) => {
  const predictions = await Prediction.find({
    createdAt: { $gte: startDate },
    status: 'settled'
  }).select('createdAt result');

  const dailyAccuracy = {};
  predictions.forEach(prediction => {
    const date = prediction.createdAt.toISOString().split('T')[0];
    if (!dailyAccuracy[date]) {
      dailyAccuracy[date] = { total: 0, correct: 0 };
    }
    dailyAccuracy[date].total += 1;
    if (prediction.result?.outcome === 'win') {
      dailyAccuracy[date].correct += 1;
    }
  });

  return Object.entries(dailyAccuracy).map(([date, data]) => ({
    date,
    accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
    totalPredictions: data.total
  }));
};

const getSportPopularityData = async (startDate) => {
  const bets = await Bet.find({
    placedAt: { $gte: startDate }
  }).populate('game', 'sport');

  const sportCounts = {};
  bets.forEach(bet => {
    if (bet.game?.sport) {
      sportCounts[bet.game.sport] = (sportCounts[bet.game.sport] || 0) + 1;
    }
  });

  return Object.entries(sportCounts)
    .map(([sport, count]) => ({ sport, bets: count }))
    .sort((a, b) => b.bets - a.bets);
};

const calculateWinRate = (bets) => {
  const settledBets = bets.filter(bet => ['won', 'lost'].includes(bet.status));
  const wonBets = settledBets.filter(bet => bet.status === 'won');
  return settledBets.length > 0 ? (wonBets.length / settledBets.length) * 100 : 0;
};

const calculateHealthScore = (health) => {
  const services = Object.values(health.services);
  const healthyServices = services.filter(service => service.status === 'healthy').length;
  return (healthyServices / services.length) * 100;
};

// Stub functions for complex analytics (would be implemented based on specific requirements)
const getTopPerformingFactors = async (startDate) => {
  return [
    { factor: 'referee', impact: 8.5, accuracy: 75 },
    { factor: 'injuries', impact: 7.2, accuracy: 68 },
    { factor: 'venue', impact: 6.8, accuracy: 72 }
  ];
};

const getRiskDistribution = async (startDate) => {
  return {
    low: 35,
    medium: 45,
    high: 20
  };
};

const checkDatabaseHealth = async () => {
  try {
    await User.findOne().limit(1);
    return { status: 'healthy', responseTime: 50 };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};

const checkRedisHealth = async () => {
  try {
    const redisClient = getRedisClient();
    await redisClient.ping();
    return { status: 'healthy', responseTime: 10 };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};

const checkPredictionHealth = async () => {
  const recentPredictions = await Prediction.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
  });
  return { 
    status: recentPredictions > 0 ? 'healthy' : 'warning', 
    recentPredictions 
  };
};

const checkSportsHealth = async () => {
  const recentGames = await Game.countDocuments({
    lastUpdated: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
  });
  return { 
    status: recentGames > 0 ? 'healthy' : 'warning', 
    recentUpdates: recentGames 
  };
};

// Additional stub functions
const getAverageResponseTime = async () => 120; // ms
const getErrorRate = async () => 0.5; // percentage
const getCacheHitRate = async () => 85; // percentage
const getActiveUsersCount = async () => {
  return await User.countDocuments({
    lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });
};
const getDailyPredictionsCount = async () => {
  return await Prediction.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });
};
const getDailyBetsCount = async () => {
  return await Bet.countDocuments({
    placedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });
};

module.exports = {
  getAnalyticsDashboard,
  getUserAnalytics,
  getPredictionPerformance,
  getBettingTrends,
  getSystemHealth
};
