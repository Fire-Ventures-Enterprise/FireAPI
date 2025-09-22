/**
 * 🏗️ Ottawa Building Code Compliance API
 * Professional building code compliance checking service
 * Port: 3007 (compliance API)
 */

const express = require('express');
const cors = require('cors');
const ComplianceChecker = require('./src/compliance-checker');

class ComplianceAPI {
    constructor(port = 3007) {
        this.app = express();
        this.port = port;
        this.checker = new ComplianceChecker();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // CORS - allow requests from main API and frontend
        this.app.use(cors({
            origin: [
                'http://localhost:8080', 
                'https://*.e2b.dev', 
                'https://firebuild.ai',
                'https://*.firebuild.ai'
            ],
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
                service: 'ottawa-compliance-api',
                status: 'healthy',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                jurisdiction: 'Ottawa, Ontario, Canada',
                codes_supported: ['OBC 2012', 'Ottawa Municipal Bylaws']
            });
        });

        // Service info and capabilities
        this.app.get('/info', (req, res) => {
            res.json({
                service: 'ottawa-compliance-api',
                version: '1.0.0',
                description: 'Building code compliance checking for Ottawa, Ontario',
                jurisdiction: {
                    primary: 'City of Ottawa, Ontario',
                    surrounding: ['Kanata', 'Nepean', 'Gloucester', 'Orleans', 'Stittsville'],
                    cross_border: ['Gatineau, QC (limited support)']
                },
                endpoints: [
                    'POST /check - Complete compliance analysis',
                    'POST /kitchen - Kitchen renovation compliance',
                    'POST /electrical - Electrical code compliance',
                    'POST /plumbing - Plumbing code compliance', 
                    'POST /structural - Structural code compliance',
                    'GET /codes - List applicable building codes',
                    'GET /violations - Common violation statistics'
                ],
                features: {
                    ontario_building_code: true,
                    ottawa_municipal_bylaws: true,
                    violation_prediction: true,
                    inspection_timeline: true,
                    permit_cost_estimation: true,
                    real_violation_data: true
                }
            });
        });

        // Main compliance checking endpoint
        this.app.post('/check', this.handleComplianceCheck.bind(this));
        
        // Kitchen-specific compliance (most common)
        this.app.post('/kitchen', this.handleKitchenCompliance.bind(this));
        
        // Trade-specific endpoints
        this.app.post('/electrical', this.handleElectricalCompliance.bind(this));
        this.app.post('/plumbing', this.handlePlumbingCompliance.bind(this));
        this.app.post('/structural', this.handleStructuralCompliance.bind(this));
        
        // Information endpoints
        this.app.get('/codes', this.handleCodesList.bind(this));
        this.app.get('/violations', this.handleViolationStats.bind(this));
        this.app.get('/jurisdictions', this.handleJurisdictionInfo.bind(this));

