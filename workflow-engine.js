// FireBuildAI Workflow Generation Engine
// Generates construction sequences with dependencies and optimization

class WorkflowEngine {
    constructor() {
        // WorkflowEngine ready for use
    }

    /**
     * Generate workflow sequence for a construction project
     * @param {Object} projectData - Parsed project data
     * @returns {Object} Complete workflow with tasks, dependencies, and timeline
     */
    async generateWorkflow(projectData) {
        console.log('⚙️ Generating workflow for:', projectData.type);
        
        try {
            // Step 1: Generate base task list
            const baseTasks = await this.generateBaseTasks(projectData);
            
            // Step 2: Add project-specific tasks
            const projectTasks = await this.addProjectSpecificTasks(baseTasks, projectData);
            
            // Step 3: Calculate dependencies
            const tasksWithDependencies = await this.calculateDependencies(projectTasks);
            
            // Step 4: Estimate durations
            const tasksWithDurations = await this.estimateTaskDurations(tasksWithDependencies, projectData);
            
            // Step 5: Create timeline
            const timeline = await this.createProjectTimeline(tasksWithDurations);
            
            return {
                tasks: tasksWithDurations,
                timeline: timeline,
                standardDuration: timeline.standardDuration,
                optimizedDuration: timeline.optimizedDuration,
                parallelTasks: timeline.parallelGroups,
                criticalPath: timeline.criticalPath,
                phases: this.organizeTasksIntoPhases(tasksWithDurations)

            };
            
        } catch (error) {
            console.error('❌ Workflow generation failed:', error);
            throw new Error(`Workflow generation failed: ${error.message}`);
        }
    }

    /**
     * Generate base tasks for project type
     */
    async generateBaseTasks(projectData) {
        const taskGenerators = {
            'home-addition': () => this.generateHomeAdditionTasks(projectData),
            'kitchen-renovation': () => this.generateKitchenTasks(projectData),
            'bathroom-renovation': () => this.generateBathroomTasks(projectData),
            'basement-finishing': () => this.generateBasementTasks(projectData)
        };
        
        const generator = taskGenerators[projectData.type];
        if (!generator) {
            return this.generateGenericTasks(projectData);
        }
        
        return await generator();
    }

