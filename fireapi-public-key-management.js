/**
 * 🌐 FireAPI.dev Public API Key Management System
 * Manages API keys for external developers using the Room Visualizer API
 */

const crypto = require('crypto');

class FireAPIPublicKeyManager {
    constructor() {
        // Initialize public API keys for external developers
        this.publicKeys = new Map();
        this.keyUsage = new Map();
        this.setupPublicAPIKeys();
        
        // Rate limiting per API key
        this.rateLimits = new Map();
        this.setupRateLimiting();
        
        // Key generation and validation utilities
        this.keyPrefix = 'fireapi_';
        this.keyLength = 64; // 64 character keys for security
    }

    /**
     * 🔑 Setup Public API Keys for external developers
     */
    setupPublicAPIKeys() {
        // Demo keys for testing and documentation
        const demoKeys = {
            // Public demo key for documentation examples
            demo: {
                key: 'fireapi_demo_a1b2c3d4e5f67890abcdef1234567890fedcba0987654321',
                name: 'Public Demo Key',
                description: 'Demo key for testing Room Visualizer API',
                permissions: ['room-visualizer', 'materials', 'upload-image'],
                tier: 'demo',
                domains: ['*'], // Allow from anywhere for demo
                rateLimit: {
                    requests: 50,       // 50 requests per hour
                    window: 3600000,    // 1 hour in ms
                    imageUploads: 10    // 10 image uploads per hour
                },
                enabled: true,
                created: new Date().toISOString(),
                expires: null, // Demo keys don't expire
                usage: {
                    totalRequests: 0,
                    totalImageUploads: 0,
                    lastUsed: null
                }
            },

            // Sample developer key (would be generated dynamically)
            developer_sample: {
                key: 'fireapi_dev_9876543210abcdef1234567890abcdef0123456789abcdef',
                name: 'Sample Developer Key',
                description: 'Example key for interior design app integration',
                permissions: ['room-visualizer', 'materials', 'upload-image', 'cost-estimation'],
                tier: 'developer',
                domains: ['example.com', '*.example.com', 'localhost'], 
                rateLimit: {
                    requests: 500,      // 500 requests per hour
                    window: 3600000,    // 1 hour in ms
                    imageUploads: 100   // 100 image uploads per hour
                },
                enabled: true,
                created: new Date().toISOString(),
                expires: null,
                usage: {
                    totalRequests: 0,
                    totalImageUploads: 0,
                    lastUsed: null
                }
            }
        };

        // Store public API keys
        Object.values(demoKeys).forEach(keyData => {
            this.publicKeys.set(keyData.key, keyData);
        });

        // Initialize usage tracking
        Object.values(demoKeys).forEach(keyData => {
            this.keyUsage.set(keyData.key, {
                requests: [],
                imageUploads: [],
                lastCleanup: Date.now()
            });
        });

        console.log('🌐 [FIREAPI-PUBLIC] Public API Keys Initialized:');
        console.log('===============================================');
        Object.entries(demoKeys).forEach(([type, data]) => {
            console.log(`${type.toUpperCase()}: ${data.key}`);
            console.log(`  Name: ${data.name}`);
            console.log(`  Tier: ${data.tier}`);
            console.log(`  Rate Limit: ${data.rateLimit.requests}/hour, ${data.rateLimit.imageUploads} uploads/hour`);
            console.log('---');
        });

        this.demoKeys = demoKeys;
    }

    /**
     * 🎯 Generate new API key for developer
     */
    generateAPIKey(developerInfo) {
        const {
            name,
            email,
            company,
            description,
            tier = 'developer',
            domains = [],
            customRateLimit = null
        } = developerInfo;

        // Generate secure API key
        const keyId = crypto.randomBytes(32).toString('hex');
        const apiKey = `${this.keyPrefix}${tier}_${keyId}`;

        // Define rate limits based on tier
        const rateLimits = {
            demo: {
                requests: 50,
                window: 3600000,
                imageUploads: 10
            },
            developer: {
                requests: 500,
                window: 3600000,
                imageUploads: 100
            },
            business: {
                requests: 2000,
                window: 3600000,
                imageUploads: 500
            },
            enterprise: {
                requests: 10000,
                window: 3600000,
                imageUploads: 2000
            }
        };

        const keyData = {
            key: apiKey,
            name: name,
            email: email,
            company: company,
            description: description,
            permissions: ['room-visualizer', 'materials', 'upload-image', 'cost-estimation'],
            tier: tier,
            domains: domains.length > 0 ? domains : ['*'],
            rateLimit: customRateLimit || rateLimits[tier],
            enabled: true,
            created: new Date().toISOString(),
            expires: tier === 'demo' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
            usage: {
                totalRequests: 0,
                totalImageUploads: 0,
                lastUsed: null
            }
        };

        // Store the new key
        this.publicKeys.set(apiKey, keyData);
        this.keyUsage.set(apiKey, {
            requests: [],
            imageUploads: [],
            lastCleanup: Date.now()
        });

        return {
            success: true,
            data: {
                apiKey: apiKey,
                tier: tier,
                rateLimit: keyData.rateLimit,
                permissions: keyData.permissions,
                expires: keyData.expires
            }
        };
    }

