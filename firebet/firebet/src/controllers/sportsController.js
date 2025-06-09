const { validationResult } = require('express-validator');
const Game = require('../models/Game');
const Sport = require('../models/Sport');
const config = require('../config/config');
const logger = require('../middleware/logger');
const { getRedisClient } = require('../config/redis');

// Get all supported sports
const getSupportedSports = async (req, res) => {
  try {
    const sports = await Sport.find({ isActive: true })
      .select('name displayName leagues predictionFactors bettingMarkets statistics');

    const formattedSports = sports.map(sport => ({
      name: sport.name,
      displayName: sport.displayName,
      leagues: sport.getActiveLeagues(),
      predictionFactors: sport.getPredictionFactorsInOrder(),
      bettingMarkets: sport.bettingMarkets.filter(market => market.isActive),
      statistics: sport.statistics
    }));

    res.json({
      success: true,
      data: {
        sports: formattedSports,
        total: formattedSports.length
      }
    });

  } catch (error) {
    logger.error('Get supported sports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supported sports',
      error: error.message
    });
  }
};

// Get games by sport and filters
const getGames = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      sport, 
      league, 
      date, 
      status = 'all',
      limit = 50,
      offset = 0 
    } = req.query;

    // Build query
    let query = {};
    
    if (sport) {
      query.sport = sport;
    }
    
    if (league) {
      query.league = league;
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.startTime = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }
    
    if (status !== 'all') {
      query.status = status;
    }

    query.isActive = true;

    // Check cache first
    const cacheKey = `games:${JSON.stringify(query)}:${limit}:${offset}`;
    const redisClient = getRedisClient();
    
    try {
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        return res.json(JSON.parse(cachedResult));
      }
    } catch (cacheError) {
      logger.warn('Cache retrieval failed:', cacheError);
    }

    // Get games from database
    const games = await Game.find(query)
      .sort({ startTime: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('predictions', 'confidence recommendation insights')
      .lean();

    const total = await Game.countDocuments(query);

    const result = {
      success: true,
      data: {
        games: games.map(game => ({
          id: game._id,
          sport: game.sport,
          league: game.league,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          startTime: game.startTime,
          timezone: game.timezone,
          status: game.status,
          scores: game.scores,
          odds: game.odds,
          venue: game.venue,
          predictions: game.predictions,
          predictionConfidence: game.calculatePredictionConfidence ? game.calculatePredictionConfidence() : 0
        })),
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
      await redisClient.setEx(cacheKey, config.sports.defaultCacheTTL, JSON.stringify(result));
    } catch (cacheError) {
      logger.warn('Cache storage failed:', cacheError);
    }

    res.json(result);

  } catch (error) {
    logger.error('Get games error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get games',
      error: error.message
    });
  }
};

// Get specific game details
const getGameDetails = async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findById(gameId)
      .populate('predictions')
      .populate('bets');

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      data: {
        game: {
          ...game.toObject(),
          predictionConfidence: game.calculatePredictionConfidence()
        }
      }
    });

  } catch (error) {
    logger.error('Get game details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game details',
      error: error.message
    });
  }
};

// Get current odds for games
const getOdds = async (req, res) => {
  try {
    const { 
      sport, 
      gameIds, 
      league,
      live = false 
    } = req.query;

    let query = { isActive: true };
    
    if (sport) {
      query.sport = sport;
    }
    
    if (league) {
      query.league = league;
    }
    
    if (gameIds) {
      const ids = gameIds.split(',');
      query._id = { $in: ids };
    }
    
    if (live) {
      query.status = 'live';
    }

    // Cache key for odds
    const cacheKey = `odds:${JSON.stringify(query)}`;
    const redisClient = getRedisClient();
    
    try {
      const cachedOdds = await redisClient.get(cacheKey);
      if (cachedOdds) {
        return res.json(JSON.parse(cachedOdds));
      }
    } catch (cacheError) {
      logger.warn('Odds cache retrieval failed:', cacheError);
    }

    const games = await Game.find(query)
      .select('sport league homeTeam awayTeam startTime odds status')
      .sort({ startTime: 1 })
      .lean();

    const oddsData = games.map(game => ({
      gameId: game._id,
      sport: game.sport,
      league: game.league,
      homeTeam: game.homeTeam.name,
      awayTeam: game.awayTeam.name,
      startTime: game.startTime,
      status: game.status,
      odds: game.odds
    }));

    const result = {
      success: true,
      data: {
        odds: oddsData,
        total: oddsData.length,
        lastUpdated: new Date().toISOString()
      }
    };

    // Cache odds with shorter TTL
    try {
      await redisClient.setEx(cacheKey, 30, JSON.stringify(result)); // 30 seconds cache
    } catch (cacheError) {
      logger.warn('Odds cache storage failed:', cacheError);
    }

    res.json(result);

  } catch (error) {
    logger.error('Get odds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get odds',
      error: error.message
    });
  }
};

