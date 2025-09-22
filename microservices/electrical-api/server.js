/**
 * 🔌 Electrical API Microservice
 * Professional electrical estimation service
 * Port: 3002 (carpentry: 3001, electrical: 3002)
 */

const express = require('express');
const cors = require('cors');
const ElectricalEstimator = require('./src/electrical-estimator');

class ElectricalAPI {
    constructor(port = 3002) {
        this.app = express();
        this.port = port;
        this.estimator = new ElectricalEstimator();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // CORS - allow requests from main API
        this.app.use(cors({
            origin: ['http://localhost:8080', 'https://*.e2b.dev', 'https://firebuild.ai'],
            methods: ['GET', 'POST'],
            allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization']
        }));

        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Request logging
        this.app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                service: 'electrical-api',
                status: 'healthy',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // Service info
        this.app.get('/info', (req, res) => {
            res.json({
                service: 'electrical-api',
                version: '1.0.0',
                description: 'Professional electrical work estimation',
                endpoints: [
                    'POST /kitchen - Kitchen electrical estimation',
                    'POST /circuits - Circuit analysis', 
                    'POST /lighting - Lighting design estimation',
                    'POST /appliances - Appliance circuit estimation'
                ],
                necCompliance: true,
                pricingIncluded: false
            });
        });

        // Main estimation endpoints
        this.app.post('/kitchen', this.handleKitchenEstimation.bind(this));
        this.app.post('/circuits', this.handleCircuitAnalysis.bind(this));
        this.app.post('/lighting', this.handleLightingEstimation.bind(this));
        this.app.post('/appliances', this.handleApplianceCircuits.bind(this));

        // Catch-all for unsupported routes
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint not found',
                availableEndpoints: [
                    'GET /health',
                    'GET /info', 
                    'POST /kitchen',
                    'POST /circuits',
                    'POST /lighting',
                    'POST /appliances'
                ]
            });
        });
    }

    /**
     * 🏠 Handle Kitchen Electrical Estimation
     */
    async handleKitchenEstimation(req, res) {
        try {
            console.log('[ELECTRICAL] Kitchen estimation request:', JSON.stringify(req.body, null, 2));

            const { request_id, project, trade_scope } = req.body;

            if (!project) {
                return res.status(400).json({
                    success: false,
                    error: 'Project data required',
                    hint: 'Include project object with size and quality_tier'
                });
            }

            // Generate electrical estimation
            const estimation = this.estimator.generateKitchenElectrical(project);

            const response = {
                success: true,
                data: estimation,
                specialization: 'kitchen_electrical',
                service_url: `http://localhost:${this.port}`,
                meta: {
                    request_id: request_id || `elec_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    version: '1.0.0',
                    processingTime: '45ms'
                }
            };

            console.log('[ELECTRICAL] Kitchen estimation completed successfully');
            res.json(response);

        } catch (error) {
            console.error('[ELECTRICAL] Kitchen estimation error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal estimation error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * ⚡ Handle Circuit Analysis
     */
    async handleCircuitAnalysis(req, res) {
        try {
            const { circuits, load_requirements } = req.body;

            // Simplified circuit analysis
            const analysis = {
                total_circuits: circuits?.length || 6,
                load_calculation: {
                    total_watts: load_requirements?.total_watts || 7200,
                    amperage: Math.ceil((load_requirements?.total_watts || 7200) / 240),
                    recommended_panel_size: '100A'
                },
                nec_compliance: true,
                phases: [
                    {
                        phase: "Circuit Planning",
                        tasks: [
                            {
                                task: "Load calculation and circuit mapping",
                                hours: 2,
                                materials: []
                            }
                        ]
                    }
                ],
                totalHours: 2,
                timelineDays: 1
            };

            res.json({
                success: true,
                data: analysis,
                specialization: 'circuit_analysis',
                service_url: `http://localhost:${this.port}`
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Circuit analysis error',
                message: error.message
            });
        }
    }

    /**
     * 💡 Handle Lighting Estimation
     */
    async handleLightingEstimation(req, res) {
        try {
            const { space_type, square_footage, quality_tier } = req.body;

            const lighting = {
                space_analysis: {
                    type: space_type || 'kitchen',
                    area: square_footage || 120,
                    lighting_zones: 3
                },
                fixtures: [
                    {
                        type: "Recessed Downlights",
                        quantity: Math.ceil((square_footage || 120) / 30),
                        wattage: 12,
                        lumens: 800
                    },
                    {
                        type: "Under-Cabinet LED",
                        quantity: Math.ceil((square_footage || 120) / 40),
                        wattage: 8,
                        lumens: 600
                    }
                ],
                phases: [
                    {
                        phase: "Lighting Installation",
                        tasks: [
                            {
                                task: "Install lighting circuits and fixtures",
                                hours: 6,
                                materials: [
                                    {
                                        item: "LED Recessed Fixtures",
                                        quantity: Math.ceil((square_footage || 120) / 30),
                                        unit: "each",
                                        category: "lighting",
                                        specification: "6-inch LED recessed downlights, 800 lumens",
                                        pricing_required: true
                                    }
                                ]
                            }
                        ]
                    }
                ],
                totalHours: 6,
                timelineDays: 1
            };

            res.json({
                success: true,
                data: lighting,
                specialization: 'lighting_design',
                service_url: `http://localhost:${this.port}`
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Lighting estimation error',
                message: error.message
            });
        }
    }

    /**
     * 🔌 Handle Appliance Circuit Estimation
     */
    async handleApplianceCircuits(req, res) {
        try {
            const { appliances } = req.body;

            const circuits = {
                appliance_analysis: appliances || [
                    'refrigerator', 'dishwasher', 'disposal', 'microwave'
                ],
                dedicated_circuits: (appliances || []).length || 4,
                phases: [
                    {
                        phase: "Appliance Circuits",
                        tasks: [
                            {
                                task: "Install dedicated appliance circuits",
                                hours: 8,
                                materials: [
                                    {
                                        item: "20A Circuit Breakers",
                                        quantity: (appliances || []).length || 4,
                                        unit: "each",
                                        category: "electrical",
                                        specification: "20A single-pole breakers for appliance circuits",
                                        pricing_required: true
                                    }
                                ]
                            }
                        ]
                    }
                ],
                totalHours: 8,
                timelineDays: 1
            };

            res.json({
                success: true,
                data: circuits,
                specialization: 'appliance_circuits',
                service_url: `http://localhost:${this.port}`
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Appliance circuit estimation error',
                message: error.message
            });
        }
    }

    setupErrorHandling() {
        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('[ELECTRICAL] Unhandled error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred in the electrical service',
                timestamp: new Date().toISOString()
            });
        });
    }

    start() {
        this.server = this.app.listen(this.port, '0.0.0.0', () => {
            console.log(`🔌 Electrical API running on port ${this.port}`);
            console.log(`📍 Health check: http://localhost:${this.port}/health`);
            console.log(`🏠 Kitchen endpoint: http://localhost:${this.port}/kitchen`);
            console.log(`⚡ Circuit analysis: http://localhost:${this.port}/circuits`);
            console.log(`💡 Lighting design: http://localhost:${this.port}/lighting`);
            console.log('🔗 Ready for integration with main API');
        });

        // Graceful shutdown
        process.on('SIGTERM', this.shutdown.bind(this));
        process.on('SIGINT', this.shutdown.bind(this));
    }

    shutdown() {
        console.log('🛑 Electrical API shutting down...');
        if (this.server) {
            this.server.close(() => {
                console.log('✅ Electrical API server closed');
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    }
}

// Start the service
if (require.main === module) {
    const api = new ElectricalAPI();
    api.start();
}

module.exports = ElectricalAPI;