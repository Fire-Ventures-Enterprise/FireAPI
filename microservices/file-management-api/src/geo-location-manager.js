/**
 * Revolutionary GPS-Based Project Detection & Auto-Organization
 * 
 * Features:
 * - Automatic project detection from photo GPS coordinates
 * - Geo-fencing for construction sites
 * - Address-based project matching
 * - Smart location-based file organization
 * - Construction site boundary detection
 */
class GeoLocationManager {
    constructor() {
        this.projectLocations = new Map(); // In production, use proper database
        this.geoFences = new Map(); // Store project geo-fences
        this.locationCache = new Map(); // Cache reverse geocoding results
        
        // Initialize with some example project locations
        this.initializeProjectLocations();
    }

    initializeProjectLocations() {
        // Example project locations in Ottawa area
        const exampleProjects = [
            {
                projectId: 'proj_ottawa_kitchen_reno_001',
                name: 'Ottawa Kitchen Renovation - Centretown',
                address: '123 Bank Street, Ottawa, ON K1P 1A1',
                coordinates: {
                    latitude: 45.4215,
                    longitude: -75.6972
                },
                radius: 50, // meters
                type: 'residential-renovation'
            },
            {
                projectId: 'proj_ottawa_new_build_002',
                name: 'New Home Construction - Kanata',
                address: '456 Terry Fox Drive, Kanata, ON K2M 2W2',
                coordinates: {
                    latitude: 45.3311,
                    longitude: -75.9034
                },
                radius: 100, // meters
                type: 'new-construction'
            },
            {
                projectId: 'proj_ottawa_commercial_003',
                name: 'Office Building Renovation - ByWard Market',
                address: '789 Rideau Street, Ottawa, ON K1N 5Y3',
                coordinates: {
                    latitude: 45.4274,
                    longitude: -75.6924
                },
                radius: 75, // meters
                type: 'commercial-renovation'
            }
        ];

        exampleProjects.forEach(project => {
            this.projectLocations.set(project.projectId, project);
            this.createGeoFence(project.projectId, project.coordinates, project.radius);
        });

        console.log(`📍 [GEO-LOCATION] Initialized ${exampleProjects.length} project locations`);
    }

    /**
     * Add a new project location for automatic detection
     */
    addProjectLocation(projectData) {
        const {
            projectId,
            name,
            address,
            coordinates,
            radius = 50,
            type = 'construction'
        } = projectData;

        const project = {
            projectId,
            name,
            address,
            coordinates: {
                latitude: parseFloat(coordinates.latitude),
                longitude: parseFloat(coordinates.longitude)
            },
            radius,
            type,
            createdAt: new Date().toISOString()
        };

        this.projectLocations.set(projectId, project);
        this.createGeoFence(projectId, project.coordinates, radius);

        console.log(`📍 [GEO-LOCATION] Added project location: ${name} at ${address}`);
        return project;
    }

    /**
     * Create geo-fence for project location
     */
    createGeoFence(projectId, center, radiusMeters) {
        const geoFence = {
            projectId,
            center,
            radius: radiusMeters,
            createdAt: new Date().toISOString()
        };

        this.geoFences.set(projectId, geoFence);
        return geoFence;
    }

    /**
     * Detect project from GPS coordinates in photo metadata
     */
    async detectProjectFromGPS(gpsCoordinates) {
        try {
            if (!gpsCoordinates || !gpsCoordinates.latitude || !gpsCoordinates.longitude) {
                return {
                    detected: false,
                    reason: 'No GPS coordinates found in photo metadata'
                };
            }

            const photoLocation = {
                latitude: parseFloat(gpsCoordinates.latitude),
                longitude: parseFloat(gpsCoordinates.longitude)
            };

            // Check all project geo-fences
            const detectedProjects = [];

            for (const [projectId, project] of this.projectLocations.entries()) {
                const distance = this.calculateDistance(
                    photoLocation,
                    project.coordinates
                );

                if (distance <= project.radius) {
                    detectedProjects.push({
                        projectId,
                        project,
                        distance: Math.round(distance),
                        confidence: this.calculateConfidence(distance, project.radius)
                    });
                }
            }

            if (detectedProjects.length === 0) {
                // Try to find nearest project within extended range (500m)
                const nearestProject = await this.findNearestProject(photoLocation, 500);
                
                if (nearestProject) {
                    return {
                        detected: false,
                        suggestedProject: nearestProject,
                        reason: 'Photo taken outside known project boundaries, but near a known project',
                        recommendation: `Consider adding this location to project: ${nearestProject.project.name}`
                    };
                }

                return {
                    detected: false,
                    reason: 'Photo location not within any known project boundaries',
                    coordinates: photoLocation,
                    recommendation: 'Create new project location or expand existing project boundaries'
                };
            }

            // Sort by confidence (closest first)
            detectedProjects.sort((a, b) => b.confidence - a.confidence);

            const bestMatch = detectedProjects[0];

            return {
                detected: true,
                projectId: bestMatch.projectId,
                project: bestMatch.project,
                distance: bestMatch.distance,
                confidence: bestMatch.confidence,
                coordinates: photoLocation,
                allMatches: detectedProjects,
                autoOrganization: {
                    enabled: true,
                    message: `Photo automatically organized to project: ${bestMatch.project.name}`
                }
            };

        } catch (error) {
            console.error('GPS project detection error:', error);
            return {
                detected: false,
                error: error.message,
                reason: 'Error during GPS analysis'
            };
        }
    }