    /**
     * Generate tasks for home addition projects
     */
    generateHomeAdditionTasks(projectData) {
        const tasks = [
            // Phase 1: Planning & Permits
            {
                id: 'permits-design',
                name: 'Building Permits & Design',
                category: 'planning',
                description: 'Obtain building permits and finalize architectural plans',
                complexity: 'medium'
            },
            {
                id: 'site-survey',
                name: 'Site Survey & Layout',
                category: 'planning', 
                description: 'Survey property lines and stake addition location',
                complexity: 'low'
            },

            // Phase 2: Site Preparation
            {
                id: 'site-preparation',
                name: 'Site Preparation & Excavation',
                category: 'sitework',
                description: 'Clear area, excavate for foundation',
                complexity: 'medium'
            },
            {
                id: 'temporary-utilities',
                name: 'Temporary Utilities Setup',
                category: 'sitework',
                description: 'Set up temporary power, water, and sanitation',
                complexity: 'low'
            },

            // Phase 3: Foundation
            {
                id: 'foundation-footings',
                name: 'Foundation & Footings',
                category: 'structural',
                description: 'Pour concrete footings and foundation walls',
                complexity: 'high'
            },
            {
                id: 'foundation-waterproofing',
                name: 'Foundation Waterproofing',
                category: 'structural',
                description: 'Apply waterproof membrane and install drainage',
                complexity: 'medium'
            },

            // Phase 4: Framing
            {
                id: 'floor-framing',
                name: 'Floor Framing System',
                category: 'structural',
                description: 'Install floor joists and subfloor',
                complexity: 'medium'
            },
            {
                id: 'wall-framing',
                name: 'Wall Framing',
                category: 'structural',
                description: 'Frame exterior and interior walls',
                complexity: 'medium'
            },
            {
                id: 'roof-framing',
                name: 'Roof Framing',
                category: 'structural',
                description: 'Install roof trusses or rafters',
                complexity: 'high'
            },

            // Phase 5: Exterior Shell
            {
                id: 'roofing',
                name: 'Roofing Installation',
                category: 'exterior',
                description: 'Install sheathing, underlayment, and shingles',
                complexity: 'medium'
            },
            {
                id: 'windows-doors',
                name: 'Windows & Exterior Doors',
                category: 'exterior',
                description: 'Install windows and exterior doors',
                complexity: 'medium'
            },
            {
                id: 'siding',
                name: 'Exterior Siding',
                category: 'exterior',
                description: 'Install siding to match existing home',
                complexity: 'medium'
            },

            // Phase 6: Mechanical Systems
            {
                id: 'electrical-rough',
                name: 'Electrical Rough-in',
                category: 'mechanical',
                description: 'Install electrical wiring and panel upgrade',
                complexity: 'high'
            },
            {
                id: 'plumbing-rough',
                name: 'Plumbing Rough-in',
                category: 'mechanical',
                description: 'Install plumbing lines and fixtures rough-in',
                complexity: 'high'
            },
            {
                id: 'hvac-rough',
                name: 'HVAC Rough-in',
                category: 'mechanical',
                description: 'Install ductwork and HVAC equipment',
                complexity: 'high'
            },

            // Phase 7: Inspections
            {
                id: 'framing-inspection',
                name: 'Framing Inspection',
                category: 'inspection',
                description: 'Municipal inspection of framing work',
                complexity: 'low'
            },
            {
                id: 'rough-inspection',
                name: 'Mechanical Rough-in Inspection',
                category: 'inspection',
                description: 'Inspection of electrical, plumbing, and HVAC rough-in',
                complexity: 'low'
            },

            // Phase 8: Insulation & Drywall
            {
                id: 'insulation',
                name: 'Insulation Installation',
                category: 'interior',
                description: 'Install wall and ceiling insulation',
                complexity: 'low'
            },
            {
                id: 'drywall',
                name: 'Drywall Installation',
                category: 'interior',
                description: 'Hang, tape, and finish drywall',
                complexity: 'medium'
            },

            // Phase 9: Interior Finishes
            {
                id: 'flooring',
                name: 'Flooring Installation',
                category: 'finishes',
                description: 'Install flooring materials',
                complexity: 'medium'
            },
            {
                id: 'interior-trim',
                name: 'Interior Trim & Millwork',
                category: 'finishes',
                description: 'Install baseboards, door trim, and custom millwork',
                complexity: 'medium'
            },
            {
                id: 'painting',
                name: 'Interior Painting',
                category: 'finishes',
                description: 'Prime and paint all interior surfaces',
                complexity: 'low'
            },

            // Phase 10: Mechanical Finish
            {
                id: 'electrical-finish',
                name: 'Electrical Finish',
                category: 'mechanical',
                description: 'Install fixtures, switches, and outlets',
                complexity: 'medium'
            },
            {
                id: 'plumbing-finish',
                name: 'Plumbing Finish',
                category: 'mechanical',
                description: 'Install bathroom fixtures and finish plumbing',
                complexity: 'medium'
            },
            {
                id: 'hvac-finish',
                name: 'HVAC Finish',
                category: 'mechanical',
                description: 'Install vents, registers, and commission system',
                complexity: 'medium'
            },

            // Phase 11: Final Inspections
            {
                id: 'final-electrical-inspection',
                name: 'Final Electrical Inspection',
                category: 'inspection',
                description: 'Final electrical system inspection',
                complexity: 'low'
            },
            {
                id: 'final-plumbing-inspection', 
                name: 'Final Plumbing Inspection',
                category: 'inspection',
                description: 'Final plumbing system inspection',
                complexity: 'low'
            },
            {
                id: 'final-building-inspection',
                name: 'Final Building Inspection',
                category: 'inspection',
                description: 'Final building inspection and certificate of occupancy',
                complexity: 'low'
            },

            // Phase 12: Cleanup & Completion
            {
                id: 'final-cleanup',
                name: 'Final Cleanup',
                category: 'completion',
                description: 'Construction cleanup and site restoration',
                complexity: 'low'
            },
            {
                id: 'client-walkthrough',
                name: 'Client Walkthrough',
                category: 'completion', 
                description: 'Final walkthrough and project handover',
                complexity: 'low'
            }
        ];

        return tasks;
    }

    /**
     * Calculate task dependencies based on construction logic
     */
    async calculateDependencies(tasks) {
        const dependencyRules = {
            // Foundation must come first
            'foundation-footings': [],
            'foundation-waterproofing': ['foundation-footings'],
            
            // Framing depends on foundation
            'floor-framing': ['foundation-waterproofing'],
            'wall-framing': ['floor-framing'],
            'roof-framing': ['wall-framing'],
            
            // Exterior shell
            'roofing': ['roof-framing'],
            'windows-doors': ['wall-framing', 'roofing'],
            'siding': ['windows-doors'],
            
            // Mechanical rough-in depends on framing
            'electrical-rough': ['wall-framing', 'roof-framing'],
            'plumbing-rough': ['wall-framing', 'floor-framing'],
            'hvac-rough': ['wall-framing', 'roof-framing'],
            
            // Inspections
            'framing-inspection': ['roof-framing', 'siding'],
            'rough-inspection': ['electrical-rough', 'plumbing-rough', 'hvac-rough'],
            
            // Interior work depends on inspections
            'insulation': ['rough-inspection'],
            'drywall': ['insulation'],
            
            // Finishes depend on drywall
            'flooring': ['drywall'],
            'interior-trim': ['flooring'],
            'painting': ['interior-trim'],
            
            // Mechanical finish
            'electrical-finish': ['painting'],
            'plumbing-finish': ['painting'],
            'hvac-finish': ['painting'],
            
            // Final inspections
            'final-electrical-inspection': ['electrical-finish'],
            'final-plumbing-inspection': ['plumbing-finish'],
            'final-building-inspection': ['final-electrical-inspection', 'final-plumbing-inspection'],
            
            // Completion
            'final-cleanup': ['final-building-inspection'],
            'client-walkthrough': ['final-cleanup']
        };

        return tasks.map(task => ({
            ...task,
            dependencies: dependencyRules[task.id] || []
        }));
    }

