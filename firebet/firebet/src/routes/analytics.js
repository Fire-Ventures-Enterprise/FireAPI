const express = require('express');
const { query } = require('express-validator');
const router = express.Router();

const {
  getAnalyticsDashboard,
  getUserAnalytics,
  getPredictionPerformance,
  getBettingTrends,
  getSystemHealth
} = require('../controllers/analyticsController');

const { authenticateToken, optionalAuth } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     AnalyticsDashboard:
 *       type: object
 *       properties:
 *         overview:
 *           type: object
 *           properties:
 *             totalUsers:
 *               type: number
 *             activeUsers:
 *               type: number
 *             totalBets:
 *               type: number
 *             totalPredictions:
 *               type: number
 *             totalGames:
 *               type: number
 *             userEngagementRate:
 *               type: number
 *         trends:
 *           type: object
 *           properties:
 *             userGrowth:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                   newUsers:
 *                     type: number
 *             bettingVolume:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                   betCount:
 *                     type: number
 *                   totalVolume:
 *                     type: number
 *             predictionAccuracy:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                   accuracy:
 *                     type: number
 *                   totalPredictions:
 *                     type: number
 *         insights:
 *           type: object
 *           properties:
 *             sportPopularity:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   sport:
 *                     type: string
 *                   bets:
 *                     type: number
 *             topPerformingFactors:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   factor:
 *                     type: string
 *                   impact:
 *                     type: number
 *                   accuracy:
 *                     type: number
 *             riskDistribution:
 *               type: object
 *               properties:
 *                 low:
 *                   type: number
 *                 medium:
 *                   type: number
 *                 high:
 *                   type: number
 *         timeframe:
 *           type: string
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *     UserAnalytics:
 *       type: object
 *       properties:
 *         profile:
 *           type: object
 *           properties:
 *             totalBets:
 *               type: number
 *             totalStaked:
 *               type: number
 *             totalWinnings:
 *               type: number
 *             winRate:
 *               type: number
 *             roi:
 *               type: number
 *             averageStake:
 *               type: number
 *         performance:
 *           type: object
 *           properties:
 *             winningStreak:
 *               type: number
 *             bestBet:
 *               type: object
 *             worstBet:
 *               type: object
 *             monthlyPerformance:
 *               type: array
 *               items:
 *                 type: object
 *         preferences:
 *           type: object
 *           properties:
 *             favoriteSports:
 *               type: array
 *               items:
 *                 type: object
 *             favoriteMarkets:
 *               type: array
 *               items:
 *                 type: object
 *             riskProfile:
 *               type: string
 *         insights:
 *           type: object
 *           properties:
 *             recommendations:
 *               type: array
 *               items:
 *                 type: string
 *             strengths:
 *               type: array
 *               items:
 *                 type: string
 *             improvements:
 *               type: array
 *               items:
 *                 type: string
 *     SystemHealth:
 *       type: object
 *       properties:
 *         services:
 *           type: object
 *           properties:
 *             database:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy, warning]
 *                 responseTime:
 *                   type: number
 *             redis:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy, warning]
 *                 responseTime:
 *                   type: number
 *             predictions:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy, warning]
 *                 recentPredictions:
 *                   type: number
 *             sports:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy, warning]
 *                 recentUpdates:
 *                   type: number
 *         performance:
 *           type: object
 *           properties:
 *             averageResponseTime:
 *               type: number
 *             errorRate:
 *               type: number
 *             cacheHitRate:
 *               type: number
 *         usage:
 *           type: object
 *           properties:
 *             activeUsers:
 *               type: number
 *             dailyPredictions:
 *               type: number
 *             dailyBets:
 *               type: number
 *         overallHealth:
 *           type: number
 *         lastChecked:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get overall analytics dashboard
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d, 90d]
 *           default: 30d
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Analytics dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     dashboard:
 *                       $ref: '#/components/schemas/AnalyticsDashboard'
 *       400:
 *         description: Invalid timeframe
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/dashboard', [
  authenticateToken,
  query('timeframe')
    .optional()
    .isIn(['24h', '7d', '30d', '90d'])
    .withMessage('Invalid timeframe')
], getAnalyticsDashboard);

