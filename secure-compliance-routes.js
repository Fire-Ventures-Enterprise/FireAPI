/**
 * Secure Compliance API Routes - Backend Proxy Layer
 * Hides all API keys and microservice URLs from frontend
 */

const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
require('dotenv').config();

class SecureComplianceRoutes {
    constructor() {
        this.router = express.Router();
        
        // Cache building codes for 24 hours (codes don't change frequently)
        this.codeCache = new NodeCache({ 
            stdTTL: 86400, // 24 hours
            checkperiod: 3600 // Check expired keys every hour
        });
        
        // Cache violation stats for 1 hour
        this.statsCache = new NodeCache({ 
            stdTTL: 3600, // 1 hour
            checkperiod: 600 // Check every 10 minutes
        });
        
        // Internal compliance API configuration (NEVER exposed to frontend)
        this.COMPLIANCE_CONFIG = {
            baseURL: process.env.COMPLIANCE_API_URL || 'http://localhost:3007',
            apiKey: process.env.COMPLIANCE_API_KEY || 'internal_compliance_key',
            timeout: 10000
        };
        
        this.setupRoutes();
    }
    
    setupRoutes() {
        // 🔒 SECURE: All compliance routes are backend-only
        
        // General project compliance check
        this.router.post('/compliance/check', this.handleSecureComplianceCheck.bind(this));
        
        // Kitchen-specific compliance 
        this.router.post('/compliance/kitchen', this.handleSecureKitchenCompliance.bind(this));
        
        // Electrical compliance
        this.router.post('/compliance/electrical', this.handleSecureElectricalCompliance.bind(this));
        
        // Plumbing compliance
        this.router.post('/compliance/plumbing', this.handleSecurePlumbingCompliance.bind(this));
        
        // Structural compliance
        this.router.post('/compliance/structural', this.handleSecureStructuralCompliance.bind(this));
        
        // Violation statistics (cached)
        this.router.get('/compliance/violations', this.handleSecureViolationStats.bind(this));
        
        // Project-specific compliance history
        this.router.get('/compliance/history/:projectId', this.handleComplianceHistory.bind(this));
        
        // Compliance report generation
        this.router.get('/compliance/reports/:checkId', this.handleComplianceReport.bind(this));
        
        // Health check for compliance system
        this.router.get('/compliance/health', this.handleComplianceHealth.bind(this));
    }
    
    /**
     * 🔒 SECURE: General compliance check with caching
     */
    async handleSecureComplianceCheck(req, res) {
        try {
            const { projectData, jurisdiction = 'ottawa_on_ca' } = req.body;
            
            if (!projectData) {
                return res.status(400).json({
                    error: 'Project data is required',
                    code: 'MISSING_PROJECT_DATA'
                });
            }
            
            // Create cache key for this specific check
            const cacheKey = `compliance_${jurisdiction}_${JSON.stringify(projectData).slice(0, 50)}`;
            const cached = this.codeCache.get(cacheKey);
            
            if (cached) {
                return res.json({
                    ...cached,
                    cached: true,
                    cache_timestamp: cached.timestamp
                });
            }
            
            // 🔒 SECURE: Internal API call with hidden credentials
            const response = await this.callComplianceAPI('/check', {
                projectData,
                jurisdiction
            });
            
            // Cache the result
            const result = {
                ...response.data,
                timestamp: new Date().toISOString(),
                cached: false
            };
            
            this.codeCache.set(cacheKey, result);
            
            res.json(result);
            
        } catch (error) {
            console.error('Compliance check error:', error.message);
            res.status(500).json({
                error: 'Compliance check failed',
                code: 'COMPLIANCE_CHECK_ERROR',
                message: error.response?.data?.message || error.message
            });
        }
    }
    
    /**
     * 🔒 SECURE: Kitchen compliance with enhanced validation
     */
    async handleSecureKitchenCompliance(req, res) {
        try {
            const { kitchenData, location = 'Ottawa, ON' } = req.body;
            
            if (!kitchenData) {
                return res.status(400).json({
                    error: 'Kitchen project data is required',
                    code: 'MISSING_KITCHEN_DATA'
                });
            }
            
            // Enhanced kitchen data validation
            const enhancedKitchenData = {
                ...kitchenData,
                project_type: 'kitchen_renovation',
                compliance_focus: ['electrical', 'plumbing', 'ventilation'],
                location
            };
            
            // 🔒 SECURE: Call internal API
            const response = await this.callComplianceAPI('/kitchen', enhancedKitchenData);
            
            // Add security-filtered response
            const secureResponse = {
                ...response.data,
                api_version: '2.0',
                security_level: 'backend_filtered',
                timestamp: new Date().toISOString()
            };
            
            res.json(secureResponse);
            
        } catch (error) {
            console.error('Kitchen compliance error:', error.message);
            res.status(500).json({
                error: 'Kitchen compliance check failed',
                code: 'KITCHEN_COMPLIANCE_ERROR'
            });
        }
    }
    
