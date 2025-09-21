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

class FireAPIApp {
    constructor() {
        this.app = express();
        this.api = new FireBuildAPI({
            enableLogging: true,
            enableMetrics: true,
            enableRateLimit: false // We'll use express-rate-limit instead
        });
        
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
                version: '1.0.0',
                description: 'AI-powered construction management API',
                documentation: '/docs',
                health: '/api/health',
                endpoints: {
                    'POST /api/projects/analyze': 'Analyze construction project descriptions',
                    'POST /api/projects/complete-analysis': 'Full project analysis with workflow and costs',
                    'POST /api/workflows/generate': 'Generate construction workflows',
                    'POST /api/costs/estimate': 'Calculate regional cost estimates',
                    'GET /api/costs/regions': 'Available regions and pricing',
                    'GET /api/workflows/templates': 'Workflow templates'
                },
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