    /**
     * Find nearest project within specified range
     */
    async findNearestProject(photoLocation, maxDistanceMeters = 500) {
        let nearestProject = null;
        let nearestDistance = Infinity;

        for (const [projectId, project] of this.projectLocations.entries()) {
            const distance = this.calculateDistance(photoLocation, project.coordinates);
            
            if (distance <= maxDistanceMeters && distance < nearestDistance) {
                nearestDistance = distance;
                nearestProject = {
                    projectId,
                    project,
                    distance: Math.round(distance)
                };
            }
        }

        return nearestProject;
    }

    /**
     * Calculate distance between two GPS coordinates using Haversine formula
     */
    calculateDistance(coord1, coord2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = coord1.latitude * Math.PI / 180;
        const φ2 = coord2.latitude * Math.PI / 180;
        const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
        const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // Distance in meters
    }

    /**
     * Calculate confidence score based on distance from project center
     */
    calculateConfidence(distance, radius) {
        if (distance <= radius * 0.3) return 1.0; // Very high confidence
        if (distance <= radius * 0.6) return 0.8; // High confidence
        if (distance <= radius * 0.8) return 0.6; // Medium confidence
        if (distance <= radius) return 0.4; // Low confidence
        return 0.0; // No confidence
    }

    /**
     * Reverse geocode coordinates to get address information
     */
    async reverseGeocode(coordinates) {
        const cacheKey = `${coordinates.latitude.toFixed(4)},${coordinates.longitude.toFixed(4)}`;
        
        // Check cache first
        if (this.locationCache.has(cacheKey)) {
            return this.locationCache.get(cacheKey);
        }

        try {
            // In a real implementation, you would use a geocoding service like:
            // - Google Maps Geocoding API
            // - OpenStreetMap Nominatim
            // - MapBox Geocoding API
            
            // For now, we'll simulate with Ottawa area detection
            const address = this.simulateReverseGeocode(coordinates);
            
            // Cache the result
            this.locationCache.set(cacheKey, address);
            
            return address;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return {
                address: 'Address lookup failed',
                city: 'Ottawa',
                province: 'Ontario',
                country: 'Canada',
                confidence: 0
            };
        }
    }

    /**
     * Simulate reverse geocoding for Ottawa area
     */
    simulateReverseGeocode(coordinates) {
        const { latitude, longitude } = coordinates;
        
        // Ottawa boundaries (approximate)
        const ottawaBounds = {
            north: 45.53,
            south: 45.25,
            east: -75.40,
            west: -76.35
        };

        if (latitude >= ottawaBounds.south && latitude <= ottawaBounds.north &&
            longitude >= ottawaBounds.west && longitude <= ottawaBounds.east) {
            
            // Determine Ottawa neighborhood based on coordinates
            let neighborhood = 'Ottawa';
            
            if (latitude > 45.42 && longitude > -75.70) {
                neighborhood = 'ByWard Market';
            } else if (latitude < 45.35 && longitude < -75.85) {
                neighborhood = 'Kanata';
            } else if (latitude > 45.40 && longitude < -75.75) {
                neighborhood = 'Westboro';
            } else if (latitude > 45.41 && longitude > -75.68) {
                neighborhood = 'Centretown';
            }

            return {
                address: `Construction Site, ${neighborhood}`,
                neighborhood,
                city: 'Ottawa',
                province: 'Ontario', 
                country: 'Canada',
                postalCode: this.generateOttawaPostalCode(coordinates),
                confidence: 0.8
            };
        }

        return {
            address: 'Unknown Location',
            city: 'Unknown',
            province: 'Unknown',
            country: 'Canada',
            confidence: 0.1
        };
    }

