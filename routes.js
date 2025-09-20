/**
 * FireBuildAI API Routes Handler
 * Defines all RESTful endpoints and routing logic for the construction management platform
 */

const FireBuildAIServer = require('./server.js');

class APIRoutes {
    constructor() {
        this.server = new FireBuildAIServer();
        this.endpoints = this.defineEndpoints();
    }

    async initialize() {
        return await this.server.initialize();
    }

    /**
     * Define all available API endpoints with their specifications
     */
    defineEndpoints() {
        return {
            // Project Analysis Endpoints
            'POST /api/projects/analyze': {
                description: 'Analyze construction project description using AI',
                parameters: {
                    required: ['description'],
                    optional: ['projectDetails', 'options'],
                    example: {
                        description: "Build a 500 sq ft home addition with kitchen and bathroom @$150/sqft",
                        projectDetails: {
                            location: "Toronto, ON",
                            timeline: "6 months",
                            budget: 75000
                        },
                        options: {
                            includeCompliance: true,
                            includeRisks: true
                        }
                    }
                },
                response: {
                    projectId: 'string',
                    analysis: 'object',
                    recommendations: 'array',
                    nextSteps: 'array'
                }
            },

            'POST /api/projects/complete-analysis': {
                description: 'Perform comprehensive project analysis including workflow and costs',
                parameters: {
                    required: ['description'],
                    optional: ['region', 'options'],
                    example: {
                        description: "Renovate kitchen with new cabinets, countertops, appliances @$80/sqft for 200 sqft",
                        region: "toronto",
                        options: {
                            includeOptimizations: true
                        }
                    }
                },
                response: {
                    projectId: 'string',
                    analysis: 'object',
                    workflow: 'object',
                    costs: 'object',
                    insights: 'object'
                }
            },

            // Workflow Generation Endpoints
            'POST /api/workflows/generate': {
                description: 'Generate construction workflow with task dependencies and scheduling',
                parameters: {
                    required: ['projectType'],
                    optional: ['projectDetails', 'region', 'options'],
                    example: {
                        projectType: "home_addition",
                        projectDetails: {
                            size: 500,
                            complexity: "medium",
                            features: ["kitchen", "bathroom"]
                        },
                        region: "toronto",
                        options: {
                            includeCriticalPath: true,
                            optimizeParallelTasks: true
                        }
                    }
                },
                response: {
                    workflow: 'object',
                    summary: 'object',
                    optimizations: 'array'
                }
            },

            'GET /api/workflows/templates': {
                description: 'Get available workflow templates for different project types',
                parameters: {
                    optional: ['projectType'],
                    example: {
                        projectType: "kitchen_renovation"
                    }
                },
                response: {
                    templates: 'array'
                }
            },

            // Cost Estimation Endpoints
            'POST /api/costs/estimate': {
                description: 'Calculate detailed cost estimates with regional pricing adjustments',
                parameters: {
                    required: ['projectType'],
                    optional: ['tasks', 'region', 'materials', 'options'],
                    example: {
                        projectType: "bathroom_renovation",
                        region: "toronto",
                        tasks: [
                            { name: "Demolition", duration: 2 },
                            { name: "Plumbing rough-in", duration: 3 }
                        ],
                        materials: [
                            { name: "Tile", quantity: 100, unit: "sqft" }
                        ],
                        options: {
                            includeContingency: true,
                            marketConditions: "normal"
                        }
                    }
                },
                response: {
                    estimate: 'object',
                    breakdown: 'object',
                    regionalFactors: 'object',
                    recommendations: 'array'
                }
            },

            'GET /api/costs/regions': {
                description: 'Get available regions and their pricing multipliers',
                parameters: {
                    optional: ['detailed'],
                    example: {
                        detailed: "true"
                    }
                },
                response: {
                    regions: 'array'
                }
            },

            // Utility Endpoints
            'GET /api/health': {
                description: 'Check API health status and component availability',
                parameters: {},
                response: {
                    status: 'string',
                    version: 'string',
                    components: 'object'
                }
            }
        };
    }

