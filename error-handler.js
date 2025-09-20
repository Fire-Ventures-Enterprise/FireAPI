/**
 * FireBuildAI API Error Handler
 * Comprehensive error handling, validation, and logging for the construction management API
 */

class APIError extends Error {
    constructor(message, statusCode = 500, errorCode = null, details = null) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

class ValidationError extends APIError {
    constructor(message, field = null, value = null) {
        super(message, 400, 'VALIDATION_ERROR');
        this.field = field;
        this.value = value;
    }
}

class BusinessLogicError extends APIError {
    constructor(message, context = null) {
        super(message, 422, 'BUSINESS_LOGIC_ERROR');
        this.context = context;
    }
}

class RateLimitError extends APIError {
    constructor(message = 'Rate limit exceeded', retryAfter = 900) {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
        this.retryAfter = retryAfter;
    }
}

class ErrorHandler {
    constructor() {
        this.errorCounts = new Map();
        this.errorPatterns = new Map();
    }

    /**
     * Comprehensive request validation
     */
    validateRequest(method, path, body = {}, query = {}, headers = {}) {
        const errors = [];

        // Validate HTTP method
        if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            errors.push(new ValidationError(`Invalid HTTP method: ${method}`, 'method', method));
        }

        // Validate path format
        if (!path || !path.startsWith('/api/')) {
            errors.push(new ValidationError(`Invalid API path: ${path}`, 'path', path));
        }

        // Validate content type for POST requests
        if (method === 'POST' && headers['content-type'] && 
            !headers['content-type'].includes('application/json')) {
            errors.push(new ValidationError(
                'POST requests must use application/json content type', 
                'content-type', 
                headers['content-type']
            ));
        }

        // Validate request body size (10MB limit)
        const bodySize = JSON.stringify(body).length;
        if (bodySize > 10 * 1024 * 1024) {
            errors.push(new ValidationError(
                `Request body too large: ${bodySize} bytes (max 10MB)`,
                'body_size',
                bodySize
            ));
        }

        // Endpoint-specific validation
        this.validateEndpointRequirements(method, path, body, query, errors);

        if (errors.length > 0) {
            throw new ValidationError('Request validation failed', 'request', errors);
        }
    }

    /**
     * Validate endpoint-specific requirements
     */
    validateEndpointRequirements(method, path, body, query, errors) {
        const endpoint = `${method} ${path}`;

        switch (endpoint) {
            case 'POST /api/projects/analyze':
                this.validateProjectAnalysis(body, errors);
                break;

            case 'POST /api/projects/complete-analysis':
                this.validateCompleteAnalysis(body, errors);
                break;

            case 'POST /api/workflows/generate':
                this.validateWorkflowGeneration(body, errors);
                break;

            case 'POST /api/costs/estimate':
                this.validateCostEstimation(body, errors);
                break;

            case 'GET /api/costs/regions':
                this.validateRegionsQuery(query, errors);
                break;

            case 'GET /api/workflows/templates':
                this.validateTemplatesQuery(query, errors);
                break;
        }
    }

    /**
     * Validate project analysis request
     */
    validateProjectAnalysis(body, errors) {
        if (!body.description) {
            errors.push(new ValidationError('Project description is required', 'description'));
        } else if (typeof body.description !== 'string') {
            errors.push(new ValidationError('Description must be a string', 'description', typeof body.description));
        } else if (body.description.length < 10) {
            errors.push(new ValidationError('Description too short (minimum 10 characters)', 'description', body.description.length));
        } else if (body.description.length > 5000) {
            errors.push(new ValidationError('Description too long (maximum 5000 characters)', 'description', body.description.length));
        }

        if (body.projectDetails && typeof body.projectDetails !== 'object') {
            errors.push(new ValidationError('Project details must be an object', 'projectDetails', typeof body.projectDetails));
        }

        if (body.options && typeof body.options !== 'object') {
            errors.push(new ValidationError('Options must be an object', 'options', typeof body.options));
        }
    }

