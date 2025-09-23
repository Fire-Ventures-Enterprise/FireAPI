const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');

/**
 * Revolutionary File Manager for Construction Projects
 * 
 * Features:
 * - Intelligent file organization by construction phase and trade
 * - Automatic categorization based on file type and content
 * - Integration with task orchestrator for workflow-aware storage
 * - Compliance document tracking and organization
 */
class FileManager {
    constructor() {
        this.storageRoot = path.join(__dirname, '..', 'storage');
        this.uploadRoot = path.join(__dirname, '..', 'uploads');
        this.fileDatabase = new Map(); // In production, use proper database
        
        // Ensure storage directories exist
        this.initializeStorage();
    }

    initializeStorage() {
        const directories = [
            this.storageRoot,
            this.uploadRoot,
            path.join(this.storageRoot, 'projects'),
            path.join(this.storageRoot, 'templates'),
            path.join(this.storageRoot, 'compliance'),
            path.join(this.storageRoot, 'progress-photos')
        ];

        directories.forEach(dir => {
            fs.ensureDirSync(dir);
        });
    }

    // Construction-specific file organization
    getUploadPath(projectId, phase = null, trade = null) {
        let uploadPath = path.join(this.uploadRoot, projectId);
        
        if (phase) {
            uploadPath = path.join(uploadPath, 'phases', this.sanitizePhase(phase));
        }
        
        if (trade) {
            uploadPath = path.join(uploadPath, 'trades', this.sanitizeTrade(trade));
        }
        
        return uploadPath;
    }

    sanitizePhase(phase) {
        // Convert phase names to safe directory names
        const phaseMap = {
            'design-planning': 'design-planning',
            'permits-approvals': 'permits-approvals',
            'site-preparation': 'site-preparation',
            'foundation': 'foundation',
            'framing': 'framing',
            'mechanical-electrical-plumbing': 'mep',
            'insulation-drywall': 'insulation-drywall',
            'flooring-finishes': 'flooring-finishes',
            'final-inspections': 'final-inspections'
        };
        
        return phaseMap[phase] || phase.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    }

    sanitizeTrade(trade) {
        // Convert trade names to safe directory names
        const tradeMap = {
            'electrical': 'electrical',
            'plumbing': 'plumbing',
            'hvac': 'hvac',
            'carpentry': 'carpentry',
            'flooring': 'flooring',
            'painting': 'painting',
            'roofing': 'roofing',
            'concrete': 'concrete'
        };
        
        return tradeMap[trade] || trade.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    }

    generateFileName(file, metadata = {}) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        
        // Create intelligent file names based on context
        let fileName = baseName;
        
        if (metadata.phase) {
            fileName = `${metadata.phase}-${fileName}`;
        }
        
        if (metadata.trade) {
            fileName = `${metadata.trade}-${fileName}`;
        }
        
        if (metadata.fileType) {
            fileName = `${metadata.fileType}-${fileName}`;
        }
        
