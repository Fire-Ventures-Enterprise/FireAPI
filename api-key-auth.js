/**
 * 🔐 API Key Authentication System
 * Secure authentication for FireBuild.AI and other authorized clients
 */

const crypto = require('crypto');

class APIKeyAuth {
    constructor() {
        // Initialize with FireBuild.AI API keys
        this.apiKeys = new Map();
        this.setupFireBuildAIKeys();
        
        // Rate limiting per API key
        this.rateLimits = new Map();
        this.setupRateLimiting();
    }

    /**
     * 🔥 Setup FireBuild.AI API Keys
     */
    setupFireBuildAIKeys() {
        // Static API keys for FireBuild.AI (consistent across deployments)
        const firebuildKeys = {
            // Production key for FireBuild.AI
            production: {
                key: 'fb_prod_4ff496504b6a261c7a871fa08cbb47fd73709a4c43dcd0b4027ffd8019326138',
                name: 'FireBuild.AI Production',
                permissions: ['estimates', 'carpentry', 'electrical', 'plumbing', 'painting', 'orchestration', 'health'],
                domains: ['firebuild.ai', 'www.firebuild.ai', '*.firebuild.ai', '*.e2b.dev', 'localhost'], // Added sandbox and local domains
                rateLimit: {
                    requests: 1000,    // 1000 requests per hour
                    window: 3600000    // 1 hour in ms
                },
                enabled: true,
                created: '2025-09-21T20:00:00.000Z'
            },
            
            // Development key for FireBuild.AI
            development: {
                key: 'fb_dev_5ca45e43e6cde5d55f29382e83a71eddb4c71e51709ecd4f5f267c65c0a59a9d',
                name: 'FireBuild.AI Development', 
                permissions: ['estimates', 'carpentry', 'electrical', 'plumbing', 'painting', 'orchestration', 'health'],
                domains: ['localhost', '127.0.0.1', 'dev.firebuild.ai', 'staging.firebuild.ai'],
                rateLimit: {
                    requests: 500,     // 500 requests per hour
                    window: 3600000    // 1 hour in ms
                },
                enabled: true,
                created: '2025-09-21T20:00:00.000Z'
            },

            // Demo key for testing
            demo: {
                key: 'fb_demo_68657471b5a684d79aed27f4a56c229b',
                name: 'FireBuild.AI Demo',
                permissions: ['estimates', 'health', 'carpentry', 'electrical', 'plumbing', 'painting', 'orchestration'],
                domains: ['*'], // Allow from anywhere for demo
                rateLimit: {
                    requests: 100,     // 100 requests per hour
                    window: 3600000    // 1 hour in ms
                },
                enabled: true,
                created: '2025-09-21T20:00:00.000Z'
            }
        };

        // Store API keys
        Object.values(firebuildKeys).forEach(keyData => {
            this.apiKeys.set(keyData.key, keyData);
        });

        // Log the generated keys (for admin access)
        console.log('🔐 [API-KEY-AUTH] FireBuild.AI API Keys Generated:');
        console.log('=====================================');
        Object.entries(firebuildKeys).forEach(([type, data]) => {
            console.log(`${type.toUpperCase()}: ${data.key}`);
            console.log(`  Name: ${data.name}`);
            console.log(`  Permissions: ${data.permissions.join(', ')}`);
            console.log(`  Rate Limit: ${data.rateLimit.requests}/hour`);
            console.log('---');
        });

        // Store keys for later retrieval
        this.firebuildKeys = firebuildKeys;
    }

    /**
     * ⏱️ Setup rate limiting tracking
     */
    setupRateLimiting() {
        // Clean up old rate limit entries every 10 minutes
        setInterval(() => {
            const now = Date.now();
            for (const [key, data] of this.rateLimits.entries()) {
                if (now - data.windowStart > data.windowSize) {
                    this.rateLimits.delete(key);
                }
            }
        }, 600000); // 10 minutes
    }