    /**
     * Validate complete analysis request
     */
    validateCompleteAnalysis(body, errors) {
        this.validateProjectAnalysis(body, errors);

        if (body.region && typeof body.region !== 'string') {
            errors.push(new ValidationError('Region must be a string', 'region', typeof body.region));
        }

        if (body.region && !this.isValidRegion(body.region)) {
            errors.push(new ValidationError(`Invalid region: ${body.region}`, 'region', body.region));
        }
    }

    /**
     * Validate workflow generation request
     */
    validateWorkflowGeneration(body, errors) {
        if (!body.projectType) {
            errors.push(new ValidationError('Project type is required', 'projectType'));
        } else if (typeof body.projectType !== 'string') {
            errors.push(new ValidationError('Project type must be a string', 'projectType', typeof body.projectType));
        } else if (!this.isValidProjectType(body.projectType)) {
            errors.push(new ValidationError(`Invalid project type: ${body.projectType}`, 'projectType', body.projectType));
        }

        if (body.projectDetails) {
            if (typeof body.projectDetails !== 'object') {
                errors.push(new ValidationError('Project details must be an object', 'projectDetails', typeof body.projectDetails));
            } else {
                this.validateProjectDetails(body.projectDetails, errors);
            }
        }

        if (body.region && !this.isValidRegion(body.region)) {
            errors.push(new ValidationError(`Invalid region: ${body.region}`, 'region', body.region));
        }
    }

    /**
     * Validate cost estimation request
     */
    validateCostEstimation(body, errors) {
        if (!body.projectType) {
            errors.push(new ValidationError('Project type is required', 'projectType'));
        }

        if (body.tasks && !Array.isArray(body.tasks)) {
            errors.push(new ValidationError('Tasks must be an array', 'tasks', typeof body.tasks));
        } else if (body.tasks) {
            body.tasks.forEach((task, index) => {
                if (!task.name) {
                    errors.push(new ValidationError(`Task ${index} missing name`, `tasks[${index}].name`));
                }
                if (task.duration && (typeof task.duration !== 'number' || task.duration <= 0)) {
                    errors.push(new ValidationError(`Task ${index} invalid duration`, `tasks[${index}].duration`, task.duration));
                }
            });
        }

        if (body.materials && !Array.isArray(body.materials)) {
            errors.push(new ValidationError('Materials must be an array', 'materials', typeof body.materials));
        }

        if (body.region && !this.isValidRegion(body.region)) {
            errors.push(new ValidationError(`Invalid region: ${body.region}`, 'region', body.region));
        }
    }

    /**
     * Validate regions query parameters
     */
    validateRegionsQuery(query, errors) {
        if (query.detailed && !['true', 'false'].includes(query.detailed)) {
            errors.push(new ValidationError('Detailed parameter must be "true" or "false"', 'detailed', query.detailed));
        }
    }

    /**
     * Validate templates query parameters
     */
    validateTemplatesQuery(query, errors) {
        if (query.projectType && !this.isValidProjectType(query.projectType)) {
            errors.push(new ValidationError(`Invalid project type: ${query.projectType}`, 'projectType', query.projectType));
        }
    }

    /**
     * Validate project details object
     */
    validateProjectDetails(details, errors) {
        if (details.size && (typeof details.size !== 'number' || details.size <= 0)) {
            errors.push(new ValidationError('Size must be a positive number', 'projectDetails.size', details.size));
        }

        if (details.budget && (typeof details.budget !== 'number' || details.budget <= 0)) {
            errors.push(new ValidationError('Budget must be a positive number', 'projectDetails.budget', details.budget));
        }

        if (details.timeline && typeof details.timeline !== 'string') {
            errors.push(new ValidationError('Timeline must be a string', 'projectDetails.timeline', typeof details.timeline));
        }

        if (details.complexity && !['low', 'medium', 'high'].includes(details.complexity)) {
            errors.push(new ValidationError('Complexity must be low, medium, or high', 'projectDetails.complexity', details.complexity));
        }

        if (details.features && !Array.isArray(details.features)) {
            errors.push(new ValidationError('Features must be an array', 'projectDetails.features', typeof details.features));
        }
    }

