// FireBuildAI - Fixed JavaScript

// Global variables
let projectData = {};
let currentWorkflowData = null;
let currentRegion = null;

// Sample project data
const sampleProjects = {
    basement: `basement retrofit: the total sqft of the basement is 1320sqft with 8 foot ceilings, the walls are in the rough in construction stage. there is insulation only half way down the 2x4 frame with standard plugs and switches. this project is to build a basement bathroom with stand up shower, toilet, vanity. build a bedroom 12 x 14 ft with egress window with uptodate building codes. Finish with drywall ceiling of 1320 sqft with bulk heads of 140linear feet thru out the basement. portlights, hvac, laminate flooring, with dry ease subfloor 2x2 wood tiles with backing to allow for air circulation. paint, 5.25 baseboard.`,
    
    kitchen: `Supply and install new drywall after backsplash has been removed. We will inspect the insulation and vapor. White Shaker wood cabinetry with soft-close hinges and under-mounted drawer slides. Island will seat 3 to 4 people. Level 1 Granite or Quartz countertop with stainless sink. Supply and install 4x12 glass brick style backsplash. Supply and install 6 pot lights in the kitchen, along with dimmer Switch. Island will have a plug and USB charger. Install Dishwasher power source. Plumbing work for sink in new location, installing customer-supplied faucet, install dishwasher, install a new water source for the fridge, install customer-supplied hood vent.`
};

function loadSampleProject() {
    console.log('📋 Loading sample project');
    const textarea = document.getElementById('projectDescription');
    if (textarea) {
        textarea.value = sampleProjects.basement;
        updateCharCount();
    }
}

function updateCharCount() {
    const textarea = document.getElementById('projectDescription');
    const charCount = document.getElementById('charCount');
    if (textarea && charCount) {
        charCount.textContent = textarea.value.length + ' characters';
    }
}

function resetProjectData() {
    console.log('🔄 Resetting project data');
    projectData = {};
    currentWorkflowData = null;
    currentRegion = null;
    
    // Hide workflow elements
    const elements = ['workflowSection', 'regionalPricingControls', 'createEstimateBtn', 'exportWorkflowBtn'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.add('hidden');
    });
}

// Main analyze function
function analyzeProject() {
    console.log('🚀 analyzeProject function called');
    
    const textarea = document.getElementById('projectDescription');
    if (!textarea) {
        alert('Could not find project description field');
        return;
    }
    
    const description = textarea.value.trim();
    console.log('📋 Description:', description.substring(0, 100) + '...');
    
    if (!description) {
        alert('Please enter a project description first.');
        return;
    }
    
    // Reset previous data
    resetProjectData();
    
    // Show analysis in progress
    showAnalysisProgress();
    
    // Start analysis after delay
    setTimeout(() => {
        startProjectAnalysis(description);
    }, 2000);
}

function showAnalysisProgress() {
    console.log('📊 Showing analysis progress');
    
    // Show conversation panel
    const conversation = document.getElementById('aiConversation');
    if (conversation) {
        conversation.classList.remove('hidden');
    }
    
    // Add analysis message
    addAIMessage('🧠 Analyzing your project description...', true);
    
    setTimeout(() => {
        addAIMessage('✅ Project analysis complete! Generating optimized workflow...');
        
        setTimeout(() => {
            generateSampleWorkflow();
        }, 1500);
    }, 2000);
}

