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
            hvac: process.env.HVAC_API_URL || 'http://localhost:3006',
            compliance: process.env.COMPLIANCE_API_URL || 'http://localhost:3007',
            tasks: process.env.TASKS_API_URL || 'http://localhost:3008',
            files: process.env.FILES_API_URL || 'http://localhost:3009'
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

        // Electrical-specific endpoints
        app.post('/api/electrical/kitchen', async (req, res) => {
            try {
                const electricalUrl = this.orchestrator.tradeServices.electrical;
                const axios = require('axios');

                const response = await axios.post(`${electricalUrl}/kitchen`, req.body, {
                    timeout: 30000,
                    headers: { 'Content-Type': 'application/json' }
                });

                res.json({
                    success: true,
                    data: response.data,
                    specialization: 'kitchen_electrical',
                    service_url: electricalUrl
                });

            } catch (error) {
                console.error('❌ [API] Electrical kitchen error:', error.message);
                res.status(error.response?.status || 500).json({
                    success: false,
                    error: {
                        code: 'ELECTRICAL_SERVICE_ERROR',
                        message: error.message
                    }
                });
            }
        });

        app.post('/api/electrical/circuits', async (req, res) => {
            try {
                const electricalUrl = this.orchestrator.tradeServices.electrical;
                const axios = require('axios');

                const response = await axios.post(`${electricalUrl}/circuits`, req.body, {
                    timeout: 30000,
                    headers: { 'Content-Type': 'application/json' }
                });

                res.json({
                    success: true,
                    data: response.data,
                    specialization: 'circuit_analysis',
                    service_url: electricalUrl
                });

            } catch (error) {
                console.error('❌ [API] Electrical circuits error:', error.message);
                res.status(error.response?.status || 500).json({
                    success: false,
                    error: {
                        code: 'ELECTRICAL_SERVICE_ERROR',
                        message: error.message
                    }
                });
            }
        });

        app.post('/api/electrical/lighting', async (req, res) => {
            try {
                const electricalUrl = this.orchestrator.tradeServices.electrical;
                const axios = require('axios');

                const response = await axios.post(`${electricalUrl}/lighting`, req.body, {
                    timeout: 30000,
                    headers: { 'Content-Type': 'application/json' }
                });

                res.json({
                    success: true,
                    data: response.data,
                    specialization: 'lighting_design',
                    service_url: electricalUrl
                });

            } catch (error) {
                console.error('❌ [API] Electrical lighting error:', error.message);
                res.status(error.response?.status || 500).json({
                    success: false,
                    error: {
                        code: 'ELECTRICAL_SERVICE_ERROR',
                        message: error.message
                    }
                });
            }
        });

        // Building Code Compliance endpoints
        app.post('/api/compliance/check', async (req, res) => {
            try {
                const complianceUrl = this.orchestrator.tradeServices.compliance;
                const axios = require('axios');

                const response = await axios.post(`${complianceUrl}/check`, req.body, {
                    timeout: 30000,
                    headers: { 'Content-Type': 'application/json' }
                });

                res.json({
                    success: true,
                    data: response.data,
                    specialization: 'building_code_compliance',
                    service_url: complianceUrl
                });

            } catch (error) {
                console.error('❌ [API] Compliance check error:', error.message);
                res.status(error.response?.status || 500).json({
                    success: false,
                    error: {
                        code: 'COMPLIANCE_SERVICE_ERROR',
                        message: error.message
                    }
                });
            }
        });

        app.post('/api/compliance/kitchen', async (req, res) => {
            try {
                const complianceUrl = this.orchestrator.tradeServices.compliance;
                const axios = require('axios');

                const response = await axios.post(`${complianceUrl}/kitchen`, req.body, {
                    timeout: 30000,
                    headers: { 'Content-Type': 'application/json' }
                });

                res.json({
                    success: true,
                    data: response.data,
                    specialization: 'kitchen_code_compliance',
                    service_url: complianceUrl
                });

            } catch (error) {
                console.error('❌ [API] Kitchen compliance error:', error.message);
                res.status(error.response?.status || 500).json({
                    success: false,
                    error: {
                        code: 'COMPLIANCE_SERVICE_ERROR',
                        message: error.message
                    }
                });
            }
        });

        app.get('/api/compliance/violations', async (req, res) => {
            try {
                const complianceUrl = this.orchestrator.tradeServices.compliance;
                const axios = require('axios');

                const response = await axios.get(`${complianceUrl}/violations`, {
                    timeout: 10000
                });

                res.json({
                    success: true,
                    data: response.data,
                    specialization: 'violation_statistics',
                    service_url: complianceUrl
                });

            } catch (error) {
                console.error('❌ [API] Violations stats error:', error.message);
                res.status(error.response?.status || 500).json({
                    success: false,
                    error: {
                        code: 'COMPLIANCE_SERVICE_ERROR',
                        message: error.message
                    }
                });
            }
        });

        // 🎯 Task Orchestrator Routes - Revolutionary Construction Task Management
        app.post('/api/tasks/project', async (req, res) => {
            try {
                const tasksUrl = this.orchestrator.tradeServices.tasks;
                const axios = require('axios');

                const response = await axios.post(`${tasksUrl}/project`, req.body, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000
                });

                res.json({
                    success: true,
                    data: response.data,
                    specialization: 'intelligent_task_orchestration',
                    service_url: tasksUrl,
                    features: ['dependency_tracking', 'weather_integration', 'trade_coordination', 'critical_path']
                });

            } catch (error) {
                console.error('❌ [API] Task orchestrator error:', error.message);
                res.status(error.response?.status || 500).json({
                    success: false,
                    error: {
                        code: 'TASK_ORCHESTRATOR_ERROR',
                        message: error.message
                    }
                });
            }
        });

        app.get('/api/tasks/project/:projectId', async (req, res) => {
            try {
                const tasksUrl = this.orchestrator.tradeServices.tasks;
                const { projectId } = req.params;
                const axios = require('axios');

                const response = await axios.get(`${tasksUrl}/project/${projectId}`, {
                    timeout: 10000
                });

                res.json({
                    success: true,
                    data: response.data,
                    specialization: 'project_status_tracking',
                    service_url: tasksUrl
                });

            } catch (error) {
                console.error('❌ [API] Task project retrieval error:', error.message);
                res.status(error.response?.status || 500).json({
                    success: false,
                    error: {
                        code: 'TASK_PROJECT_ERROR',
                        message: error.message
                    }
                });
            }
        });

        app.get('/api/tasks/project/:projectId/timeline', async (req, res) => {
            try {
                const tasksUrl = this.orchestrator.tradeServices.tasks;
                const { projectId } = req.params;
                const axios = require('axios');

                const response = await axios.get(`${tasksUrl}/project/${projectId}/timeline`, {
                    timeout: 10000
                });

                res.json({
                    success: true,
                    data: response.data,
                    specialization: 'construction_timeline_optimization',
                    service_url: tasksUrl
                });

            } catch (error) {
                console.error('❌ [API] Task timeline error:', error.message);
                res.status(error.response?.status || 500).json({
                    success: false,
                    error: {
                        code: 'TASK_TIMELINE_ERROR', 
                        message: error.message
                    }
                });
            }
        });

        app.get('/api/tasks/project/:projectId/next-actions', async (req, res) => {
            try {
                const tasksUrl = this.orchestrator.tradeServices.tasks;
                const { projectId } = req.params;
                const axios = require('axios');

                const response = await axios.get(`${tasksUrl}/project/${projectId}/next-actions`, {
                    timeout: 10000
                });

                res.json({
                    success: true,
                    data: response.data,
                    specialization: 'actionable_task_intelligence',
                    service_url: tasksUrl
                });

            } catch (error) {
                console.error('❌ [API] Next actions error:', error.message);
                res.status(error.response?.status || 500).json({
                    success: false,
                    error: {
                        code: 'NEXT_ACTIONS_ERROR',
                        message: error.message
                    }
                });
            }
        });

        // 📁 File Management Routes - Revolutionary Construction File Storage
        app.post('/api/files/upload/single', async (req, res) => {
            try {
                const filesUrl = this.orchestrator.tradeServices.files;
                const axios = require('axios');

                // Forward multipart form data to file service
                const response = await axios.post(`${filesUrl}/upload/single`, req.body, {
                    headers: { 
                        'Content-Type': req.headers['content-type']
                    },
                    timeout: 60000 // Longer timeout for file uploads
                });

                res.json({
                    success: true,
                    data: response.data,
                    specialization: 'construction_file_management',
                    service_url: filesUrl
                });

            } catch (error) {
                console.error('❌ [API] File upload error:', error.message);
                res.status(error.response?.status || 500).json({
                    success: false,
                    error: {
                        code: 'FILE_UPLOAD_ERROR',
                        message: error.message
                    }
                });
            }
        });

        app.get('/api/files/project/:projectId/files', async (req, res) => {
            try {
                const filesUrl = this.orchestrator.tradeServices.files;
                const { projectId } = req.params;
                const axios = require('axios');

                const queryParams = new URLSearchParams(req.query).toString();
                const url = `${filesUrl}/project/${projectId}/files${queryParams ? '?' + queryParams : ''}`;

                const response = await axios.get(url, {
                    timeout: 10000
                });

                res.json({
                    success: true,
                    data: response.data,
                    specialization: 'project_file_organization',
                    service_url: filesUrl
                });

            } catch (error) {
                console.error('❌ [API] Get project files error:', error.message);
                res.status(error.response?.status || 500).json({
                    success: false,
                    error: {
                        code: 'PROJECT_FILES_ERROR',
                        message: error.message
                    }
                });
            }
        });

        app.get('/api/files/categories', async (req, res) => {
            try {
                const filesUrl = this.orchestrator.tradeServices.files;
                const axios = require('axios');

                const response = await axios.get(`${filesUrl}/categories`, {
                    timeout: 5000
                });

                res.json({
                    success: true,
                    data: response.data,
                    specialization: 'file_categorization_system',
                    service_url: filesUrl
                });

            } catch (error) {
                console.error('❌ [API] File categories error:', error.message);
                res.status(error.response?.status || 500).json({
                    success: false,
                    error: {
                        code: 'FILE_CATEGORIES_ERROR',
                        message: error.message
                    }
                });
            }
        });

        console.log('🎪 [MICROSERVICES] Routes added to main API');
        console.log('🎯 [TASK ORCHESTRATOR] Revolutionary task management integrated');
        console.log('📁 [FILE MANAGEMENT] Revolutionary file storage system integrated');
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
                electrical_kitchen: '/api/electrical/kitchen',
                electrical_circuits: '/api/electrical/circuits', 
                electrical_lighting: '/api/electrical/lighting',
                compliance_check: '/api/compliance/check',
                compliance_kitchen: '/api/compliance/kitchen',
                compliance_violations: '/api/compliance/violations',
                // Future: plumbing, painting endpoints
            },
            production_ready: true,
            no_pricing_simulation: true,
            user_editable_pricing: true
        };
    }
}

module.exports = MicroservicesIntegration;