/**
 * Construction Task Orchestrator Engine
 * Intelligent task scheduling with dependencies, weather, and trade coordination
 */

const moment = require('moment');
const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
const CONSTRUCTION_WORKFLOWS = require('../data/construction-workflows');

class TaskOrchestrator {
    constructor() {
        this.activeProjects = new Map();
        this.weatherService = null; // Will integrate with weather API
        this.inspectionService = null; // Will integrate with municipal inspection APIs
    }

    /**
     * Create a new construction project with intelligent task orchestration
     */
    createProject(projectData) {
        const projectId = uuidv4();
        
        const project = {
            id: projectId,
            name: projectData.name || `Project ${projectId.slice(0, 8)}`,
            type: projectData.type, // 'kitchen_renovation', 'new_home', 'bathroom_renovation'
            location: projectData.location,
            start_date: moment(projectData.start_date || new Date()),
            estimated_completion: null,
            phases: [],
            tasks: [],
            dependencies: new Map(),
            weather_constraints: new Map(),
            inspection_schedule: [],
            trade_coordination: [],
            status: 'planning',
            created_at: new Date().toISOString()
        };

        // Generate intelligent task breakdown
        this.generateProjectTasks(project, projectData);
        
        // Calculate dependencies and scheduling
        this.calculateDependencies(project);
        
        // Optimize for trade coordination
        this.optimizeTradeCoordination(project);
        
        // Generate timeline with weather considerations
        this.generateIntelligentTimeline(project);

        this.activeProjects.set(projectId, project);
        
        return {
            success: true,
            project_id: projectId,
            project_overview: {
                name: project.name,
                type: project.type,
                estimated_duration: project.estimated_completion?.diff(project.start_date, 'days'),
                total_phases: project.phases.length,
                total_tasks: project.tasks.length,
                critical_path_tasks: project.tasks.filter(t => t.critical_path).length,
                weather_dependent_tasks: project.tasks.filter(t => t.weather_dependent).length,
                inspection_points: project.inspection_schedule.length
            },
            next_actions: this.getNextActions(project),
            timeline_preview: this.getTimelinePreview(project)
        };
    }

    /**
     * Generate intelligent task breakdown based on project type
     */
    generateProjectTasks(project, projectData) {
        const workflow = CONSTRUCTION_WORKFLOWS.ROOM_WORKFLOWS[project.type];
        
        if (!workflow) {
            throw new Error(`Unsupported project type: ${project.type}`);
        }

        let taskCounter = 1;
        
        workflow.phases.forEach((phase, phaseIndex) => {
            const phaseId = uuidv4();
            
            const projectPhase = {
                id: phaseId,
                name: phase.name,
                sequence: phaseIndex + 1,
                estimated_duration_days: phase.duration_days,
                dependencies: phase.dependencies || [],
                inspection_required: phase.inspection_required,
                tasks: []
            };

            // Generate tasks for this phase
            phase.tasks.forEach(taskName => {
                const taskId = uuidv4();
                
                const task = {
                    id: taskId,
                    name: taskName,
                    phase_id: phaseId,
                    phase_name: phase.name,
                    sequence: taskCounter++,
                    status: 'pending',
                    estimated_hours: this.estimateTaskHours(taskName, project.type),
                    dependencies: [],
                    weather_dependent: this.isWeatherDependent(taskName),
                    trade_required: this.getRequiredTrade(taskName),
                    materials_needed: this.getRequiredMaterials(taskName),
                    tools_needed: this.getRequiredTools(taskName),
                    safety_considerations: this.getSafetyConsiderations(taskName),
                    quality_checkpoints: this.getQualityCheckpoints(taskName),
                    created_at: new Date().toISOString()
                };

                projectPhase.tasks.push(task);
                project.tasks.push(task);
            });

            project.phases.push(projectPhase);
        });
    }