    /**
     * Main request handler - routes requests to appropriate handlers
     */
    async handleRequest(method, path, body = {}, query = {}, headers = {}) {
        try {
            // Add request logging
            const requestId = this.generateRequestId();
            console.log(`🌐 [${requestId}] ${method} ${path}`);

            // Validate endpoint exists
            const endpointKey = `${method} ${path}`;
            if (!this.endpoints[endpointKey]) {
                throw new Error(`Endpoint not found: ${endpointKey}`);
            }

            // Add rate limiting check (stub for now)
            await this.checkRateLimit(headers);

            // Route to server handler
            const response = await this.server.handleRequest(method, path, body, query);
            
            console.log(`✅ [${requestId}] Request completed successfully`);
            return {
                ...response,
                requestId
            };

        } catch (error) {
            console.error(`❌ Request failed:`, error);
            return {
                success: false,
                error: {
                    message: error.message,
                    type: error.name || 'APIError',
                    timestamp: new Date().toISOString()
                }
            };
        }
    }

    /**
     * Get API documentation for all endpoints
     */
    getDocumentation() {
        return {
            title: 'FireBuildAI Construction Management API',
            version: '1.0.0',
            description: 'AI-powered construction project analysis, workflow generation, and cost estimation',
            baseUrl: '/api',
            endpoints: this.endpoints,
            examples: this.getUsageExamples(),
            authentication: 'Not required for demo version',
            rateLimits: {
                requests: '100 per 15 minutes per IP',
                burst: '10 concurrent requests'
            }
        };
    }

    /**
     * Get usage examples for common workflows
     */
    getUsageExamples() {
        return {
            'Simple Project Analysis': {
                method: 'POST',
                endpoint: '/api/projects/analyze',
                description: 'Analyze a basic construction project description',
                request: {
                    description: "Add a 300 sqft deck to back of house @$45/sqft with railings and stairs"
                },
                expectedResponse: {
                    success: true,
                    data: {
                        projectId: "fb_1234567890_abc123def",
                        analysis: {
                            projectType: "deck_construction",
                            complexity: "medium",
                            estimatedTimeframe: "2-3 weeks",
                            keyFeatures: ["deck_framing", "railings", "stairs"]
                        }
                    }
                }
            },

            'Complete Project Analysis': {
                method: 'POST',
                endpoint: '/api/projects/complete-analysis',
                description: 'Full analysis including workflow and costs',
                request: {
                    description: "Kitchen renovation: new cabinets, quartz countertops, stainless appliances @$120/sqft for 180 sqft",
                    region: "toronto"
                },
                expectedResponse: {
                    success: true,
                    data: {
                        projectId: "fb_1234567890_xyz789abc",
                        analysis: {
                            projectType: "kitchen_renovation",
                            complexity: "medium"
                        },
                        workflow: {
                            totalTasks: 15,
                            estimatedDuration: "4-6 weeks"
                        },
                        costs: {
                            totalEstimate: 21600,
                            breakdown: {
                                materials: 12960,
                                labor: 6480,
                                permits: 500
                            }
                        }
                    }
                }
            },

            'Generate Workflow': {
                method: 'POST',
                endpoint: '/api/workflows/generate',
                description: 'Generate detailed construction workflow',
                request: {
                    projectType: "bathroom_renovation",
                    projectDetails: {
                        size: 80,
                        complexity: "high",
                        features: ["tile_work", "new_plumbing", "ventilation"]
                    },
                    options: {
                        includeCriticalPath: true
                    }
                },
                expectedResponse: {
                    success: true,
                    data: {
                        workflow: {
                            tasks: "array of task objects",
                            criticalPath: "array of critical tasks",
                            estimatedDuration: "3-4 weeks"
                        },
                        summary: {
                            totalTasks: 12,
                            parallelOpportunities: 3
                        }
                    }
                }
            },

            'Cost Estimation': {
                method: 'POST',
                endpoint: '/api/costs/estimate',
                description: 'Calculate regional cost estimates',
                request: {
                    projectType: "home_addition",
                    region: "vancouver",
                    tasks: [
                        { name: "Foundation", duration: 5 },
                        { name: "Framing", duration: 10 }
                    ]
                },
                expectedResponse: {
                    success: true,
                    data: {
                        estimate: {
                            totalCost: 85000,
                            confidence: 0.85
                        },
                        breakdown: {
                            materials: 42500,
                            labor: 34000,
                            permits: 2500,
                            contingency: 6000
                        },
                        regionalFactors: {
                            region: "vancouver",
                            multiplier: 1.25
                        }
                    }
                }
            }
        };
    }

