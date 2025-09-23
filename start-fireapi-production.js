#!/usr/bin/env node

/**
 * 🚀 FireAPI.dev Production Startup Script
 * Starts the Room Visualizer API for production deployment
 */

const cluster = require('cluster');
const os = require('os');
const path = require('path');
require('dotenv').config();

// Production configuration
const config = require('./fireapi-deployment-config.json');

/**
 * 🏭 Production Server Setup
 */
class FireAPIProductionServer {
    constructor() {
        this.config = config;
        this.workers = [];
        this.setupSignalHandlers();
    }

    /**
     * 🚀 Start production server
     */
    start() {
        if (cluster.isMaster) {
            this.startMaster();
        } else {
            this.startWorker();
        }
    }

    /**
     * 👑 Start master process
     */
    startMaster() {
        const numWorkers = this.config.server.workers === 'auto' 
            ? os.cpus().length 
            : parseInt(this.config.server.workers) || 1;

        console.log('🚀 [FIREAPI-PRODUCTION] Starting FireAPI.dev Room Visualizer');
        console.log('================================================');
        console.log(`Environment: ${this.config.deployment.environment}`);
        console.log(`Domain: ${this.config.deployment.domain}`);
        console.log(`Port: ${this.config.server.port}`);
        console.log(`Workers: ${numWorkers}`);
        console.log(`Version: ${this.config.deployment.version}`);
        console.log('================================================');

        // Fork workers
        for (let i = 0; i < numWorkers; i++) {
            this.forkWorker();
        }

        // Handle worker crashes
        cluster.on('exit', (worker, code, signal) => {
            console.log(`🔄 [FIREAPI-PRODUCTION] Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
            this.forkWorker();
        });

        // Log successful startup
        let readyWorkers = 0;
        cluster.on('message', (worker, message) => {
            if (message.type === 'ready') {
                readyWorkers++;
                if (readyWorkers === numWorkers) {
                    console.log('✅ [FIREAPI-PRODUCTION] All workers ready. FireAPI.dev is live!');
                    console.log(`🌐 API Base URL: https://${this.config.deployment.domain}`);
                    console.log(`📚 Documentation: https://${this.config.deployment.domain}/api/docs`);
                    console.log(`🏠 Room Visualizer: https://${this.config.deployment.domain}/api/visualizer/*`);
                }
            }
        });
    }

    /**
     * 👷 Fork a new worker
     */
    forkWorker() {
        const worker = cluster.fork({
            PORT: this.config.server.port,
            NODE_ENV: 'production',
            FIREAPI_CONFIG: JSON.stringify(this.config)
        });
        
        this.workers.push(worker);
        return worker;
    }

    /**
     * 🏃 Start worker process
     */
    startWorker() {
        try {
            // Load the main application
            const FireAPIApp = require('./app.js');
            const fireApiApp = new FireAPIApp();
            
            // Get the Express app instance
            const app = fireApiApp.getApp();
            
            // Start server
            const server = app.listen(this.config.server.port, this.config.server.host, () => {
                console.log(`🔧 [WORKER-${process.pid}] Started on port ${this.config.server.port}`);
                
                // Notify master that worker is ready
                if (process.send) {
                    process.send({ type: 'ready' });
                }
            });

            // Handle worker shutdown gracefully
            process.on('SIGTERM', () => {
                console.log(`🛑 [WORKER-${process.pid}] Shutting down gracefully...`);
                server.close(() => {
                    process.exit(0);
                });
            });

            return server;
        } catch (error) {
            console.error(`❌ [WORKER-${process.pid}] Failed to start:`, error);
            process.exit(1);
        }
    }

    /**
     * 📡 Setup signal handlers for graceful shutdown
     */
    setupSignalHandlers() {
        // Graceful shutdown
        process.on('SIGTERM', () => this.shutdown('SIGTERM'));
        process.on('SIGINT', () => this.shutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('💥 [FIREAPI-PRODUCTION] Uncaught Exception:', error);
            this.shutdown('UNCAUGHT_EXCEPTION');
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('💥 [FIREAPI-PRODUCTION] Unhandled Rejection at:', promise, 'reason:', reason);
        });
    }

    /**
     * 🛑 Graceful shutdown
     */
    shutdown(signal) {
        console.log(`🛑 [FIREAPI-PRODUCTION] Received ${signal}. Shutting down gracefully...`);
        
        if (cluster.isMaster) {
            // Shutdown all workers
            for (const worker of this.workers) {
                worker.kill('SIGTERM');
            }
            
            // Wait for workers to close, then exit
            setTimeout(() => {
                console.log('🏁 [FIREAPI-PRODUCTION] Master process exiting');
                process.exit(0);
            }, 5000);
        }
    }

    /**
     * 📊 Get server status
     */
    getStatus() {
        return {
            deployment: this.config.deployment,
            workers: Object.keys(cluster.workers).length,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        };
    }
}

// Start the production server
if (require.main === module) {
    const server = new FireAPIProductionServer();
    server.start();
}

module.exports = FireAPIProductionServer;