    /**
     * Check if region is valid
     */
    isValidRegion(region) {
        const validRegions = [
            'toronto', 'vancouver', 'montreal', 'calgary', 'edmonton', 'ottawa', 'winnipeg',
            'new_york', 'los_angeles', 'chicago', 'houston', 'phoenix', 'philadelphia',
            'san_antonio', 'san_diego', 'dallas', 'san_jose', 'austin', 'jacksonville',
            'fort_worth', 'columbus', 'charlotte', 'san_francisco', 'indianapolis',
            'seattle', 'denver', 'washington_dc', 'boston', 'el_paso', 'nashville',
            'detroit', 'oklahoma_city', 'portland', 'las_vegas', 'memphis'
        ];
        return validRegions.includes(region.toLowerCase());
    }

    /**
     * Check if project type is valid
     */
    isValidProjectType(projectType) {
        const validTypes = [
            'home_addition', 'kitchen_renovation', 'bathroom_renovation', 'basement_finish',
            'deck_construction', 'fence_installation', 'roofing', 'siding', 'flooring',
            'electrical_upgrade', 'plumbing_renovation', 'hvac_installation', 'insulation',
            'drywall', 'painting', 'tile_work', 'hardwood_installation', 'carpet_installation',
            'window_replacement', 'door_installation', 'garage_construction', 'shed_construction',
            'pool_installation', 'landscaping', 'concrete_work', 'masonry', 'demolition'
        ];
        return validTypes.includes(projectType.toLowerCase());
    }

    /**
     * Business logic validation for construction projects
     */
    validateBusinessLogic(projectData) {
        const errors = [];

        // Validate timeline vs complexity
        if (projectData.complexity === 'high' && projectData.estimatedDuration < 30) {
            errors.push(new BusinessLogicError(
                'High complexity projects typically require more than 30 days',
                { complexity: projectData.complexity, duration: projectData.estimatedDuration }
            ));
        }

        // Validate budget vs scope
        if (projectData.budget && projectData.estimatedCost) {
            const variance = Math.abs(projectData.budget - projectData.estimatedCost) / projectData.budget;
            if (variance > 0.5) {
                errors.push(new BusinessLogicError(
                    `Budget and estimated cost have significant variance: ${(variance * 100).toFixed(1)}%`,
                    { budget: projectData.budget, estimatedCost: projectData.estimatedCost }
                ));
            }
        }

        // Validate seasonal considerations
        if (projectData.tasks && projectData.startDate) {
            const weatherSensitiveTasks = projectData.tasks.filter(task => task.weather_dependent);
            const startMonth = new Date(projectData.startDate).getMonth();
            
            if (weatherSensitiveTasks.length > 0 && [11, 0, 1, 2].includes(startMonth)) {
                errors.push(new BusinessLogicError(
                    'Weather-sensitive tasks scheduled during winter months may cause delays',
                    { weatherSensitiveTasks: weatherSensitiveTasks.length, startMonth }
                ));
            }
        }

        // Validate permit requirements
        if (projectData.projectType === 'home_addition' && !projectData.permits?.includes('building_permit')) {
            errors.push(new BusinessLogicError(
                'Home additions typically require building permits',
                { projectType: projectData.projectType, permits: projectData.permits }
            ));
        }

        if (errors.length > 0) {
            throw new BusinessLogicError('Business logic validation failed', errors);
        }
    }

