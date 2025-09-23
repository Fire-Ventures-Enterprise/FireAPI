/**
 * Construction Progress Analyzer
 * 
 * Features:
 * - Before/after photo comparison and analysis
 * - Task completion percentage estimation
 * - Quality assessment based on image analysis
 * - Progress timeline correlation with task orchestrator
 * - Automated progress reporting generation
 */
class ProgressAnalyzer {
    constructor() {
        this.progressDatabase = new Map(); // In production, use proper database
        this.qualityThresholds = this.initializeQualityThresholds();
    }

    initializeQualityThresholds() {
        return {
            image: {
                brightness: { min: 0.2, max: 0.8, optimal: [0.3, 0.7] },
                contrast: { min: 0.1, optimal: [0.15, 0.4] },
                resolution: { min: 1024 * 768, optimal: 1920 * 1080 },
                fileSize: { min: 100 * 1024, max: 10 * 1024 * 1024 } // 100KB to 10MB
            },
            completion: {
                phases: {
                    'foundation': {
                        keywords: ['concrete', 'foundation', 'footings', 'basement'],
                        indicators: ['level', 'cured', 'forms removed']
                    },
                    'framing': {
                        keywords: ['framing', 'studs', 'joists', 'rafters', 'beams'],
                        indicators: ['squared', 'plumb', 'level', 'complete']
                    },
                    'mechanical-electrical-plumbing': {
                        keywords: ['wiring', 'pipes', 'ducts', 'electrical', 'plumbing'],
                        indicators: ['rough-in', 'tested', 'approved', 'connected']
                    },
                    'insulation-drywall': {
                        keywords: ['insulation', 'drywall', 'vapor barrier'],
                        indicators: ['installed', 'sealed', 'taped', 'mudded']
                    },
                    'flooring-finishes': {
                        keywords: ['flooring', 'paint', 'trim', 'cabinets', 'fixtures'],
                        indicators: ['installed', 'finished', 'sealed', 'complete']
                    }
                }
            }
        };
    }

    async analyzeTaskProgress(taskId, photos) {
        try {
            const analysis = {
                taskId,
                timestamp: new Date().toISOString(),
                photos: photos.length,
                qualityAssessment: {},
                completionEstimate: null,
                recommendations: [],
                issues: [],
                nextSteps: []
            };

            // Analyze each photo
            const photoAnalyses = [];
            for (const photo of photos) {
                const photoAnalysis = await this.analyzeProgressPhoto(photo);
                photoAnalyses.push(photoAnalysis);
            }

            // Aggregate photo analyses
            analysis.qualityAssessment = this.aggregateQualityAssessment(photoAnalyses);
            
            // Estimate completion based on photo content and metadata
            analysis.completionEstimate = await this.estimateTaskCompletion(taskId, photoAnalyses);
            
            // Generate recommendations
            analysis.recommendations = this.generateProgressRecommendations(analysis);
            
            // Identify potential issues
            analysis.issues = this.identifyProgressIssues(analysis);
            
            // Suggest next steps
            analysis.nextSteps = this.suggestNextSteps(analysis);

            // Store analysis
            this.progressDatabase.set(taskId, analysis);

            return analysis;

        } catch (error) {
            console.error('Task progress analysis error:', error);
            throw error;
        }
    }

    async analyzeProgressPhoto(photo) {
        const analysis = {
            photoId: photo.id,
            fileName: photo.fileName,
            timestamp: photo.timestamp,
            quality: {},
            content: {},
            issues: []
        };

        try {
            // Basic quality assessment
            if (photo.metadata && photo.metadata.dimensions) {
                analysis.quality = await this.assessImageQuality(photo);
            }

            // Content analysis based on filename and metadata
            analysis.content = await this.analyzePhotoContent(photo);

            // Detect potential issues
            analysis.issues = this.detectPhotoIssues(analysis);

        } catch (error) {
            console.error('Photo analysis error:', error);
            analysis.error = error.message;
        }

        return analysis;
    }

