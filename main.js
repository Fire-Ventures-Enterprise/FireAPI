// FireBuildAI Demo Site JavaScript

// API Configuration - Connect Frontend to Backend
const API_CONFIG = {
    // Use the custom fireapi.dev domain
    baseURL: 'https://fireapi.dev',
    
    // Fallback: Railway generated URL (if custom domain not ready)
    // baseURL: 'https://fireapi-production-xxxx.up.railway.app',
    endpoints: {
        analyze: '/api/projects/analyze',
        completeAnalysis: '/api/projects/complete-analysis', 
        workflows: '/api/workflows/generate',
        costs: '/api/costs/estimate',
        regions: '/api/costs/regions',
        templates: '/api/workflows/templates'
    },
    timeout: 30000 // 30 second timeout for API calls
};

// Global variables
let sequenceTimer = null;
let currentSequenceStep = 0;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize hero demo animation
    initHeroDemo();
    

    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize form handlers
    initFormHandlers();
    
    // Initialize scroll animations
    initScrollAnimations();
});

// Hero Demo Animation
function initHeroDemo() {
    const steps = [
        { id: 1, task: 'Site Preparation', status: 'completed', duration: '2 days', ai_optimization: 'Optimized based on weather data' },
        { id: 2, task: 'Foundation Work', status: 'completed', duration: '3 days', ai_optimization: 'Concrete curing time optimized' },
        { id: 3, task: 'Framing', status: 'processing', duration: '4 days', ai_optimization: 'Material delivery synchronized' },
        { id: 4, task: 'Electrical Rough-in', status: 'pending', duration: '2 days', ai_optimization: 'Scheduled before insulation' },
        { id: 5, task: 'Plumbing Rough-in', status: 'pending', duration: '2 days', ai_optimization: 'Parallel with electrical work' }
    ];
    
    displayHeroSequence(steps);
    
    // Auto-advance the demo every 3 seconds
    setInterval(() => {
        advanceHeroDemo();
    }, 3000);
}

function displayHeroSequence(steps) {
    const container = document.getElementById('sequence-steps');
    if (!container) return;
    
    container.innerHTML = steps.map(step => `
        <div class="sequence-step ${step.status} flex items-center justify-between p-3 rounded-lg border ${getStepClasses(step.status)}">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center ${getIconClasses(step.status)}">
                    ${getStepIcon(step.status)}
                </div>
                <div>
                    <div class="font-medium text-sm text-gray-900">${step.task}</div>
                    <div class="text-xs text-gray-500">${step.duration}</div>
                </div>
            </div>
            <div class="text-xs text-gray-600 max-w-[120px] text-right">
                ${step.ai_optimization}
            </div>
        </div>
    `).join('');
}

function getStepClasses(status) {
    switch (status) {
        case 'completed': return 'bg-green-50 border-green-200';
        case 'processing': return 'bg-blue-50 border-blue-200 processing';
        case 'pending': return 'bg-gray-50 border-gray-200';
        default: return 'bg-gray-50 border-gray-200';
    }
}

function getIconClasses(status) {
    switch (status) {
        case 'completed': return 'bg-green-100 text-green-600';
        case 'processing': return 'bg-blue-100 text-blue-600';
        case 'pending': return 'bg-gray-100 text-gray-400';
        default: return 'bg-gray-100 text-gray-400';
    }
}

function getStepIcon(status) {
    switch (status) {
        case 'completed': return '<i class="fas fa-check text-xs"></i>';
        case 'processing': return '<i class="fas fa-cog fa-spin text-xs"></i>';
        case 'pending': return '<i class="fas fa-clock text-xs"></i>';
        default: return '<i class="fas fa-circle text-xs"></i>';
    }
}

function advanceHeroDemo() {
    // This would advance the demo animation - simplified for demo purposes
    const steps = document.querySelectorAll('#sequence-steps .sequence-step');
    steps.forEach((step, index) => {
        if (index <= currentSequenceStep % steps.length) {
            step.classList.add('fade-in');
        }
    });
    currentSequenceStep++;
}



// AI Project Analyzer
let currentConversation = [];
let projectData = {};

// Character counter for project description
document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('projectDescription');
    const charCount = document.getElementById('charCount');
    
    if (textarea && charCount) {
        textarea.addEventListener('input', function() {
            charCount.textContent = `${this.value.length} characters`;
        });
    }
});

// Load sample basement retrofit project
function loadSampleProject() {
    const sampleProject = `Basement retrofit: The total sqft of the basement is 1320sqft with 8 foot ceilings, the walls are in the roughin construction stage. There is insulation only half way down the 2x4 frame with standard plugs and switches. This project is to build a basement bathroom with stand up shower, toilet, vanity. Build a bedroom with egress window with up-to-date building codes. Finish with drywall ceiling of 1320 sqft with bulk heads of 140 linear feet throughout the basement. Pot lights, HVAC, laminate flooring, with DryEase subfloor 2x2 wood tiles with backing to allow for air circulation. Paint, 5.25 baseboard.`;
    
    document.getElementById('projectDescription').value = sampleProject;
    document.getElementById('charCount').textContent = `${sampleProject.length} characters`;
}

function resetProjectData() {
    // Clear all global project variables
    currentConversation = [];
    projectData = {
        currentlyAsking: null,
        answeredQuestions: new Set()
    };
    currentWorkflowData = null;
    currentTaskBeingEdited = null;
    currentRegion = null;
    
    // Hide workflow section
    const workflowSection = document.getElementById('workflowSection');
    if (workflowSection) workflowSection.classList.add('hidden');
    
    const regionalControls = document.getElementById('regionalPricingControls');
    if (regionalControls) regionalControls.classList.add('hidden');
    
    const estimateBtn = document.getElementById('createEstimateBtn');
    if (estimateBtn) estimateBtn.classList.add('hidden');
    
    const exportBtn = document.getElementById('exportWorkflowBtn');
    if (exportBtn) exportBtn.classList.add('hidden');
    
    // Reset location selector
    const locationSelect = document.getElementById('locationSelect');
    if (locationSelect) {
        locationSelect.value = '';
        document.getElementById('costMultiplier').textContent = '1.00x';
        document.getElementById('marketFactors').innerHTML = 'Select location for market data';
    }
    
    console.log('✅ Project data completely reset for new analysis');
}

// API Utility Functions
async function callAPI(endpoint, method = 'GET', data = null) {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    console.log(`🌐 Making ${method} request to:`, url);
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };
    
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
        options.signal = controller.signal;
        
        const response = await fetch(url, options);
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ API Response:', result);
        return result;
        
    } catch (error) {
        console.error('❌ API Call Failed:', error);
        
        // Show user-friendly error message
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        } else if (error.message.includes('Failed to fetch')) {
            throw new Error('Cannot connect to API. Please check your internet connection or try again later.');
        } else {
            throw error;
        }
    }
}

// Test API connectivity
async function testAPIConnection() {
    try {
        console.log('🔍 Testing API connection...');
        const response = await callAPI('/api/health', 'GET');
        console.log('✅ API connection successful:', response);
        return true;
    } catch (error) {
        console.error('❌ API connection failed:', error);
        return false;
    }
}

// Analyze project and start AI conversation
function analyzeProject() {
    console.log('🚀 analyzeProject function called');
    
    const descriptionElement = document.getElementById('projectDescription');
    console.log('📝 Description element:', descriptionElement);
    
    if (!descriptionElement) {
        alert('Could not find project description field');
        return;
    }
    
    const description = descriptionElement.value.trim();
    console.log('📋 Description content:', description);
    
    if (!description) {
        alert('Please enter a project description first.');
        return;
    }
    
    // CRITICAL: Reset ALL previous project data
    resetProjectData();
    
    // Clear conversation messages
    document.getElementById('conversationMessages').innerHTML = '';
    
    // Hide response options
    document.getElementById('quickResponses').classList.add('hidden');
    document.getElementById('responseInput').classList.add('hidden');
    
    // Show conversation panel
    document.getElementById('aiConversation').classList.remove('hidden');
    
    // Start AI analysis
    startAIAnalysis(description);
}

async function startAIAnalysis(description) {
    // Add initial AI message
    addAIMessage("🧠 Analyzing your project description...", true);
    
    try {
        // First test API connectivity
        const isConnected = await testAPIConnection();
        if (!isConnected) {
            throw new Error('Cannot connect to FireAPI. Falling back to local analysis.');
        }
        
        // Make real API call to analyze the project
        addAIMessage("🔗 Connected to FireAPI.dev - Running AI analysis...", true);
        
        const analysisRequest = {
            description: description,
            options: {
                location: currentRegion || 'US-national-average',
                includeWorkflow: true,
                includeCosts: true
            }
        };
        
        const apiResponse = await callAPI(API_CONFIG.endpoints.completeAnalysis, 'POST', analysisRequest);
        
        if (apiResponse.success) {
            // Use real API response
            projectData = {
                ...apiResponse.data,
                originalDescription: description
            };
            
            // Store workflow data for visualization
            currentWorkflowData = apiResponse.data.workflow;
            
            addAIMessage("✅ AI analysis completed! I've analyzed your project and generated an optimized workflow.", true);
            
            // Show the workflow visualization
            if (currentWorkflowData) {
                displayWorkflowVisualization(currentWorkflowData);
            }
            
            // Continue with AI questioning based on real analysis
            continueAIAnalysis();
            
        } else {
            throw new Error(apiResponse.message || 'API analysis failed');
        }
        
    } catch (error) {
        console.warn('⚠️ API analysis failed, falling back to local simulation:', error);
        
        // Fallback to local analysis if API fails
        addAIMessage(`⚠️ ${error.message} Using local simulation instead.`, true);
        
        setTimeout(() => {
            // Parse the project description locally
            const analysis = parseProjectDescription(description);
            projectData = { ...analysis, originalDescription: description };
            
            // Continue with AI questioning
            continueAIAnalysis();
        }, 1000);
    }
}

function parseProjectDescription(description) {
    const lowerDesc = description.toLowerCase();
    
    // Detect project type with proper logic
    const isSecondarySuite = (lowerDesc.includes('apartment') || lowerDesc.includes('secondary suite') || lowerDesc.includes('suite') || 
                           lowerDesc.includes('fire separation') || lowerDesc.includes('fire rated') || lowerDesc.includes('tenant') ||
                           lowerDesc.includes('occupancy permit') || lowerDesc.includes('multi-unit')) && 
                           !(lowerDesc.includes('kitchen renovation') || lowerDesc.includes('kitchen remodel') || 
                           lowerDesc.includes('cabinetry') || lowerDesc.includes('countertop'));
    
    // Detect kitchen renovation specifically
    const isKitchenReno = lowerDesc.includes('kitchen') && (lowerDesc.includes('cabinetry') || lowerDesc.includes('countertop') || 
                        lowerDesc.includes('backsplash') || lowerDesc.includes('cabinet') || lowerDesc.includes('renovation') || 
                        lowerDesc.includes('remodel')) && !isSecondarySuite;
    
    // Extract square footage
    const sqftMatch = description.match(/(\d+)\s*sq\s*ft/i) || description.match(/(\d+)\s*sqft/i);
    const sqft = sqftMatch ? parseInt(sqftMatch[1]) : 1320;
    
    // Extract ceiling height
    const ceilingMatch = description.match(/(\d+)\s*foot\s*ceiling/i) || description.match(/(\d+)\s*ft\s*ceiling/i);
    const ceilings = ceilingMatch ? `${ceilingMatch[1]} foot` : '8 foot';
    
    // Detect rooms and features from description
    const detectedRooms = [];
    const detectedFeatures = [];
    const fireFeatures = [];
    
    if (lowerDesc.includes('bathroom')) detectedRooms.push('bathroom');
    if (lowerDesc.includes('bedroom')) detectedRooms.push('bedroom');
    if (lowerDesc.includes('kitchen')) {
        detectedRooms.push('kitchen');
        detectedFeatures.push('kitchen appliances');
    }
    
    // Fire safety features detection
    if (lowerDesc.includes('fire rated door') || lowerDesc.includes('fire-rated door')) {
        fireFeatures.push('fire-rated doors');
    }
    if (lowerDesc.includes('fire separation')) {
        fireFeatures.push('fire separation assembly');
    }
    if (lowerDesc.includes('double layer drywall') || lowerDesc.includes('5/8') || lowerDesc.includes('double 5/8')) {
        fireFeatures.push('double 5/8" fire-rated drywall');
    }
    
    // Standard features detection
    if (lowerDesc.includes('shower')) detectedFeatures.push('stand up shower');
    if (lowerDesc.includes('toilet')) detectedFeatures.push('toilet');
    if (lowerDesc.includes('vanity')) detectedFeatures.push('vanity');
    if (lowerDesc.includes('egress window')) detectedFeatures.push('egress window');
    if (lowerDesc.includes('drywall ceiling')) detectedFeatures.push('drywall ceiling');
    if (lowerDesc.includes('bulk head') || lowerDesc.includes('bulkhead')) detectedFeatures.push('bulk heads');
    if (lowerDesc.includes('pot lights') || lowerDesc.includes('portlights')) detectedFeatures.push('pot lights');
    if (lowerDesc.includes('hvac')) detectedFeatures.push('HVAC');
    if (lowerDesc.includes('laminate flooring')) detectedFeatures.push('laminate flooring');
    if (lowerDesc.includes('dry ease') || lowerDesc.includes('dryease')) detectedFeatures.push('DryEase subfloor');
    if (lowerDesc.includes('paint')) detectedFeatures.push('paint');
    if (lowerDesc.includes('baseboard')) detectedFeatures.push('baseboard');
    
    let projectType = 'general renovation';
    if (isSecondarySuite) projectType = 'secondary suite conversion';
    else if (isKitchenReno) projectType = 'kitchen renovation';
    else if (lowerDesc.includes('basement') && lowerDesc.includes('bedroom')) projectType = 'basement retrofit';
    
    const analysis = {
        projectType: projectType,
        isSecondarySuite: isSecondarySuite,
        isKitchenReno: isKitchenReno,
        sqft: sqft,
        ceilings: ceilings,
        currentStage: lowerDesc.includes('rough') ? 'rough-in construction' : 'planning',
        rooms: detectedRooms.length > 0 ? detectedRooms : ['bathroom', 'bedroom'],
        features: detectedFeatures.length > 0 ? detectedFeatures : ['basic finishes'],
        fireFeatures: fireFeatures,
        requiresFireSeparation: fireFeatures.length > 0 || isSecondarySuite,
        missingInfo: []
    };
    
    // Identify missing critical information for optimal sequencing
    const possibleQuestions = [];
    
    // For secondary suites, ask about fire safety compliance
    if (isSecondarySuite) {
        if (!lowerDesc.includes('fire marshal') && !lowerDesc.includes('fire department')) {
            possibleQuestions.push('fire_marshal_approval');
        }
        if (!lowerDesc.includes('building official') && !lowerDesc.includes('occupancy')) {
            possibleQuestions.push('occupancy_requirements');
        }
    }
    
    // Always ask about permits unless explicitly mentioned
    if (!description.toLowerCase().includes('permit') && !description.toLowerCase().includes('approval')) {
        possibleQuestions.push('permits');
    }
    
    // Always ask about budget unless specific amounts mentioned
    if (!description.toLowerCase().includes('budget') && !description.toLowerCase().includes('cost') && !description.toLowerCase().includes('$')) {
        possibleQuestions.push('budget');
    }
    
    // Always ask about timeline unless dates mentioned
    if (!description.toLowerCase().includes('timeline') && !description.toLowerCase().includes('schedule') && !description.toLowerCase().includes('deadline') && !description.toLowerCase().includes('month') && !description.toLowerCase().includes('week')) {
        possibleQuestions.push('timeline');
    }
    
    // Always ask about team size unless specifically mentioned
    if (!description.toLowerCase().includes('contractor') && !description.toLowerCase().includes('team') && !description.toLowerCase().includes('worker') && !description.toLowerCase().includes('crew')) {
        possibleQuestions.push('team_size');
    }
    
    // Ensure we always have at least 2 questions for proper AI demonstration
    if (possibleQuestions.length === 0) {
        // If all info seems present, still ask key optimization questions
        possibleQuestions.push('team_size', 'timeline');
    } else if (possibleQuestions.length === 1) {
        // Add one more question for better demo experience
        const additionalQuestions = ['permits', 'budget', 'timeline', 'team_size'];
        const missing = additionalQuestions.find(q => !possibleQuestions.includes(q));
        if (missing) possibleQuestions.push(missing);
    }
    
    // Randomize question order for variety
    analysis.missingInfo = possibleQuestions.sort(() => Math.random() - 0.5);
    
    // Limit to maximum 2-3 questions to avoid overwhelming
    if (analysis.missingInfo.length > 3) {
        analysis.missingInfo = analysis.missingInfo.slice(0, 3);
    }
    
    // Debug logging
    console.log('parseProjectDescription result:', analysis);
    console.log('possibleQuestions found:', possibleQuestions);
    console.log('Fire features detected:', fireFeatures);
    console.log('Is secondary suite:', isSecondarySuite);
    
    return analysis;
}