    /**
     * 🔍 Validate API key and return key data
     */
    validateAPIKey(apiKey, request = null) {
        // Check if key exists
        if (!this.publicKeys.has(apiKey)) {
            return {
                valid: false,
                error: 'API key not found. Please check your key or contact support.',
                code: 'KEY_NOT_FOUND'
            };
        }

        const keyData = this.publicKeys.get(apiKey);

        // Check if key is enabled
        if (!keyData.enabled) {
            return {
                valid: false,
                error: 'API key has been disabled. Please contact support.',
                code: 'KEY_DISABLED'
            };
        }

        // Check if key is expired
        if (keyData.expires && new Date(keyData.expires) < new Date()) {
            return {
                valid: false,
                error: 'API key has expired. Please renew your key.',
                code: 'KEY_EXPIRED'
            };
        }

        // Check domain restrictions (if not wildcard)
        if (request && keyData.domains && !keyData.domains.includes('*')) {
            const origin = request.get('Origin') || request.get('Referer');
            if (origin && !this.isDomainAllowed(origin, keyData.domains)) {
                return {
                    valid: false,
                    error: 'Domain not authorized for this API key.',
                    code: 'DOMAIN_NOT_ALLOWED'
                };
            }
        }

        return {
            valid: true,
            data: keyData
        };
    }

    /**
     * 🏢 Check if domain is allowed for API key
     */
    isDomainAllowed(origin, allowedDomains) {
        const url = new URL(origin);
        const domain = url.hostname;

        for (const allowedDomain of allowedDomains) {
            // Exact match
            if (allowedDomain === domain) {
                return true;
            }

            // Wildcard subdomain match (*.example.com)
            if (allowedDomain.startsWith('*.')) {
                const baseDomain = allowedDomain.substring(2);
                if (domain.endsWith('.' + baseDomain) || domain === baseDomain) {
                    return true;
                }
            }

            // Localhost development
            if (allowedDomain === 'localhost' && (domain === 'localhost' || domain === '127.0.0.1')) {
                return true;
            }
        }

        return false;
    }

    /**
     * ⏱️ Setup rate limiting tracking
     */
    setupRateLimiting() {
        // Clean up old rate limit entries every 5 minutes
        setInterval(() => {
            this.cleanupRateLimitData();
        }, 300000); // 5 minutes
    }

    /**
     * 🧹 Clean up old rate limit data
     */
    cleanupRateLimitData() {
        const now = Date.now();
        
        for (const [key, usage] of this.keyUsage.entries()) {
            // Remove requests older than the rate limit window (1 hour)
            usage.requests = usage.requests.filter(timestamp => 
                now - timestamp < 3600000
            );
            
            usage.imageUploads = usage.imageUploads.filter(timestamp => 
                now - timestamp < 3600000
            );
            
            usage.lastCleanup = now;
        }
    }

    /**
     * 🚦 Check rate limit for API key
     */
    checkRateLimit(apiKey, keyData, isImageUpload = false) {
        const now = Date.now();
        const usage = this.keyUsage.get(apiKey);
        
        if (!usage) {
            // Initialize usage if not exists
            this.keyUsage.set(apiKey, {
                requests: [],
                imageUploads: [],
                lastCleanup: now
            });
            return { allowed: true, remaining: keyData.rateLimit.requests };
        }

        // Clean old entries
        usage.requests = usage.requests.filter(timestamp => 
            now - timestamp < keyData.rateLimit.window
        );
        
        usage.imageUploads = usage.imageUploads.filter(timestamp => 
            now - timestamp < keyData.rateLimit.window
        );

        // Check general rate limit
        if (usage.requests.length >= keyData.rateLimit.requests) {
            return {
                allowed: false,
                error: 'Rate limit exceeded for general requests',
                retryAfter: Math.ceil((keyData.rateLimit.window - (now - usage.requests[0])) / 1000),
                remaining: 0
            };
        }

        // Check image upload rate limit (if applicable)
        if (isImageUpload && keyData.rateLimit.imageUploads) {
            if (usage.imageUploads.length >= keyData.rateLimit.imageUploads) {
                return {
                    allowed: false,
                    error: 'Rate limit exceeded for image uploads',
                    retryAfter: Math.ceil((keyData.rateLimit.window - (now - usage.imageUploads[0])) / 1000),
                    remaining: 0
                };
            }
        }

        // Record the request
        usage.requests.push(now);
        if (isImageUpload) {
            usage.imageUploads.push(now);
        }

        // Update usage stats
        keyData.usage.totalRequests++;
        keyData.usage.lastUsed = new Date().toISOString();
        if (isImageUpload) {
            keyData.usage.totalImageUploads++;
        }

        return {
            allowed: true,
            remaining: keyData.rateLimit.requests - usage.requests.length,
            imageUploadsRemaining: keyData.rateLimit.imageUploads ? 
                keyData.rateLimit.imageUploads - usage.imageUploads.length : null
        };
    }