        return `${timestamp}-${fileName}${ext}`.replace(/[^a-zA-Z0-9.-]/g, '_');
    }

    getAllowedFileTypes() {
        return [
            // Images
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff',
            // Documents
            'application/pdf', 'text/plain', 'text/csv',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            // CAD and Technical
            'application/dwg', 'application/dxf', 'application/step', 'application/iges',
            // Archives
            'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
            // Video (for progress documentation)
            'video/mp4', 'video/avi', 'video/mov', 'video/wmv'
        ];
    }

    async createFileRecord(file, metadata) {
        const fileId = uuidv4();
        const now = new Date().toISOString();
        
        // Categorize file automatically
        const category = this.categorizeFile(file, metadata);
        
        // Initialize file record
        const fileRecord = {
            id: fileId,
            originalName: file.originalname,
            fileName: file.filename,
            filePath: file.path,
            size: file.size,
            mimeType: file.mimetype,
            category,
            projectId: metadata.projectId,
            phase: metadata.phase,
            trade: metadata.trade,
            taskId: metadata.taskId,
            description: metadata.description || '',
            tags: metadata.tags || [],
            uploadedAt: now,
            metadata: {
                ...metadata,
                fileExtension: path.extname(file.originalname),
                isImage: file.mimetype.startsWith('image/'),
                isPDF: file.mimetype === 'application/pdf',
                isCAD: this.isCADFile(file.mimetype)
            }
        };

        // GPS-based auto-organization for images
        if (metadata.gpsProjectDetection && metadata.gpsProjectDetection.detected) {
            const gpsDetection = metadata.gpsProjectDetection;
            
            // Auto-assign project if not already specified
            if (!fileRecord.projectId) {
                fileRecord.projectId = gpsDetection.projectId;
                console.log(`📍 [AUTO-ORG] GPS detected project: ${gpsDetection.project.name} (${gpsDetection.distance}m away)`);
            }

            // Add GPS-based tags
            const gpsTag = metadata.gpsProjectDetection ? this.generateGPSTags(metadata.gpsProjectDetection) : [];
            fileRecord.tags = [...(fileRecord.tags || []), ...gpsTag];

            // Add GPS organization info
            fileRecord.gpsOrganization = {
                autoDetected: true,
                detectedProject: gpsDetection.project.name,
                confidence: gpsDetection.confidence,
                distance: gpsDetection.distance,
                coordinates: gpsDetection.coordinates,
                organizationTimestamp: now
            };

            // Auto-detect construction phase if not specified
            if (!fileRecord.phase && metadata.autoDetectedProject) {
                fileRecord.phase = this.detectPhaseFromGPS(metadata);
            }
        }

        // Store in database (in production, use proper database)
        this.fileDatabase.set(fileId, fileRecord);
        
        return fileRecord;
    }

    async createProgressPhotoRecord(photo, metadata) {
        const photoId = uuidv4();
        const now = new Date().toISOString();
        
        const photoRecord = {
            id: photoId,
            type: 'progress-photo',
            originalName: photo.originalname,
            fileName: photo.filename,
            filePath: photo.path,
            size: photo.size,
            mimeType: photo.mimetype,
            projectId: metadata.projectId,
            taskId: metadata.taskId,
            phase: metadata.phase,
            beforeAfter: metadata.beforeAfter, // 'before' or 'after'
            timestamp: metadata.timestamp || now,
            location: metadata.location || null,
            uploadedAt: now,
            metadata: {
                ...metadata,
                isProgressPhoto: true,
                quality: 'original'
            }
        };

        // Store in database
        this.fileDatabase.set(photoId, photoRecord);
        
        return photoRecord;
    }

    categorizeFile(file, metadata) {
        const mimeType = file.mimetype;
        const fileName = file.originalname.toLowerCase();
        
        // Smart categorization based on file type and context
        if (mimeType.startsWith('image/')) {
            if (metadata.beforeAfter) return 'progress-photo';
            if (fileName.includes('plan') || fileName.includes('blueprint')) return 'plans';
            if (fileName.includes('permit') || fileName.includes('approval')) return 'permits';
            return 'photos';
        }
        
        if (mimeType === 'application/pdf') {
            if (fileName.includes('permit') || fileName.includes('approval')) return 'permits';
            if (fileName.includes('invoice') || fileName.includes('receipt')) return 'financial';
            if (fileName.includes('contract') || fileName.includes('agreement')) return 'contracts';
            if (fileName.includes('plan') || fileName.includes('drawing')) return 'plans';
            if (fileName.includes('inspection') || fileName.includes('report')) return 'inspections';
            return 'documents';
        }
        
        if (this.isCADFile(mimeType) || fileName.includes('.dwg') || fileName.includes('.dxf')) {
            return 'cad-drawings';
        }
        
        if (mimeType.includes('spreadsheet') || fileName.includes('.xls')) {
            return 'financial';
        }
        
        if (mimeType.startsWith('video/')) {
            return 'progress-videos';
        }
        
        return 'other';
    }

    /**
     * Generate GPS-based tags for auto-organization
     */
    generateGPSTags(gpsDetection) {
        const tags = [
            'gps-auto-detected',
            `confidence-${Math.round(gpsDetection.confidence * 100)}`,
            `distance-${gpsDetection.distance}m`
        ];

        if (gpsDetection.distance <= 10) {
            tags.push('on-site-location');
        } else if (gpsDetection.distance <= 50) {
            tags.push('near-site-location');
        }

        // Add project-specific tags
        if (gpsDetection.project.type) {
            tags.push(`project-type-${gpsDetection.project.type}`);
        }

        return tags;
    }

    /**
     * Detect construction phase from GPS and metadata context
     */
    detectPhaseFromGPS(metadata) {
        // Use existing phase detection logic but enhance with GPS context
        const fileName = metadata.originalName ? metadata.originalName.toLowerCase() : '';
        
        // Phase detection keywords
        const phaseKeywords = {
            'site-preparation': ['site', 'excavation', 'clearing', 'survey'],
            'foundation': ['foundation', 'concrete', 'footings', 'basement'],
            'framing': ['framing', 'frame', 'studs', 'beams', 'structural'],
            'mechanical-electrical-plumbing': ['electrical', 'plumbing', 'hvac', 'wiring', 'pipes'],
            'insulation-drywall': ['insulation', 'drywall', 'vapor', 'barrier'],
            'flooring-finishes': ['flooring', 'paint', 'trim', 'finish', 'cabinet']
        };

        for (const [phase, keywords] of Object.entries(phaseKeywords)) {
            if (keywords.some(keyword => fileName.includes(keyword))) {
                return phase;
            }
        }

        return 'general'; // Default phase
    }

    isCADFile(mimeType) {
        const cadTypes = [
            'application/dwg',
            'application/dxf',
            'application/step',
            'application/iges',
            'application/x-dwg',
            'image/vnd.dwg'
        ];
        return cadTypes.includes(mimeType);
    }

    // File retrieval methods
    async getProjectFiles(projectId, options = {}) {
        const projectFiles = Array.from(this.fileDatabase.values())
            .filter(file => file.projectId === projectId);

        let filteredFiles = projectFiles;

        // Apply filters
        if (options.category) {
            filteredFiles = filteredFiles.filter(file => file.category === options.category);
        }

        if (options.phase) {
            filteredFiles = filteredFiles.filter(file => file.phase === options.phase);
        }

        if (options.trade) {
            filteredFiles = filteredFiles.filter(file => file.trade === options.trade);
        }

        // Sort by upload date (newest first)
        filteredFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        // Apply pagination
        const start = options.offset || 0;
        const end = start + (options.limit || 50);
        
        return filteredFiles.slice(start, end);
    }

    async getPhaseFiles(projectId, phase) {
        return this.getProjectFiles(projectId, { phase });
    }

    async getTradeFiles(projectId, trade) {
        return this.getProjectFiles(projectId, { trade });
    }

    async getTaskFiles(taskId) {
        return Array.from(this.fileDatabase.values())
            .filter(file => file.taskId === taskId)
            .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    }

    async getFileById(fileId) {
        return this.fileDatabase.get(fileId);
    }

    async deleteFile(fileId) {
        const file = this.fileDatabase.get(fileId);
        if (!file) {
            throw new Error('File not found');
        }

        // Delete physical file
        try {
            await fs.unlink(file.filePath);
        } catch (error) {
            console.warn('Could not delete physical file:', error.message);
        }

        // Remove from database
        this.fileDatabase.delete(fileId);
        
        return true;
    }

    // Integration with task orchestrator
    async linkFileToTask(fileId, taskId) {
        const file = this.fileDatabase.get(fileId);
        if (!file) {
            throw new Error('File not found');
        }

        file.taskId = taskId;
        file.linkedAt = new Date().toISOString();
        
        this.fileDatabase.set(fileId, file);
        return file;
    }

    // Search functionality
    async searchFiles(query, filters = {}) {
        const allFiles = Array.from(this.fileDatabase.values());
        
        let results = allFiles.filter(file => {
            // Text search in file name, description, and tags
            const searchText = `${file.originalName} ${file.description} ${file.tags.join(' ')}`.toLowerCase();
            const matchesQuery = !query || searchText.includes(query.toLowerCase());
            
            // Apply filters
            const matchesProject = !filters.projectId || file.projectId === filters.projectId;
            const matchesCategory = !filters.category || file.category === filters.category;
            const matchesPhase = !filters.phase || file.phase === filters.phase;
            const matchesTrade = !filters.trade || file.trade === filters.trade;
            
            return matchesQuery && matchesProject && matchesCategory && matchesPhase && matchesTrade;
        });

        // Sort by relevance and date
        results.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        
        return results;
    }

    // Get file categories for filtering
    getCategories() {
        return [
            { id: 'plans', name: 'Plans & Blueprints', icon: 'blueprint' },
            { id: 'permits', name: 'Permits & Approvals', icon: 'certificate' },
            { id: 'progress-photo', name: 'Progress Photos', icon: 'camera' },
            { id: 'progress-videos', name: 'Progress Videos', icon: 'video' },
            { id: 'cad-drawings', name: 'CAD Drawings', icon: 'drafting-compass' },
            { id: 'inspections', name: 'Inspections & Reports', icon: 'clipboard-check' },
            { id: 'contracts', name: 'Contracts & Agreements', icon: 'file-contract' },
            { id: 'financial', name: 'Financial Documents', icon: 'dollar-sign' },
            { id: 'documents', name: 'General Documents', icon: 'file-text' },
            { id: 'photos', name: 'General Photos', icon: 'image' },
            { id: 'other', name: 'Other Files', icon: 'file' }
        ];
    }
}

module.exports = FileManager;