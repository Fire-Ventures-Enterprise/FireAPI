/**
 * FireBuildAI API Server
 * Main server integrating construction analysis, workflow generation, and cost estimation
 * 
 * Endpoints:
 * POST /api/projects/analyze - Analyze construction project description
 * POST /api/workflows/generate - Generate construction workflow with dependencies
 * POST /api/costs/estimate - Calculate detailed cost estimates with regional pricing
 * GET /api/costs/regions - Get available regions and pricing multipliers
 * GET /api/workflows/templates - Get available workflow templates
 * POST /api/projects/complete-analysis - Full project analysis (all components)
 */

// Import core API modules
const ConstructionProjectAnalyzer = require('./construction-analyzer.js');
const WorkflowEngine = require('./workflow-engine.js');
const CostDatabase = require('./cost-database.js');

class FireBuildAIServer {
    constructor() {
        this.analyzer = new ConstructionProjectAnalyzer();
        this.workflowEngine = new WorkflowEngine();
        this.costDatabase = new CostDatabase();
        
        // API versioning and configuration
        this.version = '1.0.0';
        this.maxRequestSize = '10mb';
        this.rateLimits = {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        };
    }

    /**
     * Initialize the API server with middleware and routing
     */
    async initialize() {
        try {
            console.log('🚀 Initializing FireBuildAI API Server...');
            
            // Initialize core components
            await this.analyzer.initialize();
            await this.workflowEngine.initialize();
            await this.costDatabase.initialize();
            
            console.log('✅ API Server initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize API server:', error);
            throw error;
        }
    }

