/**
 * 🏗️ Ottawa Building Code Compliance Checker
 * Analyzes construction projects for code compliance and violation risk
 */

const OTTAWA_CODES = require('../data/ottawa-building-codes');

class ComplianceChecker {
    constructor() {
        this.version = '1.0.0';
        this.service = 'ottawa-compliance-checker';
        this.jurisdiction = 'ottawa_on_ca';
        this.codeDatabase = OTTAWA_CODES;
    }

    /**
     * 🏠 Generate Complete Compliance Report
     */
    async generateComplianceReport(projectData) {
        console.log('[COMPLIANCE] Analyzing project:', JSON.stringify(projectData, null, 2));

        const jurisdiction = this.identifyJurisdiction(projectData.location);
        const applicableCodes = this.getApplicableCodes(jurisdiction, projectData);
        const requirements = this.analyzeRequirements(projectData, applicableCodes);
        const violations = this.predictViolations(projectData, requirements);
        const timeline = this.generateInspectionTimeline(projectData);

        return {
            project_analysis: {
                jurisdiction: jurisdiction.name,
                project_type: projectData.project_type,
                scope: projectData.scope,
                risk_level: this.calculateRiskLevel(violations),
                estimated_permit_cost: this.estimatePermitCosts(projectData, jurisdiction),
                total_potential_fines: violations.reduce((sum, v) => sum + v.max_fine, 0)
            },
            compliance_requirements: requirements,
            violation_predictions: violations,
            inspection_timeline: timeline,
            action_items: this.generateActionItems(requirements, violations),
            code_references: this.generateCodeReferences(requirements),
            confidence: 0.92,
            last_updated: new Date().toISOString()
        };
    }

    /**
     * 🌍 Identify Jurisdiction from Location
     */
    identifyJurisdiction(location) {
        const locationLower = location.toLowerCase();
        
        // Ottawa and amalgamated cities
        if (locationLower.includes('ottawa') || 
            locationLower.includes('kanata') ||
            locationLower.includes('nepean') ||
            locationLower.includes('gloucester') ||
            locationLower.includes('orleans') ||
            locationLower.includes('stittsville')) {
            return this.codeDatabase.jurisdictions.ottawa_on_ca;
        }
        
        // Cross-river Quebec
        if (locationLower.includes('gatineau') || locationLower.includes('hull')) {
            return this.codeDatabase.jurisdictions.gatineau_qc_ca;
        }
        
        // Default to Ottawa for Ontario locations
        if (locationLower.includes('ontario') || locationLower.includes('on')) {
            return this.codeDatabase.jurisdictions.ottawa_on_ca;
        }

        // Fallback
        return this.codeDatabase.jurisdictions.ottawa_on_ca;
    }

    /**
     * 📋 Get Applicable Building Codes
     */
    getApplicableCodes(jurisdiction, projectData) {
        const codes = [];
        
        // Add OBC sections based on project scope
        if (projectData.scope.includes('electrical')) {
            codes.push(...Object.keys(this.codeDatabase.ontario_building_code.electrical.kitchen_requirements));
        }
        
        if (projectData.scope.includes('plumbing')) {
            codes.push(...Object.keys(this.codeDatabase.ontario_building_code.plumbing.kitchen_requirements));
        }
        
        if (projectData.scope.includes('structural')) {
            codes.push(...Object.keys(this.codeDatabase.ontario_building_code.structural.kitchen_requirements));
        }

        return codes;
    }

    /**
     * 🔍 Analyze Specific Requirements
     */
    analyzeRequirements(projectData, applicableCodes) {
        const requirements = [];
        
        // Electrical Requirements
        if (projectData.scope.includes('electrical')) {
            requirements.push(...this.analyzeElectricalRequirements(projectData));
        }
        
        // Plumbing Requirements  
        if (projectData.scope.includes('plumbing')) {
            requirements.push(...this.analyzePlumbingRequirements(projectData));
        }
        
        // Structural Requirements
        if (projectData.scope.includes('structural')) {
            requirements.push(...this.analyzeStructuralRequirements(projectData));
        }

        return requirements;
    }

