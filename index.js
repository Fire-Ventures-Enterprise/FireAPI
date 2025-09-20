/**
 * FireBuildAI API - Main Entry Point
 * Production-ready construction management API
 * 
 * Usage:
 * const FireBuildAPI = require('./api');
 * const api = new FireBuildAPI();
 * await api.initialize();
 * const result = await api.analyzeProject(description);
 */

const APIRoutes = require('./routes.js');
const { ErrorHandler } = require('./error-handler.js');
const APITester = require('./tests.js');

class FireBuildAPI {
    constructor(options = {}) {
        this.routes = new APIRoutes();
        this.errorHandler = new ErrorHandler();
        this.options = {
            enableLogging: options.enableLogging !== false,
            enableMetrics: options.enableMetrics !== false,
            enableRateLimit: options.enableRateLimit !== false,
            ...options
        };
        
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            startTime: Date.now()
        };
    }

    /**
     * Initialize the API system
     */
    async initialize() {
        try {
            if (this.options.enableLogging) {
                console.log('🚀 Initializing FireBuildAI API...');
            }
            
            await this.routes.initialize();
            
            if (this.options.enableLogging) {
                console.log('✅ FireBuildAI API initialized successfully');
                console.log('📚 Available endpoints:', Object.keys(this.routes.endpoints).length);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize FireBuildAI API:', error);
            throw error;
        }
    }

    /**
     * Main API request handler with comprehensive error handling
     */
    async request(method, path, body = {}, query = {}, headers = {}) {
        this.stats.totalRequests++;
        const requestId = this.generateRequestId();
        const startTime = Date.now();

        try {
            // Input validation and sanitization
            if (this.options.enableRateLimit) {
                const clientId = headers['x-client-id'] || headers['x-forwarded-for'] || 'default';
                await this.errorHandler.checkRateLimit(clientId, path);
            }

            this.errorHandler.validateRequest(method, path, body, query, headers);
            
            const sanitizedBody = this.errorHandler.sanitizeInput(body);
            const sanitizedQuery = this.errorHandler.sanitizeInput(query);

            // Route request
            const response = await this.routes.handleRequest(
                method, 
                path, 
                sanitizedBody, 
                sanitizedQuery, 
                headers
            );

            // Update statistics
            if (response.success) {
                this.stats.successfulRequests++;
            } else {
                this.stats.failedRequests++;
            }

            // Add performance metrics
            const processingTime = Date.now() - startTime;
            if (this.options.enableMetrics) {
                response.meta = {
                    ...response.meta,
                    requestId,
                    processingTime: `${processingTime}ms`
                };
            }

            if (this.options.enableLogging && processingTime > 1000) {
                console.warn(`⚠️  Slow request: ${method} ${path} (${processingTime}ms)`);
            }

            return response;

        } catch (error) {
            this.stats.failedRequests++;
            return this.errorHandler.handleError(error, { requestId, method, path });
        }
    }

    /**
     * Convenience methods for each endpoint
     */

    // Project Analysis
    async analyzeProject(description, projectDetails = {}, options = {}) {
        return await this.request('POST', '/api/projects/analyze', {
            description,
            projectDetails,
            options
        });
    }

    async completeAnalysis(description, region = 'toronto', options = {}) {
        return await this.request('POST', '/api/projects/complete-analysis', {
            description,
            region,
            options
        });
    }

    // Workflow Generation
    async generateWorkflow(projectType, projectDetails = {}, region = 'toronto', options = {}) {
        return await this.request('POST', '/api/workflows/generate', {
            projectType,
            projectDetails,
            region,
            options
        });
    }

    async getWorkflowTemplates(projectType = null) {
        const query = projectType ? { projectType } : {};
        return await this.request('GET', '/api/workflows/templates', {}, query);
    }

    // Cost Estimation
    async estimateCosts(projectType, tasks = [], region = 'toronto', materials = [], options = {}) {
        return await this.request('POST', '/api/costs/estimate', {
            projectType,
            tasks,
            region,
            materials,
            options
        });
    }

    async getRegions(detailed = false) {
        const query = detailed ? { detailed: 'true' } : {};
        return await this.request('GET', '/api/costs/regions', {}, query);
    }

    // Utility
    async healthCheck() {
        return await this.request('GET', '/api/health');
    }

    /**
     * Batch processing for multiple requests
     */
    async batchProcess(requests) {
        if (!Array.isArray(requests) || requests.length === 0) {
            throw new Error('Batch requests must be a non-empty array');
        }

        if (requests.length > 10) {
            throw new Error('Maximum 10 requests per batch');
        }

        return await this.routes.handleBatchRequest(requests);
    }

    /**
     * Run comprehensive tests
     */
    async runTests() {
        const tester = new APITester();
        return await tester.runAllTests();
    }

    /**
     * Get API documentation
     */
    getDocumentation() {
        return this.routes.getDocumentation();
    }

    /**
     * Get API statistics and metrics
     */
    getStats() {
        const uptime = Date.now() - this.stats.startTime;
        const successRate = this.stats.totalRequests > 0 ? 
            (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) : 0;

        return {
            requests: {
                total: this.stats.totalRequests,
                successful: this.stats.successfulRequests,
                failed: this.stats.failedRequests,
                successRate: `${successRate}%`
            },
            uptime: {
                milliseconds: uptime,
                seconds: Math.floor(uptime / 1000),
                minutes: Math.floor(uptime / 60000),
                hours: Math.floor(uptime / 3600000)
            },
            endpoints: this.routes.getMetrics(),
            errors: this.errorHandler.getErrorStats()
        };
    }

    /**
     * Reset statistics (useful for testing)
     */
    resetStats() {
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            startTime: Date.now()
        };
    }

    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return `fb_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    }

    /**
     * Enable/disable specific features
     */
    setOption(key, value) {
        this.options[key] = value;
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return {
            options: this.options,
            stats: this.getStats(),
            version: '1.0.0',
            endpoints: Object.keys(this.routes.endpoints)
        };
    }
}

/**
 * Factory function for quick API creation
 */
function createAPI(options = {}) {
    return new FireBuildAPI(options);
}

/**
 * Express.js middleware (if using with Express)
 */
function expressMiddleware(options = {}) {
    const api = new FireBuildAPI(options);
    
    return async (req, res, next) => {
        try {
            if (!req.path.startsWith('/api/')) {
                return next();
            }

            await api.initialize();
            
            const result = await api.request(
                req.method,
                req.path,
                req.body,
                req.query,
                req.headers
            );

            res.status(result.success ? 200 : (result.error?.code === 'RATE_LIMIT_EXCEEDED' ? 429 : 400));
            res.json(result);
            
        } catch (error) {
            console.error('Express middleware error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Internal server error',
                    timestamp: new Date().toISOString()
                }
            });
        }
    };
}

/**
 * CLI interface for testing
 */
async function cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    const api = new FireBuildAPI({ enableLogging: true });
    await api.initialize();

    switch (command) {
        case 'test':
            console.log('🧪 Running comprehensive API tests...');
            const testResults = await api.runTests();
            console.log(`\n📊 Tests completed: ${testResults.summary.successRate} success rate`);
            break;

        case 'analyze':
            const description = args[1];
            if (!description) {
                console.log('Usage: node api/index.js analyze "project description"');
                return;
            }
            const result = await api.analyzeProject(description);
            console.log('Analysis Result:', JSON.stringify(result, null, 2));
            break;

        case 'docs':
            const docs = api.getDocumentation();
            console.log('API Documentation:', JSON.stringify(docs, null, 2));
            break;

        case 'stats':
            const stats = api.getStats();
            console.log('API Statistics:', JSON.stringify(stats, null, 2));
            break;

        default:
            console.log('FireBuildAI API CLI');
            console.log('Commands:');
            console.log('  test           - Run comprehensive tests');
            console.log('  analyze "..."  - Analyze project description');
            console.log('  docs          - Show API documentation');
            console.log('  stats         - Show API statistics');
    }
}

// Export main API class and utilities
module.exports = {
    FireBuildAPI,
    createAPI,
    expressMiddleware,
    APIRoutes,
    ErrorHandler: require('./error-handler.js').ErrorHandler,
    APITester
};

// CLI interface when run directly
if (require.main === module) {
    cli().catch(error => {
        console.error('CLI Error:', error);
        process.exit(1);
    });
}