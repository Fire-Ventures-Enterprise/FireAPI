/**
 * 🧪 Microservices Test Script
 * Test the carpentry API and orchestrator functionality
 */

const axios = require('axios');

async function testCarpentryAPI() {
    console.log('🔨 Testing Carpentry API...\n');
    
    const carpentryURL = 'http://localhost:3001';
    
    try {
        // Test health endpoint
        console.log('1. Health Check:');
        const health = await axios.get(`${carpentryURL}/health`);
        console.log('✅', health.data);
        console.log();

        // Test service info
        console.log('2. Service Info:');
        const info = await axios.get(`${carpentryURL}/info`);
        console.log('✅', info.data);
        console.log();

        // Test kitchen cabinet estimate
        console.log('3. Kitchen Cabinet Estimate:');
        const cabinetRequest = {
            request_id: 'test_001',
            project: {
                type: 'kitchen_renovation',
                size: 'medium',
                quality_tier: 'mid_range',
                location: { region: 'national' }
            },
            trade_scope: {
                phases: ['demolition', 'installation', 'finishing'],
                specific_requirements: [
                    'upper_cabinets',
                    'lower_cabinets', 
                    'crown_molding',
                    'soft_close_hardware'
                ]
            },
            constraints: {
                timeline: 'standard',
                budget_range: 'mid_range'
            }
        };

        const cabinetEstimate = await axios.post(`${carpentryURL}/estimate`, cabinetRequest);
        console.log('✅ Cabinet Estimate Response:');
        console.log(`   Total Cost: $${cabinetEstimate.data.estimate.total_cost}`);
        console.log(`   Labor Hours: ${cabinetEstimate.data.estimate.labor.total_hours}`);
        console.log(`   Timeline: ${cabinetEstimate.data.estimate.labor.timeline_days} days`);
        console.log(`   Confidence: ${(cabinetEstimate.data.estimate.confidence * 100).toFixed(1)}%`);
        console.log();

        // Test template access
        console.log('4. Template Access:');
        const templates = await axios.get(`${carpentryURL}/templates`);
        console.log('✅ Available Templates:', Object.keys(templates.data.templates));
        console.log();

        return true;
    } catch (error) {
        console.error('❌ Carpentry API Test Failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
        return false;
    }
}

async function testOrchestrator() {
    console.log('🎪 Testing Orchestrator (Simulation)...\n');
    
    // Since we're not running the full orchestrator, simulate the process
    const EstimateOrchestrator = require('./microservices/main-orchestrator/orchestrator');
    const orchestrator = new EstimateOrchestrator();
    
    try {
        console.log('1. Natural Language Parsing:');
        const testInput = "I want to remodel my medium kitchen with new cabinets, electrical outlets, and plumbing";
        const analysis = await orchestrator.parseProjectDescription(testInput, { square_footage: 150 });
        console.log('✅ Project Analysis:', analysis);
        console.log();

        console.log('2. Trade Request Building:');
        const requests = orchestrator.buildTradeRequests(analysis);
        console.log('✅ Trade Requests Generated:', requests.length);
        requests.forEach(req => {
            console.log(`   ${req.trade}: ${req.request.trade_scope.specific_requirements.length} requirements`);
        });
        console.log();

        return true;
    } catch (error) {
        console.error('❌ Orchestrator Test Failed:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting Microservices Architecture Tests');
    console.log('='.repeat(60));
    console.log();

    const results = {
        carpentry: await testCarpentryAPI(),
        orchestrator: await testOrchestrator()
    };

    console.log('📊 Test Results Summary:');
    console.log('='.repeat(30));
    Object.entries(results).forEach(([service, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${service}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    console.log();

    const allPassed = Object.values(results).every(r => r);
    console.log(`🎯 Overall Result: ${allPassed ? 'SUCCESS' : 'SOME FAILURES'}`);
    
    if (allPassed) {
        console.log('\n🎉 Microservices architecture is working correctly!');
        console.log('Ready to deploy individual trade APIs and orchestrator.');
    } else {
        console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    }
}

// Run tests if called directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { testCarpentryAPI, testOrchestrator, runAllTests };