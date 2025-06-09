const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();

const {
  analyzeBettingOpportunity,
  getBettingRecommendations,
  trackBet,
  getBettingHistory,
  updateBetResult
} = require('../controllers/bettingController');

const { authenticateToken, optionalAuth } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     BettingAnalysis:
 *       type: object
 *       properties:
 *         gameId:
 *           type: string
 *         betType:
 *           type: string
 *           enum: [moneyline, spread, total, player_props, team_props]
 *         selection:
 *           type: string
 *         stake:
 *           type: number
 *         currentOdds:
 *           type: object
 *         prediction:
 *           type: object
 *           properties:
 *             recommendation:
 *               type: string
 *             confidence:
 *               type: number
 *             probability:
 *               type: object
 *         analysis:
 *           type: object
 *           properties:
 *             valueScore:
 *               type: number
 *             riskAssessment:
 *               type: object
 *               properties:
 *                 level:
 *                   type: string
 *                   enum: [low, medium, high]
 *                 maxStakePercentage:
 *                   type: number
 *             expectedValue:
 *               type: number
 *             kellyPercentage:
 *               type: number
 *         recommendation:
 *           type: object
 *           properties:
 *             shouldBet:
 *               type: boolean
 *             reasoning:
 *               type: string
 *             suggestedStake:
 *               type: number
 *     BettingRecommendation:
 *       type: object
 *       properties:
 *         predictionId:
 *           type: string
 *         gameId:
 *           type: string
 *         sport:
 *           type: string
 *         league:
 *           type: string
 *         matchup:
 *           type: string
 *         startTime:
 *           type: string
 *           format: date-time
 *         betType:
 *           type: string
 *         selection:
 *           type: string
 *         confidence:
 *           type: number
 *         odds:
 *           type: number
 *         valueScore:
 *           type: number
 *         riskLevel:
 *           type: string
 *         recommendation:
 *           type: object
 *           properties:
 *             shouldBet:
 *               type: boolean
 *             maxStake:
 *               type: number
 *             reasoning:
 *               type: string
 *         keyFactors:
 *           type: array
 *           items:
 *             type: string
 *     Bet:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         gameId:
 *           type: string
 *         predictionId:
 *           type: string
 *         betType:
 *           type: string
 *           enum: [moneyline, spread, total, player_props, team_props, parlay]
 *         selection:
 *           type: string
 *         odds:
 *           type: number
 *           minimum: 1.01
 *         stake:
 *           type: number
 *           minimum: 0.01
 *         potentialPayout:
 *           type: number
 *         potentialProfit:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, won, lost, push, void, cashed_out]
 *         bookmaker:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *         strategy:
 *           type: string
 *           enum: [value_bet, safe_bet, longshot, system_bet, manual]
 *         notes:
 *           type: string
 *         placedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/betting/analyze:
 *   post:
 *     summary: Analyze betting opportunity
 *     tags: [Betting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gameId
 *               - betType
 *               - selection
 *               - stake
 *             properties:
 *               gameId:
 *                 type: string
 *                 description: Game ID to analyze
 *               betType:
 *                 type: string
 *                 enum: [moneyline, spread, total, player_props, team_props]
 *                 description: Type of bet
 *               selection:
 *                 type: string
 *                 description: Bet selection (home, away, over, under, etc.)
 *               stake:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Proposed stake amount
 *     responses:
 *       200:
 *         description: Betting analysis completed
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
 *                     analysis:
 *                       $ref: '#/components/schemas/BettingAnalysis'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Game or prediction not found
 *       500:
 *         description: Server error
 */
router.post('/analyze', [
  authenticateToken,
  body('gameId')
    .isMongoId()
    .withMessage('Invalid game ID'),
  body('betType')
    .isIn(['moneyline', 'spread', 'total', 'player_props', 'team_props'])
    .withMessage('Invalid bet type'),
  body('selection')
    .trim()
    .notEmpty()
    .withMessage('Selection is required'),
  body('stake')
    .isFloat({ min: 0.01 })
    .withMessage('Stake must be a positive number')
], analyzeBettingOpportunity);

/**
 * @swagger
 * /api/betting/recommendations:
 *   get:
 *     summary: Get betting recommendations
 *     tags: [Betting]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball, soccer, baseball, americanFootball, hockey]
 *         description: Filter by sport
 *       - in: query
 *         name: riskLevel
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *           default: medium
 *         description: Risk tolerance level
 *       - in: query
 *         name: minConfidence
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 60
 *         description: Minimum confidence level for recommendations
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of recommendations to return
 *     responses:
 *       200:
 *         description: List of betting recommendations
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
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BettingRecommendation'
 *                     filters:
 *                       type: object
 *                       properties:
 *                         sport:
 *                           type: string
 *                         riskLevel:
 *                           type: string
 *                         minConfidence:
 *                           type: number
 *                     total:
 *                       type: number
 *       500:
 *         description: Server error
 */
router.get('/recommendations', [
  query('sport')
    .optional()
    .isIn(['basketball', 'soccer', 'baseball', 'americanFootball', 'hockey'])
    .withMessage('Invalid sport'),
  query('riskLevel')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid risk level'),
  query('minConfidence')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Minimum confidence must be between 1 and 100'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], optionalAuth, getBettingRecommendations);

/**
 * @swagger
 * /api/betting/track:
 *   post:
 *     summary: Track a bet
 *     tags: [Betting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gameId
 *               - betType
 *               - selection
 *               - odds
 *               - stake
 *             properties:
 *               gameId:
 *                 type: string
 *                 description: Game ID
 *               predictionId:
 *                 type: string
 *                 description: Associated prediction ID (optional)
 *               betType:
 *                 type: string
 *                 enum: [moneyline, spread, total, player_props, team_props, parlay]
 *                 description: Type of bet
 *               selection:
 *                 type: string
 *                 description: Bet selection
 *               odds:
 *                 type: number
 *                 minimum: 1.01
 *                 description: Betting odds
 *               stake:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Stake amount
 *               bookmaker:
 *                 type: string
 *                 description: Bookmaker name
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               strategy:
 *                 type: string
 *                 enum: [value_bet, safe_bet, longshot, system_bet, manual]
 *                 description: Betting strategy
 *     responses:
 *       201:
 *         description: Bet tracked successfully
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
 *                     bet:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         betType:
 *                           type: string
 *                         selection:
 *                           type: string
 *                         odds:
 *                           type: number
 *                         stake:
 *                           type: number
 *                         potentialProfit:
 *                           type: number
 *                         status:
 *                           type: string
 *                     expectedValue:
 *                       type: number
 *                     roi:
 *                       type: number
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
router.post('/track', [
  authenticateToken,
  body('gameId')
    .isMongoId()
    .withMessage('Invalid game ID'),
  body('predictionId')
    .optional()
    .isMongoId()
    .withMessage('Invalid prediction ID'),
  body('betType')
    .isIn(['moneyline', 'spread', 'total', 'player_props', 'team_props', 'parlay'])
    .withMessage('Invalid bet type'),
  body('selection')
    .trim()
    .notEmpty()
    .withMessage('Selection is required'),
  body('odds')
    .isFloat({ min: 1.01 })
    .withMessage('Odds must be greater than 1.01'),
  body('stake')
    .isFloat({ min: 0.01 })
    .withMessage('Stake must be a positive number'),
  body('bookmaker')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Bookmaker name cannot be empty'),
  body('strategy')
    .optional()
    .isIn(['value_bet', 'safe_bet', 'longshot', 'system_bet', 'manual'])
    .withMessage('Invalid strategy'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
], trackBet);

/**
 * @swagger
 * /api/betting/history:
 *   get:
 *     summary: Get user's betting history
 *     tags: [Betting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, won, lost, push, void]
 *           default: all
 *         description: Filter by bet status
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
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of bets to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of bets to skip
 *     responses:
 *       200:
 *         description: Betting history with summary statistics
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
 *                     bets:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Bet'
 *                           - type: object
 *                             properties:
 *                               game:
 *                                 type: object
 *                               prediction:
 *                                 type: object
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalBets:
 *                           type: number
 *                         totalStaked:
 *                           type: number
 *                         totalReturn:
 *                           type: number
 *                         netProfit:
 *                           type: number
 *                         roi:
 *                           type: number
 *                         winRate:
 *                           type: number
 *                         winningBets:
 *                           type: number
 *                         losingBets:
 *                           type: number
 *                         pendingBets:
 *                           type: number
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/history', [
  authenticateToken,
  query('status')
    .optional()
    .isIn(['all', 'pending', 'won', 'lost', 'push', 'void'])
    .withMessage('Invalid status'),
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
], getBettingHistory);

/**
 * @swagger
 * /api/betting/{betId}/result:
 *   put:
 *     summary: Update bet result (manual settlement)
 *     tags: [Betting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: betId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bet ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - outcome
 *               - actualPayout
 *             properties:
 *               outcome:
 *                 type: string
 *                 enum: [win, loss, push, void]
 *                 description: Bet outcome
 *               actualPayout:
 *                 type: number
 *                 minimum: 0
 *                 description: Actual payout received
 *     responses:
 *       200:
 *         description: Bet result updated successfully
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
 *                     bet:
 *                       type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bet not found
 *       500:
 *         description: Server error
 */
router.put('/:betId/result', [
  authenticateToken,
  param('betId')
    .isMongoId()
    .withMessage('Invalid bet ID'),
  body('outcome')
    .isIn(['win', 'loss', 'push', 'void'])
    .withMessage('Invalid outcome'),
  body('actualPayout')
    .isFloat({ min: 0 })
    .withMessage('Actual payout must be a non-negative number')
], updateBetResult);

module.exports = router;
