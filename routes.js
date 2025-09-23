/**
 * FireBuildAI API Routes Handler
 * Defines all RESTful endpoints and routing logic for the construction management platform
 */

const FireBuildAIServer = require('./server.js');
const SEOAPIService = require('./seo-api.js');
const RoomVisualizerAPI = require('./room-visualizer-api.js');
const ImageUploadHandler = require('./image-upload-handler.js');

class APIRoutes {
    constructor() {
        this.server = new FireBuildAIServer();
        this.seoService = new SEOAPIService();
        this.visualizerService = new RoomVisualizerAPI();
        this.imageHandler = new ImageUploadHandler();
        this.endpoints = this.defineEndpoints();
    }

    async initialize() {
        return await this.server.initialize();
    }

    /**
     * Define all available API endpoints with their specifications
     */
    defineEndpoints() {
        return {
            // Project Analysis Endpoints
            'POST /api/projects/analyze': {
                description: 'Analyze construction project description using AI',
                parameters: {
                    required: ['description'],
                    optional: ['projectDetails', 'options'],
                    example: {
                        description: "Build a 500 sq ft home addition with kitchen and bathroom @$150/sqft",
                        projectDetails: {
                            location: "Toronto, ON",
                            timeline: "6 months",
                            budget: 75000
                        },
                        options: {
                            includeCompliance: true,
                            includeRisks: true
                        }
                    }
                },
                response: {
                    projectId: 'string',
                    analysis: 'object',
                    recommendations: 'array',
                    nextSteps: 'array'
                }
            },

            'POST /api/projects/complete-analysis': {
                description: 'Perform comprehensive project analysis including workflow and costs',
                parameters: {
                    required: ['description'],
                    optional: ['region', 'options'],
                    example: {
                        description: "Renovate kitchen with new cabinets, countertops, appliances @$80/sqft for 200 sqft",
                        region: "toronto",
                        options: {
                            includeOptimizations: true
                        }
                    }
                },
                response: {
                    projectId: 'string',
                    analysis: 'object',
                    workflow: 'object',
                    costs: 'object',
                    insights: 'object'
                }
            },

            // Workflow Generation Endpoints
            'POST /api/workflows/generate': {
                description: 'Generate construction workflow with task dependencies and scheduling',
                parameters: {
                    required: ['projectType'],
                    optional: ['projectDetails', 'region', 'options'],
                    example: {
                        projectType: "home_addition",
                        projectDetails: {
                            size: 500,
                            complexity: "medium",
                            features: ["kitchen", "bathroom"]
                        },
                        region: "toronto",
                        options: {
                            includeCriticalPath: true,
                            optimizeParallelTasks: true
                        }
                    }
                },
                response: {
                    workflow: 'object',
                    summary: 'object',
                    optimizations: 'array'
                }
            },

            'GET /api/workflows/templates': {
                description: 'Get available workflow templates for different project types',
                parameters: {
                    optional: ['projectType'],
                    example: {
                        projectType: "kitchen_renovation"
                    }
                },
                response: {
                    templates: 'array'
                }
            },

            // Cost Estimation Endpoints
            'POST /api/costs/estimate': {
                description: 'Calculate detailed cost estimates with regional pricing adjustments',
                parameters: {
                    required: ['projectType'],
                    optional: ['tasks', 'region', 'materials', 'options'],
                    example: {
                        projectType: "bathroom_renovation",
                        region: "toronto",
                        tasks: [
                            { name: "Demolition", duration: 2 },
                            { name: "Plumbing rough-in", duration: 3 }
                        ],
                        materials: [
                            { name: "Tile", quantity: 100, unit: "sqft" }
                        ],
                        options: {
                            includeContingency: true,
                            marketConditions: "normal"
                        }
                    }
                },
                response: {
                    estimate: 'object',
                    breakdown: 'object',
                    regionalFactors: 'object',
                    recommendations: 'array'
                }
            },

            'GET /api/costs/regions': {
                description: 'Get available regions and their pricing multipliers',
                parameters: {
                    optional: ['detailed'],
                    example: {
                        detailed: "true"
                    }
                },
                response: {
                    regions: 'array'
                }
            },

            // SEO API Suite - Custom SEO monitoring and analysis
            'POST /api/seo/rankings': {
                description: 'Track Google SERP keyword rankings with competitor analysis',
                parameters: {
                    required: ['domain', 'keywords'],
                    optional: ['location', 'options'],
                    example: {
                        domain: "flooringhause.com",
                        keywords: ["flooring toronto", "hardwood installation", "tile contractor"],
                        location: "canada",
                        options: {
                            trackCompetitors: true,
                            includeSearchVolume: true
                        }
                    }
                },
                response: {
                    success: 'boolean',
                    domain: 'string',
                    totalKeywords: 'number',
                    tracked: 'number',
                    results: 'array',
                    summary: 'object',
                    historical: 'object'
                }
            },

            'POST /api/seo/competitors': {
                description: 'Comprehensive competitor website analysis and monitoring',
                parameters: {
                    required: ['targetDomain', 'competitorDomains'],
                    optional: ['options'],
                    example: {
                        targetDomain: "yoursite.com",
                        competitorDomains: ["competitor1.com", "competitor2.com", "competitor3.com"],
                        options: {
                            includeContent: true,
                            includeTechnical: true,
                            includePerformance: true
                        }
                    }
                },
                response: {
                    success: 'boolean',
                    targetDomain: 'string',
                    competitorCount: 'number',
                    results: 'array',
                    comparative: 'object'
                }
            },

            'POST /api/seo/backlinks': {
                description: 'Monitor backlinks and referring domains with quality analysis',
                parameters: {
                    required: ['domain'],
                    optional: ['options'],
                    example: {
                        domain: "yoursite.com",
                        options: {
                            includeNewLinks: true,
                            qualityThreshold: 30,
                            trackLostLinks: true
                        }
                    }
                },
                response: {
                    success: 'boolean',
                    domain: 'string',
                    totalBacklinks: 'number',
                    referringDomains: 'number',
                    qualityScore: 'number',
                    backlinks: 'array',
                    newBacklinks: 'array',
                    opportunities: 'array'
                }
            },

            'POST /api/seo/audit': {
                description: 'Complete technical SEO audit with recommendations',
                parameters: {
                    required: ['domain'],
                    optional: ['options'],
                    example: {
                        domain: "yoursite.com",
                        options: {
                            includePerformance: true,
                            includeMobile: true,
                            includeAccessibility: true
                        }
                    }
                },
                response: {
                    success: 'boolean',
                    domain: 'string',
                    overallScore: 'number',
                    crawlability: 'object',
                    performance: 'object',
                    mobileOptimization: 'object',
                    security: 'object',
                    recommendations: 'array'
                }
            },

            'GET /api/seo/integration': {
                description: 'Get Lovable integration code and examples',
                parameters: {
                    optional: ['framework'],
                    example: {
                        framework: "react"
                    }
                },
                response: {
                    integrationCode: 'object',
                    examples: 'object',
                    documentation: 'string'
                }
            },

            // Room Visualizer API Suite - Revolutionary material preview and room transformation
            'POST /api/visualizer/flooring-backsplash': {
                description: 'Transform room images with realistic flooring and backsplash materials',
                parameters: {
                    required: ['imageUrl'],
                    optional: ['flooring', 'backsplash', 'options'],
                    example: {
                        imageUrl: "https://example.com/kitchen.jpg",
                        flooring: "hardwood_oak_natural",
                        backsplash: "mosaic_glass_azure",
                        options: {
                            includeRecommendations: true,
                            includePricing: true,
                            realism: "high"
                        }
                    }
                },
                response: {
                    success: 'boolean',
                    processedImage: 'object',
                    surfaceAnalysis: 'object',
                    appliedMaterials: 'object',
                    recommendations: 'object',
                    pricing: 'object',
                    roomDimensions: 'object'
                }
            },

            'POST /api/visualizer/paint-colors': {
                description: 'Transform room walls with realistic paint color visualization',
                parameters: {
                    required: ['imageUrl', 'paintOptions'],
                    optional: ['options'],
                    example: {
                        imageUrl: "https://example.com/living-room.jpg",
                        paintOptions: {
                            "wall_main": "#3498DB",
                            "wall_accent": "#E74C3C"
                        },
                        options: {
                            includeColorHarmony: true,
                            includeMoodAnalysis: true,
                            includePaintCalc: true
                        }
                    }
                },
                response: {
                    success: 'boolean',
                    processedImage: 'object',
                    wallAnalysis: 'object',
                    appliedColors: 'object',
                    colorRecommendations: 'object',
                    paintCalculations: 'object',
                    roomAmbiance: 'object'
                }
            },

            'GET /api/visualizer/materials': {
                description: 'Get available flooring, backsplash, and paint materials catalog',
                parameters: {
                    optional: ['category', 'brand', 'priceRange'],
                    example: {
                        category: "flooring",
                        brand: "Premium Hardwood Co.",
                        priceRange: "5-15"
                    }
                },
                response: {
                    materials: 'object',
                    categories: 'array',
                    brands: 'array',
                    priceRanges: 'object'
                }
            },

            'POST /api/visualizer/upload-image': {
                description: 'Upload room image for visualization with validation and preprocessing',
                parameters: {
                    required: ['image'],
                    optional: ['options'],
                    example: {
                        image: "multipart/form-data file upload",
                        options: {
                            generateThumbnail: true,
                            analyzeImage: true
                        }
                    }
                },
                response: {
                    success: 'boolean',
                    imageId: 'string',
                    imageUrl: 'string',
                    dataUrl: 'string',
                    metadata: 'object',
                    analysis: 'object',
                    thumbnail: 'string'
                }
            },

            'GET /api/visualizer/integration': {
                description: 'Get Lovable integration components for room visualization',
                parameters: {
                    optional: ['type'],
                    example: {
                        type: "complete_visualizer"
                    }
                },
                response: {
                    components: 'object',
                    examples: 'object',
                    documentation: 'string'
                }
            },

            // Utility Endpoints
            'GET /api/health': {
                description: 'Check API health status and component availability',
                parameters: {},
                response: {
                    status: 'string',
                    version: 'string',
                    components: 'object'
                }
            }
        };
    }

