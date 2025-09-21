/**
 * 🔧 Trade API Template
 * Standardized structure for all trade-specific APIs
 * Each trade service extends this base template
 */

const express = require('express');
const cors = require('cors');
const compression = require('compression');

class TradeAPITemplate {
    constructor(tradeConfig) {
        this.app = express();
        this.trade = tradeConfig.trade;
        this.port = tradeConfig.port || 3000;
        this.templates = tradeConfig.templates || {};
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        // Standard middleware for all trade APIs
        this.app.use(compression());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`[${this.trade.toUpperCase()}] ${req.method} ${req.path} - ${new Date().toISOString()}`);
            next();
        });
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                service: `${this.trade}-api`,
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });

        // Service info endpoint
        this.app.get('/info', (req, res) => {
            res.json({
                trade: this.trade,
                capabilities: this.getCapabilities(),
                templates: Object.keys(this.templates),
                endpoints: this.getEndpoints()
            });
        });

        // Main estimate endpoint
        this.app.post('/estimate', async (req, res) => {
            try {
                const estimate = await this.generateEstimate(req.body);
                res.json(estimate);
            } catch (error) {
                console.error(`[${this.trade.toUpperCase()}] Estimate error:`, error);
                res.status(500).json({
                    error: 'Estimate generation failed',
                    details: error.message
                });
            }
        });

        // Template listing endpoint
        this.app.get('/templates', (req, res) => {
            res.json({
                trade: this.trade,
                templates: this.templates
            });
        });

        // Specific template endpoint
        this.app.get('/templates/:templateId', (req, res) => {
            const template = this.templates[req.params.templateId];
            if (!template) {
                return res.status(404).json({
                    error: 'Template not found',
                    templateId: req.params.templateId
                });
            }
            res.json(template);
        });
    }

    // ============================================
    // METHODS TO BE OVERRIDDEN BY SPECIFIC TRADES
    // ============================================

    /**
     * Generate estimate - MUST be implemented by each trade
     * @param {Object} request - Standardized request format
     * @returns {Object} - Standardized estimate response
     */
    async generateEstimate(request) {
        throw new Error(`generateEstimate() must be implemented by ${this.trade} API`);
    }

    /**
     * Get trade capabilities - SHOULD be overridden
     * @returns {Array} - List of trade capabilities
     */
    getCapabilities() {
        return [
            'estimate_generation',
            'template_based_calculations',
            'material_lists',
            'labor_calculations'
        ];
    }

    /**
     * Get available endpoints - CAN be overridden to add trade-specific endpoints
     * @returns {Array} - List of available endpoints
     */
    getEndpoints() {
        return [
            'GET /health',
            'GET /info', 
            'POST /estimate',
            'GET /templates',
            'GET /templates/:templateId'
        ];
    }

    // ============================================
    // SHARED UTILITY METHODS
    // ============================================

    /**
     * Validate incoming request format
     */
    validateRequest(request) {
        if (!request.request_id) {
            throw new Error('Missing required field: request_id');
        }
        if (!request.project) {
            throw new Error('Missing required field: project');
        }
        if (!request.trade_scope) {
            throw new Error('Missing required field: trade_scope');
        }
        return true;
    }

    /**
     * Calculate labor costs
     */
    calculateLaborCost(hours, skillLevel = 'skilled', region = 'national') {
        const rates = {
            helper: { national: 32, northeast: 38, west: 42, south: 28 },
            skilled: { national: 65, northeast: 75, west: 82, south: 58 },
            master: { national: 85, northeast: 95, west: 105, south: 78 }
        };
        
        return hours * (rates[skillLevel][region] || rates[skillLevel].national);
    }

    /**
     * Apply waste factor to material quantity
     */
    applyWasteFactor(quantity, wasteFactor = 0.1) {
        return quantity * (1 + wasteFactor);
    }

    /**
     * Apply regional multiplier
     */
    applyRegionalMultiplier(cost, region = 'national') {
        const multipliers = {
            national: 1.0,
            northeast: 1.15,
            west: 1.25,
            south: 0.90,
            midwest: 0.95
        };
        
        return cost * (multipliers[region] || 1.0);
    }

    /**
     * Generate standardized response format
     */
    formatResponse(requestId, estimateData, coordinationRequirements = {}) {
        return {
            request_id: requestId,
            trade: this.trade,
            estimate: {
                phases: estimateData.phases || [],
                labor: {
                    total_hours: estimateData.totalHours || 0,
                    cost: estimateData.laborCost || 0,
                    timeline_days: estimateData.timelineDays || 1
                },
                materials: {
                    line_items: estimateData.materials || [],
                    total_cost: estimateData.materialCost || 0
                },
                total_cost: (estimateData.laborCost || 0) + (estimateData.materialCost || 0),
                confidence: estimateData.confidence || 0.85,
                complications: estimateData.complications || []
            },
            coordination_requirements: coordinationRequirements,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Start the API server
     */
    start() {
        this.app.listen(this.port, () => {
            console.log(`🔧 ${this.trade.toUpperCase()} API running on port ${this.port}`);
            console.log(`📋 Templates loaded: ${Object.keys(this.templates).length}`);
            console.log(`🌐 Endpoints: http://localhost:${this.port}/info`);
        });
    }
}

module.exports = TradeAPITemplate;