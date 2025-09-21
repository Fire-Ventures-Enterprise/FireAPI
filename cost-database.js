// FireBuildAI Cost Database and Regional Pricing Engine
// Handles construction cost data, regional adjustments, and pricing intelligence

class CostDatabase {
    constructor() {
        this.baseCosts = this.initializeBaseCosts();
        this.regionalMultipliers = this.initializeRegionalData();
        this.materialCosts = this.initializeMaterialCosts();
        this.laborRates = this.initializeLaborRates();
    }

    /**
     * Initialize the cost database
     */
    async initialize() {
        console.log('🔧 Initializing Cost Database...');
        return true;
    }

    /**
     * Initialize base construction costs (national averages)
     */
    initializeBaseCosts() {
        return {
            // Foundation & Structural (per sqft)
            'foundation-excavation': { labor: 2.50, materials: 1.25, equipment: 3.75, unit: 'sqft' },
            'foundation-concrete': { labor: 4.50, materials: 8.25, equipment: 1.50, unit: 'sqft' },
            'foundation-waterproofing': { labor: 2.25, materials: 3.50, equipment: 0.75, unit: 'sqft' },
            'floor-framing': { labor: 3.75, materials: 6.50, equipment: 0.50, unit: 'sqft' },
            'wall-framing': { labor: 4.25, materials: 5.75, equipment: 0.75, unit: 'sqft' },
            'roof-framing': { labor: 5.50, materials: 7.25, equipment: 1.25, unit: 'sqft' },

            // Exterior Systems
            'roofing-asphalt': { labor: 3.25, materials: 4.75, equipment: 0.50, unit: 'sqft' },
            'roofing-metal': { labor: 4.75, materials: 8.50, equipment: 0.75, unit: 'sqft' },
            'siding-vinyl': { labor: 2.75, materials: 3.25, equipment: 0.25, unit: 'sqft' },
            'siding-fiber-cement': { labor: 4.25, materials: 5.75, equipment: 0.50, unit: 'sqft' },
            'windows-standard': { labor: 125, materials: 350, equipment: 25, unit: 'each' },
            'windows-premium': { labor: 175, materials: 650, equipment: 35, unit: 'each' },
            'doors-exterior': { labor: 185, materials: 450, equipment: 15, unit: 'each' },

            // Mechanical Systems (per sqft)
            'electrical-rough': { labor: 2.75, materials: 2.25, equipment: 0.25, unit: 'sqft' },
            'electrical-finish': { labor: 1.85, materials: 1.50, equipment: 0.15, unit: 'sqft' },
            'plumbing-rough': { labor: 3.25, materials: 2.75, equipment: 0.50, unit: 'sqft' },
            'plumbing-finish': { labor: 2.50, materials: 3.50, equipment: 0.25, unit: 'sqft' },
            'hvac-ductwork': { labor: 2.85, materials: 3.75, equipment: 0.65, unit: 'sqft' },
            'hvac-equipment': { labor: 1.25, materials: 4.50, equipment: 0.75, unit: 'sqft' },

            // Interior Finishes
            'insulation-fiberglass': { labor: 0.85, materials: 1.25, equipment: 0.10, unit: 'sqft' },
            'insulation-spray-foam': { labor: 1.45, materials: 2.75, equipment: 0.35, unit: 'sqft' },
            'drywall-standard': { labor: 1.75, materials: 1.25, equipment: 0.25, unit: 'sqft' },
            'drywall-fire-rated': { labor: 2.25, materials: 2.15, equipment: 0.35, unit: 'sqft' },
            'flooring-hardwood': { labor: 3.50, materials: 8.75, equipment: 0.25, unit: 'sqft' },
            'flooring-lvp': { labor: 2.25, materials: 4.50, equipment: 0.15, unit: 'sqft' },
            'flooring-tile': { labor: 4.25, materials: 6.50, equipment: 0.75, unit: 'sqft' },
            'painting-interior': { labor: 1.25, materials: 0.65, equipment: 0.15, unit: 'sqft' },
            'trim-baseboard': { labor: 2.50, materials: 1.75, equipment: 0.15, unit: 'lf' },
            'trim-casing': { labor: 3.25, materials: 2.25, equipment: 0.25, unit: 'lf' },

            // Bathroom Fixtures & Features
            'bathroom-vanity-basic': { labor: 125, materials: 450, equipment: 25, unit: 'each' },
            'bathroom-vanity-premium': { labor: 185, materials: 850, unit: 'each' },
            'toilet-standard': { labor: 85, materials: 275, equipment: 15, unit: 'each' },
            'toilet-premium': { labor: 125, materials: 550, equipment: 25, unit: 'each' },
            'shower-standard': { labor: 450, materials: 750, equipment: 85, unit: 'each' },
            'shower-premium': { labor: 750, materials: 1450, equipment: 125, unit: 'each' },
            'bathtub-standard': { labor: 325, materials: 650, equipment: 75, unit: 'each' },
            'bathtub-soaker': { labor: 485, materials: 1250, equipment: 125, unit: 'each' },

            // Kitchen Features
            'kitchen-cabinet-basic': { labor: 85, materials: 125, equipment: 15, unit: 'lf' },
            'kitchen-cabinet-premium': { labor: 125, materials: 285, equipment: 25, unit: 'lf' },
            'countertop-laminate': { labor: 15, materials: 25, equipment: 5, unit: 'sqft' },
            'countertop-granite': { labor: 35, materials: 65, equipment: 15, unit: 'sqft' },
            'countertop-quartz': { labor: 45, materials: 85, equipment: 20, unit: 'sqft' },

            // Permits & Inspections
            'permit-building-basic': { labor: 0, materials: 0, equipment: 0, permits: 850, unit: 'project' },
            'permit-building-addition': { labor: 0, materials: 0, equipment: 0, permits: 1450, unit: 'project' },
            'permit-electrical': { labor: 0, materials: 0, equipment: 0, permits: 275, unit: 'project' },
            'permit-plumbing': { labor: 0, materials: 0, equipment: 0, permits: 225, unit: 'project' },
            'inspection-framing': { labor: 0, materials: 0, equipment: 0, permits: 185, unit: 'each' },
            'inspection-rough': { labor: 0, materials: 0, equipment: 0, permits: 225, unit: 'each' },
            'inspection-final': { labor: 0, materials: 0, equipment: 0, permits: 275, unit: 'each' }
        };
    }