    /**
     * 🛡️ API Key Authentication Middleware
     */
    authenticate() {
        return (req, res, next) => {
            try {
                // Skip authentication for certain endpoints
                if (this.shouldSkipAuth(req.path)) {
                    return next();
                }

                // Extract API key from headers
                const apiKey = this.extractAPIKey(req);
                
                if (!apiKey) {
                    return res.status(401).json({
                        success: false,
                        error: {
                            code: 'MISSING_API_KEY',
                            message: 'API key is required. Please provide your API key in the X-API-Key header.',
                            documentation: 'https://github.com/nasman1965/FireAPI/blob/main/FIREBUILD_AI_INTEGRATION.md'
                        }
                    });
                }

                // Validate API key
                const keyData = this.validateAPIKey(apiKey, req);
                
                if (!keyData.valid) {
                    return res.status(401).json({
                        success: false,
                        error: {
                            code: 'INVALID_API_KEY',
                            message: keyData.error || 'Invalid API key provided.',
                            hint: 'Please check your API key and try again.'
                        }
                    });
                }

                // Check rate limiting
                const rateLimitResult = this.checkRateLimit(apiKey, keyData.data);
                
                if (!rateLimitResult.allowed) {
                    return res.status(429).json({
                        success: false,
                        error: {
                            code: 'RATE_LIMIT_EXCEEDED',
                            message: `Rate limit exceeded for API key. ${rateLimitResult.remaining} requests remaining.`,
                            resetTime: rateLimitResult.resetTime,
                            limit: rateLimitResult.limit
                        }
                    });
                }

                // Add API key info to request for logging
                req.apiKey = {
                    key: apiKey,
                    name: keyData.data.name,
                    permissions: keyData.data.permissions,
                    rateLimit: rateLimitResult
                };

                // Log API usage
                console.log(`🔐 [API-AUTH] ${keyData.data.name} - ${req.method} ${req.path}`);
                
                next();

            } catch (error) {
                console.error('🚨 [API-AUTH] Authentication error:', error);
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'AUTH_ERROR',
                        message: 'Authentication system error. Please try again.'
                    }
                });
            }
        };
    }

    /**
     * 📋 Extract API key from request headers
     */
    extractAPIKey(req) {
        // Try multiple header locations
        return req.headers['x-api-key'] || 
               req.headers['api-key'] ||
               req.headers['authorization']?.replace(/^Bearer\s+/, '') ||
               req.query.api_key;
    }

    /**
     * ✅ Validate API key and permissions
     */
    validateAPIKey(apiKey, req) {
        const keyData = this.apiKeys.get(apiKey);
        
        if (!keyData) {
            return { valid: false, error: 'API key not found' };
        }

        if (!keyData.enabled) {
            return { valid: false, error: 'API key has been disabled' };
        }

        // Check domain restrictions (if any)
        if (keyData.domains && keyData.domains.length > 0 && !keyData.domains.includes('*')) {
            const origin = req.headers.origin || req.headers.referer || 'unknown';
            const host = req.headers.host || 'unknown';
            
            const allowedDomain = keyData.domains.some(domain => {
                if (domain.startsWith('*')) {
                    const baseDomain = domain.substring(2); // Remove "*."
                    return origin.includes(baseDomain) || host.includes(baseDomain);
                }
                return origin.includes(domain) || host.includes(domain) || domain === 'localhost' || domain === '127.0.0.1';
            });

            if (!allowedDomain) {
                return { valid: false, error: `Domain not authorized for this API key: ${origin}` };
            }
        }

        // Check endpoint permissions
        const endpoint = this.getEndpointCategory(req.path);
        if (!keyData.permissions.includes(endpoint)) {
            return { valid: false, error: `No permission for endpoint: ${endpoint}` };
        }

        return { valid: true, data: keyData };
    }

    /**
     * ⏱️ Check rate limiting for API key
     */
    checkRateLimit(apiKey, keyData) {
        const now = Date.now();
        const rateLimitKey = apiKey;
        
        let rateLimitData = this.rateLimits.get(rateLimitKey);
        
        if (!rateLimitData || (now - rateLimitData.windowStart) > keyData.rateLimit.window) {
            // New window
            rateLimitData = {
                requests: 0,
                windowStart: now,
                windowSize: keyData.rateLimit.window,
                limit: keyData.rateLimit.requests
            };
        }

        rateLimitData.requests++;
        this.rateLimits.set(rateLimitKey, rateLimitData);

        const allowed = rateLimitData.requests <= rateLimitData.limit;
        const remaining = Math.max(0, rateLimitData.limit - rateLimitData.requests);
        const resetTime = new Date(rateLimitData.windowStart + rateLimitData.windowSize);

        return {
            allowed,
            remaining,
            limit: rateLimitData.limit,
            resetTime: resetTime.toISOString(),
            current: rateLimitData.requests
        };
    }

    /**
     * 🚫 Check if endpoint should skip authentication
     */
    shouldSkipAuth(path) {
        const publicEndpoints = [
            '/',                    // Root API info
            '/health',              // Basic health check
            '/docs',                // API documentation
            '/admin/api-keys',      // Admin API key retrieval
            '/admin/integration-guide' // Admin integration guide
        ];
        
        return publicEndpoints.includes(path);
    }

    /**
     * 📂 Get endpoint category for permission checking
     */
    getEndpointCategory(path) {
        if (path.startsWith('/api/estimates')) return 'estimates';
        if (path.startsWith('/api/carpentry')) return 'carpentry';
        if (path.startsWith('/api/electrical')) return 'electrical';
        if (path.startsWith('/api/plumbing')) return 'plumbing';
        if (path.startsWith('/api/painting')) return 'painting';
        if (path.startsWith('/api/microservices')) return 'orchestration';
        if (path.startsWith('/api/trades')) return 'orchestration';
        if (path.includes('health')) return 'health';
        
        return 'general';
    }

    /**
     * 📊 Get API key usage statistics
     */
    getUsageStats() {
        const stats = {
            totalKeys: this.apiKeys.size,
            activeKeys: Array.from(this.apiKeys.values()).filter(k => k.enabled).length,
            currentRateLimits: this.rateLimits.size,
            keyUsage: []
        };

        // Add usage data for each key
        for (const [key, data] of this.apiKeys.entries()) {
            const rateLimitData = this.rateLimits.get(key);
            stats.keyUsage.push({
                name: data.name,
                key: key.substring(0, 12) + '...',
                enabled: data.enabled,
                permissions: data.permissions,
                currentUsage: rateLimitData?.requests || 0,
                rateLimit: data.rateLimit.requests,
                lastUsed: rateLimitData ? new Date(rateLimitData.windowStart).toISOString() : 'Never'
            });
        }

        return stats;
    }

    /**
     * 🔑 Get FireBuild.AI API keys (for admin use)
     */
    getFireBuildAIKeys() {
        return this.firebuildKeys;
    }
}

module.exports = APIKeyAuth;