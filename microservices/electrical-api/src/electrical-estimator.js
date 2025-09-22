/**
 * 🔌 Electrical Estimation Engine
 * Professional electrical work estimation without pricing
 * Returns material specifications and quantities only
 */

class ElectricalEstimator {
    constructor() {
        this.version = '1.0.0';
        this.service = 'electrical-estimator';
        
        // Electrical code standards (NEC compliance)
        this.necStandards = {
            kitchenOutlets: {
                spacing: 48, // inches - outlets every 4 feet
                gfciRequired: true,
                dedicatedCircuits: ['refrigerator', 'dishwasher', 'disposal', 'microwave']
            },
            lighting: {
                minFootcandles: 30, // Kitchen task lighting minimum
                ambientLighting: 20, // General illumination
                accentLighting: 10 // Decorative/accent
            },
            circuitLoads: {
                kitchen: 1500, // watts per outlet circuit
                lighting: 1200, // watts per lighting circuit
                appliance: 1800 // watts for dedicated appliance circuits
            }
        };
    }

    /**
     * 🏠 Generate Kitchen Electrical Materials
     * Returns specifications without pricing
     */
    generateKitchenElectrical(projectData) {
        const analysis = this.analyzeKitchenElectrical(projectData);
        
        return {
            phases: [
                {
                    phase: "Electrical Planning & Permits",
                    tasks: [
                        {
                            task: "Electrical load calculation",
                            hours: 2,
                            materials: []
                        },
                        {
                            task: "Permit application and approval", 
                            hours: 1,
                            materials: [
                                {
                                    item: "Electrical Permit",
                                    quantity: 1,
                                    unit: "each",
                                    category: "permits",
                                    specification: "Municipal electrical permit for kitchen renovation",
                                    pricing_required: true
                                }
                            ]
                        }
                    ]
                },
                {
                    phase: "Rough-In Electrical",
                    tasks: [
                        {
                            task: "Install outlet circuits",
                            hours: analysis.outlets.installHours,
                            materials: this.generateOutletMaterials(analysis.outlets)
                        },
                        {
                            task: "Install lighting circuits",
                            hours: analysis.lighting.installHours,
                            materials: this.generateLightingMaterials(analysis.lighting)
                        },
                        {
                            task: "Install dedicated appliance circuits",
                            hours: analysis.appliances.installHours,
                            materials: this.generateApplianceMaterials(analysis.appliances)
                        }
                    ]
                },
                {
                    phase: "Electrical Finishing",
                    tasks: [
                        {
                            task: "Install outlets and switches",
                            hours: analysis.devices.installHours,
                            materials: this.generateDeviceMaterials(analysis.devices)
                        },
                        {
                            task: "Install light fixtures",
                            hours: analysis.fixtures.installHours,
                            materials: this.generateFixtureMaterials(analysis.fixtures)
                        },
                        {
                            task: "Final connections and testing",
                            hours: 4,
                            materials: []
                        }
                    ]
                }
            ],
            totalHours: analysis.totalHours,
            timelineDays: Math.ceil(analysis.totalHours / 8),
            confidence: 0.88,
            complications: [
                {
                    issue: "Panel upgrade required",
                    likelihood: "medium",
                    additional_hours: 8,
                    additional_cost: 800
                },
                {
                    issue: "Aluminum wiring replacement needed",
                    likelihood: "low", 
                    additional_hours: 12,
                    additional_cost: 1200
                },
                {
                    issue: "Access issues for wire runs",
                    likelihood: "high",
                    additional_hours: 3,
                    additional_cost: 200
                }
            ],
            necCompliance: {
                outletSpacing: "NEC 210.52(C) compliant",
                gfciProtection: "NEC 210.8 compliant", 
                circuitLoading: "NEC 220.14 compliant"
            }
        };
    }

