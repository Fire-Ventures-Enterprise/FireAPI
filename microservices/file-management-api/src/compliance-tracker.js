/**
 * Compliance Documentation Tracker for Construction Projects
 * 
 * Features:
 * - Ottawa Building Code compliance document tracking
 * - Permit and inspection requirement mapping
 * - Automatic compliance status assessment
 * - Required document checklist generation
 * - Integration with task orchestrator for compliance milestones
 */
class ComplianceTracker {
    constructor() {
        this.complianceRules = this.initializeComplianceRules();
        this.requiredDocuments = this.initializeRequiredDocuments();
    }

    initializeComplianceRules() {
        return {
            'ottawa-building-code': {
                version: 'OBC 2012',
                jurisdiction: 'Ottawa, Ontario',
                rules: {
                    'residential-construction': {
                        permits: ['building-permit', 'demolition-permit'],
                        inspections: [
                            'foundation-inspection',
                            'framing-inspection',
                            'insulation-inspection',
                            'plumbing-rough-in',
                            'electrical-rough-in',
                            'hvac-inspection',
                            'final-inspection'
                        ],
                        documents: [
                            'site-plan',
                            'floor-plans',
                            'elevation-drawings',
                            'structural-drawings',
                            'electrical-plans',
                            'plumbing-plans'
                        ]
                    },
                    'commercial-construction': {
                        permits: ['building-permit', 'occupancy-permit'],
                        inspections: [
                            'excavation-inspection',
                            'foundation-inspection',
                            'structural-inspection',
                            'fire-safety-inspection',
                            'accessibility-inspection',
                            'final-inspection'
                        ],
                        documents: [
                            'architectural-drawings',
                            'structural-calculations',
                            'fire-safety-plan',
                            'accessibility-compliance',
                            'environmental-assessment'
                        ]
                    }
                }
            }
        };
    }

    initializeRequiredDocuments() {
        return {
            'building-permit': {
                category: 'permits',
                required: true,
                phase: 'permits-approvals',
                description: 'Official building permit from City of Ottawa',
                fileTypes: ['pdf'],
                keywords: ['building permit', 'permit', 'city of ottawa', 'construction permit']
            },
            'site-plan': {
                category: 'plans',
                required: true,
                phase: 'design-planning',
                description: 'Site plan showing property boundaries and structures',
                fileTypes: ['pdf', 'dwg', 'dxf'],
                keywords: ['site plan', 'survey', 'property', 'boundaries']
            },
            'floor-plans': {
                category: 'plans',
                required: true,
                phase: 'design-planning',
                description: 'Detailed floor plans for all levels',
                fileTypes: ['pdf', 'dwg', 'dxf'],
                keywords: ['floor plan', 'layout', 'rooms', 'dimensions']
            },
            'electrical-plans': {
                category: 'plans',
                required: true,
                phase: 'design-planning',
                trade: 'electrical',
                description: 'Electrical wiring and fixture plans',
                fileTypes: ['pdf', 'dwg'],
                keywords: ['electrical', 'wiring', 'outlets', 'circuits', 'panel']
            },
            'plumbing-plans': {
                category: 'plans',
                required: true,
                phase: 'design-planning',
                trade: 'plumbing',
                description: 'Plumbing fixture and drainage plans',
                fileTypes: ['pdf', 'dwg'],
                keywords: ['plumbing', 'fixtures', 'drainage', 'water', 'sewer']
            },
            'structural-drawings': {
                category: 'plans',
                required: false,
                phase: 'design-planning',
                description: 'Structural engineering drawings and calculations',
                fileTypes: ['pdf', 'dwg'],
                keywords: ['structural', 'engineering', 'beams', 'foundation', 'load']
            },
            'foundation-inspection': {
                category: 'inspections',
                required: true,
                phase: 'foundation',
                description: 'Foundation inspection report and approval',
                fileTypes: ['pdf'],
                keywords: ['foundation', 'inspection', 'approved', 'pass']
            },
            'framing-inspection': {
                category: 'inspections',
                required: true,
                phase: 'framing',
                description: 'Framing inspection report and approval',
                fileTypes: ['pdf'],
                keywords: ['framing', 'inspection', 'approved', 'pass', 'structural']
            },
            'electrical-rough-in': {
                category: 'inspections',
                required: true,
                phase: 'mechanical-electrical-plumbing',
                trade: 'electrical',
                description: 'Electrical rough-in inspection approval',
                fileTypes: ['pdf'],
                keywords: ['electrical', 'rough', 'inspection', 'approved', 'wiring']
            },
            'plumbing-rough-in': {
                category: 'inspections',
                required: true,
                phase: 'mechanical-electrical-plumbing',
                trade: 'plumbing',
                description: 'Plumbing rough-in inspection approval',
                fileTypes: ['pdf'],
                keywords: ['plumbing', 'rough', 'inspection', 'approved', 'pipes']
            },
            'insulation-inspection': {
                category: 'inspections',
                required: true,
                phase: 'insulation-drywall',
                description: 'Insulation inspection before drywall installation',
                fileTypes: ['pdf'],
                keywords: ['insulation', 'inspection', 'approved', 'r-value']
            },
            'final-inspection': {
                category: 'inspections',
                required: true,
                phase: 'final-inspections',
                description: 'Final building inspection and occupancy approval',
                fileTypes: ['pdf'],
                keywords: ['final', 'inspection', 'occupancy', 'approved', 'completion']
            }
        };
    }