    /**
     * Calculate intelligent task dependencies
     */
    calculateDependencies(project) {
        project.tasks.forEach(task => {
            // Phase-level dependencies
            const currentPhase = project.phases.find(p => p.id === task.phase_id);
            if (currentPhase.dependencies && currentPhase.dependencies.length > 0) {
                currentPhase.dependencies.forEach(depPhaseName => {
                    const depPhase = project.phases.find(p => p.name === depPhaseName);
                    if (depPhase) {
                        // Task depends on all tasks in the dependency phase
                        const depTasks = project.tasks.filter(t => t.phase_id === depPhase.id);
                        task.dependencies.push(...depTasks.map(dt => dt.id));
                    }
                });
            }

            // Task-specific dependencies
            task.smart_dependencies = this.calculateSmartDependencies(task, project);
        });
    }

    /**
     * Calculate smart dependencies based on construction logic
     */
    calculateSmartDependencies(task, project) {
        const dependencies = {
            predecessor_tasks: [],
            weather_requirements: null,
            inspection_requirements: [],
            material_lead_times: [],
            trade_coordination: []
        };

        // Weather dependencies
        if (task.weather_dependent) {
            dependencies.weather_requirements = this.getWeatherRequirements(task.name);
        }

        // Material lead time dependencies
        if (task.materials_needed && task.materials_needed.length > 0) {
            dependencies.material_lead_times = task.materials_needed.map(material => ({
                material: material,
                lead_time_days: this.getMaterialLeadTime(material),
                order_by_date: moment().subtract(this.getMaterialLeadTime(material), 'days')
            }));
        }

        // Trade coordination requirements
        const tradeRequired = this.getRequiredTrade(task.name);
        if (tradeRequired) {
            dependencies.trade_coordination = this.getTradeCoordinationRequirements(tradeRequired, project);
        }

        return dependencies;
    }

    /**
     * Optimize trade coordination to minimize conflicts and maximize efficiency
     */
    optimizeTradeCoordination(project) {
        const tradeSchedule = new Map();
        
        // Group tasks by trade
        const tasksByTrade = _.groupBy(project.tasks, 'trade_required');
        
        Object.entries(tasksByTrade).forEach(([trade, tasks]) => {
            if (trade && trade !== 'undefined') {
                tradeSchedule.set(trade, {
                    trade_name: trade,
                    tasks: tasks,
                    estimated_total_hours: tasks.reduce((sum, t) => sum + t.estimated_hours, 0),
                    coordination_opportunities: this.findCoordinationOpportunities(tasks, project)
                });
            }
        });

        project.trade_coordination = Array.from(tradeSchedule.values());
        
        // Identify optimization opportunities
        project.optimization_suggestions = this.generateOptimizationSuggestions(project);
    }

    /**
     * Generate intelligent timeline with weather and dependency considerations
     */
    generateIntelligentTimeline(project) {
        let currentDate = moment(project.start_date);
        const timeline = [];
        const scheduledTasks = new Set();

        // Sort tasks by dependencies and priority
        const sortedTasks = this.topologicalSort(project.tasks);

        sortedTasks.forEach(task => {
            if (scheduledTasks.has(task.id)) return;

            // Calculate earliest start date based on dependencies
            const earliestStart = this.calculateEarliestStart(task, project, timeline);
            
            // Adjust for weather constraints if applicable
            const weatherAdjustedStart = task.weather_dependent 
                ? this.adjustForWeather(earliestStart, task)
                : earliestStart;

            // Schedule the task
            const scheduledTask = {
                ...task,
                scheduled_start: weatherAdjustedStart.format('YYYY-MM-DD'),
                scheduled_end: weatherAdjustedStart.clone().add(Math.ceil(task.estimated_hours / 8), 'days').format('YYYY-MM-DD'),
                working_days: Math.ceil(task.estimated_hours / 8),
                buffer_days: this.calculateBufferDays(task),
                risk_factors: this.assessRiskFactors(task, weatherAdjustedStart)
            };

            timeline.push(scheduledTask);
            scheduledTasks.add(task.id);
        });

        project.timeline = timeline;
        project.estimated_completion = moment(_.maxBy(timeline, t => t.scheduled_end).scheduled_end);
        project.critical_path = this.identifyCriticalPath(timeline);
    }