function continueAIAnalysis() {
    let projectTypeDisplay = "general renovation project";
    let criticalNote = "";
    
    if (projectData.isSecondarySuite) {
        projectTypeDisplay = "🏠 **SECONDARY SUITE CONVERSION**";
        criticalNote = "\n\n🔥 **CRITICAL**: This is a multi-unit residential project with mandatory fire separation requirements!";
    } else if (projectData.isKitchenReno) {
        projectTypeDisplay = "👨‍🍳 **KITCHEN RENOVATION**";
        criticalNote = "\n\n🏗️ **SCOPE**: Complete kitchen remodel with cabinetry, countertops, appliances, and finishes";
    } else if (projectData.projectType === 'basement retrofit') {
        projectTypeDisplay = "🏠 **BASEMENT RETROFIT**";
        criticalNote = "\n\n🛠️ **SCOPE**: Basement finishing with new living spaces and code compliance";
    }
    
    addAIMessage(`✅ Project analysis complete! I can see this is a comprehensive ${projectTypeDisplay}.${criticalNote}`);
    
    setTimeout(() => {
        let summaryMessage = `📋 **Project Summary:**
- **Type:** ${projectData.projectType} (${projectData.sqft} sqft, ${projectData.ceilings} ceilings)
- **Current Stage:** ${projectData.currentStage}`;
        
        if (projectData.rooms.length > 0) {
            summaryMessage += `\n- **New Spaces:** ${projectData.rooms.join(', ')}`;
        }
        
        if (projectData.features.length > 0) {
            summaryMessage += `\n- **Features:** ${projectData.features.join(', ')}`;
        }
        
        if (projectData.fireFeatures.length > 0) {
            summaryMessage += `\n- **🔥 Fire Safety Requirements:** ${projectData.fireFeatures.join(', ')}`;
        }
        
        if (projectData.isSecondarySuite) {
            summaryMessage += `\n- **🚨 Code Compliance:** Multi-unit residential, occupancy permit required`;
        }
        
        addAIMessage(summaryMessage);
        
        setTimeout(() => {
            // Debug logging
            console.log('Missing info questions:', projectData.missingInfo);
            console.log('About to start asking questions');
            
            // Ensure we have questions to ask
            if (!projectData.missingInfo || projectData.missingInfo.length === 0) {
                console.log('No questions found, adding fallback questions');
                projectData.missingInfo = ['team_size', 'timeline'];
            }
            
            // Ensure answered questions set exists
            projectData.answeredQuestions = projectData.answeredQuestions || new Set();
            
            // Ask the first question immediately after this message
            addAIMessage("🎯 Now I need a few more details to generate the most optimized construction sequence for your project...");
            
            // Ask questions immediately - call directly without setTimeout to avoid timing issues
            setTimeout(() => {
                console.log('Calling askClarifyingQuestions now');
                
                // Force ask a simple question directly if the function fails
                try {
                    askClarifyingQuestions();
                } catch (error) {
                    console.error('Error in askClarifyingQuestions:', error);
                    // Fallback: ask question directly
                    const defaultQuestion = projectData.isSecondarySuite ? 
                        "🔥 Have you confirmed fire marshal approval is included in your building permit? This is required for secondary suites." :
                        "🤔 How many workers will be on this project? This affects parallel task optimization.";
                    addAIMessage(defaultQuestion);
                    showResponseOptions('team_size');
                }
            }, 800);
            
        }, 1500); // Reduced delay to 1.5s
    }, 1000);
}

function askClarifyingQuestions() {
    console.log('🚀 askClarifyingQuestions function called!');
    
    // Use simple, static questions to avoid any object generation issues
    const questions = {
        permits: "Do you have all necessary permits for the bedroom (egress window) and bathroom (plumbing/electrical)?",
        budget: "What's your budget range for this project? This helps me optimize material and labor sequencing.",
        timeline: "Do you have a target completion date or any scheduling constraints?",
        team_size: "How many workers will be on this project? This affects parallel task optimization."
    };
    
    // Debug logging
    console.log('askClarifyingQuestions called');
    console.log('projectData.missingInfo:', projectData.missingInfo);
    console.log('projectData.answeredQuestions:', projectData.answeredQuestions);
    
    // Filter out already answered questions
    const unansweredQuestions = projectData.missingInfo.filter(q => 
        !projectData.answeredQuestions.has(q) && questions[q]
    );
    
    console.log('unansweredQuestions:', unansweredQuestions);
    
    if (unansweredQuestions.length === 0) {
        // No more questions, proceed to generation
        console.log('No unanswered questions, proceeding to generation');
        addAIMessage("✅ Perfect! I have all the information needed. Let me generate your optimized construction sequence...");
        setTimeout(generateConstructionSequence, 2000);
        return;
    }
    
    const nextQuestion = unansweredQuestions[0];
    const question = questions[nextQuestion];
    
    // Prevent asking the same question if already asking
    if (projectData.currentlyAsking === nextQuestion) {
        console.log('Already asking this question, skipping to prevent loop');
        // Force move to next question to avoid infinite loop
        projectData.missingInfo.shift();
        setTimeout(askClarifyingQuestions, 1000);
        return;
    }
    
    // Update missing info to only include unanswered questions
    projectData.missingInfo = unansweredQuestions;
    projectData.currentlyAsking = nextQuestion;
    
    console.log(`Asking question: ${nextQuestion} - ${question}`);
    
    addAIMessage(`🤔 I need some additional details to optimize your construction sequence:\n\n**${question}**`);
    
    // Show response options based on question type
    showResponseOptions(nextQuestion);
    
    console.log('✅ Question asked successfully, response options should be visible');
}

function showResponseOptions(questionType) {
    const quickResponses = document.getElementById('quickResponses');
    const responseInput = document.getElementById('responseInput');
    
    // Clear previous options
    quickResponses.innerHTML = '';
    quickResponses.classList.add('hidden');
    responseInput.classList.add('hidden');
    
    const options = {
        permits: [
            { text: "Yes, all permits obtained", value: "permits_yes" },
            { text: "Still need permits", value: "permits_no" },
            { text: "Not sure", value: "permits_unknown" }
        ],
        budget: [
            { text: "$15K - $25K", value: "budget_low" },
            { text: "$25K - $50K", value: "budget_mid" },
            { text: "$50K+", value: "budget_high" }
        ],
        timeline: [
            { text: "ASAP", value: "timeline_asap" },
            { text: "2-3 months", value: "timeline_normal" },
            { text: "Flexible", value: "timeline_flexible" }
        ],
        team_size: [
            { text: "2-3 workers", value: "team_small" },
            { text: "4-6 workers", value: "team_medium" },
            { text: "Large crew (6+)", value: "team_large" }
        ],
        fire_marshal_approval: [
            { text: "Yes, fire marshal approval included", value: "fire_marshal_yes" },
            { text: "Need to add fire marshal review", value: "fire_marshal_no" },
            { text: "Not sure what's required", value: "fire_marshal_unknown" }
        ],
        occupancy_requirements: [
            { text: "Yes, understand occupancy permit needed", value: "occupancy_yes" },
            { text: "Need help with occupancy requirements", value: "occupancy_no" },
            { text: "What's an occupancy permit?", value: "occupancy_unknown" }
        ]
    };
    
    // Show quick responses if available for this question type
    if (options[questionType]) {
        options[questionType].forEach(option => {
            const button = document.createElement('button');
            button.className = 'bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors';
            button.textContent = option.text;
            button.onclick = () => handleQuickResponse(option.value, option.text);
            quickResponses.appendChild(button);
        });
        
        // Add "Other" button to allow custom text input
        const otherButton = document.createElement('button');
        otherButton.className = 'bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors border-2 border-gray-300';
        otherButton.textContent = 'Other (type answer)';
        otherButton.onclick = () => showTextInput();
        quickResponses.appendChild(otherButton);
        
        quickResponses.classList.remove('hidden');
    } else {
        // No predefined options, show text input directly
        responseInput.classList.remove('hidden');
    }
}

function showTextInput() {
    // Hide quick responses and show text input
    document.getElementById('quickResponses').classList.add('hidden');
    document.getElementById('responseInput').classList.remove('hidden');
    
    // Focus on the text input
    const textInput = document.getElementById('userResponse');
    if (textInput) {
        textInput.focus();
        textInput.placeholder = 'Type your answer here...';
    }
}

function handleQuickResponse(value, text) {
    // Add user response to conversation
    addUserMessage(text);
    
    // Store the response
    const [category] = value.split('_');
    projectData[category] = value;
    
    // Mark this question as answered
    const currentQuestion = projectData.currentlyAsking || projectData.missingInfo[0];
    if (currentQuestion) {
        projectData.answeredQuestions.add(currentQuestion);
        // Remove the answered question
        projectData.missingInfo = projectData.missingInfo.filter(item => item !== currentQuestion);
        projectData.currentlyAsking = null; // Clear the currently asking flag
    }
    
    // Hide response options
    document.getElementById('quickResponses').classList.add('hidden');
    document.getElementById('responseInput').classList.add('hidden');
    
    // Add confirmation message
    addAIMessage(`👍 Got it! ${text}`);
    
    // Continue with next question or generate sequence
    setTimeout(() => {
        if (projectData.missingInfo.length > 0) {
            askClarifyingQuestions();
        } else {
            addAIMessage("✅ Perfect! I have all the information needed. Let me generate your optimized construction sequence...");
            setTimeout(generateConstructionSequence, 2000);
        }
    }, 1500);
}

function submitResponse() {
    const input = document.getElementById('userResponse');
    const response = input.value.trim();
    
    if (!response) return;
    
    addUserMessage(response);
    input.value = '';
    
    // Store the response for the current question - use same logic as handleQuickResponse
    const currentQuestion = projectData.currentlyAsking || projectData.missingInfo[0];
    if (currentQuestion) {
        projectData[currentQuestion] = response;
        projectData.answeredQuestions.add(currentQuestion); // Add to answered questions tracking
        // Remove the answered question
        projectData.missingInfo = projectData.missingInfo.filter(item => item !== currentQuestion);
        projectData.currentlyAsking = null; // Clear the currently asking flag
    }
    
    // Hide response options
    document.getElementById('quickResponses').classList.add('hidden');
    document.getElementById('responseInput').classList.add('hidden');
    
    // Process the response - use same confirmation message style as quick response
    setTimeout(() => {
        addAIMessage(`👍 Got it! ${response}`);
        
        // Move to next question or generate sequence - same timing as quick response
        setTimeout(() => {
            if (projectData.missingInfo.length > 0) {
                askClarifyingQuestions();
            } else {
                addAIMessage("✅ Perfect! I have all the information needed. Let me generate your optimized construction sequence...");
                setTimeout(generateConstructionSequence, 2000);
            }
        }, 1500);
    }, 800);
}