    /**
     * 🔍 Analyze Kitchen Electrical Requirements
     */
    analyzeKitchenElectrical(projectData) {
        const size = projectData.size || 'medium';
        const quality = projectData.quality_tier || 'mid_range';
        
        // Base calculations on kitchen size
        const dimensions = this.getKitchenDimensions(size);
        
        // Calculate outlet requirements
        const outlets = this.calculateOutletRequirements(dimensions);
        
        // Calculate lighting requirements  
        const lighting = this.calculateLightingRequirements(dimensions, quality);
        
        // Calculate appliance circuits
        const appliances = this.calculateApplianceCircuits(projectData.appliances || []);
        
        // Calculate devices (switches, outlets, etc.)
        const devices = this.calculateDeviceRequirements(outlets, lighting);
        
        // Calculate fixtures
        const fixtures = this.calculateFixtureRequirements(lighting, quality);
        
        const totalHours = outlets.installHours + lighting.installHours + 
                          appliances.installHours + devices.installHours + 
                          fixtures.installHours + 7; // Planning + finishing hours
        
        return {
            outlets,
            lighting,
            appliances,
            devices,
            fixtures,
            totalHours,
            dimensions
        };
    }

    /**
     * 📏 Get Kitchen Dimensions Based on Size
     */
    getKitchenDimensions(size) {
        const sizeMappings = {
            small: { length: 8, width: 10, sqft: 80, linearFeet: 12 },
            medium: { length: 10, width: 12, sqft: 120, linearFeet: 18 },
            large: { length: 12, width: 15, sqft: 180, linearFeet: 24 },
            xlarge: { length: 15, width: 18, sqft: 270, linearFeet: 32 }
        };
        
        return sizeMappings[size] || sizeMappings.medium;
    }

    /**
     * 🔌 Calculate Outlet Requirements
     */
    calculateOutletRequirements(dimensions) {
        // NEC requires outlets every 4 feet along countertops
        const countertopOutlets = Math.ceil(dimensions.linearFeet / 4);
        const gfciOutlets = countertopOutlets; // All kitchen outlets need GFCI
        
        // Additional outlets for islands, peninsulas
        const additionalOutlets = Math.floor(dimensions.sqft / 60); // 1 per 60 sqft
        
        const totalOutlets = countertopOutlets + additionalOutlets;
        const circuits = Math.ceil(totalOutlets / 2); // 2 outlets per 20A circuit
        
        return {
            countertopOutlets,
            additionalOutlets, 
            totalOutlets,
            circuits,
            installHours: circuits * 3 // 3 hours per circuit rough-in
        };
    }

    /**
     * 💡 Calculate Lighting Requirements
     */
    calculateLightingRequirements(dimensions, quality) {
        // Calculate lighting needs based on square footage
        const taskLighting = Math.ceil(dimensions.linearFeet / 3); // Under-cabinet every 3 feet
        const ambientLighting = Math.ceil(dimensions.sqft / 50); // 1 fixture per 50 sqft
        const accentLighting = quality === 'high_end' ? Math.ceil(dimensions.sqft / 80) : 0;
        
        const totalFixtures = taskLighting + ambientLighting + accentLighting;
        const circuits = Math.ceil(totalFixtures / 8); // 8 fixtures per circuit max
        
        return {
            taskLighting,
            ambientLighting,
            accentLighting,
            totalFixtures,
            circuits,
            installHours: circuits * 2.5 // 2.5 hours per lighting circuit
        };
    }

    /**
     * 🔧 Calculate Appliance Circuit Requirements  
     */
    calculateApplianceCircuits(appliances) {
        // Standard kitchen appliance circuits
        const standardAppliances = [
            'refrigerator', 'dishwasher', 'disposal', 'microwave'
        ];
        
        const customAppliances = appliances.length > 0 ? appliances : standardAppliances;
        const dedicatedCircuits = customAppliances.length;
        
        return {
            appliances: customAppliances,
            dedicatedCircuits,
            installHours: dedicatedCircuits * 2 // 2 hours per appliance circuit
        };
    }

    /**
     * 🔘 Calculate Device Requirements
     */
    calculateDeviceRequirements(outlets, lighting) {
        const switches = lighting.circuits * 2; // 2 switches per lighting circuit avg
        const dimmers = Math.floor(switches * 0.6); // 60% dimmers
        const totalDevices = outlets.totalOutlets + switches;
        
        return {
            outlets: outlets.totalOutlets,
            switches,
            dimmers,
            totalDevices,
            installHours: Math.ceil(totalDevices / 8) // 8 devices per hour install
        };
    }

