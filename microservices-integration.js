/**
 * 🎪 Microservices Integration for FireAPI.dev
 * Adds microservices orchestration to the main API
 */

const EstimateOrchestrator = require('./microservices/main-orchestrator/orchestrator');

class MicroservicesIntegration {
    constructor() {
        this.orchestrator = new EstimateOrchestrator();
        
        // Configure microservice URLs for production/development
        this.configureServiceUrls();
    }

    configureServiceUrls() {
        // Use environment variables or default to local development URLs
        this.orchestrator.tradeServices = {
            carpentry: process.env.CARPENTRY_API_URL || 'https://3001-i0k34xlfbjev6sx7pzpya-6532622b.e2b.dev',
            electrical: process.env.ELECTRICAL_API_URL || 'http://localhost:3002',
            plumbing: process.env.PLUMBING_API_URL || 'http://localhost:3003',
            painting: process.env.PAINTING_API_URL || 'http://localhost:3004',
            flooring: process.env.FLOORING_API_URL || 'http://localhost:3005',
            hvac: process.env.HVAC_API_URL || 'http://localhost:3006'
        };

        console.log('🔧 [MICROSERVICES] Service URLs configured:');
        Object.entries(this.orchestrator.tradeServices).forEach(([trade, url]) => {
            console.log(`  ${trade}: ${url}`);
        });
    }

    /**
     * Add microservices routes to Express app
     */
    addRoutes(app) {
        // Health check for microservices
        app.get('/api/microservices/health', async (req, res) => {
            try {
                const healthChecks = await this.checkAllServicesHealth();
                res.json({
                    success: true,
                    microservices: {
                        orchestrator_status: 'healthy',
                        trade_services: healthChecks,
                        total_services: Object.keys(this.orchestrator.tradeServices).length,
                        available_services: healthChecks.filter(s => s.status === 'healthy').length
                    }
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'MICROSERVICES_HEALTH_ERROR',
                        message: error.message
                    }
                });
            }
        });

        // Multi-trade estimate orchestration
        app.post('/api/estimates/multi-trade', async (req, res) => {
            try {
                const { description, project_details = {} } = req.body;

                if (!description) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Project description is required'
                        }
                    });
                }

                console.log('🎪 [API] Multi-trade estimate requested:', description);

                const estimate = await this.orchestrator.generateMultiTradeEstimate(
                    description,
                    project_details
                );

                res.json({
                    success: true,
                    data: estimate,
                    microservices: {
                        orchestrated: true,
                        pricing_complete: false, // Always false since we removed pricing
                        services_used: estimate.project?.trades_involved || [],
                        total_services_called: estimate.estimates?.by_trade?.length || 0,
                        project_type: estimate.project?.description || 'unknown'
                    }
                });

            } catch (error) {
                console.error('❌ [API] Multi-trade estimate error:', error);
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'ESTIMATION_ERROR',
                        message: error.message,
                        microservices_error: true
                    }
                });
            }
        });

        // Individual trade estimate (direct API call)
        app.post('/api/estimates/single-trade/:trade', async (req, res) => {
            try {
                const { trade } = req.params;
                const request = req.body;

                if (!this.orchestrator.tradeServices[trade]) {
                    return res.status(404).json({
                        success: false,
                        error: {
                            code: 'TRADE_NOT_FOUND',
                            message: `Trade service not available: ${trade}`,
                            available_trades: Object.keys(this.orchestrator.tradeServices)
                        }
                    });
                }

                console.log(`🔨 [API] Single trade estimate for ${trade}`);

                const serviceUrl = this.orchestrator.tradeServices[trade];
                const axios = require('axios');

                const response = await axios.post(`${serviceUrl}/estimate`, request, {
                    timeout: 30000,
                    headers: { 'Content-Type': 'application/json' }
                });

                res.json({
                    success: true,
                    data: response.data,
                    trade,
                    service_url: serviceUrl,
                    microservice: true
                });

            } catch (error) {
                console.error(`❌ [API] Single trade estimate error for ${req.params.trade}:`, error.message);
                
                let statusCode = 500;
                if (error.response?.status) statusCode = error.response.status;
                else if (error.code === 'ECONNREFUSED') statusCode = 503;

                res.status(statusCode).json({
                    success: false,
                    error: {
                        code: 'TRADE_SERVICE_ERROR',
                        message: `${req.params.trade} service error: ${error.message}`,
                        service_url: this.orchestrator.tradeServices[req.params.trade]
                    }
                });
            }
        });

        // Trade service discovery
        app.get('/api/trades/available', (req, res) => {
            res.json({
                success: true,
                data: {
                    trades: Object.keys(this.orchestrator.tradeServices),
                    services: this.orchestrator.tradeServices,
                    capabilities: {
                        multi_trade_orchestration: true,
                        individual_trade_estimates: true,
                        natural_language_processing: true,
                        production_ready_apis: true,
                        user_editable_pricing: true
                    }
                }
            });
        });

        // Carpentry-specific endpoints (most developed service)
        app.post('/api/carpentry/cabinets', async (req, res) => {
            try {
                const carpentryUrl = this.orchestrator.tradeServices.carpentry;
                const axios = require('axios');

                const response = await axios.post(`${carpentryUrl}/estimate/cabinets`, req.body, {
                    timeout: 30000,
                    headers: { 'Content-Type': 'application/json' }
                });

                res.json({
                    success: true,
                    data: response.data,
                    specialization: 'kitchen_cabinets',
                    service_url: carpentryUrl
                });

            } catch (error) {
                console.error('❌ [API] Carpentry cabinets error:', error.message);
                res.status(error.response?.status || 500).json({
                    success: false,
                    error: {
                        code: 'CARPENTRY_SERVICE_ERROR',
                        message: error.message
                    }
                });
            }
        });

        console.log('🎪 [MICROSERVICES] Routes added to main API');
    }

    /**
     * Check health of all trade services
     */
    async checkAllServicesHealth() {
        const axios = require('axios');
        const healthChecks = [];

        for (const [trade, url] of Object.entries(this.orchestrator.tradeServices)) {
            try {
                const response = await axios.get(`${url}/health`, { timeout: 5000 });
                healthChecks.push({
                    trade,
                    status: 'healthy',
                    url,
                    response_time: response.headers['x-response-time'] || 'unknown',
                    service_info: response.data
                });
            } catch (error) {
                healthChecks.push({
                    trade,
                    status: 'unhealthy',
                    url,
                    error: error.message,
                    available: false
                });
            }
        }

        return healthChecks;
    }

    /**
     * Get integration info for API documentation
     */
    getIntegrationInfo() {
        return {
            microservices_architecture: true,
            orchestration: {
                multi_trade_estimates: '/api/estimates/multi-trade',
                individual_trade_estimates: '/api/estimates/single-trade/:trade',
                trade_discovery: '/api/trades/available',
                health_monitoring: '/api/microservices/health'
            },
            specialized_endpoints: {
                carpentry_cabinets: '/api/carpentry/cabinets',
                // Future: electrical, plumbing, painting endpoints
            },
            production_ready: true,
            no_pricing_simulation: true,
            user_editable_pricing: true
        };
    }
}

module.exports = MicroservicesIntegration;