function addAIMessage(message, isLoading = false) {
    console.log('💬 Adding AI message:', message);
    
    const container = document.getElementById('conversationMessages');
    if (!container) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex items-start space-x-3 mb-4';
    
    const loadingClass = isLoading ? ' opacity-75' : '';
    messageDiv.innerHTML = `
        <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            AI
        </div>
        <div class="flex-1 bg-blue-50 rounded-lg p-3${loadingClass}">
            <div class="text-sm text-blue-800">${message}</div>
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function startProjectAnalysis(description) {
    console.log('🔍 Starting project analysis');
    
    // Simple project type detection
    let projectType = 'general renovation';
    if (description.toLowerCase().includes('kitchen') && description.toLowerCase().includes('cabinet')) {
        projectType = 'kitchen renovation';
    } else if (description.toLowerCase().includes('basement') && description.toLowerCase().includes('bedroom')) {
        projectType = 'basement retrofit';
    }
    
    console.log('🏠 Detected project type:', projectType);
    
    // Store project data
    projectData = {
        projectType: projectType,
        description: description,
        totalDays: projectType === 'kitchen renovation' ? 28 : 52
    };
    
    addAIMessage(`📋 **Project Type Detected:** ${projectType.charAt(0).toUpperCase() + projectType.slice(1)}`);
    
    setTimeout(() => {
        generateSampleWorkflow();
    }, 1000);
}

function generateSampleWorkflow() {
    console.log('⚙️ Generating sample workflow');
    
    // Create simple workflow data
    const sampleTasks = [
        { id: 'planning', task: 'Planning & Permits', duration: 3, status: 'completed', pricing: { labor: 800, materials: 0, equipment: 0, permits: 450 }},
        { id: 'demo', task: 'Demolition', duration: 2, status: 'in-progress', pricing: { labor: 1200, materials: 200, equipment: 300, permits: 0 }},
        { id: 'rough-electrical', task: 'Electrical Rough-in', duration: 3, status: 'pending', pricing: { labor: 1800, materials: 650, equipment: 200, permits: 0 }},
        { id: 'rough-plumbing', task: 'Plumbing Rough-in', duration: 2, status: 'pending', pricing: { labor: 1500, materials: 800, equipment: 150, permits: 0 }},
        { id: 'inspection', task: 'Rough-in Inspection', duration: 1, status: 'pending', pricing: { labor: 0, materials: 0, equipment: 0, permits: 275 }}
    ];
    
    currentWorkflowData = {
        name: projectData.projectType.charAt(0).toUpperCase() + projectData.projectType.slice(1),
        totalDays: projectData.totalDays,
        nodes: sampleTasks
    };
    
    // Show workflow
    showSimpleWorkflow();
    
    // Show action buttons
    showActionButtons();
}

function showSimpleWorkflow() {
    console.log('📊 Displaying simple workflow');
    
    const workflowSection = document.getElementById('workflowSection');
    if (workflowSection) {
        workflowSection.classList.remove('hidden');
        
        const container = document.getElementById('workflowNodes');
        if (container) {
            let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
            
            currentWorkflowData.nodes.forEach((task, index) => {
                const total = (task.pricing.labor + task.pricing.materials + task.pricing.equipment + task.pricing.permits);
                const statusColor = task.status === 'completed' ? 'bg-green-100 border-green-300' : 
                                  task.status === 'in-progress' ? 'bg-blue-100 border-blue-300' : 'bg-gray-100 border-gray-300';
                
                html += `
                    <div class="p-4 rounded-lg border-2 ${statusColor} cursor-pointer hover:shadow-md transition-shadow"
                         onclick="openTaskModal('${task.id}')">
                        <div class="font-semibold text-gray-900 mb-2">${task.task}</div>
                        <div class="text-sm text-gray-600 mb-2">${task.duration} days</div>
                        <div class="text-sm font-bold text-green-600">$${total.toLocaleString()}</div>
                        <div class="text-xs text-gray-500 mt-1 capitalize">${task.status}</div>
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
        }
    }
}

function showActionButtons() {
    console.log('🔘 Showing action buttons');
    
    const createBtn = document.getElementById('createEstimateBtn');
    const exportBtn = document.getElementById('exportWorkflowBtn');
    
    if (createBtn) createBtn.classList.remove('hidden');
    if (exportBtn) exportBtn.classList.remove('hidden');
}

function generateDetailedEstimate() {
    console.log('💰 Generating detailed estimate');
    
    if (!currentWorkflowData) {
        alert('No workflow data available for estimate generation');
        return;
    }
    
    let totalCost = 0;
    const taskCosts = [];
    
    currentWorkflowData.nodes.forEach(task => {
        if (task.pricing) {
            const taskTotal = task.pricing.labor + task.pricing.materials + task.pricing.equipment + task.pricing.permits;
            taskCosts.push({
                name: task.task,
                duration: task.duration,
                total: taskTotal,
                ...task.pricing
            });
            totalCost += taskTotal;
        }
    });
    
    console.log('📊 Total cost calculated:', totalCost);
    showSimpleEstimateModal(taskCosts, totalCost);
}

