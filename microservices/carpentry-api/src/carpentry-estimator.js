/**
 * 🔨 Carpentry Estimator Engine
 * Core estimation logic for carpentry work
 */

class CarpentryEstimator {
    constructor(templates) {
        this.templates = templates;
    }

    /**
     * 🏠 Kitchen Cabinet Estimation
     */
    async estimateCabinets(request) {
        const { project, trade_scope } = request;
        const template = this.templates.kitchen_cabinets;
        
        if (!template) {
            throw new Error('Kitchen cabinet template not found');
        }

        // Extract cabinet requirements
        const cabinetScope = this.parseCabinetScope(trade_scope);
        
        // Calculate linear footage
        const linearFootage = this.calculateLinearFootage(project.size, cabinetScope);
        
        // Generate phases and tasks
        const phases = this.generateCabinetPhases(template, linearFootage, cabinetScope);
        
        // Calculate costs
        const costs = this.calculateCabinetCosts(phases, project.quality_tier, linearFootage);
        
        return {
            phases: phases,
            totalHours: costs.totalHours,
            laborCost: costs.laborCost,
            materialCost: costs.materialCost,
            timelineDays: Math.ceil(costs.totalHours / 8), // 8 hours per day
            confidence: 0.92,
            complications: this.getCabinetComplications(),
            linearFootage: linearFootage
        };
    }

    parseCabinetScope(tradeScope) {
        const requirements = tradeScope.specific_requirements || [];
        
        return {
            upperCabinets: requirements.includes('upper_cabinets'),
            lowerCabinets: requirements.includes('lower_cabinets'),
            island: requirements.includes('island'),
            pantry: requirements.includes('pantry'),
            crownMolding: requirements.includes('crown_molding'),
            softClose: requirements.includes('soft_close_hardware'),
            customFeatures: requirements.filter(req => req.includes('custom'))
        };
    }

    calculateLinearFootage(kitchenSize, cabinetScope) {
        const baseSizes = {
            small: { base: 12, upper: 10 },
            medium: { base: 18, upper: 15 },
            large: { base: 25, upper: 20 },
            xl: { base: 32, upper: 25 }
        };

        const base = baseSizes[kitchenSize] || baseSizes.medium;
        let totalLinearFeet = 0;

        if (cabinetScope.lowerCabinets) totalLinearFeet += base.base;
        if (cabinetScope.upperCabinets) totalLinearFeet += base.upper;
        if (cabinetScope.island) totalLinearFeet += 8;
        if (cabinetScope.pantry) totalLinearFeet += 4;

        return totalLinearFeet;
    }

    generateCabinetPhases(template, linearFootage, cabinetScope) {
        const phases = [];

        // Phase 1: Demolition (if existing cabinets)
        phases.push({
            phase: 'Cabinet Demolition',
            tasks: [
                {
                    task: 'Remove existing upper cabinets',
                    hours: Math.ceil(linearFootage * 0.3),
                    materials: []
                },
                {
                    task: 'Remove existing lower cabinets', 
                    hours: Math.ceil(linearFootage * 0.4),
                    materials: []
                }
            ]
        });

        // Phase 2: Installation
        phases.push({
            phase: 'Cabinet Installation',
            tasks: [
                {
                    task: 'Install upper cabinets',
                    hours: Math.ceil(linearFootage * 0.8),
                    materials: this.generateCabinetMaterials('upper', linearFootage, cabinetScope)
                },
                {
                    task: 'Install lower cabinets',
                    hours: Math.ceil(linearFootage * 1.0),
                    materials: this.generateCabinetMaterials('lower', linearFootage, cabinetScope)
                },
                {
                    task: 'Install cabinet hardware',
                    hours: Math.ceil(linearFootage * 0.3),
                    materials: this.generateHardwareMaterials(linearFootage, cabinetScope)
                }
            ]
        });

        // Phase 3: Finishing
        if (cabinetScope.crownMolding) {
            phases.push({
                phase: 'Crown Molding Installation',
                tasks: [{
                    task: 'Install crown molding',
                    hours: Math.ceil(linearFootage * 0.4),
                    materials: this.generateMoldingMaterials(linearFootage)
                }]
            });
        }

        return phases;
    }