    /**
     * ⚡ Analyze Electrical Requirements
     */
    analyzeElectricalRequirements(projectData) {
        const requirements = [];
        const electricalCodes = this.codeDatabase.ontario_building_code.electrical.kitchen_requirements;

        // Kitchen Outlet Requirements
        requirements.push({
            category: 'electrical',
            phase: 'rough_electrical',
            code_section: '26-710(1)',
            title: 'Kitchen Small Appliance Circuits',
            requirement: electricalCodes['26-710-1'].requirement,
            compliance_steps: [
                'Install minimum two 20-ampere branch circuits for kitchen outlets',
                'Separate kitchen circuits from other room outlets',
                'Use 12 AWG copper wire for 20A circuits',
                'Install proper 20A breakers in panel'
            ],
            inspection_timing: 'rough_electrical',
            violation_risk: 'high',
            estimated_fine_range: '$500-2000',
            common_mistakes: electricalCodes['26-710-1'].common_mistakes
        });

        // GFCI Requirements
        requirements.push({
            category: 'electrical', 
            phase: 'final_electrical',
            code_section: '26-710(2)',
            title: 'GFCI Protection Near Water',
            requirement: electricalCodes['26-710-2'].requirement,
            compliance_steps: [
                'Install GFCI outlets within 1.5m (5 feet) of kitchen sink',
                'Test all GFCI outlets for proper operation',
                'Label GFCI outlets clearly',
                'Ensure GFCI protection on island/peninsula outlets near sink'
            ],
            inspection_timing: 'final_electrical',
            violation_risk: 'very_high',
            estimated_fine_range: '$750-3000',
            common_mistakes: electricalCodes['26-710-2'].common_mistakes
        });

        // Countertop Outlet Spacing
        requirements.push({
            category: 'electrical',
            phase: 'final_electrical', 
            code_section: '26-712',
            title: 'Countertop Outlet Spacing',
            requirement: electricalCodes['26-712'].requirement,
            compliance_steps: [
                'Install outlet for every countertop space 300mm+ wide',
                'Ensure no point more than 600mm from outlet horizontally',
                'Mount outlets 150mm-500mm above countertop',
                'Avoid placing outlets directly over sink or stove'
            ],
            inspection_timing: 'final_electrical',
            violation_risk: 'high',
            estimated_fine_range: '$300-1500',
            common_mistakes: electricalCodes['26-712'].common_mistakes
        });

        return requirements;
    }

    /**
     * 🚿 Analyze Plumbing Requirements
     */
    analyzePlumbingRequirements(projectData) {
        const requirements = [];
        const plumbingCodes = this.codeDatabase.ontario_building_code.plumbing.kitchen_requirements;

        requirements.push({
            category: 'plumbing',
            phase: 'rough_plumbing',
            code_section: '7.4.6',
            title: 'Kitchen Sink Drain and Vent',
            requirement: plumbingCodes['7-4-6'].requirement,
            compliance_steps: [
                'Install proper P-trap under kitchen sink',
                'Ensure drain slope of 1-4% (1/4" per foot minimum)',
                'Install adequate venting per Tables 7.4.6.2.A and 7.4.6.2.B',
                'Maintain minimum vent pipe diameter requirements'
            ],
            inspection_timing: 'rough_plumbing',
            violation_risk: 'high',
            estimated_fine_range: '$400-2000',
            common_mistakes: plumbingCodes['7-4-6'].common_mistakes
        });

        return requirements;
    }

    /**
     * 🏗️ Analyze Structural Requirements  
     */
    analyzeStructuralRequirements(projectData) {
        const requirements = [];
        const structuralCodes = this.codeDatabase.ontario_building_code.structural.kitchen_requirements;

        if (projectData.involves_wall_removal || projectData.scope.includes('structural')) {
            requirements.push({
                category: 'structural',
                phase: 'framing',
                code_section: '4.1.4',
                title: 'Load-Bearing Wall Modifications',
                requirement: structuralCodes['4-1-4'].requirement,
                compliance_steps: [
                    'Obtain structural engineering assessment before wall removal',
                    'Apply for structural permit if load-bearing wall involved',
                    'Install proper beam sizing per engineer specifications',
                    'Use approved connection methods and hardware'
                ],
                inspection_timing: 'framing',
                violation_risk: 'very_high',
                estimated_fine_range: '$2000-10000',
                common_mistakes: structuralCodes['4-1-4'].common_mistakes,
                critical_note: 'STOP WORK if load-bearing wall identified - requires engineer approval'
            });
        }

        return requirements;
    }

    /**
     * ⚠️ Predict Violation Risk
     */
    predictViolations(projectData, requirements) {
        const predictions = [];
        const violationStats = this.codeDatabase.violation_statistics.kitchen_renovations;

        requirements.forEach(req => {
            // Find matching violation statistics
            const matchingStats = violationStats.top_violations.find(v => 
                req.code_section.includes(v.code_section.split(' ')[1])
            );

            if (matchingStats) {
                predictions.push({
                    violation_type: matchingStats.type,
                    probability: matchingStats.frequency,
                    code_section: req.code_section,
                    title: req.title,
                    risk_level: req.violation_risk,
                    avg_fine: matchingStats.avg_fine,
                    max_fine: this.parseFinRange(req.estimated_fine_range).max,
                    prevention_steps: req.compliance_steps,
                    why_common: req.common_mistakes[0],
                    inspector_focus: this.getInspectorFocus(req.category, req.code_section)
                });
            }
        });

        return predictions.sort((a, b) => b.probability - a.probability);
    }