    /**
     * Sanitize input data to prevent injection attacks
     */
    sanitizeInput(data) {
        if (typeof data === 'string') {
            return data
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .trim();
        }
        
        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeInput(item));
        }
        
        if (data && typeof data === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value);
            }
            return sanitized;
        }
        
        return data;
    }

    /**
     * Rate limiting check with sophisticated algorithms
     */
    async checkRateLimit(clientId, endpoint) {
        const key = `${clientId}:${endpoint}`;
        const now = Date.now();
        
        // Get current request count for this client/endpoint
        if (!this.rateLimits) {
            this.rateLimits = new Map();
        }
        
        const clientLimits = this.rateLimits.get(key) || {
            requests: [],
            windowStart: now
        };
        
        // Clean old requests (15 minute window)
        const windowMs = 15 * 60 * 1000;
        clientLimits.requests = clientLimits.requests.filter(timestamp => 
            now - timestamp < windowMs
        );
        
        // Check if limit exceeded
        const maxRequests = this.getEndpointLimit(endpoint);
        if (clientLimits.requests.length >= maxRequests) {
            const oldestRequest = Math.min(...clientLimits.requests);
            const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
            
            throw new RateLimitError(
                `Rate limit exceeded for ${endpoint}. Try again in ${retryAfter} seconds.`,
                retryAfter
            );
        }
        
        // Add current request
        clientLimits.requests.push(now);
        this.rateLimits.set(key, clientLimits);
        
        return true;
    }

    /**
     * Get rate limit for specific endpoint
     */
    getEndpointLimit(endpoint) {
        const limits = {
            '/api/projects/complete-analysis': 10, // More intensive endpoint
            '/api/workflows/generate': 20,
            '/api/costs/estimate': 30,
            '/api/projects/analyze': 50,
            'default': 100
        };
        
        return limits[endpoint] || limits.default;
    }

    /**
     * Handle and format errors for API responses
     */
    handleError(error, context = {}) {
        // Track error for monitoring
        this.trackError(error, context);

        // Format error response
        let statusCode = 500;
        let errorCode = 'INTERNAL_SERVER_ERROR';
        let message = 'An unexpected error occurred';
        let details = null;

        if (error instanceof ValidationError) {
            statusCode = 400;
            errorCode = 'VALIDATION_ERROR';
            message = error.message;
            details = {
                field: error.field,
                value: error.value,
                errors: error.details
            };
        } else if (error instanceof BusinessLogicError) {
            statusCode = 422;
            errorCode = 'BUSINESS_LOGIC_ERROR';
            message = error.message;
            details = error.context;
        } else if (error instanceof RateLimitError) {
            statusCode = 429;
            errorCode = 'RATE_LIMIT_EXCEEDED';
            message = error.message;
            details = { retryAfter: error.retryAfter };
        } else if (error instanceof APIError) {
            statusCode = error.statusCode;
            errorCode = error.errorCode || 'API_ERROR';
            message = error.message;
            details = error.details;
        } else {
            // Log unexpected errors for debugging
            console.error('Unexpected error:', error);
            message = process.env.NODE_ENV === 'production' ? 
                'An unexpected error occurred' : 
                error.message;
        }

        return {
            success: false,
            error: {
                code: errorCode,
                message,
                details,
                timestamp: new Date().toISOString(),
                requestId: context.requestId,
                ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
            }
        };
    }

    /**
     * Track errors for monitoring and analytics
     */
    trackError(error, context) {
        const errorKey = `${error.name}:${error.message}`;
        const count = this.errorCounts.get(errorKey) || 0;
        this.errorCounts.set(errorKey, count + 1);

        // Log error with context
        console.error('API Error:', {
            type: error.name,
            message: error.message,
            statusCode: error.statusCode,
            context,
            timestamp: new Date().toISOString(),
            count: count + 1
        });

        // Alert on high error rates (placeholder for monitoring integration)
        if (count > 10) {
            console.warn(`High error rate detected: ${errorKey} (${count} occurrences)`);
        }
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
        const topErrors = Array.from(this.errorCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        return {
            totalErrors,
            uniqueErrors: this.errorCounts.size,
            topErrors: topErrors.map(([error, count]) => ({ error, count })),
            lastUpdated: new Date().toISOString()
        };
    }
}

module.exports = {
    ErrorHandler,
    APIError,
    ValidationError,
    BusinessLogicError,
    RateLimitError
};