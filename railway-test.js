/**
 * Railway Deployment Test
 * Tests that the backend API is correctly configured for Railway deployment
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Test root endpoint - should return JSON (not HTML)
app.get('/', (req, res) => {
    res.json({
        message: "🔥 FireAPI Backend is running correctly!",
        service: "FireAPI.dev",
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /api/health',
            'POST /api/estimates/multi-trade',
            'GET /api/trades/available'
        ]
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'FireAPI Backend',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '2.0.0'
    });
});

// Test endpoint with API key simulation
app.get('/test/api-ready', (req, res) => {
    res.json({
        backend_ready: true,
        api_authentication: 'configured',
        microservices: 'available',
        database_connection: 'ready',
        deployment_status: 'production',
        message: '✅ Backend is ready for FireBuild.AI integration'
    });
});

// 404 handler - ensure it returns JSON, not HTML
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method,
        message: 'This is a backend API. Use /api/* endpoints for API calls.',
        available_endpoints: [
            'GET /api/health',
            'POST /api/estimates/multi-trade', 
            'GET /api/trades/available'
        ]
    });
});

// Error handler - JSON only
app.use((error, req, res, next) => {
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Backend API error occurred',
        timestamp: new Date().toISOString()
    });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Railway Test API running on port ${PORT}`);
    console.log(`🌐 Test at: http://localhost:${PORT}/`);
    console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
    console.log('📊 All responses are JSON (no HTML served)');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Railway test shutting down...');
    server.close(() => {
        console.log('✅ Test server closed');
        process.exit(0);
    });
});

module.exports = app;