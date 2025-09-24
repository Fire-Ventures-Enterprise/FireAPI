/**
 * FireAPI Live Camera SDK
 * JavaScript library for integrating real-time floor visualization
 * For use by client sites like flooringhause.com
 * 
 * Usage:
 * const visualizer = new FireAPILiveCameraSDK('your-api-key');
 * await visualizer.startCamera('camera-container');
 */

class FireAPILiveCameraSDK {
    constructor(apiKey, options = {}) {
        this.apiKey = apiKey;
        this.baseUrl = options.baseUrl || 'https://fireapi.dev';
        this.wsUrl = options.wsUrl || 'wss://fireapi.dev:3011';
        
        this.ws = null;
        this.sessionId = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.overlayCanvas = null;
        this.mediaStream = null;
        
        this.isStreaming = false;
        this.currentMaterial = null;
        this.materials = [];
        this.frameRate = options.frameRate || 15; // Frames per second to send
        
        this.callbacks = {
            onMaterialChange: null,
            onFloorDetected: null,
            onError: null,
            onCostUpdate: null
        };
        
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / this.frameRate;
    }

    /**
     * Initialize and start camera with live floor visualization
     */
    async startCamera(containerId, options = {}) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`Container element ${containerId} not found`);
            }

            // Create camera interface
            this.createCameraInterface(container, options);
            
            // Get user media (camera access)
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: options.facingMode || 'environment' // Back camera on mobile
                },
                audio: false
            });

            this.videoElement.srcObject = this.mediaStream;
            
            // Connect to WebSocket
            await this.connectWebSocket();
            
            // Start processing frames
            this.startFrameProcessing();
            
            // Load materials
            await this.loadMaterials();

            return {
                success: true,
                message: 'Camera started successfully',
                sessionId: this.sessionId
            };

        } catch (error) {
            console.error('Camera start error:', error);
            this.handleError('Failed to start camera: ' + error.message);
            throw error;
        }
    }

    /**
     * Create camera interface UI
     */
    createCameraInterface(container, options) {
        container.innerHTML = `
            <div class="fireapi-camera-container" style="position: relative; width: 100%; max-width: 800px; margin: 0 auto;">
                <!-- Camera Feed -->
                <video id="fireapi-video" autoplay muted playsinline style="
                    width: 100%; 
                    height: auto; 
                    background: #000;
                    border-radius: 8px;
                "></video>
                
                <!-- Overlay Canvas for AR Effects -->
                <canvas id="fireapi-overlay" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    border-radius: 8px;
                "></canvas>
                
                <!-- Material Selector -->
                <div class="material-selector" style="
                    position: absolute;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(255,255,255,0.95);
                    padding: 15px;
                    border-radius: 25px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    max-width: 90%;
                    overflow-x: auto;
                ">
                    <div id="fireapi-materials" style="
                        display: flex;
                        gap: 10px;
                        align-items: center;
                    ">
                        <div style="color: #666; font-size: 14px; white-space: nowrap;">
                            Loading materials...
                        </div>
                    </div>
                </div>
                
                <!-- Instructions Overlay -->
                <div id="fireapi-instructions" style="
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    right: 20px;
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 15px;
                    border-radius: 8px;
                    font-size: 14px;
                    text-align: center;
                ">
                    📱 Point your camera at the floor to see material previews
                </div>
                
                <!-- Cost Display -->
                <div id="fireapi-cost" style="
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(46, 125, 50, 0.95);
                    color: white;
                    padding: 10px 15px;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 14px;
                    display: none;
                ">
                    <div id="cost-amount">$0.00</div>
                    <div style="font-size: 11px; opacity: 0.9;">estimated</div>
                </div>
            </div>
            
            <style>
                .material-tile {
                    width: 60px;
                    height: 60px;
                    border-radius: 8px;
                    border: 2px solid transparent;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    text-align: center;
                    transition: all 0.3s ease;
                    background-size: cover;
                    background-position: center;
                    color: white;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.7);
                }
                
                .material-tile:hover {
                    transform: scale(1.1);
                    border-color: #2196F3;
                }
                
                .material-tile.selected {
                    border-color: #4CAF50;
                    box-shadow: 0 0 10px rgba(76,175,80,0.5);
                }
                
                .fireapi-camera-container {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                @media (max-width: 768px) {
                    .material-selector {
                        bottom: 10px;
                        left: 10px;
                        right: 10px;
                        transform: none;
                    }
                    
                    #fireapi-instructions {
                        font-size: 12px;
                        padding: 10px;
                    }
                }
            </style>
        `;

        this.videoElement = document.getElementById('fireapi-video');
        this.overlayCanvas = document.getElementById('fireapi-overlay');
        this.overlayCtx = this.overlayCanvas.getContext('2d');
        
        // Update canvas size when video loads
        this.videoElement.addEventListener('loadedmetadata', () => {
            this.overlayCanvas.width = this.videoElement.videoWidth;
            this.overlayCanvas.height = this.videoElement.videoHeight;
        });
    }

    /**
     * Connect to WebSocket server
     */
    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl, [], {
                headers: {
                    'X-API-Key': this.apiKey,
                    'Origin': window.location.origin
                }
            });

            this.ws.onopen = () => {
                console.log('🔴 Connected to FireAPI Live Camera service');
                resolve();
            };

            this.ws.onmessage = (event) => {
                this.handleWebSocketMessage(JSON.parse(event.data));
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            };

            this.ws.onclose = () => {
                console.log('📴 Disconnected from FireAPI service');
                this.isStreaming = false;
            };
        });
    }

    /**
     * Handle messages from WebSocket server
     */
    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'session_started':
                this.sessionId = data.sessionId;
                document.getElementById('fireapi-instructions').innerHTML = 
                    '🎯 Session started! Select a material and point camera at floor';
                break;

            case 'processed_frame':
                this.displayProcessedFrame(data);
                this.updateCostDisplay(data.floorInfo.costEstimate);
                break;

            case 'frame_analysis':
                this.updateInstructions(data.message);
                break;

            case 'material_selected':
                this.currentMaterial = data.material;
                this.updateMaterialSelection(data.material.id);
                if (this.callbacks.onMaterialChange) {
                    this.callbacks.onMaterialChange(data.material);
                }
                break;

            case 'material_catalog':
                this.materials = data.materials;
                this.renderMaterialSelector();
                break;

            case 'error':
                this.handleError(data.message);
                break;
        }
    }

    /**
     * Start processing camera frames
     */
    startFrameProcessing() {
        this.isStreaming = true;
        
        const processFrame = () => {
            if (!this.isStreaming || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
                return;
            }

            const now = Date.now();
            if (now - this.lastFrameTime < this.frameInterval) {
                requestAnimationFrame(processFrame);
                return;
            }

            this.lastFrameTime = now;
            
            // Capture frame from video
            if (this.videoElement && this.videoElement.videoWidth > 0) {
                const canvas = document.createElement('canvas');
                canvas.width = this.videoElement.videoWidth;
                canvas.height = this.videoElement.videoHeight;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(this.videoElement, 0, 0);
                
                // Convert to base64 and send
                const frameData = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
                
                this.ws.send(JSON.stringify({
                    type: 'camera_frame',
                    imageData: frameData,
                    timestamp: now
                }));
            }

            requestAnimationFrame(processFrame);
        };

        requestAnimationFrame(processFrame);
    }

    /**
     * Load available materials from API
     */
    async loadMaterials(category = null) {
        try {
            const url = new URL(`${this.baseUrl}/api/visualizer/materials/live`);
            if (category) url.searchParams.set('category', category);
            url.searchParams.set('inStock', 'true');

            const response = await fetch(url, {
                headers: {
                    'X-API-Key': this.apiKey,
                    'Origin': window.location.origin
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load materials');
            }

            const data = await response.json();
            this.materials = data.materials;
            this.renderMaterialSelector();

        } catch (error) {
            console.error('Material loading error:', error);
            this.handleError('Failed to load materials');
        }
    }

    /**
     * Render material selector UI
     */
    renderMaterialSelector() {
        const container = document.getElementById('fireapi-materials');
        if (!container || !this.materials.length) return;

        container.innerHTML = this.materials.map(material => `
            <div class="material-tile" 
                 data-material-id="${material.id}"
                 style="background: linear-gradient(45deg, ${material.color}, ${this.adjustBrightness(material.color, -20)});"
                 onclick="window.fireAPIInstance.selectMaterial('${material.id}')"
                 title="${material.name} - $${material.price}/sq ft">
                <div style="font-weight: bold; font-size: 9px;">
                    ${material.name.split(' ').slice(0, 2).join(' ')}
                </div>
                <div style="font-size: 8px; margin-top: 2px;">
                    $${material.price}/ft²
                </div>
            </div>
        `).join('');

        // Store reference for onclick handlers
        window.fireAPIInstance = this;
    }

    /**
     * Select a material for preview
     */
    selectMaterial(materialId) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const material = this.materials.find(m => m.id === materialId);
        if (!material) return;

        this.ws.send(JSON.stringify({
            type: 'select_material',
            material: material
        }));

        // Update UI immediately
        this.updateMaterialSelection(materialId);
    }

    /**
     * Update material selection in UI
     */
    updateMaterialSelection(materialId) {
        document.querySelectorAll('.material-tile').forEach(tile => {
            tile.classList.remove('selected');
            if (tile.dataset.materialId === materialId) {
                tile.classList.add('selected');
            }
        });
    }

    /**
     * Display processed frame with material overlay
     */
    displayProcessedFrame(data) {
        if (data.imageData && this.overlayCanvas) {
            const img = new Image();
            img.onload = () => {
                this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
                this.overlayCtx.globalAlpha = 0.7;
                this.overlayCtx.drawImage(img, 0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
                this.overlayCtx.globalAlpha = 1.0;
            };
            img.src = 'data:image/jpeg;base64,' + data.imageData;
        }

        if (this.callbacks.onFloorDetected) {
            this.callbacks.onFloorDetected(data.floorInfo);
        }
    }

    /**
     * Update cost display
     */
    updateCostDisplay(costEstimate) {
        const costElement = document.getElementById('fireapi-cost');
        const amountElement = document.getElementById('cost-amount');
        
        if (costEstimate && costEstimate.totalCost > 0) {
            amountElement.textContent = `$${costEstimate.totalCost.toLocaleString()}`;
            costElement.style.display = 'block';
            
            if (this.callbacks.onCostUpdate) {
                this.callbacks.onCostUpdate(costEstimate);
            }
        } else {
            costElement.style.display = 'none';
        }
    }

    /**
     * Update instructions display
     */
    updateInstructions(message) {
        const instructions = document.getElementById('fireapi-instructions');
        if (instructions) {
            instructions.innerHTML = `📱 ${message}`;
        }
    }

    /**
     * Handle errors
     */
    handleError(message) {
        console.error('FireAPI Error:', message);
        this.updateInstructions(`❌ ${message}`);
        
        if (this.callbacks.onError) {
            this.callbacks.onError(message);
        }
    }

    /**
     * Set callback functions
     */
    on(event, callback) {
        if (this.callbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase() + event.slice(1)}`)) {
            this.callbacks[`on${event.charAt(0).toUpperCase() + event.slice(1)}`] = callback;
        }
    }

    /**
     * Stop camera and clean up
     */
    stop() {
        this.isStreaming = false;
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.ws) {
            this.ws.close();
        }
        
        if (window.fireAPIInstance === this) {
            delete window.fireAPIInstance;
        }
    }

    /**
     * Utility: Adjust color brightness
     */
    adjustBrightness(hex, percent) {
        const num = parseInt(hex.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FireAPILiveCameraSDK;
} else if (typeof define === 'function' && define.amd) {
    define(() => FireAPILiveCameraSDK);
} else {
    window.FireAPILiveCameraSDK = FireAPILiveCameraSDK;
}

/**
 * Usage Examples:
 * 
 * // Basic usage
 * const visualizer = new FireAPILiveCameraSDK('your-api-key');
 * await visualizer.startCamera('camera-container');
 * 
 * // With callbacks
 * visualizer.on('materialChange', (material) => {
 *     console.log('Selected:', material.name);
 * });
 * 
 * visualizer.on('costUpdate', (cost) => {
 *     console.log('Estimated cost:', cost.totalCost);
 * });
 * 
 * // Stop camera
 * visualizer.stop();
 */