    /**
     * Initialize regional pricing multipliers
     */
    initializeRegionalData() {
        return {
            // Major US Markets
            'CA-SF-bay-area': {
                name: 'San Francisco Bay Area, CA',
                laborMultiplier: 1.85,
                materialMultiplier: 1.25,
                permitMultiplier: 2.15,
                averageLaborRate: 95,
                marketFactors: ['Very high cost of living', 'Strong union presence', 'Complex permitting'],
                dataSource: 'RSMeans 2024, CA Dept of Industrial Relations'
            },
            'CA-los-angeles': {
                name: 'Los Angeles County, CA',
                laborMultiplier: 1.65,
                materialMultiplier: 1.18,
                permitMultiplier: 1.85,
                averageLaborRate: 85,
                marketFactors: ['High cost of living', 'Union market', 'Seismic requirements'],
                dataSource: 'RSMeans 2024, Los Angeles Building Dept'
            },
            'NY-new-york-city': {
                name: 'New York City, NY',
                laborMultiplier: 1.75,
                materialMultiplier: 1.35,
                permitMultiplier: 2.45,
                averageLaborRate: 92,
                marketFactors: ['Very high labor costs', 'Complex regulations', 'Limited access'],
                dataSource: 'NYC Department of Buildings, RSMeans 2024'
            },
            'TX-dallas-fort-worth': {
                name: 'Dallas-Fort Worth, TX',
                laborMultiplier: 0.92,
                materialMultiplier: 0.96,
                permitMultiplier: 0.85,
                averageLaborRate: 58,
                marketFactors: ['Business-friendly environment', 'Growing market', 'Competitive pricing'],
                dataSource: 'Texas Construction Industry, RSMeans 2024'
            },
            'FL-miami-dade': {
                name: 'Miami-Dade County, FL',
                laborMultiplier: 1.15,
                materialMultiplier: 1.08,
                permitMultiplier: 1.25,
                averageLaborRate: 65,
                marketFactors: ['Hurricane building codes', 'International market', 'Tourism economy'],
                dataSource: 'Florida Construction Industry, Miami-Dade Building Dept'
            },
            'WA-seattle': {
                name: 'Seattle Metro, WA',
                laborMultiplier: 1.45,
                materialMultiplier: 1.15,
                permitMultiplier: 1.65,
                averageLaborRate: 78,
                marketFactors: ['High tech economy', 'Environmental regulations', 'Union presence'],
                dataSource: 'Washington State Dept of Commerce, Seattle DCI'
            },
            'IL-chicago': {
                name: 'Chicago Metro, IL',
                laborMultiplier: 1.25,
                materialMultiplier: 1.05,
                permitMultiplier: 1.35,
                averageLaborRate: 72,
                marketFactors: ['Strong union presence', 'Weather challenges', 'Established market'],
                dataSource: 'Illinois Construction Industry, City of Chicago'
            },

            // Canadian Markets
            'ON-toronto': {
                name: 'Toronto, Ontario',
                laborMultiplier: 1.55,
                materialMultiplier: 1.28,
                permitMultiplier: 1.45,
                averageLaborRate: 68,
                marketFactors: ['Major metropolitan market', 'Provincial building code', 'High cost of living'],
                dataSource: 'Statistics Canada, Ontario Construction Secretariat'
            },
            'BC-vancouver': {
                name: 'Vancouver, BC',
                laborMultiplier: 1.65,
                materialMultiplier: 1.35,
                permitMultiplier: 1.55,
                averageLaborRate: 75,
                marketFactors: ['Very high cost of living', 'Seismic building requirements', 'International market'],
                dataSource: 'BC Construction Association, City of Vancouver'
            },
            'AB-calgary': {
                name: 'Calgary, Alberta',
                laborMultiplier: 1.25,
                materialMultiplier: 1.15,
                permitMultiplier: 1.15,
                averageLaborRate: 68,
                marketFactors: ['Energy sector influence', 'Extreme weather considerations', 'Growing market'],
                dataSource: 'Alberta Construction Association, City of Calgary'
            },

            // National Averages
            'US-national-average': {
                name: 'United States National Average',
                laborMultiplier: 1.00,
                materialMultiplier: 1.00,
                permitMultiplier: 1.00,
                averageLaborRate: 58,
                marketFactors: ['Baseline reference market', 'Composite of all US regions'],
                dataSource: 'U.S. Bureau of Labor Statistics, RSMeans 2024'
            },
            'CA-national-average': {
                name: 'Canada National Average',
                laborMultiplier: 1.15,
                materialMultiplier: 1.12,
                permitMultiplier: 1.08,
                averageLaborRate: 62,
                marketFactors: ['Baseline reference market', 'Composite of all Canadian provinces'],
                dataSource: 'Statistics Canada, Canadian Construction Association'
            }
        };
    }