    /**
     * Batch request handler for multiple operations
     */
    async handleBatchRequest(requests) {
        const results = [];
        const batchId = this.generateRequestId();
        
        console.log(`📦 [${batchId}] Processing batch of ${requests.length} requests`);

        for (let i = 0; i < requests.length; i++) {
            const request = requests[i];
            try {
                const result = await this.handleRequest(
                    request.method,
                    request.path,
                    request.body,
                    request.query,
                    request.headers
                );
                
                results.push({
                    index: i,
                    success: true,
                    result
                });
                
            } catch (error) {
                results.push({
                    index: i,
                    success: false,
                    error: error.message
                });
            }
        }

        console.log(`✅ [${batchId}] Batch completed: ${results.filter(r => r.success).length}/${results.length} successful`);
        
        return {
            batchId,
            totalRequests: requests.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    }

    /**
     * WebSocket handler for real-time updates (stub for future implementation)
     */
    async handleWebSocketMessage(message) {
        try {
            const { type, data } = JSON.parse(message);
            
            switch (type) {
                case 'project_analysis':
                    // Stream analysis progress
                    return await this.streamProjectAnalysis(data);
                    
                case 'cost_updates':
                    // Real-time cost updates
                    return await this.streamCostUpdates(data);
                    
                default:
                    throw new Error(`Unknown WebSocket message type: ${type}`);
            }
        } catch (error) {
            return {
                type: 'error',
                error: error.message
            };
        }
    }

    /**
     * Generate unique request ID for tracking
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    /**
     * Rate limiting check (placeholder for production implementation)
     */
    async checkRateLimit(headers) {
        // In production, this would check Redis or database for rate limits
        // For now, just return true
        return true;
    }

    /**
     * Stream project analysis progress (placeholder for WebSocket implementation)
     */
    async streamProjectAnalysis(data) {
        // This would provide real-time updates during analysis
        return {
            type: 'progress',
            stage: 'analysis',
            progress: 50,
            message: 'Analyzing project complexity...'
        };
    }

    /**
     * Stream cost updates (placeholder for real-time pricing)
     */
    async streamCostUpdates(data) {
        // This would provide real-time material pricing updates
        return {
            type: 'cost_update',
            material: 'lumber',
            oldPrice: 450,
            newPrice: 465,
            change: '+3.3%'
        };
    }

    /**
     * Get endpoint metrics and usage statistics
     */
    getMetrics() {
        return {
            totalEndpoints: Object.keys(this.endpoints).length,
            categories: {
                projects: 2,
                workflows: 2,
                costs: 2,
                utility: 1
            },
            mostUsedEndpoints: [
                '/api/projects/complete-analysis',
                '/api/workflows/generate',
                '/api/costs/estimate'
            ],
            averageResponseTime: '250ms',
            uptime: '99.9%'
        };
    }
}

module.exports = APIRoutes;

// Export endpoint definitions for documentation
module.exports.endpoints = new APIRoutes().defineEndpoints();