    /**
     * Estimate task durations based on project size and complexity
     */
    async estimateTaskDurations(tasks, projectData) {
        const baseDurations = {
            'permits-design': { base: 14, perSqft: 0 },
            'site-survey': { base: 1, perSqft: 0 },
            'site-preparation': { base: 2, perSqft: 0.001 },
            'foundation-footings': { base: 3, perSqft: 0.002 },
            'foundation-waterproofing': { base: 2, perSqft: 0.001 },
            'floor-framing': { base: 2, perSqft: 0.003 },
            'wall-framing': { base: 3, perSqft: 0.005 },
            'roof-framing': { base: 2, perSqft: 0.003 },
            'roofing': { base: 2, perSqft: 0.002 },
            'windows-doors': { base: 1, perSqft: 0.002 },
            'siding': { base: 2, perSqft: 0.003 },
            'electrical-rough': { base: 2, perSqft: 0.004 },
            'plumbing-rough': { base: 2, perSqft: 0.003 },
            'hvac-rough': { base: 2, perSqft: 0.003 },
            'framing-inspection': { base: 1, perSqft: 0 },
            'rough-inspection': { base: 1, perSqft: 0 },
            'insulation': { base: 1, perSqft: 0.002 },
            'drywall': { base: 3, perSqft: 0.005 },
            'flooring': { base: 2, perSqft: 0.003 },
            'interior-trim': { base: 2, perSqft: 0.004 },
            'painting': { base: 2, perSqft: 0.003 },
            'electrical-finish': { base: 1, perSqft: 0.002 },
            'plumbing-finish': { base: 1, perSqft: 0.002 },
            'hvac-finish': { base: 1, perSqft: 0.001 },
            'final-electrical-inspection': { base: 1, perSqft: 0 },
            'final-plumbing-inspection': { base: 1, perSqft: 0 },
            'final-building-inspection': { base: 1, perSqft: 0 },
            'final-cleanup': { base: 1, perSqft: 0.001 },
            'client-walkthrough': { base: 1, perSqft: 0 }
        };

        const complexityMultipliers = {
            'low': 0.8,
            'medium': 1.0,
            'high': 1.3
        };

        return tasks.map(task => {
            const duration = baseDurations[task.id] || { base: 1, perSqft: 0.002 };
            const complexityMult = complexityMultipliers[projectData.complexity] || 1.0;
            
            const calculatedDuration = Math.ceil(
                (duration.base + (duration.perSqft * projectData.squareFootage)) * complexityMult
            );

            return {
                ...task,
                duration: Math.max(1, calculatedDuration), // Minimum 1 day
                estimationMethod: 'formula-based'
            };
        });
    }

    /**
     * Create project timeline with optimization
     */
    async createProjectTimeline(tasks) {
        // Calculate critical path
        const criticalPath = this.calculateCriticalPath(tasks);
        
        // Identify parallel tasks
        const parallelGroups = this.identifyParallelTasks(tasks);
        
        // Calculate standard duration (sequential)
        const standardDuration = tasks.reduce((sum, task) => sum + task.duration, 0);
        
        // Calculate optimized duration (with parallelization)
        const optimizedDuration = this.calculateOptimizedDuration(tasks, parallelGroups);
        
        return {
            standardDuration,
            optimizedDuration,
            criticalPath,
            parallelGroups,
            timeSavings: standardDuration - optimizedDuration
        };
    }

    /**
     * Calculate critical path through project
     */
    calculateCriticalPath(tasks) {
        // Simplified critical path calculation
        // In production, would use proper CPM algorithm
        
        const taskMap = {};
        tasks.forEach(task => {
            taskMap[task.id] = task;
        });

        const criticalTasks = [];
        let currentTasks = tasks.filter(task => task.dependencies.length === 0);
        
        while (currentTasks.length > 0) {
            // Find longest duration task in current level
            const longestTask = currentTasks.reduce((longest, current) => 
                current.duration > longest.duration ? current : longest
            );
            
            criticalTasks.push(longestTask.id);
            
            // Find tasks that depend on this task
            currentTasks = tasks.filter(task => 
                task.dependencies.includes(longestTask.id) &&
                task.dependencies.every(dep => criticalTasks.includes(dep))
            );
        }
        
        return criticalTasks;
    }