    /**
     * Initialize current material costs
     */
    initializeMaterialCosts() {
        return {
            // Lumber (per board foot)
            'lumber-2x4-spf': { price: 0.85, unit: 'bf', volatility: 'high' },
            'lumber-2x6-spf': { price: 1.25, unit: 'bf', volatility: 'high' },
            'lumber-2x8-spf': { price: 2.15, unit: 'bf', volatility: 'high' },
            'lumber-plywood-3/4': { price: 65, unit: 'sheet', volatility: 'high' },
            'lumber-osb-7/16': { price: 28, unit: 'sheet', volatility: 'high' },

            // Concrete & Masonry
            'concrete-ready-mix': { price: 125, unit: 'cubic_yard', volatility: 'medium' },
            'concrete-rebar': { price: 0.85, unit: 'pound', volatility: 'medium' },
            'masonry-block-8inch': { price: 2.25, unit: 'each', volatility: 'low' },

            // Electrical Materials
            'electrical-wire-12awg': { price: 0.65, unit: 'foot', volatility: 'medium' },
            'electrical-wire-14awg': { price: 0.45, unit: 'foot', volatility: 'medium' },
            'electrical-outlet-standard': { price: 3.25, unit: 'each', volatility: 'low' },
            'electrical-switch-standard': { price: 2.85, unit: 'each', volatility: 'low' },
            'electrical-panel-200amp': { price: 485, unit: 'each', volatility: 'medium' },

            // Plumbing Materials
            'plumbing-pex-1/2inch': { price: 0.85, unit: 'foot', volatility: 'medium' },
            'plumbing-pex-3/4inch': { price: 1.25, unit: 'foot', volatility: 'medium' },
            'plumbing-pvc-4inch': { price: 4.50, unit: 'foot', volatility: 'low' },
            'plumbing-copper-3/4inch': { price: 3.85, unit: 'foot', volatility: 'high' },

            // HVAC Materials
            'hvac-ductwork-rectangular': { price: 12.50, unit: 'sqft', volatility: 'medium' },
            'hvac-ductwork-round': { price: 8.25, unit: 'foot', volatility: 'medium' },
            'hvac-unit-3ton': { price: 2450, unit: 'each', volatility: 'medium' },

            // Insulation
            'insulation-fiberglass-r13': { price: 0.85, unit: 'sqft', volatility: 'low' },
            'insulation-fiberglass-r19': { price: 1.15, unit: 'sqft', volatility: 'low' },
            'insulation-spray-foam': { price: 2.25, unit: 'sqft', volatility: 'medium' },

            // Drywall & Finishes
            'drywall-1/2inch-standard': { price: 14.50, unit: 'sheet', volatility: 'low' },
            'drywall-5/8inch-fire-rated': { price: 18.75, unit: 'sheet', volatility: 'low' },
            'paint-primer-interior': { price: 48, unit: 'gallon', volatility: 'low' },
            'paint-latex-interior': { price: 52, unit: 'gallon', volatility: 'low' },

            // Flooring
            'flooring-hardwood-oak': { price: 6.85, unit: 'sqft', volatility: 'medium' },
            'flooring-lvp-premium': { price: 3.25, unit: 'sqft', volatility: 'low' },
            'flooring-tile-ceramic': { price: 4.50, unit: 'sqft', volatility: 'low' },
            'flooring-carpet-medium': { price: 2.85, unit: 'sqft', volatility: 'low' }
        };
    }

