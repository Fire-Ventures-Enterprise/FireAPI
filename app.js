/**
 * FireAPI.dev - Express.js Application Setup
 * Production-ready Express app for Railway deployment
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { FireBuildAPI } = require('./index.js');
const MicroservicesIntegration = require('./microservices-integration');
const APIKeyAuth = require('./api-key-auth');

class FireAPIApp {
    constructor() {
        this.app = express();
        this.api = new FireBuildAPI({
            enableLogging: true,
            enableMetrics: true,
            enableRateLimit: false // We'll use express-rate-limit instead
        });
        
        // Initialize microservices integration
        this.microservices = new MicroservicesIntegration();
        
        // Initialize API key authentication
        this.apiKeyAuth = new APIKeyAuth();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            crossOriginEmbedderPolicy: false,
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));

        // CORS configuration for fireapi.dev
        this.app.use(cors({
            origin: [
                'https://firebuild.ai',
                'https://www.firebuild.ai',
                'https://fireapi.dev',
                'https://www.fireapi.dev',
                /\.firebuild\.ai$/,
                /\.fireapi\.dev$/,
                // Allow localhost for development
                /^http:\/\/localhost:\d+$/,
                /^http:\/\/127\.0\.0\.1:\d+$/
            ],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Client-ID']
        }));

        // Compression and parsing
        this.app.use(compression());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests from this IP, please try again later.',
                    retryAfter: 900
                }
            },
            standardHeaders: true,
            legacyHeaders: false,
        });

        // Apply rate limiting to API routes only
        this.app.use('/api/', limiter);

        // Special rate limiting for intensive endpoints
        const intensiveLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 10, // More restrictive for compute-heavy endpoints
            message: {
                success: false,
                error: {
                    code: 'INTENSIVE_RATE_LIMIT_EXCEEDED',
                    message: 'Rate limit for intensive operations exceeded.',
                    retryAfter: 900
                }
            }
        });

        this.app.use('/api/projects/complete-analysis', intensiveLimiter);

        // API Key Authentication (applies to all API endpoints except public ones)
        console.log('🔐 [APP] Adding API key authentication...');
        this.app.use(this.apiKeyAuth.authenticate());

        // Request logging middleware
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
            });
            next();
        });
    }

    setupRoutes() {
        // Initialize API
        this.app.use(async (req, res, next) => {
            if (!this.apiInitialized) {
                try {
                    console.log('🔧 Initializing API for request:', req.path);
                    console.log('API object exists:', !!this.api);
                    await this.api.initialize();
                    this.apiInitialized = true;
                    console.log('✅ API initialized successfully');
                } catch (error) {
                    console.error('❌ Failed to initialize API:', error);
                    console.error('Error stack:', error.stack);
                    return res.status(503).json({
                        success: false,
                        error: {
                            code: 'SERVICE_UNAVAILABLE',
                            message: 'API initialization failed: ' + error.message
                        }
                    });
                }
            }
            next();
        });

        // Root endpoint - API information
        this.app.get('/', (req, res) => {
            res.json({
                name: 'FireAPI.dev Construction Intelligence',
                version: '2.0.0',
                description: 'AI-powered construction management API with microservices architecture',
                documentation: '/docs',
                health: '/api/health',
                endpoints: {
                    // Legacy API endpoints
                    'POST /api/projects/analyze': 'Analyze construction project descriptions',
                    'POST /api/projects/complete-analysis': 'Full project analysis with workflow and costs',
                    'POST /api/workflows/generate': 'Generate construction workflows',
                    'POST /api/costs/estimate': 'Calculate regional cost estimates',
                    'GET /api/costs/regions': 'Available regions and pricing',
                    'GET /api/workflows/templates': 'Workflow templates',
                    
                    // Microservices API endpoints
                    'POST /api/estimates/multi-trade': 'Multi-trade estimate orchestration',
                    'POST /api/estimates/single-trade/:trade': 'Individual trade estimates',
                    'POST /api/carpentry/cabinets': 'Kitchen cabinet estimates',
                    'GET /api/trades/available': 'Available trade services',
                    'GET /api/microservices/health': 'Microservices health check'
                },
                microservices: this.microservices.getIntegrationInfo(),
                status: 'operational',
                timestamp: new Date().toISOString()
            });
        });

        // API documentation endpoint
        this.app.get('/docs', (req, res) => {
            const docs = this.api.getDocumentation();
            res.json(docs);
        });

        // API statistics endpoint
        this.app.get('/stats', (req, res) => {
            try {
                console.log('Stats endpoint called, API object:', !!this.api);
                const stats = this.api.getStats();
                res.json(stats);
            } catch (error) {
                console.error('Stats endpoint error:', error);
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'STATS_ERROR',
                        message: error.message
                    }
                });
            }
        });

        // API Key management endpoints (admin only - no auth required)
        this.app.get('/admin/api-keys', (req, res) => {
            try {
                const keys = this.apiKeyAuth.getFireBuildAIKeys();
                const usage = this.apiKeyAuth.getUsageStats();
                
                res.json({
                    success: true,
                    message: 'FireBuild.AI API Keys',
                    keys: {
                        production: {
                            key: keys.production.key,
                            name: keys.production.name,
                            permissions: keys.production.permissions,
                            rateLimit: keys.production.rateLimit,
                            domains: keys.production.domains
                        },
                        development: {
                            key: keys.development.key,
                            name: keys.development.name,
                            permissions: keys.development.permissions,
                            rateLimit: keys.development.rateLimit,
                            domains: keys.development.domains
                        },
                        demo: {
                            key: keys.demo.key,
                            name: keys.demo.name,
                            permissions: keys.demo.permissions,
                            rateLimit: keys.demo.rateLimit,
                            domains: keys.demo.domains
                        }
                    },
                    usage_statistics: usage,
                    integration_guide: '/admin/integration-guide'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'API_KEY_ERROR',
                        message: error.message
                    }
                });
            }
        });

        // Integration guide endpoint
        this.app.get('/admin/integration-guide', (req, res) => {
            res.json({
                success: true,
                integration: {
                    authentication: {
                        method: 'API Key',
                        header: 'X-API-Key',
                        alternative_headers: ['API-Key', 'Authorization: Bearer <key>'],
                        query_parameter: 'api_key'
                    },
                    endpoints: {
                        multi_trade_estimates: 'POST /api/estimates/multi-trade',
                        carpentry_cabinets: 'POST /api/carpentry/cabinets',
                        service_health: 'GET /api/microservices/health',
                        available_trades: 'GET /api/trades/available'
                    },
                    rate_limits: {
                        production: '1000 requests/hour',
                        development: '500 requests/hour', 
                        demo: '100 requests/hour'
                    },
                    example_curl: {
                        multi_trade: `curl -X POST https://8080-i0k34xlfbjev6sx7pzpya-6532622b.e2b.dev/api/estimates/multi-trade \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"description": "Kitchen renovation with cabinets"}'`
                    }
                }
            });
        });

        // Add microservices integration routes
        console.log('🎪 [APP] Adding microservices routes...');
        this.microservices.addRoutes(this.app);

        // Main API routes handler
        this.app.all('/api/*', async (req, res) => {
            try {
                const path = req.path;
                const method = req.method;
                const body = req.body || {};
                const query = req.query || {};
                const headers = req.headers || {};

                const result = await this.api.request(method, path, body, query, headers);

                // Set appropriate status code
                let statusCode = 200;
                if (!result.success) {
                    if (result.error?.code === 'VALIDATION_ERROR') statusCode = 400;
                    else if (result.error?.code === 'BUSINESS_LOGIC_ERROR') statusCode = 422;
                    else if (result.error?.code === 'RATE_LIMIT_EXCEEDED') statusCode = 429;
                    else statusCode = 500;
                }

                res.status(statusCode).json(result);

            } catch (error) {
                console.error('API Route Error:', error);
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'An unexpected error occurred',
                        timestamp: new Date().toISOString()
                    }
                });
            }
        });

        // 404 handler for unknown routes
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: `Endpoint not found: ${req.method} ${req.path}`,
                    availableEndpoints: [
                        'GET /',
                        'GET /docs',
                        'GET /stats',
                        'POST /api/projects/analyze',
                        'POST /api/projects/complete-analysis',
                        'POST /api/workflows/generate',
                        'POST /api/costs/estimate',
                        'GET /api/costs/regions',
                        'GET /api/workflows/templates',
                        'GET /api/health'
                    ]
                }
            });
        });
    }

    setupErrorHandling() {
        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Global Error Handler:', error);
            
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: process.env.NODE_ENV === 'production' ? 
                        'An unexpected error occurred' : 
                        error.message,
                    timestamp: new Date().toISOString()
                }
            });
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully');
            process.exit(0);
        });

        process.on('SIGINT', () => {
            console.log('SIGINT received, shutting down gracefully');
            process.exit(0);
        });
    }

    getApp() {
        return this.app;
    }
}

module.exports = FireAPIApp;

// Railway deployment entry point - START THE SERVER!
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    
    console.log('🚀 Starting FireAPI.dev Server...');
    
    const fireAPIApp = new FireAPIApp();
    const app = fireAPIApp.getApp();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log('🚀 FireAPI.dev - Construction Intelligence API');
        console.log('='.repeat(50));
        console.log(`🌐 Server running on port ${PORT}`);
        console.log(`📚 Documentation: http://localhost:${PORT}/docs`);
        console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
        console.log('📊 Available endpoints:');
        console.log('  GET /');
        console.log('  GET /docs');
        console.log('  GET /stats'); 
        console.log('  GET /api/health');
        console.log('  POST /api/projects/analyze');
        console.log('  POST /api/projects/complete-analysis');
        console.log('  POST /api/workflows/generate');
        console.log('  POST /api/costs/estimate');
        console.log('  GET /api/costs/regions');
        console.log('  GET /api/workflows/templates');
        console.log('='.repeat(50));
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully...');
        server.close(() => {
            console.log('✅ Server closed gracefully');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        console.log('SIGINT received, shutting down gracefully...');
        server.close(() => {
            console.log('✅ Server closed gracefully');
            process.exit(0);
        });
    });
}