    async analyzeFile(fileRecord) {
        const analysis = {
            isRelevant: false,
            complianceType: null,
            documentType: null,
            phase: null,
            trade: null,
            confidence: 0,
            matchedKeywords: [],
            suggestions: []
        };

        try {
            // Analyze filename and content for compliance relevance
            const fileName = fileRecord.originalName.toLowerCase();
            const description = (fileRecord.description || '').toLowerCase();
            const searchText = `${fileName} ${description}`.toLowerCase();

            // Check against required documents
            for (const [docType, docSpec] of Object.entries(this.requiredDocuments)) {
                const matches = this.checkKeywordMatches(searchText, docSpec.keywords);
                
                if (matches.length > 0) {
                    analysis.isRelevant = true;
                    analysis.documentType = docType;
                    analysis.complianceType = docSpec.category;
                    analysis.phase = docSpec.phase;
                    analysis.trade = docSpec.trade;
                    analysis.matchedKeywords = matches;
                    analysis.confidence = Math.min(matches.length * 0.25, 1.0);
                    break;
                }
            }

            // If no specific document type matched, check for general compliance categories
            if (!analysis.isRelevant) {
                const categoryAnalysis = this.analyzeCategoryRelevance(searchText, fileRecord);
                if (categoryAnalysis.isRelevant) {
                    Object.assign(analysis, categoryAnalysis);
                }
            }

            // Generate suggestions based on analysis
            if (analysis.isRelevant) {
                analysis.suggestions = this.generateSuggestions(analysis, fileRecord);
            }

        } catch (error) {
            console.error('Compliance analysis error:', error);
        }

        return analysis;
    }

    checkKeywordMatches(text, keywords) {
        const matches = [];
        
        for (const keyword of keywords) {
            if (text.includes(keyword.toLowerCase())) {
                matches.push(keyword);
            }
        }
        
        return matches;
    }

    analyzeCategoryRelevance(text, fileRecord) {
        const analysis = {
            isRelevant: false,
            complianceType: null,
            confidence: 0,
            matchedKeywords: []
        };

        // Check for general compliance terms
        const complianceTerms = {
            permits: ['permit', 'approval', 'authorization', 'license'],
            inspections: ['inspection', 'report', 'approval', 'pass', 'fail', 'deficiency'],
            plans: ['plan', 'drawing', 'blueprint', 'design', 'layout'],
            safety: ['safety', 'hazard', 'risk', 'incident', 'accident']
        };

        for (const [category, terms] of Object.entries(complianceTerms)) {
            const matches = this.checkKeywordMatches(text, terms);
            
            if (matches.length > 0) {
                analysis.isRelevant = true;
                analysis.complianceType = category;
                analysis.matchedKeywords = matches;
                analysis.confidence = Math.min(matches.length * 0.2, 0.8);
                break;
            }
        }

        return analysis;
    }

    generateSuggestions(analysis, fileRecord) {
        const suggestions = [];

        if (analysis.documentType) {
            const docSpec = this.requiredDocuments[analysis.documentType];
            
            // Suggest proper categorization
            if (fileRecord.category !== docSpec.category) {
                suggestions.push({
                    type: 'categorization',
                    message: `Consider recategorizing as '${docSpec.category}'`,
                    action: 'update-category',
                    value: docSpec.category
                });
            }

            // Suggest phase assignment
            if (!fileRecord.phase && docSpec.phase) {
                suggestions.push({
                    type: 'phase-assignment',
                    message: `This document typically belongs to '${docSpec.phase}' phase`,
                    action: 'update-phase',
                    value: docSpec.phase
                });
            }

            // Suggest trade assignment
            if (!fileRecord.trade && docSpec.trade) {
                suggestions.push({
                    type: 'trade-assignment',
                    message: `This document is related to '${docSpec.trade}' trade`,
                    action: 'update-trade',
                    value: docSpec.trade
                });
            }

            // Suggest tags
            const suggestedTags = ['compliance', analysis.documentType];
            if (docSpec.trade) suggestedTags.push(docSpec.trade);
            
            suggestions.push({
                type: 'tagging',
                message: `Consider adding tags: ${suggestedTags.join(', ')}`,
                action: 'add-tags',
                value: suggestedTags
            });
        }

        return suggestions;
    }

