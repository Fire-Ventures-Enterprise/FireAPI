const { validationResult } = require('express-validator');
const Bet = require('../models/Bet');
const Game = require('../models/Game');
const Prediction = require('../models/Prediction');
const User = require('../models/User');
const logger = require('../middleware/logger');
const { getRedisClient } = require('../config/redis');

// Analyze betting opportunities
const analyzeBettingOpportunity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { gameId, betType, selection, stake } = req.body;

    // Get game and prediction data
    const game = await Game.findById(gameId).populate('predictions');
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Get latest prediction for this game
    const prediction = await Prediction.findOne({
      game: gameId,
      predictionType: betType,
      status: 'active'
    }).sort({ createdAt: -1 });

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'No prediction available for this game and bet type'
      });
    }

    // Calculate betting analysis
    const analysis = {
      gameId,
      betType,
      selection,
      stake,
      currentOdds: game.odds[betType] || {},
      prediction: {
        recommendation: prediction.recommendation,
        confidence: prediction.confidence,
        probability: prediction.probability
      },
      analysis: {
        valueScore: calculateValueScore(selection, game.odds[betType], prediction.probability),
        riskAssessment: assessRisk(prediction.confidence, prediction.insights.riskLevel),
        expectedValue: calculateExpectedValue(stake, game.odds[betType]?.[selection], prediction.probability[selection]),
        kellyPercentage: calculateKelly(prediction.probability[selection], game.odds[betType]?.[selection])
      },
      recommendation: {
        shouldBet: false,
        reasoning: '',
        suggestedStake: 0
      }
    };

    // Generate recommendation
    const recommendation = generateBettingRecommendation(analysis);
    analysis.recommendation = recommendation;

    res.json({
      success: true,
      data: {
        analysis
      }
    });

  } catch (error) {
    logger.error('Analyze betting opportunity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze betting opportunity',
      error: error.message
    });
  }
};

// Get betting recommendations
const getBettingRecommendations = async (req, res) => {
  try {
    const { 
      sport, 
      riskLevel = 'medium', 
      minConfidence = 60,
      limit = 10 
    } = req.query;

    let query = { 
      status: 'active', 
      confidence: { $gte: parseInt(minConfidence) },
      expiresAt: { $gt: new Date() }
    };

    if (sport) {
      query.sport = sport;
    }

    // Get high-confidence predictions
    const predictions = await Prediction.find(query)
      .populate('game', 'sport league homeTeam awayTeam startTime odds status')
      .sort({ confidence: -1 })
      .limit(parseInt(limit));

    // Generate recommendations for each prediction
    const recommendations = await Promise.all(
      predictions.map(async (prediction) => {
        const game = prediction.game;
        const betType = prediction.predictionType;
        const selection = prediction.recommendation;
        
        // Calculate value and risk metrics
        const valueScore = calculateValueScore(
          selection, 
          game.odds[betType], 
          prediction.probability
        );
        
        const riskAssessment = assessRisk(
          prediction.confidence, 
          prediction.insights.riskLevel
        );

        return {
          predictionId: prediction._id,
          gameId: game._id,
          sport: game.sport,
          league: game.league,
          matchup: `${game.homeTeam.name} vs ${game.awayTeam.name}`,
          startTime: game.startTime,
          betType,
          selection,
          confidence: prediction.confidence,
          odds: game.odds[betType]?.[selection],
          valueScore,
          riskLevel: riskAssessment.level,
          recommendation: {
            shouldBet: valueScore > 5 && prediction.confidence >= minConfidence,
            maxStake: riskAssessment.maxStakePercentage,
            reasoning: prediction.insights.summary
          },
          keyFactors: prediction.insights.keyFactors.slice(0, 3)
        };
      })
    );

    // Filter and sort recommendations
    const filteredRecommendations = recommendations
      .filter(rec => rec.recommendation.shouldBet)
      .sort((a, b) => b.valueScore - a.valueScore);

    res.json({
      success: true,
      data: {
        recommendations: filteredRecommendations,
        filters: {
          sport,
          riskLevel,
          minConfidence
        },
        total: filteredRecommendations.length
      }
    });

  } catch (error) {
    logger.error('Get betting recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get betting recommendations',
      error: error.message
    });
  }
};

// Track a bet
const trackBet = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const {
      gameId,
      predictionId,
      betType,
      selection,
      odds,
      stake,
      bookmaker,
      notes,
      strategy
    } = req.body;

    // Validate game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Get prediction if provided
    let prediction = null;
    if (predictionId) {
      prediction = await Prediction.findById(predictionId);
    }

    // Create bet record
    const bet = new Bet({
      user: userId,
      game: gameId,
      prediction: predictionId,
      betType,
      selection,
      odds: parseFloat(odds),
      stake: parseFloat(stake),
      bookmaker: bookmaker ? { name: bookmaker } : undefined,
      confidence: prediction?.confidence,
      riskLevel: prediction?.insights?.riskLevel,
      strategy: strategy || 'manual',
      notes,
      external: {
        tracked: true,
        placedVia: 'web_app'
      }
    });

    await bet.save();

    // Update user statistics
    await User.findByIdAndUpdate(userId, {
      $inc: { 
        'statistics.totalBets': 1,
        'statistics.totalStaked': parseFloat(stake)
      },
      $push: { bettingHistory: bet._id }
    });

    logger.info(`Bet tracked for user ${userId}: ${selection} on ${game.homeTeam.name} vs ${game.awayTeam.name}`);

    res.status(201).json({
      success: true,
      message: 'Bet tracked successfully',
      data: {
        bet: bet.getSummary(),
        expectedValue: bet.calculateExpectedValue(),
        roi: bet.calculateROI()
      }
    });

  } catch (error) {
    logger.error('Track bet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track bet',
      error: error.message
    });
  }
};

