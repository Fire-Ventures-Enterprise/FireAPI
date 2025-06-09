const { validationResult } = require('express-validator');
const Prediction = require('../models/Prediction');
const Game = require('../models/Game');
const Sport = require('../models/Sport');
const config = require('../config/config');
const logger = require('../middleware/logger');
const { getRedisClient } = require('../config/redis');

// Get prediction data for a specific game or sport
const getPredictionData = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { gameId, sport, limit = 20, offset = 0 } = req.query;

    let query = { isActive: true, status: 'active' };
    
    if (gameId) {
      query.game = gameId;
    } else if (sport) {
      query.sport = sport;
    }

    // Check cache first
    const cacheKey = `predictions:${JSON.stringify(query)}:${limit}:${offset}`;
    const redisClient = getRedisClient();
    
    try {
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        return res.json(JSON.parse(cachedResult));
      }
    } catch (cacheError) {
      logger.warn('Prediction cache retrieval failed:', cacheError);
    }

    const predictions = await Prediction.find(query)
      .populate('game', 'sport league homeTeam awayTeam startTime status')
      .sort({ confidence: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    const total = await Prediction.countDocuments(query);

    // Format predictions with ordered factor analysis
    const formattedPredictions = predictions.map(prediction => {
      const orderedFactors = [];
      
      // Get sport-specific factor order
      const factorOrder = prediction.sport === 'soccer' 
        ? config.sports.predictionFactors.soccer
        : config.sports.predictionFactors.basketball;

      // Build ordered factor analysis
      factorOrder.forEach(factorName => {
        if (prediction.factorAnalysis[factorName]) {
          orderedFactors.push({
            factor: factorName,
            impact: prediction.factorAnalysis[factorName].impact,
            reasoning: prediction.factorAnalysis[factorName].reasoning
          });
        }
      });

      return {
        id: prediction._id,
        game: prediction.game,
        sport: prediction.sport,
        predictionType: prediction.predictionType,
        recommendation: prediction.recommendation,
        confidence: prediction.confidence,
        probability: prediction.probability,
        orderedFactorAnalysis: orderedFactors,
        insights: prediction.insights,
        odds: prediction.odds,
        performance: prediction.performance,
        createdAt: prediction.createdAt
      };
    });

    const result = {
      success: true,
      data: {
        predictions: formattedPredictions,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    };

    // Cache the result
    try {
      await redisClient.setEx(cacheKey, 1800, JSON.stringify(result)); // 30 minutes cache
    } catch (cacheError) {
      logger.warn('Prediction cache storage failed:', cacheError);
    }

    res.json(result);

  } catch (error) {
    logger.error('Get prediction data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prediction data',
      error: error.message
    });
  }
};

// Generate prediction insights for a specific game
const generatePredictionInsights = async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findById(gameId).populate('predictions');
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Check if we already have recent predictions
    const existingPrediction = await Prediction.findOne({
      game: gameId,
      status: 'active',
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 minutes
    });

    if (existingPrediction) {
      return res.json({
        success: true,
        data: {
          prediction: existingPrediction,
          cached: true
        }
      });
    }

    // Generate new prediction based on game's prediction factors
    const predictionFactors = game.predictionFactors;
    const sport = game.sport;

    // Get sport configuration
    const sportConfig = await Sport.findOne({ name: sport });
    if (!sportConfig) {
      return res.status(400).json({
        success: false,
        message: `Sport ${sport} not configured`
      });
    }

    // Analyze factors in order
    const factorAnalysis = {};
    const orderedFactors = sportConfig.getPredictionFactorsInOrder();

    orderedFactors.forEach(factor => {
      const factorData = predictionFactors[factor.name];
      if (factorData) {
        factorAnalysis[factor.name] = analyzeFactor(factor.name, factorData, game);
      }
    });

    // Calculate overall confidence and recommendation
    const { confidence, recommendation, probability } = calculatePrediction(factorAnalysis, game);

    // Generate insights
    const insights = generateInsights(factorAnalysis, game);

    // Create prediction record
    const prediction = new Prediction({
      game: gameId,
      sport: sport,
      predictionType: 'moneyline',
      recommendation,
      confidence,
      probability,
      factorAnalysis,
      insights,
      odds: {
        current: game.odds?.moneyline || {},
        recommended: calculateRecommendedOdds(probability)
      },
      modelMetrics: {
        algorithm: 'FireBet AI v1.0',
        version: '1.0.0'
      }
    });

    await prediction.save();

    logger.info(`Generated prediction for game ${gameId}: ${recommendation} (${confidence}% confidence)`);

    res.json({
      success: true,
      data: {
        prediction: {
          ...prediction.toObject(),
          orderedFactorAnalysis: orderedFactors.map(factor => ({
            factor: factor.name,
            impact: factorAnalysis[factor.name]?.impact || 0,
            reasoning: factorAnalysis[factor.name]?.reasoning || 'No data available'
          }))
        },
        cached: false
      }
    });

  } catch (error) {
    logger.error('Generate prediction insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate prediction insights',
      error: error.message
    });
  }
};

