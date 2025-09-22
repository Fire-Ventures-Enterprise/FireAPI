/**
 * Simple test to verify Railway deployment is working
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Test endpoint
app.get('/', (req, res) => {
    res.json({
        message: "✅ Backend API is working on Railway!",
        timestamp: new Date().toISOString(),
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'FireAPI Backend',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Test API running on port ${PORT}`);
    console.log(`🌐 Available at: http://localhost:${PORT}`);
});