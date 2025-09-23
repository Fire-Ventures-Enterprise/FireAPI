/**
 * 🔒 Secure Flooring Import API Routes
 * JWT authenticated endpoints for bulk importing flooring products
 * Integrates with existing FireAPI.dev infrastructure
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const FlooringBulkImportAPI = require('./flooring-bulk-import-api');
const path = require('path');
const fs = require('fs').promises;

class FlooringImportRoutes {
    constructor(supabaseUrl = null, supabaseKey = null) {
        this.router = express.Router();
        
        // Initialize Supabase client if credentials provided
        this.supabase = null;
        if (supabaseUrl && supabaseKey) {
            this.supabase = createClient(supabaseUrl, supabaseKey);
        }
        
        // Initialize bulk import API
        this.importAPI = new FlooringBulkImportAPI(this.supabase);
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    /**
     * 🛡️ Setup security middleware
     */
    setupMiddleware() {
        // Rate limiting for import endpoints
        this.importRateLimit = rateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 10, // 10 imports per hour per IP
            message: {
                success: false,
                error: {
                    code: 'IMPORT_RATE_LIMIT_EXCEEDED',
                    message: 'Maximum 10 imports per hour allowed. Please try again later.',
                    retryAfter: 3600
                }
            },
            standardHeaders: true,
            legacyHeaders: false,
            keyGenerator: (req) => {
                // Use user ID for rate limiting instead of IP for authenticated users
                return req.user?.id || req.ip;
            }
        });

        // General rate limiting for other endpoints
        this.generalRateLimit = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // 100 requests per 15 minutes
            message: {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests. Please try again later.'
                }
            }
        });
    }

    /**
     * 🔑 JWT Authentication middleware
     */
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'MISSING_TOKEN',
                    message: 'Access token is required. Please provide a valid JWT token in Authorization header.',
                    format: 'Authorization: Bearer <token>'
                }
            });
        }

        // Verify JWT token
        jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
            if (err) {
                let errorCode = 'INVALID_TOKEN';
                let errorMessage = 'Invalid or expired token. Please authenticate again.';

                if (err.name === 'TokenExpiredError') {
                    errorCode = 'TOKEN_EXPIRED';
                    errorMessage = 'Token has expired. Please authenticate again.';
                } else if (err.name === 'JsonWebTokenError') {
                    errorCode = 'MALFORMED_TOKEN';
                    errorMessage = 'Malformed token. Please check your authentication.';
                }

                return res.status(403).json({
                    success: false,
                    error: {
                        code: errorCode,
                        message: errorMessage
                    }
                });
            }

            req.user = user;
            next();
        });
    }

    /**
     * 👤 Authorize admin users only
     */
    authorizeAdmin(req, res, next) {
        if (!req.user || !req.user.role || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'Admin privileges required for this operation.',
                    userRole: req.user?.role || 'none'
                }
            });
        }
        next();
    }

    /**
     * 📝 Input sanitization middleware
     */
    sanitizeInput(req, res, next) {
        // Sanitize request body
        if (req.body && typeof req.body === 'object') {
            this.recursiveSanitize(req.body);
        }

        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
            this.recursiveSanitize(req.query);
        }

        next();
    }

    /**
     * 🧹 Recursive sanitization helper
     */
    recursiveSanitize(obj) {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                // Basic XSS prevention
                obj[key] = obj[key]
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '');
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                this.recursiveSanitize(obj[key]);
            }
        }
    }

    /**
     * 🛣️ Setup API routes
     */
    setupRoutes() {
        // Apply general middleware to all routes
        this.router.use(this.sanitizeInput.bind(this));

        // Health check endpoint (no auth required)
        this.router.get('/health', this.generalRateLimit, (req, res) => {
            res.json({
                success: true,
                service: 'Flooring Import API',
                version: '1.0.0',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                features: [
                    'CSV bulk import',
                    'Data validation',
                    'Progress tracking',
                    'Batch processing',
                    'JWT authentication'
                ]
            });
        });

        // Get API documentation
        this.router.get('/docs', this.generalRateLimit, (req, res) => {
            res.json({
                success: true,
                documentation: {
                    title: 'Flooring Products Bulk Import API',
                    version: '1.0.0',
                    baseUrl: '/api/flooring/import',
                    authentication: 'JWT Bearer token required',
                    rateLimit: '10 imports per hour, 100 requests per 15 minutes',
                    endpoints: {
                        'POST /upload': 'Upload CSV file for bulk import',
                        'GET /status/:sessionId': 'Get import session status',
                        'GET /history': 'Get user import history',
                        'GET /template': 'Download CSV template',
                        'GET /stats': 'Get import statistics (admin only)'
                    },
                    csvFormat: {
                        requiredColumns: ['product_name', 'sku', 'price'],
                        optionalColumns: [
                            'category', 'stock_quantity', 'description', 'manufacturer',
                            'dimensions', 'material', 'color', 'installation_type',
                            'warranty_years', 'square_feet_per_box', 'weight_per_box',
                            'thickness', 'finish'
                        ],
                        maxFileSize: '10MB',
                        maxRows: 10000
                    }
                }
            });
        });

        // Download CSV template
        this.router.get('/template', this.generalRateLimit, (req, res) => {
            const csvHeaders = [
                'product_name',
                'sku', 
                'category',
                'price',
                'stock_quantity',
                'description',
                'manufacturer',
                'dimensions',
                'material',
                'color',
                'installation_type',
                'warranty_years',
                'square_feet_per_box',
                'weight_per_box',
                'thickness',
                'finish'
            ];

            const sampleData = [
                [
                    'Premium Oak Hardwood',
                    'OAK-001',
                    'hardwood',
                    '8.99',
                    '150',
                    'Beautiful solid oak hardwood flooring with natural grain patterns',
                    'FloorCraft',
                    '3.25" x 0.75"',
                    'oak',
                    'natural',
                    'nail-down',
                    '25',
                    '20',
                    '45.5',
                    '0.75"',
                    'satin'
                ]
            ];

            const csvContent = [csvHeaders, ...sampleData]
                .map(row => row.map(cell => `"${cell}"`).join(','))
                .join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="flooring-import-template.csv"');
            res.send(csvContent);
        });

        // Main upload endpoint (requires auth and rate limiting)
        this.router.post('/upload', 
            this.authenticateToken.bind(this),
            this.authorizeAdmin.bind(this),
            this.importRateLimit,
            this.importAPI.upload.single('csvFile'),
            this.handleUpload.bind(this)
        );

        // Get import session status
        this.router.get('/status/:sessionId',
            this.authenticateToken.bind(this),
            this.generalRateLimit,
            this.getImportStatus.bind(this)
        );

        // Get user import history
        this.router.get('/history',
            this.authenticateToken.bind(this),
            this.generalRateLimit,
            this.getImportHistory.bind(this)
        );

        // Get import statistics (admin only)
        this.router.get('/stats',
            this.authenticateToken.bind(this),
            this.authorizeAdmin.bind(this),
            this.generalRateLimit,
            this.getImportStats.bind(this)
        );

        // Delete import session
        this.router.delete('/session/:sessionId',
            this.authenticateToken.bind(this),
            this.generalRateLimit,
            this.deleteImportSession.bind(this)
        );

        // Get product validation rules
        this.router.get('/validation-rules',
            this.authenticateToken.bind(this),
            this.generalRateLimit,
            (req, res) => {
                res.json({
                    success: true,
                    validationRules: this.importAPI.validationRules
                });
            }
        );
    }

    /**
     * 📤 Handle CSV upload and processing
     */
    async handleUpload(req, res) {
        try {
            // Check if file was uploaded
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'NO_FILE_UPLOADED',
                        message: 'Please provide a CSV file in the request.',
                        expectedField: 'csvFile'
                    }
                });
            }

            const file = req.file;
            const userId = req.user.id;

            // Validate file type
            if (!file.mimetype.includes('csv') && !file.originalname.toLowerCase().endsWith('.csv')) {
                // Clean up uploaded file
                await fs.unlink(file.path).catch(() => {});
                
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_FILE_TYPE',
                        message: 'Only CSV files are allowed.',
                        receivedType: file.mimetype,
                        allowedTypes: ['text/csv', 'application/vnd.ms-excel']
                    }
                });
            }

            // Start import process
            const result = await this.importAPI.importProducts(
                file.path,
                file.originalname,
                userId
            );

            // Clean up uploaded file
            await fs.unlink(file.path).catch(() => {});

            // Return success response
            res.json({
                success: true,
                data: result
            });

        } catch (error) {
            // Clean up file on error
            if (req.file) {
                await fs.unlink(req.file.path).catch(() => {});
            }

            console.error('Upload error:', error);

            // Handle specific error types
            if (error.message.includes('Rate limit')) {
                return res.status(429).json({
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: error.message
                    }
                });
            }

            res.status(500).json({
                success: false,
                error: {
                    code: 'IMPORT_FAILED',
                    message: error.message || 'Import process failed. Please try again.'
                }
            });
        }
    }

    /**
     * 📊 Get import session status
     */
    async getImportStatus(req, res) {
        try {
            const { sessionId } = req.params;
            const userId = req.user.id;

            const session = this.importAPI.getSessionStatus(sessionId);

            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'SESSION_NOT_FOUND',
                        message: 'Import session not found.',
                        sessionId
                    }
                });
            }

            // Check if user owns this session (unless admin)
            if (session.userId !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'ACCESS_DENIED',
                        message: 'You can only access your own import sessions.'
                    }
                });
            }

            res.json({
                success: true,
                data: session
            });

        } catch (error) {
            console.error('Status check error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'STATUS_CHECK_FAILED',
                    message: 'Failed to retrieve session status.'
                }
            });
        }
    }

    /**
     * 📜 Get user import history
     */
    async getImportHistory(req, res) {
        try {
            const userId = req.user.id;
            const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 records

            const history = this.importAPI.getUserImportHistory(userId, limit);

            res.json({
                success: true,
                data: {
                    imports: history,
                    totalCount: history.length,
                    limit
                }
            });

        } catch (error) {
            console.error('History retrieval error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'HISTORY_RETRIEVAL_FAILED',
                    message: 'Failed to retrieve import history.'
                }
            });
        }
    }

    /**
     * 📈 Get import statistics (admin only)
     */
    async getImportStats(req, res) {
        try {
            const sessions = Array.from(this.importAPI.importSessions.values());
            
            const stats = {
                totalImports: sessions.length,
                completedImports: sessions.filter(s => s.status === 'completed').length,
                failedImports: sessions.filter(s => s.status === 'failed').length,
                inProgressImports: sessions.filter(s => 
                    !['completed', 'failed'].includes(s.status)
                ).length,
                totalProductsImported: sessions.reduce((sum, s) => 
                    sum + (s.results?.summary?.inserted || 0), 0
                ),
                averageProcessingTime: this.calculateAverageProcessingTime(sessions),
                topUsers: this.getTopImportUsers(sessions),
                recentActivity: sessions
                    .filter(s => s.created_at)
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 10)
                    .map(s => ({
                        sessionId: s.sessionId,
                        userId: s.userId,
                        filename: s.filename,
                        status: s.status,
                        created_at: s.created_at
                    }))
            };

            res.json({
                success: true,
                data: stats,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Stats retrieval error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'STATS_RETRIEVAL_FAILED',
                    message: 'Failed to retrieve import statistics.'
                }
            });
        }
    }

    /**
     * 🗑️ Delete import session
     */
    async deleteImportSession(req, res) {
        try {
            const { sessionId } = req.params;
            const userId = req.user.id;

            const session = this.importAPI.getSessionStatus(sessionId);

            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'SESSION_NOT_FOUND',
                        message: 'Import session not found.'
                    }
                });
            }

            // Check if user owns this session (unless admin)
            if (session.userId !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'ACCESS_DENIED',
                        message: 'You can only delete your own import sessions.'
                    }
                });
            }

            // Delete session
            this.importAPI.importSessions.delete(sessionId);

            res.json({
                success: true,
                message: 'Import session deleted successfully.',
                sessionId
            });

        } catch (error) {
            console.error('Session deletion error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'DELETION_FAILED',
                    message: 'Failed to delete import session.'
                }
            });
        }
    }

    /**
     * ⏱️ Calculate average processing time
     */
    calculateAverageProcessingTime(sessions) {
        const completedSessions = sessions.filter(s => 
            s.status === 'completed' && s.created_at && s.updated_at
        );

        if (completedSessions.length === 0) return 0;

        const totalTime = completedSessions.reduce((sum, session) => {
            const start = new Date(session.created_at);
            const end = new Date(session.updated_at);
            return sum + (end - start);
        }, 0);

        return Math.round(totalTime / completedSessions.length / 1000); // Average seconds
    }

    /**
     * 👥 Get top importing users
     */
    getTopImportUsers(sessions) {
        const userStats = {};

        sessions.forEach(session => {
            if (!userStats[session.userId]) {
                userStats[session.userId] = {
                    userId: session.userId,
                    totalImports: 0,
                    successfulImports: 0,
                    totalProductsImported: 0
                };
            }

            userStats[session.userId].totalImports++;
            
            if (session.status === 'completed') {
                userStats[session.userId].successfulImports++;
                userStats[session.userId].totalProductsImported += 
                    session.results?.summary?.inserted || 0;
            }
        });

        return Object.values(userStats)
            .sort((a, b) => b.totalProductsImported - a.totalProductsImported)
            .slice(0, 5);
    }

    /**
     * 🎯 Get router instance
     */
    getRouter() {
        return this.router;
    }
}

module.exports = FlooringImportRoutes;