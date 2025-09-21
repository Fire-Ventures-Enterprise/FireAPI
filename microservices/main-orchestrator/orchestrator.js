/**
 * 🎪 Main Orchestrator API
 * Coordinates estimates across multiple trade services
 */

const axios = require('axios');

class EstimateOrchestrator {
    constructor() {
        this.tradeServices = {
            carpentry: process.env.CARPENTRY_API_URL || 'http://localhost:3001',
            electrical: process.env.ELECTRICAL_API_URL || 'http://localhost:3002',
            plumbing: process.env.PLUMBING_API_URL || 'http://localhost:3003',
            painting: process.env.PAINTING_API_URL || 'http://localhost:3004',
            flooring: process.env.FLOORING_API_URL || 'http://localhost:3005'
        };
        
        this.serviceTimeout = 30000; // 30 seconds
    }

    /**
     * 🧠 Parse natural language and orchestrate multi-trade estimate
     */
    async generateMultiTradeEstimate(naturalLanguageInput, projectDetails = {}) {
        console.log('🎪 [ORCHESTRATOR] Processing:', naturalLanguageInput);
        
        // 1. Parse natural language to identify trades and requirements
        const projectAnalysis = await this.parseProjectDescription(naturalLanguageInput, projectDetails);
        
        // 2. Generate requests for each required trade
        const tradeRequests = this.buildTradeRequests(projectAnalysis);
        
        // 3. Call trade APIs in parallel
        const tradeEstimates = await this.callTradeAPIs(tradeRequests);
        
        // 4. Coordinate and combine estimates
        const coordinatedEstimate = await this.coordinateEstimates(tradeEstimates, projectAnalysis);
        
        // 5. Generate final comprehensive estimate
        return this.formatFinalEstimate(coordinatedEstimate, projectAnalysis);
    }

    /**
     * 🧠 Analyze natural language to determine project scope
     */
    async parseProjectDescription(description, projectDetails) {
        const analysis = {
            project_type: this.identifyProjectType(description),
            size: this.extractSize(description, projectDetails),
            quality_tier: this.extractQualityTier(description),
            trades_required: this.identifyRequiredTrades(description),
            specific_requirements: this.extractSpecificRequirements(description),
            location: projectDetails.location || { region: 'national' },
            timeline_preference: this.extractTimelinePreference(description)
        };

        console.log('🧠 [ORCHESTRATOR] Project Analysis:', analysis);
        return analysis;
    }

    identifyProjectType(description) {
        const desc = description.toLowerCase();
        
        if (desc.includes('kitchen')) return 'kitchen_renovation';
        if (desc.includes('bathroom')) return 'bathroom_renovation';
        if (desc.includes('basement')) return 'basement_finish';
        if (desc.includes('addition')) return 'room_addition';
        if (desc.includes('whole house') || desc.includes('entire house')) return 'whole_house_renovation';
        
        return 'general_renovation';
    }

    extractSize(description, projectDetails) {
        const desc = description.toLowerCase();
        
        // Check explicit size mentions
        if (desc.includes('small') || desc.includes('tiny') || desc.includes('galley')) return 'small';
        if (desc.includes('large') || desc.includes('big') || desc.includes('spacious')) return 'large';
        if (desc.includes('xl') || desc.includes('luxury') || desc.includes('massive')) return 'xl';
        
        // Use project details if available
        if (projectDetails.square_footage) {
            const sqft = projectDetails.square_footage;
            if (sqft < 120) return 'small';
            if (sqft > 250) return 'large';
            if (sqft > 350) return 'xl';
        }
        
        return 'medium';
    }

    extractQualityTier(description) {
        const desc = description.toLowerCase();
        
        if (desc.includes('budget') || desc.includes('cheap') || desc.includes('affordable')) return 'budget';
        if (desc.includes('luxury') || desc.includes('high-end') || desc.includes('premium') || desc.includes('custom')) return 'luxury';
        if (desc.includes('high') || desc.includes('quality') || desc.includes('nice')) return 'high_end';
        
        return 'mid_range';
    }

    identifyRequiredTrades(description) {
        const desc = description.toLowerCase();
        const trades = [];

        // Carpentry indicators
        if (desc.match(/cabinet|trim|door|frame|wood|built.?in/)) trades.push('carpentry');
        
        // Electrical indicators  
        if (desc.match(/electric|outlet|light|wire|panel|circuit/)) trades.push('electrical');
        
        // Plumbing indicators
        if (desc.match(/plumb|pipe|faucet|toilet|sink|shower|drain/)) trades.push('plumbing');
        
        // Painting indicators
        if (desc.match(/paint|color|wall|primer/)) trades.push('painting');
        
        // Flooring indicators
        if (desc.match(/floor|tile|carpet|hardwood|vinyl|laminate/)) trades.push('flooring');

        // Default for common projects
        if (desc.includes('kitchen') && trades.length === 0) {
            trades.push('carpentry', 'electrical', 'plumbing');
        }

        return trades.length > 0 ? trades : ['carpentry']; // Default to carpentry
    }

