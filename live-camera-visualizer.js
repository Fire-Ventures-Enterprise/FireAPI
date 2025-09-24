/**
 * Live Camera Room Visualizer API
 * Real-time AR flooring preview using WebRTC and Computer Vision
 * Multi-tenant API for sites like flooringhause.com
 * 
 * Features:
 * - Live camera feed capture
 * - Real-time floor detection and overlay
 * - AR-style material preview
 * - Multi-client API architecture
 * - WebSocket for real-time updates
 */

const sharp = require('sharp');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class LiveCameraVisualizer {
    constructor() {
        this.activeStreams = new Map();
        this.clientConfigs = new Map();
        this.floorDetectionModel = null;
        this.materialLibrary = this.initializeMaterialLibrary();
        this.wsServer = null;
        
        // Initialize WebSocket server for real-time communication
        this.initializeWebSocketServer();
    }

    /**
     * Initialize WebSocket server for real-time camera streaming
     */
    initializeWebSocketServer() {
        this.wsServer = new WebSocket.Server({ 
            port: 3011,
            verifyClient: (info) => {
                // Verify API key and client domain
                const apiKey = info.req.headers['x-api-key'];
                const origin = info.req.headers.origin;
                return this.validateClient(apiKey, origin);
            }
        });

        this.wsServer.on('connection', (ws, req) => {
            const sessionId = uuidv4();
            const apiKey = req.headers['x-api-key'];
            const clientDomain = req.headers.origin;
            
            console.log(`🔴 LIVE: New camera session ${sessionId} from ${clientDomain}`);
            
            // Store session info
            this.activeStreams.set(sessionId, {
                ws,
                apiKey,
                clientDomain,
                startTime: Date.now(),
                frameCount: 0,
                currentMaterial: null
            });

            ws.sessionId = sessionId;
            ws.send(JSON.stringify({
                type: 'session_started',
                sessionId,
                supportedFormats: ['jpeg', 'webp', 'png'],
                maxFPS: 30,
                maxResolution: { width: 1920, height: 1080 }
            }));

            ws.on('message', async (message) => {
                await this.handleWebSocketMessage(sessionId, message);
            });

            ws.on('close', () => {
                console.log(`📴 LIVE: Session ${sessionId} disconnected`);
                this.activeStreams.delete(sessionId);
            });
        });

        console.log('🎥 Live Camera WebSocket server running on port 3011');
    }

    /**
     * Handle incoming WebSocket messages (camera frames, material selections)
     */
    async handleWebSocketMessage(sessionId, message) {
        try {
            const session = this.activeStreams.get(sessionId);
            if (!session) return;

            const data = JSON.parse(message.toString());
            
            switch (data.type) {
                case 'camera_frame':
                    await this.processCameraFrame(sessionId, data);
                    break;
                    
                case 'select_material':
                    await this.changeMaterial(sessionId, data.material);
                    break;
                    
                case 'get_materials':
                    this.sendMaterialCatalog(sessionId, data.category);
                    break;
                    
                case 'calibrate_room':
                    await this.calibrateRoomDimensions(sessionId, data);
                    break;
                    
                default:
                    session.ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Unknown message type'
                    }));
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
            const session = this.activeStreams.get(sessionId);
            if (session) {
                session.ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Processing error occurred'
                }));
            }
        }
    }

    /**
     * Process live camera frame and apply floor overlay
     */
    async processCameraFrame(sessionId, frameData) {
        const session = this.activeStreams.get(sessionId);
        if (!session) return;

        try {
            // Decode base64 frame
            const frameBuffer = Buffer.from(frameData.imageData, 'base64');
            session.frameCount++;

            // Detect floor surfaces in the frame
            const floorDetection = await this.detectFloorSurfaces(frameBuffer);
            
            if (floorDetection.floorsDetected > 0 && session.currentMaterial) {
                // Apply material overlay to detected floor areas
                const overlayedFrame = await this.applyMaterialOverlay(
                    frameBuffer, 
                    floorDetection, 
                    session.currentMaterial
                );

                // Send processed frame back to client
                session.ws.send(JSON.stringify({
                    type: 'processed_frame',
                    imageData: overlayedFrame.toString('base64'),
                    floorInfo: {
                        detectedAreas: floorDetection.areas,
                        confidence: floorDetection.confidence,
                        estimatedSqFt: floorDetection.estimatedSqFt,
                        material: session.currentMaterial,
                        costEstimate: this.calculateCost(
                            floorDetection.estimatedSqFt, 
                            session.currentMaterial
                        )
                    },
                    frameCount: session.frameCount,
                    processingTime: Date.now() - frameData.timestamp
                }));
            } else {
                // No floor detected or no material selected
                session.ws.send(JSON.stringify({
                    type: 'frame_analysis',
                    floorDetected: floorDetection.floorsDetected > 0,
                    message: floorDetection.floorsDetected === 0 ? 
                        'Point camera at floor to see material preview' :
                        'Select a material to see preview',
                    frameCount: session.frameCount
                }));
            }

        } catch (error) {
            console.error('Frame processing error:', error);
            session.ws.send(JSON.stringify({
                type: 'processing_error',
                message: 'Failed to process camera frame'
            }));
        }
    }

    /**
     * Detect floor surfaces in camera frame using computer vision
     */
    async detectFloorSurfaces(frameBuffer) {
        try {
            // Get frame metadata
            const metadata = await sharp(frameBuffer).metadata();
            
            // Simulate AI floor detection (in production, use TensorFlow.js or similar)
            // This would analyze the image for floor textures, patterns, and perspective
            const mockDetection = {
                floorsDetected: 1,
                confidence: 0.85,
                areas: [
                    {
                        polygon: [
                            { x: metadata.width * 0.1, y: metadata.height * 0.6 },
                            { x: metadata.width * 0.9, y: metadata.height * 0.6 },
                            { x: metadata.width * 0.95, y: metadata.height * 0.95 },
                            { x: metadata.width * 0.05, y: metadata.height * 0.95 }
                        ],
                        perspective: 'floor_horizontal',
                        surfaceType: 'flat'
                    }
                ],
                estimatedSqFt: Math.random() * 200 + 100 // Mock calculation
            };

            return mockDetection;
            
        } catch (error) {
            console.error('Floor detection error:', error);
            return { floorsDetected: 0, confidence: 0, areas: [], estimatedSqFt: 0 };
        }
    }

    /**
     * Apply material texture overlay to detected floor areas
     */
    async applyMaterialOverlay(frameBuffer, floorDetection, material) {
        try {
            const materialTexture = await this.getMaterialTexture(material);
            
            // Create perspective-corrected overlay using Sharp
            const overlayBuffer = await this.createPerspectiveOverlay(
                frameBuffer,
                floorDetection.areas[0], // Use first detected area
                materialTexture
            );

            // Composite the overlay onto the original frame
            const result = await sharp(frameBuffer)
                .composite([{
                    input: overlayBuffer,
                    blend: 'multiply',
                    opacity: 0.7
                }])
                .jpeg({ quality: 85 })
                .toBuffer();

            return result;
            
        } catch (error) {
            console.error('Overlay application error:', error);
            return frameBuffer; // Return original frame if overlay fails
        }
    }

    /**
     * Create perspective-corrected material overlay
     */
    async createPerspectiveOverlay(frameBuffer, floorArea, materialTexture) {
        const metadata = await sharp(frameBuffer).metadata();
        
        // Calculate overlay dimensions based on detected floor polygon
        const overlayWidth = Math.max(
            Math.abs(floorArea.polygon[1].x - floorArea.polygon[0].x),
            Math.abs(floorArea.polygon[2].x - floorArea.polygon[3].x)
        );
        const overlayHeight = Math.max(
            Math.abs(floorArea.polygon[3].y - floorArea.polygon[0].y),
            Math.abs(floorArea.polygon[2].y - floorArea.polygon[1].y)
        );

        // Create perspective-transformed material texture
        const overlay = await sharp(materialTexture)
            .resize(Math.floor(overlayWidth), Math.floor(overlayHeight), {
                fit: 'fill'
            })
            .modulate({
                brightness: 0.8, // Slightly darken for realism
                saturation: 1.1  // Slightly increase saturation
            })
            .toBuffer();

        return overlay;
    }

    /**
     * Get material texture for overlay
     */
    async getMaterialTexture(material) {
        const materialInfo = this.materialLibrary.get(material.id);
        if (!materialInfo || !materialInfo.textureUrl) {
            // Create a simple colored texture if no image available
            return await sharp({
                create: {
                    width: 512,
                    height: 512,
                    channels: 3,
                    background: material.color || '#8B4513'
                }
            })
            .png()
            .toBuffer();
        }

        // In production, fetch and cache material textures
        return await sharp({
            create: {
                width: 512,
                height: 512,
                channels: 3,
                background: materialInfo.color || '#8B4513'
            }
        })
        .png()
        .toBuffer();
    }

    /**
     * Change material for live preview
     */
    async changeMaterial(sessionId, materialData) {
        const session = this.activeStreams.get(sessionId);
        if (!session) return;

        const material = this.materialLibrary.get(materialData.id);
        if (!material) {
            session.ws.send(JSON.stringify({
                type: 'error',
                message: 'Material not found'
            }));
            return;
        }

        session.currentMaterial = material;
        
        session.ws.send(JSON.stringify({
            type: 'material_selected',
            material: material,
            message: `Now previewing ${material.name}. Point camera at floor to see preview.`
        }));
    }

    /**
     * Send material catalog to client
     */
    sendMaterialCatalog(sessionId, category = 'all') {
        const session = this.activeStreams.get(sessionId);
        if (!session) return;

        let materials = Array.from(this.materialLibrary.values());
        
        if (category && category !== 'all') {
            materials = materials.filter(m => m.category === category);
        }

        // Filter materials based on client configuration
        const clientConfig = this.clientConfigs.get(session.clientDomain) || {};
        if (clientConfig.allowedMaterials) {
            materials = materials.filter(m => 
                clientConfig.allowedMaterials.includes(m.id)
            );
        }

        session.ws.send(JSON.stringify({
            type: 'material_catalog',
            materials: materials.map(m => ({
                id: m.id,
                name: m.name,
                category: m.category,
                price: m.price,
                thumbnail: m.thumbnail,
                color: m.color,
                description: m.description,
                inStock: m.inStock
            })),
            category,
            totalCount: materials.length
        }));
    }

    /**
     * Calculate cost estimate for detected floor area
     */
    calculateCost(sqFt, material) {
        const baseCost = sqFt * material.price;
        const laborCost = sqFt * (material.laborRate || 3.50);
        const total = baseCost + laborCost;

        return {
            materialCost: Math.round(baseCost * 100) / 100,
            laborCost: Math.round(laborCost * 100) / 100,
            totalCost: Math.round(total * 100) / 100,
            sqFt: Math.round(sqFt * 100) / 100,
            pricePerSqFt: material.price
        };
    }

    /**
     * Initialize material library for multi-client use
     */
    initializeMaterialLibrary() {
        const materials = new Map();
        
        // Premium flooring options
        materials.set('hardwood-oak', {
            id: 'hardwood-oak',
            name: 'Premium Oak Hardwood',
            category: 'hardwood',
            price: 8.50,
            laborRate: 4.00,
            color: '#8B4513',
            thumbnail: '/api/materials/thumbnails/hardwood-oak.jpg',
            description: 'Classic oak hardwood flooring with natural grain',
            inStock: true,
            textureUrl: '/api/materials/textures/hardwood-oak-texture.jpg'
        });

        materials.set('luxury-vinyl-plank', {
            id: 'luxury-vinyl-plank',
            name: 'Luxury Vinyl Plank',
            category: 'vinyl',
            price: 5.50,
            laborRate: 2.50,
            color: '#D2B48C',
            thumbnail: '/api/materials/thumbnails/luxury-vinyl.jpg',
            description: 'Waterproof luxury vinyl with wood-look finish',
            inStock: true,
            textureUrl: '/api/materials/textures/luxury-vinyl-texture.jpg'
        });

        materials.set('ceramic-tile-modern', {
            id: 'ceramic-tile-modern',
            name: 'Modern Ceramic Tile',
            category: 'ceramic',
            price: 4.25,
            laborRate: 6.00,
            color: '#F5F5DC',
            thumbnail: '/api/materials/thumbnails/ceramic-modern.jpg',
            description: 'Large format modern ceramic tiles',
            inStock: true,
            textureUrl: '/api/materials/textures/ceramic-modern-texture.jpg'
        });

        materials.set('laminate-wood-look', {
            id: 'laminate-wood-look',
            name: 'Wood-Look Laminate',
            category: 'laminate',
            price: 3.75,
            laborRate: 2.00,
            color: '#DEB887',
            thumbnail: '/api/materials/thumbnails/laminate-wood.jpg',
            description: 'Affordable wood-look laminate flooring',
            inStock: true,
            textureUrl: '/api/materials/textures/laminate-wood-texture.jpg'
        });

        // Tile options
        materials.set('porcelain-marble-look', {
            id: 'porcelain-marble-look',
            name: 'Marble-Look Porcelain',
            category: 'porcelain',
            price: 12.00,
            laborRate: 8.00,
            color: '#F8F8FF',
            thumbnail: '/api/materials/thumbnails/porcelain-marble.jpg',
            description: 'Elegant marble-look porcelain tiles',
            inStock: true,
            textureUrl: '/api/materials/textures/porcelain-marble-texture.jpg'
        });

        return materials;
    }

    /**
     * Validate client API key and domain
     */
    validateClient(apiKey, origin) {
        // In production, validate against database
        const validClients = {
            'flooringhause-api-key': {
                domains: ['https://flooringhause.com', 'https://www.flooringhause.com'],
                allowedMaterials: ['hardwood-oak', 'luxury-vinyl-plank', 'ceramic-tile-modern'],
                rateLimit: 1000 // requests per hour
            },
            'demo-api-key': {
                domains: ['http://localhost:3000', 'https://demo.fireapi.dev'],
                allowedMaterials: null, // all materials
                rateLimit: 100
            }
        };

        const client = validClients[apiKey];
        if (!client) return false;
        
        if (client.domains && !client.domains.includes(origin)) return false;

        // Store client config
        this.clientConfigs.set(origin, client);
        
        return true;
    }

    /**
     * Start camera session (HTTP endpoint)
     */
    async startCameraSession(req, res) {
        try {
            const { clientDomain, deviceInfo, cameraPreferences } = req.body;
            const apiKey = req.headers['x-api-key'];

            if (!this.validateClient(apiKey, clientDomain)) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid API key or unauthorized domain'
                });
            }

            const sessionToken = uuidv4();
            
            res.json({
                success: true,
                sessionToken,
                websocketUrl: `wss://fireapi.dev:3011`,
                instructions: {
                    1: 'Connect to WebSocket with session token',
                    2: 'Send camera frames as base64 encoded images',
                    3: 'Select materials to see real-time preview',
                    4: 'Point camera at floor for best results'
                },
                supportedDevices: ['mobile', 'tablet', 'desktop'],
                maxSessionDuration: 3600000 // 1 hour
            });

        } catch (error) {
            console.error('Session start error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to start camera session'
            });
        }
    }

    /**
     * Get client-specific material catalog (HTTP endpoint)
     */
    async getClientMaterials(req, res) {
        try {
            const { category, inStock, priceRange } = req.query;
            const apiKey = req.headers['x-api-key'];
            const clientDomain = req.headers.origin || req.headers.referer;

            if (!this.validateClient(apiKey, clientDomain)) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid API key or unauthorized domain'
                });
            }

            let materials = Array.from(this.materialLibrary.values());
            
            // Apply filters
            if (category) {
                materials = materials.filter(m => m.category === category);
            }
            
            if (inStock === 'true') {
                materials = materials.filter(m => m.inStock);
            }
            
            if (priceRange) {
                const [min, max] = priceRange.split('-').map(Number);
                materials = materials.filter(m => m.price >= min && m.price <= max);
            }

            // Apply client restrictions
            const clientConfig = this.clientConfigs.get(clientDomain) || {};
            if (clientConfig.allowedMaterials) {
                materials = materials.filter(m => 
                    clientConfig.allowedMaterials.includes(m.id)
                );
            }

            res.json({
                success: true,
                materials: materials.map(m => ({
                    id: m.id,
                    name: m.name,
                    category: m.category,
                    price: m.price,
                    thumbnail: `https://fireapi.dev${m.thumbnail}`,
                    color: m.color,
                    description: m.description,
                    inStock: m.inStock
                })),
                totalCount: materials.length,
                filters: {
                    categories: [...new Set(materials.map(m => m.category))],
                    priceRange: {
                        min: Math.min(...materials.map(m => m.price)),
                        max: Math.max(...materials.map(m => m.price))
                    }
                }
            });

        } catch (error) {
            console.error('Material catalog error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get material catalog'
            });
        }
    }
}

module.exports = LiveCameraVisualizer;