const express = require('express');
const { query, body } = require('express-validator');
const router = express.Router();

const {
  getSupportedSports,
  getGames,
  getGameDetails,
  getOdds,
  getLeagueStandings,
  getTeamStats,
  syncSportsData
} = require('../controllers/sportsController');

const { optionalAuth, authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Game:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         sport:
 *           type: string
 *           enum: [basketball, soccer, baseball, americanFootball, hockey]
 *         league:
 *           type: string
 *         homeTeam:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             shortName:
 *               type: string
 *             logo:
 *               type: string
 *         awayTeam:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             shortName:
 *               type: string
 *             logo:
 *               type: string
 *         startTime:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [scheduled, live, halftime, finished, postponed, cancelled]
 *         scores:
 *           type: object
 *           properties:
 *             home:
 *               type: number
 *             away:
 *               type: number
 *         odds:
 *           type: object
 *           properties:
 *             moneyline:
 *               type: object
 *               properties:
 *                 home:
 *                   type: number
 *                 away:
 *                   type: number
 *                 draw:
 *                   type: number
 *             spread:
 *               type: object
 *               properties:
 *                 home:
 *                   type: number
 *                 away:
 *                   type: number
 *                 line:
 *                   type: number
 *             total:
 *               type: object
 *               properties:
 *                 over:
 *                   type: number
 *                 under:
 *                   type: number
 *                 line:
 *                   type: number
 *     Sport:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         displayName:
 *           type: string
 *         leagues:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               country:
 *                 type: string
 *         predictionFactors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               weight:
 *                 type: number
 *               description:
 *                 type: string
 */

/**
 * @swagger
 * /api/sports:
 *   get:
 *     summary: Get all supported sports
 *     tags: [Sports]
 *     responses:
 *       200:
 *         description: List of supported sports
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
 *                     sports:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Sport'
 *                     total:
 *                       type: number
 *       500:
 *         description: Server error
 */
router.get('/', getSupportedSports);

/**
 * @swagger
 * /api/sports/games:
 *   get:
 *     summary: Get games by sport and filters
 *     tags: [Sports]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball, soccer, baseball, americanFootball, hockey]
 *         description: Filter by sport
 *       - in: query
 *         name: league
 *         schema:
 *           type: string
 *         description: Filter by league
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, scheduled, live, finished]
 *           default: all
 *         description: Filter by game status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of games to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of games to skip
 *     responses:
 *       200:
 *         description: List of games
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
 *                     games:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Game'
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
router.get('/games', [
  query('sport')
    .optional()
    .isIn(['basketball', 'soccer', 'baseball', 'americanFootball', 'hockey'])
    .withMessage('Invalid sport'),
  query('date')
    .optional()
    .isISO8601({ strict: true })
    .withMessage('Date must be in YYYY-MM-DD format'),
  query('status')
    .optional()
    .isIn(['all', 'scheduled', 'live', 'finished', 'postponed', 'cancelled'])
    .withMessage('Invalid status'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
], optionalAuth, getGames);

/**
 * @swagger
 * /api/sports/games/{gameId}:
 *   get:
 *     summary: Get specific game details
 *     tags: [Sports]
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *     responses:
 *       200:
 *         description: Game details
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
 *                     game:
 *                       $ref: '#/components/schemas/Game'
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
router.get('/games/:gameId', optionalAuth, getGameDetails);

/**
 * @swagger
 * /api/sports/odds:
 *   get:
 *     summary: Get current odds for games
 *     tags: [Sports]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball, soccer, baseball, americanFootball, hockey]
 *         description: Filter by sport
 *       - in: query
 *         name: gameIds
 *         schema:
 *           type: string
 *         description: Comma-separated list of game IDs
 *       - in: query
 *         name: league
 *         schema:
 *           type: string
 *         description: Filter by league
 *       - in: query
 *         name: live
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Only live games
 *     responses:
 *       200:
 *         description: Current odds data
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
 *                     odds:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           gameId:
 *                             type: string
 *                           sport:
 *                             type: string
 *                           homeTeam:
 *                             type: string
 *                           awayTeam:
 *                             type: string
 *                           odds:
 *                             type: object
 *                     total:
 *                       type: number
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Server error
 */
router.get('/odds', [
  query('sport')
    .optional()
    .isIn(['basketball', 'soccer', 'baseball', 'americanFootball', 'hockey'])
    .withMessage('Invalid sport'),
  query('live')
    .optional()
    .isBoolean()
    .withMessage('Live must be a boolean')
], optionalAuth, getOdds);

/**
 * @swagger
 * /api/sports/standings:
 *   get:
 *     summary: Get league standings
 *     tags: [Sports]
 *     parameters:
 *       - in: query
 *         name: sport
 *         required: true
 *         schema:
 *           type: string
 *           enum: [basketball, soccer, baseball, americanFootball, hockey]
 *         description: Sport type
 *       - in: query
 *         name: league
 *         required: true
 *         schema:
 *           type: string
 *         description: League name
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *         description: Season year
 *     responses:
 *       200:
 *         description: League standings
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
 *                     standings:
 *                       type: object
 *                       properties:
 *                         league:
 *                           type: string
 *                         season:
 *                           type: string
 *                         teams:
 *                           type: array
 *                           items:
 *                             type: object
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Server error
 */
router.get('/standings', [
  query('sport')
    .notEmpty()
    .isIn(['basketball', 'soccer', 'baseball', 'americanFootball', 'hockey'])
    .withMessage('Valid sport is required'),
  query('league')
    .notEmpty()
    .withMessage('League is required')
], optionalAuth, getLeagueStandings);

/**
 * @swagger
 * /api/sports/teams/stats:
 *   get:
 *     summary: Get team statistics
 *     tags: [Sports]
 *     parameters:
 *       - in: query
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *       - in: query
 *         name: sport
 *         required: true
 *         schema:
 *           type: string
 *           enum: [basketball, soccer, baseball, americanFootball, hockey]
 *         description: Sport type
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *         description: Season year
 *     responses:
 *       200:
 *         description: Team statistics
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
 *                     stats:
 *                       type: object
 *                       properties:
 *                         teamId:
 *                           type: string
 *                         sport:
 *                           type: string
 *                         gamesPlayed:
 *                           type: number
 *                         wins:
 *                           type: number
 *                         losses:
 *                           type: number
 *                         winPercentage:
 *                           type: number
 *                         recentGames:
 *                           type: array
 *                           items:
 *                             type: object
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Server error
 */
router.get('/teams/stats', [
  query('teamId')
    .notEmpty()
    .withMessage('Team ID is required'),
  query('sport')
    .notEmpty()
    .isIn(['basketball', 'soccer', 'baseball', 'americanFootball', 'hockey'])
    .withMessage('Valid sport is required')
], optionalAuth, getTeamStats);

/**
 * @swagger
 * /api/sports/sync:
 *   post:
 *     summary: Manual sync trigger for sports data
 *     tags: [Sports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sport:
 *                 type: string
 *                 enum: [basketball, soccer, baseball, americanFootball, hockey]
 *               league:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sync initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     sport:
 *                       type: string
 *                     league:
 *                       type: string
 *                     syncStarted:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/sync', [
  authenticateToken,
  body('sport')
    .optional()
    .isIn(['basketball', 'soccer', 'baseball', 'americanFootball', 'hockey'])
    .withMessage('Invalid sport'),
  body('league')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('League cannot be empty')
], syncSportsData);

module.exports = router;