    /**
     * Main request handler - routes requests to appropriate handlers
     */
    async handleRequest(method, path, body = {}, query = {}, headers = {}) {
        try {
            // Add request logging
            const requestId = this.generateRequestId();
            console.log(`🌐 [${requestId}] ${method} ${path}`);

            // Validate endpoint exists
            const endpointKey = `${method} ${path}`;
            if (!this.endpoints[endpointKey]) {
                throw new Error(`Endpoint not found: ${endpointKey}`);
            }

            // Add rate limiting check (stub for now)
            await this.checkRateLimit(headers);

            // Route to appropriate handler
            let response;
            
            // SEO API routes
            if (path.startsWith('/api/seo/')) {
                response = await this.handleSEORequest(method, path, body, query);
            } 
            // Room Visualizer API routes
            else if (path.startsWith('/api/visualizer/')) {
                response = await this.handleVisualizerRequest(method, path, body, query);
            } 
            else {
                // Construction API routes
                response = await this.server.handleRequest(method, path, body, query);
            }
            
            console.log(`✅ [${requestId}] Request completed successfully`);
            return {
                ...response,
                requestId
            };

        } catch (error) {
            console.error(`❌ Request failed:`, error);
            return {
                success: false,
                error: {
                    message: error.message,
                    type: error.name || 'APIError',
                    timestamp: new Date().toISOString()
                }
            };
        }
    }