    /**
     * Get next actionable items for the project
     */
    getNextActions(project) {
        const nextActions = [];
        
        // Find tasks that can be started immediately
        const readyTasks = project.tasks.filter(task => {
            if (task.status !== 'pending') return false;
            
            // Check if all dependencies are complete
            const allDepsComplete = task.dependencies.every(depId => {
                const depTask = project.tasks.find(t => t.id === depId);
                return depTask && depTask.status === 'completed';
            });

            return allDepsComplete;
        });

        // Prioritize by critical path and urgency
        const prioritizedTasks = readyTasks
            .sort((a, b) => {
                if (a.critical_path && !b.critical_path) return -1;
                if (!a.critical_path && b.critical_path) return 1;
                return a.sequence - b.sequence;
            })
            .slice(0, 5); // Top 5 next actions

        prioritizedTasks.forEach(task => {
            nextActions.push({
                task_id: task.id,
                task_name: task.name,
                phase: task.phase_name,
                priority: task.critical_path ? 'critical' : 'normal',
                estimated_hours: task.estimated_hours,
                trade_required: task.trade_required,
                weather_dependent: task.weather_dependent,
                materials_needed: task.materials_needed,
                action_items: this.generateActionItems(task),
                scheduling_notes: this.getSchedulingNotes(task)
            });
        });

        return nextActions;
    }

    /**
     * Get timeline preview with key milestones
     */
    getTimelinePreview(project) {
        const milestones = [];
        
        // Phase completion milestones
        project.phases.forEach(phase => {
            const phaseTasks = project.tasks.filter(t => t.phase_id === phase.id);
            const lastTask = _.maxBy(phaseTasks, t => moment(t.scheduled_end || new Date()));
            
            milestones.push({
                type: 'phase_completion',
                name: `${phase.name} Complete`,
                date: lastTask ? lastTask.scheduled_end : 'TBD',
                critical: phase.inspection_required ? true : false
            });
        });

        // Inspection milestones
        project.inspection_schedule.forEach(inspection => {
            milestones.push({
                type: 'inspection',
                name: inspection.name,
                date: inspection.scheduled_date,
                critical: true,
                advance_booking_required: inspection.advance_notice_days
            });
        });

        return {
            project_start: project.start_date.format('YYYY-MM-DD'),
            estimated_completion: project.estimated_completion ? project.estimated_completion.format('YYYY-MM-DD') : 'TBD',
            total_duration_days: project.estimated_completion ? project.estimated_completion.diff(project.start_date, 'days') : null,
            milestones: milestones.sort((a, b) => moment(a.date).diff(moment(b.date))),
            weather_risk_periods: this.identifyWeatherRiskPeriods(project),
            critical_path_summary: project.critical_path ? {
                task_count: project.critical_path.length,
                total_duration: project.critical_path.reduce((sum, t) => sum + Math.ceil(t.estimated_hours / 8), 0)
            } : null
        };
    }

    // Utility methods
    estimateTaskHours(taskName, projectType) {
        const estimates = {
            'remove_cabinets': 4,
            'remove_countertops': 2,
            'remove_appliances': 3,
            'install_circuits': 6,
            'rough_wiring': 8,
            'panel_updates': 4,
            'relocate_pipes': 6,
            'install_rough_plumbing': 8,
            'gas_line_work': 4,
            'patch_walls': 6,
            'prime_paint': 4,
            'subfloor_prep': 4,
            'install_flooring': 16,
            'install_base_cabinets': 12,
            'install_upper_cabinets': 8,
            'template_counters': 2,
            'install_countertops': 6,
            'install_outlets': 4,
            'install_fixtures': 6,
            'connect_appliances': 4,
            'connect_fixtures': 4,
            'install_faucets': 2,
            'test_connections': 2
        };
        
        return estimates[taskName] || 8; // Default 1 day
    }

