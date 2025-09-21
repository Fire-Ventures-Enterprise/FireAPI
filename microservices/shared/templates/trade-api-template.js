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
     * Structure labor requirements (NO PRICING)
     */
    structureLaborRequirements(hours, skillLevel = 'skilled', region = 'national') {
        return {
            hours: hours,
            skill_level: skillLevel,
            region: region,
            pricing_required: true,
            note: 'Labor rates must be provided by external pricing service'
        };
    }

    /**
     * Apply waste factor to material quantity
     */
    applyWasteFactor(quantity, wasteFactor = 0.1) {
        return quantity * (1 + wasteFactor);
    }

    /**
     * Structure regional requirements (NO PRICING MULTIPLIERS)
     */
    structureRegionalRequirements(region = 'national') {
        return {
            region: region,
            regional_factors_required: true,
            note: 'Regional pricing multipliers must be provided by external pricing service'
        };
    }

    /**
     * Generate standardized response format (NO PRICING DATA)
     */
    formatResponse(requestId, estimateData, coordinationRequirements = {}) {
        return {
            request_id: requestId,
            trade: this.trade,
            estimate: {
                phases: estimateData.phases || [],
                labor: {
                    total_hours: estimateData.totalHours || 0,
                    timeline_days: estimateData.timelineDays || 1,
                    pricing_required: true
                },
                materials: {
                    line_items: estimateData.materials || [],
                    pricing_required: true
                },
                pricing_incomplete: true,
                confidence: estimateData.confidence || 0.85,
                complications: estimateData.complications || []
            },
            coordination_requirements: coordinationRequirements,
            timestamp: new Date().toISOString(),
            note: 'Estimate structure complete - pricing data required from external service'
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