// Get prediction factors analysis for a sport
const getPredictionFactors = async (req, res) => {
  try {
    const { sport } = req.params;

    const sportConfig = await Sport.findOne({ name: sport, isActive: true });
    
    if (!sportConfig) {
      return res.status(404).json({
        success: false,
        message: `Sport ${sport} not found or not active`
      });
    }

    const orderedFactors = sportConfig.getPredictionFactorsInOrder();

    res.json({
      success: true,
      data: {
        sport,
        factors: orderedFactors,
        factorOrder: config.sports.predictionFactors[sport] || [],
        description: `Prediction factors for ${sport} in exact collection order`
      }
    });

  } catch (error) {
    logger.error('Get prediction factors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prediction factors',
      error: error.message
    });
  }
};

// Get specific prediction details
const getPredictionDetails = async (req, res) => {
  try {
    const { predictionId } = req.params;

    const prediction = await Prediction.findById(predictionId)
      .populate('game', 'sport league homeTeam awayTeam startTime status scores')
      .lean();

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    // Format with ordered factors
    const factorOrder = prediction.sport === 'soccer' 
      ? config.sports.predictionFactors.soccer
      : config.sports.predictionFactors.basketball;

    const orderedFactors = factorOrder.map(factorName => ({
      factor: factorName,
      impact: prediction.factorAnalysis[factorName]?.impact || 0,
      reasoning: prediction.factorAnalysis[factorName]?.reasoning || 'No analysis available'
    }));

    res.json({
      success: true,
      data: {
        prediction: {
          ...prediction,
          orderedFactorAnalysis: orderedFactors,
          topFactors: orderedFactors
            .filter(f => Math.abs(f.impact) > 0)
            .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
            .slice(0, 5)
        }
      }
    });

  } catch (error) {
    logger.error('Get prediction details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prediction details',
      error: error.message
    });
  }
};

// Get prediction performance analytics
const getPredictionAnalytics = async (req, res) => {
  try {
    const { sport, timeframe = '7d' } = req.query;

    let dateFilter = {};
    const now = new Date();
    
    switch (timeframe) {
      case '24h':
        dateFilter = { createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) } };
        break;
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
        break;
    }

    let query = { ...dateFilter };
    if (sport) {
      query.sport = sport;
    }

    const predictions = await Prediction.find(query);
    
    // Calculate analytics
    const analytics = {
      totalPredictions: predictions.length,
      averageConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length || 0,
      settledPredictions: predictions.filter(p => p.status === 'settled').length,
      accuracyRate: 0,
      topPerformingFactors: [],
      confidenceDistribution: {
        high: predictions.filter(p => p.confidence >= 80).length,
        medium: predictions.filter(p => p.confidence >= 60 && p.confidence < 80).length,
        low: predictions.filter(p => p.confidence < 60).length
      }
    };

    // Calculate accuracy for settled predictions
    const settledPredictions = predictions.filter(p => p.status === 'settled');
    if (settledPredictions.length > 0) {
      const correctPredictions = settledPredictions.filter(p => p.result?.outcome === 'win').length;
      analytics.accuracyRate = (correctPredictions / settledPredictions.length) * 100;
    }

    res.json({
      success: true,
      data: {
        analytics,
        timeframe,
        sport: sport || 'all'
      }
    });

  } catch (error) {
    logger.error('Get prediction analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prediction analytics',
      error: error.message
    });
  }
};