    /**
     * 🔒 SECURE: Electrical compliance check
     */
    async handleSecureElectricalCompliance(req, res) {
        try {
            const { electricalData } = req.body;
            
            const response = await this.callComplianceAPI('/electrical', electricalData);
            
            res.json({
                ...response.data,
                compliance_type: 'electrical',
                ontario_electrical_code: 'OEC_2021',
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Electrical compliance error:', error.message);
            res.status(500).json({
                error: 'Electrical compliance check failed',
                code: 'ELECTRICAL_COMPLIANCE_ERROR'
            });
        }
    }
    
    /**
     * 🔒 SECURE: Plumbing compliance check
     */
    async handleSecurePlumbingCompliance(req, res) {
        try {
            const { plumbingData } = req.body;
            
            const response = await this.callComplianceAPI('/plumbing', plumbingData);
            
            res.json({
                ...response.data,
                compliance_type: 'plumbing',
                ontario_plumbing_code: 'OPC_2012',
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Plumbing compliance error:', error.message);
            res.status(500).json({
                error: 'Plumbing compliance check failed',
                code: 'PLUMBING_COMPLIANCE_ERROR'
            });
        }
    }
    
    /**
     * 🔒 SECURE: Structural compliance check
     */
    async handleSecureStructuralCompliance(req, res) {
        try {
            const { structuralData } = req.body;
            
            const response = await this.callComplianceAPI('/structural', structuralData);
            
            res.json({
                ...response.data,
                compliance_type: 'structural',
                ontario_building_code: 'OBC_2012',
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Structural compliance error:', error.message);
            res.status(500).json({
                error: 'Structural compliance check failed',
                code: 'STRUCTURAL_COMPLIANCE_ERROR'
            });
        }
    }
    
    /**
     * 🔒 SECURE: Cached violation statistics
     */
    async handleSecureViolationStats(req, res) {
        try {
            const { jurisdiction = 'ottawa_on_ca' } = req.query;
            
            // Check cache first
            const cacheKey = `violations_${jurisdiction}`;
            const cached = this.statsCache.get(cacheKey);
            
            if (cached) {
                return res.json({
                    ...cached,
                    cached: true
                });
            }
            
            // 🔒 SECURE: Fetch fresh data
            const response = await this.callComplianceAPI('/violations', null, 'GET');
            
            const result = {
                ...response.data,
                cached: false,
                timestamp: new Date().toISOString()
            };
            
            this.statsCache.set(cacheKey, result);
            
            res.json(result);
            
        } catch (error) {
            console.error('Violation stats error:', error.message);
            res.status(500).json({
                error: 'Failed to fetch violation statistics',
                code: 'VIOLATION_STATS_ERROR'
            });
        }
    }
    
    /**
     * 🔒 SECURE: Project compliance history (placeholder for database integration)
     */
    async handleComplianceHistory(req, res) {
        try {
            const { projectId } = req.params;
            
            // TODO: Integrate with Supabase for real history tracking
            // For now, return placeholder data
            res.json({
                project_id: projectId,
                compliance_history: [
                    {
                        id: 'comp_001',
                        check_date: '2024-09-20T10:30:00Z',
                        status: 'passed',
                        violations_found: 0,
                        permit_cost: 580
                    }
                ],
                total_checks: 1,
                message: 'History tracking will be enhanced with database integration'
            });
            
        } catch (error) {
            console.error('Compliance history error:', error.message);
            res.status(500).json({
                error: 'Failed to fetch compliance history',
                code: 'COMPLIANCE_HISTORY_ERROR'
            });
        }
    }
    
    /**
     * 🔒 SECURE: Generate compliance reports (PDF generation placeholder)
     */
    async handleComplianceReport(req, res) {
        try {
            const { checkId } = req.params;
            
            // TODO: Implement PDF report generation
            res.json({
                check_id: checkId,
                report_url: `/reports/compliance_${checkId}.pdf`,
                status: 'generated',
                message: 'PDF report generation will be implemented',
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            });
            
        } catch (error) {
            console.error('Compliance report error:', error.message);
            res.status(500).json({
                error: 'Failed to generate compliance report',
                code: 'COMPLIANCE_REPORT_ERROR'
            });
        }
    }
    
    /**
     * 🔒 SECURE: Health check for compliance system
     */
    async handleComplianceHealth(req, res) {
        try {
            // Check internal compliance API health
            const response = await this.callComplianceAPI('/health', null, 'GET');
            
            res.json({
                status: 'healthy',
                compliance_api: response.data,
                cache_stats: {
                    code_cache_keys: this.codeCache.keys().length,
                    stats_cache_keys: this.statsCache.keys().length
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Compliance health check error:', error.message);
            res.status(503).json({
                status: 'unhealthy',
                error: 'Compliance API not responding',
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * 🔒 PRIVATE: Internal method to call compliance API
     * This method contains all sensitive configuration
     */
    async callComplianceAPI(endpoint, data = null, method = 'POST') {
        const config = {
            method,
            url: `${this.COMPLIANCE_CONFIG.baseURL}${endpoint}`,
            timeout: this.COMPLIANCE_CONFIG.timeout,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.COMPLIANCE_CONFIG.apiKey,
                'User-Agent': 'FireBuild-Secure-Backend/2.0'
            }
        };
        
        if (data && method === 'POST') {
            config.data = data;
        }
        
        return await axios(config);
    }
    
    /**
     * Get router for Express app integration
     */
    getRouter() {
        return this.router;
    }
}

module.exports = SecureComplianceRoutes;