// Get league standings
const getLeagueStandings = async (req, res) => {
  try {
    const { sport, league, season } = req.query;

    if (!sport || !league) {
      return res.status(400).json({
        success: false,
        message: 'Sport and league are required'
      });
    }

    // This would typically call external API for standings
    // For now, return placeholder data
    const standings = {
      league,
      season: season || '2024',
      lastUpdated: new Date().toISOString(),
      teams: [] // Would be populated from external API
    };

    res.json({
      success: true,
      data: {
        standings
      }
    });

  } catch (error) {
    logger.error('Get league standings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get league standings',
      error: error.message
    });
  }
};

// Get team statistics
const getTeamStats = async (req, res) => {
  try {
    const { teamId, sport, season } = req.query;

    if (!teamId || !sport) {
      return res.status(400).json({
        success: false,
        message: 'Team ID and sport are required'
      });
    }

    // Build query to get team's recent games
    const query = {
      sport,
      isActive: true,
      $or: [
        { 'homeTeam.id': teamId },
        { 'awayTeam.id': teamId }
      ]
    };

    if (season) {
      query.season = season;
    }

    const games = await Game.find(query)
      .sort({ startTime: -1 })
      .limit(20)
      .lean();

    // Calculate basic statistics
    let wins = 0, losses = 0, draws = 0;
    let goalsFor = 0, goalsAgainst = 0;

    games.forEach(game => {
      if (game.status === 'finished' && game.scores) {
        const isHome = game.homeTeam.id === teamId;
        const teamScore = isHome ? game.scores.home : game.scores.away;
        const opponentScore = isHome ? game.scores.away : game.scores.home;

        goalsFor += teamScore;
        goalsAgainst += opponentScore;

        if (teamScore > opponentScore) wins++;
        else if (teamScore < opponentScore) losses++;
        else draws++;
      }
    });

    const stats = {
      teamId,
      sport,
      season,
      gamesPlayed: wins + losses + draws,
      wins,
      losses,
      draws,
      winPercentage: (wins + losses + draws) > 0 ? (wins / (wins + losses + draws)) * 100 : 0,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      recentGames: games.slice(0, 5).map(game => ({
        date: game.startTime,
        opponent: game.homeTeam.id === teamId ? game.awayTeam.name : game.homeTeam.name,
        isHome: game.homeTeam.id === teamId,
        result: game.scores ? 
          (game.homeTeam.id === teamId ? 
            `${game.scores.home}-${game.scores.away}` : 
            `${game.scores.away}-${game.scores.home}`) : 'TBD'
      }))
    };

    res.json({
      success: true,
      data: {
        stats
      }
    });

  } catch (error) {
    logger.error('Get team stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get team statistics',
      error: error.message
    });
  }
};

// Manual sync trigger for sports data
const syncSportsData = async (req, res) => {
  try {
    const { sport, league } = req.body;

    // This would trigger the sports data sync process
    // Implementation would depend on your data source APIs

    logger.info(`Manual sync triggered for sport: ${sport}, league: ${league}`);

    res.json({
      success: true,
      message: 'Sports data sync initiated',
      data: {
        sport,
        league,
        syncStarted: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Sync sports data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync sports data',
      error: error.message
    });
  }
};

module.exports = {
  getSupportedSports,
  getGames,
  getGameDetails,
  getOdds,
  getLeagueStandings,
  getTeamStats,
  syncSportsData
};