// Helper function to analyze individual factors
const analyzeFactor = (factorName, factorData, game) => {
  let impact = 0;
  let reasoning = '';

  switch (factorName) {
    case 'referee':
      if (factorData.cardsPerGame > 4) {
        impact = -2;
        reasoning = 'Strict referee may affect game flow';
      } else {
        impact = 1;
        reasoning = 'Lenient referee allows flowing game';
      }
      break;
    
    case 'weather':
      if (factorData.precipitation > 50) {
        impact = -3;
        reasoning = 'High precipitation probability affects outdoor play';
      } else if (factorData.temperature < 5 || factorData.temperature > 35) {
        impact = -1;
        reasoning = 'Extreme temperature may impact performance';
      }
      break;
    
    case 'venue':
      if (factorData.homeAdvantage > 60) {
        impact = 3;
        reasoning = 'Strong home advantage at this venue';
      }
      break;
    
    case 'travelDistance':
      if (factorData.awayTeamDistance > 1000) {
        impact = -2;
        reasoning = 'Long travel distance may cause fatigue';
      }
      break;
    
    case 'injuries':
      const totalImpact = (factorData.homeTeam?.impactRating || 0) - (factorData.awayTeam?.impactRating || 0);
      impact = totalImpact;
      reasoning = `Injury impact: Home ${factorData.homeTeam?.impactRating || 0}, Away ${factorData.awayTeam?.impactRating || 0}`;
      break;
    
    default:
      impact = 0;
      reasoning = 'Factor analyzed but no significant impact detected';
  }

  return { impact, reasoning };
};

// Helper function to calculate overall prediction
const calculatePrediction = (factorAnalysis, game) => {
  const factors = Object.values(factorAnalysis);
  const totalImpact = factors.reduce((sum, factor) => sum + factor.impact, 0);
  const avgImpact = totalImpact / factors.length;
  
  // Base confidence around 50% and adjust based on factor strength
  let confidence = Math.max(35, Math.min(95, 50 + Math.abs(avgImpact) * 8));
  
  // Determine recommendation based on impact direction
  let recommendation = 'home';
  if (totalImpact < -1) recommendation = 'away';
  else if (Math.abs(totalImpact) < 1) recommendation = 'draw';
  
  // Calculate probabilities
  const probability = {
    home: recommendation === 'home' ? confidence : 100 - confidence,
    away: recommendation === 'away' ? confidence : 100 - confidence,
    draw: recommendation === 'draw' ? confidence : Math.max(10, 100 - confidence * 2)
  };

  return { confidence: Math.round(confidence), recommendation, probability };
};

// Helper function to generate insights
const generateInsights = (factorAnalysis, game) => {
  const factors = Object.entries(factorAnalysis);
  const significantFactors = factors.filter(([_, data]) => Math.abs(data.impact) > 2);
  
  return {
    keyFactors: significantFactors.map(([name, _]) => name),
    riskLevel: significantFactors.length > 3 ? 'high' : significantFactors.length > 1 ? 'medium' : 'low',
    valueRating: Math.min(10, Math.max(1, 5 + significantFactors.length)),
    summary: `Analysis of ${factors.length} factors reveals ${significantFactors.length} significant influences`,
    reasoning: significantFactors.map(([name, data]) => `${name}: ${data.reasoning}`).join('; ')
  };
};

// Helper function to calculate recommended odds
const calculateRecommendedOdds = (probability) => {
  return {
    home: probability.home > 0 ? (100 / probability.home).toFixed(2) : 0,
    away: probability.away > 0 ? (100 / probability.away).toFixed(2) : 0,
    draw: probability.draw > 0 ? (100 / probability.draw).toFixed(2) : 0
  };
};

module.exports = {
  getPredictionData,
  generatePredictionInsights,
  getPredictionFactors,
  getPredictionDetails,
  getPredictionAnalytics
};
