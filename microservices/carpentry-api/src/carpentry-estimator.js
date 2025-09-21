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
        
        // Base cabinet materials
        if (type === 'lower') {
            materials.push({
                item: 'Base Cabinet Boxes',
                quantity: Math.ceil(linearFootage / 3), // 3 feet per cabinet average
                unit: 'each',
                unit_cost: 180,
                total_cost: Math.ceil(linearFootage / 3) * 180
            });
        } else if (type === 'upper') {
            materials.push({
                item: 'Upper Cabinet Boxes',
                quantity: Math.ceil(linearFootage / 2.5), // 2.5 feet per cabinet average  
                unit: 'each',
                unit_cost: 120,
                total_cost: Math.ceil(linearFootage / 2.5) * 120
            });
        }

        // Cabinet doors and faces
        materials.push({
            item: `${type === 'upper' ? 'Upper' : 'Base'} Cabinet Doors`,
            quantity: Math.ceil(linearFootage * 1.2), // More doors than linear feet
            unit: 'each',
            unit_cost: type === 'upper' ? 45 : 65,
            total_cost: Math.ceil(linearFootage * 1.2) * (type === 'upper' ? 45 : 65)
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
                unit_cost: cabinetScope.softClose ? 8 : 3.50,
                total_cost: totalDoors * 2 * (cabinetScope.softClose ? 8 : 3.50)
            },
            {
                item: 'Cabinet Pulls/Knobs',
                quantity: totalDoors + Math.ceil(linearFootage * 0.5), // Drawers
                unit: 'each', 
                unit_cost: 12,
                total_cost: (totalDoors + Math.ceil(linearFootage * 0.5)) * 12
            }
        ];
    }

    generateMoldingMaterials(linearFootage) {
        return [
            {
                item: 'Crown Molding',
                quantity: linearFootage,
                unit: 'linear_foot',
                unit_cost: 8.50,
                total_cost: linearFootage * 8.50 * 1.15 // 15% waste factor
            },
            {
                item: 'Molding Installation Hardware',
                quantity: 1,
                unit: 'lot',
                unit_cost: 45,
                total_cost: 45
            }
        ];
    }

    calculateCabinetCosts(phases, qualityTier, linearFootage) {
        let totalHours = 0;
        let materialCost = 0;

        // Sum up all labor hours and material costs
        phases.forEach(phase => {
            phase.tasks.forEach(task => {
                totalHours += task.hours || 0;
                task.materials.forEach(material => {
                    materialCost += material.total_cost || 0;
                });
            });
        });

        // Apply quality tier multiplier to materials
        const qualityMultipliers = {
            budget: 0.7,
            mid_range: 1.0,
            high_end: 1.8,
            luxury: 2.5
        };

        materialCost *= (qualityMultipliers[qualityTier] || 1.0);

        // Calculate labor cost
        const laborCost = totalHours * 65; // $65/hour for skilled carpentry

        return {
            totalHours,
            laborCost,
            materialCost,
            totalCost: laborCost + materialCost
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
        // Placeholder for trim estimation logic
        return {
            phases: [{
                phase: 'Trim Installation',
                tasks: [{
                    task: 'Install baseboards and casing',
                    hours: 12,
                    materials: []
                }]
            }],
            totalHours: 12,
            laborCost: 780,
            materialCost: 450,
            timelineDays: 2,
            confidence: 0.88
        };
    }

    /**
     * 🏗️ Framing Estimation
     */
    async estimateFraming(request) {
        // Placeholder for framing estimation logic  
        return {
            phases: [{
                phase: 'Framing',
                tasks: [{
                    task: 'Frame walls and openings',
                    hours: 16,
                    materials: []
                }]
            }],
            totalHours: 16,
            laborCost: 1040,
            materialCost: 650,
            timelineDays: 2,
            confidence: 0.85
        };
    }

    /**
     * 🚪 Door Installation Estimation
     */
    async estimateDoors(request) {
        // Placeholder for door estimation logic
        return {
            phases: [{
                phase: 'Door Installation',
                tasks: [{
                    task: 'Install interior doors',
                    hours: 8,
                    materials: []
                }]
            }],
            totalHours: 8,
            laborCost: 520,
            materialCost: 800,
            timelineDays: 1,
            confidence: 0.90
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
}

module.exports = CarpentryEstimator;