    extractSpecificRequirements(description) {
        const desc = description.toLowerCase();
        const requirements = [];

        // Cabinet requirements
        if (desc.includes('upper cabinet')) requirements.push('upper_cabinets');
        if (desc.includes('lower cabinet') || desc.includes('base cabinet')) requirements.push('lower_cabinets');
        if (desc.includes('island')) requirements.push('island');
        if (desc.includes('crown molding') || desc.includes('crown mold')) requirements.push('crown_molding');
        if (desc.includes('soft close')) requirements.push('soft_close_hardware');
        
        // General indicators
        if (desc.includes('new cabinets') || desc.includes('cabinet')) {
            requirements.push('upper_cabinets', 'lower_cabinets');
        }

        return requirements;
    }

    extractTimelinePreference(description) {
        const desc = description.toLowerCase();
        
        if (desc.includes('rush') || desc.includes('asap') || desc.includes('urgent')) return 'rush';
        if (desc.includes('flexible') || desc.includes('whenever')) return 'flexible';
        
        return 'standard';
    }

    /**
     * 🏗️ Build standardized requests for each trade
     */
    buildTradeRequests(projectAnalysis) {
        const requests = [];
        const baseRequest = {
            request_id: this.generateRequestId(),
            project: {
                type: projectAnalysis.project_type,
                size: projectAnalysis.size,
                quality_tier: projectAnalysis.quality_tier,
                location: projectAnalysis.location
            },
            constraints: {
                timeline: projectAnalysis.timeline_preference,
                budget_range: projectAnalysis.quality_tier
            }
        };

        projectAnalysis.trades_required.forEach(trade => {
            const tradeRequest = {
                ...baseRequest,
                trade_scope: {
                    phases: this.getPhasesForTrade(trade, projectAnalysis.project_type),
                    specific_requirements: this.getTradeRequirements(trade, projectAnalysis.specific_requirements)
                }
            };
            
            requests.push({ trade, request: tradeRequest });
        });

        return requests;
    }

    getPhasesForTrade(trade, projectType) {
        const phaseMap = {
            carpentry: {
                kitchen_renovation: ['demolition', 'installation', 'finishing'],
                general_renovation: ['installation', 'finishing']
            },
            electrical: {
                kitchen_renovation: ['rough_in', 'finish_work'],
                general_renovation: ['installation']
            },
            plumbing: {
                kitchen_renovation: ['rough_in', 'fixture_installation'],
                general_renovation: ['installation']
            }
        };

        return phaseMap[trade]?.[projectType] || ['installation'];
    }

    getTradeRequirements(trade, allRequirements) {
        const tradeFilters = {
            carpentry: req => req.includes('cabinet') || req.includes('trim') || req.includes('molding') || req.includes('door'),
            electrical: req => req.includes('outlet') || req.includes('light') || req.includes('circuit'),
            plumbing: req => req.includes('faucet') || req.includes('sink') || req.includes('pipe')
        };

        const filter = tradeFilters[trade];
        return filter ? allRequirements.filter(filter) : allRequirements;
    }

    /**
     * 📡 Call all trade APIs in parallel
     */
    async callTradeAPIs(tradeRequests) {
        console.log(`🔄 [ORCHESTRATOR] Calling ${tradeRequests.length} trade APIs...`);
        
        const promises = tradeRequests.map(async ({ trade, request }) => {
            try {
                const serviceUrl = this.tradeServices[trade];
                if (!serviceUrl) {
                    throw new Error(`Trade service URL not configured: ${trade}`);
                }

                console.log(`📞 [ORCHESTRATOR] Calling ${trade} API at ${serviceUrl}`);
                
                const response = await axios.post(`${serviceUrl}/estimate`, request, {
                    timeout: this.serviceTimeout,
                    headers: { 'Content-Type': 'application/json' }
                });

                console.log(`✅ [ORCHESTRATOR] ${trade} estimate received`);
                return { trade, success: true, estimate: response.data };
                
            } catch (error) {
                console.error(`❌ [ORCHESTRATOR] ${trade} API error:`, error.message);
                return { 
                    trade, 
                    success: false, 
                    error: error.message,
                    fallback: this.getFallbackEstimate(trade, request)
                };
            }
        });

        return await Promise.all(promises);
    }