    generateCabinetMaterials(type, linearFootage, cabinetScope) {
        const materials = [];
        
        // Base cabinet materials - NO PRICING DATA
        if (type === 'lower') {
            materials.push({
                item: 'Base Cabinet Boxes',
                quantity: Math.ceil(linearFootage / 3), // 3 feet per cabinet average
                unit: 'each',
                category: 'cabinetry',
                specification: 'Standard base cabinet box with adjustable shelves',
                pricing_required: true
            });
        } else if (type === 'upper') {
            materials.push({
                item: 'Upper Cabinet Boxes',
                quantity: Math.ceil(linearFootage / 2.5), // 2.5 feet per cabinet average  
                unit: 'each',
                category: 'cabinetry',
                specification: 'Standard upper cabinet box with adjustable shelves',
                pricing_required: true
            });
        }

        // Cabinet doors and faces - NO PRICING DATA
        materials.push({
            item: `${type === 'upper' ? 'Upper' : 'Base'} Cabinet Doors`,
            quantity: Math.ceil(linearFootage * 1.2), // More doors than linear feet
            unit: 'each',
            category: 'cabinetry',
            specification: `${type === 'upper' ? 'Upper' : 'Base'} cabinet doors with hinges`,
            pricing_required: true
        });

        return materials;
    }

    generateHardwareMaterials(linearFootage, cabinetScope) {
        const totalDoors = Math.ceil(linearFootage * 1.5);
        
        return [
            {
                item: 'Cabinet Hinges',
                quantity: totalDoors * 2,
                unit: 'each',
                category: 'hardware',
                specification: cabinetScope.softClose ? 'Soft-close cabinet hinges' : 'Standard cabinet hinges',
                pricing_required: true
            },
            {
                item: 'Cabinet Pulls/Knobs',
                quantity: totalDoors + Math.ceil(linearFootage * 0.5), // Drawers
                unit: 'each',
                category: 'hardware',
                specification: 'Cabinet door handles and drawer pulls',
                pricing_required: true
            }
        ];
    }

    generateMoldingMaterials(linearFootage) {
        return [
            {
                item: 'Crown Molding',
                quantity: Math.ceil(linearFootage * 1.15), // Include 15% waste factor in quantity
                unit: 'linear_foot',
                category: 'trim',
                specification: 'Kitchen crown molding with appropriate profile',
                pricing_required: true
            },
            {
                item: 'Molding Installation Hardware',
                quantity: 1,
                unit: 'lot',
                category: 'fasteners',
                specification: 'Crown molding nails, screws, and mounting hardware',
                pricing_required: true
            }
        ];
    }

    calculateCabinetCosts(phases, qualityTier, linearFootage) {
        let totalHours = 0;
        const materialList = [];

        // Sum up all labor hours and collect materials
        phases.forEach(phase => {
            phase.tasks.forEach(task => {
                totalHours += task.hours || 0;
                task.materials.forEach(material => {
                    materialList.push(material);
                });
            });
        });

        // NO PRICING CALCULATIONS - Return structure for external pricing
        return {
            totalHours,
            materials: materialList,
            qualityTier: qualityTier,
            laborHoursBreakdown: this.getLaborBreakdown(phases),
            pricingRequired: true,
            note: 'Material and labor costs require external pricing service integration'
        };
    }

    getCabinetComplications() {
        return [
            {
                issue: 'Walls not plumb or square',
                likelihood: 'high',
                additional_hours: 4,
                additional_cost: 300
            },
            {
                issue: 'Electrical/plumbing conflicts',
                likelihood: 'medium',
                additional_hours: 2,
                additional_cost: 150
            },
            {
                issue: 'Cabinet damage during delivery',
                likelihood: 'low',
                additional_hours: 0,
                additional_cost: 500
            }
        ];
    }

