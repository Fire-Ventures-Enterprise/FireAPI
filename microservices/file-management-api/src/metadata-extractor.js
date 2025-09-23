const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const GeoLocationManager = require('./geo-location-manager');

/**
 * Intelligent Metadata Extractor for Construction Files
 * 
 * Features:
 * - Image EXIF data extraction (location, timestamp, camera info)
 * - PDF metadata extraction (author, creation date, title)
 * - File size and dimension analysis
 * - Construction-specific metadata recognition
 * - Location and timestamp correlation for progress tracking
 */
class MetadataExtractor {
    constructor() {
        // Initialize extraction engines
        this.pdfParser = null;
        this.exifParser = null;
        this.geoLocationManager = new GeoLocationManager();
        
        // Try to load optional parsers
        this.initializeParsers();
    }

    async initializeParsers() {
        try {
            // Lazy load PDF parser
            const pdfParse = require('pdf-parse');
            this.pdfParser = pdfParse;
        } catch (error) {
            console.warn('PDF parser not available:', error.message);
        }

        try {
            // Lazy load EXIF parser
            const exifr = require('exifr');
            this.exifParser = exifr;
        } catch (error) {
            console.warn('EXIF parser not available:', error.message);
        }
    }

    async extractMetadata(filePath) {
        const stats = await fs.stat(filePath);
        const mimeType = this.getMimeType(filePath);
        
        const metadata = {
            fileSize: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            mimeType,
            analysis: {}
        };

        try {
            // Extract type-specific metadata
            if (mimeType.startsWith('image/')) {
                const imageMetadata = await this.extractImageMetadata(filePath);
                Object.assign(metadata, imageMetadata);
            } else if (mimeType === 'application/pdf') {
                const pdfMetadata = await this.extractPDFMetadata(filePath);
                Object.assign(metadata, pdfMetadata);
            }

            // Analyze for construction-specific content
            metadata.constructionAnalysis = await this.analyzeConstructionContent(filePath, mimeType);

            // GPS-based project detection for images
            if (mimeType.startsWith('image/') && metadata.location) {
                metadata.gpsProjectDetection = await this.geoLocationManager.detectProjectFromGPS(metadata.location);
                
                if (metadata.gpsProjectDetection.detected) {
                    // Enhance metadata with project information
                    metadata.autoDetectedProject = {
                        projectId: metadata.gpsProjectDetection.projectId,
                        projectName: metadata.gpsProjectDetection.project.name,
                        confidence: metadata.gpsProjectDetection.confidence,
                        distance: metadata.gpsProjectDetection.distance
                    };

                    // Get reverse geocoding information
                    metadata.addressInfo = await this.geoLocationManager.reverseGeocode(metadata.location);
                }
            }
            
        } catch (error) {
            console.warn('Metadata extraction warning:', error.message);
            metadata.extractionError = error.message;
        }

        return metadata;
    }

    async extractImageMetadata(filePath) {
        const metadata = {
            type: 'image',
            dimensions: null,
            exif: null,
            location: null,
            timestamp: null,
            camera: null
        };

        try {
            // Use Sharp to get basic image info
            const imageInfo = await sharp(filePath).metadata();
            metadata.dimensions = {
                width: imageInfo.width,
                height: imageInfo.height,
                channels: imageInfo.channels,
                format: imageInfo.format,
                density: imageInfo.density
            };

            // Extract EXIF data if available
            if (this.exifParser && imageInfo.exif) {
                const exifData = await this.extractEXIFData(filePath);
                if (exifData) {
                    metadata.exif = exifData;
                    
                    // Extract GPS coordinates
                    if (exifData.latitude && exifData.longitude) {
                        metadata.location = {
                            latitude: exifData.latitude,
                            longitude: exifData.longitude,
                            altitude: exifData.GPSAltitude || null
                        };
                    }
                    
                    // Extract timestamp
                    if (exifData.DateTimeOriginal) {
                        metadata.timestamp = new Date(exifData.DateTimeOriginal);
                    }
                    
                    // Extract camera information
                    metadata.camera = {
                        make: exifData.Make || null,
                        model: exifData.Model || null,
                        software: exifData.Software || null
                    };
                }
            }

            // Analyze image for construction content
            metadata.constructionFeatures = await this.analyzeImageForConstruction(filePath);
            
        } catch (error) {
            console.warn('Image metadata extraction error:', error.message);
        }

        return metadata;
    }