function addAIMessage(message, loading = false) {
    const container = document.getElementById('conversationMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex items-start space-x-3';
    
    messageDiv.innerHTML = `
        <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
            <i class="fas fa-brain text-white text-sm"></i>
        </div>
        <div class="flex-1">
            <div class="bg-primary-50 rounded-lg p-4 border border-primary-200">
                ${loading ? '<div class="flex items-center"><i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...</div>' : `<div class="text-sm text-primary-900 whitespace-pre-line">${message}</div>`}
            </div>
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    
    if (loading) {
        setTimeout(() => {
            messageDiv.querySelector('.bg-primary-50').innerHTML = `<div class="text-sm text-primary-900 whitespace-pre-line">${message}</div>`;
        }, 2000);
    }
}

function addUserMessage(message) {
    const container = document.getElementById('conversationMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex items-start space-x-3 justify-end';
    
    messageDiv.innerHTML = `
        <div class="flex-1 text-right">
            <div class="bg-gray-100 rounded-lg p-4 border border-gray-200 inline-block">
                <div class="text-sm text-gray-900">${message}</div>
            </div>
        </div>
        <div class="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            <i class="fas fa-user text-white text-sm"></i>
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function generateConstructionSequence() {
    // Show the workflow section
    document.getElementById('workflowSection').classList.remove('hidden');
    
    // Generate detailed construction sequence based on project type
    let sequence;
    if (projectData.isSecondarySuite) {
        sequence = generateSecondarySuiteSequence(projectData);
    } else if (projectData.isKitchenReno) {
        sequence = generateKitchenRenovationSequence(projectData);
    } else {
        sequence = generateBasementRetrofitSequence(projectData);
    }
    
    // Display the workflow
    displayWorkflowVisualization(sequence);
    displayTimelineView(sequence);
    
    // Add final AI message
    addAIMessage(`🎯 **Construction sequence generated!** 
    
I've created a 23-step optimized sequence for your basement retrofit project. The AI identified 6 parallel task opportunities that will save you approximately **12 days** and **$8,400** compared to traditional sequential scheduling.

**Key Optimizations:**
- Bathroom rough-in runs parallel with bedroom framing
- HVAC and electrical can be coordinated efficiently  
- Flooring installation optimized for room sequence
- Bulk head construction integrated with ceiling work

Scroll down to see the complete visual workflow and timeline!`);
}

// Interactive Demo Sequence Generator (keeping original for other demos)
function generateSequence() {
    // This is now used for non-AI demo projects
    const workflow = {
        name: 'Sample Kitchen Remodel',
        nodes: [
            { id: 'design', task: 'Design & Planning', x: 50, y: 50, duration: 5, dependencies: [], status: 'completed' },
            { id: 'demo', task: 'Demolition', x: 250, y: 50, duration: 2, dependencies: ['design'], status: 'in-progress' }
        ]
    };
    
    document.getElementById('workflowSection').classList.remove('hidden');
    displayWorkflowVisualization(workflow);
}

function showProcessingState() {
    document.getElementById('processingStatus').classList.remove('hidden');
    document.getElementById('optimizationSummary').classList.add('hidden');
    
    // Clear previous content
    document.getElementById('workflowNodes').innerHTML = '<div class="text-center py-16"><i class="fas fa-cog fa-spin text-4xl text-primary-600 mb-4"></i><p class="text-gray-600">AI optimizing workflow...</p></div>';
    document.getElementById('timelineView').innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-3xl text-gray-400 mb-2"></i><p class="text-gray-500">Generating timeline...</p></div>';
}

function hideProcessingState() {
    document.getElementById('processingStatus').classList.add('hidden');
}

function generateSecondarySuiteSequence(projectData) {
    return {
        name: `Secondary Suite Conversion - ${projectData.sqft} sqft`,
        totalDays: 72, // Extended for fire safety compliance
        nodes: [
            // Planning & Permits (Days 1-14) - More complex for secondary suite
            { id: 'permits-approval', task: 'Secondary Suite Building Permits', x: 50, y: 50, duration: 14, dependencies: [], status: 'completed', details: 'Building permits for secondary suite with fire separation, kitchen, egress, and occupancy requirements', pricing: { labor: 0, materials: 0, equipment: 0, permits: 2500 } },
            
            // Fire Safety Rough-in (Days 15-25) - CRITICAL for multi-unit
            { id: 'fire-separation-framing', task: 'Fire Separation Framing', x: 250, y: 50, duration: 4, dependencies: ['permits-approval'], status: 'in-progress', details: 'Frame fire separation assembly between units with proper fire-rated materials', pricing: { labor: 2200, materials: 1800, equipment: 300, permits: 0 } },
            { id: 'electrical-rough', task: 'Electrical Rough-in + Fire Alarm', x: 450, y: 50, duration: 4, dependencies: ['fire-separation-framing'], status: 'pending', details: 'Electrical rough-in PLUS interconnected smoke/CO detectors for multi-unit safety', pricing: { labor: 3200, materials: 1500, equipment: 400, permits: 0 } },
            { id: 'plumbing-rough', task: 'Plumbing Rough-in (Kitchen + Bath)', x: 650, y: 50, duration: 5, dependencies: ['fire-separation-framing'], status: 'pending', details: 'Kitchen and bathroom plumbing with proper venting for secondary suite', pricing: { labor: 3800, materials: 2200, equipment: 500, permits: 0 } },
            { id: 'hvac-rough', task: 'HVAC + Separate Utilities', x: 850, y: 50, duration: 4, dependencies: ['fire-separation-framing'], status: 'pending', details: 'Separate HVAC system for secondary suite with independent controls' },
            
            // Specialized Framing (Days 20-28)
            { id: 'bedroom-framing', task: 'Bedroom Framing + Egress', x: 50, y: 150, duration: 3, dependencies: ['electrical-rough'], status: 'pending', details: 'Frame bedroom with code-compliant egress window for life safety' },
            { id: 'bathroom-framing', task: 'Bathroom Framing', x: 250, y: 150, duration: 2, dependencies: ['plumbing-rough'], status: 'pending', details: 'Frame bathroom with proper ventilation requirements' },
            { id: 'kitchen-framing', task: 'Kitchen Framing + Ventilation', x: 450, y: 150, duration: 3, dependencies: ['plumbing-rough'], status: 'pending', details: 'Frame kitchen with proper ventilation and fire safety clearances' },
            { id: 'fire-rated-door-rough', task: 'Fire-Rated Door Openings', x: 650, y: 150, duration: 2, dependencies: ['fire-separation-framing'], status: 'pending', details: 'Prepare openings for fire-rated entrance door and separation door' },
            { id: 'egress-window', task: 'Egress Window Installation', x: 850, y: 150, duration: 2, dependencies: ['bedroom-framing'], status: 'pending', details: 'Install code-compliant egress window for bedroom life safety' },
            
            // CRITICAL: Rough-in Inspection (Day 29) - More comprehensive for secondary suite
            { id: 'rough-inspection', task: 'Multi-Unit Rough-in Inspection', x: 450, y: 250, duration: 1, dependencies: ['electrical-rough', 'plumbing-rough', 'hvac-rough', 'bathroom-framing', 'kitchen-framing', 'egress-window', 'fire-rated-door-rough'], status: 'pending', details: 'Comprehensive inspection: electrical, plumbing, HVAC, fire separation, egress compliance, smoke detector placement' },
            
            // Fire-Rated Insulation & Barriers (Days 30-36) - Specialized for fire separation
            { id: 'fire-rated-insulation', task: 'Fire-Rated Insulation Assembly', x: 50, y: 350, duration: 3, dependencies: ['rough-inspection'], status: 'pending', details: 'Install fire-rated insulation in separation assembly per code requirements' },
            { id: 'vapor-barrier-installation', task: 'Vapor Barrier + Fire Stopping', x: 250, y: 350, duration: 2, dependencies: ['fire-rated-insulation'], status: 'pending', details: 'Vapor barrier installation with proper fire-stopping at all penetrations' },
            { id: 'ceiling-insulation', task: 'Ceiling Insulation + Fire Rating', x: 450, y: 350, duration: 3, dependencies: ['rough-inspection'], status: 'pending', details: 'Ceiling insulation with fire-rated assembly requirements' },
            
            // CRITICAL: Fire Safety Inspection (Day 37)
            { id: 'fire-safety-inspection', task: 'Fire Safety/Pre-Drywall Inspection', x: 650, y: 350, duration: 1, dependencies: ['fire-rated-insulation', 'vapor-barrier-installation', 'ceiling-insulation'], status: 'pending', details: 'Inspector verifies fire separation assembly, fire stopping, and insulation compliance - "Approved to close up"' },
            
            // Fire-Rated Drywall Phase (Days 38-48) - Double layer 5/8" required
            { id: 'fire-rated-drywall-layer1', task: 'Fire Separation - First Layer 5/8"', x: 50, y: 450, duration: 3, dependencies: ['fire-safety-inspection'], status: 'pending', details: 'First layer of 5/8" fire-rated drywall on fire separation assembly', pricing: { labor: 2800, materials: 2200, equipment: 300, permits: 0 } },
            { id: 'fire-rated-drywall-layer2', task: 'Fire Separation - Second Layer 5/8"', x: 250, y: 450, duration: 3, dependencies: ['fire-rated-drywall-layer1'], status: 'pending', details: 'Second layer of 5/8" fire-rated drywall with staggered joints for fire rating', pricing: { labor: 3200, materials: 2400, equipment: 200, permits: 0 } },
            { id: 'ceiling-drywall', task: 'Fire-Rated Ceiling Drywall', x: 450, y: 450, duration: 4, dependencies: ['fire-safety-inspection'], status: 'pending', details: 'Install fire-rated ceiling drywall and bulk heads (140 LF) per fire assembly requirements' },
            { id: 'standard-wall-drywall', task: 'Standard Wall Drywall', x: 650, y: 450, duration: 4, dependencies: ['fire-rated-drywall-layer2'], status: 'pending', details: 'Standard drywall installation on non-fire-rated walls' },
            
            // Fire-Rated Doors & Hardware (Days 45-50)
            { id: 'fire-rated-door-install', task: 'Fire-Rated Door Installation', x: 850, y: 450, duration: 2, dependencies: ['fire-rated-drywall-layer2'], status: 'pending', details: 'Install fire-rated entrance door with proper hardware, closer, and seals', pricing: { labor: 800, materials: 1800, equipment: 100, permits: 0 } },
            
            // Flooring & Subfloor (Days 49-55) - Can run parallel with upper level protection
            { id: 'fire-protective-subfloor', task: 'Fire-Protective Subfloor System', x: 50, y: 550, duration: 3, dependencies: ['ceiling-drywall'], status: 'pending', details: 'DryEase subfloor with fire-resistant backing for upper floor protection' },
            { id: 'bathroom-waterproofing', task: 'Bathroom Fire-Safe Waterproofing', x: 250, y: 550, duration: 2, dependencies: ['standard-wall-drywall'], status: 'pending', details: 'Fire-safe waterproof membrane for bathroom with secondary suite requirements' },
            
            // Kitchen & Electrical Systems (Days 52-58)
            { id: 'kitchen-electrical-rough', task: 'Kitchen Electrical + Fire Safety', x: 450, y: 550, duration: 3, dependencies: ['standard-wall-drywall'], status: 'pending', details: 'Kitchen electrical with GFCI, dedicated circuits, and fire safety disconnect requirements' },
            { id: 'fire-alarm-system', task: 'Interconnected Fire Alarm System', x: 650, y: 550, duration: 2, dependencies: ['ceiling-drywall'], status: 'pending', details: 'Install and test interconnected smoke/CO detectors between units' },
            
            // Kitchen Installation (Days 56-62)
            { id: 'kitchen-cabinets', task: 'Kitchen Cabinets + Fire Clearances', x: 50, y: 650, duration: 3, dependencies: ['kitchen-electrical-rough', 'fire-protective-subfloor'], status: 'pending', details: 'Kitchen cabinets with proper fire clearances from separation wall', pricing: { labor: 2400, materials: 8500, equipment: 200, permits: 0 } },
            { id: 'kitchen-appliances', task: 'Kitchen Appliances + OTR Vent', x: 250, y: 650, duration: 2, dependencies: ['kitchen-cabinets'], status: 'pending', details: 'Stove, dishwasher, fridge, OTR vent with proper fire-safe installation', pricing: { labor: 1200, materials: 4500, equipment: 300, permits: 0 } },
            
            // Bathroom & Finishes (Days 60-66)
            { id: 'laminate-flooring', task: 'Fire-Safe Laminate Flooring', x: 450, y: 650, duration: 4, dependencies: ['fire-protective-subfloor', 'bathroom-waterproofing'], status: 'pending', details: 'Install fire-safe laminate flooring throughout secondary suite' },
            { id: 'bathroom-fixtures', task: 'Bathroom Fixture Installation', x: 650, y: 650, duration: 3, dependencies: ['bathroom-waterproofing'], status: 'pending', details: 'Install shower, toilet, vanity with secondary suite plumbing requirements' },
            
            // Final Systems & Paint (Days 64-68)
            { id: 'pot-lights-install', task: 'Pot Lights + Fire Safety', x: 50, y: 750, duration: 2, dependencies: ['ceiling-drywall'], status: 'pending', details: 'Install pot lights with fire-rated housing where required' },
            { id: 'hvac-final', task: 'HVAC Final + Independent Controls', x: 250, y: 750, duration: 2, dependencies: ['ceiling-drywall'], status: 'pending', details: 'Complete HVAC with independent controls for secondary suite' },
            { id: 'fire-safe-painting', task: 'Fire-Safe Prime & Paint', x: 450, y: 750, duration: 3, dependencies: ['pot-lights-install', 'hvac-final'], status: 'pending', details: 'Prime and paint with fire-safe products throughout suite' },
            
            // Final Trim & Hardware (Days 67-70)
            { id: 'trim-baseboard', task: 'Trim & 5.25" Baseboard', x: 650, y: 750, duration: 2, dependencies: ['fire-safe-painting', 'laminate-flooring'], status: 'pending', details: 'Install baseboards and trim with fire-safe materials' },
            { id: 'final-electrical', task: 'Final Electrical + Testing', x: 850, y: 750, duration: 1, dependencies: ['fire-safe-painting'], status: 'pending', details: 'Install outlets, switches, and test all electrical including fire alarm system' },
            
            // Final Inspections (Days 70-72) - Comprehensive for secondary suite
            { id: 'fire-separation-inspection', task: 'Fire Separation Final Inspection', x: 250, y: 850, duration: 1, dependencies: ['fire-rated-door-install', 'final-electrical'], status: 'pending', details: 'Final fire separation assembly inspection and fire door testing', pricing: { labor: 0, materials: 0, equipment: 0, permits: 450 } },
            { id: 'occupancy-inspection', task: 'Secondary Suite Occupancy Inspection', x: 450, y: 850, duration: 1, dependencies: ['kitchen-appliances', 'bathroom-fixtures', 'fire-alarm-system', 'trim-baseboard'], status: 'pending', details: 'Final occupancy inspection for secondary suite including all life safety systems', pricing: { labor: 0, materials: 0, equipment: 0, permits: 650 } },
            { id: 'final-approval', task: 'Certificate of Occupancy', x: 350, y: 950, duration: 1, dependencies: ['fire-separation-inspection', 'occupancy-inspection'], status: 'pending', details: 'Final approval and certificate of occupancy for legal secondary suite', pricing: { labor: 0, materials: 0, equipment: 0, permits: 350 } }
        ],
        optimizations: {
            parallelTasks: [
                ['electrical-rough', 'plumbing-rough', 'hvac-rough'],
                ['bedroom-framing', 'bathroom-framing', 'kitchen-framing'],
                ['fire-rated-insulation', 'ceiling-insulation'],
                ['kitchen-electrical-rough', 'fire-alarm-system'],
                ['pot-lights-install', 'hvac-final']
            ],
            criticalPath: ['permits-approval', 'fire-separation-framing', 'plumbing-rough', 'rough-inspection', 'fire-rated-insulation', 'fire-safety-inspection', 'fire-rated-drywall-layer1', 'fire-rated-drywall-layer2', 'kitchen-appliances', 'occupancy-inspection', 'final-approval'],
            timeSaved: 18,
            costSaved: 12600,
            insights: [
                '🔥 **FIRE SAFETY CRITICAL**: Double 5/8" fire-rated drywall required for unit separation - cannot be substituted',
                '🚨 **INSPECTION GATES**: Fire safety inspection is MANDATORY before any drywall closure - no exceptions',
                '🏠 **MULTI-UNIT REQUIREMENTS**: Interconnected smoke/CO detectors required between all units per life safety code',
                '🚪 **FIRE-RATED DOORS**: Entrance door must be fire-rated with proper closer and seals for unit separation',
                '⚡ **ELECTRICAL SEPARATION**: Independent electrical panels and fire alarm systems required for each unit',
                '🔧 **KITCHEN COMPLIANCE**: OTR vent and dedicated kitchen circuits required for secondary suite occupancy',
                '📋 **OCCUPANCY PERMIT**: Certificate of occupancy required before legal rental - all fire safety systems must pass'
            ]
        }
    };
}

function generateKitchenRenovationSequence(projectData) {
    return {
        name: 'Kitchen Renovation - Complete Remodel',
        totalDays: 28,
        nodes: [
            // Planning & Permits (Days 1-5)
            { id: 'permits-planning', task: 'Planning & Permits', x: 50, y: 50, duration: 3, dependencies: [], status: 'completed', details: 'Kitchen renovation permits and 3D design approval', pricing: { labor: 800, materials: 0, equipment: 0, permits: 450 } },
            
            // Demolition & Preparation (Days 4-7)
            { id: 'demolition', task: 'Kitchen Demolition', x: 250, y: 50, duration: 2, dependencies: ['permits-planning'], status: 'in-progress', details: 'Remove existing cabinetry, countertops, and backsplash tiles', pricing: { labor: 1200, materials: 200, equipment: 300, permits: 0 } },
            { id: 'drywall-repair', task: 'Drywall Inspection & Repair', x: 450, y: 50, duration: 1, dependencies: ['demolition'], status: 'pending', details: 'Inspect and repair drywall after backsplash removal, check insulation and vapor barrier', pricing: { labor: 600, materials: 250, equipment: 50, permits: 0 } },
            
            // Rough-in Work (Days 8-12)
            { id: 'electrical-rough', task: 'Electrical Rough-in', x: 50, y: 150, duration: 2, dependencies: ['drywall-repair'], status: 'pending', details: 'Install 6 pot lights, dimmer switch, island plug/USB, dishwasher power source', pricing: { labor: 1800, materials: 950, equipment: 200, permits: 0 } },
            { id: 'plumbing-rough', task: 'Plumbing Rough-in', x: 250, y: 150, duration: 3, dependencies: ['drywall-repair'], status: 'pending', details: 'Relocate sink plumbing, dishwasher connection, fridge water source, hood vent modifications', pricing: { labor: 2400, materials: 800, equipment: 300, permits: 0 } },
            
            // Inspection (Day 13)
            { id: 'rough-inspection', task: 'Rough-in Inspection', x: 450, y: 150, duration: 1, dependencies: ['electrical-rough', 'plumbing-rough'], status: 'pending', details: 'Municipal inspection of electrical and plumbing rough-in work', pricing: { labor: 0, materials: 0, equipment: 0, permits: 275 } },
            
            // Cabinetry Installation (Days 14-18)
            { id: 'cabinet-installation', task: 'White Shaker Cabinetry', x: 50, y: 250, duration: 4, dependencies: ['rough-inspection'], status: 'pending', details: 'Install white shaker wood cabinets with soft-close hinges and under-mounted drawer slides per 3D rendering', pricing: { labor: 3200, materials: 12500, equipment: 400, permits: 0 } },
            { id: 'island-installation', task: 'Kitchen Island Installation', x: 250, y: 250, duration: 2, dependencies: ['cabinet-installation'], status: 'pending', details: 'Install kitchen island to seat 3-4 people with additional storage and seating space', pricing: { labor: 1600, materials: 4500, equipment: 200, permits: 0 } },
            
            // Countertops & Sink (Days 19-21)
            { id: 'countertop-install', task: 'Granite/Quartz Countertops', x: 450, y: 250, duration: 2, dependencies: ['island-installation'], status: 'pending', details: 'Level 1 granite or quartz countertops - client selection from 2000+ slabs at warehouse', pricing: { labor: 1200, materials: 5500, equipment: 300, permits: 0 } },
            { id: 'sink-install', task: 'Stainless Steel Sink', x: 650, y: 250, duration: 1, dependencies: ['countertop-install'], status: 'pending', details: 'Supply and install stainless steel sink with customer-supplied faucet', pricing: { labor: 400, materials: 650, equipment: 50, permits: 0 } },
            
            // Backsplash & Finishes (Days 22-25)
            { id: 'backsplash-install', task: '4x12 Glass Brick Backsplash', x: 50, y: 350, duration: 3, dependencies: ['sink-install'], status: 'pending', details: 'Install 4x12 glass brick style backsplash tiles ($4.75/sqft wholesale allowance)', pricing: { labor: 1800, materials: 1200, equipment: 150, permits: 0 } },
            { id: 'electrical-finish', task: 'Electrical Finish & Lighting', x: 250, y: 350, duration: 2, dependencies: ['backsplash-install'], status: 'pending', details: 'Complete pot light installation, dimmer switches, and electrical connections', pricing: { labor: 1000, materials: 300, equipment: 100, permits: 0 } },
            
            // Appliance Connections (Days 26-27)
            { id: 'appliance-connections', task: 'Appliance Connections', x: 450, y: 350, duration: 2, dependencies: ['electrical-finish'], status: 'pending', details: 'Connect dishwasher, install customer-supplied hood vent, complete plumbing connections per Ontario Building Code', pricing: { labor: 800, materials: 400, equipment: 100, permits: 0 } },
            
            // Final Cleanup & Walkthrough (Day 28)
            { id: 'cleanup-walkthrough', task: 'Site Cleanup & Walkthrough', x: 650, y: 350, duration: 1, dependencies: ['appliance-connections'], status: 'pending', details: 'Complete debris removal, detailed cleaning of kitchen and main level, final client walkthrough', pricing: { labor: 600, materials: 150, equipment: 100, permits: 0 } }
        ],
        optimizations: {
            parallelTasks: [
                ['electrical-rough', 'plumbing-rough'],
                ['cabinet-installation', 'electrical-rough'],
                ['countertop-install', 'sink-install'],
                ['backsplash-install', 'electrical-finish']
            ],
            criticalPath: ['permits-planning', 'demolition', 'drywall-repair', 'plumbing-rough', 'rough-inspection', 'cabinet-installation', 'island-installation', 'countertop-install', 'backsplash-install', 'appliance-connections', 'cleanup-walkthrough'],
            timeSaved: 8,
            costSaved: 4200,
            insights: [
                '🏗️ **DEMOLITION SEQUENCE**: Careful removal preserves existing drywall for inspection and repair',
                '⚡ **ELECTRICAL OPTIMIZATION**: Pot lights and island electrical can be coordinated with cabinet installation',
                '🔧 **PLUMBING EFFICIENCY**: Sink relocation and appliance connections sequenced to minimize disruption', 
                '🏠 **CABINET WORKFLOW**: White shaker installation follows 3D rendering specifications with quality hardware',
                '💎 **COUNTERTOP SELECTION**: Client warehouse visit for granite/quartz selection optimizes material lead time',
                '🎨 **BACKSPLASH ALLOWANCE**: $4.75/sqft wholesale cost allowance provides client flexibility while controlling costs',
                '🧹 **CLEANUP COORDINATION**: Thorough site preparation and final cleaning ensures professional completion'
            ]
        }
    };
}

function generateBasementRetrofitSequence(projectData) {
    return {
        name: 'Basement Retrofit - 1,320 sqft',
        totalDays: 52, // Extended to include proper inspection timing
        nodes: [
            // Planning & Permits (Days 1-7)
            { id: 'permits-approval', task: 'Building Permit Approval', x: 50, y: 50, duration: 7, dependencies: [], status: 'completed', details: 'Building permits for bedroom egress window and bathroom plumbing', pricing: { labor: 0, materials: 0, equipment: 0, permits: 1200 } },
            
            // Rough-in Work (Days 8-18) - All trades must complete BEFORE inspection
            { id: 'electrical-rough', task: 'Electrical Rough-in', x: 250, y: 50, duration: 3, dependencies: ['permits-approval'], status: 'in-progress', details: 'Rough electrical for bathroom, bedroom, and pot lights', pricing: { labor: 1800, materials: 650, equipment: 200, permits: 0 } },
            { id: 'plumbing-rough', task: 'Plumbing Rough-in', x: 450, y: 50, duration: 4, dependencies: ['permits-approval'], status: 'pending', details: 'Shower, toilet, vanity supply and drain lines', pricing: { labor: 2400, materials: 850, equipment: 300, permits: 0 } },
            { id: 'hvac-rough', task: 'HVAC Rough-in', x: 650, y: 50, duration: 3, dependencies: ['permits-approval'], status: 'pending', details: 'Ductwork for basement heating/cooling', pricing: { labor: 1500, materials: 1200, equipment: 400, permits: 0 } },
            
            // Framing & Windows (Days 12-18) - Before rough-in inspection
            { id: 'bedroom-framing', task: 'Bedroom Framing', x: 50, y: 150, duration: 3, dependencies: ['electrical-rough'], status: 'pending', details: 'Frame bedroom walls and egress window opening', pricing: { labor: 1200, materials: 800, equipment: 150, permits: 0 } },
            { id: 'bathroom-framing', task: 'Bathroom Framing', x: 250, y: 150, duration: 2, dependencies: ['plumbing-rough'], status: 'pending', details: 'Frame bathroom walls around plumbing', pricing: { labor: 800, materials: 450, equipment: 100, permits: 0 } },
            { id: 'egress-window', task: 'Egress Window Installation', x: 450, y: 150, duration: 2, dependencies: ['bedroom-framing'], status: 'pending', details: 'Cut opening and install code-compliant egress window', pricing: { labor: 800, materials: 1500, equipment: 250, permits: 0 } },
            
            // CRITICAL: Rough-in Inspection (Day 19)
            { id: 'rough-inspection', task: 'Rough-in Inspection', x: 650, y: 150, duration: 1, dependencies: ['electrical-rough', 'plumbing-rough', 'hvac-rough', 'bathroom-framing', 'egress-window'], status: 'pending', details: 'Inspector checks all rough-in work: electrical, plumbing, HVAC, framing, egress compliance', pricing: { labor: 0, materials: 0, equipment: 0, permits: 350 } },
            
            // Insulation & Vapor Barrier (Days 20-24) - Only after rough-in passes
            { id: 'complete-insulation', task: 'Complete Wall Insulation', x: 50, y: 250, duration: 2, dependencies: ['rough-inspection'], status: 'pending', details: 'Finish insulation to bottom of walls with vapor barrier', pricing: { labor: 800, materials: 950, equipment: 100, permits: 0 } },
            { id: 'ceiling-insulation', task: 'Ceiling Insulation', x: 250, y: 250, duration: 2, dependencies: ['rough-inspection'], status: 'pending', details: 'Insulate ceiling around HVAC ducts', pricing: { labor: 1200, materials: 1400, equipment: 150, permits: 0 } },
            
            // CRITICAL: Pre-Drywall Inspection (Day 25)
            { id: 'insulation-inspection', task: 'Insulation/Pre-Drywall Inspection', x: 450, y: 250, duration: 1, dependencies: ['complete-insulation', 'ceiling-insulation'], status: 'pending', details: 'Inspector approves insulation and vapor barrier - "Go ahead and close up"', pricing: { labor: 0, materials: 0, equipment: 0, permits: 275 } },
            
            // Drywall Phase (Days 26-33) - Only AFTER insulation inspection approval
            { id: 'ceiling-drywall', task: 'Ceiling Drywall (1,320 sqft)', x: 650, y: 250, duration: 3, dependencies: ['insulation-inspection'], status: 'pending', details: 'Hang and tape ceiling drywall, build bulk heads (140 LF) - ONLY after inspector says "close up"', pricing: { labor: 2640, materials: 1850, equipment: 300, permits: 0 } },
            { id: 'wall-drywall', task: 'Wall Drywall', x: 50, y: 350, duration: 4, dependencies: ['ceiling-drywall'], status: 'pending', details: 'Hang, tape, and sand all wall drywall', pricing: { labor: 3200, materials: 1200, equipment: 200, permits: 0 } },
            
            // Flooring Preparation (Days 30-36) - Can run parallel with drywall
            { id: 'subfloor-prep', task: 'DryEase Subfloor Installation', x: 250, y: 350, duration: 3, dependencies: ['insulation-inspection'], status: 'pending', details: '2x2 wood tiles with air circulation backing', pricing: { labor: 1600, materials: 2200, equipment: 200, permits: 0 } },
            { id: 'bathroom-waterproofing', task: 'Bathroom Waterproofing', x: 450, y: 350, duration: 2, dependencies: ['wall-drywall'], status: 'pending', details: 'Waterproof membrane for shower area', pricing: { labor: 800, materials: 650, equipment: 100, permits: 0 } },
            
            // Electrical & HVAC Finish (Days 34-38)
            { id: 'pot-lights', task: 'Pot Light Installation', x: 650, y: 350, duration: 2, dependencies: ['ceiling-drywall'], status: 'pending', details: 'Install pot lights throughout basement' },
            { id: 'hvac-finish', task: 'HVAC Finish Work', x: 50, y: 450, duration: 2, dependencies: ['ceiling-drywall'], status: 'pending', details: 'Install vents, registers, and final connections' },
            
            // Flooring Installation (Days 37-41)
            { id: 'laminate-flooring', task: 'Laminate Flooring', x: 250, y: 450, duration: 4, dependencies: ['subfloor-prep', 'wall-drywall'], status: 'pending', details: 'Install laminate flooring throughout basement', pricing: { labor: 2400, materials: 3500, equipment: 300, permits: 0 } },
            
            // Bathroom Fixtures (Days 39-43)
            { id: 'bathroom-fixtures', task: 'Bathroom Fixture Installation', x: 450, y: 450, duration: 3, dependencies: ['bathroom-waterproofing', 'laminate-flooring'], status: 'pending', details: 'Install shower, toilet, vanity', pricing: { labor: 1500, materials: 2800, equipment: 200, permits: 0 } },
            
            // Painting Phase (Days 42-45)
            { id: 'prime-paint', task: 'Prime & Paint', x: 650, y: 450, duration: 3, dependencies: ['pot-lights', 'hvac-finish'], status: 'pending', details: 'Prime and paint all walls and ceiling', pricing: { labor: 2100, materials: 800, equipment: 200, permits: 0 } },
            
            // Final Finishes (Days 44-47)
            { id: 'trim-baseboard', task: 'Trim & Baseboard (5.25")', x: 50, y: 550, duration: 2, dependencies: ['prime-paint', 'laminate-flooring'], status: 'pending', details: 'Install baseboards and trim work' },
            { id: 'electrical-finish', task: 'Electrical Finish', x: 250, y: 550, duration: 1, dependencies: ['prime-paint'], status: 'pending', details: 'Install switches, outlets, and covers' },
            
            // Final Inspections (Days 48-52)
            { id: 'plumbing-final-inspection', task: 'Plumbing Final Inspection', x: 450, y: 550, duration: 1, dependencies: ['bathroom-fixtures'], status: 'pending', details: 'Final plumbing inspection for bathroom fixtures' },
            { id: 'electrical-final-inspection', task: 'Electrical Final Inspection', x: 650, y: 550, duration: 1, dependencies: ['electrical-finish'], status: 'pending', details: 'Final electrical inspection for all circuits and fixtures' },
            { id: 'building-final-inspection', task: 'Building Final Inspection', x: 350, y: 650, duration: 1, dependencies: ['plumbing-final-inspection', 'electrical-final-inspection', 'trim-baseboard'], status: 'pending', details: 'Final building inspection and occupancy approval' }
        ],
        optimizations: {
            parallelTasks: [
                ['electrical-complete', 'plumbing-rough', 'hvac-rough'],
                ['bedroom-framing', 'bathroom-framing'],
                ['subfloor-prep', 'wall-drywall'],
                ['pot-lights', 'hvac-finish'],
                ['prime-paint', 'laminate-flooring']
            ],
            criticalPath: ['permits-approval', 'plumbing-rough', 'bathroom-framing', 'rough-inspection', 'complete-insulation', 'insulation-inspection', 'ceiling-drywall', 'wall-drywall', 'bathroom-waterproofing', 'bathroom-fixtures', 'building-final-inspection'],
            timeSaved: 12,
            costSaved: 8400,
            insights: [
                '🔍 **INSPECTION SEQUENCE**: Rough-in inspection occurs ONLY after ALL trades (electrical, plumbing, HVAC, framing) are 100% complete',
                '🚫 **CRITICAL**: No drywall can be installed until insulation inspection passes and inspector says "go ahead and close up"',
                '⚡ **PARALLEL OPTIMIZATION**: Electrical, plumbing, and HVAC rough-in can run simultaneously to reach inspection milestone faster',
                '🏗️ **FRAMING COORDINATION**: Bedroom and bathroom framing sequenced with rough-in work for efficient inspection readiness',
                '📋 **CODE COMPLIANCE**: Egress window installation must be complete before rough-in inspection for bedroom code approval',
                '🔄 **WORKFLOW EFFICIENCY**: DryEase subfloor and finish work optimized around mandatory inspection holds'
            ]
        }
    };
}

function generateProjectWorkflow(projectType) {
    const workflows = {
        'kitchen-remodel': {
            name: 'Kitchen Remodel - Modern Update',
            nodes: [
                { id: 'design', task: 'Design & Planning', x: 50, y: 50, duration: 5, dependencies: [], status: 'completed' },
                { id: 'permits', task: 'Permits & Approvals', x: 250, y: 50, duration: 7, dependencies: ['design'], status: 'completed' },
                { id: 'demo', task: 'Demolition', x: 50, y: 150, duration: 2, dependencies: ['permits'], status: 'in-progress' },
                { id: 'electrical', task: 'Electrical Rough-in', x: 250, y: 150, duration: 2, dependencies: ['demo'], status: 'pending' },
                { id: 'plumbing', task: 'Plumbing Rough-in', x: 450, y: 150, duration: 2, dependencies: ['demo'], status: 'pending' },
                { id: 'drywall', task: 'Drywall & Paint', x: 350, y: 250, duration: 4, dependencies: ['electrical', 'plumbing'], status: 'pending' },
                { id: 'cabinets', task: 'Cabinet Installation', x: 150, y: 350, duration: 3, dependencies: ['drywall'], status: 'pending' },
                { id: 'countertops', task: 'Countertop Install', x: 350, y: 350, duration: 1, dependencies: ['cabinets'], status: 'pending' },
                { id: 'finishes', task: 'Final Finishes', x: 250, y: 450, duration: 2, dependencies: ['countertops'], status: 'pending' }
            ],
            optimizations: {
                parallelTasks: ['electrical', 'plumbing'],
                criticalPath: ['design', 'permits', 'demo', 'electrical', 'drywall', 'cabinets', 'countertops', 'finishes'],
                timeSaved: 6,
                costSaved: 4800
            }
        },
        'bathroom-renovation': {
            name: 'Bathroom Renovation - Full Remodel',
            nodes: [
                { id: 'design', task: 'Design & Planning', x: 50, y: 50, duration: 3, dependencies: [], status: 'completed' },
                { id: 'demo', task: 'Demolition', x: 250, y: 50, duration: 1, dependencies: ['design'], status: 'in-progress' },
                { id: 'plumbing', task: 'Plumbing Rough-in', x: 50, y: 150, duration: 2, dependencies: ['demo'], status: 'pending' },
                { id: 'electrical', task: 'Electrical Work', x: 250, y: 150, duration: 1, dependencies: ['demo'], status: 'pending' },
                { id: 'waterproof', task: 'Waterproofing', x: 450, y: 150, duration: 1, dependencies: ['plumbing'], status: 'pending' },
                { id: 'tile', task: 'Tile Installation', x: 350, y: 250, duration: 3, dependencies: ['waterproof', 'electrical'], status: 'pending' },
                { id: 'fixtures', task: 'Fixture Installation', x: 250, y: 350, duration: 1, dependencies: ['tile'], status: 'pending' }
            ],
            optimizations: {
                parallelTasks: ['plumbing', 'electrical'],
                criticalPath: ['design', 'demo', 'plumbing', 'waterproof', 'tile', 'fixtures'],
                timeSaved: 3,
                costSaved: 2400
            }
        },
        'home-addition': {
            name: 'Home Addition - Family Room',
            nodes: [
                { id: 'design', task: 'Architectural Design', x: 50, y: 50, duration: 14, dependencies: [], status: 'completed' },
                { id: 'permits', task: 'Building Permits', x: 300, y: 50, duration: 21, dependencies: ['design'], status: 'completed' },
                { id: 'foundation', task: 'Foundation Work', x: 50, y: 150, duration: 7, dependencies: ['permits'], status: 'in-progress' },
                { id: 'framing', task: 'Framing', x: 250, y: 150, duration: 8, dependencies: ['foundation'], status: 'pending' },
                { id: 'roofing', task: 'Roofing', x: 450, y: 100, duration: 4, dependencies: ['framing'], status: 'pending' },
                { id: 'windows', task: 'Windows & Doors', x: 450, y: 200, duration: 3, dependencies: ['framing'], status: 'pending' },
                { id: 'electrical', task: 'Electrical Rough-in', x: 50, y: 250, duration: 4, dependencies: ['framing'], status: 'pending' },
                { id: 'plumbing', task: 'Plumbing Rough-in', x: 250, y: 250, duration: 4, dependencies: ['framing'], status: 'pending' },
                { id: 'hvac', task: 'HVAC Installation', x: 450, y: 300, duration: 5, dependencies: ['electrical'], status: 'pending' },
                { id: 'insulation', task: 'Insulation', x: 150, y: 350, duration: 2, dependencies: ['electrical', 'plumbing', 'hvac'], status: 'pending' },
                { id: 'drywall', task: 'Drywall', x: 350, y: 350, duration: 6, dependencies: ['insulation'], status: 'pending' },
                { id: 'finishes', task: 'Final Finishes', x: 250, y: 450, duration: 8, dependencies: ['drywall'], status: 'pending' }
            ],
            optimizations: {
                parallelTasks: ['roofing', 'windows', 'electrical', 'plumbing'],
                criticalPath: ['design', 'permits', 'foundation', 'framing', 'electrical', 'hvac', 'insulation', 'drywall', 'finishes'],
                timeSaved: 12,
                costSaved: 15600
            }
        }
    };
    
    return workflows[projectType] || workflows['kitchen-remodel'];
}

function displayWorkflowVisualization(workflow) {
    // Store workflow globally for dependency highlighting and modal access
    window.currentWorkflow = workflow;
    currentWorkflowData = workflow;
    
    const container = document.getElementById('workflowNodes');
    
    // Create organized layout based on project type
    let organizedNodes;
    if (projectData && projectData.isKitchenReno) {
        organizedNodes = organizeNodesForKitchenProject(workflow.nodes);
    } else {
        organizedNodes = organizeNodesForBasementProject(workflow.nodes);
    }
    
    // Create SVG for connections
    let svgConnections = '<svg class="absolute inset-0 pointer-events-none" style="z-index: 1; width: 100%; height: 100%;">';
    
    // Generate connections between dependent tasks
    organizedNodes.forEach(node => {
        node.dependencies.forEach(depId => {
            const depNode = organizedNodes.find(n => n.id === depId);
            if (depNode) {
                svgConnections += `
                    <line x1="${depNode.x + 80}" y1="${depNode.y + 40}" 
                          x2="${node.x}" y2="${node.y + 40}" 
                          stroke="#cbd5e1" stroke-width="2" marker-end="url(#arrowhead)" 
                          class="workflow-connection"/>
                `;
            }
        });
    });
    
    svgConnections += `
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                    refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1"/>
            </marker>
        </defs>
    </svg>`;
    
    // Generate nodes HTML with enhanced design for construction sequencing
    const nodesHTML = organizedNodes.map((node, index) => {
        const isInspection = node.id.includes('inspection');
        const inspectionClass = isInspection ? 'border-red-500 bg-red-50' : 'bg-white';
        const inspectionIcon = isInspection ? '<i class="fas fa-clipboard-check text-red-600 mr-1"></i>' : '';
        
        return `
        <div class="workflow-node absolute rounded-lg border-2 p-3 shadow-md hover:shadow-lg transition-all cursor-pointer ${getNodeClasses(node.status)} ${inspectionClass}"
             style="left: ${node.x}px; top: ${node.y}px; width: 160px; z-index: 2;"
             onclick="openTaskModal('${node.id}')">
            <div class="flex items-center justify-between mb-2">
                <div class="w-4 h-4 rounded-full ${getStatusColor(node.status)}"></div>
                <div class="text-xs text-gray-500 font-medium">${node.duration} days</div>
            </div>
            <div class="text-xs font-semibold text-gray-900 leading-tight mb-1">${inspectionIcon}${node.task}</div>
            <div class="text-xs text-gray-600 leading-tight">${formatStatus(node.status)}</div>
            ${node.pricing ? `<div class="text-xs text-green-600 font-semibold mt-1">💰 $${((node.pricing.labor || 0) + (node.pricing.materials || 0) + (node.pricing.equipment || 0) + (node.pricing.permits || 0)).toLocaleString()}</div>` : ''}
            ${node.dependencies.length > 0 ? `<div class="text-xs ${isInspection ? 'text-red-600' : 'text-blue-600'} mt-1"><i class="fas fa-link mr-1"></i>${node.dependencies.length} deps</div>` : ''}
            ${isInspection ? '<div class="text-xs text-red-700 font-semibold mt-1">🚨 GATE</div>' : ''}
        </div>`;
    }).join('');
    
    container.innerHTML = svgConnections + nodesHTML;
    
    // Add workflow insights
    displayWorkflowInsights(workflow);
    
    // Show action buttons and regional pricing controls
    document.getElementById('createEstimateBtn').classList.remove('hidden');
    document.getElementById('exportWorkflowBtn').classList.remove('hidden');
    document.getElementById('regionalPricingControls').classList.remove('hidden');
    
    // Initialize location detection
    detectUserLocation();

function organizeNodesForKitchenProject(nodes) {
    // Organize nodes for kitchen renovation workflow
    const phases = {
        planning: ['permits-planning'],
        demo: ['demolition', 'drywall-repair'],
        roughin: ['electrical-rough', 'plumbing-rough'],
        inspection: ['rough-inspection'],
        cabinetry: ['cabinet-installation', 'island-installation'],
        surfaces: ['countertop-install', 'sink-install'],
        finishes: ['backsplash-install', 'electrical-finish'],
        completion: ['appliance-connections', 'cleanup-walkthrough']
    };
    
    const organizedNodes = [];
    let yOffset = 50;
    
    Object.entries(phases).forEach(([phase, taskIds]) => {
        let xOffset = 50;
        taskIds.forEach(taskId => {
            const node = nodes.find(n => n.id === taskId);
            if (node) {
                organizedNodes.push({
                    ...node,
                    x: xOffset,
                    y: yOffset
                });
                xOffset += 200;
            }
        });
        yOffset += 120;
    });
    
    return organizedNodes;
}

function organizeNodesForBasementProject(nodes) {
    // Organize nodes in a logical flow for basement retrofit
    const phases = {
        planning: ['permits-approval'],
        roughIn: ['electrical-rough', 'plumbing-rough', 'hvac-rough'],
        framing: ['bedroom-framing', 'bathroom-framing', 'egress-window'],
        inspectionRough: ['rough-inspection'],
        insulation: ['complete-insulation', 'ceiling-insulation'],
        inspectionInsulation: ['insulation-inspection'],
        drywall: ['ceiling-drywall', 'wall-drywall'],
        flooring: ['subfloor-prep', 'bathroom-waterproofing'],
        systems: ['pot-lights', 'hvac-finish'],
        finishing: ['laminate-flooring', 'bathroom-fixtures', 'prime-paint'],
        final: ['trim-baseboard', 'electrical-finish', 'plumbing-final-inspection', 'electrical-final-inspection', 'building-final-inspection']
    };
    
    const organizedNodes = [];
    let yOffset = 50;
    
    Object.entries(phases).forEach(([phase, taskIds]) => {
        let xOffset = 50;
        taskIds.forEach(taskId => {
            const node = nodes.find(n => n.id === taskId);
            if (node) {
                organizedNodes.push({
                    ...node,
                    x: xOffset,
                    y: yOffset
                });
                xOffset += 200;
            }
        });
        yOffset += 120;
    });
    
    // Add any missing nodes
    nodes.forEach(node => {
        if (!organizedNodes.find(n => n.id === node.id)) {
            organizedNodes.push({
                ...node,
                x: 50 + (organizedNodes.length % 4) * 200,
                y: yOffset
            });
        }
    });
    
    return organizedNodes;
}

function displayWorkflowInsights(workflow) {
    // Update insights with workflow-specific information
    const insights = workflow.optimizations.insights;
    const randomInsight = insights[Math.floor(Math.random() * insights.length)];
    
    document.getElementById('insightsContent').innerHTML = `
        <strong>AI Workflow Analysis:</strong><br>
        ${randomInsight}<br><br>
        <small>Click any task above to see its dependencies and scheduling details.</small>
    `;
    
    // Update dependency panel with parallel tasks info
    const parallelInfo = workflow.optimizations.parallelTasks
        .map(group => group.join(' + '))
        .join('<br>');
    
    document.getElementById('dependencyContent').innerHTML = `
        <strong>Parallel Task Groups:</strong><br>
        ${parallelInfo}
    `;
}

function getNodeClasses(status) {
    switch (status) {
        case 'completed': return 'border-green-400 bg-green-50';
        case 'in-progress': return 'border-blue-400 bg-blue-50 animate-pulse';
        case 'pending': return 'border-gray-300 bg-gray-50';
        default: return 'border-gray-300 bg-gray-50';
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'completed': return 'bg-green-400';
        case 'in-progress': return 'bg-blue-400 animate-pulse';
        case 'pending': return 'bg-gray-300';
        default: return 'bg-gray-300';
    }
}

function displayTimelineView(workflow) {
    const container = document.getElementById('timelineView');
    
    // Calculate timeline with overlapping tasks
    const timeline = calculateProjectTimeline(workflow);
    
    const timelineHTML = workflow.nodes.map((node, index) => {
        const timeInfo = timeline.find(t => t.id === node.id);
        const startDay = timeInfo ? timeInfo.startDay : index * node.duration + 1;
        const endDay = timeInfo ? timeInfo.endDay : startDay + node.duration - 1;
        
        return `
            <div class="timeline-item p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onclick="highlightTaskDependencies('${node.id}')">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center ${getStatusBgColor(node.status)} border-2 ${getStatusBorderColor(node.status)} text-white text-xs font-bold">
                            ${index + 1}
                        </div>
                        <div class="flex-1">
                            <div class="font-semibold text-sm text-gray-900">${node.task}</div>
                            <div class="text-xs text-gray-500 mt-1">Days ${startDay}-${endDay} • ${node.duration} days duration</div>
                            ${node.details ? `<div class="text-xs text-gray-600 mt-1 italic">${node.details}</div>` : ''}
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-xs font-medium px-2 py-1 rounded-full ${getStatusTextColor(node.status)}">
                            ${formatStatus(node.status)}
                        </div>
                        ${node.dependencies.length > 0 ? `<div class="text-xs text-gray-400 mt-1">${node.dependencies.length} dependencies</div>` : ''}
                    </div>
                </div>
                
                ${node.dependencies.length > 0 ? `
                    <div class="mt-3 pt-2 border-t border-gray-100">
                        <div class="text-xs text-gray-500">
                            <i class="fas fa-arrow-left mr-1"></i>
                            Depends on: ${node.dependencies.map(dep => workflow.nodes.find(n => n.id === dep)?.task || dep).join(', ')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    // Add timeline summary
    const summaryHTML = `
        <div class="bg-primary-50 rounded-lg p-4 border-2 border-primary-200 mb-4">
            <div class="flex items-center justify-between">
                <div>
                    <h4 class="font-bold text-primary-900">Project Timeline Summary</h4>
                    <p class="text-sm text-primary-700">Total Duration: ${workflow.totalDays} days • ${workflow.nodes.length} tasks</p>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-primary-600">${workflow.optimizations.timeSaved} days</div>
                    <div class="text-xs text-primary-600">Time Saved</div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = summaryHTML + timelineHTML;
}

function calculateProjectTimeline(workflow) {
    // Calculate actual start/end days considering dependencies
    const timeline = [];
    const completed = new Set();
    
    function getTaskEndDay(taskId, processed = new Set()) {
        if (processed.has(taskId)) return 0; // Circular dependency prevention
        processed.add(taskId);
        
        const task = workflow.nodes.find(n => n.id === taskId);
        if (!task) return 0;
        
        let startDay = 1;
        
        // Find latest dependency end day
        if (task.dependencies.length > 0) {
            const depEndDays = task.dependencies.map(depId => getTaskEndDay(depId, new Set(processed)));
            startDay = Math.max(...depEndDays) + 1;
        }
        
        const endDay = startDay + task.duration - 1;
        
        // Store timeline info
        if (!timeline.find(t => t.id === taskId)) {
            timeline.push({ id: taskId, startDay, endDay });
        }
        
        return endDay;
    }
    
    // Calculate timeline for all tasks
    workflow.nodes.forEach(node => {
        getTaskEndDay(node.id);
    });
    
    return timeline;
}

function getStatusBgColor(status) {
    switch (status) {
        case 'completed': return 'bg-green-500';
        case 'in-progress': return 'bg-blue-500';
        case 'pending': return 'bg-gray-400';
        default: return 'bg-gray-400';
    }
}

function getStatusBorderColor(status) {
    switch (status) {
        case 'completed': return 'border-green-600';
        case 'in-progress': return 'border-blue-600';
        case 'pending': return 'border-gray-500';
        default: return 'border-gray-500';
    }
}

function getStatusTextColor(status) {
    switch (status) {
        case 'completed': return 'bg-green-100 text-green-800';
        case 'in-progress': return 'bg-blue-100 text-blue-800';
        case 'pending': return 'bg-gray-100 text-gray-600';
        default: return 'bg-gray-100 text-gray-600';
    }
}

function formatStatus(status) {
    switch (status) {
        case 'completed': return 'Completed';
        case 'in-progress': return 'In Progress';
        case 'pending': return 'Pending';
        default: return 'Unknown';
    }
}

function highlightTaskDependencies(taskId) {
    // Remove previous highlights
    document.querySelectorAll('.timeline-item').forEach(item => {
        item.classList.remove('ring-2', 'ring-primary-400', 'bg-primary-50');
    });
    
    // Highlight selected task and its dependencies
    const workflow = window.currentWorkflow; // Store workflow globally when generated
    if (!workflow) return;
    
    const task = workflow.nodes.find(n => n.id === taskId);
    if (!task) return;
    
    // Highlight the selected task
    const taskElements = document.querySelectorAll('.timeline-item');
    const taskIndex = workflow.nodes.findIndex(n => n.id === taskId);
    if (taskElements[taskIndex + 1]) { // +1 because of summary element
        taskElements[taskIndex + 1].classList.add('ring-2', 'ring-primary-400', 'bg-primary-50');
    }
    
    // Highlight dependencies
    task.dependencies.forEach(depId => {
        const depIndex = workflow.nodes.findIndex(n => n.id === depId);
        if (taskElements[depIndex + 1]) {
            taskElements[depIndex + 1].classList.add('ring-2', 'ring-blue-300', 'bg-blue-50');
        }
    });
    
    // Update AI insights with dependency info
    updateDependencyInsights(task, workflow);
}

function updateDependencyInsights(task, workflow) {
    const depTasks = task.dependencies.map(depId => 
        workflow.nodes.find(n => n.id === depId)?.task || depId
    ).join(', ');
    
    const insight = task.dependencies.length > 0 
        ? `Task "${task.task}" depends on: ${depTasks}. AI has optimized the scheduling to minimize delays.`
        : `Task "${task.task}" has no dependencies and can start immediately when resources are available.`;
    
    document.getElementById('insightsContent').innerHTML = insight;
}

function selectNode(nodeId) {
    // Highlight selected node and show details
    document.querySelectorAll('.workflow-node').forEach(node => {
        node.classList.remove('ring-2', 'ring-primary-400');
    });
    
    event.currentTarget.classList.add('ring-2', 'ring-primary-400');
    
    // Update insights with node details
    const insights = `Selected task: ${nodeId}. AI analyzing dependencies and optimization opportunities for this step.`;
    document.getElementById('insightsContent').innerHTML = insights;
}

function updateAIInsights(workflow) {
    const insights = [
        `AI identified ${workflow.optimizations.parallelTasks.length} tasks that can run in parallel`,
        `Critical path analysis shows ${workflow.optimizations.criticalPath.length} sequential dependencies`,
        `Resource optimization algorithms suggest ${workflow.optimizations.timeSaved} days can be saved`,
        `Dependency mapping reveals potential scheduling conflicts resolved automatically`
    ];
    
    document.getElementById('insightsContent').innerHTML = insights[Math.floor(Math.random() * insights.length)];
    
    // Update dependency panel
    const parallelTasks = workflow.optimizations.parallelTasks.join(' + ');
    document.getElementById('dependencyContent').innerHTML = `Parallel execution detected: ${parallelTasks}`;
}

function showOptimizationResults(workflow) {
    const summaryContainer = document.getElementById('optimizationSummary');
    const summaryContent = document.getElementById('summaryContent');
    
    summaryContent.innerHTML = `
        <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
                <span class="font-semibold text-green-900">Time Optimized:</span>
                <span class="text-green-700">${workflow.optimizations.timeSaved} days saved</span>
            </div>
            <div>
                <span class="font-semibold text-green-900">Cost Reduced:</span>
                <span class="text-green-700">$${workflow.optimizations.costSaved.toLocaleString()}</span>
            </div>
            <div class="col-span-2">
                <span class="font-semibold text-green-900">Critical Path:</span>
                <span class="text-green-700">${workflow.optimizations.criticalPath.length} sequential tasks identified</span>
            </div>
        </div>
    `;
    
    summaryContainer.classList.remove('hidden');
}

function generateProjectSequence(projectType, projectSize) {
    const sequences = {
        'kitchen-remodel': {
            small: [
                { task: 'Design & Permits', duration: 5, dependencies: [], priority: 'high' },
                { task: 'Demolition', duration: 2, dependencies: ['Design & Permits'], priority: 'high' },
                { task: 'Electrical Rough-in', duration: 2, dependencies: ['Demolition'], priority: 'medium' },
                { task: 'Plumbing Rough-in', duration: 2, dependencies: ['Demolition'], priority: 'medium' },
                { task: 'Drywall & Paint', duration: 4, dependencies: ['Electrical Rough-in', 'Plumbing Rough-in'], priority: 'medium' },
                { task: 'Cabinet Installation', duration: 3, dependencies: ['Drywall & Paint'], priority: 'high' },
                { task: 'Countertop Install', duration: 1, dependencies: ['Cabinet Installation'], priority: 'high' },
                { task: 'Final Finishes', duration: 2, dependencies: ['Countertop Install'], priority: 'low' }
            ],
            medium: [
                { task: 'Design & Engineering', duration: 7, dependencies: [], priority: 'high' },
                { task: 'Permit Approval', duration: 10, dependencies: ['Design & Engineering'], priority: 'high' },
                { task: 'Structural Changes', duration: 3, dependencies: ['Permit Approval'], priority: 'high' },
                { task: 'Demolition', duration: 3, dependencies: ['Permit Approval'], priority: 'high' },
                { task: 'Electrical Upgrade', duration: 3, dependencies: ['Structural Changes', 'Demolition'], priority: 'high' },
                { task: 'Plumbing Reroute', duration: 3, dependencies: ['Structural Changes', 'Demolition'], priority: 'high' },
                { task: 'HVAC Integration', duration: 2, dependencies: ['Electrical Upgrade'], priority: 'medium' },
                { task: 'Insulation', duration: 1, dependencies: ['Electrical Upgrade', 'Plumbing Reroute'], priority: 'medium' },
                { task: 'Drywall & Texture', duration: 5, dependencies: ['Insulation', 'HVAC Integration'], priority: 'medium' },
                { task: 'Paint & Prime', duration: 3, dependencies: ['Drywall & Texture'], priority: 'medium' },
                { task: 'Flooring Install', duration: 3, dependencies: ['Paint & Prime'], priority: 'high' },
                { task: 'Custom Cabinetry', duration: 5, dependencies: ['Flooring Install'], priority: 'high' },
                { task: 'Countertop Fabrication', duration: 2, dependencies: ['Custom Cabinetry'], priority: 'high' },
                { task: 'Appliance Integration', duration: 2, dependencies: ['Countertop Fabrication'], priority: 'medium' },
                { task: 'Final Inspection', duration: 1, dependencies: ['Appliance Integration'], priority: 'high' }
            ]
        },
        'bathroom-renovation': {
            small: [
                { task: 'Design & Planning', duration: 3, dependencies: [], priority: 'high' },
                { task: 'Demolition', duration: 1, dependencies: ['Design & Planning'], priority: 'high' },
                { task: 'Plumbing Rough-in', duration: 2, dependencies: ['Demolition'], priority: 'high' },
                { task: 'Electrical Work', duration: 1, dependencies: ['Demolition'], priority: 'medium' },
                { task: 'Tile & Waterproofing', duration: 3, dependencies: ['Plumbing Rough-in'], priority: 'high' },
                { task: 'Fixture Installation', duration: 1, dependencies: ['Tile & Waterproofing', 'Electrical Work'], priority: 'medium' },
                { task: 'Final Finishes', duration: 1, dependencies: ['Fixture Installation'], priority: 'low' }
            ]
        },
        'home-addition': {
            large: [
                { task: 'Architectural Design', duration: 14, dependencies: [], priority: 'high' },
                { task: 'Structural Engineering', duration: 7, dependencies: ['Architectural Design'], priority: 'high' },
                { task: 'Building Permits', duration: 21, dependencies: ['Structural Engineering'], priority: 'high' },
                { task: 'Site Preparation', duration: 3, dependencies: ['Building Permits'], priority: 'high' },
                { task: 'Foundation Excavation', duration: 2, dependencies: ['Site Preparation'], priority: 'high' },
                { task: 'Foundation Pour', duration: 3, dependencies: ['Foundation Excavation'], priority: 'high' },
                { task: 'Foundation Cure', duration: 7, dependencies: ['Foundation Pour'], priority: 'high' },
                { task: 'Framing', duration: 8, dependencies: ['Foundation Cure'], priority: 'high' },
                { task: 'Roofing', duration: 4, dependencies: ['Framing'], priority: 'high' },
                { task: 'Windows & Doors', duration: 3, dependencies: ['Framing'], priority: 'high' },
                { task: 'Electrical Rough-in', duration: 4, dependencies: ['Framing'], priority: 'medium' },
                { task: 'Plumbing Rough-in', duration: 4, dependencies: ['Framing'], priority: 'medium' },
                { task: 'HVAC Installation', duration: 5, dependencies: ['Electrical Rough-in'], priority: 'medium' },
                { task: 'Insulation', duration: 2, dependencies: ['Electrical Rough-in', 'Plumbing Rough-in', 'HVAC Installation'], priority: 'medium' },
                { task: 'Drywall Installation', duration: 6, dependencies: ['Insulation'], priority: 'medium' },
                { task: 'Interior Paint', duration: 4, dependencies: ['Drywall Installation'], priority: 'medium' },
                { task: 'Flooring', duration: 5, dependencies: ['Interior Paint'], priority: 'high' },
                { task: 'Cabinetry', duration: 4, dependencies: ['Flooring'], priority: 'high' },
                { task: 'Final Fixtures', duration: 3, dependencies: ['Cabinetry'], priority: 'medium' },
                { task: 'Final Inspection', duration: 1, dependencies: ['Final Fixtures'], priority: 'high' }
            ]
        }
    };
    
    const projectSequences = sequences[projectType];
    if (projectSequences && projectSequences[projectSize]) {
        return projectSequences[projectSize];
    }
    
    // Default sequence if not found
    return sequences['kitchen-remodel']['small'];
}

function displayGeneratedSequence(sequence) {
    const container = document.getElementById('generatedSequence');
    
    const totalDuration = sequence.reduce((sum, task) => sum + task.duration, 0);
    let currentDelay = 0;
    
    container.innerHTML = `
        <div class="mb-4 flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">Project Timeline: ${totalDuration} days</span>
            <div class="w-32 bg-gray-200 rounded-full h-2">
                <div class="bg-primary-600 h-2 rounded-full progress-bar" style="width: 0%"></div>
            </div>
        </div>
        <div class="timeline space-y-3">
            ${sequence.map((task, index) => `
                <div class="timeline-item flex items-center justify-between p-3 rounded-lg bg-white border border-gray-200 hover:shadow-md transition-shadow" style="animation-delay: ${index * 0.1}s">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span class="text-xs font-semibold text-primary-600">${index + 1}</span>
                        </div>
                        <div>
                            <div class="font-medium text-sm text-gray-900">${task.task}</div>
                            <div class="text-xs text-gray-500">${task.duration} days • Priority: ${task.priority}</div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityClasses(task.priority)}">
                            ${task.priority}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Animate progress bar
    setTimeout(() => {
        const progressBar = container.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = '100%';
        }
    }, 500);
}

function getPriorityClasses(priority) {
    switch (priority) {
        case 'high': return 'bg-red-100 text-red-800';
        case 'medium': return 'bg-yellow-100 text-yellow-800';
        case 'low': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function generateAIInsights(projectType, projectSize, sequence) {
    const insights = [
        `AI identified ${sequence.length} critical tasks for optimal workflow`,
        `Parallel processing opportunities reduced timeline by 23%`,
        `Resource optimization saved an estimated $3,200 in labor costs`,
        `Weather integration suggests 2-day buffer for outdoor work`,
        `Material delivery synchronized with task dependencies`
    ];
    
    const randomInsight = insights[Math.floor(Math.random() * insights.length)];
    
    return `
        <div class="typing-animation text-sm text-primary-800" style="width: 0;">
            ${randomInsight}
        </div>
    `;
}

function generateOptimizationSummary(sequence) {
    const totalDuration = sequence.reduce((sum, task) => sum + task.duration, 0);
    const originalDuration = Math.round(totalDuration * 1.3); // Assume 30% improvement
    const timeSaved = originalDuration - totalDuration;
    const costSaved = timeSaved * 800; // $800 per day saved
    
    return `
        <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
                <span class="font-semibold text-green-900">Time Saved:</span>
                <span class="text-green-700">${timeSaved} days</span>
            </div>
            <div>
                <span class="font-semibold text-green-900">Cost Saved:</span>
                <span class="text-green-700">$${costSaved.toLocaleString()}</span>
            </div>
        </div>
    `;
}

function startSequenceTimer() {
    let seconds = 0;
    const timerElement = document.getElementById('sequenceTimer');
    
    if (sequenceTimer) {
        clearInterval(sequenceTimer);
    }
    
    sequenceTimer = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timerElement.textContent = `Processing: ${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Navigation and UI Functions
function scrollToDemo() {
    document.getElementById('demo').scrollIntoView({ behavior: 'smooth' });
}

function scrollToEstimates() {
    document.getElementById('estimates').scrollIntoView({ behavior: 'smooth' });
}

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
}

function initMobileMenu() {
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const mobileMenu = document.getElementById('mobile-menu');
        const menuButton = event.target.closest('button');
        
        if (!mobileMenu.contains(event.target) && !menuButton?.onclick?.toString().includes('toggleMobileMenu')) {
            mobileMenu.classList.add('hidden');
        }
    });
}

// Modal Functions
function openTrialModal() {
    document.getElementById('trialModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeTrialModal() {
    document.getElementById('trialModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Form Handlers
function initFormHandlers() {
    const trialForm = document.getElementById('trialForm');
    if (trialForm) {
        trialForm.addEventListener('submit', handleTrialSubmission);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('trialModal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeTrialModal();
            }
        });
    }
}

function handleTrialSubmission(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const trialData = Object.fromEntries(formData.entries());
    
    // Simulate form submission
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;
    submitButton.classList.add('loading');
    
    setTimeout(() => {
        // Success state
        submitButton.textContent = 'Success! Check Your Email';
        submitButton.classList.remove('loading');
        submitButton.classList.add('success-state');
        
        // Close modal after delay
        setTimeout(() => {
            closeTrialModal();
            
            // Reset form
            event.target.reset();
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            submitButton.classList.remove('success-state');
        }, 2000);
    }, 2000);
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.feature-card, .pricing-card, .roi-card').forEach(el => {
        observer.observe(el);
    });
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function animateNumber(element, targetValue, duration = 1000) {
    const startValue = parseFloat(element.textContent.replace(/[^\d.-]/g, '')) || 0;
    const difference = targetValue - startValue;
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (difference * easedProgress);
        
        element.textContent = Math.round(currentValue);
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Error Handling
window.addEventListener('error', function(event) {
    console.error('FireBuildAI Demo Error:', event.error);
    // Could send to analytics in production
});

// Smart Estimates Functionality
function updateEstimate() {
    // Get input values
    const projectType = document.getElementById('estimateProjectType').value;
    const sqft = parseInt(document.getElementById('estimateSquareFootage').value) || 1320;
    const finishLevel = document.getElementById('estimateFinishLevel').value;
    const location = document.getElementById('estimateLocation').value;
    
    // Calculate estimate based on project parameters
    const estimate = calculateSmartEstimate(projectType, sqft, finishLevel, location);
    
    // Update display
    updateEstimateDisplay(estimate);
}

function calculateSmartEstimate(projectType, sqft, finishLevel, location) {
    // Base costs per sqft by project type
    const baseCosts = {
        'basement-retrofit': { materials: 12, labor: 18, permits: 0.8 },
        'kitchen-remodel': { materials: 25, labor: 35, permits: 1.2 },
        'bathroom-renovation': { materials: 30, labor: 40, permits: 1.5 },
        'home-addition': { materials: 35, labor: 45, permits: 2.0 },
        'deck-construction': { materials: 15, labor: 20, permits: 0.5 }
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
        'rural': 0.8,
        'suburban': 1.0,
        'urban': 1.2,
        'metro': 1.4
    };
    
    const base = baseCosts[projectType] || baseCosts['basement-retrofit'];
    const finishMult = finishMultipliers[finishLevel] || 1.0;
    const locationMult = locationMultipliers[location] || 1.0;
    
    const materials = Math.round(sqft * base.materials * finishMult * locationMult);
    const labor = Math.round(sqft * base.labor * finishMult * locationMult);
    const permits = Math.round(sqft * base.permits * locationMult);
    const subtotal = materials + labor + permits;
    const overhead = Math.round(subtotal * 0.18); // 18% overhead and profit
    const total = subtotal + overhead;
    
    // Calculate timeline based on project complexity
    const baseDays = {
        'basement-retrofit': 45,
        'kitchen-remodel': 28,
        'bathroom-renovation': 18,
        'home-addition': 65,
        'deck-construction': 12
    };
    
    const timeline = Math.round((baseDays[projectType] || 45) * (sqft / 1320) * finishMult);
    const timeSaved = Math.round(timeline * 0.21); // 21% time savings through AI optimization
    
    return {
        materials,
        labor,
        permits,
        overhead,
        total,
        timeline,
        timeSaved,
        projectType,
        sqft
    };
}

function updateEstimateDisplay(estimate) {
    const elements = {
        'estimateMaterials': '$' + estimate.materials.toLocaleString(),
        'estimateLabor': '$' + estimate.labor.toLocaleString(),
        'estimatePermits': '$' + estimate.permits.toLocaleString(),
        'estimateOverhead': '$' + estimate.overhead.toLocaleString(),
        'estimateTotal': '$' + estimate.total.toLocaleString(),
        'estimateTimeline': estimate.timeline + ' days',
        'estimateTimeSaved': estimate.timeSaved + ' days'
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('roi-number', 'updating');
            setTimeout(() => {
                element.textContent = value;
                element.classList.remove('updating');
            }, 200);
        }
    });
}

// Removed duplicate generateDetailedEstimate function - using the correct one below

function showDetailedWorkflow() {
    // Scroll to the workflow demo and trigger generation
    document.getElementById('demo').scrollIntoView({ behavior: 'smooth' });
    
    // Auto-load the sample project after scrolling
    setTimeout(() => {
        loadSampleProject();
        setTimeout(() => {
            analyzeProject();
        }, 1000);
    }, 800);
}

// Initialize estimates on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize with default estimate
    setTimeout(() => {
        updateEstimate();
    }, 500);
});

// Debug function - can be called directly from console
function forceAskQuestion() {
    console.log('🔧 Force asking question for debugging');
    projectData.missingInfo = ['team_size'];
    projectData.answeredQuestions = new Set();
    projectData.currentlyAsking = null;
    
    addAIMessage("🤔 How many workers will be on this project? This affects parallel task optimization.");
    showResponseOptions('team_size');
}

// Make it globally accessible for console debugging
window.forceAskQuestion = forceAskQuestion;

// Global variable to store current workflow data for modal access
let currentWorkflowData = null;
let currentTaskBeingEdited = null;
let currentRegion = null;

// Regional Pricing Database - Based on National Construction Cost Data
const regionalPricingData = {
    // United States Markets
    'CA-SF': { 
        name: 'San Francisco Bay Area, CA', 
        multiplier: 1.45, 
        laborRate: 85, 
        factors: ['High cost of living', 'Strong union presence', 'Strict codes'],
        source: 'RSMeans 2024, BLS Construction Data'
    },
    'CA-LA': { 
        name: 'Los Angeles, CA', 
        multiplier: 1.35, 
        laborRate: 78, 
        factors: ['High cost of living', 'Union market', 'Complex permitting'],
        source: 'RSMeans 2024, CA Dept of Industrial Relations'
    },
    'CA-SD': { 
        name: 'San Diego, CA', 
        multiplier: 1.28, 
        laborRate: 72, 
        factors: ['High cost of living', 'Limited supply chain'],
        source: 'RSMeans 2024'
    },
    'NY-NYC': { 
        name: 'New York City, NY', 
        multiplier: 1.42, 
        laborRate: 82, 
        factors: ['Very high labor costs', 'Complex regulations', 'Union requirements'],
        source: 'RSMeans 2024, NYC Department of Buildings'
    },
    'NY-UPS': { 
        name: 'Upstate New York', 
        multiplier: 1.08, 
        laborRate: 58, 
        factors: ['Moderate costs', 'Seasonal weather impact'],
        source: 'RSMeans 2024'
    },
    'TX-DFW': { 
        name: 'Dallas-Fort Worth, TX', 
        multiplier: 0.95, 
        laborRate: 52, 
        factors: ['Business-friendly', 'Growing market', 'Competitive pricing'],
        source: 'AGC Texas, RSMeans 2024'
    },
    'TX-HOU': { 
        name: 'Houston, TX', 
        multiplier: 0.92, 
        laborRate: 50, 
        factors: ['Energy industry influence', 'Lower regulation'],
        source: 'AGC Texas, RSMeans 2024'
    },
    'TX-AUS': { 
        name: 'Austin, TX', 
        multiplier: 1.05, 
        laborRate: 58, 
        factors: ['Tech boom impact', 'Rapid growth'],
        source: 'AGC Texas, Austin Chamber of Commerce'
    },
    'FL-MIA': { 
        name: 'Miami-Dade, FL', 
        multiplier: 1.15, 
        laborRate: 55, 
        factors: ['Hurricane codes', 'International market'],
        source: 'Florida Construction Industry, RSMeans 2024'
    },
    'WA-SEA': { 
        name: 'Seattle, WA', 
        multiplier: 1.25, 
        laborRate: 68, 
        factors: ['High labor costs', 'Tech industry influence'],
        source: 'Washington State Dept of Commerce, RSMeans 2024'
    },
    'IL-CHI': { 
        name: 'Chicago, IL', 
        multiplier: 1.12, 
        laborRate: 62, 
        factors: ['Union presence', 'Weather challenges'],
        source: 'Chicagoland AGC, RSMeans 2024'
    },
    'MA-BOS': { 
        name: 'Boston, MA', 
        multiplier: 1.22, 
        laborRate: 68, 
        factors: ['High education market', 'Historic preservation requirements'],
        source: 'Massachusetts Division of Professional Licensure, RSMeans 2024'
    },
    'CO-DEN': { 
        name: 'Denver, CO', 
        multiplier: 1.08, 
        laborRate: 58, 
        factors: ['Growing market', 'Mountain weather impact'],
        source: 'Colorado Contractor Association, RSMeans 2024'
    },
    'AZ-PHX': { 
        name: 'Phoenix, AZ', 
        multiplier: 0.98, 
        laborRate: 52, 
        factors: ['Desert climate considerations', 'Rapid growth'],
        source: 'Arizona Builders Alliance, RSMeans 2024'
    },
    'US-NAT': { 
        name: 'United States National Average', 
        multiplier: 1.00, 
        laborRate: 55, 
        factors: ['Baseline reference', 'Composite of all markets'],
        source: 'U.S. Bureau of Labor Statistics, RSMeans 2024'
    },
    
    // Canadian Markets
    'ON-TOR': { 
        name: 'Toronto, ON', 
        multiplier: 1.38, 
        laborRate: 68, 
        factors: ['Major metropolitan market', 'High cost of living', 'Provincial regulations'],
        source: 'Statistics Canada, Ontario Construction Secretariat'
    },
    'ON-OTT': { 
        name: 'Ottawa, ON', 
        multiplier: 1.15, 
        laborRate: 58, 
        factors: ['Government market', 'Bilingual requirements'],
        source: 'Statistics Canada, City of Ottawa'
    },
    'BC-VAN': { 
        name: 'Vancouver, BC', 
        multiplier: 1.42, 
        laborRate: 72, 
        factors: ['Very high cost of living', 'Seismic codes', 'International market'],
        source: 'BC Construction Association, Statistics Canada'
    },
    'BC-VIC': { 
        name: 'Victoria, BC', 
        multiplier: 1.25, 
        laborRate: 62, 
        factors: ['Island location', 'Heritage preservation'],
        source: 'Vancouver Island Construction Association'
    },
    'AB-CAL': { 
        name: 'Calgary, AB', 
        multiplier: 1.18, 
        laborRate: 62, 
        factors: ['Energy sector influence', 'Weather challenges'],
        source: 'Alberta Construction Association, Statistics Canada'
    },
    'AB-EDM': { 
        name: 'Edmonton, AB', 
        multiplier: 1.12, 
        laborRate: 58, 
        factors: ['Energy sector influence', 'Northern climate'],
        source: 'Alberta Construction Association'
    },
    'QC-MON': { 
        name: 'Montreal, QC', 
        multiplier: 1.08, 
        laborRate: 55, 
        factors: ['French language requirements', 'Provincial regulations'],
        source: 'Association de la construction du Québec, Statistics Canada'
    },
    'CA-NAT': { 
        name: 'Canada National Average', 
        multiplier: 1.15, 
        laborRate: 58, 
        factors: ['Baseline reference', 'Composite of all provinces'],
        source: 'Statistics Canada, Canadian Construction Association'
    }
};

// Base pricing templates for different task categories
const basePricingTemplates = {
    permits: { labor: 0, materials: 0, equipment: 0, permits: 1 },
    electrical: { labor: 0.6, materials: 0.25, equipment: 0.1, permits: 0.05 },
    plumbing: { labor: 0.55, materials: 0.3, equipment: 0.1, permits: 0.05 },
    framing: { labor: 0.65, materials: 0.3, equipment: 0.05, permits: 0 },
    drywall: { labor: 0.7, materials: 0.25, equipment: 0.05, permits: 0 },
    flooring: { labor: 0.4, materials: 0.55, equipment: 0.05, permits: 0 },
    kitchen: { labor: 0.3, materials: 0.65, equipment: 0.05, permits: 0 },
    bathroom: { labor: 0.45, materials: 0.5, equipment: 0.05, permits: 0 },
    hvac: { labor: 0.5, materials: 0.4, equipment: 0.08, permits: 0.02 },
    inspection: { labor: 0, materials: 0, equipment: 0, permits: 1 },
    painting: { labor: 0.75, materials: 0.2, equipment: 0.05, permits: 0 }
};

// Task Detail Modal Functions
function openTaskModal(taskId) {
    if (!currentWorkflowData) {
        console.error('No workflow data available');
        return;
    }
    
    const task = currentWorkflowData.nodes.find(node => node.id === taskId);
    if (!task) {
        console.error('Task not found:', taskId);
        return;
    }
    
    currentTaskBeingEdited = task;
    
    // Populate modal with task data
    document.getElementById('modalTaskTitle').textContent = `Edit: ${task.task}`;
    document.getElementById('modalTaskName').value = task.task;
    document.getElementById('modalTaskDuration').value = task.duration;
    document.getElementById('modalTaskDescription').value = task.details || '';
    
    // Populate pricing if available
    const pricing = task.pricing || { labor: 0, materials: 0, equipment: 0, permits: 0 };
    document.getElementById('modalLaborCost').value = pricing.labor;
    document.getElementById('modalMaterialCost').value = pricing.materials;
    document.getElementById('modalEquipmentCost').value = pricing.equipment;
    document.getElementById('modalPermitCost').value = pricing.permits;
    
    // Update total cost
    updateModalTotalCost();
    
    // Populate dependencies
    const dependencyContainer = document.getElementById('modalDependencies');
    if (task.dependencies && task.dependencies.length > 0) {
        const dependencyTasks = task.dependencies.map(depId => {
            const depTask = currentWorkflowData.nodes.find(node => node.id === depId);
            return depTask ? depTask.task : depId;
        }).join(', ');
        dependencyContainer.innerHTML = `<span class="text-blue-600">Depends on:</span> ${dependencyTasks}`;
    } else {
        dependencyContainer.innerHTML = '<span class="text-gray-500">No dependencies</span>';
    }
    
    // Show modal
    document.getElementById('taskDetailModal').classList.remove('hidden');
    
    // Add event listeners for cost calculation
    ['modalLaborCost', 'modalMaterialCost', 'modalEquipmentCost', 'modalPermitCost'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateModalTotalCost);
    });
}

function closeTaskModal() {
    document.getElementById('taskDetailModal').classList.add('hidden');
    currentTaskBeingEdited = null;
}

function updateModalTotalCost() {
    const labor = parseFloat(document.getElementById('modalLaborCost').value) || 0;
    const materials = parseFloat(document.getElementById('modalMaterialCost').value) || 0;
    const equipment = parseFloat(document.getElementById('modalEquipmentCost').value) || 0;
    const permits = parseFloat(document.getElementById('modalPermitCost').value) || 0;
    
    const total = labor + materials + equipment + permits;
    document.getElementById('modalTotalCost').textContent = `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function saveTaskChanges() {
    if (!currentTaskBeingEdited) return;
    
    // Update task properties
    currentTaskBeingEdited.task = document.getElementById('modalTaskName').value;
    currentTaskBeingEdited.duration = parseInt(document.getElementById('modalTaskDuration').value);
    currentTaskBeingEdited.details = document.getElementById('modalTaskDescription').value;
    
    // Update pricing
    currentTaskBeingEdited.pricing = {
        labor: parseFloat(document.getElementById('modalLaborCost').value) || 0,
        materials: parseFloat(document.getElementById('modalMaterialCost').value) || 0,
        equipment: parseFloat(document.getElementById('modalEquipmentCost').value) || 0,
        permits: parseFloat(document.getElementById('modalPermitCost').value) || 0
    };
    
    // Refresh the workflow display
    if (currentWorkflowData) {
        displayWorkflowVisualization(currentWorkflowData);
        
        // Show success message
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.innerHTML = '<i class="fas fa-check mr-2"></i>Task updated successfully!';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    closeTaskModal();
}

// Estimate Generation Functions
function generateDetailedEstimate() {
    console.log('🔧 Generate estimate clicked');
    console.log('Current workflow data:', currentWorkflowData);
    
    if (!currentWorkflowData) {
        console.error('❌ No workflow data available');
        alert('No workflow data available for estimate generation. Please generate a workflow first.');
        return;
    }
    
    console.log('✅ Workflow data found, generating estimate...');
    
    let totalCost = 0;
    const costBreakdown = {
        labor: 0,
        materials: 0,
        equipment: 0,
        permits: 0
    };
    
    const taskCosts = [];
    
    try {
        currentWorkflowData.nodes.forEach(task => {
            console.log('Processing task:', task.task, 'Pricing:', task.pricing);
            
            if (task.pricing) {
                const taskTotal = (task.pricing.labor || 0) + (task.pricing.materials || 0) + 
                                (task.pricing.equipment || 0) + (task.pricing.permits || 0);
                
                if (taskTotal > 0) {
                    taskCosts.push({
                        name: task.task,
                        duration: task.duration,
                        labor: task.pricing.labor || 0,
                        materials: task.pricing.materials || 0,
                        equipment: task.pricing.equipment || 0,
                        permits: task.pricing.permits || 0,
                        total: taskTotal
                    });
                    
                    costBreakdown.labor += task.pricing.labor || 0;
                    costBreakdown.materials += task.pricing.materials || 0;
                    costBreakdown.equipment += task.pricing.equipment || 0;
                    costBreakdown.permits += task.pricing.permits || 0;
                    totalCost += taskTotal;
                }
            }
        });
        
        console.log('📊 Cost calculation complete:', { totalCost, taskCosts: taskCosts.length, costBreakdown });
    } catch (error) {
        console.error('❌ Error calculating costs:', error);
        alert('Error calculating project costs. Please try again.');
        return;
    }
    
    // Generate estimate HTML
    console.log('📋 Calling showEstimateModal with:', { 
        taskCount: taskCosts.length, 
        totalCost: totalCost,
        costBreakdown: costBreakdown 
    });
    
    if (taskCosts.length === 0) {
        alert('No pricing data found in workflow. Please ensure tasks have pricing information.');
        return;
    }
    
    showEstimateModal(taskCosts, costBreakdown, totalCost);
}

function showEstimateModal(taskCosts, costBreakdown, totalCost) {
    console.log('🎯 Creating estimate modal...');
    
    // Test: Create a simple modal first
    if (!taskCosts || taskCosts.length === 0) {
        alert('No task costs available for estimate');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50';
    // Create a simple test modal first
    modal.innerHTML = `
        <div class="flex items-center justify-center min-h-screen p-4">
            <div class="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-2xl font-bold text-gray-900">
                            <i class="fas fa-calculator text-green-600 mr-2"></i>
                            Project Estimate - ${taskCosts.length} Tasks
                        </h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <!-- Total Cost -->
                    <div class="bg-gray-900 text-white p-6 rounded-lg mb-6">
                        <div class="text-center">
                            <div class="text-gray-300 text-sm">Total Project Cost</div>
                            <div class="text-4xl font-bold">$${totalCost.toLocaleString()}</div>
                        </div>
                    </div>
                    
                    <!-- Task List -->
                    <div class="space-y-2 mb-6" id="taskListContainer">
                        <!-- Tasks will be inserted here -->
                    </div>
                    </div>
                    
                    <!-- Close Button -->
                    <div class="text-center">
                        <button onclick="this.closest('.fixed').remove()" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
                            Close Estimate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add tasks to the container after modal is created
    const taskListContainer = modal.querySelector('#taskListContainer');
    taskCosts.forEach(task => {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'flex justify-between items-center p-3 bg-gray-50 rounded';
        taskDiv.innerHTML = `
            <span class="font-medium">${task.name}</span>
            <span class="font-bold text-green-600">$${task.total.toLocaleString()}</span>
        `;
        taskListContainer.appendChild(taskDiv);
    });
}

function downloadEstimate() {
    alert('PDF download functionality would be implemented here');
}

function emailEstimate() {
    alert('Email estimate functionality would be implemented here');
}

// Regional Pricing Functions
function updateRegionalPricing() {
    const locationSelect = document.getElementById('locationSelect');
    const selectedRegion = locationSelect.value;
    
    if (!selectedRegion) {
        document.getElementById('costMultiplier').textContent = '1.00x';
        document.getElementById('marketFactors').innerHTML = 'Select location for market data';
        return;
    }
    
    currentRegion = selectedRegion;
    const regionData = regionalPricingData[selectedRegion];
    
    if (regionData) {
        // Update display
        document.getElementById('costMultiplier').textContent = `${regionData.multiplier.toFixed(2)}x`;
        document.getElementById('marketFactors').innerHTML = `
            <div class="space-y-1">
                <div><strong>Labor Rate:</strong> $${regionData.laborRate}/hr</div>
                <div><strong>Factors:</strong> ${regionData.factors.join(', ')}</div>
                <div class="text-xs text-blue-500 mt-1">Source: ${regionData.source}</div>
            </div>
        `;
        
        // Update all task pricing in current workflow
        if (currentWorkflowData) {
            updateAllTaskPricing(regionData);
            
            // Refresh workflow display
            displayWorkflowVisualization(currentWorkflowData);
            
            // Show success notification
            showNotification(`✅ Pricing updated for ${regionData.name}`, 'success');
        }
    }
}

function updateAllTaskPricing(regionData) {
    currentWorkflowData.nodes.forEach(task => {
        if (task.pricing) {
            // Apply regional multiplier to existing pricing
            const adjustedPricing = {
                labor: Math.round((task.pricing.labor * regionData.multiplier)),
                materials: Math.round((task.pricing.materials * regionData.multiplier)),
                equipment: Math.round((task.pricing.equipment * regionData.multiplier)),
                permits: Math.round((task.pricing.permits * regionData.multiplier))
            };
            
            task.pricing = adjustedPricing;
        }
    });
}

function generateRegionalPricing(taskType, baseAmount, region) {
    const template = basePricingTemplates[taskType] || basePricingTemplates.electrical;
    const regionData = regionalPricingData[region] || regionalPricingData['US-NAT'];
    
    return {
        labor: Math.round(baseAmount * template.labor * regionData.multiplier),
        materials: Math.round(baseAmount * template.materials * regionData.multiplier),
        equipment: Math.round(baseAmount * template.equipment * regionData.multiplier),
        permits: Math.round(baseAmount * template.permits * regionData.multiplier)
    };
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all`;
    notification.innerHTML = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Auto-detect location (optional enhancement)
function detectUserLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // This would typically use a geocoding service to convert coordinates to region
                // For demo purposes, we'll just show a notification
                showNotification('📍 Location detected - Select your region above for accurate pricing', 'info');
            },
            (error) => {
                console.log('Geolocation not available or denied');
            }
        );
    }
}

// Performance Monitoring
if ('PerformanceObserver' in window) {
    const perfObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
                console.log('LCP:', entry.startTime);
            }
        });
    });
    
    perfObserver.observe({ entryTypes: ['largest-contentful-paint'] });
}

// Debug: Verify main.js loaded completely
console.log('✅ main.js loaded successfully');
console.log('🔧 analyzeProject function available:', typeof analyzeProject === 'function');

// Add missing closing brace
}