    /**
     * 📋 Coordinate estimates and resolve dependencies
     */
    async coordinateEstimates(tradeEstimates, projectAnalysis) {
        const successful = tradeEstimates.filter(te => te.success);
        const failed = tradeEstimates.filter(te => !te.success);

        if (failed.length > 0) {
            console.warn(`⚠️ [ORCHESTRATOR] ${failed.length} trade APIs failed, using fallbacks`);
        }

        // Combine successful estimates with fallbacks
        const allEstimates = successful.map(te => ({ 
            trade: te.trade, 
            estimate: te.estimate 
        })).concat(failed.map(te => ({ 
            trade: te.trade, 
            estimate: te.fallback 
        })));

        // Resolve scheduling dependencies
        const schedule = this.resolveScheduleDependencies(allEstimates);

        // Calculate combined totals
        const totals = this.calculateCombinedTotals(allEstimates);

        return {
            estimates: allEstimates,
            schedule,
            totals,
            confidence: this.calculateOverallConfidence(allEstimates, failed.length)
        };
    }

    resolveScheduleDependencies(estimates) {
        // Simple sequential scheduling for now
        // Future: implement proper critical path method
        let currentDay = 0;
        const schedule = [];

        const dependencies = {
            electrical: [],
            plumbing: [],
            carpentry: ['electrical', 'plumbing'],
            flooring: ['carpentry'],
            painting: ['flooring']
        };

        Object.keys(dependencies).forEach(trade => {
            const estimate = estimates.find(e => e.trade === trade);
            if (estimate) {
                const duration = estimate.estimate.estimate.labor.timeline_days || 1;
                schedule.push({
                    trade,
                    start_day: currentDay + 1,
                    end_day: currentDay + duration,
                    duration
                });
                currentDay += duration;
            }
        });

        return schedule;
    }

    calculateCombinedTotals(estimates) {
        return estimates.reduce((totals, { estimate }) => {
            const est = estimate.estimate;
            return {
                total_labor_hours: totals.total_labor_hours + (est.labor.total_hours || 0),
                total_labor_cost: totals.total_labor_cost + (est.labor.cost || 0),
                total_material_cost: totals.total_material_cost + (est.materials.total_cost || 0),
                total_project_cost: totals.total_project_cost + (est.total_cost || 0)
            };
        }, { total_labor_hours: 0, total_labor_cost: 0, total_material_cost: 0, total_project_cost: 0 });
    }

    calculateOverallConfidence(estimates, failedCount) {
        if (estimates.length === 0) return 0;
        
        const avgConfidence = estimates.reduce((sum, { estimate }) => 
            sum + (estimate.estimate.confidence || 0.5), 0) / estimates.length;
        
        // Reduce confidence for failed services
        const reliabilityFactor = Math.max(0.5, 1 - (failedCount * 0.2));
        
        return Math.min(0.95, avgConfidence * reliabilityFactor);
    }

    /**
     * 📋 Format final comprehensive estimate
     */
    formatFinalEstimate(coordinatedEstimate, projectAnalysis) {
        return {
            project: {
                description: projectAnalysis.project_type,
                size: projectAnalysis.size,
                quality_tier: projectAnalysis.quality_tier,
                trades_involved: projectAnalysis.trades_required
            },
            estimates: {
                by_trade: coordinatedEstimate.estimates.map(({ trade, estimate }) => ({
                    trade,
                    labor_hours: estimate.estimate.labor.total_hours,
                    labor_cost: estimate.estimate.labor.cost,
                    material_cost: estimate.estimate.materials.total_cost,
                    total_cost: estimate.estimate.total_cost,
                    phases: estimate.estimate.phases
                })),
                combined_totals: coordinatedEstimate.totals
            },
            schedule: {
                total_timeline_days: Math.max(...coordinatedEstimate.schedule.map(s => s.end_day)),
                by_trade: coordinatedEstimate.schedule
            },
            confidence: coordinatedEstimate.confidence,
            timestamp: new Date().toISOString(),
            request_id: this.generateRequestId()
        };
    }

    getFallbackEstimate(trade, request) {
        // Simple fallback estimates when trade APIs are unavailable
        const fallbacks = {
            carpentry: { labor: { total_hours: 24, cost: 1560 }, materials: { total_cost: 2500 }, total_cost: 4060 },
            electrical: { labor: { total_hours: 12, cost: 900 }, materials: { total_cost: 800 }, total_cost: 1700 },
            plumbing: { labor: { total_hours: 16, cost: 1200 }, materials: { total_cost: 600 }, total_cost: 1800 },
            painting: { labor: { total_hours: 20, cost: 1300 }, materials: { total_cost: 400 }, total_cost: 1700 },
            flooring: { labor: { total_hours: 18, cost: 1170 }, materials: { total_cost: 1200 }, total_cost: 2370 }
        };

        return {
            request_id: request.request_id,
            trade,
            estimate: fallbacks[trade] || fallbacks.carpentry,
            note: 'Fallback estimate - trade service unavailable'
        };
    }

    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

module.exports = EstimateOrchestrator;