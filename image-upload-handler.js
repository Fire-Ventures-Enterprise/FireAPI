/**
 * Image Upload Handler for Room Visualizer
 * Handles file uploads, validation, preprocessing, and storage
 */

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class ImageUploadHandler {
    constructor() {
        this.uploadDir = path.join(__dirname, 'uploads', 'room-images');
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        this.processedImageCache = new Map();
        
        this.initializeUploadDirectory();
    }

    async initializeUploadDirectory() {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
            console.log('📁 Room image upload directory initialized');
        } catch (error) {
            console.error('Failed to create upload directory:', error);
        }
    }

    /**
     * Multer configuration for handling file uploads
     */
    getMulterConfig() {
        const storage = multer.memoryStorage(); // Store in memory for processing
        
        return multer({
            storage,
            limits: {
                fileSize: this.maxFileSize,
                files: 1
            },
            fileFilter: (req, file, cb) => {
                if (this.allowedMimeTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error(`Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`));
                }
            }
        });
    }

    /**
     * Process uploaded image for room visualization
     */
    async processUploadedImage(fileBuffer, originalName) {
        try {
            // Generate unique filename
            const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
            const timestamp = Date.now();
            const extension = path.extname(originalName).toLowerCase() || '.jpg';
            const filename = `room_${timestamp}_${fileHash.substr(0, 8)}${extension}`;
            const filePath = path.join(this.uploadDir, filename);

            // Validate and get image metadata
            const metadata = await sharp(fileBuffer).metadata();
            
            if (!metadata.width || !metadata.height) {
                throw new Error('Invalid image file');
            }

            console.log(`📸 Processing room image: ${metadata.width}x${metadata.height}, ${metadata.format}`);

            // Optimize image for visualization
            const processedBuffer = await sharp(fileBuffer)
                .resize(1200, 1200, { 
                    fit: 'inside',
                    withoutEnlargement: true 
                })
                .jpeg({ 
                    quality: 85,
                    progressive: true 
                })
                .toBuffer();

            // Save processed image
            await fs.writeFile(filePath, processedBuffer);

            // Generate base64 for API
            const base64Data = processedBuffer.toString('base64');
            const dataUrl = `data:image/jpeg;base64,${base64Data}`;

            // Create image analysis
            const analysis = await this.analyzeUploadedImage(processedBuffer, metadata);

            const imageRecord = {
                id: fileHash.substr(0, 16),
                originalName,
                filename,
                filePath,
                url: `/uploads/room-images/${filename}`,
                dataUrl,
                metadata: {
                    width: metadata.width,
                    height: metadata.height,
                    format: metadata.format,
                    size: processedBuffer.length
                },
                analysis,
                uploadedAt: new Date().toISOString(),
                processed: true
            };

            // Cache the processed image
            this.processedImageCache.set(imageRecord.id, imageRecord);

            console.log(`✅ Room image processed and saved: ${filename}`);
            
            return imageRecord;

        } catch (error) {
            throw new Error(`Image processing failed: ${error.message}`);
        }
    }

    /**
     * Analyze uploaded image for room characteristics
     */
    async analyzeUploadedImage(imageBuffer, metadata) {
        try {
            // Extract image statistics
            const stats = await sharp(imageBuffer).stats();
            
            // Determine image quality and characteristics
            const analysis = {
                quality: 'good',
                brightness: this.calculateBrightness(stats),
                aspectRatio: metadata.width / metadata.height,
                recommendedForVisualization: true,
                detectedFeatures: [],
                suggestions: []
            };

            // Analyze brightness
            if (analysis.brightness < 0.3) {
                analysis.quality = 'dark';
                analysis.suggestions.push('Image appears dark - consider using a brighter photo for better visualization');
            } else if (analysis.brightness > 0.8) {
                analysis.quality = 'bright';
                analysis.suggestions.push('Image is very bright - visualization may work better with more balanced lighting');
            }

            // Analyze aspect ratio
            if (analysis.aspectRatio < 0.75) {
                analysis.suggestions.push('Vertical image - horizontal room photos work best for flooring visualization');
            } else if (analysis.aspectRatio > 1.5) {
                analysis.suggestions.push('Wide image - may crop some room details during visualization');
            }

            // Check image size
            if (metadata.width < 600 || metadata.height < 400) {
                analysis.quality = 'low_resolution';
                analysis.recommendedForVisualization = false;
                analysis.suggestions.push('Image resolution is low - use higher resolution photos for better results');
            }

            // Detect potential room features (simplified)
            analysis.detectedFeatures = this.detectRoomFeatures(stats, metadata);

            return analysis;

        } catch (error) {
            return {
                quality: 'unknown',
                brightness: 0.5,
                aspectRatio: 1.0,
                recommendedForVisualization: true,
                detectedFeatures: [],
                suggestions: ['Unable to analyze image - proceeding with visualization'],
                error: error.message
            };
        }
    }

    calculateBrightness(stats) {
        // Calculate relative brightness from image statistics
        const channels = stats.channels || [];
        if (channels.length === 0) return 0.5;

        let totalMean = 0;
        channels.forEach(channel => {
            totalMean += channel.mean || 0;
        });

        return Math.min(1.0, totalMean / (channels.length * 255));
    }

    detectRoomFeatures(stats, metadata) {
        const features = [];
        
        // Basic feature detection based on image characteristics
        if (metadata.width > metadata.height) {
            features.push('horizontal_orientation');
        }
        
        if (metadata.width >= 1000 && metadata.height >= 700) {
            features.push('high_resolution');
        }
        
        // Detect potential indoor characteristics
        const avgBrightness = this.calculateBrightness(stats);
        if (avgBrightness > 0.4 && avgBrightness < 0.8) {
            features.push('indoor_lighting');
        }
        
        return features;
    }

    /**
     * Get processed image by ID
     */
    getProcessedImage(imageId) {
        return this.processedImageCache.get(imageId);
    }

    /**
     * Convert file upload to base64 data URL
     */
    fileToDataUrl(fileBuffer, mimeType = 'image/jpeg') {
        const base64 = fileBuffer.toString('base64');
        return `data:${mimeType};base64,${base64}`;
    }

    /**
     * Validate image before processing
     */
    async validateImage(fileBuffer) {
        try {
            const metadata = await sharp(fileBuffer).metadata();
            
            const validation = {
                valid: true,
                errors: [],
                warnings: []
            };

            // Check file size
            if (fileBuffer.length > this.maxFileSize) {
                validation.valid = false;
                validation.errors.push(`File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`);
            }

            // Check dimensions
            if (metadata.width && metadata.height) {
                if (metadata.width < 300 || metadata.height < 200) {
                    validation.valid = false;
                    validation.errors.push('Image too small. Minimum size: 300x200 pixels');
                }

                if (metadata.width > 4000 || metadata.height > 4000) {
                    validation.warnings.push('Large image will be resized for processing');
                }
            }

            // Check format
            if (!['jpeg', 'jpg', 'png', 'webp'].includes(metadata.format)) {
                validation.valid = false;
                validation.errors.push(`Unsupported format: ${metadata.format}. Use JPEG, PNG, or WebP`);
            }

            return validation;

        } catch (error) {
            return {
                valid: false,
                errors: [`Invalid image file: ${error.message}`],
                warnings: []
            };
        }
    }

    /**
     * Clean up old uploaded images
     */
    async cleanupOldImages(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
        try {
            const files = await fs.readdir(this.uploadDir);
            const now = Date.now();
            
            for (const file of files) {
                const filePath = path.join(this.uploadDir, file);
                const stats = await fs.stat(filePath);
                
                if (now - stats.mtime.getTime() > maxAge) {
                    await fs.unlink(filePath);
                    console.log(`🗑️ Cleaned up old room image: ${file}`);
                }
            }
        } catch (error) {
            console.error('Error cleaning up old images:', error);
        }
    }

    /**
     * Generate thumbnail for image preview
     */
    async generateThumbnail(imageBuffer, width = 300, height = 200) {
        try {
            const thumbnail = await sharp(imageBuffer)
                .resize(width, height, { 
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: 70 })
                .toBuffer();

            return thumbnail.toString('base64');
        } catch (error) {
            throw new Error(`Thumbnail generation failed: ${error.message}`);
        }
    }
}

module.exports = ImageUploadHandler;