// Get user's betting history
const getBettingHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      status = 'all',
      sport,
      limit = 20,
      offset = 0 
    } = req.query;

    let query = { user: userId, isActive: true };
    
    if (status !== 'all') {
      query.status = status;
    }
    
    if (sport) {
      // Need to join with Game to filter by sport
      const games = await Game.find({ sport }).select('_id');
      const gameIds = games.map(g => g._id);
      query.game = { $in: gameIds };
    }

    const bets = await Bet.find(query)
      .populate('game', 'sport league homeTeam awayTeam startTime status scores')
      .populate('prediction', 'confidence recommendation insights')
      .sort({ placedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Bet.countDocuments(query);

    // Calculate summary statistics
    const summary = {
      totalBets: bets.length,
      totalStaked: bets.reduce((sum, bet) => sum + bet.stake, 0),
      totalReturn: bets.reduce((sum, bet) => sum + (bet.result?.actualPayout || 0), 0),
      winningBets: bets.filter(bet => bet.status === 'won').length,
      losingBets: bets.filter(bet => bet.status === 'lost').length,
      pendingBets: bets.filter(bet => bet.status === 'pending').length
    };

    summary.netProfit = summary.totalReturn - summary.totalStaked;
    summary.roi = summary.totalStaked > 0 ? (summary.netProfit / summary.totalStaked) * 100 : 0;
    summary.winRate = summary.totalBets > 0 ? (summary.winningBets / (summary.winningBets + summary.losingBets)) * 100 : 0;

    res.json({
      success: true,
      data: {
        bets: bets.map(bet => ({
          ...bet.getSummary(),
          game: bet.game,
          prediction: bet.prediction
        })),
        summary,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    });

  } catch (error) {
    logger.error('Get betting history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get betting history',
      error: error.message
    });
  }
};

// Update bet result (for manual settlement)
const updateBetResult = async (req, res) => {
  try {
    const { betId } = req.params;
    const { outcome, actualPayout } = req.body;
    const userId = req.user.userId;

    const bet = await Bet.findOne({ _id: betId, user: userId });
    if (!bet) {
      return res.status(404).json({
        success: false,
        message: 'Bet not found'
      });
    }

    // Update bet result
    bet.result.outcome = outcome;
    bet.result.actualPayout = parseFloat(actualPayout) || 0;
    bet.result.profit = bet.result.actualPayout - bet.stake;
    bet.result.settledAt = new Date();
    
    // Update status
    if (outcome === 'win') bet.status = 'won';
    else if (outcome === 'loss') bet.status = 'lost';
    else if (outcome === 'push') bet.status = 'push';
    
    // Calculate metrics
    bet.metrics.roi = bet.calculateROI();
    bet.metrics.units = bet.calculateUnits();

    await bet.save();

    // Update user statistics
    const user = await User.findById(userId);
    if (outcome === 'win') {
      user.statistics.winningBets += 1;
      user.statistics.totalWinnings += bet.result.actualPayout;
    }
    user.statistics.roi = user.calculateROI();
    await user.save();

    logger.info(`Bet ${betId} updated: ${outcome}`);

    res.json({
      success: true,
      message: 'Bet result updated successfully',
      data: {
        bet: bet.getSummary()
      }
    });

  } catch (error) {
    logger.error('Update bet result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bet result',
      error: error.message
    });
  }
};

// Helper functions
const calculateValueScore = (selection, odds, probability) => {
  if (!odds || !odds[selection] || !probability || !probability[selection]) return 0;
  
  const impliedProbability = 1 / odds[selection];
  const trueProbability = probability[selection] / 100;
  
  return trueProbability > impliedProbability ? 
    ((trueProbability - impliedProbability) / impliedProbability) * 100 : 0;
};

const assessRisk = (confidence, riskLevel) => {
  let level = 'medium';
  let maxStakePercentage = 2; // 2% of bankroll
  
  if (confidence >= 80 && riskLevel === 'low') {
    level = 'low';
    maxStakePercentage = 5;
  } else if (confidence < 60 || riskLevel === 'high') {
    level = 'high';
    maxStakePercentage = 1;
  }
  
  return { level, maxStakePercentage };
};

const calculateExpectedValue = (stake, odds, probability) => {
  if (!odds || !probability) return 0;
  
  const prob = probability / 100;
  return (prob * (stake * odds - stake)) - ((1 - prob) * stake);
};

const calculateKelly = (probability, odds) => {
  if (!probability || !odds) return 0;
  
  const prob = probability / 100;
  const b = odds - 1; // Convert to decimal odds minus 1
  
  const kelly = (prob * b - (1 - prob)) / b;
  return Math.max(0, kelly * 100); // Return as percentage, minimum 0
};

const generateBettingRecommendation = (analysis) => {
  const { valueScore, riskAssessment, expectedValue } = analysis.analysis;
  
  let shouldBet = false;
  let reasoning = '';
  let suggestedStake = 0;
  
  if (valueScore > 5 && expectedValue > 0) {
    shouldBet = true;
    suggestedStake = riskAssessment.maxStakePercentage;
    reasoning = `Positive expected value (${expectedValue.toFixed(2)}) with ${valueScore.toFixed(1)}% value score`;
  } else if (valueScore <= 0) {
    reasoning = 'No value detected - odds do not favor this bet';
  } else if (expectedValue <= 0) {
    reasoning = 'Negative expected value - not recommended';
  }
  
  return {
    shouldBet,
    reasoning,
    suggestedStake
  };
};

module.exports = {
  analyzeBettingOpportunity,
  getBettingRecommendations,
  trackBet,
  getBettingHistory,
  updateBetResult
};