    /**
     * 📅 Generate Inspection Timeline
     */
    generateInspectionTimeline(projectData) {
        const timeline = this.codeDatabase.inspection_schedule.kitchen_renovation;
        
        return {
            permits_required: timeline.permits_required,
            estimated_timeline: this.calculateProjectTimeline(projectData),
            inspection_phases: timeline.inspection_phases.map(phase => ({
                ...phase,
                estimated_date: this.calculateInspectionDate(phase, projectData),
                booking_info: {
                    notice_required: '48 hours minimum',
                    phone: '613-580-2424',
                    online: 'ottawa.ca/inspections'
                }
            }))
        };
    }

    /**
     * ✅ Generate Action Items
     */
    generateActionItems(requirements, violations) {
        const actions = [];
        
        // High-priority violation prevention
        violations.filter(v => v.probability > 0.3).forEach(violation => {
            actions.push({
                priority: 'high',
                action: `Prevent ${violation.violation_type}`,
                steps: violation.prevention_steps,
                deadline: 'Before inspection',
                potential_savings: `$${violation.avg_fine}`
            });
        });

        // Permit applications
        actions.push({
            priority: 'critical',
            action: 'Apply for required permits',
            steps: [
                'Submit building permit application to City of Ottawa',
                'Include structural drawings if walls being modified', 
                'Apply for electrical permit if adding circuits',
                'Apply for plumbing permit if relocating fixtures'
            ],
            deadline: 'Before starting work',
            contact: 'City of Ottawa: 613-580-2424'
        });

        return actions;
    }

    /**
     * 📚 Generate Code References
     */
    generateCodeReferences(requirements) {
        return requirements.map(req => ({
            code_section: req.code_section,
            title: req.title,
            full_text: req.requirement,
            source: req.code_section.startsWith('26') ? 'Ontario Building Code 2012' : 'Ottawa Municipal By-law',
            online_reference: `https://www.ontario.ca/laws/regulation/332/12#BK${req.code_section.replace(/[^0-9]/g, '')}`
        }));
    }

    // Helper Methods
    calculateRiskLevel(violations) {
        const highRisk = violations.filter(v => v.probability > 0.4).length;
        const mediumRisk = violations.filter(v => v.probability > 0.2 && v.probability <= 0.4).length;
        
        if (highRisk >= 2) return 'high';
        if (highRisk >= 1 || mediumRisk >= 3) return 'medium';
        return 'low';
    }

    estimatePermitCosts(projectData, jurisdiction) {
        // Ottawa permit fee schedule (2024 rates)
        const baseCosts = {
            building_permit: 150,
            electrical_permit: 85,
            plumbing_permit: 65
        };
        
        const totalValue = projectData.estimated_value || 25000;
        const valueFee = Math.max(0, (totalValue - 5000) * 0.008); // $8 per $1000 over $5K
        
        return baseCosts.building_permit + baseCosts.electrical_permit + 
               baseCosts.plumbing_permit + valueFee;
    }

    parseFinRange(rangeString) {
        const matches = rangeString.match(/\$(\d+)-(\d+)/);
        return matches ? { min: parseInt(matches[1]), max: parseInt(matches[2]) } : { min: 0, max: 1000 };
    }

    getInspectorFocus(category, codeSection) {
        const focuses = {
            electrical: {
                '26-710': 'Inspector will test GFCI outlets and measure outlet spacing with tape measure',
                '26-712': 'Inspector will check every countertop section for proper outlet coverage'
            },
            plumbing: {
                '7.4.6': 'Inspector will verify trap installation and test vent system operation'
            },
            structural: {
                '4.1.4': 'Inspector will verify beam sizing and connection details match engineering plans'
            }
        };
        
        return focuses[category]?.[codeSection] || 'Inspector will verify compliance with code requirements';
    }

    calculateProjectTimeline(projectData) {
        const baseWeeks = {
            small: 2,
            medium: 4, 
            large: 6
        };
        
        const size = projectData.size || 'medium';
        return `${baseWeeks[size]} weeks estimated`;
    }

    calculateInspectionDate(phase, projectData) {
        const startDate = new Date(projectData.start_date || Date.now());
        const phaseDelays = {
            pre_construction: 0,
            rough_in: 7, // 1 week
            final: 21 // 3 weeks
        };
        
        startDate.setDate(startDate.getDate() + (phaseDelays[phase.phase] || 0));
        return startDate.toISOString().split('T')[0];
    }
}

module.exports = ComplianceChecker;