/**
 * Construction Workflow Templates and Dependencies
 * Intelligent task orchestration for construction projects
 */

const CONSTRUCTION_WORKFLOWS = {
    
    // Standard construction phase dependencies
    PHASE_DEPENDENCIES: {
        "foundation": {
            dependencies: [],
            weather_sensitive: true,
            min_temperature: -5, // Celsius
            max_wind: 25, // km/h
            no_precipitation: true,
            season_restrictions: ["freeze_protection_required"]
        },
        "framing": {
            dependencies: ["foundation"],
            weather_sensitive: true,
            min_temperature: -10,
            max_wind: 40,
            precipitation_ok: "light_rain"
        },
        "roofing": {
            dependencies: ["framing"],
            weather_sensitive: true,
            min_temperature: 5,
            max_wind: 20,
            no_precipitation: true,
            optimal_season: ["spring", "summer", "early_fall"]
        },
        "rough_electrical": {
            dependencies: ["framing"],
            weather_sensitive: false,
            requires_inspection: "rough_electrical_inspection"
        },
        "rough_plumbing": {
            dependencies: ["framing"],
            weather_sensitive: false,
            requires_inspection: "rough_plumbing_inspection"
        },
        "rough_hvac": {
            dependencies: ["framing", "rough_electrical", "rough_plumbing"],
            weather_sensitive: false,
            requires_inspection: "rough_hvac_inspection"
        },
        "insulation": {
            dependencies: ["rough_electrical", "rough_plumbing", "rough_hvac"],
            inspections_required: ["rough_electrical_passed", "rough_plumbing_passed"],
            weather_sensitive: false
        },
        "drywall": {
            dependencies: ["insulation"],
            weather_sensitive: false,
            humidity_sensitive: true,
            max_humidity: 85
        },
        "flooring": {
            dependencies: ["drywall"],
            weather_sensitive: false,
            humidity_sensitive: true,
            max_humidity: 60,
            material_acclimation_days: 3
        },
        "final_electrical": {
            dependencies: ["drywall", "flooring"],
            requires_inspection: "final_electrical_inspection"
        },
        "final_plumbing": {
            dependencies: ["drywall", "flooring"],
            requires_inspection: "final_plumbing_inspection"
        },
        "final_hvac": {
            dependencies: ["drywall", "flooring", "final_electrical"],
            requires_inspection: "final_hvac_inspection"
        },
        "final_inspection": {
            dependencies: ["final_electrical", "final_plumbing", "final_hvac"],
            required_for_occupancy: true
        }
    },

    // Room-specific workflows
    ROOM_WORKFLOWS: {
        "kitchen_renovation": {
            phases: [
                {
                    name: "demolition",
                    tasks: ["remove_cabinets", "remove_countertops", "remove_appliances"],
                    duration_days: 2,
                    debris_removal: true
                },
                {
                    name: "rough_electrical", 
                    tasks: ["install_circuits", "rough_wiring", "panel_updates"],
                    dependencies: ["demolition"],
                    duration_days: 1,
                    inspection_required: "electrical_rough"
                },
                {
                    name: "rough_plumbing",
                    tasks: ["relocate_pipes", "install_rough_plumbing", "gas_line_work"],
                    dependencies: ["demolition"],
                    duration_days: 1,
                    inspection_required: "plumbing_rough"
                },
                {
                    name: "drywall_repair",
                    tasks: ["patch_walls", "prime_paint"],
                    dependencies: ["rough_electrical", "rough_plumbing"],
                    duration_days: 2
                },
                {
                    name: "flooring",
                    tasks: ["subfloor_prep", "install_flooring"],
                    dependencies: ["drywall_repair"],
                    duration_days: 2
                },
                {
                    name: "cabinet_installation",
                    tasks: ["install_base_cabinets", "install_upper_cabinets"],
                    dependencies: ["flooring", "drywall_repair"],
                    duration_days: 2
                },
                {
                    name: "countertop_installation", 
                    tasks: ["template_counters", "install_countertops"],
                    dependencies: ["cabinet_installation"],
                    duration_days: 1,
                    lead_time_days: 14
                },
                {
                    name: "final_electrical",
                    tasks: ["install_outlets", "install_fixtures", "connect_appliances"],
                    dependencies: ["countertop_installation"],
                    duration_days: 1,
                    inspection_required: "electrical_final"
                },
                {
                    name: "final_plumbing",
                    tasks: ["connect_fixtures", "install_faucets", "test_connections"],
                    dependencies: ["countertop_installation"],
                    duration_days: 1,
                    inspection_required: "plumbing_final"
                }
            ]
        },

        "bathroom_renovation": {
            phases: [
                {
                    name: "demolition",
                    tasks: ["remove_fixtures", "remove_tile", "remove_vanity"],
                    duration_days: 1,
                    debris_removal: true
                },
                {
                    name: "rough_plumbing",
                    tasks: ["relocate_plumbing", "install_rough_plumbing", "water_test"],
                    dependencies: ["demolition"],
                    duration_days: 2,
                    inspection_required: "plumbing_rough"
                },
                {
                    name: "rough_electrical",
                    tasks: ["install_circuits", "rough_wiring", "ventilation_wiring"],
                    dependencies: ["demolition"],
                    duration_days: 1,
                    inspection_required: "electrical_rough"
                },
                {
                    name: "waterproofing",
                    tasks: ["install_membrane", "seal_corners", "moisture_barrier"],
                    dependencies: ["rough_plumbing", "rough_electrical"],
                    duration_days: 1,
                    cure_time_days: 1
                },
                {
                    name: "tiling",
                    tasks: ["install_floor_tile", "install_wall_tile", "grout_work"],
                    dependencies: ["waterproofing"],
                    duration_days: 3,
                    cure_time_days: 2
                },
                {
                    name: "fixture_installation",
                    tasks: ["install_toilet", "install_vanity", "install_shower"],
                    dependencies: ["tiling"],
                    duration_days: 2
                },
                {
                    name: "final_connections",
                    tasks: ["connect_plumbing", "connect_electrical", "final_test"],
                    dependencies: ["fixture_installation"],
                    duration_days: 1,
                    inspection_required: ["plumbing_final", "electrical_final"]
                }
            ]
        }
    },

    // Trade coordination rules
    TRADE_COORDINATION: {
        "electrical_plumbing_conflict": {
            description: "Electrical and plumbing rough-in can often be done simultaneously",
            optimization: "coordinate_same_day",
            efficiency_gain: 0.3, // 30% time savings
            requirements: ["clear_wall_layout", "no_space_conflicts"]
        },
        "flooring_cabinet_sequence": {
            description: "Cabinet installation method affects flooring sequence",
            options: {
                "floating_floor": {
                    sequence: ["flooring", "cabinets"],
                    pros: ["easier_replacement", "expansion_accommodation"],
                    cons: ["potential_gaps", "height_adjustments"]
                },
                "under_cabinet": {
                    sequence: ["cabinets", "flooring"],
                    pros: ["cleaner_appearance", "material_savings"],
                    cons: ["difficult_replacement", "custom_cuts"]
                }
            }
        }
    },

    // Weather impact assessment
    WEATHER_IMPACTS: {
        "concrete_work": {
            min_temp: 5, // Celsius
            max_temp: 32,
            no_precipitation: true,
            no_freeze_24h: true,
            optimal_conditions: {
                temp_range: [15, 25],
                humidity: [40, 70],
                wind_max: 15
            }
        },
        "roofing": {
            min_temp: 5,
            max_wind: 25, // km/h
            no_precipitation: true,
            no_storm_forecast_48h: true
        },
        "exterior_painting": {
            min_temp: 10,
            max_temp: 35,
            humidity_max: 85,
            no_precipitation_6h: true,
            no_dew_expected: true
        },
        "siding_installation": {
            max_wind: 30,
            no_precipitation: true,
            material_temperature_considerations: true
        }
    },

    // Inspection scheduling
    INSPECTION_REQUIREMENTS: {
        "electrical_rough": {
            timing: "after_rough_electrical_complete",
            advance_notice_days: 2,
            duration_hours: 1,
            prerequisites: ["permit_active", "work_complete"],
            common_failures: [
                "missing_wire_nuts",
                "improper_box_fill",
                "wrong_wire_gauge",
                "missing_GFCI"
            ]
        },
        "plumbing_rough": {
            timing: "after_rough_plumbing_complete",
            advance_notice_days: 2,
            duration_hours: 1.5,
            test_required: "pressure_test",
            prerequisites: ["permit_active", "pressure_test_passed"]
        },
        "building_final": {
            timing: "after_all_trades_complete",
            advance_notice_days: 3,
            duration_hours: 2,
            prerequisites: [
                "electrical_final_passed",
                "plumbing_final_passed", 
                "hvac_final_passed",
                "all_permits_closed"
            ]
        }
    }
};

module.exports = CONSTRUCTION_WORKFLOWS;