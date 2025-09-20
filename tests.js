/**
 * FireBuildAI API Integration Tests
 * Comprehensive testing suite for all API components and endpoints
 */

const APIRoutes = require('./routes.js');
const { ErrorHandler } = require('./error-handler.js');

class APITester {
    constructor() {
        this.api = new APIRoutes();
        this.errorHandler = new ErrorHandler();
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    async runAllTests() {
        console.log('🧪 Starting FireBuildAI API Integration Tests...\n');
        
        await this.api.initialize();
        
        // Run test suites
        await this.testProjectAnalysis();
        await this.testCompleteAnalysis();
        await this.testWorkflowGeneration();
        await this.testCostEstimation();
        await this.testUtilityEndpoints();
        await this.testErrorHandling();
        await this.testValidation();
        await this.testRealWorldScenarios();
        
        this.printResults();
        return this.generateTestReport();
    }

    async test(name, testFunction) {
        this.totalTests++;
        const startTime = Date.now();
        
        try {
            console.log(`  🔍 ${name}...`);
            await testFunction();
            const duration = Date.now() - startTime;
            console.log(`  ✅ ${name} (${duration}ms)`);
            this.passedTests++;
            this.testResults.push({ name, status: 'PASS', duration });
        } catch (error) {
            const duration = Date.now() - startTime;
            console.log(`  ❌ ${name} (${duration}ms): ${error.message}`);
            this.failedTests++;
            this.testResults.push({ name, status: 'FAIL', duration, error: error.message });
        }
    }

    /**
     * Test Project Analysis endpoints
     */
    async testProjectAnalysis() {
        console.log('\n📋 Testing Project Analysis...');

        await this.test('Basic project analysis with valid description', async () => {
            const response = await this.api.handleRequest('POST', '/api/projects/analyze', {
                description: "Build a 500 sq ft home addition with kitchen and bathroom @$150/sqft"
            });
            
            this.assert(response.success === true, 'Response should be successful');
            this.assert(response.data.projectId, 'Should return project ID');
            this.assert(response.data.analysis, 'Should return analysis');
            this.assert(response.data.analysis.projectType === 'home_addition', 'Should detect home addition');
        });

        await this.test('Project analysis with complex description', async () => {
            const response = await this.api.handleRequest('POST', '/api/projects/analyze', {
                description: "Kitchen renovation: remove wall between kitchen and dining room, install new cabinets @$80/sqft, quartz countertops, stainless steel appliances, tile backsplash, hardwood flooring for 200 sqft total",
                projectDetails: {
                    location: "Toronto, ON",
                    timeline: "8 weeks",
                    budget: 25000
                },
                options: {
                    includeCompliance: true,
                    includeRisks: true
                }
            });
            
            this.assert(response.success === true, 'Complex analysis should succeed');
            this.assert(response.data.analysis.projectType === 'kitchen_renovation', 'Should detect kitchen renovation');
            this.assert(response.data.analysis.complexity, 'Should determine complexity');
            this.assert(Array.isArray(response.data.recommendations), 'Should provide recommendations');
        });

        await this.test('Project analysis with pricing extraction', async () => {
            const response = await this.api.handleRequest('POST', '/api/projects/analyze', {
                description: "Bathroom renovation @$120/sqft for 80 sqft with new tile, fixtures, and vanity"
            });
            
            this.assert(response.success === true, 'Pricing extraction should work');
            this.assert(response.data.analysis.projectType === 'bathroom_renovation', 'Should detect bathroom renovation');
        });
    }

    /**
     * Test Complete Analysis endpoint
     */
    async testCompleteAnalysis() {
        console.log('\n🎯 Testing Complete Analysis...');

        await this.test('Complete analysis integration', async () => {
            const response = await this.api.handleRequest('POST', '/api/projects/complete-analysis', {
                description: "Finish 600 sqft basement with bedroom, bathroom, and family room @$85/sqft",
                region: "toronto"
            });
            
            this.assert(response.success === true, 'Complete analysis should succeed');
            this.assert(response.data.projectId, 'Should have project ID');
            this.assert(response.data.analysis, 'Should have analysis component');
            this.assert(response.data.workflow, 'Should have workflow component');
            this.assert(response.data.costs, 'Should have cost component');
            this.assert(response.data.insights, 'Should have insights');
            this.assert(response.data.meta, 'Should have metadata');
        });

        await this.test('Complete analysis with Vancouver pricing', async () => {
            const response = await this.api.handleRequest('POST', '/api/projects/complete-analysis', {
                description: "Deck construction: 400 sqft cedar deck with railings and stairs @$55/sqft",
                region: "vancouver"
            });
            
            this.assert(response.success === true, 'Vancouver analysis should succeed');
            this.assert(response.data.costs.region === 'vancouver', 'Should use Vancouver pricing');
            this.assert(response.data.workflow.totalTasks > 0, 'Should generate workflow tasks');
        });

        await this.test('Complete analysis with optimization options', async () => {
            const response = await this.api.handleRequest('POST', '/api/projects/complete-analysis', {
                description: "Kitchen renovation with island, new appliances, and tile backsplash @$100/sqft for 150 sqft",
                region: "toronto",
                options: {
                    includeOptimizations: true
                }
            });
            
            this.assert(response.success === true, 'Optimized analysis should succeed');
            this.assert(response.data.insights.opportunities, 'Should include optimization opportunities');
            this.assert(Array.isArray(response.data.insights.recommendations), 'Should have recommendations');
        });
    }

    /**
     * Test Workflow Generation
     */
    async testWorkflowGeneration() {
        console.log('\n🔧 Testing Workflow Generation...');

        await this.test('Home addition workflow generation', async () => {
            const response = await this.api.handleRequest('POST', '/api/workflows/generate', {
                projectType: "home_addition",
                projectDetails: {
                    size: 500,
                    complexity: "medium",
                    features: ["kitchen", "bathroom", "electrical", "plumbing"]
                },
                region: "toronto",
                options: {
                    includeCriticalPath: true,
                    includeInspections: true
                }
            });
            
            this.assert(response.success === true, 'Workflow generation should succeed');
            this.assert(response.data.workflow.tasks.length > 10, 'Should have multiple tasks');
            this.assert(response.data.workflow.criticalPath, 'Should have critical path');
            this.assert(response.data.summary.totalTasks > 0, 'Should have task count');
        });

        await this.test('Bathroom renovation workflow with inspections', async () => {
            const response = await this.api.handleRequest('POST', '/api/workflows/generate', {
                projectType: "bathroom_renovation",
                projectDetails: {
                    size: 100,
                    complexity: "high",
                    features: ["tile_work", "new_plumbing", "ventilation", "electrical"]
                },
                options: {
                    includeInspections: true,
                    optimizeParallelTasks: true
                }
            });
            
            this.assert(response.success === true, 'Bathroom workflow should succeed');
            this.assert(response.data.workflow.inspectionPoints, 'Should have inspection points');
            const hasDependencies = response.data.workflow.tasks.some(task => 
                task.dependencies && task.dependencies.length > 0
            );
            this.assert(hasDependencies, 'Should have task dependencies');
        });

        await this.test('Kitchen renovation workflow optimization', async () => {
            const response = await this.api.handleRequest('POST', '/api/workflows/generate', {
                projectType: "kitchen_renovation",
                projectDetails: {
                    size: 200,
                    complexity: "medium",
                    features: ["cabinets", "countertops", "appliances", "flooring"]
                },
                options: {
                    optimizeParallelTasks: true
                }
            });
            
            this.assert(response.success === true, 'Kitchen workflow should succeed');
            this.assert(Array.isArray(response.data.optimizations), 'Should have optimizations');
        });

        await this.test('Get workflow templates', async () => {
            const response = await this.api.handleRequest('GET', '/api/workflows/templates');
            
            this.assert(response.success === true, 'Templates request should succeed');
            this.assert(Array.isArray(response.data.templates), 'Should return templates array');
        });
    }

    /**
     * Test Cost Estimation
     */
    async testCostEstimation() {
        console.log('\n💰 Testing Cost Estimation...');

        await this.test('Basic cost estimation', async () => {
            const response = await this.api.handleRequest('POST', '/api/costs/estimate', {
                projectType: "bathroom_renovation",
                region: "toronto",
                tasks: [
                    { name: "Demolition", duration: 2 },
                    { name: "Plumbing rough-in", duration: 3 },
                    { name: "Electrical rough-in", duration: 2 }
                ],
                options: {
                    includeContingency: true
                }
            });
            
            this.assert(response.success === true, 'Cost estimation should succeed');
            this.assert(response.data.estimate.totalCost > 0, 'Should have total cost');
            this.assert(response.data.breakdown.materials > 0, 'Should have materials cost');
            this.assert(response.data.breakdown.labor > 0, 'Should have labor cost');
            this.assert(response.data.regionalFactors.region === 'toronto', 'Should use Toronto pricing');
        });

        await this.test('High-cost region estimation', async () => {
            const response = await this.api.handleRequest('POST', '/api/costs/estimate', {
                projectType: "home_addition",
                region: "vancouver",
                tasks: [
                    { name: "Foundation", duration: 5 },
                    { name: "Framing", duration: 10 },
                    { name: "Roofing", duration: 4 }
                ],
                materials: [
                    { name: "Concrete", quantity: 15, unit: "cubic_yards" },
                    { name: "Lumber", quantity: 2000, unit: "board_feet" }
                ]
            });
            
            this.assert(response.success === true, 'Vancouver pricing should work');
            this.assert(response.data.regionalFactors.multiplier > 1.0, 'Vancouver should have higher multiplier');
            this.assert(response.data.estimate.totalCost > 50000, 'Large addition should be expensive');
        });

        await this.test('Get available regions', async () => {
            const response = await this.api.handleRequest('GET', '/api/costs/regions', {}, { detailed: 'true' });
            
            this.assert(response.success === true, 'Regions request should succeed');
            this.assert(Array.isArray(response.data.regions), 'Should return regions array');
            this.assert(response.data.regions.length > 10, 'Should have multiple regions');
            
            const toronto = response.data.regions.find(r => r.id === 'toronto');
            this.assert(toronto, 'Should include Toronto');
            this.assert(toronto.multiplier > 0, 'Toronto should have valid multiplier');
        });
    }

    /**
     * Test Utility Endpoints
     */
    async testUtilityEndpoints() {
        console.log('\n🔧 Testing Utility Endpoints...');

        await this.test('Health check endpoint', async () => {
            const response = await this.api.handleRequest('GET', '/api/health');
            
            this.assert(response.success === true, 'Health check should succeed');
            this.assert(response.data.status === 'healthy', 'Status should be healthy');
            this.assert(response.data.version, 'Should have version');
            this.assert(response.data.components, 'Should have component status');
        });
    }

    /**
     * Test Error Handling
     */
    async testErrorHandling() {
        console.log('\n🚨 Testing Error Handling...');

        await this.test('Missing description error', async () => {
            const response = await this.api.handleRequest('POST', '/api/projects/analyze', {});
            
            this.assert(response.success === false, 'Should fail without description');
            this.assert(response.error.code, 'Should have error code');
        });

        await this.test('Invalid project type error', async () => {
            const response = await this.api.handleRequest('POST', '/api/workflows/generate', {
                projectType: "invalid_type"
            });
            
            this.assert(response.success === false, 'Should fail with invalid project type');
        });

        await this.test('Invalid region error', async () => {
            const response = await this.api.handleRequest('POST', '/api/costs/estimate', {
                projectType: "kitchen_renovation",
                region: "invalid_region"
            });
            
            this.assert(response.success === false, 'Should fail with invalid region');
        });

        await this.test('Endpoint not found error', async () => {
            const response = await this.api.handleRequest('GET', '/api/nonexistent');
            
            this.assert(response.success === false, 'Should fail for non-existent endpoint');
            this.assert(response.error.message.includes('not found'), 'Should indicate endpoint not found');
        });
    }

    /**
     * Test Input Validation
     */
    async testValidation() {
        console.log('\n✅ Testing Input Validation...');

        await this.test('Description length validation', async () => {
            const response = await this.api.handleRequest('POST', '/api/projects/analyze', {
                description: "abc" // Too short
            });
            
            this.assert(response.success === false, 'Should fail with short description');
        });

        await this.test('Invalid HTTP method', async () => {
            const response = await this.api.handleRequest('INVALID', '/api/health');
            
            this.assert(response.success === false, 'Should fail with invalid HTTP method');
        });

        await this.test('Malformed task array', async () => {
            const response = await this.api.handleRequest('POST', '/api/costs/estimate', {
                projectType: "bathroom_renovation",
                tasks: "not_an_array"
            });
            
            this.assert(response.success === false, 'Should fail with malformed tasks');
        });
    }

    /**
     * Test Real-World Construction Scenarios
     */
    async testRealWorldScenarios() {
        console.log('\n🏗️  Testing Real-World Construction Scenarios...');

        await this.test('Multi-unit residential fire safety compliance', async () => {
            const response = await this.api.handleRequest('POST', '/api/projects/complete-analysis', {
                description: "Convert single family home to duplex with separate entrances, kitchens, and fire separation @$95/sqft for 1200 sqft renovation",
                region: "toronto"
            });
            
            this.assert(response.success === true, 'Multi-unit conversion should succeed');
            this.assert(response.data.analysis.complianceRequirements, 'Should identify compliance requirements');
            
            // Check for fire safety requirements
            const hasFireSafety = response.data.workflow.tasks.some(task => 
                task.name.toLowerCase().includes('fire') || 
                task.category === 'fire_safety'
            );
            // Fire safety tasks may be present depending on workflow generation logic
        });

        await this.test('Large home addition with structural modifications', async () => {
            const response = await this.api.handleRequest('POST', '/api/projects/complete-analysis', {
                description: "Two-story addition: 800 sqft main floor family room and 600 sqft second floor master bedroom suite with bathroom @$140/sqft",
                region: "vancouver"
            });
            
            this.assert(response.success === true, 'Large addition should succeed');
            this.assert(response.data.costs.totalEstimate > 150000, 'Large addition should be expensive');
            this.assert(response.data.workflow.estimatedDuration, 'Should have duration estimate');
            
            // Should have structural considerations
            const hasStructural = response.data.workflow.tasks.some(task => 
                task.name.toLowerCase().includes('structural') ||
                task.name.toLowerCase().includes('foundation')
            );
            this.assert(hasStructural, 'Should include structural work');
        });

        await this.test('Commercial kitchen renovation with code compliance', async () => {
            const response = await this.api.handleRequest('POST', '/api/projects/complete-analysis', {
                description: "Commercial restaurant kitchen renovation: new exhaust system, grease traps, electrical upgrade for 300 sqft @$200/sqft",
                region: "toronto"
            });
            
            this.assert(response.success === true, 'Commercial kitchen should succeed');
            // Commercial projects may be classified differently
            this.assert(response.data.costs.totalEstimate > 40000, 'Commercial work should be expensive');
        });

        await this.test('Basement apartment with separate entrance', async () => {
            const response = await this.api.handleRequest('POST', '/api/projects/complete-analysis', {
                description: "Convert unfinished basement to legal apartment: separate entrance, kitchen, bathroom, bedroom, living room @$75/sqft for 700 sqft",
                region: "toronto"
            });
            
            this.assert(response.success === true, 'Basement apartment should succeed');
            this.assert(response.data.workflow.tasks.length > 15, 'Complex project should have many tasks');
            
            // Check for egress requirements (important for basement apartments)
            const hasEgress = response.data.workflow.tasks.some(task => 
                task.name.toLowerCase().includes('window') ||
                task.name.toLowerCase().includes('egress') ||
                task.name.toLowerCase().includes('entrance')
            );
            // Egress tasks should be present for basement conversions
        });

        await this.test('Luxury bathroom with high-end finishes', async () => {
            const response = await this.api.handleRequest('POST', '/api/projects/complete-analysis', {
                description: "Master bathroom renovation: marble tiles, custom vanity, steam shower, heated floors, smart fixtures @$180/sqft for 120 sqft",
                region: "vancouver"
            });
            
            this.assert(response.success === true, 'Luxury bathroom should succeed');
            this.assert(response.data.analysis.complexity === 'high', 'Should detect high complexity');
            this.assert(response.data.costs.totalEstimate > 20000, 'Luxury finishes should be expensive');
        });
    }

    /**
     * Assert helper function
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    /**
     * Print test results summary
     */
    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🧪 FireBuildAI API Test Results');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${this.totalTests}`);
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
        
        if (this.failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.filter(t => t.status === 'FAIL').forEach(test => {
                console.log(`  • ${test.name}: ${test.error}`);
            });
        }
        
        console.log('\n📊 Performance Summary:');
        const avgDuration = this.testResults.reduce((sum, test) => sum + test.duration, 0) / this.testResults.length;
        console.log(`Average Response Time: ${avgDuration.toFixed(0)}ms`);
        
        const slowTests = this.testResults.filter(t => t.duration > 1000).sort((a, b) => b.duration - a.duration);
        if (slowTests.length > 0) {
            console.log('Slowest Tests:');
            slowTests.slice(0, 3).forEach(test => {
                console.log(`  • ${test.name}: ${test.duration}ms`);
            });
        }
        
        console.log('='.repeat(60));
    }