    /**
     * Process incoming API requests and route to appropriate handlers
     */
    async handleRequest(method, path, body = {}, query = {}) {
        try {
            const startTime = Date.now();
            console.log(`📡 ${method} ${path}`, { query, bodySize: JSON.stringify(body).length });

            // Validate request
            this.validateRequest(method, path, body);

            let response;
            
            // Route to appropriate handler
            switch (`${method} ${path}`) {
                case 'POST /api/projects/analyze':
                    response = await this.analyzeProject(body);
                    break;
                    
                case 'POST /api/workflows/generate':
                    response = await this.generateWorkflow(body);
                    break;
                    
                case 'POST /api/costs/estimate':
                    response = await this.estimateCosts(body);
                    break;
                    
                case 'GET /api/costs/regions':
                    response = await this.getAvailableRegions(query);
                    break;
                    
                case 'GET /api/workflows/templates':
                    response = await this.getWorkflowTemplates(query);
                    break;
                    
                case 'POST /api/projects/complete-analysis':
                    response = await this.completeProjectAnalysis(body);
                    break;
                    
                case 'GET /api/health':
                    response = await this.getHealthStatus();
                    break;
                    
                default:
                    throw new Error(`Endpoint not found: ${method} ${path}`);
            }

            const duration = Date.now() - startTime;
            console.log(`✅ Request completed in ${duration}ms`);

            return {
                success: true,
                data: response,
                meta: {
                    version: this.version,
                    timestamp: new Date().toISOString(),
                    processingTime: `${duration}ms`
                }
            };

        } catch (error) {
            console.error('❌ API Request failed:', error);
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
     * Analyze construction project description
     * POST /api/projects/analyze
     */
    async analyzeProject(body) {
        const { description, projectDetails = {}, options = {} } = body;
        
        if (!description || typeof description !== 'string') {
            throw new Error('Project description is required and must be a string');
        }

        console.log('🔍 Analyzing project description...');
        
        const analysis = await this.analyzer.analyzeProject(description, {
            ...projectDetails,
            includeCompliance: options.includeCompliance !== false,
            includeRisks: options.includeRisks !== false
        });

        return {
            projectId: this.generateProjectId(),
            analysis,
            recommendations: this.generateRecommendations(analysis),
            nextSteps: [
                'Generate detailed workflow with dependencies',
                'Calculate regional cost estimates',
                'Review building code compliance requirements'
            ]
        };
    }

    /**
     * Generate construction workflow with task dependencies
     * POST /api/workflows/generate
     */
    async generateWorkflow(body) {
        const { 
            projectType, 
            projectDetails = {}, 
            region = 'toronto', 
            options = {} 
        } = body;

        if (!projectType) {
            throw new Error('Project type is required');
        }

        console.log(`🔧 Generating workflow for ${projectType}...`);

        const workflow = await this.workflowEngine.generateWorkflow(projectType, {
            ...projectDetails,
            region,
            includeCriticalPath: options.includeCriticalPath !== false,
            includeInspections: options.includeInspections !== false,
            optimizeParallelTasks: options.optimizeParallelTasks !== false
        });

        return {
            workflow,
            summary: {
                totalTasks: workflow.tasks.length,
                estimatedDuration: workflow.estimatedDuration,
                criticalPath: workflow.criticalPath,
                parallelOpportunities: workflow.parallelTasks?.length || 0
            },
            optimizations: this.generateWorkflowOptimizations(workflow)
        };
    }

    /**
     * Calculate detailed cost estimates with regional pricing
     * POST /api/costs/estimate
     */
    async estimateCosts(body) {
        const { 
            projectType, 
            tasks = [], 
            region = 'toronto', 
            materials = [],
            options = {} 
        } = body;

        console.log(`💰 Calculating cost estimates for ${region}...`);

        const costEstimate = await this.costDatabase.calculateComprehensiveEstimate({
            projectType,
            tasks,
            region,
            materials,
            includeContingency: options.includeContingency !== false,
            includeProfitMargin: options.includeProfitMargin !== false,
            marketConditions: options.marketConditions || 'normal'
        });

        return {
            estimate: costEstimate,
            breakdown: {
                materials: costEstimate.materialsCost,
                labor: costEstimate.laborCost,
                permits: costEstimate.permitsCost,
                contingency: costEstimate.contingency,
                total: costEstimate.totalCost
            },
            regionalFactors: {
                region: costEstimate.region,
                multiplier: costEstimate.regionalMultiplier,
                marketConditions: costEstimate.marketConditions
            },
            recommendations: this.generateCostOptimizations(costEstimate)
        };
    }

    /**
     * Get available regions and pricing multipliers
     * GET /api/costs/regions
     */
    async getAvailableRegions(query = {}) {
        const regions = this.costDatabase.getAvailableRegions();
        
        if (query.detailed === 'true') {
            return {
                regions: regions.map(region => ({
                    ...region,
                    sampleCosts: this.costDatabase.getSampleCosts(region.id)
                }))
            };
        }
        
        return { regions };
    }

    /**
     * Get available workflow templates
     * GET /api/workflows/templates
     */
    async getWorkflowTemplates(query = {}) {
        const templates = this.workflowEngine.getAvailableTemplates();
        
        if (query.projectType) {
            const filtered = templates.filter(t => 
                t.projectTypes.includes(query.projectType.toLowerCase())
            );
            return { templates: filtered };
        }
        
        return { templates };
    }

    /**
     * Complete project analysis - integrates all three components
     * POST /api/projects/complete-analysis
     */
    async completeProjectAnalysis(body) {
        const { 
            description, 
            region = 'toronto', 
            options = {} 
        } = body;

        if (!description) {
            throw new Error('Project description is required');
        }

        console.log('🎯 Performing complete project analysis...');

        const projectId = this.generateProjectId();
        const startTime = Date.now();

        // Step 1: Analyze project description
        console.log('  📋 Step 1: Analyzing project description...');
        const analysis = await this.analyzer.analyzeProject(description);

        // Step 2: Generate workflow based on analysis
        console.log('  🔧 Step 2: Generating construction workflow...');
        const workflow = await this.workflowEngine.generateWorkflow(
            analysis.projectType, 
            {
                ...analysis.projectDetails,
                region,
                complexity: analysis.complexity
            }
        );

        // Step 3: Calculate comprehensive cost estimates
        console.log('  💰 Step 3: Calculating cost estimates...');
        const costEstimate = await this.costDatabase.calculateComprehensiveEstimate({
            projectType: analysis.projectType,
            tasks: workflow.tasks,
            region,
            complexity: analysis.complexity,
            materials: analysis.materials || []
        });

        const processingTime = Date.now() - startTime;
        console.log(`✅ Complete analysis finished in ${processingTime}ms`);

        return {
            projectId,
            analysis: {
                description: description,
                projectType: analysis.projectType,
                complexity: analysis.complexity,
                keyFeatures: analysis.keyFeatures,
                estimatedTimeframe: analysis.estimatedTimeframe,
                complianceRequirements: analysis.complianceRequirements
            },
            workflow: {
                tasks: workflow.tasks,
                totalTasks: workflow.tasks.length,
                estimatedDuration: workflow.estimatedDuration,
                criticalPath: workflow.criticalPath,
                inspectionPoints: workflow.inspectionPoints
            },
            costs: {
                totalEstimate: costEstimate.totalCost,
                breakdown: {
                    materials: costEstimate.materialsCost,
                    labor: costEstimate.laborCost,
                    permits: costEstimate.permitsCost,
                    contingency: costEstimate.contingency
                },
                region: costEstimate.region,
                confidence: costEstimate.confidence
            },
            insights: {
                riskFactors: this.identifyRiskFactors(analysis, workflow, costEstimate),
                opportunities: this.identifyOptimizations(analysis, workflow, costEstimate),
                recommendations: this.generateComprehensiveRecommendations(analysis, workflow, costEstimate)
            },
            meta: {
                processingTime: `${processingTime}ms`,
                apiVersion: this.version,
                generatedAt: new Date().toISOString()
            }
        };
    }

    /**
     * Get API health status
     * GET /api/health
     */
    async getHealthStatus() {
        return {
            status: 'healthy',
            version: this.version,
            uptime: process.uptime ? `${Math.floor(process.uptime())}s` : 'N/A',
            components: {
                analyzer: this.analyzer ? 'operational' : 'error',
                workflowEngine: this.workflowEngine ? 'operational' : 'error',
                costDatabase: this.costDatabase ? 'operational' : 'error'
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Validate incoming API requests
     */
    validateRequest(method, path, body) {
        // Basic validation
        if (!method || !path) {
            throw new Error('Method and path are required');
        }

        // Validate POST request bodies
        if (method === 'POST' && (!body || typeof body !== 'object')) {
            throw new Error('POST requests require a valid JSON body');
        }

        // Validate required fields for specific endpoints
        if (path === '/api/projects/analyze' && !body.description) {
            throw new Error('Project description is required');
        }

        if (path === '/api/workflows/generate' && !body.projectType) {
            throw new Error('Project type is required');
        }
    }

    /**
     * Generate unique project ID
     */
    generateProjectId() {
        return `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate project recommendations based on analysis
     */
    generateRecommendations(analysis) {
        const recommendations = [];

        if (analysis.complexity === 'high') {
            recommendations.push({
                type: 'planning',
                message: 'Consider hiring a project manager for this complex project',
                priority: 'high'
            });
        }

        if (analysis.projectType === 'home_addition') {
            recommendations.push({
                type: 'permits',
                message: 'Structural engineer review recommended for load-bearing modifications',
                priority: 'medium'
            });
        }

        recommendations.push({
            type: 'timeline',
            message: 'Add 15-20% buffer time for weather delays and permit processing',
            priority: 'medium'
        });

        return recommendations;
    }

    /**
     * Generate workflow optimizations
     */
    generateWorkflowOptimizations(workflow) {
        const optimizations = [];

        if (workflow.parallelTasks && workflow.parallelTasks.length > 0) {
            optimizations.push({
                type: 'efficiency',
                message: `${workflow.parallelTasks.length} tasks can be performed in parallel to reduce timeline`,
                impact: 'time_savings'
            });
        }

        if (workflow.criticalPath && workflow.criticalPath.length > workflow.tasks.length * 0.7) {
            optimizations.push({
                type: 'scheduling',
                message: 'High critical path ratio - consider resource optimization',
                impact: 'risk_reduction'
            });
        }

        return optimizations;
    }

    /**
     * Generate cost optimizations
     */
    generateCostOptimizations(costEstimate) {
        const optimizations = [];

        if (costEstimate.materialsCost > costEstimate.totalCost * 0.6) {
            optimizations.push({
                type: 'materials',
                message: 'Consider bulk purchasing or alternative materials to reduce costs',
                potential_savings: '10-15%'
            });
        }

        if (costEstimate.confidence < 0.8) {
            optimizations.push({
                type: 'planning',
                message: 'Detailed material takeoff recommended to improve cost accuracy',
                impact: 'risk_reduction'
            });
        }

        return optimizations;
    }

    /**
     * Identify risk factors across all components
     */
    identifyRiskFactors(analysis, workflow, costEstimate) {
        const risks = [];

        // Analysis-based risks
        if (analysis.complexity === 'high') {
            risks.push({
                category: 'complexity',
                risk: 'High project complexity increases likelihood of delays and cost overruns',
                mitigation: 'Detailed planning and professional project management'
            });
        }

        // Workflow-based risks
        if (workflow.tasks.some(task => task.weather_dependent)) {
            risks.push({
                category: 'weather',
                risk: 'Weather-dependent tasks may cause schedule delays',
                mitigation: 'Plan weather-sensitive work for optimal seasons'
            });
        }

        // Cost-based risks
        if (costEstimate.confidence < 0.7) {
            risks.push({
                category: 'budget',
                risk: 'Low cost estimate confidence may lead to budget overruns',
                mitigation: 'Obtain detailed quotes from multiple contractors'
            });
        }

        return risks;
    }

    /**
     * Identify optimization opportunities
     */
    identifyOptimizations(analysis, workflow, costEstimate) {
        const opportunities = [];

        // Check for parallel task opportunities
        const parallelTasks = workflow.tasks.filter(task => 
            !task.dependencies || task.dependencies.length === 0
        );
        
        if (parallelTasks.length > 2) {
            opportunities.push({
                type: 'scheduling',
                description: 'Multiple independent tasks can be scheduled simultaneously',
                benefit: 'Reduce overall project timeline by 15-25%'
            });
        }

        // Check for bulk purchasing opportunities
        const materialTasks = workflow.tasks.filter(task => 
            task.materials && task.materials.length > 0
        );
        
        if (materialTasks.length > 5) {
            opportunities.push({
                type: 'procurement',
                description: 'Bulk material purchasing across multiple phases',
                benefit: 'Potential 8-12% savings on material costs'
            });
        }

        return opportunities;
    }

    /**
     * Generate comprehensive recommendations
     */
    generateComprehensiveRecommendations(analysis, workflow, costEstimate) {
        return [
            {
                category: 'planning',
                recommendation: 'Create detailed project schedule with milestone reviews',
                rationale: 'Ensures project stays on track and budget'
            },
            {
                category: 'budget',
                recommendation: 'Establish 15-20% contingency fund for unforeseen costs',
                rationale: 'Construction projects commonly exceed initial estimates'
            },
            {
                category: 'quality',
                recommendation: 'Schedule inspections at key milestones',
                rationale: 'Prevents costly rework and ensures code compliance'
            },
            {
                category: 'communication',
                recommendation: 'Establish regular progress meetings with all stakeholders',
                rationale: 'Maintains alignment and addresses issues promptly'
            }
        ];
    }
}

// Export the server class for use
module.exports = FireBuildAIServer;

// Railway deployment entry point
if (require.main === module) {
    const FireAPIApp = require('./app.js');
    const app = new FireAPIApp();
    
    const PORT = process.env.PORT || 3000;
    
    const server = app.getApp().listen(PORT, '0.0.0.0', () => {
        console.log('🚀 FireAPI.dev - Construction Intelligence API');
        console.log('='.repeat(50));
        console.log(`🌐 Server running on port ${PORT}`);
        console.log(`📚 Documentation: http://localhost:${PORT}/docs`);
        console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
        console.log('📊 Available endpoints:');
        console.log('  POST /api/projects/analyze');
        console.log('  POST /api/projects/complete-analysis');
        console.log('  POST /api/workflows/generate');
        console.log('  POST /api/costs/estimate');
        console.log('  GET /api/costs/regions');
        console.log('  GET /api/workflows/templates');
        console.log('='.repeat(50));
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully');
        server.close(() => {
            console.log('Process terminated');
            process.exit(0);
        });
    });
}