    async extractEXIFData(filePath) {
        try {
            if (!this.exifParser) {
                return null;
            }

            const exifData = await this.exifParser.parse(filePath);
            return exifData;
        } catch (error) {
            console.warn('EXIF extraction error:', error.message);
            return null;
        }
    }

    parseGPSCoordinates(gps) {
        if (!gps || !gps.GPSLatitude || !gps.GPSLongitude) {
            return null;
        }

        try {
            // Convert GPS coordinates to decimal degrees
            const lat = this.convertDMSToDD(
                gps.GPSLatitude,
                gps.GPSLatitudeRef
            );
            const lon = this.convertDMSToDD(
                gps.GPSLongitude,
                gps.GPSLongitudeRef
            );

            return {
                latitude: lat,
                longitude: lon,
                altitude: gps.GPSAltitude || null,
                timestamp: gps.GPSTimeStamp || null
            };
        } catch (error) {
            console.warn('GPS coordinate parsing error:', error.message);
            return null;
        }
    }

    convertDMSToDD(dmsArray, ref) {
        if (!Array.isArray(dmsArray) || dmsArray.length !== 3) {
            return null;
        }

        const degrees = dmsArray[0];
        const minutes = dmsArray[1];
        const seconds = dmsArray[2];
        
        let dd = degrees + minutes / 60 + seconds / 3600;
        
        // Apply negative sign for South/West coordinates
        if (ref === 'S' || ref === 'W') {
            dd = dd * -1;
        }
        
        return dd;
    }

    async extractPDFMetadata(filePath) {
        const metadata = {
            type: 'pdf',
            pages: null,
            text: null,
            info: null
        };

        try {
            if (!this.pdfParser) {
                return metadata;
            }

            const dataBuffer = await fs.readFile(filePath);
            const pdfData = await this.pdfParser(dataBuffer);

            metadata.pages = pdfData.numpages;
            metadata.text = pdfData.text ? pdfData.text.substring(0, 5000) : null; // Limit text extraction
            metadata.info = pdfData.info;

            // Extract construction-specific information from PDF text
            if (pdfData.text) {
                metadata.constructionContent = this.extractConstructionTerms(pdfData.text);
            }

        } catch (error) {
            console.warn('PDF metadata extraction error:', error.message);
        }

        return metadata;
    }

    async analyzeConstructionContent(filePath, mimeType) {
        const analysis = {
            isConstructionRelated: false,
            detectedTerms: [],
            suggestedCategory: null,
            confidenceScore: 0
        };

        const fileName = path.basename(filePath).toLowerCase();
        
        // Analyze filename for construction terms
        const constructionTerms = this.getConstructionTerms();
        const detectedTerms = [];
        
        for (const [category, terms] of Object.entries(constructionTerms)) {
            for (const term of terms) {
                if (fileName.includes(term.toLowerCase())) {
                    detectedTerms.push({ category, term, source: 'filename' });
                }
            }
        }

        if (detectedTerms.length > 0) {
            analysis.isConstructionRelated = true;
            analysis.detectedTerms = detectedTerms;
            analysis.suggestedCategory = this.suggestCategory(detectedTerms);
            analysis.confidenceScore = Math.min(detectedTerms.length * 0.3, 1.0);
        }

        return analysis;
    }