    async assessImageQuality(photo) {
        const quality = {
            overall: 'good',
            score: 0,
            factors: {}
        };

        try {
            const metadata = photo.metadata;
            const thresholds = this.qualityThresholds.image;

            // Resolution assessment
            if (metadata.dimensions) {
                const resolution = metadata.dimensions.width * metadata.dimensions.height;
                quality.factors.resolution = {
                    value: resolution,
                    score: resolution >= thresholds.resolution.optimal ? 1.0 : 
                           resolution >= thresholds.resolution.min ? 0.7 : 0.3,
                    status: resolution >= thresholds.resolution.min ? 'acceptable' : 'poor'
                };
            }

            // File size assessment (balance between quality and practicality)
            quality.factors.fileSize = {
                value: photo.size,
                score: photo.size >= thresholds.fileSize.min && 
                       photo.size <= thresholds.fileSize.max ? 1.0 : 0.5,
                status: photo.size >= thresholds.fileSize.min && 
                        photo.size <= thresholds.fileSize.max ? 'good' : 'concerning'
            };

            // Brightness assessment (if available from metadata extraction)
            if (metadata.constructionFeatures && metadata.constructionFeatures.brightness !== null) {
                const brightness = metadata.constructionFeatures.brightness;
                const optimal = thresholds.brightness.optimal;
                
                quality.factors.brightness = {
                    value: brightness,
                    score: brightness >= optimal[0] && brightness <= optimal[1] ? 1.0 :
                           brightness >= thresholds.brightness.min && 
                           brightness <= thresholds.brightness.max ? 0.7 : 0.4,
                    status: brightness >= optimal[0] && brightness <= optimal[1] ? 'optimal' : 'suboptimal'
                };
            }

            // Contrast assessment (if available)
            if (metadata.constructionFeatures && metadata.constructionFeatures.contrast !== null) {
                const contrast = metadata.constructionFeatures.contrast;
                const optimal = thresholds.contrast.optimal;
                
                quality.factors.contrast = {
                    value: contrast,
                    score: contrast >= optimal[0] && contrast <= optimal[1] ? 1.0 :
                           contrast >= thresholds.contrast.min ? 0.7 : 0.4,
                    status: contrast >= optimal[0] && contrast <= optimal[1] ? 'good' : 'poor'
                };
            }

            // Calculate overall quality score
            const scores = Object.values(quality.factors)
                .filter(factor => factor.score !== undefined)
                .map(factor => factor.score);
            
            quality.score = scores.length > 0 ? 
                scores.reduce((sum, score) => sum + score, 0) / scores.length : 0.5;

            // Determine overall quality rating
            if (quality.score >= 0.8) quality.overall = 'excellent';
            else if (quality.score >= 0.6) quality.overall = 'good';
            else if (quality.score >= 0.4) quality.overall = 'acceptable';
            else quality.overall = 'poor';

        } catch (error) {
            console.error('Quality assessment error:', error);
            quality.error = error.message;
        }

        return quality;
    }

    async analyzePhotoContent(photo) {
        const content = {
            phase: null,
            trade: null,
            keywords: [],
            completionIndicators: [],
            confidence: 0
        };

        try {
            const fileName = photo.fileName.toLowerCase();
            const description = (photo.description || '').toLowerCase();
            const searchText = `${fileName} ${description}`;

            // Analyze for construction phase
            const phases = this.qualityThresholds.completion.phases;
            
            for (const [phase, phaseData] of Object.entries(phases)) {
                const keywordMatches = phaseData.keywords.filter(keyword => 
                    searchText.includes(keyword.toLowerCase())
                );
                
                const indicatorMatches = phaseData.indicators.filter(indicator =>
                    searchText.includes(indicator.toLowerCase())
                );

                if (keywordMatches.length > 0 || indicatorMatches.length > 0) {
                    content.phase = phase;
                    content.keywords = keywordMatches;
                    content.completionIndicators = indicatorMatches;
                    content.confidence = Math.min(
                        (keywordMatches.length + indicatorMatches.length) * 0.3, 1.0
                    );
                    break;
                }
            }

            // Detect trade-specific content
            const tradeKeywords = {
                electrical: ['electrical', 'wiring', 'outlet', 'switch', 'panel', 'conduit'],
                plumbing: ['plumbing', 'pipe', 'fixture', 'drain', 'water', 'faucet'],
                hvac: ['hvac', 'duct', 'vent', 'heating', 'cooling', 'air'],
                carpentry: ['framing', 'wood', 'lumber', 'trim', 'cabinet', 'door'],
                flooring: ['flooring', 'tile', 'carpet', 'hardwood', 'laminate'],
                painting: ['paint', 'primer', 'finish', 'color', 'coating']
            };

            for (const [trade, keywords] of Object.entries(tradeKeywords)) {
                const matches = keywords.filter(keyword => 
                    searchText.includes(keyword.toLowerCase())
                );
                
                if (matches.length > 0) {
                    content.trade = trade;
                    content.keywords.push(...matches);
                    break;
                }
            }

        } catch (error) {
            console.error('Content analysis error:', error);
        }

        return content;
    }