    /**
     * 🎨 Trim Installation Estimation
     */
    async estimateTrim(request) {
        return {
            phases: [{
                phase: 'Trim Installation',
                tasks: [{
                    task: 'Install baseboards and casing',
                    hours: 12,
                    materials: [
                        {
                            item: 'Baseboard Trim',
                            quantity: 50, // Example linear feet
                            unit: 'linear_foot',
                            category: 'trim',
                            specification: 'Interior baseboard trim',
                            pricing_required: true
                        }
                    ]
                }]
            }],
            totalHours: 12,
            timelineDays: 2,
            pricingRequired: true,
            note: 'Labor rates and material costs require external pricing service'
        };
    }

    /**
     * 🏗️ Framing Estimation
     */
    async estimateFraming(request) {
        return {
            phases: [{
                phase: 'Framing',
                tasks: [{
                    task: 'Frame walls and openings',
                    hours: 16,
                    materials: [
                        {
                            item: 'Dimensional Lumber 2x4',
                            quantity: 20, // Example pieces
                            unit: 'each',
                            category: 'lumber',
                            specification: 'Structural grade 2x4 lumber',
                            pricing_required: true
                        }
                    ]
                }]
            }],
            totalHours: 16,
            timelineDays: 2,
            pricingRequired: true,
            note: 'Labor rates and material costs require external pricing service'
        };
    }

    /**
     * 🚪 Door Installation Estimation
     */
    async estimateDoors(request) {
        return {
            phases: [{
                phase: 'Door Installation',
                tasks: [{
                    task: 'Install interior doors',
                    hours: 8,
                    materials: [
                        {
                            item: 'Interior Door',
                            quantity: 3, // Example doors
                            unit: 'each',
                            category: 'doors',
                            specification: 'Standard interior door with frame and hardware',
                            pricing_required: true
                        }
                    ]
                }]
            }],
            totalHours: 8,
            timelineDays: 1,
            pricingRequired: true,
            note: 'Labor rates and material costs require external pricing service'
        };
    }

    /**
     * 🔧 Mixed Carpentry Work
     */
    async estimateMixedCarpentry(request) {
        // For projects involving multiple carpentry types
        const estimates = [];
        
        if (request.trade_scope.specific_requirements.some(req => req.includes('cabinet'))) {
            estimates.push(await this.estimateCabinets(request));
        }
        
        if (request.trade_scope.specific_requirements.some(req => req.includes('trim'))) {
            estimates.push(await this.estimateTrim(request));
        }

        // Combine estimates
        return this.combineEstimates(estimates);
    }

    combineEstimates(estimates) {
        const combined = {
            phases: [],
            totalHours: 0,
            laborCost: 0,
            materialCost: 0,
            timelineDays: 0,
            confidence: 0
        };

        estimates.forEach(estimate => {
            combined.phases.push(...estimate.phases);
            combined.totalHours += estimate.totalHours;
            combined.laborCost += estimate.laborCost;
            combined.materialCost += estimate.materialCost;
            combined.timelineDays = Math.max(combined.timelineDays, estimate.timelineDays);
        });

        // Average confidence
        combined.confidence = estimates.reduce((sum, est) => sum + est.confidence, 0) / estimates.length;

        return combined;
    }

    calculateMaterials(request) {
        // Utility method for material calculations
        return {
            lumber: this.calculateLumber(request),
            hardware: this.calculateHardware(request),
            fasteners: this.calculateFasteners(request)
        };
    }

    calculateLumber(request) {
        // Lumber calculation logic
        return [];
    }

    calculateHardware(request) {
        // Hardware calculation logic
        return [];
    }

    calculateFasteners(request) {
        // Fastener calculation logic
        return [];
    }

    getLaborBreakdown(phases) {
        const breakdown = {};
        phases.forEach(phase => {
            phase.tasks.forEach(task => {
                breakdown[task.task] = task.hours || 0;
            });
        });
        return breakdown;
    }
}

module.exports = CarpentryEstimator;