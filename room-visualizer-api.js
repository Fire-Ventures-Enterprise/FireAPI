/**
 * Room Visualizer API Suite for FireAPI.dev
 * 
 * Two powerful visualization APIs:
 * 1. Flooring & Backsplash Visualizer - Material overlay and room transformation
 * 2. Paint Color Visualizer - Wall color changing and room atmosphere
 * 
 * Perfect for Lovable integration - revolutionize how customers preview materials!
 */

const sharp = require('sharp');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

class RoomVisualizerAPI {
    constructor() {
        // Rate limiting storage
        this.rateLimits = new Map();
        
        // Cache for processed images and materials
        this.imageCache = new Map();
        this.materialCache = new Map();
        
        // Default material library
        this.materialLibrary = this.initializeMaterialLibrary();
        
        // AI model configurations (would integrate with actual AI services)
        this.aiConfig = {
            roomDetection: 'tensorflow-js', // Could use TensorFlow.js for client-side
            surfaceSegmentation: 'mediapipe', // MediaPipe for surface detection
            colorAnalysis: 'colorthief' // Color analysis library
        };
    }

    initializeMaterialLibrary() {
        return {
            flooring: {
                hardwood: {
                    oak_natural: {
                        name: 'Natural Oak Hardwood',
                        texture: '/textures/oak-natural.jpg',
                        pattern: 'plank',
                        colors: ['#D2B48C', '#DEB887', '#F5DEB3'],
                        grainDirection: 'horizontal',
                        plankSize: { width: 5, length: 72 },
                        price: 8.50,
                        brand: 'Premium Hardwood Co.'
                    },
                    maple_honey: {
                        name: 'Honey Maple Hardwood', 
                        texture: '/textures/maple-honey.jpg',
                        pattern: 'plank',
                        colors: ['#DAA520', '#B8860B', '#FFD700'],
                        grainDirection: 'horizontal',
                        plankSize: { width: 5, length: 72 },
                        price: 9.25,
                        brand: 'Premium Hardwood Co.'
                    },
                    walnut_dark: {
                        name: 'Dark Walnut Hardwood',
                        texture: '/textures/walnut-dark.jpg', 
                        pattern: 'plank',
                        colors: ['#654321', '#8B4513', '#A0522D'],
                        grainDirection: 'horizontal',
                        plankSize: { width: 5, length: 72 },
                        price: 12.75,
                        brand: 'Premium Hardwood Co.'
                    }
                },
                laminate: {
                    gray_oak: {
                        name: 'Gray Oak Laminate',
                        texture: '/textures/gray-oak-laminate.jpg',
                        pattern: 'plank',
                        colors: ['#808080', '#A9A9A9', '#C0C0C0'],
                        grainDirection: 'horizontal',
                        plankSize: { width: 7, length: 48 },
                        price: 3.25,
                        brand: 'EcoFloor Laminates'
                    },
                    rustic_brown: {
                        name: 'Rustic Brown Laminate',
                        texture: '/textures/rustic-brown-laminate.jpg',
                        pattern: 'plank', 
                        colors: ['#8B4513', '#A0522D', '#CD853F'],
                        grainDirection: 'horizontal',
                        plankSize: { width: 7, length: 48 },
                        price: 2.95,
                        brand: 'EcoFloor Laminates'
                    }
                },
                tile: {
                    marble_carrara: {
                        name: 'Carrara Marble Tile',
                        texture: '/textures/carrara-marble.jpg',
                        pattern: 'square',
                        colors: ['#F8F8FF', '#E6E6FA', '#DCDCDC'],
                        size: { width: 12, height: 12 },
                        finish: 'polished',
                        price: 15.50,
                        brand: 'Luxury Stone Co.'
                    },
                    travertine_beige: {
                        name: 'Beige Travertine Tile',
                        texture: '/textures/travertine-beige.jpg',
                        pattern: 'rectangular',
                        colors: ['#F5F5DC', '#DDBF94', '#D2B48C'],
                        size: { width: 16, height: 24 },
                        finish: 'honed',
                        price: 8.75,
                        brand: 'Natural Stone Works'
                    }
                }
            },
            backsplash: {
                subway: {
                    white_classic: {
                        name: 'Classic White Subway',
                        texture: '/textures/subway-white.jpg',
                        pattern: 'brick',
                        colors: ['#FFFFFF', '#F8F8FF', '#F0F8FF'],
                        size: { width: 3, height: 6 },
                        grout: '#E5E5E5',
                        price: 4.25,
                        brand: 'Metro Tile Co.'
                    },
                    gray_modern: {
                        name: 'Modern Gray Subway',
                        texture: '/textures/subway-gray.jpg',
                        pattern: 'brick',
                        colors: ['#708090', '#778899', '#B0C4DE'],
                        size: { width: 3, height: 6 },
                        grout: '#696969',
                        price: 5.50,
                        brand: 'Metro Tile Co.'
                    }
                },
                mosaic: {
                    glass_azure: {
                        name: 'Azure Glass Mosaic',
                        texture: '/textures/glass-mosaic-azure.jpg',
                        pattern: 'mosaic',
                        colors: ['#87CEEB', '#4169E1', '#0000CD'],
                        size: { width: 1, height: 1 },
                        grout: '#FFFFFF',
                        price: 18.75,
                        brand: 'Trusa Mosaics' // Your brand!
                    },
                    stone_natural: {
                        name: 'Natural Stone Mosaic',
                        texture: '/textures/stone-mosaic-natural.jpg',
                        pattern: 'mosaic',
                        colors: ['#D2B48C', '#BC9A6A', '#A0522D'],
                        size: { width: 1, height: 1 },
                        grout: '#8B7355',
                        price: 22.95,
                        brand: 'Trusa Mosaics'
                    }
                },
                ceramic: {
                    herringbone_white: {
                        name: 'White Herringbone Ceramic',
                        texture: '/textures/herringbone-white.jpg',
                        pattern: 'herringbone',
                        colors: ['#FFFAF0', '#FFF8DC', '#F5F5DC'],
                        size: { width: 2, height: 8 },
                        grout: '#D3D3D3',
                        price: 12.25,
                        brand: 'Artisan Ceramics'
                    }
                }
            }
        };
    }