function showSimpleEstimateModal(taskCosts, totalCost) {
    console.log('📋 Showing estimate modal');
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    modal.innerHTML = `
        <div class="bg-white rounded-xl max-w-2xl w-full max-h-90vh overflow-y-auto">
            <div class="p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-calculator text-green-600 mr-2"></i>
                        Project Estimate
                    </h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="bg-gray-900 text-white p-6 rounded-lg mb-6 text-center">
                    <div class="text-gray-300 text-sm">Total Project Cost</div>
                    <div class="text-4xl font-bold">$${totalCost.toLocaleString()}</div>
                    <div class="text-gray-300 text-sm mt-2">${currentWorkflowData.totalDays} days timeline</div>
                </div>
                
                <div class="space-y-3" id="taskList"></div>
                
                <div class="text-center mt-6">
                    <button onclick="this.closest('.fixed').remove()" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
                        Close Estimate
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add tasks
    const taskList = modal.querySelector('#taskList');
    taskCosts.forEach(task => {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'flex justify-between items-center p-3 bg-gray-50 rounded';
        taskDiv.innerHTML = `
            <span class="font-medium">${task.name} (${task.duration} days)</span>
            <span class="font-bold text-green-600">$${task.total.toLocaleString()}</span>
        `;
        taskList.appendChild(taskDiv);
    });
}

function openTaskModal(taskId) {
    console.log('🔧 Opening task modal for:', taskId);
    alert('Task editing modal would open here for: ' + taskId);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ FireBuildAI JavaScript loaded successfully');
    
    // Initialize character counter
    const textarea = document.getElementById('projectDescription');
    if (textarea) {
        textarea.addEventListener('input', updateCharCount);
        updateCharCount();
    }
});

// Main page estimate generation (different from demo page)
function generateMainPageEstimate() {
    console.log('💰 Generating main page estimate - CLEARING PREVIOUS DATA');
    
    // CRITICAL: Clear all previous project data first
    resetProjectData();
    currentWorkflowData = null;
    
    // Get form data from main page (correct IDs)
    const projectType = document.getElementById('estimateProjectType')?.value || 'basement-retrofit';
    const squareFootage = parseInt(document.getElementById('estimateSquareFootage')?.value) || 1320;
    const finishLevel = document.getElementById('estimateFinishLevel')?.value || 'standard';
    const location = document.getElementById('estimateLocation')?.value || 'suburban';
    
    console.log('🔍 DEBUGGING - Form elements found:');
    console.log('  - Project Type Element:', document.getElementById('estimateProjectType'));
    console.log('  - Square Footage Element:', document.getElementById('estimateSquareFootage'));
    console.log('  - Finish Level Element:', document.getElementById('estimateFinishLevel'));
    console.log('  - Location Element:', document.getElementById('estimateLocation'));
    
    console.log('📋 CURRENT Form data:', { projectType, squareFootage, finishLevel, location });
    
    // Validate we got the right project type
    if (projectType === 'home-addition') {
        console.log('✅ Correctly detected HOME ADDITION project');
    } else {
        console.log('⚠️ Project type is:', projectType);
    }
    
    // Show loading state
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating AI Estimate...';
    button.disabled = true;
    
    // Generate estimate based on form data
    setTimeout(() => {
        const estimateData = calculateMainPageEstimate(projectType, squareFootage, finishLevel, location);
        
        // Create and show workflow for this estimate
        currentWorkflowData = createWorkflowFromEstimate(estimateData);
        
        // Show success and redirect to demo
        button.innerHTML = '<i class="fas fa-check mr-2"></i>Estimate Generated!';
        button.classList.remove('bg-primary-600');
        button.classList.add('bg-green-600');
        
        setTimeout(() => {
            // Scroll to demo section and show results
            document.getElementById('demo').scrollIntoView({ behavior: 'smooth' });
            
            // Show the generated workflow in demo section
            setTimeout(() => {
                showMainPageResults(estimateData);
                
                // Reset button after delay
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                    button.classList.remove('bg-green-600');
                    button.classList.add('bg-primary-600');
                }, 3000);
            }, 1000);
        }, 1500);
    }, 2500);
}

function calculateMainPageEstimate(projectType, squareFootage, finishLevel, location) {
    console.log('🧮 Calculating estimate for:', projectType, squareFootage, 'sqft');
    
    // Base costs per square foot by project type
    const baseCosts = {
        'basement-retrofit': { labor: 18, materials: 12, equipment: 2, permits: 1 },
        'kitchen-remodel': { labor: 35, materials: 45, equipment: 3, permits: 2 },
        'bathroom-renovation': { labor: 40, materials: 35, equipment: 4, permits: 2 },
        'home-addition': { labor: 55, materials: 65, equipment: 5, permits: 5 },
        'deck-construction': { labor: 25, materials: 30, equipment: 3, permits: 2 }
    };
    
    // Finish level multipliers
    const finishMultipliers = {
        'basic': 0.8,
        'standard': 1.0,
        'premium': 1.4,
        'luxury': 1.8
    };
    
    // Location multipliers
    const locationMultipliers = {
        'urban': 1.3,
        'suburban': 1.0,
        'rural': 0.85
    };
    
    const base = baseCosts[projectType] || baseCosts['basement-retrofit'];
    const finishMult = finishMultipliers[finishLevel] || 1.0;
    const locationMult = locationMultipliers[location] || 1.0;
    
    const labor = Math.round(squareFootage * base.labor * finishMult * locationMult);
    const materials = Math.round(squareFootage * base.materials * finishMult * locationMult);
    const equipment = Math.round(squareFootage * base.equipment * finishMult * locationMult);
    const permits = Math.round(squareFootage * base.permits * finishMult * locationMult);
    
    const subtotal = labor + materials + equipment + permits;
    const overhead = Math.round(subtotal * 0.18); // 18% overhead & profit
    const total = subtotal + overhead;
    
    // Calculate timeline
    const baseDays = {
        'basement-retrofit': 0.04, // days per sqft
        'kitchen-remodel': 0.02,
        'bathroom-renovation': 0.03,
        'home-addition': 0.08, // Home additions take longer
        'deck-construction': 0.015
    };
    
    const timelineDays = Math.round(squareFootage * (baseDays[projectType] || 0.04) * finishMult);
    const optimizedDays = Math.round(timelineDays * 0.73); // 27% time savings
    
    return {
        projectType: projectType,
        squareFootage: squareFootage,
        finishLevel: finishLevel,
        location: location,
        costs: {
            labor: labor,
            materials: materials,
            equipment: equipment,
            permits: permits,
            overhead: overhead,
            total: total
        },
        timeline: {
            standard: timelineDays,
            optimized: optimizedDays,
            savings: timelineDays - optimizedDays
        }
    };
}

function createWorkflowFromEstimate(estimateData) {
    console.log('🔧 Creating workflow from estimate');
    
    const projectName = estimateData.projectType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Create sample workflow tasks based on project type
    let tasks;
    
    if (estimateData.projectType === 'home-addition') {
        tasks = [
            { 
                id: 'permits-design', 
                task: 'Permits & Architectural Plans', 
                duration: 14, 
                status: 'completed', 
                pricing: { 
                    labor: Math.round(estimateData.costs.labor * 0.08), 
                    materials: 0, 
                    equipment: 0, 
                    permits: estimateData.costs.permits 
                }
            },
            { 
                id: 'foundation', 
                task: 'Foundation & Footings', 
                duration: 5, 
                status: 'in-progress', 
                pricing: { 
                    labor: Math.round(estimateData.costs.labor * 0.2), 
                    materials: Math.round(estimateData.costs.materials * 0.15), 
                    equipment: Math.round(estimateData.costs.equipment * 0.4), 
                    permits: 0 
                }
            },
            { 
                id: 'framing', 
                task: 'Framing & Structural', 
                duration: Math.round(estimateData.timeline.optimized * 0.25), 
                status: 'pending', 
                pricing: { 
                    labor: Math.round(estimateData.costs.labor * 0.25), 
                    materials: Math.round(estimateData.costs.materials * 0.3), 
                    equipment: Math.round(estimateData.costs.equipment * 0.2), 
                    permits: 0 
                }
            },
            { 
                id: 'roofing-siding', 
                task: 'Roofing & Exterior Siding', 
                duration: Math.round(estimateData.timeline.optimized * 0.2), 
                status: 'pending', 
                pricing: { 
                    labor: Math.round(estimateData.costs.labor * 0.2), 
                    materials: Math.round(estimateData.costs.materials * 0.25), 
                    equipment: Math.round(estimateData.costs.equipment * 0.15), 
                    permits: 0 
                }
            },
            { 
                id: 'mechanical-systems', 
                task: 'Electrical, Plumbing & HVAC', 
                duration: Math.round(estimateData.timeline.optimized * 0.15), 
                status: 'pending', 
                pricing: { 
                    labor: Math.round(estimateData.costs.labor * 0.15), 
                    materials: Math.round(estimateData.costs.materials * 0.2), 
                    equipment: Math.round(estimateData.costs.equipment * 0.15), 
                    permits: 0 
                }
            },
            { 
                id: 'interior-finishes', 
                task: 'Drywall, Flooring & Paint', 
                duration: Math.round(estimateData.timeline.optimized * 0.2), 
                status: 'pending', 
                pricing: { 
                    labor: Math.round(estimateData.costs.labor * 0.12), 
                    materials: Math.round(estimateData.costs.materials * 0.1), 
                    equipment: Math.round(estimateData.costs.equipment * 0.1), 
                    permits: 0 
                }
            }
        ];
    } else {
        // Default generic tasks for other project types
        tasks = [
            { 
                id: 'planning', 
                task: 'Planning & Design', 
                duration: 3, 
                status: 'completed', 
                pricing: { 
                    labor: Math.round(estimateData.costs.labor * 0.1), 
                    materials: 0, 
                    equipment: 0, 
                    permits: estimateData.costs.permits 
                }
            },
            { 
                id: 'preparation', 
                task: 'Site Preparation', 
                duration: 2, 
                status: 'in-progress', 
                pricing: { 
                    labor: Math.round(estimateData.costs.labor * 0.15), 
                    materials: Math.round(estimateData.costs.materials * 0.1), 
                    equipment: Math.round(estimateData.costs.equipment * 0.3), 
                    permits: 0 
                }
            },
            { 
                id: 'construction', 
                task: 'Main Construction', 
                duration: Math.round(estimateData.timeline.optimized * 0.6), 
                status: 'pending', 
                pricing: { 
                    labor: Math.round(estimateData.costs.labor * 0.6), 
                    materials: Math.round(estimateData.costs.materials * 0.7), 
                    equipment: Math.round(estimateData.costs.equipment * 0.5), 
                    permits: 0 
                }
            },
            { 
                id: 'finishes', 
                task: 'Finishes & Details', 
                duration: Math.round(estimateData.timeline.optimized * 0.3), 
                status: 'pending', 
                pricing: { 
                    labor: Math.round(estimateData.costs.labor * 0.15), 
                    materials: Math.round(estimateData.costs.materials * 0.2), 
                    equipment: Math.round(estimateData.costs.equipment * 0.2), 
                    permits: 0 
                }
            }
        ];
    }
    
    return {
        name: projectName + ` - ${estimateData.squareFootage} sqft`,
        totalDays: estimateData.timeline.optimized,
        nodes: tasks,
        estimateData: estimateData
    };
}

function showMainPageResults(estimateData) {
    console.log('📊 Showing main page results');
    
    // Update the AI conversation with estimate results
    const conversation = document.getElementById('aiConversation');
    if (conversation) {
        conversation.classList.remove('hidden');
        
        // Clear previous messages
        const messages = document.getElementById('conversationMessages');
        if (messages) messages.innerHTML = '';
        
        // Add estimate results
        addAIMessage('🎯 **AI Analysis Complete!** Generated optimized estimate and sequence');
        
        setTimeout(() => {
            const projectTypeDisplay = estimateData.projectType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        addAIMessage(`📊 **Project Summary:**
            
• **Project Type:** ${projectTypeDisplay} 
• **Square Footage:** ${estimateData.squareFootage.toLocaleString()} sqft  
• **Finish Level:** ${estimateData.finishLevel.charAt(0).toUpperCase() + estimateData.finishLevel.slice(1)}
• **Location Type:** ${estimateData.location.charAt(0).toUpperCase() + estimateData.location.slice(1)}

💰 **Total Project Cost:** $${estimateData.costs.total.toLocaleString()}
⏱️ **Optimized Timeline:** ${estimateData.timeline.optimized} days
✅ **Time Savings:** ${estimateData.timeline.savings} days vs traditional scheduling`);
            
            setTimeout(() => {
                // Show workflow
                showSimpleWorkflow();
                showActionButtons();
            }, 1000);
        }, 1500);
    }
}

console.log('🎯 All functions loaded successfully');