    /**
     * Identify tasks that can run in parallel
     */
    identifyParallelTasks(tasks) {
        const parallelGroups = [];
        
        // Group tasks by dependency level
        const dependencyLevels = {};
        
        tasks.forEach(task => {
            const level = this.calculateDependencyLevel(task, tasks);
            if (!dependencyLevels[level]) {
                dependencyLevels[level] = [];
            }
            dependencyLevels[level].push(task.id);
        });
        
        // Tasks at same level can potentially run in parallel
        Object.values(dependencyLevels).forEach(levelTasks => {
            if (levelTasks.length > 1) {
                parallelGroups.push(levelTasks);
            }
        });
        
        return parallelGroups;
    }

    /**
     * Calculate how deep a task is in the dependency chain
     */
    calculateDependencyLevel(task, allTasks) {
        if (task.dependencies.length === 0) {
            return 0;
        }
        
        const taskMap = {};
        allTasks.forEach(t => { taskMap[t.id] = t; });
        
        const maxDependencyLevel = Math.max(
            ...task.dependencies.map(depId => {
                const depTask = taskMap[depId];
                return depTask ? this.calculateDependencyLevel(depTask, allTasks) : 0;
            })
        );
        
        return maxDependencyLevel + 1;
    }

    /**
     * Calculate optimized project duration with parallel tasks
     */
    calculateOptimizedDuration(tasks, parallelGroups) {
        const taskMap = {};
        tasks.forEach(task => {
            taskMap[task.id] = task;
        });

        // Simplified calculation - in production would use proper scheduling algorithm
        let optimizedDuration = 0;
        
        parallelGroups.forEach(group => {
            // For parallel groups, use the longest task duration
            const groupDuration = Math.max(...group.map(taskId => taskMap[taskId].duration));
            optimizedDuration += groupDuration;
        });
        
        // Add sequential tasks
        const parallelTaskIds = new Set(parallelGroups.flat());
        const sequentialTasks = tasks.filter(task => !parallelTaskIds.has(task.id));
        
        optimizedDuration += sequentialTasks.reduce((sum, task) => sum + task.duration, 0);
        
        return optimizedDuration;
    }

    /**
     * Organize tasks into logical phases
     */
    organizeTasksIntoPhases(tasks) {

        const phases = {
            'Planning': tasks.filter(t => t.category === 'planning'),
            'Site Work': tasks.filter(t => t.category === 'sitework'),
            'Foundation': tasks.filter(t => t.category === 'structural' && t.id.includes('foundation')),
            'Framing': tasks.filter(t => t.category === 'structural' && !t.id.includes('foundation')),
            'Exterior': tasks.filter(t => t.category === 'exterior'),
            'Mechanical Rough': tasks.filter(t => t.category === 'mechanical' && t.id.includes('rough')),
            'Inspections': tasks.filter(t => t.category === 'inspection'),
            'Interior': tasks.filter(t => t.category === 'interior'),
            'Finishes': tasks.filter(t => t.category === 'finishes'),
            'Mechanical Finish': tasks.filter(t => t.category === 'mechanical' && t.id.includes('finish')),
            'Completion': tasks.filter(t => t.category === 'completion')
        };
        
        return phases;
    }

    /**
     * Optimize workflow sequence for efficiency
     */
    async optimizeSequence(workflow) {
        console.log('⚡ Optimizing workflow sequence...');
        
        // Apply optimization strategies
        const optimizations = {
            parallelization: this.optimizeParallelTasks(workflow),
            scheduling: this.optimizeScheduling(workflow),
            resourceLeveling: this.optimizeResources(workflow)
        };
        
        return {
            ...workflow,
            optimizations,
            optimizationApplied: true
        };
    }

    optimizeParallelTasks(workflow) {
        // Identify additional parallelization opportunities
        const additionalParallel = [];
        
        // Mechanical systems can often run in parallel
        const mechanicalTasks = workflow.tasks.filter(t => t.category === 'mechanical');
        if (mechanicalTasks.length > 1) {
            additionalParallel.push(mechanicalTasks.map(t => t.id));
        }
        
        return {
            additionalParallelGroups: additionalParallel,
            timeSavingsPotential: additionalParallel.length * 2 // Estimated days saved
        };
    }

    optimizeScheduling(workflow) {
        return {
            recommendedStartTimes: {},
            bufferRecommendations: {},
            weatherConsiderations: []
        };
    }

    optimizeResources(workflow) {
        return {
            crewOptimization: {},
            equipmentScheduling: {},
            materialDeliveries: {}
        };
    }
}

module.exports = WorkflowEngine;