    detectPhotoIssues(photoAnalysis) {
        const issues = [];

        try {
            // Quality-based issues
            if (photoAnalysis.quality) {
                const quality = photoAnalysis.quality;
                
                if (quality.overall === 'poor') {
                    issues.push({
                        type: 'quality',
                        severity: 'high',
                        message: 'Photo quality is poor, may affect progress assessment',
                        suggestion: 'Retake photo with better lighting and focus'
                    });
                }

                if (quality.factors.brightness && quality.factors.brightness.status === 'suboptimal') {
                    issues.push({
                        type: 'lighting',
                        severity: 'medium',
                        message: 'Photo lighting is not optimal',
                        suggestion: 'Use better lighting or take photo during daylight hours'
                    });
                }

                if (quality.factors.resolution && quality.factors.resolution.status === 'poor') {
                    issues.push({
                        type: 'resolution',
                        severity: 'medium',
                        message: 'Photo resolution is too low for detailed analysis',
                        suggestion: 'Use higher resolution camera settings'
                    });
                }
            }

            // Content-based issues
            if (photoAnalysis.content && photoAnalysis.content.confidence < 0.3) {
                issues.push({
                    type: 'clarity',
                    severity: 'low',
                    message: 'Unable to clearly identify construction phase or trade',
                    suggestion: 'Add descriptive filename or caption to clarify photo content'
                });
            }

        } catch (error) {
            console.error('Issue detection error:', error);
        }

        return issues;
    }

    aggregateQualityAssessment(photoAnalyses) {
        const aggregate = {
            averageQuality: 0,
            totalPhotos: photoAnalyses.length,
            qualityDistribution: { excellent: 0, good: 0, acceptable: 0, poor: 0 },
            commonIssues: [],
            overallAssessment: 'unknown'
        };

        try {
            if (photoAnalyses.length === 0) return aggregate;

            // Calculate average quality score
            const qualityScores = photoAnalyses
                .filter(analysis => analysis.quality && analysis.quality.score !== undefined)
                .map(analysis => analysis.quality.score);

            aggregate.averageQuality = qualityScores.length > 0 ?
                qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0;

            // Count quality distribution
            photoAnalyses.forEach(analysis => {
                if (analysis.quality && analysis.quality.overall) {
                    aggregate.qualityDistribution[analysis.quality.overall]++;
                }
            });

            // Aggregate common issues
            const issueMap = new Map();
            photoAnalyses.forEach(analysis => {
                if (analysis.issues) {
                    analysis.issues.forEach(issue => {
                        const key = `${issue.type}-${issue.severity}`;
                        issueMap.set(key, (issueMap.get(key) || 0) + 1);
                    });
                }
            });

            // Convert to sorted array of common issues
            aggregate.commonIssues = Array.from(issueMap.entries())
                .filter(([_, count]) => count > photoAnalyses.length * 0.3) // Issues in >30% of photos
                .map(([key, count]) => {
                    const [type, severity] = key.split('-');
                    return { type, severity, frequency: count };
                })
                .sort((a, b) => b.frequency - a.frequency);

            // Overall assessment
            if (aggregate.averageQuality >= 0.8) {
                aggregate.overallAssessment = 'excellent';
            } else if (aggregate.averageQuality >= 0.6) {
                aggregate.overallAssessment = 'good';
            } else if (aggregate.averageQuality >= 0.4) {
                aggregate.overallAssessment = 'acceptable';
            } else {
                aggregate.overallAssessment = 'needs-improvement';
            }

        } catch (error) {
            console.error('Quality aggregation error:', error);
        }

        return aggregate;
    }

    async estimateTaskCompletion(taskId, photoAnalyses) {
        const estimation = {
            percentage: 0,
            confidence: 'low',
            method: 'photo-analysis',
            factors: []
        };

        try {
            // Analyze completion indicators from photo content
            const completionIndicators = [];
            const phaseAnalysis = {};

            photoAnalyses.forEach(analysis => {
                if (analysis.content) {
                    if (analysis.content.completionIndicators) {
                        completionIndicators.push(...analysis.content.completionIndicators);
                    }
                    
                    if (analysis.content.phase) {
                        phaseAnalysis[analysis.content.phase] = 
                            (phaseAnalysis[analysis.content.phase] || 0) + 1;
                    }
                }
            });

            // Calculate completion based on indicators
            const positiveIndicators = ['complete', 'finished', 'installed', 'approved', 'tested'];
            const negativeIndicators = ['started', 'in-progress', 'partial'];

            let positiveScore = 0;
            let negativeScore = 0;

            completionIndicators.forEach(indicator => {
                if (positiveIndicators.some(pos => indicator.includes(pos))) {
                    positiveScore += 1;
                } else if (negativeIndicators.some(neg => indicator.includes(neg))) {
                    negativeScore += 1;
                }
            });

            // Calculate percentage estimate
            if (positiveScore + negativeScore > 0) {
                estimation.percentage = Math.round(
                    (positiveScore / (positiveScore + negativeScore)) * 100
                );
                estimation.confidence = positiveScore > 2 ? 'high' : 'medium';
            } else {
                // Fallback to basic analysis
                estimation.percentage = photoAnalyses.length > 0 ? 25 : 0; // Basic assumption
                estimation.confidence = 'low';
            }

            // Add factors that influenced the estimation
            estimation.factors = [
                { type: 'positive-indicators', count: positiveScore },
                { type: 'negative-indicators', count: negativeScore },
                { type: 'total-photos', count: photoAnalyses.length },
                { type: 'phases-detected', count: Object.keys(phaseAnalysis).length }
            ];

        } catch (error) {
            console.error('Completion estimation error:', error);
            estimation.error = error.message;
        }

        return estimation;
    }

