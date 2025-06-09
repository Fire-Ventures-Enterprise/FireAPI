const express = require('express');
const { query, param } = require('express-validator');
const router = express.Router();

const {
  getPredictionData,
  generatePredictionInsights,
  getPredictionFactors,
  getPredictionDetails,
  getPredictionAnalytics
} = require('../controllers/predictionsController');

const { optionalAuth, authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Prediction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         game:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             sport:
 *               type: string
 *             homeTeam:
 *               type: object
 *             awayTeam:
 *               type: object
 *             startTime:
 *               type: string
 *               format: date-time
 *         sport:
 *           type: string
 *           enum: [basketball, soccer, baseball, americanFootball, hockey]
 *         predictionType:
 *           type: string
 *           enum: [moneyline, spread, total, player_props, team_props]
 *         recommendation:
 *           type: string
 *           enum: [home, away, draw, over, under]
 *         confidence:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *         probability:
 *           type: object
 *           properties:
 *             home:
 *               type: number
 *             away:
 *               type: number
 *             draw:
 *               type: number
 *         orderedFactorAnalysis:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               factor:
 *                 type: string
 *               impact:
 *                 type: number
 *                 minimum: -10
 *                 maximum: 10
 *               reasoning:
 *                 type: string
 *         insights:
 *           type: object
 *           properties:
 *             keyFactors:
 *               type: array
 *               items:
 *                 type: string
 *             riskLevel:
 *               type: string
 *               enum: [low, medium, high]
 *             valueRating:
 *               type: number
 *               minimum: 1
 *               maximum: 10
 *             summary:
 *               type: string
 *             reasoning:
 *               type: string
 *         odds:
 *           type: object
 *           properties:
 *             recommended:
 *               type: number
 *             current:
 *               type: number
 *             value:
 *               type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *     PredictionFactor:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         weight:
 *           type: number
 *         description:
 *           type: string
 */

/**
 * @swagger
 * /api/predictions:
 *   get:
 *     summary: Get prediction data
 *     tags: [Predictions]
 *     parameters:
 *       - in: query
 *         name: gameId
 *         schema:
 *           type: string
 *         description: Filter by specific game ID
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball, soccer, baseball, americanFootball, hockey]
 *         description: Filter by sport
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of predictions to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of predictions to skip
 *     responses:
 *       200:
 *         description: List of predictions with ordered factor analysis
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
 *                     predictions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Prediction'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         limit:
 *                           type: number
 *                         offset:
 *                           type: number
 *                         hasMore:
 *                           type: boolean
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.get('/', [
  query('sport')
    .optional()
    .isIn(['basketball', 'soccer', 'baseball', 'americanFootball', 'hockey'])
    .withMessage('Invalid sport'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
], optionalAuth, getPredictionData);

/**
 * @swagger
 * /api/predictions/generate/{gameId}:
 *   post:
 *     summary: Generate prediction insights for a specific game
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID to generate prediction for
 *     responses:
 *       200:
 *         description: Prediction insights generated successfully
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
 *                     prediction:
 *                       $ref: '#/components/schemas/Prediction'
 *                     cached:
 *                       type: boolean
 *       400:
 *         description: Sport not configured or invalid game
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
router.post('/generate/:gameId', [
  authenticateToken,
  param('gameId')
    .isMongoId()
    .withMessage('Invalid game ID')
], generatePredictionInsights);

/**
 * @swagger
 * /api/predictions/factors/{sport}:
 *   get:
 *     summary: Get prediction factors for a specific sport
 *     tags: [Predictions]
 *     parameters:
 *       - in: path
 *         name: sport
 *         required: true
 *         schema:
 *           type: string
 *           enum: [basketball, soccer, baseball, americanFootball, hockey]
 *         description: Sport to get prediction factors for
 *     responses:
 *       200:
 *         description: Prediction factors in exact collection order
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
 *                     sport:
 *                       type: string
 *                     factors:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PredictionFactor'
 *                     factorOrder:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Exact order for factor collection
 *                     description:
 *                       type: string
 *       404:
 *         description: Sport not found or not active
 *       500:
 *         description: Server error
 */
router.get('/factors/:sport', [
  param('sport')
    .isIn(['basketball', 'soccer', 'baseball', 'americanFootball', 'hockey'])
    .withMessage('Invalid sport')
], getPredictionFactors);

/**
 * @swagger
 * /api/predictions/{predictionId}:
 *   get:
 *     summary: Get specific prediction details
 *     tags: [Predictions]
 *     parameters:
 *       - in: path
 *         name: predictionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Prediction ID
 *     responses:
 *       200:
 *         description: Detailed prediction with ordered factor analysis
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
 *                     prediction:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Prediction'
 *                         - type: object
 *                           properties:
 *                             topFactors:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   factor:
 *                                     type: string
 *                                   impact:
 *                                     type: number
 *                                   reasoning:
 *                                     type: string
 *                               description: Top 5 most impactful factors
 *       404:
 *         description: Prediction not found
 *       500:
 *         description: Server error
 */
router.get('/:predictionId', [
  param('predictionId')
    .isMongoId()
    .withMessage('Invalid prediction ID')
], optionalAuth, getPredictionDetails);

/**
 * @swagger
 * /api/predictions/analytics/performance:
 *   get:
 *     summary: Get prediction performance analytics
 *     tags: [Predictions]
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
 *           default: 7d
 *         description: Time period for analytics
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/analytics/performance', [
  authenticateToken,
  query('sport')
    .optional()
    .isIn(['basketball', 'soccer', 'baseball', 'americanFootball', 'hockey'])
    .withMessage('Invalid sport'),
  query('timeframe')
    .optional()
    .isIn(['24h', '7d', '30d'])
    .withMessage('Invalid timeframe')
], getPredictionAnalytics);

/**
 * @swagger
 * /api/predictions/demo/soccer:
 *   get:
 *     summary: Get demo soccer prediction factors (for testing)
 *     tags: [Predictions]
 *     responses:
 *       200:
 *         description: Demo soccer prediction factors in exact order
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
 *                     sport:
 *                       type: string
 *                       example: soccer
 *                     orderedFactors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: [referee, weather, venue, travelDistance, timeChange, injuries, managers, managersH2HRecords, nightOrDayMatch, regularSeason, playoffs, worldCup]
 *                     description:
 *                       type: string
 *                       example: Soccer prediction factors collected in exact order as specified
 */
router.get('/demo/soccer', (req, res) => {
  res.json({
    success: true,
    data: {
      sport: 'soccer',
      orderedFactors: [
        'referee',
        'weather', 
        'venue',
        'travelDistance',
        'timeChange',
        'injuries',
        'managers',
        'managersH2HRecords',
        'nightOrDayMatch',
        'regularSeason',
        'playoffs',
        'worldCup'
      ],
      description: 'Soccer prediction factors collected in exact order as specified'
    }
  });
});

/**
 * @swagger
 * /api/predictions/demo/basketball:
 *   get:
 *     summary: Get demo basketball prediction factors (for testing)
 *     tags: [Predictions]
 *     responses:
 *       200:
 *         description: Demo basketball prediction factors in exact order
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
 *                     sport:
 *                       type: string
 *                       example: basketball
 *                     orderedFactors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: [referee, venue, travelDistance, timeChange, injuries, coaches, coachesH2HRecords, backToBackGames, restDays, regularSeason, playoffs, altitude]
 *                     description:
 *                       type: string
 *                       example: Basketball prediction factors collected in exact order as specified
 */
router.get('/demo/basketball', (req, res) => {
  res.json({
    success: true,
    data: {
      sport: 'basketball',
      orderedFactors: [
        'referee',
        'venue',
        'travelDistance',
        'timeChange',
        'injuries',
        'coaches',
        'coachesH2HRecords',
        'backToBackGames',
        'restDays',
        'regularSeason',
        'playoffs',
        'altitude'
      ],
      description: 'Basketball prediction factors collected in exact order as specified'
    }
  });
});

module.exports = router;