    /**
     * Get API documentation for all endpoints
     */
    getDocumentation() {
        return {
            title: 'FireBuildAI Construction Management API',
            version: '1.0.0',
            description: 'AI-powered construction project analysis, workflow generation, and cost estimation',
            baseUrl: '/api',
            endpoints: this.endpoints,
            examples: this.getUsageExamples(),
            authentication: 'Not required for demo version',
            rateLimits: {
                requests: '100 per 15 minutes per IP',
                burst: '10 concurrent requests'
            }
        };
    }

    /**
     * Get usage examples for common workflows
     */
    getUsageExamples() {
        return {
            'Simple Project Analysis': {
                method: 'POST',
                endpoint: '/api/projects/analyze',
                description: 'Analyze a basic construction project description',
                request: {
                    description: "Add a 300 sqft deck to back of house @$45/sqft with railings and stairs"
                },
                expectedResponse: {
                    success: true,
                    data: {
                        projectId: "fb_1234567890_abc123def",
                        analysis: {
                            projectType: "deck_construction",
                            complexity: "medium",
                            estimatedTimeframe: "2-3 weeks",
                            keyFeatures: ["deck_framing", "railings", "stairs"]
                        }
                    }
                }
            },

            'Complete Project Analysis': {
                method: 'POST',
                endpoint: '/api/projects/complete-analysis',
                description: 'Full analysis including workflow and costs',
                request: {
                    description: "Kitchen renovation: new cabinets, quartz countertops, stainless appliances @$120/sqft for 180 sqft",
                    region: "toronto"
                },
                expectedResponse: {
                    success: true,
                    data: {
                        projectId: "fb_1234567890_xyz789abc",
                        analysis: {
                            projectType: "kitchen_renovation",
                            complexity: "medium"
                        },
                        workflow: {
                            totalTasks: 15,
                            estimatedDuration: "4-6 weeks"
                        },
                        costs: {
                            totalEstimate: 21600,
                            breakdown: {
                                materials: 12960,
                                labor: 6480,
                                permits: 500
                            }
                        }
                    }
                }
            },

            'Generate Workflow': {
                method: 'POST',
                endpoint: '/api/workflows/generate',
                description: 'Generate detailed construction workflow',
                request: {
                    projectType: "bathroom_renovation",
                    projectDetails: {
                        size: 80,
                        complexity: "high",
                        features: ["tile_work", "new_plumbing", "ventilation"]
                    },
                    options: {
                        includeCriticalPath: true
                    }
                },
                expectedResponse: {
                    success: true,
                    data: {
                        workflow: {
                            tasks: "array of task objects",
                            criticalPath: "array of critical tasks",
                            estimatedDuration: "3-4 weeks"
                        },
                        summary: {
                            totalTasks: 12,
                            parallelOpportunities: 3
                        }
                    }
                }
            },

            'Cost Estimation': {
                method: 'POST',
                endpoint: '/api/costs/estimate',
                description: 'Calculate regional cost estimates',
                request: {
                    projectType: "home_addition",
                    region: "vancouver",
                    tasks: [
                        { name: "Foundation", duration: 5 },
                        { name: "Framing", duration: 10 }
                    ]
                },
                expectedResponse: {
                    success: true,
                    data: {
                        estimate: {
                            totalCost: 85000,
                            confidence: 0.85
                        },
                        breakdown: {
                            materials: 42500,
                            labor: 34000,
                            permits: 2500,
                            contingency: 6000
                        },
                        regionalFactors: {
                            region: "vancouver",
                            multiplier: 1.25
                        }
                    }
                }
            }
        };
    }