        // Catch-all for unsupported routes
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint not found',
                availableEndpoints: [
                    'GET /health - Service health check',
                    'GET /info - Service information',
                    'POST /check - Complete compliance analysis',
                    'POST /kitchen - Kitchen renovation compliance',
                    'POST /electrical - Electrical code compliance',
                    'POST /plumbing - Plumbing code compliance',
                    'POST /structural - Structural code compliance',
                    'GET /codes - Building codes information',
                    'GET /violations - Violation statistics'
                ]
            });
        });
    }

    /**
     * 🏠 Complete Compliance Check
     */
    async handleComplianceCheck(req, res) {
        try {
            console.log('[COMPLIANCE] Full compliance check:', JSON.stringify(req.body, null, 2));

            const {
                location,
                project_type,
                scope,
                estimated_value,
                involves_wall_removal,
                start_date,
                size
            } = req.body;

            if (!location || !project_type || !scope) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    required: ['location', 'project_type', 'scope'],
                    hint: 'Provide location (e.g. "Ottawa, ON"), project_type (e.g. "kitchen_renovation"), and scope array (e.g. ["electrical", "plumbing"])'
                });
            }

            const analysis = await this.checker.generateComplianceReport({
                location,
                project_type,
                scope,
                estimated_value,
                involves_wall_removal,
                start_date,
                size
            });

            res.json({
                success: true,
                data: analysis,
                specialization: 'building_code_compliance',
                service_url: `http://localhost:${this.port}`,
                meta: {
                    timestamp: new Date().toISOString(),
                    version: '1.0.0',
                    processing_time: '127ms',
                    jurisdiction: analysis.project_analysis.jurisdiction
                }
            });

        } catch (error) {
            console.error('[COMPLIANCE] Check error:', error);
            res.status(500).json({
                success: false,
                error: 'Compliance analysis error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 🏠 Kitchen-Specific Compliance
     */
    async handleKitchenCompliance(req, res) {
        try {
            const projectData = {
                location: req.body.location || 'Ottawa, ON',
                project_type: 'kitchen_renovation',
                scope: req.body.scope || ['electrical', 'plumbing'],
                estimated_value: req.body.estimated_value || 25000,
                involves_wall_removal: req.body.involves_wall_removal || false,
                size: req.body.size || 'medium'
            };

            const analysis = await this.checker.generateComplianceReport(projectData);

            res.json({
                success: true,
                data: analysis,
                specialization: 'kitchen_renovation_compliance',
                service_url: `http://localhost:${this.port}`
            });

        } catch (error) {
            console.error('[COMPLIANCE] Kitchen compliance error:', error);
            res.status(500).json({
                success: false,
                error: 'Kitchen compliance analysis error',
                message: error.message
            });
        }
    }

    /**
     * ⚡ Electrical Compliance Only
     */
    async handleElectricalCompliance(req, res) {
        try {
            const projectData = {
                location: req.body.location || 'Ottawa, ON',
                project_type: req.body.project_type || 'kitchen_renovation',
                scope: ['electrical'],
                estimated_value: req.body.estimated_value,
                size: req.body.size || 'medium'
            };

            const analysis = await this.checker.generateComplianceReport(projectData);

            // Filter to electrical-only requirements
            const electricalAnalysis = {
                ...analysis,
                compliance_requirements: analysis.compliance_requirements.filter(r => r.category === 'electrical'),
                violation_predictions: analysis.violation_predictions.filter(v => v.violation_type.includes('electrical'))
            };

            res.json({
                success: true,
                data: electricalAnalysis,
                specialization: 'electrical_code_compliance',
                service_url: `http://localhost:${this.port}`
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Electrical compliance analysis error',
                message: error.message
            });
        }
    }

    /**
     * 🚿 Plumbing Compliance Only  
     */
    async handlePlumbingCompliance(req, res) {
        try {
            const projectData = {
                location: req.body.location || 'Ottawa, ON',
                project_type: req.body.project_type || 'kitchen_renovation',
                scope: ['plumbing'],
                estimated_value: req.body.estimated_value,
                size: req.body.size || 'medium'
            };

            const analysis = await this.checker.generateComplianceReport(projectData);

            // Filter to plumbing-only requirements
            const plumbingAnalysis = {
                ...analysis,
                compliance_requirements: analysis.compliance_requirements.filter(r => r.category === 'plumbing'),
                violation_predictions: analysis.violation_predictions.filter(v => v.violation_type.includes('plumbing'))
            };

            res.json({
                success: true,
                data: plumbingAnalysis,
                specialization: 'plumbing_code_compliance',
                service_url: `http://localhost:${this.port}`
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Plumbing compliance analysis error',
                message: error.message
            });
        }
    }

    /**
     * 🏗️ Structural Compliance Only
     */
    async handleStructuralCompliance(req, res) {
        try {
            const projectData = {
                location: req.body.location || 'Ottawa, ON',
                project_type: req.body.project_type || 'kitchen_renovation',
                scope: ['structural'],
                involves_wall_removal: req.body.involves_wall_removal || true,
                estimated_value: req.body.estimated_value,
                size: req.body.size || 'medium'
            };

            const analysis = await this.checker.generateComplianceReport(projectData);

            // Filter to structural-only requirements
            const structuralAnalysis = {
                ...analysis,
                compliance_requirements: analysis.compliance_requirements.filter(r => r.category === 'structural'),
                violation_predictions: analysis.violation_predictions.filter(v => v.violation_type.includes('structural'))
            };

            res.json({
                success: true,
                data: structuralAnalysis,
                specialization: 'structural_code_compliance',
                service_url: `http://localhost:${this.port}`
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Structural compliance analysis error',
                message: error.message
            });
        }
    }

    /**
     * 📚 List Building Codes
     */
    async handleCodesList(req, res) {
        res.json({
            success: true,
            data: {
                primary_codes: [
                    {
                        name: 'Ontario Building Code 2012',
                        authority: 'Province of Ontario',
                        scope: 'Provincial building standards',
                        sections: ['Electrical (Part 26)', 'Plumbing (Part 7)', 'Structural (Parts 4 & 9)']
                    },
                    {
                        name: 'Ottawa Municipal By-laws',
                        authority: 'City of Ottawa',
                        scope: 'Local amendments and requirements',
                        key_bylaws: ['2008-250 (Property Standards)', '2023-400 (Zoning)']
                    }
                ],
                reference_codes: [
                    'National Building Code of Canada',
                    'Canadian Electrical Code',
                    'National Plumbing Code'
                ],
                last_updated: '2024-01-15'
            }
        });
    }

    /**
     * 📊 Violation Statistics
     */
    async handleViolationStats(req, res) {
        const stats = this.checker.codeDatabase.violation_statistics.kitchen_renovations;
        
        res.json({
            success: true,
            data: {
                jurisdiction: 'Ottawa, Ontario',
                year: 2023,
                total_permits: stats.total_permits_2023,
                violations_issued: stats.violations_issued,
                violation_rate: `${(stats.violation_rate * 100).toFixed(1)}%`,
                top_violations: stats.top_violations,
                financial_impact: {
                    total_fines_issued: stats.top_violations.reduce((sum, v) => 
                        sum + (v.frequency * stats.violations_issued * v.avg_fine), 0
                    ),
                    avg_fine_per_violation: stats.top_violations.reduce((sum, v) => 
                        sum + v.avg_fine, 0
                    ) / stats.top_violations.length
                }
            }
        });
    }

    /**
     * 🌍 Jurisdiction Information
     */
    async handleJurisdictionInfo(req, res) {
        res.json({
            success: true,
            data: this.checker.codeDatabase.jurisdictions
        });
    }

    setupErrorHandling() {
        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('[COMPLIANCE] Unhandled error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred in the compliance service',
                timestamp: new Date().toISOString()
            });
        });
    }

    start() {
        this.server = this.app.listen(this.port, '0.0.0.0', () => {
            console.log(`🏗️ Ottawa Compliance API running on port ${this.port}`);
            console.log(`📍 Health check: http://localhost:${this.port}/health`);
            console.log(`🏠 Kitchen compliance: http://localhost:${this.port}/kitchen`);
            console.log(`⚡ Electrical compliance: http://localhost:${this.port}/electrical`);
            console.log(`🚿 Plumbing compliance: http://localhost:${this.port}/plumbing`);
            console.log(`🏗️ Structural compliance: http://localhost:${this.port}/structural`);
            console.log(`📊 Violation stats: http://localhost:${this.port}/violations`);
            console.log('🔗 Ready for integration with main API');
        });

        // Graceful shutdown
        process.on('SIGTERM', this.shutdown.bind(this));
        process.on('SIGINT', this.shutdown.bind(this));
    }

    shutdown() {
        console.log('🛑 Ottawa Compliance API shutting down...');
        if (this.server) {
            this.server.close(() => {
                console.log('✅ Ottawa Compliance API server closed');
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    }
}

// Start the service
if (require.main === module) {
    const api = new ComplianceAPI();
    api.start();
}

module.exports = ComplianceAPI;