    async analyzeImageForConstruction(filePath) {
        // This is where you could integrate with ML/AI services
        // to detect construction equipment, materials, progress, etc.
        
        const features = {
            hasTools: false,
            hasMaterials: false,
            hasWorkers: false,
            hasEquipment: false,
            qualityScore: null,
            brightness: null,
            contrast: null
        };

        try {
            // Basic image quality analysis using Sharp
            const stats = await sharp(filePath).stats();
            
            // Calculate basic quality metrics
            features.brightness = this.calculateBrightness(stats);
            features.contrast = this.calculateContrast(stats);
            features.qualityScore = this.calculateQualityScore(features);
            
        } catch (error) {
            console.warn('Image analysis error:', error.message);
        }

        return features;
    }

    calculateBrightness(stats) {
        // Calculate average brightness across all channels
        if (!stats.channels) return null;
        
        const avgBrightness = stats.channels.reduce((sum, channel) => {
            return sum + channel.mean;
        }, 0) / stats.channels.length;
        
        return avgBrightness / 255; // Normalize to 0-1
    }

    calculateContrast(stats) {
        // Calculate average standard deviation as contrast measure
        if (!stats.channels) return null;
        
        const avgStdDev = stats.channels.reduce((sum, channel) => {
            return sum + channel.stdev;
        }, 0) / stats.channels.length;
        
        return avgStdDev / 255; // Normalize to 0-1
    }

    calculateQualityScore(features) {
        if (!features.brightness || !features.contrast) return null;
        
        // Simple quality score based on brightness and contrast
        // Good photos have moderate brightness (0.3-0.8) and good contrast (>0.1)
        const brightnessScore = features.brightness > 0.3 && features.brightness < 0.8 ? 1 : 0.5;
        const contrastScore = features.contrast > 0.1 ? 1 : 0.5;
        
        return (brightnessScore + contrastScore) / 2;
    }

    extractConstructionTerms(text) {
        const terms = this.getConstructionTerms();
        const foundTerms = [];
        
        const lowerText = text.toLowerCase();
        
        for (const [category, categoryTerms] of Object.entries(terms)) {
            for (const term of categoryTerms) {
                if (lowerText.includes(term.toLowerCase())) {
                    foundTerms.push({ category, term });
                }
            }
        }

        return foundTerms;
    }

    getConstructionTerms() {
        return {
            permits: [
                'building permit', 'construction permit', 'demolition permit',
                'electrical permit', 'plumbing permit', 'hvac permit',
                'zoning approval', 'variance', 'inspection'
            ],
            plans: [
                'blueprint', 'floor plan', 'elevation', 'section',
                'architectural drawing', 'structural drawing', 'site plan',
                'foundation plan', 'electrical plan', 'plumbing plan'
            ],
            materials: [
                'concrete', 'rebar', 'lumber', 'steel', 'insulation',
                'drywall', 'roofing', 'siding', 'windows', 'doors',
                'flooring', 'tile', 'paint', 'fixtures'
            ],
            trades: [
                'electrical', 'plumbing', 'hvac', 'carpentry',
                'roofing', 'flooring', 'painting', 'concrete',
                'framing', 'insulation', 'drywall'
            ],
            safety: [
                'safety', 'hard hat', 'safety glasses', 'gloves',
                'harness', 'scaffolding', 'barrier', 'signage'
            ]
        };
    }

    suggestCategory(detectedTerms) {
        // Count categories and suggest the most frequent one
        const categoryCount = {};
        
        detectedTerms.forEach(term => {
            categoryCount[term.category] = (categoryCount[term.category] || 0) + 1;
        });

        // Find category with highest count
        let maxCount = 0;
        let suggestedCategory = null;
        
        for (const [category, count] of Object.entries(categoryCount)) {
            if (count > maxCount) {
                maxCount = count;
                suggestedCategory = category;
            }
        }

        // Map construction terms to file categories
        const categoryMap = {
            permits: 'permits',
            plans: 'plans',
            materials: 'photos',
            trades: 'photos',
            safety: 'photos'
        };

        return categoryMap[suggestedCategory] || 'other';
    }

    getMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeMap = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.tiff': 'image/tiff',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.dwg': 'application/dwg',
            '.dxf': 'application/dxf',
            '.zip': 'application/zip'
        };
        
        return mimeMap[ext] || 'application/octet-stream';
    }
}

module.exports = MetadataExtractor;