    async getComplianceStatus(projectId, projectType = 'residential-construction') {
        // This would integrate with the file database to check compliance status
        const status = {
            projectId,
            projectType,
            overallStatus: 'in-progress',
            completionPercentage: 0,
            requiredDocuments: [],
            missingDocuments: [],
            upcomingRequirements: [],
            complianceIssues: []
        };

        try {
            // Get compliance rules for project type
            const rules = this.complianceRules['ottawa-building-code'].rules[projectType];
            if (!rules) {
                throw new Error(`Unknown project type: ${projectType}`);
            }

            // Check required documents
            const requiredDocs = [];
            const missingDocs = [];

            for (const docType of rules.documents) {
                const docSpec = this.requiredDocuments[docType];
                if (docSpec) {
                    requiredDocs.push({
                        type: docType,
                        name: docSpec.description,
                        phase: docSpec.phase,
                        required: docSpec.required,
                        status: 'missing' // This would be updated by checking actual files
                    });
                    
                    if (docSpec.required) {
                        missingDocs.push(docType);
                    }
                }
            }

            status.requiredDocuments = requiredDocs;
            status.missingDocuments = missingDocs;
            status.completionPercentage = Math.max(0, 
                (requiredDocs.length - missingDocs.length) / requiredDocs.length * 100
            );

            if (missingDocs.length === 0) {
                status.overallStatus = 'compliant';
            } else if (missingDocs.length > requiredDocs.length * 0.5) {
                status.overallStatus = 'critical';
            } else {
                status.overallStatus = 'in-progress';
            }

        } catch (error) {
            console.error('Compliance status error:', error);
            status.error = error.message;
        }

        return status;
    }

    async getRequiredDocumentsByPhase(phase, projectType = 'residential-construction') {
        const phaseDocuments = [];
        
        for (const [docType, docSpec] of Object.entries(this.requiredDocuments)) {
            if (docSpec.phase === phase) {
                phaseDocuments.push({
                    type: docType,
                    name: docSpec.description,
                    required: docSpec.required,
                    category: docSpec.category,
                    trade: docSpec.trade,
                    fileTypes: docSpec.fileTypes,
                    keywords: docSpec.keywords
                });
            }
        }

        return phaseDocuments.sort((a, b) => {
            // Sort required documents first
            if (a.required && !b.required) return -1;
            if (!a.required && b.required) return 1;
            return a.name.localeCompare(b.name);
        });
    }

    async validateDocumentCompliance(fileRecord) {
        const validation = {
            isCompliant: true,
            issues: [],
            warnings: [],
            suggestions: []
        };

        try {
            // Basic file validation
            if (!fileRecord.originalName || fileRecord.originalName.trim() === '') {
                validation.issues.push('File name is empty or invalid');
                validation.isCompliant = false;
            }

            if (fileRecord.size === 0) {
                validation.issues.push('File appears to be empty');
                validation.isCompliant = false;
            }

            // File type validation based on compliance requirements
            if (fileRecord.compliance && fileRecord.compliance.documentType) {
                const docSpec = this.requiredDocuments[fileRecord.compliance.documentType];
                
                if (docSpec && docSpec.fileTypes) {
                    const fileExt = fileRecord.originalName.split('.').pop().toLowerCase();
                    const mimeType = fileRecord.mimeType;
                    
                    const isValidType = docSpec.fileTypes.some(type => {
                        return fileExt === type || mimeType.includes(type);
                    });

                    if (!isValidType) {
                        validation.warnings.push(
                            `File type may not be suitable for ${docSpec.description}. ` +
                            `Expected: ${docSpec.fileTypes.join(', ')}`
                        );
                    }
                }
            }

            // Size validation (warn about very large files)
            const maxRecommendedSize = 50 * 1024 * 1024; // 50MB
            if (fileRecord.size > maxRecommendedSize) {
                validation.warnings.push(
                    'File is very large and may cause upload/download issues'
                );
            }

            // Suggest improvements
            if (!fileRecord.description) {
                validation.suggestions.push('Add a description to improve searchability');
            }

            if (!fileRecord.tags || fileRecord.tags.length === 0) {
                validation.suggestions.push('Add relevant tags for better organization');
            }

        } catch (error) {
            console.error('Document validation error:', error);
            validation.issues.push('Unable to validate document compliance');
            validation.isCompliant = false;
        }

        return validation;
    }
}

module.exports = ComplianceTracker;