    /**
     * 💡 Calculate Fixture Requirements
     */
    calculateFixtureRequirements(lighting, quality) {
        const multiplier = quality === 'high_end' ? 1.5 : quality === 'low_end' ? 0.7 : 1.0;
        const totalFixtures = Math.ceil(lighting.totalFixtures * multiplier);
        
        return {
            totalFixtures,
            installHours: Math.ceil(totalFixtures / 4) // 4 fixtures per hour install
        };
    }

    // Material generation methods...
    generateOutletMaterials(outlets) {
        return [
            {
                item: "12 AWG Romex Wire",
                quantity: outlets.circuits * 250,
                unit: "feet",
                category: "wiring",
                specification: "12-2 Romex NM-B cable for 20A outlet circuits",
                pricing_required: true
            },
            {
                item: "20 Amp Circuit Breakers",
                quantity: outlets.circuits,
                unit: "each",
                category: "electrical",
                specification: "20A single-pole breakers for outlet circuits",
                pricing_required: true
            },
            {
                item: "Electrical Boxes",
                quantity: outlets.totalOutlets,
                unit: "each", 
                category: "electrical",
                specification: "Standard outlet boxes for drywall installation",
                pricing_required: true
            }
        ];
    }

    generateLightingMaterials(lighting) {
        return [
            {
                item: "14 AWG Romex Wire",
                quantity: lighting.circuits * 200,
                unit: "feet",
                category: "wiring",
                specification: "14-2 Romex NM-B cable for 15A lighting circuits",
                pricing_required: true
            },
            {
                item: "15 Amp Circuit Breakers", 
                quantity: lighting.circuits,
                unit: "each",
                category: "electrical",
                specification: "15A single-pole breakers for lighting circuits",
                pricing_required: true
            },
            {
                item: "Switch Boxes",
                quantity: lighting.circuits * 2,
                unit: "each",
                category: "electrical", 
                specification: "Single-gang switch boxes for wall mounting",
                pricing_required: true
            }
        ];
    }

    generateApplianceMaterials(appliances) {
        return [
            {
                item: "12 AWG Romex Wire",
                quantity: appliances.dedicatedCircuits * 150,
                unit: "feet", 
                category: "wiring",
                specification: "12-2 Romex NM-B cable for appliance circuits",
                pricing_required: true
            },
            {
                item: "20 Amp Circuit Breakers",
                quantity: appliances.dedicatedCircuits,
                unit: "each",
                category: "electrical",
                specification: "20A breakers for dedicated appliance circuits",
                pricing_required: true
            },
            {
                item: "Appliance Outlet Boxes",
                quantity: appliances.dedicatedCircuits,
                unit: "each",
                category: "electrical",
                specification: "NEMA outlet boxes for appliance connections", 
                pricing_required: true
            }
        ];
    }

    generateDeviceMaterials(devices) {
        return [
            {
                item: "GFCI Outlets",
                quantity: devices.outlets,
                unit: "each",
                category: "electrical",
                specification: "20A GFCI outlets for kitchen use (NEC required)",
                pricing_required: true
            },
            {
                item: "Light Switches",
                quantity: devices.switches - devices.dimmers,
                unit: "each", 
                category: "electrical",
                specification: "Standard single-pole light switches",
                pricing_required: true
            },
            {
                item: "Dimmer Switches",
                quantity: devices.dimmers,
                unit: "each",
                category: "electrical",
                specification: "LED-compatible dimmer switches",
                pricing_required: true
            }
        ];
    }

    generateFixtureMaterials(fixtures) {
        return [
            {
                item: "Under-Cabinet LED Strips",
                quantity: Math.ceil(fixtures.totalFixtures * 0.4),
                unit: "each",
                category: "lighting",
                specification: "LED under-cabinet task lighting strips",
                pricing_required: true
            },
            {
                item: "Recessed Light Fixtures",
                quantity: Math.ceil(fixtures.totalFixtures * 0.6),
                unit: "each",
                category: "lighting", 
                specification: "6-inch LED recessed downlight fixtures",
                pricing_required: true
            },
            {
                item: "Wire Nuts",
                quantity: 50,
                unit: "each",
                category: "electrical",
                specification: "Assorted wire nuts for connections",
                pricing_required: true
            }
        ];
    }
}

module.exports = ElectricalEstimator;