    /**
     * Initialize labor rates by trade
     */
    initializeLaborRates() {
        return {
            'general-laborer': { hourlyRate: 22, skill: 'basic' },
            'carpenter-framing': { hourlyRate: 32, skill: 'skilled' },
            'carpenter-finish': { hourlyRate: 38, skill: 'skilled' },
            'electrician': { hourlyRate: 42, skill: 'specialized' },
            'plumber': { hourlyRate: 45, skill: 'specialized' },
            'hvac-technician': { hourlyRate: 40, skill: 'specialized' },
            'roofer': { hourlyRate: 28, skill: 'skilled' },
            'drywall-hanger': { hourlyRate: 25, skill: 'skilled' },
            'painter': { hourlyRate: 24, skill: 'skilled' },
            'flooring-installer': { hourlyRate: 30, skill: 'skilled' },
            'tile-setter': { hourlyRate: 35, skill: 'skilled' },
            'project-manager': { hourlyRate: 65, skill: 'management' },
            'building-inspector': { hourlyRate: 85, skill: 'specialized' }
        };
    }

    /**
     * Get cost estimate for a specific construction item
     */
    getCostEstimate(itemType, quantity, region = 'US-national-average') {
        const baseCost = this.baseCosts[itemType];
        if (!baseCost) {
            throw new Error(`Cost data not found for item type: ${itemType}`);
        }

        const regionalData = this.regionalMultipliers[region];
        if (!regionalData) {
            throw new Error(`Regional data not found for region: ${region}`);
        }

        const adjustedCost = {
            labor: (baseCost.labor || 0) * regionalData.laborMultiplier * quantity,
            materials: (baseCost.materials || 0) * regionalData.materialMultiplier * quantity,
            equipment: (baseCost.equipment || 0) * quantity,
            permits: (baseCost.permits || 0) * regionalData.permitMultiplier * quantity
        };

        const subtotal = adjustedCost.labor + adjustedCost.materials + adjustedCost.equipment + adjustedCost.permits;

        return {
            itemType,
            quantity,
            unit: baseCost.unit,
            region: regionalData.name,
            costs: adjustedCost,
            subtotal,
            baseCostUsed: baseCost,
            regionalMultipliers: {
                labor: regionalData.laborMultiplier,
                materials: regionalData.materialMultiplier,
                permits: regionalData.permitMultiplier
            }
        };
    }