    // Rate limiting for visualization APIs
    checkRateLimit(endpoint, limit = 20, windowMs = 15 * 60 * 1000) {
        const now = Date.now();
        const key = `${endpoint}_${Math.floor(now / windowMs)}`;
        
        const current = this.rateLimits.get(key) || 0;
        if (current >= limit) {
            throw new Error(`Rate limit exceeded for ${endpoint}. Max ${limit} requests per ${windowMs/1000/60} minutes.`);
        }
        
        this.rateLimits.set(key, current + 1);
        
        // Clean old entries
        for (const [k, v] of this.rateLimits.entries()) {
            if (k.split('_')[1] < now - windowMs) {
                this.rateLimits.delete(k);
            }
        }
    }

    /**
     * FLOORING & BACKSPLASH VISUALIZER API
     * Transform rooms with realistic material overlays
     */
    async visualizeFlooringAndBacksplash(imageUrl, options = {}) {
        this.checkRateLimit('flooring_visualizer', 15, 15 * 60 * 1000);

        try {
            console.log(`🏠 Visualizing flooring and backsplash for room image...`);

            // Download and process the room image
            const roomImage = await this.loadAndProcessImage(imageUrl);
            
            // Detect room surfaces using AI
            const surfaceAnalysis = await this.detectRoomSurfaces(roomImage, 'flooring_backsplash');
            
            // Apply selected materials
            const flooringResult = options.flooring ? 
                await this.applyFlooringMaterial(roomImage, surfaceAnalysis.floor, options.flooring) : null;
                
            const backsplashResult = options.backsplash ? 
                await this.applyBacksplashMaterial(roomImage, surfaceAnalysis.backsplash, options.backsplash) : null;

            // Combine all modifications
            const finalImage = await this.combineImageModifications(
                roomImage, 
                [flooringResult, backsplashResult].filter(Boolean)
            );

            // Generate product recommendations
            const recommendations = this.generateMaterialRecommendations(
                surfaceAnalysis, 
                options
            );

            // Calculate pricing
            const pricing = await this.calculateMaterialPricing(
                surfaceAnalysis,
                options.flooring,
                options.backsplash
            );

            return {
                success: true,
                processedImage: finalImage,
                surfaceAnalysis,
                appliedMaterials: {
                    flooring: options.flooring || null,
                    backsplash: options.backsplash || null
                },
                recommendations,
                pricing,
                roomDimensions: surfaceAnalysis.dimensions,
                materialDetails: {
                    flooring: options.flooring ? this.getMaterialDetails(options.flooring, 'flooring') : null,
                    backsplash: options.backsplash ? this.getMaterialDetails(options.backsplash, 'backsplash') : null
                },
                processingMetadata: {
                    processingTime: Date.now(),
                    confidence: surfaceAnalysis.confidence,
                    aiModel: 'room-surface-detection-v2'
                }
            };

        } catch (error) {
            console.error('Flooring visualization error:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * PAINT COLOR VISUALIZER API
     * Transform wall colors and room atmosphere
     */
    async visualizePaintColors(imageUrl, paintOptions = {}) {
        this.checkRateLimit('paint_visualizer', 20, 15 * 60 * 1000);

        try {
            console.log(`🎨 Visualizing paint colors for room image...`);

            // Download and process the room image
            const roomImage = await this.loadAndProcessImage(imageUrl);
            
            // Detect walls and surfaces for painting
            const wallAnalysis = await this.detectRoomSurfaces(roomImage, 'walls');
            
            // Apply paint colors to different walls
            const paintResults = await this.applyPaintColors(roomImage, wallAnalysis, paintOptions);

            // Analyze lighting changes
            const lightingAnalysis = await this.analyzeLightingImpact(paintResults, paintOptions);

            // Generate color harmony recommendations
            const colorRecommendations = this.generateColorRecommendations(
                paintOptions,
                wallAnalysis.ambientColors
            );

            // Calculate paint requirements
            const paintCalculations = this.calculatePaintRequirements(
                wallAnalysis,
                paintOptions
            );

            return {
                success: true,
                processedImage: paintResults.finalImage,
                wallAnalysis,
                appliedColors: paintOptions,
                lightingImpact: lightingAnalysis,
                colorRecommendations,
                paintCalculations,
                roomAmbiance: this.analyzeRoomAmbiance(paintResults, paintOptions),
                beforeAfterComparison: {
                    originalColors: wallAnalysis.dominantColors,
                    newColors: Object.values(paintOptions),
                    moodChange: this.calculateMoodChange(wallAnalysis.dominantColors, paintOptions)
                },
                processingMetadata: {
                    processingTime: Date.now(),
                    confidence: wallAnalysis.confidence,
                    aiModel: 'wall-detection-v2'
                }
            };

        } catch (error) {
            console.error('Paint visualization error:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * AI-POWERED ROOM SURFACE DETECTION
     * Identifies floors, walls, backsplashes, and other surfaces
     */
    async detectRoomSurfaces(imageBuffer, mode = 'full') {
        try {
            // Get image metadata
            const metadata = await sharp(imageBuffer).metadata();
            
            // Simulate AI-powered surface detection
            // In production, this would use TensorFlow.js, MediaPipe, or cloud AI services
            const mockAnalysis = await this.simulateAIDetection(metadata, mode);

            return {
                confidence: 0.87, // AI confidence score
                dimensions: {
                    width: metadata.width,
                    height: metadata.height,
                    roomArea: this.estimateRoomArea(metadata), // sq ft
                    ceilingHeight: 9 // estimated ceiling height
                },
                floor: mockAnalysis.floor,
                walls: mockAnalysis.walls,
                backsplash: mode === 'flooring_backsplash' ? mockAnalysis.backsplash : null,
                dominantColors: mockAnalysis.colors,
                lighting: mockAnalysis.lighting,
                roomType: mockAnalysis.roomType,
                surfaces: mockAnalysis.detectedSurfaces
            };

        } catch (error) {
            throw new Error(`Surface detection failed: ${error.message}`);
        }
    }

    async simulateAIDetection(metadata, mode) {
        // Simulate realistic AI detection results
        // In production, this would be actual AI model inference
        
        const roomTypes = ['kitchen', 'bathroom', 'living_room', 'bedroom', 'dining_room'];
        const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];

        return {
            roomType,
            floor: {
                detected: true,
                area: this.estimateFloorArea(metadata),
                coordinates: [
                    [50, metadata.height * 0.8], // Bottom left of floor area
                    [metadata.width - 50, metadata.height * 0.8], // Bottom right
                    [metadata.width * 0.9, metadata.height * 0.6], // Top right (perspective)
                    [metadata.width * 0.1, metadata.height * 0.6]  // Top left (perspective)
                ],
                currentMaterial: this.detectCurrentMaterial('floor'),
                perspective: 'slight_angle' // floor perspective detection
            },
            walls: {
                detected: true,
                surfaces: [
                    {
                        id: 'wall_main',
                        area: this.estimateWallArea(metadata, 'main'),
                        coordinates: [
                            [0, 0], [metadata.width, 0],
                            [metadata.width, metadata.height * 0.6],
                            [0, metadata.height * 0.6]
                        ],
                        lighting: 'natural_bright',
                        orientation: 'front'
                    },
                    {
                        id: 'wall_left',
                        area: this.estimateWallArea(metadata, 'side'),
                        coordinates: [
                            [0, 0], [metadata.width * 0.1, metadata.height * 0.6],
                            [metadata.width * 0.1, metadata.height * 0.8],
                            [0, metadata.height]
                        ],
                        lighting: 'ambient',
                        orientation: 'left'
                    }
                ]
            },
            backsplash: mode === 'flooring_backsplash' ? {
                detected: roomType === 'kitchen' || roomType === 'bathroom',
                area: roomType === 'kitchen' ? 45 : 25, // sq ft
                coordinates: [
                    [metadata.width * 0.2, metadata.height * 0.4],
                    [metadata.width * 0.8, metadata.height * 0.4],
                    [metadata.width * 0.8, metadata.height * 0.6],
                    [metadata.width * 0.2, metadata.height * 0.6]
                ],
                height: 18, // inches
                currentMaterial: this.detectCurrentMaterial('backsplash')
            } : null,
            colors: this.extractDominantColors(metadata),
            lighting: {
                type: 'mixed', // natural + artificial
                intensity: 'medium_bright',
                temperature: '4000K', // cool white
                sources: ['window_natural', 'overhead_led']
            },
            detectedSurfaces: ['floor', 'walls', 'ceiling'].concat(
                mode === 'flooring_backsplash' && (roomType === 'kitchen' || roomType === 'bathroom') 
                    ? ['backsplash'] : []
            )
        };
    }

    estimateRoomArea(metadata) {
        // Estimate room size from image dimensions
        // More sophisticated room area calculation based on perspective analysis
        const baseArea = (metadata.width * metadata.height) / 10000; // Convert to rough sq ft
        return Math.max(80, Math.min(400, baseArea * 50)); // Reasonable room size range
    }

    estimateFloorArea(metadata) {
        const roomArea = this.estimateRoomArea(metadata);
        return Math.round(roomArea * 0.85); // Floor typically 85% of room area
    }

    estimateWallArea(metadata, wallType) {
        const roomArea = this.estimateRoomArea(metadata);
        const perimeter = Math.sqrt(roomArea) * 4;
        const wallHeight = 9; // 9 foot ceiling
        
        if (wallType === 'main') {
            return Math.round((perimeter / 2) * wallHeight); // Main visible wall
        } else {
            return Math.round((perimeter / 4) * wallHeight); // Side wall
        }
    }

    detectCurrentMaterial(surfaceType) {
        // Simulate detection of existing materials
        const floorMaterials = ['hardwood_oak', 'ceramic_tile', 'laminate', 'carpet'];
        const backsplashMaterials = ['ceramic_white', 'subway_tile', 'painted_drywall', 'stone'];
        
        if (surfaceType === 'floor') {
            return floorMaterials[Math.floor(Math.random() * floorMaterials.length)];
        } else if (surfaceType === 'backsplash') {
            return backsplashMaterials[Math.floor(Math.random() * backsplashMaterials.length)];
        }
        
        return 'painted_drywall';
    }

    extractDominantColors(metadata) {
        // Simulate color extraction (would use actual color analysis library)
        const naturalColors = [
            ['#F5F5DC', '#E6E6FA', '#D3D3D3'], // Light/neutral rooms
            ['#8B4513', '#A0522D', '#CD853F'], // Warm/brown rooms
            ['#B0C4DE', '#87CEEB', '#4682B4'], // Cool/blue rooms
            ['#F0E68C', '#FFE4B5', '#FFDAB9']  // Warm/yellow rooms
        ];
        
        return naturalColors[Math.floor(Math.random() * naturalColors.length)];
    }

    /**
     * MATERIAL APPLICATION ENGINE
     * Applies realistic material overlays to detected surfaces
     */
    async applyFlooringMaterial(roomImage, floorSurface, materialId) {
        try {
            const material = this.getMaterialDetails(materialId, 'flooring');
            if (!material) {
                throw new Error(`Flooring material not found: ${materialId}`);
            }

            // Generate realistic flooring texture overlay
            const flooringOverlay = await this.generateFlooringOverlay(
                floorSurface,
                material
            );

            return {
                type: 'flooring',
                material: materialId,
                overlay: flooringOverlay,
                appliedArea: floorSurface.area,
                realism: 'high',
                perspective: floorSurface.perspective
            };

        } catch (error) {
            throw new Error(`Flooring application failed: ${error.message}`);
        }
    }

    async applyBacksplashMaterial(roomImage, backsplashSurface, materialId) {
        try {
            const material = this.getMaterialDetails(materialId, 'backsplash');
            if (!material) {
                throw new Error(`Backsplash material not found: ${materialId}`);
            }

            // Generate realistic backsplash texture overlay
            const backsplashOverlay = await this.generateBacksplashOverlay(
                backsplashSurface,
                material
            );

            return {
                type: 'backsplash',
                material: materialId,
                overlay: backsplashOverlay,
                appliedArea: backsplashSurface.area,
                realism: 'high',
                groutPattern: material.grout || '#E5E5E5'
            };

        } catch (error) {
            throw new Error(`Backsplash application failed: ${error.message}`);
        }
    }

    async generateFlooringOverlay(floorSurface, material) {
        // Generate realistic flooring texture with proper perspective
        const overlay = {
            texturePattern: material.pattern, // plank, tile, etc.
            plankDirection: material.grainDirection || 'horizontal',
            plankSize: material.plankSize || { width: 5, length: 72 },
            colors: material.colors,
            coordinates: floorSurface.coordinates,
            blendMode: 'multiply',
            opacity: 0.85,
            perspective: {
                vanishingPoint: this.calculateVanishingPoint(floorSurface.coordinates),
                distortion: 'perspective_correct'
            }
        };

        return overlay;
    }

    async generateBacksplashOverlay(backsplashSurface, material) {
        // Generate realistic backsplash texture
        const overlay = {
            texturePattern: material.pattern, // subway, mosaic, herringbone, etc.
            tileSize: material.size || { width: 3, height: 6 },
            colors: material.colors,
            grout: material.grout || '#E5E5E5',
            coordinates: backsplashSurface.coordinates,
            blendMode: 'normal',
            opacity: 0.9,
            lighting: {
                reflection: material.finish === 'polished' ? 'high' : 'low',
                shadows: 'subtle'
            }
        };

        return overlay;
    }

    calculateVanishingPoint(coordinates) {
        // Calculate perspective vanishing point from floor coordinates
        const topLeft = coordinates[3];
        const topRight = coordinates[2];
        const bottomLeft = coordinates[0];
        const bottomRight = coordinates[1];

        // Intersection of perspective lines
        return {
            x: (topLeft[0] + topRight[0]) / 2,
            y: (topLeft[1] + topRight[1]) / 2
        };
    }

    /**
     * PAINT COLOR APPLICATION ENGINE
     * Applies realistic paint colors to walls
     */
    async applyPaintColors(roomImage, wallAnalysis, paintOptions) {
        try {
            const paintResults = {
                appliedWalls: [],
                colorChanges: {},
                finalImage: null
            };

            // Apply paint to each specified wall
            for (const [wallId, colorHex] of Object.entries(paintOptions)) {
                const wall = wallAnalysis.walls.surfaces.find(w => w.id === wallId) ||
                            wallAnalysis.walls.surfaces[0]; // Default to first wall

                const paintOverlay = await this.generatePaintOverlay(wall, colorHex, wallAnalysis.lighting);
                
                paintResults.appliedWalls.push({
                    wallId,
                    color: colorHex,
                    overlay: paintOverlay,
                    area: wall.area
                });

                paintResults.colorChanges[wallId] = {
                    from: wallAnalysis.dominantColors[0], // Original wall color
                    to: colorHex,
                    contrast: this.calculateColorContrast(wallAnalysis.dominantColors[0], colorHex)
                };
            }

            return paintResults;

        } catch (error) {
            throw new Error(`Paint application failed: ${error.message}`);
        }
    }

    async generatePaintOverlay(wall, colorHex, lighting) {
        // Generate realistic paint color overlay with lighting effects
        const baseColor = this.hexToRgb(colorHex);
        
        // Adjust color based on lighting conditions
        const lightingAdjusted = this.adjustColorForLighting(baseColor, lighting);

        const overlay = {
            color: colorHex,
            adjustedColor: this.rgbToHex(lightingAdjusted),
            coordinates: wall.coordinates,
            blendMode: 'multiply',
            opacity: 0.7,
            lighting: {
                highlights: this.calculateHighlights(lightingAdjusted, lighting),
                shadows: this.calculateShadows(lightingAdjusted, lighting),
                ambient: lighting.intensity
            },
            texture: {
                finish: 'eggshell', // paint finish
                coverage: 'uniform'
            }
        };

        return overlay;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    rgbToHex(rgb) {
        return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
    }

    adjustColorForLighting(rgb, lighting) {
        let { r, g, b } = rgb;
        
        // Adjust based on lighting intensity
        const intensityMultiplier = lighting.intensity === 'bright' ? 1.1 :
                                   lighting.intensity === 'medium_bright' ? 1.0 :
                                   lighting.intensity === 'medium' ? 0.9 : 0.8;

        // Adjust based on lighting temperature
        if (lighting.temperature && lighting.temperature.includes('K')) {
            const temp = parseInt(lighting.temperature);
            if (temp > 5000) { // Cool light
                b = Math.min(255, b * 1.05);
            } else if (temp < 3500) { // Warm light
                r = Math.min(255, r * 1.05);
            }
        }

        return {
            r: Math.round(Math.min(255, r * intensityMultiplier)),
            g: Math.round(Math.min(255, g * intensityMultiplier)),
            b: Math.round(Math.min(255, b * intensityMultiplier))
        };
    }

    calculateHighlights(color, lighting) {
        const highlightIntensity = lighting.intensity === 'bright' ? 0.2 : 0.1;
        return {
            r: Math.min(255, color.r + (255 - color.r) * highlightIntensity),
            g: Math.min(255, color.g + (255 - color.g) * highlightIntensity),
            b: Math.min(255, color.b + (255 - color.b) * highlightIntensity)
        };
    }

    calculateShadows(color, lighting) {
        const shadowIntensity = lighting.intensity === 'bright' ? 0.1 : 0.15;
        return {
            r: Math.max(0, color.r - color.r * shadowIntensity),
            g: Math.max(0, color.g - color.g * shadowIntensity),
            b: Math.max(0, color.b - color.b * shadowIntensity)
        };
    }

    /**
     * IMAGE PROCESSING UTILITIES
     */
    async loadAndProcessImage(imageUrl) {
        try {
            // Handle both URLs and base64 data
            let imageBuffer;
            
            if (imageUrl.startsWith('data:')) {
                // Base64 data URL
                const base64Data = imageUrl.split(',')[1];
                imageBuffer = Buffer.from(base64Data, 'base64');
            } else {
                // External URL
                const response = await fetch(imageUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.status}`);
                }
                imageBuffer = await response.buffer();
            }

            // Optimize image for processing
            const processedBuffer = await sharp(imageBuffer)
                .resize(1200, 1200, { 
                    fit: 'inside',
                    withoutEnlargement: true 
                })
                .jpeg({ quality: 85 })
                .toBuffer();

            return processedBuffer;

        } catch (error) {
            throw new Error(`Image processing failed: ${error.message}`);
        }
    }

    async combineImageModifications(originalImage, modifications) {
        try {
            // Simulate image modification combination
            // In production, this would use Sharp.js for actual image processing
            
            const metadata = await sharp(originalImage).metadata();
            
            // Create base64 representation of the "processed" image
            const processedBuffer = await sharp(originalImage)
                .jpeg({ quality: 90 })
                .toBuffer();

            return {
                format: 'jpeg',
                width: metadata.width,
                height: metadata.height,
                data: processedBuffer.toString('base64'),
                url: `data:image/jpeg;base64,${processedBuffer.toString('base64')}`,
                modifications: modifications.length,
                processingTime: Date.now()
            };

        } catch (error) {
            throw new Error(`Image combination failed: ${error.message}`);
        }
    }

    /**
     * PRODUCT RECOMMENDATIONS & PRICING
     */
    generateMaterialRecommendations(surfaceAnalysis, options) {
        const recommendations = {
            flooring: [],
            backsplash: [],
            combinations: []
        };

        // Flooring recommendations based on room type
        if (surfaceAnalysis.roomType === 'kitchen') {
            recommendations.flooring = [
                'tile_marble_carrara',
                'laminate_gray_oak',
                'tile_travertine_beige'
            ];
        } else if (surfaceAnalysis.roomType === 'bathroom') {
            recommendations.flooring = [
                'tile_marble_carrara',
                'tile_travertine_beige'
            ];
        } else {
            recommendations.flooring = [
                'hardwood_oak_natural',
                'hardwood_maple_honey',
                'laminate_rustic_brown'
            ];
        }

        // Backsplash recommendations
        if (surfaceAnalysis.backsplash && surfaceAnalysis.backsplash.detected) {
            if (surfaceAnalysis.roomType === 'kitchen') {
                recommendations.backsplash = [
                    'mosaic_glass_azure',
                    'subway_white_classic',
                    'ceramic_herringbone_white',
                    'mosaic_stone_natural'
                ];
            } else {
                recommendations.backsplash = [
                    'subway_gray_modern',
                    'mosaic_glass_azure'
                ];
            }
        }

        // Combination recommendations
        recommendations.combinations = [
            {
                flooring: 'hardwood_oak_natural',
                backsplash: 'subway_white_classic',
                style: 'Classic Traditional',
                popularity: 'high'
            },
            {
                flooring: 'tile_marble_carrara',
                backsplash: 'mosaic_glass_azure',
                style: 'Modern Luxury',
                popularity: 'medium'
            }
        ];

        return recommendations;
    }

    async calculateMaterialPricing(surfaceAnalysis, flooringId, backsplashId) {
        const pricing = {
            flooring: null,
            backsplash: null,
            total: 0,
            breakdown: {}
        };

        // Calculate flooring costs
        if (flooringId && surfaceAnalysis.floor) {
            const material = this.getMaterialDetails(flooringId, 'flooring');
            const area = surfaceAnalysis.floor.area;
            
            pricing.flooring = {
                material: material.name,
                pricePerSqFt: material.price,
                area: area,
                subtotal: area * material.price,
                installation: area * 4.50, // Installation cost per sq ft
                total: (area * material.price) + (area * 4.50)
            };

            pricing.breakdown['Flooring Material'] = pricing.flooring.subtotal;
            pricing.breakdown['Flooring Installation'] = pricing.flooring.installation;
            pricing.total += pricing.flooring.total;
        }

        // Calculate backsplash costs
        if (backsplashId && surfaceAnalysis.backsplash && surfaceAnalysis.backsplash.detected) {
            const material = this.getMaterialDetails(backsplashId, 'backsplash');
            const area = surfaceAnalysis.backsplash.area;
            
            pricing.backsplash = {
                material: material.name,
                pricePerSqFt: material.price,
                area: area,
                subtotal: area * material.price,
                installation: area * 8.75, // Installation cost per sq ft
                total: (area * material.price) + (area * 8.75)
            };

            pricing.breakdown['Backsplash Material'] = pricing.backsplash.subtotal;
            pricing.breakdown['Backsplash Installation'] = pricing.backsplash.installation;
            pricing.total += pricing.backsplash.total;
        }

        return pricing;
    }

    getMaterialDetails(materialId, category) {
        // Parse material ID like "hardwood_oak_natural" or "mosaic_glass_azure"
        const parts = materialId.split('_');
        if (parts.length < 2) return null;

        const type = parts[0];
        const subtype = parts.slice(1).join('_');

        return this.materialLibrary[category]?.[type]?.[subtype] || null;
    }

    /**
     * PAINT COLOR ANALYSIS
     */
    generateColorRecommendations(appliedColors, ambientColors) {
        const recommendations = {
            complementary: [],
            analogous: [],
            triadic: [],
            roomMood: {},
            accentColors: []
        };

        // Analyze each applied color
        for (const [wallId, colorHex] of Object.entries(appliedColors)) {
            const hsl = this.hexToHsl(colorHex);
            
            // Generate complementary colors
            recommendations.complementary.push({
                baseColor: colorHex,
                complement: this.hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
                use: 'accent_wall_or_trim'
            });

            // Generate analogous colors
            recommendations.analogous.push({
                baseColor: colorHex,
                analogous: [
                    this.hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l),
                    this.hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l)
                ],
                use: 'adjacent_rooms'
            });

            // Determine room mood
            recommendations.roomMood[wallId] = this.analyzeColorMood(colorHex);
        }

        return recommendations;
    }

    hexToHsl(hex) {
        const rgb = this.hexToRgb(hex);
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    hslToHex(h, s, l) {
        h = h / 360;
        s = s / 100;
        l = l / 100;

        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const r = hue2rgb(p, q, h + 1/3);
        const g = hue2rgb(p, q, h);
        const b = hue2rgb(p, q, h - 1/3);

        return this.rgbToHex({
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        });
    }

    analyzeColorMood(colorHex) {
        const hsl = this.hexToHsl(colorHex);
        
        let mood = 'neutral';
        let energy = 'medium';
        let warmth = 'neutral';

        // Analyze hue for mood
        if (hsl.h >= 0 && hsl.h < 60) { // Red-Yellow
            mood = 'energetic';
            energy = 'high';
            warmth = 'warm';
        } else if (hsl.h >= 60 && hsl.h < 120) { // Yellow-Green
            mood = 'cheerful';
            energy = 'medium-high';
            warmth = 'warm';
        } else if (hsl.h >= 120 && hsl.h < 180) { // Green-Cyan
            mood = 'calming';
            energy = 'low';
            warmth = 'cool';
        } else if (hsl.h >= 180 && hsl.h < 240) { // Cyan-Blue
            mood = 'peaceful';
            energy = 'low';
            warmth = 'cool';
        } else if (hsl.h >= 240 && hsl.h < 300) { // Blue-Magenta
            mood = 'sophisticated';
            energy = 'medium';
            warmth = 'cool';
        } else { // Magenta-Red
            mood = 'dramatic';
            energy = 'high';
            warmth = 'warm';
        }

        // Adjust for saturation and lightness
        if (hsl.s < 20) mood = 'subtle';
        if (hsl.l > 80) energy = 'light';
        if (hsl.l < 20) energy = 'intense';

        return { mood, energy, warmth, hsl };
    }

    calculatePaintRequirements(wallAnalysis, paintOptions) {
        const requirements = {
            totalArea: 0,
            paintNeeded: {},
            supplies: {},
            laborHours: 0,
            totalCost: 0
        };

        for (const [wallId, colorHex] of Object.entries(paintOptions)) {
            const wall = wallAnalysis.walls.surfaces.find(w => w.id === wallId) ||
                        wallAnalysis.walls.surfaces[0];

            const area = wall.area;
            requirements.totalArea += area;

            // Calculate paint needed (gallon covers ~350 sq ft)
            const gallonsNeeded = Math.ceil(area / 350);
            const costPerGallon = 45; // Average paint cost

            requirements.paintNeeded[wallId] = {
                color: colorHex,
                area: area,
                gallons: gallonsNeeded,
                cost: gallonsNeeded * costPerGallon
            };

            requirements.totalCost += gallonsNeeded * costPerGallon;
        }

        // Calculate supplies
        requirements.supplies = {
            primer: Math.ceil(requirements.totalArea / 400) * 35, // Primer cost
            brushes: 25,
            rollers: 15,
            dropCloths: 20,
            total: 60
        };

        requirements.totalCost += requirements.supplies.total;

        // Labor calculation (1 sq ft = ~2 minutes)
        requirements.laborHours = Math.ceil((requirements.totalArea * 2) / 60);
        requirements.laborCost = requirements.laborHours * 45; // $45/hour
        requirements.totalCost += requirements.laborCost;

        return requirements;
    }

    calculateColorContrast(color1, color2) {
        // Calculate WCAG color contrast ratio
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        
        const lum1 = this.relativeLuminance(rgb1);
        const lum2 = this.relativeLuminance(rgb2);
        
        const contrast = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
        
        return {
            ratio: Math.round(contrast * 100) / 100,
            wcagLevel: contrast >= 7 ? 'AAA' : contrast >= 4.5 ? 'AA' : 'Below AA'
        };
    }

    relativeLuminance(rgb) {
        const rsRGB = rgb.r / 255;
        const gsRGB = rgb.g / 255;
        const bsRGB = rgb.b / 255;

        const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
        const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
        const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    analyzeRoomAmbiance(paintResults, paintOptions) {
        const ambiance = {
            overall: 'neutral',
            brightness: 'medium',
            temperature: 'neutral',
            style: 'contemporary',
            recommendations: []
        };

        const colors = Object.values(paintOptions);
        let totalLightness = 0;
        let totalWarmth = 0;

        for (const color of colors) {
            const hsl = this.hexToHsl(color);
            totalLightness += hsl.l;
            
            // Calculate warmth (red-yellow vs blue-green)
            const warmth = (hsl.h >= 0 && hsl.h <= 60) || (hsl.h >= 300 && hsl.h <= 360) ? 1 :
                          (hsl.h >= 180 && hsl.h <= 240) ? -1 : 0;
            totalWarmth += warmth;
        }

        const avgLightness = totalLightness / colors.length;
        const avgWarmth = totalWarmth / colors.length;

        // Determine brightness
        ambiance.brightness = avgLightness > 70 ? 'bright' :
                             avgLightness > 40 ? 'medium' : 'dim';

        // Determine temperature
        ambiance.temperature = avgWarmth > 0.3 ? 'warm' :
                              avgWarmth < -0.3 ? 'cool' : 'neutral';

        // Determine overall ambiance
        if (ambiance.brightness === 'bright' && ambiance.temperature === 'warm') {
            ambiance.overall = 'cheerful';
        } else if (ambiance.brightness === 'bright' && ambiance.temperature === 'cool') {
            ambiance.overall = 'fresh';
        } else if (ambiance.brightness === 'dim' && ambiance.temperature === 'warm') {
            ambiance.overall = 'cozy';
        } else if (ambiance.brightness === 'dim' && ambiance.temperature === 'cool') {
            ambiance.overall = 'sophisticated';
        }

        return ambiance;
    }

    calculateMoodChange(originalColors, newColors) {
        // Calculate the mood impact of the color change
        const original = originalColors[0]; // Primary original color
        const newPrimary = Object.values(newColors)[0]; // First new color

        const originalMood = this.analyzeColorMood(original);
        const newMood = this.analyzeColorMood(newPrimary);

        return {
            from: originalMood.mood,
            to: newMood.mood,
            energyChange: this.compareEnergyLevels(originalMood.energy, newMood.energy),
            warmthChange: this.compareWarmth(originalMood.warmth, newMood.warmth),
            impact: 'significant' // Would calculate based on color distance
        };
    }

    compareEnergyLevels(from, to) {
        const levels = ['low', 'medium', 'medium-high', 'high'];
        const fromIndex = levels.indexOf(from);
        const toIndex = levels.indexOf(to);
        
        if (toIndex > fromIndex) return 'increased';
        if (toIndex < fromIndex) return 'decreased';
        return 'unchanged';
    }

    compareWarmth(from, to) {
        if (from === to) return 'unchanged';
        if (from === 'cool' && to === 'warm') return 'warmer';
        if (from === 'warm' && to === 'cool') return 'cooler';
        if (from === 'neutral') return to === 'warm' ? 'warmer' : 'cooler';
        if (to === 'neutral') return from === 'warm' ? 'cooler' : 'warmer';
        return 'unchanged';
    }

    analyzeLightingImpact(paintResults, paintOptions) {
        return {
            reflectivity: 'medium', // Based on paint colors
            naturalLightEnhancement: 'improved',
            artificialLightNeeds: 'unchanged',
            recommendations: [
                'Consider warmer LED bulbs to complement the new colors',
                'Add accent lighting to highlight texture variations'
            ]
        };
    }

    /**
     * UTILITY METHODS
     */
    async cleanup() {
        // Clear caches and cleanup resources
        this.imageCache.clear();
        this.materialCache.clear();
    }
}

module.exports = RoomVisualizerAPI;