    generateProgressRecommendations(analysis) {
        const recommendations = [];

        try {
            // Quality-based recommendations
            if (analysis.qualityAssessment.overallAssessment === 'needs-improvement') {
                recommendations.push({
                    type: 'quality-improvement',
                    priority: 'high',
                    message: 'Improve photo quality for better progress tracking',
                    actions: [
                        'Use better lighting conditions',
                        'Ensure camera is steady and focused',
                        'Take photos from multiple angles',
                        'Include reference objects for scale'
                    ]
                });
            }

            // Documentation recommendations
            if (analysis.photos < 3) {
                recommendations.push({
                    type: 'documentation',
                    priority: 'medium',
                    message: 'Consider taking more photos for comprehensive documentation',
                    actions: [
                        'Document before and after states',
                        'Capture different angles and details',
                        'Include overview and close-up shots'
                    ]
                });
            }

            // Completion-based recommendations
            if (analysis.completionEstimate && analysis.completionEstimate.percentage > 80) {
                recommendations.push({
                    type: 'completion',
                    priority: 'low',
                    message: 'Task appears near completion - prepare for next phase',
                    actions: [
                        'Schedule quality inspection',
                        'Prepare for next construction phase',
                        'Update project timeline'
                    ]
                });
            }

        } catch (error) {
            console.error('Recommendation generation error:', error);
        }

        return recommendations;
    }

    identifyProgressIssues(analysis) {
        const issues = [];

        try {
            // Aggregate issues from individual photos
            if (analysis.qualityAssessment.commonIssues) {
                analysis.qualityAssessment.commonIssues.forEach(issue => {
                    if (issue.severity === 'high') {
                        issues.push({
                            type: 'quality-concern',
                            severity: issue.severity,
                            message: `Recurring ${issue.type} issues in progress photos`,
                            frequency: issue.frequency,
                            impact: 'May affect progress assessment accuracy'
                        });
                    }
                });
            }

            // Timeline issues
            if (analysis.completionEstimate && 
                analysis.completionEstimate.confidence === 'low') {
                issues.push({
                    type: 'assessment-uncertainty',
                    severity: 'medium',
                    message: 'Low confidence in progress estimation',
                    impact: 'May require manual review or additional documentation'
                });
            }

        } catch (error) {
            console.error('Issue identification error:', error);
        }

        return issues;
    }

    suggestNextSteps(analysis) {
        const nextSteps = [];

        try {
            // Based on completion estimate
            if (analysis.completionEstimate) {
                const completion = analysis.completionEstimate.percentage;
                
                if (completion < 25) {
                    nextSteps.push('Continue with current construction phase');
                    nextSteps.push('Monitor progress with regular photo documentation');
                } else if (completion < 75) {
                    nextSteps.push('Focus on completing current tasks');
                    nextSteps.push('Address any quality issues identified');
                } else if (completion < 95) {
                    nextSteps.push('Prepare for quality inspection');
                    nextSteps.push('Address any remaining deficiencies');
                } else {
                    nextSteps.push('Schedule final inspection');
                    nextSteps.push('Prepare to move to next construction phase');
                }
            }

            // Based on quality assessment
            if (analysis.qualityAssessment.overallAssessment === 'needs-improvement') {
                nextSteps.push('Improve documentation quality for better tracking');
            }

            // Based on identified issues
            if (analysis.issues.length > 0) {
                const highPriorityIssues = analysis.issues
                    .filter(issue => issue.severity === 'high');
                    
                if (highPriorityIssues.length > 0) {
                    nextSteps.push('Address high-priority documentation issues');
                }
            }

        } catch (error) {
            console.error('Next steps generation error:', error);
        }

        return nextSteps;
    }

    async getProgressHistory(taskId) {
        const history = this.progressDatabase.get(taskId);
        return history || null;
    }

    async generateProgressReport(projectId, timeframe = '7days') {
        // This would generate a comprehensive progress report
        // for the project over the specified timeframe
        
        const report = {
            projectId,
            timeframe,
            generatedAt: new Date().toISOString(),
            summary: {},
            tasks: [],
            recommendations: [],
            trends: {}
        };

        // Implementation would aggregate all task analyses
        // and generate project-level insights

        return report;
    }
}

module.exports = ProgressAnalyzer;