    /**
     * Calculate total project cost with overhead and profit
     */
    calculateProjectTotal(itemCosts, overheadRate = 0.15, profitRate = 0.10) {
        const subtotal = itemCosts.reduce((sum, item) => sum + item.subtotal, 0);
        const overhead = subtotal * overheadRate;
        const profit = (subtotal + overhead) * profitRate;
        const total = subtotal + overhead + profit;

        return {
            itemsSubtotal: subtotal,
            overhead: overhead,
            profit: profit,
            total: total,
            breakdown: {
                labor: itemCosts.reduce((sum, item) => sum + item.costs.labor, 0),
                materials: itemCosts.reduce((sum, item) => sum + item.costs.materials, 0),
                equipment: itemCosts.reduce((sum, item) => sum + item.costs.equipment, 0),
                permits: itemCosts.reduce((sum, item) => sum + item.costs.permits, 0)
            }
        };
    }

    /**
     * Get regional market information
     */
    getRegionalInfo(region) {
        return this.regionalMultipliers[region];
    }

    /**
     * Get all available regions
     */
    getAvailableRegions() {
        return Object.keys(this.regionalMultipliers).map(key => ({
            id: key,
            name: this.regionalMultipliers[key].name,
            laborRate: this.regionalMultipliers[key].averageLaborRate
        }));
    }

    /**
     * Get current material prices with volatility information
     */
    getMaterialPrices(materialTypes = null) {
        if (materialTypes) {
            const filtered = {};
            materialTypes.forEach(type => {
                if (this.materialCosts[type]) {
                    filtered[type] = this.materialCosts[type];
                }
            });
            return filtered;
        }
        return this.materialCosts;
    }

    /**
     * Get labor rates by trade
     */
    getLaborRates(trades = null) {
        if (trades) {
            const filtered = {};
            trades.forEach(trade => {
                if (this.laborRates[trade]) {
                    filtered[trade] = this.laborRates[trade];
                }
            });
            return filtered;
        }
        return this.laborRates;
    }

    /**
     * Update cost data (for real-time pricing integration)
     */
    updateCosts(updates) {
        if (updates.materials) {
            Object.assign(this.materialCosts, updates.materials);
        }
        if (updates.labor) {
            Object.assign(this.laborRates, updates.labor);
        }
        if (updates.baseCosts) {
            Object.assign(this.baseCosts, updates.baseCosts);
        }
        
        return {
            success: true,
            timestamp: new Date().toISOString(),
            updatedCategories: Object.keys(updates)
        };
    }
}

module.exports = CostDatabase;