    isWeatherDependent(taskName) {
        const weatherDependent = [
            'roofing', 'siding', 'exterior_painting', 'concrete_work',
            'foundation', 'framing', 'demolition'
        ];
        
        return weatherDependent.some(dep => taskName.toLowerCase().includes(dep));
    }

    getRequiredTrade(taskName) {
        const tradeMapping = {
            'electrical': ['circuit', 'wiring', 'panel', 'outlet', 'fixture', 'electrical'],
            'plumbing': ['plumb', 'pipe', 'gas_line', 'faucet', 'fixture'],
            'carpentry': ['cabinet', 'framing', 'trim', 'door', 'window'],
            'flooring': ['floor', 'tile', 'carpet'],
            'drywall': ['drywall', 'patch_walls', 'paint'],
            'general': ['demolition', 'cleanup', 'removal']
        };

        for (const [trade, keywords] of Object.entries(tradeMapping)) {
            if (keywords.some(keyword => taskName.toLowerCase().includes(keyword))) {
                return trade;
            }
        }
        
        return 'general';
    }

    getRequiredMaterials(taskName) {
        // Simplified material mapping
        const materialMapping = {
            'install_circuits': ['wire', 'breakers', 'electrical_boxes'],
            'install_flooring': ['flooring_material', 'underlayment', 'transition_strips'],
            'install_cabinets': ['cabinets', 'screws', 'shims'],
            'install_countertops': ['countertop_slabs', 'adhesive', 'brackets']
        };
        
        return materialMapping[taskName] || [];
    }

    getRequiredTools(taskName) {
        // Simplified tool mapping
        return ['basic_tools', 'safety_equipment'];
    }

    getSafetyConsiderations(taskName) {
        return ['safety_glasses', 'work_gloves', 'proper_ventilation'];
    }

    getQualityCheckpoints(taskName) {
        return ['visual_inspection', 'dimensional_check', 'function_test'];
    }

    // Additional utility methods would be implemented here...
    calculateEarliestStart(task, project, timeline) {
        return moment(project.start_date);
    }

    adjustForWeather(date, task) {
        return date; // Weather integration would be implemented here
    }

    calculateBufferDays(task) {
        return task.critical_path ? 0 : 1;
    }

    assessRiskFactors(task, date) {
        return [];
    }

    topologicalSort(tasks) {
        return tasks; // Simplified - would implement proper topological sort
    }

    identifyCriticalPath(timeline) {
        return [];
    }

    generateActionItems(task) {
        return [
            `Schedule ${task.trade_required} contractor`,
            `Order required materials`,
            `Ensure permits are current`
        ];
    }

    getSchedulingNotes(task) {
        return `Task requires ${task.estimated_hours} hours. ${task.weather_dependent ? 'Weather dependent.' : ''}`;
    }

    identifyWeatherRiskPeriods(project) {
        return [];
    }

    findCoordinationOpportunities(tasks, project) {
        return [];
    }

    generateOptimizationSuggestions(project) {
        return [
            'Consider combining electrical and plumbing rough-in phases',
            'Order long lead-time materials early to avoid delays',
            'Schedule inspections in advance to prevent scheduling conflicts'
        ];
    }

    getWeatherRequirements(taskName) {
        return CONSTRUCTION_WORKFLOWS.WEATHER_IMPACTS[taskName] || null;
    }

    getMaterialLeadTime(material) {
        const leadTimes = {
            'countertop_slabs': 14,
            'cabinets': 21,
            'flooring_material': 7,
            'fixtures': 10
        };
        return leadTimes[material] || 5;
    }

    getTradeCoordinationRequirements(trade, project) {
        return [];
    }
}

module.exports = TaskOrchestrator;