    /**
     * Batch request handler for multiple operations
     */
    async handleBatchRequest(requests) {
        const results = [];
        const batchId = this.generateRequestId();
        
        console.log(`📦 [${batchId}] Processing batch of ${requests.length} requests`);

        for (let i = 0; i < requests.length; i++) {
            const request = requests[i];
            try {
                const result = await this.handleRequest(
                    request.method,
                    request.path,
                    request.body,
                    request.query,
                    request.headers
                );
                
                results.push({
                    index: i,
                    success: true,
                    result
                });
                
            } catch (error) {
                results.push({
                    index: i,
                    success: false,
                    error: error.message
                });
            }
        }

        console.log(`✅ [${batchId}] Batch completed: ${results.filter(r => r.success).length}/${results.length} successful`);
        
        return {
            batchId,
            totalRequests: requests.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    }

    /**
     * Handle SEO API requests
     */
    async handleSEORequest(method, path, body, query) {
        try {
            console.log(`🔍 SEO API Request: ${method} ${path}`);
            
            switch (`${method} ${path}`) {
                case 'POST /api/seo/rankings':
                    return await this.seoService.trackKeywordRankings(
                        body.domain,
                        body.keywords,
                        body.location || 'canada',
                        body.options || {}
                    );

                case 'POST /api/seo/competitors':
                    return await this.seoService.analyzeCompetitors(
                        body.targetDomain,
                        body.competitorDomains,
                        body.options || {}
                    );

                case 'POST /api/seo/backlinks':
                    return await this.seoService.monitorBacklinks(
                        body.domain,
                        body.options || {}
                    );

                case 'POST /api/seo/audit':
                    return await this.seoService.auditTechnicalSEO(
                        body.domain,
                        body.options || {}
                    );

                case 'GET /api/seo/integration':
                    return this.generateSEOIntegrationGuide(query.framework);

                default:
                    throw new Error(`SEO endpoint not implemented: ${method} ${path}`);
            }
        } catch (error) {
            console.error(`❌ SEO API Error:`, error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Handle Room Visualizer API requests
     */
    async handleVisualizerRequest(method, path, body, query) {
        try {
            console.log(`🏠 Visualizer API Request: ${method} ${path}`);
            
            switch (`${method} ${path}`) {
                case 'POST /api/visualizer/flooring-backsplash':
                    return await this.visualizerService.visualizeFlooringAndBacksplash(
                        body.imageUrl,
                        {
                            flooring: body.flooring,
                            backsplash: body.backsplash,
                            options: body.options || {}
                        }
                    );

                case 'POST /api/visualizer/paint-colors':
                    return await this.visualizerService.visualizePaintColors(
                        body.imageUrl,
                        body.paintOptions || {}
                    );

                case 'GET /api/visualizer/materials':
                    return this.generateMaterialsCatalog(query);

                case 'POST /api/visualizer/upload-image':
                    return await this.handleImageUpload(body);

                case 'GET /api/visualizer/integration':
                    return this.generateVisualizerIntegrationGuide(query.type);

                default:
                    throw new Error(`Visualizer endpoint not implemented: ${method} ${path}`);
            }
        } catch (error) {
            console.error(`❌ Visualizer API Error:`, error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Generate materials catalog for API consumption
     */
    generateMaterialsCatalog(query = {}) {
        const library = this.visualizerService.materialLibrary;
        const { category, brand, priceRange } = query;

        let materials = { ...library };

        // Filter by category
        if (category && materials[category]) {
            materials = { [category]: materials[category] };
        }

        // Filter by brand
        if (brand) {
            Object.keys(materials).forEach(cat => {
                Object.keys(materials[cat]).forEach(type => {
                    Object.keys(materials[cat][type]).forEach(item => {
                        if (materials[cat][type][item].brand !== brand) {
                            delete materials[cat][type][item];
                        }
                    });
                });
            });
        }

        // Filter by price range
        if (priceRange) {
            const [min, max] = priceRange.split('-').map(Number);
            Object.keys(materials).forEach(cat => {
                Object.keys(materials[cat]).forEach(type => {
                    Object.keys(materials[cat][type]).forEach(item => {
                        const price = materials[cat][type][item].price;
                        if (price < min || price > max) {
                            delete materials[cat][type][item];
                        }
                    });
                });
            });
        }

        // Generate summary data
        const categories = Object.keys(library);
        const brands = new Set();
        const prices = [];

        Object.values(library).forEach(category => {
            Object.values(category).forEach(type => {
                Object.values(type).forEach(material => {
                    brands.add(material.brand);
                    prices.push(material.price);
                });
            });
        });

        return {
            success: true,
            materials,
            categories,
            brands: Array.from(brands),
            priceRanges: {
                min: Math.min(...prices),
                max: Math.max(...prices),
                average: prices.reduce((a, b) => a + b, 0) / prices.length
            },
            totalMaterials: Object.values(materials).reduce((total, cat) => {
                return total + Object.values(cat).reduce((catTotal, type) => {
                    return catTotal + Object.keys(type).length;
                }, 0);
            }, 0)
        };
    }

    /**
     * Handle image upload for room visualization
     */
    async handleImageUpload(body) {
        try {
            // Handle base64 image data from body
            if (body.imageData && body.imageData.startsWith('data:image/')) {
                const base64Data = body.imageData.split(',')[1];
                const imageBuffer = Buffer.from(base64Data, 'base64');
                
                // Validate image
                const validation = await this.imageHandler.validateImage(imageBuffer);
                if (!validation.valid) {
                    return {
                        success: false,
                        errors: validation.errors,
                        warnings: validation.warnings
                    };
                }
                
                // Process the image
                const processedImage = await this.imageHandler.processUploadedImage(
                    imageBuffer,
                    body.filename || 'room-image.jpg'
                );
                
                // Generate thumbnail if requested
                let thumbnail = null;
                if (body.options?.generateThumbnail) {
                    thumbnail = await this.imageHandler.generateThumbnail(imageBuffer);
                }
                
                return {
                    success: true,
                    imageId: processedImage.id,
                    imageUrl: processedImage.url,
                    dataUrl: processedImage.dataUrl,
                    metadata: processedImage.metadata,
                    analysis: processedImage.analysis,
                    thumbnail: thumbnail ? `data:image/jpeg;base64,${thumbnail}` : null,
                    message: 'Image uploaded and processed successfully'
                };
            } else {
                return {
                    success: false,
                    error: 'No valid image data provided. Expected base64 data URL.'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Generate Lovable integration guide for Room Visualizer
     */
    generateVisualizerIntegrationGuide(type = 'complete_visualizer') {
        return {
            success: true,
            type,
            components: this.generateVisualizerComponents(),
            examples: this.generateVisualizerExamples(),
            documentation: this.generateVisualizerDocumentation()
        };
    }

    generateVisualizerComponents() {
        return {
            flooringVisualizer: `
// Flooring & Backsplash Visualizer Component for Lovable
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FlooringVisualizer = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedFlooring, setSelectedFlooring] = useState('hardwood_oak_natural');
  const [selectedBacksplash, setSelectedBacksplash] = useState('mosaic_glass_azure');
  const fileInputRef = useRef(null);

  const apiKey = process.env.NEXT_PUBLIC_FIREAPI_KEY;
  const apiBase = 'https://fireapi.dev';

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setSelectedImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const processVisualization = async () => {
    if (!selectedImage) return;

    setProcessing(true);
    try {
      const response = await fetch(\`\${apiBase}/api/visualizer/flooring-backsplash\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          imageUrl: selectedImage,
          flooring: selectedFlooring,
          backsplash: selectedBacksplash,
          options: {
            includeRecommendations: true,
            includePricing: true,
            realism: 'high'
          }
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Visualization failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">🏠 Room Visualizer - Flooring & Backsplash</h2>
      
      {/* Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle>1. Upload Room Image</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={() => fileInputRef.current?.click()}>
              📸 Select Room Photo
            </Button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              className="hidden"
            />
            {selectedImage && (
              <img 
                src={selectedImage} 
                alt="Room to visualize"
                className="w-full max-w-md h-auto rounded-lg border"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Material Selection */}
      <Card>
        <CardHeader>
          <CardTitle>2. Choose Materials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Flooring Material</label>
              <select 
                value={selectedFlooring}
                onChange={(e) => setSelectedFlooring(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="hardwood_oak_natural">Natural Oak Hardwood - $8.50/sq ft</option>
                <option value="hardwood_maple_honey">Honey Maple Hardwood - $9.25/sq ft</option>
                <option value="hardwood_walnut_dark">Dark Walnut Hardwood - $12.75/sq ft</option>
                <option value="laminate_gray_oak">Gray Oak Laminate - $3.25/sq ft</option>
                <option value="tile_marble_carrara">Carrara Marble Tile - $15.50/sq ft</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Backsplash Material</label>
              <select 
                value={selectedBacksplash}
                onChange={(e) => setSelectedBacksplash(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="mosaic_glass_azure">Trusa Azure Glass Mosaic - $18.75/sq ft</option>
                <option value="subway_white_classic">Classic White Subway - $4.25/sq ft</option>
                <option value="mosaic_stone_natural">Trusa Natural Stone Mosaic - $22.95/sq ft</option>
                <option value="ceramic_herringbone_white">White Herringbone Ceramic - $12.25/sq ft</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Button */}
      <div className="flex justify-center">
        <Button 
          onClick={processVisualization}
          disabled={!selectedImage || processing}
          className="px-8 py-3 text-lg"
        >
          {processing ? '🔄 Processing...' : '✨ Visualize Room Transformation'}
        </Button>
      </div>

      {/* Results */}
      {result && result.success && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>✨ Your Transformed Room</CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src={result.processedImage.url}
                alt="Transformed room"
                className="w-full max-w-2xl h-auto rounded-lg border shadow-lg"
              />
            </CardContent>
          </Card>

          {/* Room Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Room Dimensions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>Area: {result.roomDimensions?.roomArea} sq ft</div>
                  <div>Floor Area: {result.surfaceAnalysis?.floor?.area} sq ft</div>
                  <div>Room Type: {result.surfaceAnalysis?.roomType}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Applied Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="font-medium">Flooring:</div>
                  <div className="text-sm">{result.materialDetails?.flooring?.name}</div>
                  <div className="font-medium mt-2">Backsplash:</div>
                  <div className="text-sm">{result.materialDetails?.backsplash?.name}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estimated Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.pricing?.flooring && (
                    <div>
                      <div className="font-medium">Flooring: $\{result.pricing.flooring.total.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">
                        Material + Installation
                      </div>
                    </div>
                  )}
                  {result.pricing?.backsplash && (
                    <div>
                      <div className="font-medium">Backsplash: $\{result.pricing.backsplash.total.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">
                        Material + Installation
                      </div>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="text-lg font-bold">
                      Total: $\{result.pricing?.total?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {result.recommendations && (
            <Card>
              <CardHeader>
                <CardTitle>💡 Material Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.recommendations.combinations?.map((combo, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="font-medium">{combo.style}</div>
                      <div className="text-sm text-gray-600">
                        {combo.flooring} + {combo.backsplash}
                      </div>
                      <div className="text-xs text-green-600">
                        Popularity: {combo.popularity}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default FlooringVisualizer;`,

            paintVisualizer: `
// Paint Color Visualizer Component for Lovable
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PaintVisualizer = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [paintColors, setPaintColors] = useState({
    wall_main: '#3498DB',
    wall_accent: '#E74C3C'
  });
  const fileInputRef = useRef(null);

  const apiKey = process.env.NEXT_PUBLIC_FIREAPI_KEY;
  const apiBase = 'https://fireapi.dev';

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setSelectedImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const processVisualization = async () => {
    if (!selectedImage) return;

    setProcessing(true);
    try {
      const response = await fetch(\`\${apiBase}/api/visualizer/paint-colors\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          imageUrl: selectedImage,
          paintOptions: paintColors,
          options: {
            includeColorHarmony: true,
            includeMoodAnalysis: true,
            includePaintCalc: true
          }
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Paint visualization failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const popularColors = [
    { name: 'Ocean Blue', hex: '#3498DB' },
    { name: 'Warm Red', hex: '#E74C3C' },
    { name: 'Forest Green', hex: '#27AE60' },
    { name: 'Sunset Orange', hex: '#F39C12' },
    { name: 'Royal Purple', hex: '#9B59B6' },
    { name: 'Slate Gray', hex: '#34495E' },
    { name: 'Cream White', hex: '#F8F9FA' },
    { name: 'Charcoal', hex: '#2C3E50' }
  ];

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">🎨 Paint Color Visualizer</h2>
      
      {/* Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle>1. Upload Room Image</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={() => fileInputRef.current?.click()}>
              📸 Select Room Photo
            </Button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              className="hidden"
            />
            {selectedImage && (
              <img 
                src={selectedImage} 
                alt="Room to paint"
                className="w-full max-w-md h-auto rounded-lg border"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Color Selection */}
      <Card>
        <CardHeader>
          <CardTitle>2. Choose Paint Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Main Wall Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={paintColors.wall_main}
                    onChange={(e) => setPaintColors({...paintColors, wall_main: e.target.value})}
                    className="w-16 h-10 rounded border"
                  />
                  <input
                    type="text"
                    value={paintColors.wall_main}
                    onChange={(e) => setPaintColors({...paintColors, wall_main: e.target.value})}
                    className="flex-1 p-2 border rounded"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Accent Wall Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={paintColors.wall_accent}
                    onChange={(e) => setPaintColors({...paintColors, wall_accent: e.target.value})}
                    className="w-16 h-10 rounded border"
                  />
                  <input
                    type="text"
                    value={paintColors.wall_accent}
                    onChange={(e) => setPaintColors({...paintColors, wall_accent: e.target.value})}
                    className="flex-1 p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Popular Colors */}
            <div>
              <div className="text-sm font-medium mb-2">Popular Colors</div>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {popularColors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => setPaintColors({...paintColors, wall_main: color.hex})}
                    className="w-12 h-12 rounded border-2 border-gray-300 hover:border-gray-500"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Button */}
      <div className="flex justify-center">
        <Button 
          onClick={processVisualization}
          disabled={!selectedImage || processing}
          className="px-8 py-3 text-lg"
        >
          {processing ? '🔄 Processing...' : '🎨 Visualize Paint Colors'}
        </Button>
      </div>

      {/* Results */}
      {result && result.success && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🎨 Your Painted Room</CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src={result.processedImage.url}
                alt="Painted room"
                className="w-full max-w-2xl h-auto rounded-lg border shadow-lg"
              />
            </CardContent>
          </Card>

          {/* Room Ambiance Analysis */}
          {result.roomAmbiance && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Room Ambiance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>Mood: <span className="font-medium">{result.roomAmbiance.overall}</span></div>
                    <div>Brightness: <span className="font-medium">{result.roomAmbiance.brightness}</span></div>
                    <div>Temperature: <span className="font-medium">{result.roomAmbiance.temperature}</span></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Paint Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>Total Area: {result.paintCalculations?.totalArea} sq ft</div>
                    <div>Paint Needed: {Object.values(result.paintCalculations?.paintNeeded || {}).reduce((sum, p) => sum + p.gallons, 0)} gallons</div>
                    <div>Labor Hours: {result.paintCalculations?.laborHours}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>Materials: $\{(result.paintCalculations?.totalCost - result.paintCalculations?.laborCost)?.toLocaleString()}</div>
                    <div>Labor: $\{result.paintCalculations?.laborCost?.toLocaleString()}</div>
                    <div className="border-t pt-2">
                      <div className="text-lg font-bold">
                        Total: $\{result.paintCalculations?.totalCost?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Color Recommendations */}
          {result.colorRecommendations && (
            <Card>
              <CardHeader>
                <CardTitle>🎯 Color Harmony Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.colorRecommendations.complementary?.map((rec, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: rec.baseColor }}
                        />
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: rec.complement }}
                        />
                        <div>
                          <div className="font-medium">Complementary Pairing</div>
                          <div className="text-sm text-gray-600">{rec.use}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default PaintVisualizer;`
        };
    }

    generateVisualizerExamples() {
        return {
            quickFlooringChange: `
// Quick flooring visualization example
const visualizeFlooring = async (imageFile, flooringType) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const response = await fetch('/api/visualizer/flooring-backsplash', {
    method: 'POST',
    headers: { 'X-API-Key': apiKey },
    body: JSON.stringify({
      imageUrl: await convertToBase64(imageFile),
      flooring: flooringType,
      options: { realism: 'high' }
    })
  });
  
  return response.json();
};`,

            paintColorPreview: `
// Paint color preview with multiple walls
const previewPaintColors = async (roomImage, colorScheme) => {
  const response = await fetch('/api/visualizer/paint-colors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify({
      imageUrl: roomImage,
      paintOptions: {
        wall_main: colorScheme.primary,
        wall_accent: colorScheme.accent,
        wall_left: colorScheme.secondary
      }
    })
  });
  
  return response.json();
};`,

            materialBrowser: `
// Browse available materials
const getMaterials = async (category = 'flooring') => {
  const response = await fetch(\`/api/visualizer/materials?category=\${category}\`);
  const data = await response.json();
  
  return data.materials[category];
};`
        };
    }

    generateVisualizerDocumentation() {
        return `
# Room Visualizer API Integration Guide

## Overview
The Room Visualizer API provides powerful material preview and room transformation capabilities for Lovable projects.

## API Endpoints

### 1. Flooring & Backsplash Visualizer
**POST /api/visualizer/flooring-backsplash**

Transform room images with realistic material overlays.

**Parameters:**
- \`imageUrl\` (required): Base64 data URL or image URL
- \`flooring\` (optional): Flooring material ID
- \`backsplash\` (optional): Backsplash material ID
- \`options\` (optional): Visualization options

### 2. Paint Color Visualizer  
**POST /api/visualizer/paint-colors**

Apply realistic paint colors to room walls.

**Parameters:**
- \`imageUrl\` (required): Room image to transform
- \`paintOptions\` (required): Object with wall IDs and hex colors

### 3. Materials Catalog
**GET /api/visualizer/materials**

Get available materials for visualization.

## Material IDs

### Flooring Materials
- \`hardwood_oak_natural\` - Natural Oak Hardwood ($8.50/sq ft)
- \`hardwood_maple_honey\` - Honey Maple Hardwood ($9.25/sq ft) 
- \`hardwood_walnut_dark\` - Dark Walnut Hardwood ($12.75/sq ft)
- \`laminate_gray_oak\` - Gray Oak Laminate ($3.25/sq ft)
- \`tile_marble_carrara\` - Carrara Marble Tile ($15.50/sq ft)

### Backsplash Materials  
- \`mosaic_glass_azure\` - Trusa Azure Glass Mosaic ($18.75/sq ft)
- \`subway_white_classic\` - Classic White Subway ($4.25/sq ft)
- \`mosaic_stone_natural\` - Trusa Natural Stone Mosaic ($22.95/sq ft)
- \`ceramic_herringbone_white\` - White Herringbone Ceramic ($12.25/sq ft)

## Features

### AI-Powered Surface Detection
- Automatic floor, wall, and backsplash identification
- Perspective correction for realistic overlays
- Room type detection (kitchen, bathroom, etc.)

### Realistic Material Application
- Proper texture scaling and perspective
- Lighting-aware color adjustment
- High-quality material overlays

### Cost Estimation
- Material and installation pricing
- Room dimension calculations
- Regional pricing adjustments

### Color Analysis (Paint Visualizer)
- Color harmony recommendations
- Mood and ambiance analysis
- Paint requirement calculations

## Rate Limits
- Flooring/Backsplash: 15 requests per 15 minutes
- Paint Colors: 20 requests per 15 minutes

## Integration Tips
1. Use high-quality room images for best results
2. Ensure good lighting in uploaded photos
3. Images work best when showing clear floor and wall areas
4. Consider room type when selecting materials
5. Use cost estimates for project planning

Perfect for flooring showrooms, interior design tools, and e-commerce visualization!
`;
    }

    /**
     * Generate SEO integration guide for Lovable
     */
    generateSEOIntegrationGuide(framework = 'react') {
        const apiKey = 'YOUR_FIREAPI_KEY'; // Would be actual API key
        const integrationCode = this.seoService.generateLovableIntegrationCode(apiKey, this.endpoints);
        
        return {
            success: true,
            framework,
            integrationCode,
            examples: {
                dashboardComponent: `
// SEO Dashboard Component for Lovable
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SEODashboard = () => {
  const [seoData, setSeoData] = useState({
    rankings: null,
    competitors: null,
    backlinks: null,
    audit: null
  });
  const [loading, setLoading] = useState(true);

  const apiKey = process.env.NEXT_PUBLIC_FIREAPI_KEY;

  useEffect(() => {
    loadSEOData();
  }, []);

  const loadSEOData = async () => {
    try {
      setLoading(true);
      
      // Load all SEO data in parallel
      const [rankings, competitors, backlinks, audit] = await Promise.all([
        trackKeywords(),
        analyzeCompetitors(),
        monitorBacklinks(),
        runSEOAudit()
      ]);

      setSeoData({ rankings, competitors, backlinks, audit });
    } catch (error) {
      console.error('Failed to load SEO data:', error);
    } finally {
      setLoading(false);
    }
  };

  ${integrationCode.keywordTracking}

  ${integrationCode.competitorMonitoring}

  ${integrationCode.backlinkMonitoring}

  ${integrationCode.technicalAudit}

  if (loading) {
    return <div className="p-6">Loading SEO dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">SEO Performance Dashboard</h1>
      
      {/* Rankings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Keywords Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {seoData.rankings?.totalKeywords || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {seoData.rankings?.summary?.topTen || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quality Backlinks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {seoData.backlinks?.totalBacklinks || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>SEO Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {seoData.audit?.overallScore || 0}/100
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keyword Rankings Chart */}
      {seoData.rankings && (
        <Card>
          <CardHeader>
            <CardTitle>Keyword Position Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={seoData.rankings.results}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="keyword" />
                  <YAxis reversed domain={[1, 100]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="position" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitor Analysis */}
      {seoData.competitors && (
        <Card>
          <CardHeader>
            <CardTitle>Competitor Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {seoData.competitors.results.map(competitor => (
                <div key={competitor.domain} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-medium">{competitor.domain}</div>
                    <div className="text-sm text-gray-500">
                      {competitor.competitive?.weaknesses?.length || 0} weaknesses found
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{competitor.competitive?.strengthScore || 0}/100</div>
                    <div className="text-sm text-gray-500">Strength Score</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEO Recommendations */}
      {seoData.audit?.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle>SEO Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {seoData.audit.recommendations.slice(0, 5).map((rec, index) => (
                <div key={index} className="p-3 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{rec.issue}</div>
                      <div className="text-sm text-gray-600">{rec.solution}</div>
                    </div>
                    <span className={\`px-2 py-1 rounded text-xs \${
                      rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }\`}>
                      {rec.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SEODashboard;`,
                
                hookExample: `
// Custom hook for SEO data
import { useState, useEffect } from 'react';

export const useSEOData = (domain, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiKey = process.env.NEXT_PUBLIC_FIREAPI_KEY;

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('https://fireapi.dev/api/seo/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${apiKey}\`
        },
        body: JSON.stringify({ domain, options })
      });

      if (!response.ok) {
        throw new Error(\`SEO API error: \${response.status}\`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (domain) {
      refreshData();
    }
  }, [domain]);

  return { data, loading, error, refresh: refreshData };
};`
            },
            documentation: `
# FireAPI SEO Integration for Lovable

## Quick Start

1. **Install Dependencies**
   \`\`\`bash
   npm install recharts
   \`\`\`

2. **Set Environment Variables**
   \`\`\`env
   NEXT_PUBLIC_FIREAPI_KEY=your_api_key_here
   \`\`\`

3. **Import and Use Components**
   \`\`\`jsx
   import SEODashboard from './components/SEODashboard';
   
   export default function Dashboard() {
     return <SEODashboard />;
   }
   \`\`\`

## API Endpoints Available

- **POST /api/seo/rankings** - Track keyword positions
- **POST /api/seo/competitors** - Analyze competitor sites  
- **POST /api/seo/backlinks** - Monitor backlink profile
- **POST /api/seo/audit** - Technical SEO audit

## Rate Limits

- Keyword tracking: 5 requests per 15 minutes
- Competitor analysis: 3 requests per 15 minutes  
- Backlink monitoring: 2 requests per 15 minutes
- Technical audit: 2 requests per 15 minutes

## Custom Features for Flooring Industry

- **Local Toronto market focus**
- **Competitor tracking for flooring keywords**
- **Technical audit for e-commerce sites**
- **Backlink opportunities in construction industry**

## Advanced Usage

See the integration code examples above for complete dashboard implementation.
`
        };
    }

    /**
     * WebSocket handler for real-time updates (stub for future implementation)
     */
    async handleWebSocketMessage(message) {
        try {
            const { type, data } = JSON.parse(message);
            
            switch (type) {
                case 'project_analysis':
                    // Stream analysis progress
                    return await this.streamProjectAnalysis(data);
                    
                case 'cost_updates':
                    // Real-time cost updates
                    return await this.streamCostUpdates(data);
                    
                default:
                    throw new Error(`Unknown WebSocket message type: ${type}`);
            }
        } catch (error) {
            return {
                type: 'error',
                error: error.message
            };
        }
    }

    /**
     * Generate unique request ID for tracking
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    /**
     * Rate limiting check (placeholder for production implementation)
     */
    async checkRateLimit(headers) {
        // In production, this would check Redis or database for rate limits
        // For now, just return true
        return true;
    }

    /**
     * Stream project analysis progress (placeholder for WebSocket implementation)
     */
    async streamProjectAnalysis(data) {
        // This would provide real-time updates during analysis
        return {
            type: 'progress',
            stage: 'analysis',
            progress: 50,
            message: 'Analyzing project complexity...'
        };
    }

    /**
     * Stream cost updates (placeholder for real-time pricing)
     */
    async streamCostUpdates(data) {
        // This would provide real-time material pricing updates
        return {
            type: 'cost_update',
            material: 'lumber',
            oldPrice: 450,
            newPrice: 465,
            change: '+3.3%'
        };
    }

    /**
     * Get endpoint metrics and usage statistics
     */
    getMetrics() {
        return {
            totalEndpoints: Object.keys(this.endpoints).length,
            categories: {
                projects: 2,
                workflows: 2,
                costs: 2,
                utility: 1
            },
            mostUsedEndpoints: [
                '/api/projects/complete-analysis',
                '/api/workflows/generate',
                '/api/costs/estimate'
            ],
            averageResponseTime: '250ms',
            uptime: '99.9%'
        };
    }
}

module.exports = APIRoutes;

// Export endpoint definitions for documentation
module.exports.endpoints = new APIRoutes().defineEndpoints();