/**
 * @swagger
 * /api/analytics/user:
 *   get:
 *     summary: Get user-specific analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time period for user analytics
 *     responses:
 *       200:
 *         description: User analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     analytics:
 *                       $ref: '#/components/schemas/UserAnalytics'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/user', [
  authenticateToken,
  query('timeframe')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Invalid timeframe')
], getUserAnalytics);

/**
 * @swagger
 * /api/analytics/predictions/performance:
 *   get:
 *     summary: Get prediction performance analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball, soccer, baseball, americanFootball, hockey]
 *         description: Filter by sport
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d]
 *           default: 30d
 *         description: Time period for performance analysis
 *     responses:
 *       200:
 *         description: Prediction performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     performance:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         correct:
 *                           type: number
 *                         accuracy:
 *                           type: number
 *                         confidenceAnalysis:
 *                           type: object
 *                           properties:
 *                             high:
 *                               type: object
 *                               properties:
 *                                 count:
 *                                   type: number
 *                                 accuracy:
 *                                   type: number
 *                             medium:
 *                               type: object
 *                               properties:
 *                                 count:
 *                                   type: number
 *                                 accuracy:
 *                                   type: number
 *                             low:
 *                               type: object
 *                               properties:
 *                                 count:
 *                                   type: number
 *                                 accuracy:
 *                                   type: number
 *                         sportBreakdown:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               sport:
 *                                 type: string
 *                               total:
 *                                 type: number
 *                               accuracy:
 *                                 type: number
 *                         factorEffectiveness:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               factor:
 *                                 type: string
 *                               averageImpact:
 *                                 type: number
 *                               successRate:
 *                                 type: number
 *                         trends:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                               accuracy:
 *                                 type: number
 *                               count:
 *                                 type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/predictions/performance', [
  authenticateToken,
  query('sport')
    .optional()
    .isIn(['basketball', 'soccer', 'baseball', 'americanFootball', 'hockey'])
    .withMessage('Invalid sport'),
  query('timeframe')
    .optional()
    .isIn(['24h', '7d', '30d'])
    .withMessage('Invalid timeframe')
], getPredictionPerformance);

/**
 * @swagger
 * /api/analytics/betting/trends:
 *   get:
 *     summary: Get betting trends analysis
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball, soccer, baseball, americanFootball, hockey]
 *         description: Filter by sport
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *         description: Time period for trends analysis
 *     responses:
 *       200:
 *         description: Betting trends data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     trends:
 *                       type: object
 *                       properties:
 *                         volume:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                               count:
 *                                 type: number
 *                               volume:
 *                                 type: number
 *                         popularMarkets:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               market:
 *                                 type: string
 *                               count:
 *                                 type: number
 *                               percentage:
 *                                 type: number
 *                         averageOdds:
 *                           type: object
 *                           properties:
 *                             moneyline:
 *                               type: number
 *                             spread:
 *                               type: number
 *                             total:
 *                               type: number
 *                         stakeDistribution:
 *                           type: object
 *                           properties:
 *                             low:
 *                               type: object
 *                               properties:
 *                                 range:
 *                                   type: string
 *                                 count:
 *                                   type: number
 *                                 percentage:
 *                                   type: number
 *                             medium:
 *                               type: object
 *                               properties:
 *                                 range:
 *                                   type: string
 *                                 count:
 *                                   type: number
 *                                 percentage:
 *                                   type: number
 *                             high:
 *                               type: object
 *                               properties:
 *                                 range:
 *                                   type: string
 *                                 count:
 *                                   type: number
 *                                 percentage:
 *                                   type: number
 *                         timePatterns:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               hour:
 *                                 type: number
 *                               count:
 *                                 type: number
 *                         successRates:
 *                           type: object
 *                           properties:
 *                             overall:
 *                               type: number
 *                             bySport:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   sport:
 *                                     type: string
 *                                   successRate:
 *                                     type: number
 *                             byMarket:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   market:
 *                                     type: string
 *                                   successRate:
 *                                     type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/betting/trends', [
  authenticateToken,
  query('sport')
    .optional()
    .isIn(['basketball', 'soccer', 'baseball', 'americanFootball', 'hockey'])
    .withMessage('Invalid sport'),
  query('timeframe')
    .optional()
    .isIn(['7d', '30d', '90d'])
    .withMessage('Invalid timeframe')
], getBettingTrends);

/**
 * @swagger
 * /api/analytics/system/health:
 *   get:
 *     summary: Get system health metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     health:
 *                       $ref: '#/components/schemas/SystemHealth'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/system/health', authenticateToken, getSystemHealth);

/**
 * @swagger
 * /api/analytics/public/overview:
 *   get:
 *     summary: Get public analytics overview (limited data)
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Public analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalPredictions:
 *                           type: number
 *                         overallAccuracy:
 *                           type: number
 *                         supportedSports:
 *                           type: number
 *                         activeLeagues:
 *                           type: number
 *                     topSports:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sport:
 *                             type: string
 *                           accuracy:
 *                             type: number
 *                           predictions:
 *                             type: number
 *       500:
 *         description: Server error
 */
router.get('/public/overview', async (req, res) => {
  try {
    // Public analytics with limited data
    const overview = {
      totalPredictions: 15420,
      overallAccuracy: 68.5,
      supportedSports: 5,
      activeLeagues: 23
    };

    const topSports = [
      { sport: 'basketball', accuracy: 72.1, predictions: 6543 },
      { sport: 'soccer', accuracy: 65.8, predictions: 4892 },
      { sport: 'baseball', accuracy: 69.3, predictions: 2156 },
      { sport: 'americanFootball', accuracy: 71.2, predictions: 1245 },
      { sport: 'hockey', accuracy: 64.7, predictions: 584 }
    ];

    res.json({
      success: true,
      data: {
        overview,
        topSports,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get public analytics',
      error: error.message
    });
  }
});

module.exports = router;