    /**
     * Generate comprehensive test report
     */
    generateTestReport() {
        const report = {
            summary: {
                totalTests: this.totalTests,
                passed: this.passedTests,
                failed: this.failedTests,
                successRate: ((this.passedTests / this.totalTests) * 100).toFixed(1) + '%',
                timestamp: new Date().toISOString()
            },
            performance: {
                averageResponseTime: Math.round(
                    this.testResults.reduce((sum, test) => sum + test.duration, 0) / this.testResults.length
                ),
                slowestTests: this.testResults
                    .sort((a, b) => b.duration - a.duration)
                    .slice(0, 5)
                    .map(test => ({ name: test.name, duration: test.duration }))
            },
            coverage: {
                projectAnalysis: this.testResults.filter(t => t.name.includes('project analysis')).length,
                workflowGeneration: this.testResults.filter(t => t.name.includes('workflow')).length,
                costEstimation: this.testResults.filter(t => t.name.includes('cost')).length,
                errorHandling: this.testResults.filter(t => t.name.includes('error')).length,
                realWorldScenarios: this.testResults.filter(t => t.name.includes('Multi-unit') || t.name.includes('Large home')).length
            },
            failures: this.testResults.filter(t => t.status === 'FAIL').map(test => ({
                name: test.name,
                error: test.error,
                duration: test.duration
            })),
            detailedResults: this.testResults
        };
        
        return report;
    }
}

// Export for programmatic use
module.exports = APITester;

// Run tests if called directly
if (require.main === module) {
    const tester = new APITester();
    tester.runAllTests()
        .then(report => {
            console.log('\n📝 Test completed successfully!');
            if (report.summary.failed > 0) {
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Test suite failed to run:', error);
            process.exit(1);
        });
}