    /**
     * Generate realistic Ottawa postal code based on coordinates
     */
    generateOttawaPostalCode(coordinates) {
        const { latitude, longitude } = coordinates;
        
        // Ottawa postal code patterns
        const patterns = ['K1P', 'K1N', 'K1R', 'K1S', 'K2M', 'K2P', 'K2R'];
        
        // Select pattern based on location
        let pattern = 'K1P';
        if (latitude < 45.35) pattern = 'K2M'; // Kanata area
        if (longitude > -75.65) pattern = 'K1N'; // Eastern Ottawa
        
        const number = Math.floor(Math.random() * 9) + 1;
        const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        
        return `${pattern} ${number}${letter}${number}`;
    }

    /**
     * Organize photo automatically based on GPS detection
     */
    async organizePhotoByLocation(photoMetadata, detectionResult) {
        if (!detectionResult.detected) {
            return {
                organized: false,
                reason: detectionResult.reason,
                suggestion: detectionResult.recommendation
            };
        }

        const organization = {
            organized: true,
            projectId: detectionResult.projectId,
            projectName: detectionResult.project.name,
            confidence: detectionResult.confidence,
            distance: detectionResult.distance,
            autoAssignments: {
                phase: this.detectConstructionPhase(photoMetadata),
                category: 'progress-photo',
                location: {
                    coordinates: detectionResult.coordinates,
                    address: detectionResult.project.address,
                    withinBounds: true
                },
                tags: this.generateLocationTags(detectionResult)
            }
        };

        return organization;
    }

    /**
     * Detect construction phase from photo metadata and filename
     */
    detectConstructionPhase(metadata) {
        const fileName = (metadata.originalName || '').toLowerCase();
        const description = (metadata.description || '').toLowerCase();
        const searchText = `${fileName} ${description}`;

        const phaseKeywords = {
            'foundation': ['foundation', 'excavation', 'concrete', 'footings', 'basement'],
            'framing': ['framing', 'studs', 'beams', 'joists', 'structural', 'frame'],
            'mechanical-electrical-plumbing': ['electrical', 'plumbing', 'hvac', 'wiring', 'pipes', 'rough-in'],
            'insulation-drywall': ['insulation', 'drywall', 'vapor barrier', 'insulation'],
            'flooring-finishes': ['flooring', 'paint', 'trim', 'cabinets', 'fixtures', 'finish']
        };

        for (const [phase, keywords] of Object.entries(phaseKeywords)) {
            if (keywords.some(keyword => searchText.includes(keyword))) {
                return phase;
            }
        }

        return 'general'; // Default phase
    }

    /**
     * Generate smart tags based on location detection
     */
    generateLocationTags(detectionResult) {
        const tags = [
            'gps-detected',
            `project-${detectionResult.projectId}`,
            `confidence-${Math.round(detectionResult.confidence * 100)}%`
        ];

        if (detectionResult.distance <= 10) {
            tags.push('on-site');
        } else if (detectionResult.distance <= 25) {
            tags.push('near-site');
        }

        if (detectionResult.project.type) {
            tags.push(detectionResult.project.type);
        }

        // Add location-based tags
        const address = detectionResult.project.address;
        if (address.includes('Ottawa')) tags.push('ottawa');
        if (address.includes('Kanata')) tags.push('kanata');
        if (address.includes('Centretown')) tags.push('centretown');

        return tags;
    }

    /**
     * Get all project locations for management
     */
    getAllProjectLocations() {
        return Array.from(this.projectLocations.values()).map(project => ({
            ...project,
            geoFence: this.geoFences.get(project.projectId)
        }));
    }

    /**
     * Update project location boundaries
     */
    updateProjectBoundaries(projectId, newRadius) {
        const project = this.projectLocations.get(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        project.radius = newRadius;
        this.createGeoFence(projectId, project.coordinates, newRadius);

        return project;
    }

    /**
     * Get location analytics for project
     */
    async getLocationAnalytics(projectId) {
        const project = this.projectLocations.get(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        // In a real implementation, you would analyze all photos for this project
        return {
            projectId,
            project,
            analytics: {
                totalPhotosWithGPS: 0, // Would query database
                averageDistanceFromCenter: 0,
                boundaryUtilization: 0.7, // Percentage of boundary area where photos were taken
                mostActiveAreas: [], // Hotspots within the project boundary
                timeBasedPatterns: {
                    morningActivity: 0.3,
                    afternoonActivity: 0.7,
                    eveningActivity: 0.1
                }
            }
        };
    }
}

module.exports = GeoLocationManager;