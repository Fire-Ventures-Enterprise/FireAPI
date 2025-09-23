#!/usr/bin/env node

/**
 * Revolutionary Construction File Management API Server
 * 
 * Features:
 * - Phase-aware file organization
 * - Trade-specific collections
 * - Timeline integration with task orchestrator
 * - Compliance documentation automation
 * - Progress photo management
 * - Metadata extraction and intelligent categorization
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

const FileManager = require('./src/file-manager');
const MetadataExtractor = require('./src/metadata-extractor');
const ComplianceTracker = require('./src/compliance-tracker');
const ProgressAnalyzer = require('./src/progress-analyzer');
const GeoLocationManager = require('./src/geo-location-manager');

class FileManagementAPI {
    constructor() {
        this.app = express();
        this.port = process.env.FILE_API_PORT || 3009;
        this.fileManager = new FileManager();
        this.metadataExtractor = new MetadataExtractor();
        this.complianceTracker = new ComplianceTracker();
        this.progressAnalyzer = new ProgressAnalyzer();
        this.geoLocationManager = new GeoLocationManager();
        
        this.setupMiddleware();
        this.setupStorage();
        this.setupRoutes();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            crossOriginResourcePolicy: { policy: "cross-origin" }
        }));
        
        // CORS configuration
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
            credentials: true
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // Higher limit for file operations
            message: { error: 'Too many requests, please try again later' }
        });
        this.app.use(limiter);

        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            const timestamp = new Date().toISOString();
            console.log(`${timestamp} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupStorage() {
        // Configure multer for file uploads with intelligent organization
        this.upload = multer({
            storage: multer.diskStorage({
                destination: (req, file, cb) => {
                    const { projectId, phase, trade } = req.body;
                    const uploadPath = this.fileManager.getUploadPath(projectId, phase, trade);
                    fs.ensureDirSync(uploadPath);
                    cb(null, uploadPath);
                },
                filename: (req, file, cb) => {
                    const uniqueName = this.fileManager.generateFileName(file, req.body);
                    cb(null, uniqueName);
                }
            }),
            limits: {
                fileSize: 100 * 1024 * 1024, // 100MB limit
                files: 20 // Max 20 files per upload
            },
            fileFilter: (req, file, cb) => {
                const allowedTypes = this.fileManager.getAllowedFileTypes();
                if (allowedTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error(`File type ${file.mimetype} not supported`), false);
                }
            }
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                service: 'file-management-api',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });

        // File upload routes
        this.app.post('/upload/single', this.upload.single('file'), this.handleSingleUpload.bind(this));
        this.app.post('/upload/multiple', this.upload.array('files', 20), this.handleMultipleUpload.bind(this));
        this.app.post('/upload/progress-photos', this.upload.array('photos', 10), this.handleProgressPhotos.bind(this));

        // File management routes
        this.app.get('/project/:projectId/files', this.handleGetProjectFiles.bind(this));
        this.app.get('/project/:projectId/phase/:phase/files', this.handleGetPhaseFiles.bind(this));
        this.app.get('/project/:projectId/trade/:trade/files', this.handleGetTradeFiles.bind(this));
        this.app.get('/file/:fileId/download', this.handleFileDownload.bind(this));
        this.app.get('/file/:fileId/preview', this.handleFilePreview.bind(this));
        this.app.delete('/file/:fileId', this.handleFileDelete.bind(this));

        // Metadata and analysis routes
        this.app.get('/file/:fileId/metadata', this.handleGetMetadata.bind(this));
        this.app.post('/file/:fileId/analyze', this.handleFileAnalysis.bind(this));
        this.app.get('/project/:projectId/progress-analysis', this.handleProgressAnalysis.bind(this));

        // Compliance and documentation routes
        this.app.get('/project/:projectId/compliance-docs', this.handleGetComplianceDocs.bind(this));
        this.app.post('/project/:projectId/generate-report', this.handleGenerateReport.bind(this));

        // Search and filtering routes
        this.app.post('/search', this.handleFileSearch.bind(this));
        this.app.get('/categories', this.handleGetCategories.bind(this));

        // Integration with task orchestrator
        this.app.post('/link-to-task', this.handleLinkToTask.bind(this));
        this.app.get('/task/:taskId/files', this.handleGetTaskFiles.bind(this));

        // GPS-based project detection and management
        this.app.post('/gps/detect-project', this.handleGPSProjectDetection.bind(this));
        this.app.post('/gps/add-project-location', this.handleAddProjectLocation.bind(this));
        this.app.get('/gps/project-locations', this.handleGetProjectLocations.bind(this));
        this.app.put('/gps/project/:projectId/boundaries', this.handleUpdateProjectBoundaries.bind(this));
        this.app.get('/gps/project/:projectId/analytics', this.handleGetLocationAnalytics.bind(this));

        // Additional handler methods
        this.app.get('/file/:fileId/metadata', this.handleGetMetadata.bind(this));
        this.app.post('/file/:fileId/analyze', this.handleFileAnalysis.bind(this));
        this.app.get('/project/:projectId/progress-analysis', this.handleProgressAnalysis.bind(this));
        this.app.get('/project/:projectId/compliance-docs', this.handleGetComplianceDocs.bind(this));
        this.app.post('/project/:projectId/generate-report', this.handleGenerateReport.bind(this));
        this.app.post('/search', this.handleFileSearch.bind(this));
        this.app.get('/categories', this.handleGetCategories.bind(this));
        this.app.post('/link-to-task', this.handleLinkToTask.bind(this));
        this.app.get('/task/:taskId/files', this.handleGetTaskFiles.bind(this));

        // Error handling
        this.app.use((error, req, res, next) => {
            console.error('File API Error:', error);
            
            if (error instanceof multer.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: 'File too large. Maximum size is 100MB.' });
                }
                if (error.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({ error: 'Too many files. Maximum is 20 files per upload.' });
                }
            }

            res.status(500).json({ 
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        });

        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({ error: 'Endpoint not found' });
        });
    }

    // Upload handlers
    async handleSingleUpload(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const fileData = await this.processUploadedFile(req.file, req.body);
            
            res.json({
                success: true,
                file: fileData,
                message: 'File uploaded successfully'
            });
        } catch (error) {
            console.error('Single upload error:', error);
            res.status(500).json({ error: 'Failed to process upload' });
        }
    }

    async handleMultipleUpload(req, res) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: 'No files uploaded' });
            }

            const processedFiles = [];
            for (const file of req.files) {
                const fileData = await this.processUploadedFile(file, req.body);
                processedFiles.push(fileData);
            }

            res.json({
                success: true,
                files: processedFiles,
                count: processedFiles.length,
                message: `${processedFiles.length} files uploaded successfully`
            });
        } catch (error) {
            console.error('Multiple upload error:', error);
            res.status(500).json({ error: 'Failed to process uploads' });
        }
    }

    async handleProgressPhotos(req, res) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: 'No photos uploaded' });
            }

            const { projectId, taskId, phase, beforeAfter } = req.body;
            const processedPhotos = [];

            for (const photo of req.files) {
                // Process progress photos with special handling
                const photoData = await this.processProgressPhoto(photo, {
                    projectId,
                    taskId,
                    phase,
                    beforeAfter,
                    timestamp: new Date().toISOString()
                });
                processedPhotos.push(photoData);
            }

            // Trigger progress analysis
            if (beforeAfter === 'after') {
                await this.progressAnalyzer.analyzeTaskProgress(taskId, processedPhotos);
            }

            // Check for GPS auto-detection results
            const gpsDetections = processedPhotos.filter(photo => 
                photo.metadata && photo.metadata.gpsProjectDetection && photo.metadata.gpsProjectDetection.detected
            );

            let autoOrganizationSummary = null;
            if (gpsDetections.length > 0) {
                autoOrganizationSummary = {
                    detected: gpsDetections.length,
                    total: processedPhotos.length,
                    projects: [...new Set(gpsDetections.map(p => p.metadata.gpsProjectDetection.project.name))],
                    message: `${gpsDetections.length} photos automatically organized by GPS location`
                };
            }

            res.json({
                success: true,
                photos: processedPhotos,
                count: processedPhotos.length,
                autoOrganization: autoOrganizationSummary,
                message: autoOrganizationSummary 
                    ? `Progress photos uploaded and ${gpsDetections.length} automatically organized by GPS`
                    : 'Progress photos uploaded successfully'
            });
        } catch (error) {
            console.error('Progress photos upload error:', error);
            res.status(500).json({ error: 'Failed to process progress photos' });
        }
    }

    // File retrieval handlers
    async handleGetProjectFiles(req, res) {
        try {
            const { projectId } = req.params;
            const { category, phase, trade, limit = 50, offset = 0 } = req.query;

            const files = await this.fileManager.getProjectFiles(projectId, {
                category,
                phase,
                trade,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                success: true,
                projectId,
                files,
                total: files.length,
                filters: { category, phase, trade }
            });
        } catch (error) {
            console.error('Get project files error:', error);
            res.status(500).json({ error: 'Failed to retrieve project files' });
        }
    }

    async handleGetPhaseFiles(req, res) {
        try {
            const { projectId, phase } = req.params;
            const files = await this.fileManager.getPhaseFiles(projectId, phase);

            res.json({
                success: true,
                projectId,
                phase,
                files,
                count: files.length
            });
        } catch (error) {
            console.error('Get phase files error:', error);
            res.status(500).json({ error: 'Failed to retrieve phase files' });
        }
    }

    async handleGetTradeFiles(req, res) {
        try {
            const { projectId, trade } = req.params;
            const files = await this.fileManager.getTradeFiles(projectId, trade);

            res.json({
                success: true,
                projectId,
                trade,
                files,
                count: files.length
            });
        } catch (error) {
            console.error('Get trade files error:', error);
            res.status(500).json({ error: 'Failed to retrieve trade files' });
        }
    }

    async handleFileDownload(req, res) {
        try {
            const { fileId } = req.params;
            const file = await this.fileManager.getFileById(fileId);

            if (!file) {
                return res.status(404).json({ error: 'File not found' });
            }

            res.download(file.filePath, file.originalName);
        } catch (error) {
            console.error('File download error:', error);
            res.status(500).json({ error: 'Failed to download file' });
        }
    }

    async handleFilePreview(req, res) {
        try {
            const { fileId } = req.params;
            const file = await this.fileManager.getFileById(fileId);

            if (!file) {
                return res.status(404).json({ error: 'File not found' });
            }

            // Set appropriate headers for preview
            res.setHeader('Content-Type', file.mimeType);
            res.sendFile(file.filePath);
        } catch (error) {
            console.error('File preview error:', error);
            res.status(500).json({ error: 'Failed to preview file' });
        }
    }

    async handleFileDelete(req, res) {
        try {
            const { fileId } = req.params;
            await this.fileManager.deleteFile(fileId);

            res.json({
                success: true,
                message: 'File deleted successfully'
            });
        } catch (error) {
            console.error('File delete error:', error);
            res.status(500).json({ error: 'Failed to delete file' });
        }
    }

    async handleGetMetadata(req, res) {
        try {
            const { fileId } = req.params;
            const file = await this.fileManager.getFileById(fileId);

            if (!file) {
                return res.status(404).json({ error: 'File not found' });
            }

            res.json({
                success: true,
                fileId,
                metadata: file.metadata
            });
        } catch (error) {
            console.error('Get metadata error:', error);
            res.status(500).json({ error: 'Failed to get file metadata' });
        }
    }

    async handleFileAnalysis(req, res) {
        try {
            const { fileId } = req.params;
            const file = await this.fileManager.getFileById(fileId);

            if (!file) {
                return res.status(404).json({ error: 'File not found' });
            }

            // Re-analyze file with updated metadata
            const analysis = await this.complianceTracker.analyzeFile(file);

            res.json({
                success: true,
                fileId,
                analysis
            });
        } catch (error) {
            console.error('File analysis error:', error);
            res.status(500).json({ error: 'Failed to analyze file' });
        }
    }

    async handleProgressAnalysis(req, res) {
        try {
            const { projectId } = req.params;
            const { timeframe = '7days' } = req.query;

            const report = await this.progressAnalyzer.generateProgressReport(projectId, timeframe);

            res.json({
                success: true,
                projectId,
                report
            });
        } catch (error) {
            console.error('Progress analysis error:', error);
            res.status(500).json({ error: 'Failed to generate progress analysis' });
        }
    }

    async handleGetComplianceDocs(req, res) {
        try {
            const { projectId } = req.params;
            const { projectType = 'residential-construction' } = req.query;

            const status = await this.complianceTracker.getComplianceStatus(projectId, projectType);

            res.json({
                success: true,
                projectId,
                compliance: status
            });
        } catch (error) {
            console.error('Get compliance docs error:', error);
            res.status(500).json({ error: 'Failed to get compliance documents' });
        }
    }

    async handleGenerateReport(req, res) {
        try {
            const { projectId } = req.params;
            const { reportType = 'progress', timeframe = '30days' } = req.body;

            const report = await this.progressAnalyzer.generateProgressReport(projectId, timeframe);

            res.json({
                success: true,
                projectId,
                reportType,
                report,
                generatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Generate report error:', error);
            res.status(500).json({ error: 'Failed to generate report' });
        }
    }

    async handleFileSearch(req, res) {
        try {
            const { query, filters = {} } = req.body;
            const results = await this.fileManager.searchFiles(query, filters);

            res.json({
                success: true,
                query,
                filters,
                results,
                count: results.length
            });
        } catch (error) {
            console.error('File search error:', error);
            res.status(500).json({ error: 'Failed to search files' });
        }
    }

    async handleGetCategories(req, res) {
        try {
            const categories = this.fileManager.getCategories();

            res.json({
                success: true,
                categories
            });
        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({ error: 'Failed to get categories' });
        }
    }

    async handleLinkToTask(req, res) {
        try {
            const { fileId, taskId } = req.body;

            if (!fileId || !taskId) {
                return res.status(400).json({ error: 'fileId and taskId are required' });
            }

            const file = await this.fileManager.linkFileToTask(fileId, taskId);

            res.json({
                success: true,
                file,
                message: 'File linked to task successfully'
            });
        } catch (error) {
            console.error('Link to task error:', error);
            res.status(500).json({ error: 'Failed to link file to task' });
        }
    }

    async handleGetTaskFiles(req, res) {
        try {
            const { taskId } = req.params;
            const files = await this.fileManager.getTaskFiles(taskId);

            res.json({
                success: true,
                taskId,
                files,
                count: files.length
            });
        } catch (error) {
            console.error('Get task files error:', error);
            res.status(500).json({ error: 'Failed to get task files' });
        }
    }

    // GPS-based project detection handlers
    async handleGPSProjectDetection(req, res) {
        try {
            const { coordinates } = req.body;

            if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
                return res.status(400).json({ 
                    error: 'GPS coordinates are required',
                    required: { latitude: 'number', longitude: 'number' }
                });
            }

            const detection = await this.geoLocationManager.detectProjectFromGPS(coordinates);
            
            res.json({
                success: true,
                detection,
                coordinates,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('GPS project detection error:', error);
            res.status(500).json({ error: 'Failed to detect project from GPS coordinates' });
        }
    }

    async handleAddProjectLocation(req, res) {
        try {
            const projectData = req.body;
            
            const requiredFields = ['projectId', 'name', 'address', 'coordinates'];
            const missingFields = requiredFields.filter(field => !projectData[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({ 
                    error: 'Missing required fields',
                    required: requiredFields,
                    missing: missingFields
                });
            }

            const project = this.geoLocationManager.addProjectLocation(projectData);
            
            res.json({
                success: true,
                project,
                message: 'Project location added successfully'
            });
        } catch (error) {
            console.error('Add project location error:', error);
            res.status(500).json({ error: 'Failed to add project location' });
        }
    }

    async handleGetProjectLocations(req, res) {
        try {
            const locations = this.geoLocationManager.getAllProjectLocations();
            
            res.json({
                success: true,
                locations,
                count: locations.length
            });
        } catch (error) {
            console.error('Get project locations error:', error);
            res.status(500).json({ error: 'Failed to get project locations' });
        }
    }

    async handleUpdateProjectBoundaries(req, res) {
        try {
            const { projectId } = req.params;
            const { radius } = req.body;

            if (!radius || radius < 10 || radius > 1000) {
                return res.status(400).json({ 
                    error: 'Invalid radius. Must be between 10 and 1000 meters'
                });
            }

            const project = this.geoLocationManager.updateProjectBoundaries(projectId, radius);
            
            res.json({
                success: true,
                project,
                message: 'Project boundaries updated successfully'
            });
        } catch (error) {
            console.error('Update project boundaries error:', error);
            res.status(500).json({ error: 'Failed to update project boundaries' });
        }
    }

    async handleGetLocationAnalytics(req, res) {
        try {
            const { projectId } = req.params;
            const analytics = await this.geoLocationManager.getLocationAnalytics(projectId);
            
            res.json({
                success: true,
                analytics
            });
        } catch (error) {
            console.error('Get location analytics error:', error);
            res.status(500).json({ error: 'Failed to get location analytics' });
        }
    }

    // Helper methods
    async processUploadedFile(file, metadata) {
        try {
            // Extract metadata from file
            const extractedMetadata = await this.metadataExtractor.extractMetadata(file.path);
            
            // Generate file record
            const fileRecord = await this.fileManager.createFileRecord(file, {
                ...metadata,
                ...extractedMetadata,
                uploadTimestamp: new Date().toISOString()
            });

            // Check for compliance relevance
            const complianceInfo = await this.complianceTracker.analyzeFile(fileRecord);
            if (complianceInfo.isRelevant) {
                fileRecord.compliance = complianceInfo;
            }

            return fileRecord;
        } catch (error) {
            console.error('File processing error:', error);
            throw error;
        }
    }

    async processProgressPhoto(photo, metadata) {
        try {
            // Extract EXIF data and location info
            const extractedMetadata = await this.metadataExtractor.extractImageMetadata(photo.path);
            
            // Create progress photo record
            const photoRecord = await this.fileManager.createProgressPhotoRecord(photo, {
                ...metadata,
                ...extractedMetadata
            });

            return photoRecord;
        } catch (error) {
            console.error('Progress photo processing error:', error);
            throw error;
        }
    }

    start() {
        this.app.listen(this.port, '0.0.0.0', () => {
            console.log(`🗂️  File Management API running on port ${this.port}`);
            console.log(`📁 Storage directory: ${path.join(__dirname, 'storage')}`);
            console.log(`🔒 Security: Helmet enabled, CORS configured`);
            console.log(`⚡ Rate limiting: 1000 requests per 15 minutes`);
        });
    }
}

// Start server if called directly
if (require.main === module) {
    const api = new FileManagementAPI();
    api.start();
}

module.exports = FileManagementAPI;