    /**
     * 📊 Get API key usage statistics
     */
    getKeyUsage(apiKey) {
        const keyData = this.publicKeys.get(apiKey);
        const usage = this.keyUsage.get(apiKey);

        if (!keyData) {
            return null;
        }

        const now = Date.now();
        const recentRequests = usage ? usage.requests.filter(timestamp => 
            now - timestamp < keyData.rateLimit.window
        ).length : 0;

        const recentImageUploads = usage ? usage.imageUploads.filter(timestamp => 
            now - timestamp < keyData.rateLimit.window
        ).length : 0;

        return {
            key: apiKey,
            tier: keyData.tier,
            name: keyData.name,
            usage: {
                totalRequests: keyData.usage.totalRequests,
                totalImageUploads: keyData.usage.totalImageUploads,
                recentRequests: recentRequests,
                recentImageUploads: recentImageUploads,
                lastUsed: keyData.usage.lastUsed
            },
            rateLimit: {
                requests: keyData.rateLimit.requests,
                imageUploads: keyData.rateLimit.imageUploads,
                window: keyData.rateLimit.window,
                remaining: keyData.rateLimit.requests - recentRequests,
                imageUploadsRemaining: keyData.rateLimit.imageUploads - recentImageUploads
            },
            created: keyData.created,
            expires: keyData.expires
        };
    }

    /**
     * 🗂️ List all API keys (admin function)
     */
    listAllKeys() {
        return Array.from(this.publicKeys.values()).map(keyData => ({
            key: keyData.key.substring(0, 20) + '...',  // Truncated for security
            name: keyData.name,
            tier: keyData.tier,
            company: keyData.company,
            enabled: keyData.enabled,
            created: keyData.created,
            expires: keyData.expires,
            usage: keyData.usage
        }));
    }

    /**
     * 🔧 Update API key settings
     */
    updateAPIKey(apiKey, updates) {
        if (!this.publicKeys.has(apiKey)) {
            return { success: false, error: 'API key not found' };
        }

        const keyData = this.publicKeys.get(apiKey);
        
        // Update allowed fields
        const allowedUpdates = ['enabled', 'domains', 'rateLimit', 'description'];
        allowedUpdates.forEach(field => {
            if (updates.hasOwnProperty(field)) {
                keyData[field] = updates[field];
            }
        });

        return { success: true, data: keyData };
    }

    /**
     * 🗑️ Revoke API key
     */
    revokeAPIKey(apiKey) {
        if (!this.publicKeys.has(apiKey)) {
            return { success: false, error: 'API key not found' };
        }

        this.publicKeys.delete(apiKey);
        this.keyUsage.delete(apiKey);

        return { success: true, message: 'API key revoked successfully' };
    }

    /**
     * 📈 Get API usage analytics
     */
    getAnalytics(timeRange = '24h') {
        const now = Date.now();
        const ranges = {
            '1h': 3600000,
            '24h': 86400000,
            '7d': 604800000,
            '30d': 2592000000
        };

        const windowMs = ranges[timeRange] || ranges['24h'];
        
        let totalRequests = 0;
        let totalImageUploads = 0;
        let activeKeys = 0;

        for (const [key, usage] of this.keyUsage.entries()) {
            const recentRequests = usage.requests.filter(timestamp => 
                now - timestamp < windowMs
            );
            
            const recentImageUploads = usage.imageUploads.filter(timestamp => 
                now - timestamp < windowMs
            );

            if (recentRequests.length > 0 || recentImageUploads.length > 0) {
                activeKeys++;
            }

            totalRequests += recentRequests.length;
            totalImageUploads += recentImageUploads.length;
        }

        return {
            timeRange,
            totalRequests,
            totalImageUploads,
            activeKeys,
            totalKeys: this.publicKeys.size,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = FireAPIPublicKeyManager;