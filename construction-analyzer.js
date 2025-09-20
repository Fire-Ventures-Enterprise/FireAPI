// FireBuildAI Construction Project Analysis API
// Core engine for parsing construction projects and generating optimized workflows

class ConstructionProjectAnalyzer {
    constructor() {
        this.costDatabase = new CostDatabase();
        this.workflowEngine = new WorkflowEngine();
        this.regionalPricing = new RegionalPricingEngine();
    }

    /**
     * Main API endpoint: Analyze construction project description
     * @param {string} projectDescription - Natural language project description
     * @param {Object} options - Analysis options (location, timeline, etc.)
     * @returns {Object} Complete project analysis with workflow and costs
     */
    async analyzeProject(projectDescription, options = {}) {
        console.log('🔍 Starting project analysis...');
        
        try {
            // Step 1: Parse project description
            const projectData = await this.parseProjectDescription(projectDescription);
            
            // Step 2: Extract costs using @ symbol pricing
            const extractedCosts = this.extractPricingData(projectDescription);
            
            // Step 3: Generate workflow sequence
            const workflow = await this.workflowEngine.generateWorkflow(projectData);
            
            // Step 4: Apply regional pricing adjustments
            const regionalAdjustments = await this.regionalPricing.adjustCosts(
                extractedCosts, 
                options.location || 'national-average'
            );
            
            // Step 5: Optimize timeline and dependencies
            const optimizedWorkflow = await this.workflowEngine.optimizeSequence(workflow);
            
            // Step 6: Calculate final project metrics
            const projectMetrics = this.calculateProjectMetrics(
                projectData, 
                regionalAdjustments, 
                optimizedWorkflow
            );
            
            return {
                success: true,
                projectId: this.generateProjectId(),
                analysis: {
                    projectType: projectData.type,
                    scope: projectData.scope,
                    squareFootage: projectData.squareFootage,
                    complexity: projectData.complexity
                },
                costs: regionalAdjustments,
                workflow: optimizedWorkflow,
                metrics: projectMetrics,
                recommendations: this.generateRecommendations(projectData, optimizedWorkflow),
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Analysis failed:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Parse natural language project description into structured data
     */
    parseProjectDescription(description) {
        console.log('📋 Parsing project description...');
        
        const projectData = {
            type: 'unknown',
            scope: {},
            squareFootage: 0,
            complexity: 'medium',
            requirements: [],
            rooms: [],
            systems: [],
            finishes: [],
            specialRequirements: []
        };

        // Detect project type
        projectData.type = this.detectProjectType(description);
        
        // Extract square footage
        projectData.squareFootage = this.extractSquareFootage(description);
        
        // Parse scope sections
        projectData.scope = this.parseScopeOfWork(description);
        
        // Extract systems
        projectData.systems = this.extractSystems(description);
        
        // Extract finishes
        projectData.finishes = this.extractFinishes(description);
        
        // Extract special requirements
        projectData.specialRequirements = this.extractSpecialRequirements(description);
        
        // Calculate complexity score
        projectData.complexity = this.calculateComplexity(projectData);
        
        return projectData;
    }

    /**
     * Detect project type from description
     */
    detectProjectType(description) {
        const lowerDesc = description.toLowerCase();
        
        if (lowerDesc.includes('addition') && lowerDesc.includes('sqft')) {
            return 'home-addition';
        }
        if (lowerDesc.includes('kitchen') && lowerDesc.includes('remodel')) {
            return 'kitchen-renovation';
        }
        if (lowerDesc.includes('bathroom') && lowerDesc.includes('renovation')) {
            return 'bathroom-renovation';
        }
        if (lowerDesc.includes('basement') && lowerDesc.includes('retrofit')) {
            return 'basement-finishing';
        }
        if (lowerDesc.includes('deck') || lowerDesc.includes('patio')) {
            return 'outdoor-construction';
        }
        
        return 'general-renovation';
    }

    /**
     * Extract square footage from description
     */
    extractSquareFootage(description) {
        // Look for patterns like "1320 sqft", "1,320 sq ft", "1320 square feet"
        const patterns = [
            /(\d+,?\d*)\s*sqft/i,
            /(\d+,?\d*)\s*sq\s*ft/i,
            /(\d+,?\d*)\s*square\s*feet/i
        ];
        
        for (const pattern of patterns) {
            const match = description.match(pattern);
            if (match) {
                return parseInt(match[1].replace(',', ''));
            }
        }
        
        return 0;
    }

    /**
     * Parse scope of work sections
     */
    parseScopeOfWork(description) {
        const scope = {};
        
        // Foundation work
        if (description.includes('Foundation:') || description.includes('foundation')) {
            scope.foundation = this.extractSectionContent(description, 'foundation');
        }
        
        // Structural work
        if (description.includes('Structural:') || description.includes('structural')) {
            scope.structural = this.extractSectionContent(description, 'structural');
        }
        
        // Exterior work
        if (description.includes('Exterior:') || description.includes('exterior')) {
            scope.exterior = this.extractSectionContent(description, 'exterior');
        }
        
        return scope;
    }

    /**
     * Extract systems (electrical, plumbing, HVAC)
     */
    extractSystems(description) {
        const systems = [];
        
        if (description.toLowerCase().includes('electrical')) {
            systems.push({
                type: 'electrical',
                details: this.extractSectionContent(description, 'electrical')
            });
        }
        
        if (description.toLowerCase().includes('plumbing')) {
            systems.push({
                type: 'plumbing',
                details: this.extractSectionContent(description, 'plumbing')
            });
        }
        
        if (description.toLowerCase().includes('hvac')) {
            systems.push({
                type: 'hvac',
                details: this.extractSectionContent(description, 'hvac')
            });
        }
        
        return systems;
    }

    /**
     * Extract finishes information
     */
    extractFinishes(description) {
        const finishes = [];
        
        if (description.toLowerCase().includes('flooring')) {
            finishes.push({
                type: 'flooring',
                details: this.extractSectionContent(description, 'flooring')
            });
        }
        
        if (description.toLowerCase().includes('interior')) {
            finishes.push({
                type: 'interior',
                details: this.extractSectionContent(description, 'interior')
            });
        }
        
        return finishes;
    }

    /**
     * Extract special requirements
     */
    extractSpecialRequirements(description) {
        const requirements = [];
        
        // Building permits
        if (description.toLowerCase().includes('permit')) {
            requirements.push('building-permits');
        }
        
        // Code compliance
        if (description.toLowerCase().includes('code compliance')) {
            requirements.push('code-compliance');
        }
        
        // Timeline constraints
        if (description.toLowerCase().includes('12 weeks') || description.toLowerCase().includes('timeline')) {
            requirements.push('timeline-constraints');
        }
        
        // Occupied home
        if (description.toLowerCase().includes('family remaining') || description.toLowerCase().includes('occupied')) {
            requirements.push('occupied-home');
        }
        
        return requirements;
    }

    /**
     * Extract content for a specific section
     */
    extractSectionContent(description, sectionType) {
        const lines = description.split('\n');
        let capturing = false;
        let content = [];
        
        for (const line of lines) {
            if (line.toLowerCase().includes(sectionType)) {
                capturing = true;
                content.push(line);
            } else if (capturing && line.trim().startsWith('-')) {
                content.push(line);
            } else if (capturing && line.trim() === '') {
                continue;
            } else if (capturing && !line.trim().startsWith('-')) {
                break;
            }
        }
        
        return content.join('\n');
    }

    /**
     * Calculate project complexity
     */
    calculateComplexity(projectData) {
        let complexityScore = 0;
        
        // Base complexity by type
        const typeComplexity = {
            'home-addition': 4,
            'kitchen-renovation': 3,
            'bathroom-renovation': 2,
            'basement-finishing': 3,
            'general-renovation': 2
        };
        
        complexityScore += typeComplexity[projectData.type] || 2;
        
        // Size factor
        if (projectData.squareFootage > 1000) complexityScore += 2;
        else if (projectData.squareFootage > 500) complexityScore += 1;
        
        // Systems complexity
        complexityScore += projectData.systems.length;
        
        // Special requirements
        complexityScore += projectData.specialRequirements.length * 0.5;
        
        if (complexityScore >= 7) return 'high';
        if (complexityScore >= 4) return 'medium';
        return 'low';
    }

    /**
     * Extract pricing data using @ symbol
     */
    extractPricingData(description) {
        const costs = {
            items: [],
            subtotal: 0,
            total: 0
        };
        
        // Find all @$amount patterns
        const pricePattern = /@\$([0-9,]+)/g;
        let match;
        
        while ((match = pricePattern.exec(description)) !== null) {
            const amount = parseInt(match[1].replace(',', ''));
            costs.items.push({
                amount: amount,
                context: this.getContextForPrice(description, match.index)
            });
            costs.subtotal += amount;
        }
        
        costs.total = costs.subtotal;
        
        return costs;
    }

    /**
     * Get context around a price mention
     */
    getContextForPrice(description, index) {
        const start = Math.max(0, index - 100);
        const end = Math.min(description.length, index + 50);
        return description.substring(start, end).trim();
    }

    /**
     * Calculate final project metrics
     */
    calculateProjectMetrics(projectData, costs, workflow) {
        return {
            totalCost: costs.total,
            timeline: {
                standardDays: workflow.standardDuration,
                optimizedDays: workflow.optimizedDuration,
                timeSavings: workflow.standardDuration - workflow.optimizedDuration
            },
            efficiency: {
                costPerSqft: costs.total / (projectData.squareFootage || 1),
                parallelizationRate: workflow.parallelTasks.length / workflow.tasks.length,
                complexityFactor: this.getComplexityMultiplier(projectData.complexity)
            },
            riskFactors: this.assessRiskFactors(projectData),
            recommendations: []
        };
    }

    getComplexityMultiplier(complexity) {
        const multipliers = { low: 1.0, medium: 1.2, high: 1.5 };
        return multipliers[complexity] || 1.2;
    }

    /**
     * Assess project risk factors
     */
    assessRiskFactors(projectData) {
        const risks = [];
        
        if (projectData.specialRequirements.includes('occupied-home')) {
            risks.push({ type: 'schedule', level: 'medium', description: 'Construction in occupied home' });
        }
        
        if (projectData.complexity === 'high') {
            risks.push({ type: 'complexity', level: 'high', description: 'High complexity project' });
        }
        
        if (projectData.squareFootage > 1500) {
            risks.push({ type: 'scale', level: 'medium', description: 'Large scale project' });
        }
        
        return risks;
    }

    /**
     * Generate project recommendations
     */
    generateRecommendations(projectData, workflow) {
        const recommendations = [];
        
        if (workflow.parallelTasks.length > 0) {
            recommendations.push({
                type: 'optimization',
                priority: 'high',
                description: `${workflow.parallelTasks.length} tasks can be parallelized to save time`
            });
        }
        
        if (projectData.specialRequirements.includes('occupied-home')) {
            recommendations.push({
                type: 'logistics',
                priority: 'high',
                description: 'Schedule noisy work during daytime hours, protect living areas'
            });
        }
        
        return recommendations;
    }

    /**
     * Generate unique project ID
     */
    generateProjectId() {
        return `FB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

module.exports = ConstructionProjectAnalyzer;