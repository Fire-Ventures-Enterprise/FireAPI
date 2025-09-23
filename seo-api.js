/**
 * Custom SEO API Suite for FireAPI.dev
 * 
 * Comprehensive SEO monitoring and analysis APIs:
 * 1. Keyword Rank Tracker - Google SERP position monitoring
 * 2. Competitor Analysis - Site structure & content monitoring  
 * 3. Backlink Monitor - Quality backlink tracking
 * 4. Technical SEO Audit - Site health & optimization
 * 
 * Integration: Perfect for Lovable projects needing real-time SEO data
 */

const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const UserAgent = require('user-agents');

class SEOAPIService {
    constructor() {
        this.userAgent = new UserAgent({ deviceCategory: 'desktop' });
        this.browser = null;
        this.page = null;
        
        // Rate limiting storage
        this.rateLimits = new Map();
        
        // Cache for temporary data storage
        this.cache = new Map();
        
        // Historical data storage (would connect to actual DB in production)
        this.historicalData = new Map();
    }

    async initBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--window-size=1920x1080'
                ]
            });
        }
        
        if (!this.page) {
            this.page = await this.browser.newPage();
            await this.page.setUserAgent(this.userAgent.toString());
            await this.page.setViewport({ width: 1920, height: 1080 });
        }
        
        return this.page;
    }

    async closeBrowser() {
        if (this.page) {
            await this.page.close();
            this.page = null;
        }
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    // Rate limiting middleware
    checkRateLimit(endpoint, limit = 10, windowMs = 15 * 60 * 1000) {
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
     * KEYWORD RANK TRACKER API
     * Track Google SERP positions for your keywords
     */
    async trackKeywordRankings(domain, keywords, location = 'canada', options = {}) {
        this.checkRateLimit('keyword_tracking', 5, 15 * 60 * 1000); // 5 requests per 15 min

        const page = await this.initBrowser();
        const results = [];

        for (const keyword of keywords) {
            try {
                console.log(`Tracking keyword: ${keyword} for domain: ${domain}`);
                
                // Build Google search URL with location
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&gl=${location}&hl=en&num=100`;
                
                await page.goto(searchUrl, { 
                    waitUntil: 'networkidle2',
                    timeout: 30000 
                });

                // Wait for search results to load
                await page.waitForSelector('div[data-async-context]', { timeout: 10000 });

                // Extract search results
                const searchResults = await page.evaluate((targetDomain) => {
                    const results = [];
                    const resultElements = document.querySelectorAll('div.g');
                    
                    resultElements.forEach((element, index) => {
                        const titleElement = element.querySelector('h3');
                        const linkElement = element.querySelector('a');
                        const snippetElement = element.querySelector('.VwiC3b, .s3v9rd');
                        
                        if (titleElement && linkElement) {
                            const url = linkElement.href;
                            const title = titleElement.textContent;
                            const snippet = snippetElement ? snippetElement.textContent : '';
                            const position = index + 1;
                            
                            results.push({
                                position,
                                url,
                                title,
                                snippet,
                                domain: new URL(url).hostname,
                                isTarget: url.includes(targetDomain)
                            });
                        }
                    });
                    
                    return results;
                }, domain);

                // Find target domain position
                const targetResult = searchResults.find(result => result.isTarget);
                const position = targetResult ? targetResult.position : null;

                // Get top 10 competitors
                const competitors = searchResults
                    .filter(result => !result.isTarget)
                    .slice(0, 10)
                    .map(result => ({
                        position: result.position,
                        domain: result.domain,
                        title: result.title,
                        url: result.url
                    }));

                const keywordData = {
                    keyword,
                    domain,
                    position,
                    searchVolume: await this.estimateSearchVolume(keyword),
                    difficulty: await this.estimateKeywordDifficulty(keyword, competitors),
                    competitors,
                    serp: searchResults.slice(0, 10),
                    location,
                    timestamp: new Date().toISOString(),
                    trends: this.getKeywordTrends(keyword)
                };

                results.push(keywordData);

                // Store historical data
                const historyKey = `${domain}_${keyword}`;
                if (!this.historicalData.has(historyKey)) {
                    this.historicalData.set(historyKey, []);
                }
                this.historicalData.get(historyKey).push({
                    position,
                    timestamp: new Date().toISOString(),
                    competitors: competitors.length
                });

                // Random delay to avoid detection
                await page.waitForTimeout(Math.random() * 2000 + 1000);

            } catch (error) {
                console.error(`Error tracking keyword ${keyword}:`, error);
                results.push({
                    keyword,
                    domain,
                    position: null,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        return {
            success: true,
            domain,
            location,
            totalKeywords: keywords.length,
            tracked: results.filter(r => r.position !== null).length,
            results,
            summary: this.generateRankingSummary(results),
            historical: this.getHistoricalSummary(domain, keywords)
        };
    }

    async estimateSearchVolume(keyword) {
        // Simplified search volume estimation based on keyword characteristics
        const baseVolume = keyword.length < 15 ? 1000 : 500;
        const wordCount = keyword.split(' ').length;
        const multiplier = wordCount === 1 ? 2 : wordCount === 2 ? 1.5 : 1;
        
        return Math.floor(baseVolume * multiplier * (0.5 + Math.random() * 0.5));
    }

    async estimateKeywordDifficulty(keyword, competitors) {
        // Difficulty based on competitor domain authority estimation
        const highAuthorityDomains = ['wikipedia.org', 'amazon.com', 'homedepot.com', 'lowes.com'];
        const mediumAuthorityDomains = competitors.map(c => c.domain);
        
        let difficulty = 30; // Base difficulty
        
        competitors.forEach(competitor => {
            if (highAuthorityDomains.some(domain => competitor.domain.includes(domain))) {
                difficulty += 15;
            } else if (competitor.domain.length < 15) {
                difficulty += 5; // Likely established domain
            }
        });
        
        return Math.min(100, difficulty);
    }

    getKeywordTrends(keyword) {
        // Simulate trending data (would integrate with Google Trends API in production)
        const trends = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            trends.push({
                month: date.toISOString().substr(0, 7),
                interest: Math.floor(Math.random() * 100)
            });
        }
        return trends;
    }

    generateRankingSummary(results) {
        const ranked = results.filter(r => r.position !== null);
        const topTen = ranked.filter(r => r.position <= 10);
        const topThree = ranked.filter(r => r.position <= 3);
        
        return {
            totalTracked: results.length,
            ranked: ranked.length,
            topTen: topTen.length,
            topThree: topThree.length,
            averagePosition: ranked.length > 0 ? 
                Math.round(ranked.reduce((sum, r) => sum + r.position, 0) / ranked.length) : null,
            unranked: results.length - ranked.length
        };
    }

    getHistoricalSummary(domain, keywords) {
        const summary = {};
        keywords.forEach(keyword => {
            const historyKey = `${domain}_${keyword}`;
            const history = this.historicalData.get(historyKey) || [];
            
            if (history.length > 1) {
                const latest = history[history.length - 1];
                const previous = history[history.length - 2];
                
                summary[keyword] = {
                    currentPosition: latest.position,
                    previousPosition: previous.position,
                    change: previous.position && latest.position ? 
                        previous.position - latest.position : 0,
                    trend: this.calculateTrend(history)
                };
            }
        });
        
        return summary;
    }

    calculateTrend(history) {
        if (history.length < 3) return 'insufficient_data';
        
        const recent = history.slice(-3);
        const positions = recent.map(h => h.position).filter(p => p !== null);
        
        if (positions.length < 2) return 'no_rankings';
        
        const firstPos = positions[0];
        const lastPos = positions[positions.length - 1];
        
        if (lastPos < firstPos) return 'improving';
        if (lastPos > firstPos) return 'declining';
        return 'stable';
    }

    /**
     * COMPETITOR ANALYSIS API
     * Monitor competitor sites for content, structure, and SEO changes
     */
    async analyzeCompetitors(targetDomain, competitorDomains, options = {}) {
        this.checkRateLimit('competitor_analysis', 3, 15 * 60 * 1000);

        const page = await this.initBrowser();
        const results = [];

        for (const domain of competitorDomains) {
            try {
                console.log(`Analyzing competitor: ${domain}`);
                
                const analysis = await this.analyzeCompetitorSite(page, domain, targetDomain, options);
                results.push(analysis);
                
                await page.waitForTimeout(Math.random() * 3000 + 2000);
                
            } catch (error) {
                console.error(`Error analyzing competitor ${domain}:`, error);
                results.push({
                    domain,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        return {
            success: true,
            targetDomain,
            competitorCount: competitorDomains.length,
            results,
            comparative: this.generateCompetitiveAnalysis(results, targetDomain)
        };
    }

    async analyzeCompetitorSite(page, domain, targetDomain, options) {
        const url = `https://${domain}`;
        
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        // Extract comprehensive site data
        const siteData = await page.evaluate(() => {
            const data = {
                title: document.title,
                description: '',
                keywords: '',
                h1Tags: [],
                h2Tags: [],
                h3Tags: [],
                images: [],
                links: [],
                schema: [],
                loadTime: performance.now(),
                technologies: []
            };

            // Meta tags
            const metaTags = document.querySelectorAll('meta');
            metaTags.forEach(tag => {
                const name = tag.getAttribute('name') || tag.getAttribute('property');
                const content = tag.getAttribute('content');
                
                if (name === 'description') data.description = content;
                if (name === 'keywords') data.keywords = content;
            });

            // Heading tags
            document.querySelectorAll('h1').forEach(h => data.h1Tags.push(h.textContent.trim()));
            document.querySelectorAll('h2').forEach(h => data.h2Tags.push(h.textContent.trim()));
            document.querySelectorAll('h3').forEach(h => data.h3Tags.push(h.textContent.trim()));

            // Images with alt text
            document.querySelectorAll('img').forEach(img => {
                data.images.push({
                    src: img.src,
                    alt: img.alt || '',
                    title: img.title || ''
                });
            });

            // Internal and external links
            document.querySelectorAll('a[href]').forEach(link => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('#') && !href.startsWith('mailto:')) {
                    data.links.push({
                        url: href,
                        text: link.textContent.trim(),
                        isExternal: href.startsWith('http') && !href.includes(window.location.hostname)
                    });
                }
            });

            // JSON-LD Schema
            document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
                try {
                    const schema = JSON.parse(script.textContent);
                    data.schema.push(schema);
                } catch (e) {
                    // Invalid JSON-LD
                }
            });

            // Technology detection (basic)
            if (window.jQuery) data.technologies.push('jQuery');
            if (window.React) data.technologies.push('React');
            if (window.Vue) data.technologies.push('Vue');
            if (window.angular) data.technologies.push('Angular');
            if (document.querySelector('script[src*="shopify"]')) data.technologies.push('Shopify');
            if (document.querySelector('script[src*="wordpress"]')) data.technologies.push('WordPress');

            return data;
        });

        // Technical SEO analysis
        const technicalSEO = await this.analyzeTechnicalSEO(page, domain);
        
        // Content analysis
        const contentAnalysis = await this.analyzeContent(page, siteData);
        
        // Performance metrics
        const performance = await page.metrics();

        return {
            domain,
            url,
            timestamp: new Date().toISOString(),
            seo: {
                title: siteData.title,
                titleLength: siteData.title ? siteData.title.length : 0,
                description: siteData.description,
                descriptionLength: siteData.description ? siteData.description.length : 0,
                hasH1: siteData.h1Tags.length > 0,
                h1Count: siteData.h1Tags.length,
                h2Count: siteData.h2Tags.length,
                h3Count: siteData.h3Tags.length,
                imageCount: siteData.images.length,
                imagesWithAlt: siteData.images.filter(img => img.alt).length,
                internalLinks: siteData.links.filter(link => !link.isExternal).length,
                externalLinks: siteData.links.filter(link => link.isExternal).length,
                schemaTypes: siteData.schema.map(s => s['@type']).filter(Boolean)
            },
            content: contentAnalysis,
            technical: technicalSEO,
            performance: {
                loadTime: performance.ScriptDuration + performance.LayoutDuration,
                jsExecutionTime: performance.ScriptDuration,
                memoryUsage: performance.JSHeapUsedSize,
                domElements: await page.$$eval('*', elements => elements.length)
            },
            technologies: siteData.technologies,
            competitive: {
                strengthScore: this.calculateCompetitiveStrength(siteData, technicalSEO),
                weaknesses: this.identifyWeaknesses(siteData, technicalSEO),
                opportunities: this.identifyOpportunities(siteData, technicalSEO)
            }
        };
    }

    async analyzeTechnicalSEO(page, domain) {
        const technicalChecks = {
            httpsEnabled: page.url().startsWith('https://'),
            hasRobotsTxt: false,
            hasSitemap: false,
            mobileFriendly: false,
            pageSpeed: null,
            canonicalUrl: null,
            openGraphTags: {},
            twitterCardTags: {},
            structuredData: false
        };

        // Check robots.txt
        try {
            const robotsResponse = await page.goto(`https://${domain}/robots.txt`, { timeout: 10000 });
            technicalChecks.hasRobotsTxt = robotsResponse.status() === 200;
        } catch (e) {
            technicalChecks.hasRobotsTxt = false;
        }

        // Check sitemap
        try {
            const sitemapResponse = await page.goto(`https://${domain}/sitemap.xml`, { timeout: 10000 });
            technicalChecks.hasSitemap = sitemapResponse.status() === 200;
        } catch (e) {
            technicalChecks.hasSitemap = false;
        }

        // Go back to main page for other checks
        await page.goto(`https://${domain}`, { waitUntil: 'networkidle2' });

        // Check meta tags and technical elements
        const metaData = await page.evaluate(() => {
            const meta = {
                canonical: '',
                viewport: '',
                openGraph: {},
                twitterCard: {},
                hasStructuredData: false
            };

            // Canonical URL
            const canonical = document.querySelector('link[rel="canonical"]');
            if (canonical) meta.canonical = canonical.href;

            // Viewport
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) meta.viewport = viewport.content;

            // Open Graph tags
            document.querySelectorAll('meta[property^="og:"]').forEach(tag => {
                const property = tag.getAttribute('property');
                meta.openGraph[property] = tag.getAttribute('content');
            });

            // Twitter Card tags
            document.querySelectorAll('meta[name^="twitter:"]').forEach(tag => {
                const name = tag.getAttribute('name');
                meta.twitterCard[name] = tag.getAttribute('content');
            });

            // Structured data check
            meta.hasStructuredData = document.querySelectorAll('script[type="application/ld+json"]').length > 0;

            return meta;
        });

        // Mobile-friendly check (simplified)
        technicalChecks.mobileFriendly = metaData.viewport.includes('width=device-width');
        technicalChecks.canonicalUrl = metaData.canonical;
        technicalChecks.openGraphTags = metaData.openGraph;
        technicalChecks.twitterCardTags = metaData.twitterCard;
        technicalChecks.structuredData = metaData.hasStructuredData;

        return technicalChecks;
    }

    async analyzeContent(page, siteData) {
        return {
            wordCount: await page.evaluate(() => {
                const text = document.body.innerText || '';
                return text.split(/\s+/).filter(word => word.length > 0).length;
            }),
            readabilityScore: this.calculateReadabilityScore(siteData.h1Tags.concat(siteData.h2Tags)),
            keywordDensity: this.analyzeKeywordDensity(siteData.title + ' ' + siteData.description),
            headingStructure: {
                h1Count: siteData.h1Tags.length,
                h2Count: siteData.h2Tags.length,
                h3Count: siteData.h3Tags.length,
                properStructure: siteData.h1Tags.length === 1 && siteData.h2Tags.length > 0
            },
            contentGaps: this.identifyContentGaps(siteData),
            topKeywords: this.extractTopKeywords(siteData.title + ' ' + siteData.description)
        };
    }

    calculateReadabilityScore(headings) {
        const text = headings.join(' ');
        const words = text.split(/\s+/).length;
        const sentences = text.split(/[.!?]+/).length;
        
        if (sentences === 0) return 0;
        
        const avgWordsPerSentence = words / sentences;
        
        // Simplified Flesch Reading Ease approximation
        return Math.max(0, Math.min(100, 206.835 - (1.015 * avgWordsPerSentence)));
    }

    analyzeKeywordDensity(text) {
        const words = text.toLowerCase().split(/\s+/);
        const density = {};
        
        words.forEach(word => {
            if (word.length > 3) {
                density[word] = (density[word] || 0) + 1;
            }
        });
        
        const total = words.length;
        const topKeywords = Object.entries(density)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word, count]) => ({
                word,
                count,
                density: ((count / total) * 100).toFixed(2)
            }));
            
        return topKeywords;
    }

    identifyContentGaps(siteData) {
        const gaps = [];
        
        if (!siteData.description || siteData.description.length < 120) {
            gaps.push('Meta description too short or missing');
        }
        
        if (siteData.h1Tags.length === 0) {
            gaps.push('No H1 tag found');
        }
        
        if (siteData.h1Tags.length > 1) {
            gaps.push('Multiple H1 tags found');
        }
        
        if (siteData.images.length > 0) {
            const missingAlt = siteData.images.length - siteData.images.filter(img => img.alt).length;
            if (missingAlt > 0) {
                gaps.push(`${missingAlt} images missing alt text`);
            }
        }
        
        return gaps;
    }

    extractTopKeywords(text) {
        // Simple keyword extraction (would use NLP in production)
        return this.analyzeKeywordDensity(text).slice(0, 5).map(k => k.word);
    }

    calculateCompetitiveStrength(siteData, technicalSEO) {
        let score = 0;
        
        // SEO basics (40 points)
        if (siteData.title && siteData.title.length >= 30) score += 10;
        if (siteData.description && siteData.description.length >= 120) score += 10;
        if (siteData.h1Tags.length === 1) score += 10;
        if (siteData.h2Tags.length > 0) score += 10;
        
        // Technical SEO (30 points)
        if (technicalSEO.httpsEnabled) score += 10;
        if (technicalSEO.hasRobotsTxt) score += 5;
        if (technicalSEO.hasSitemap) score += 5;
        if (technicalSEO.mobileFriendly) score += 10;
        
        // Content quality (30 points)
        if (siteData.images.filter(img => img.alt).length > 0) score += 10;
        if (siteData.schema.length > 0) score += 10;
        if (siteData.links.filter(link => !link.isExternal).length > 5) score += 10;
        
        return Math.min(100, score);
    }

    identifyWeaknesses(siteData, technicalSEO) {
        const weaknesses = [];
        
        if (!technicalSEO.httpsEnabled) weaknesses.push('Not using HTTPS');
        if (!technicalSEO.hasSitemap) weaknesses.push('Missing XML sitemap');
        if (!technicalSEO.mobileFriendly) weaknesses.push('Not mobile-friendly');
        if (siteData.h1Tags.length === 0) weaknesses.push('No H1 tag');
        if (siteData.h1Tags.length > 1) weaknesses.push('Multiple H1 tags');
        if (!siteData.description) weaknesses.push('Missing meta description');
        if (siteData.schema.length === 0) weaknesses.push('No structured data');
        
        return weaknesses;
    }

    identifyOpportunities(siteData, technicalSEO) {
        const opportunities = [];
        
        if (siteData.images.length > siteData.images.filter(img => img.alt).length) {
            opportunities.push('Optimize image alt texts');
        }
        if (siteData.h2Tags.length < 3) {
            opportunities.push('Improve content structure with more H2 headings');
        }
        if (Object.keys(technicalSEO.openGraphTags).length < 3) {
            opportunities.push('Add more Open Graph tags for social sharing');
        }
        if (!technicalSEO.canonicalUrl) {
            opportunities.push('Add canonical URLs');
        }
        
        return opportunities;
    }

    generateCompetitiveAnalysis(results, targetDomain) {
        const validResults = results.filter(r => !r.error);
        
        if (validResults.length === 0) {
            return { error: 'No valid competitor data' };
        }
        
        const scores = validResults.map(r => r.competitive.strengthScore);
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        
        return {
            competitorCount: validResults.length,
            averageCompetitorScore: Math.round(avgScore),
            topCompetitor: validResults.reduce((top, current) => 
                current.competitive.strengthScore > (top?.competitive?.strengthScore || 0) ? current : top
            ),
            commonWeaknesses: this.findCommonWeaknesses(validResults),
            marketGaps: this.identifyMarketGaps(validResults),
            recommendations: this.generateRecommendations(validResults, avgScore)
        };
    }

    findCommonWeaknesses(results) {
        const weaknessCount = {};
        
        results.forEach(result => {
            result.competitive.weaknesses.forEach(weakness => {
                weaknessCount[weakness] = (weaknessCount[weakness] || 0) + 1;
            });
        });
        
        return Object.entries(weaknessCount)
            .filter(([weakness, count]) => count >= results.length * 0.5)
            .map(([weakness, count]) => ({
                weakness,
                prevalence: Math.round((count / results.length) * 100)
            }));
    }

    identifyMarketGaps(results) {
        const gaps = [];
        
        // Look for features few competitors have
        const technicalFeatures = ['hasSitemap', 'structuredData', 'httpsEnabled'];
        
        technicalFeatures.forEach(feature => {
            const withFeature = results.filter(r => r.technical[feature]).length;
            const percentage = (withFeature / results.length) * 100;
            
            if (percentage < 70) {
                gaps.push({
                    opportunity: feature,
                    competitorAdoption: Math.round(percentage),
                    potentialAdvantage: 'high'
                });
            }
        });
        
        return gaps;
    }

    generateRecommendations(results, avgScore) {
        const recommendations = [];
        
        if (avgScore < 60) {
            recommendations.push({
                priority: 'high',
                action: 'Basic SEO implementation can provide significant competitive advantage',
                impact: 'high'
            });
        }
        
        const commonGaps = this.findCommonWeaknesses(results);
        commonGaps.forEach(gap => {
            if (gap.prevalence > 70) {
                recommendations.push({
                    priority: 'medium',
                    action: `Address "${gap.weakness}" - ${gap.prevalence}% of competitors have this issue`,
                    impact: 'medium'
                });
            }
        });
        
        return recommendations;
    }

    /**
     * BACKLINK MONITOR API
     * Track quality backlinks and referring domains
     */
    async monitorBacklinks(domain, options = {}) {
        this.checkRateLimit('backlink_monitor', 2, 15 * 60 * 1000);

        try {
            console.log(`Monitoring backlinks for: ${domain}`);
            
            // Simulate backlink data (would integrate with actual backlink APIs)
            const backlinks = await this.simulateBacklinkData(domain);
            
            const analysis = {
                domain,
                timestamp: new Date().toISOString(),
                totalBacklinks: backlinks.length,
                referringDomains: [...new Set(backlinks.map(bl => bl.referringDomain))].length,
                qualityScore: this.calculateBacklinkQualityScore(backlinks),
                backlinks: backlinks.slice(0, 50), // Return top 50
                qualityDistribution: this.analyzeBacklinkQuality(backlinks),
                anchorTextAnalysis: this.analyzeAnchorTexts(backlinks),
                newBacklinks: this.getNewBacklinks(domain, backlinks),
                lostBacklinks: this.getLostBacklinks(domain),
                opportunities: this.identifyBacklinkOpportunities(backlinks)
            };
            
            return {
                success: true,
                ...analysis
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                domain,
                timestamp: new Date().toISOString()
            };
        }
    }

    async simulateBacklinkData(domain) {
        // In production, this would call actual backlink APIs
        const simulatedBacklinks = [
            {
                url: `https://example-blog.com/flooring-guide`,
                referringDomain: 'example-blog.com',
                anchorText: 'quality flooring Toronto',
                domainAuthority: 65,
                pageAuthority: 45,
                followType: 'dofollow',
                firstSeen: '2024-08-15',
                lastSeen: '2024-09-20',
                linkType: 'contextual',
                surrounding: 'Looking for quality flooring in Toronto? Check out this comprehensive guide...'
            },
            {
                url: `https://home-improvement.ca/reviews/${domain}`,
                referringDomain: 'home-improvement.ca',
                anchorText: domain,
                domainAuthority: 58,
                pageAuthority: 52,
                followType: 'dofollow',
                firstSeen: '2024-07-22',
                lastSeen: '2024-09-21',
                linkType: 'citation',
                surrounding: `${domain} offers excellent flooring solutions with professional installation...`
            },
            {
                url: 'https://construction-directory.com/flooring',
                referringDomain: 'construction-directory.com',
                anchorText: 'Toronto flooring specialists',
                domainAuthority: 42,
                pageAuthority: 38,
                followType: 'nofollow',
                firstSeen: '2024-06-10',
                lastSeen: '2024-09-19',
                linkType: 'directory',
                surrounding: 'Directory of trusted flooring contractors in the Toronto area...'
            }
        ];
        
        return simulatedBacklinks;
    }

    calculateBacklinkQualityScore(backlinks) {
        if (backlinks.length === 0) return 0;
        
        const totalScore = backlinks.reduce((sum, backlink) => {
            let score = 0;
            
            // Domain Authority weight (40%)
            score += (backlink.domainAuthority / 100) * 40;
            
            // Follow type weight (30%)
            score += backlink.followType === 'dofollow' ? 30 : 10;
            
            // Link type weight (20%)
            const linkTypeScores = { contextual: 20, citation: 15, directory: 5 };
            score += linkTypeScores[backlink.linkType] || 5;
            
            // Anchor text relevance (10%)
            score += backlink.anchorText.includes(domain) ? 5 : 10;
            
            return sum + score;
        }, 0);
        
        return Math.round(totalScore / backlinks.length);
    }

    analyzeBacklinkQuality(backlinks) {
        const distribution = {
            high: backlinks.filter(bl => bl.domainAuthority >= 60).length,
            medium: backlinks.filter(bl => bl.domainAuthority >= 30 && bl.domainAuthority < 60).length,
            low: backlinks.filter(bl => bl.domainAuthority < 30).length,
            dofollow: backlinks.filter(bl => bl.followType === 'dofollow').length,
            nofollow: backlinks.filter(bl => bl.followType === 'nofollow').length
        };
        
        distribution.total = backlinks.length;
        return distribution;
    }

    analyzeAnchorTexts(backlinks) {
        const anchors = {};
        
        backlinks.forEach(backlink => {
            const anchor = backlink.anchorText.toLowerCase();
            anchors[anchor] = (anchors[anchor] || 0) + 1;
        });
        
        return Object.entries(anchors)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([anchor, count]) => ({
                anchorText: anchor,
                count,
                percentage: Math.round((count / backlinks.length) * 100)
            }));
    }

    getNewBacklinks(domain, currentBacklinks) {
        const historyKey = `backlinks_${domain}`;
        const previousBacklinks = this.historicalData.get(historyKey) || [];
        
        const previousUrls = new Set(previousBacklinks.map(bl => bl.url));
        const newBacklinks = currentBacklinks.filter(bl => !previousUrls.has(bl.url));
        
        // Store current backlinks for next comparison
        this.historicalData.set(historyKey, currentBacklinks);
        
        return newBacklinks.map(bl => ({
            url: bl.url,
            referringDomain: bl.referringDomain,
            domainAuthority: bl.domainAuthority,
            anchorText: bl.anchorText,
            quality: bl.domainAuthority >= 50 ? 'high' : bl.domainAuthority >= 30 ? 'medium' : 'low'
        }));
    }

    getLostBacklinks(domain) {
        // Simulate lost backlinks (in production, compare with previous crawl data)
        return [
            {
                url: 'https://old-directory.com/flooring',
                referringDomain: 'old-directory.com',
                lostDate: '2024-09-15',
                reason: 'Site restructure'
            }
        ];
    }

    identifyBacklinkOpportunities(backlinks) {
        const opportunities = [];
        
        // Find domains linking to competitors but not to target
        const referringDomains = [...new Set(backlinks.map(bl => bl.referringDomain))];
        
        if (referringDomains.length < 10) {
            opportunities.push({
                type: 'directory_submissions',
                description: 'Submit to industry directories for easy backlinks',
                priority: 'high',
                effort: 'low'
            });
        }
        
        const contextualLinks = backlinks.filter(bl => bl.linkType === 'contextual').length;
        if (contextualLinks < backlinks.length * 0.3) {
            opportunities.push({
                type: 'guest_posting',
                description: 'Increase contextual backlinks through guest posting',
                priority: 'high',
                effort: 'medium'
            });
        }
        
        return opportunities;
    }

    /**
     * TECHNICAL SEO AUDIT API
     * Comprehensive site health and optimization analysis
     */
    async auditTechnicalSEO(domain, options = {}) {
        this.checkRateLimit('technical_audit', 2, 15 * 60 * 1000);

        const page = await this.initBrowser();
        
        try {
            console.log(`Running technical SEO audit for: ${domain}`);
            
            const audit = {
                domain,
                timestamp: new Date().toISOString(),
                crawlability: await this.auditCrawlability(page, domain),
                performance: await this.auditPerformance(page, domain),
                mobileOptimization: await this.auditMobileOptimization(page, domain),
                security: await this.auditSecurity(page, domain),
                structuredData: await this.auditStructuredData(page, domain),
                accessibility: await this.auditAccessibility(page, domain),
                overallScore: 0,
                recommendations: []
            };
            
            // Calculate overall score and generate recommendations
            audit.overallScore = this.calculateTechnicalScore(audit);
            audit.recommendations = this.generateTechnicalRecommendations(audit);
            
            return {
                success: true,
                ...audit
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                domain,
                timestamp: new Date().toISOString()
            };
        }
    }

    async auditCrawlability(page, domain) {
        const crawlability = {
            robotsTxt: { exists: false, errors: [] },
            sitemap: { exists: false, urls: 0, errors: [] },
            internalLinking: { depth: 0, orphanPages: 0 },
            canonicalization: { issues: [] },
            redirects: { chains: [], loops: [] }
        };

        // Check robots.txt
        try {
            const robotsResponse = await page.goto(`https://${domain}/robots.txt`);
            crawlability.robotsTxt.exists = robotsResponse.status() === 200;
            
            if (crawlability.robotsTxt.exists) {
                const robotsContent = await page.content();
                // Basic robots.txt validation
                if (!robotsContent.includes('User-agent:')) {
                    crawlability.robotsTxt.errors.push('Invalid robots.txt format');
                }
            }
        } catch (e) {
            crawlability.robotsTxt.errors.push('Cannot access robots.txt');
        }

        // Check sitemap
        try {
            const sitemapResponse = await page.goto(`https://${domain}/sitemap.xml`);
            crawlability.sitemap.exists = sitemapResponse.status() === 200;
            
            if (crawlability.sitemap.exists) {
                const sitemapContent = await page.content();
                const urlMatches = sitemapContent.match(/<url>/g);
                crawlability.sitemap.urls = urlMatches ? urlMatches.length : 0;
            }
        } catch (e) {
            crawlability.sitemap.errors.push('Cannot access sitemap.xml');
        }

        return crawlability;
    }

    async auditPerformance(page, domain) {
        await page.goto(`https://${domain}`, { waitUntil: 'networkidle2' });
        
        const metrics = await page.metrics();
        const performanceEntries = await page.evaluate(() => {
            return JSON.stringify(performance.getEntriesByType('navigation'));
        });
        
        const navigation = JSON.parse(performanceEntries)[0] || {};
        
        return {
            loadTime: navigation.loadEventEnd - navigation.fetchStart || 0,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart || 0,
            firstContentfulPaint: metrics.FirstContentfulPaint || 0,
            jsExecutionTime: metrics.ScriptDuration || 0,
            memoryUsage: metrics.JSHeapUsedSize || 0,
            recommendations: this.generatePerformanceRecommendations(metrics, navigation)
        };
    }

    generatePerformanceRecommendations(metrics, navigation) {
        const recommendations = [];
        
        if (navigation.loadEventEnd - navigation.fetchStart > 3000) {
            recommendations.push('Page load time exceeds 3 seconds - optimize images and scripts');
        }
        
        if (metrics.ScriptDuration > 1000) {
            recommendations.push('JavaScript execution time is high - consider code splitting');
        }
        
        if (metrics.JSHeapUsedSize > 50 * 1024 * 1024) {
            recommendations.push('Memory usage is high - check for memory leaks');
        }
        
        return recommendations;
    }

    async auditMobileOptimization(page, domain) {
        await page.goto(`https://${domain}`, { waitUntil: 'networkidle2' });
        
        const mobileCheck = await page.evaluate(() => {
            const viewport = document.querySelector('meta[name="viewport"]');
            const flexibleImages = Array.from(document.querySelectorAll('img')).every(img => 
                img.style.maxWidth === '100%' || 
                getComputedStyle(img).maxWidth === '100%' ||
                img.hasAttribute('responsive')
            );
            
            return {
                hasViewportMeta: !!viewport,
                viewportContent: viewport ? viewport.content : '',
                responsiveImages: flexibleImages,
                touchTargets: document.querySelectorAll('button, a, input').length
            };
        });
        
        // Test mobile viewport
        await page.setViewport({ width: 375, height: 667 });
        await page.reload({ waitUntil: 'networkidle2' });
        
        const mobileLayout = await page.evaluate(() => {
            return {
                horizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
                readableText: getComputedStyle(document.body).fontSize,
                tapTargetSize: 'calculated' // Would implement proper touch target size check
            };
        });
        
        return {
            ...mobileCheck,
            ...mobileLayout,
            score: this.calculateMobileScore(mobileCheck, mobileLayout)
        };
    }

    calculateMobileScore(mobileCheck, mobileLayout) {
        let score = 0;
        
        if (mobileCheck.hasViewportMeta) score += 25;
        if (mobileCheck.viewportContent.includes('width=device-width')) score += 25;
        if (mobileCheck.responsiveImages) score += 25;
        if (!mobileLayout.horizontalScroll) score += 25;
        
        return score;
    }

    async auditSecurity(page, domain) {
        await page.goto(`https://${domain}`, { waitUntil: 'networkidle2' });
        
        const securityHeaders = await page.evaluate(() => {
            // Can't directly access response headers from page context
            // This would typically be done server-side
            return {
                https: location.protocol === 'https:',
                mixedContent: Array.from(document.querySelectorAll('script, link, img')).some(el => 
                    el.src && el.src.startsWith('http://'))
            };
        });
        
        return {
            httpsEnabled: securityHeaders.https,
            hasMixedContent: securityHeaders.mixedContent,
            securityScore: securityHeaders.https && !securityHeaders.mixedContent ? 100 : 50
        };
    }

    async auditStructuredData(page, domain) {
        await page.goto(`https://${domain}`, { waitUntil: 'networkidle2' });
        
        const structuredData = await page.evaluate(() => {
            const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
            const schemas = [];
            
            jsonLdScripts.forEach(script => {
                try {
                    const data = JSON.parse(script.textContent);
                    schemas.push({
                        type: data['@type'] || 'Unknown',
                        valid: true,
                        data: data
                    });
                } catch (e) {
                    schemas.push({
                        type: 'Invalid',
                        valid: false,
                        error: e.message
                    });
                }
            });
            
            // Check for microdata
            const microdataElements = document.querySelectorAll('[itemscope]');
            
            return {
                jsonLd: schemas,
                microdata: microdataElements.length > 0,
                totalSchemas: schemas.length + (microdataElements.length > 0 ? 1 : 0)
            };
        });
        
        return structuredData;
    }

    async auditAccessibility(page, domain) {
        await page.goto(`https://${domain}`, { waitUntil: 'networkidle2' });
        
        const accessibility = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img'));
            const imagesWithAlt = images.filter(img => img.alt && img.alt.trim() !== '');
            
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
            const properHeadingStructure = headings.length > 0 && 
                headings[0].tagName === 'H1';
            
            const forms = Array.from(document.querySelectorAll('input, textarea, select'));
            const formsWithLabels = forms.filter(input => {
                const id = input.id;
                return id && document.querySelector(`label[for="${id}"]`);
            });
            
            return {
                altTextCoverage: images.length > 0 ? (imagesWithAlt.length / images.length) * 100 : 100,
                headingStructure: properHeadingStructure,
                formLabels: forms.length > 0 ? (formsWithLabels.length / forms.length) * 100 : 100,
                colorContrast: 'needs_testing', // Would implement actual contrast testing
                keyboardNavigation: 'needs_testing'
            };
        });
        
        return {
            ...accessibility,
            score: this.calculateAccessibilityScore(accessibility)
        };
    }

    calculateAccessibilityScore(accessibility) {
        let score = 0;
        
        score += accessibility.altTextCoverage;
        score += accessibility.headingStructure ? 25 : 0;
        score += accessibility.formLabels * 0.25;
        
        return Math.min(100, Math.round(score / 1.5));
    }

    calculateTechnicalScore(audit) {
        const scores = [];
        
        // Crawlability (25%)
        let crawlScore = 0;
        if (audit.crawlability.robotsTxt.exists) crawlScore += 50;
        if (audit.crawlability.sitemap.exists) crawlScore += 50;
        scores.push(crawlScore * 0.25);
        
        // Performance (25%)
        const perfScore = audit.performance.loadTime < 3000 ? 100 : 
                         audit.performance.loadTime < 5000 ? 75 : 50;
        scores.push(perfScore * 0.25);
        
        // Mobile (25%)
        scores.push(audit.mobileOptimization.score * 0.25);
        
        // Security (15%)
        scores.push(audit.security.securityScore * 0.15);
        
        // Accessibility (10%)
        scores.push(audit.accessibility.score * 0.10);
        
        return Math.round(scores.reduce((sum, score) => sum + score, 0));
    }

    generateTechnicalRecommendations(audit) {
        const recommendations = [];
        
        if (!audit.crawlability.robotsTxt.exists) {
            recommendations.push({
                priority: 'high',
                category: 'crawlability',
                issue: 'Missing robots.txt file',
                solution: 'Create a robots.txt file to guide search engine crawlers'
            });
        }
        
        if (!audit.crawlability.sitemap.exists) {
            recommendations.push({
                priority: 'high',
                category: 'crawlability',
                issue: 'Missing XML sitemap',
                solution: 'Generate and submit an XML sitemap to search engines'
            });
        }
        
        if (audit.performance.loadTime > 3000) {
            recommendations.push({
                priority: 'high',
                category: 'performance',
                issue: 'Slow page load time',
                solution: 'Optimize images, minify CSS/JS, and enable caching'
            });
        }
        
        if (audit.mobileOptimization.score < 80) {
            recommendations.push({
                priority: 'high',
                category: 'mobile',
                issue: 'Mobile optimization issues',
                solution: 'Implement responsive design and proper viewport settings'
            });
        }
        
        if (!audit.security.httpsEnabled) {
            recommendations.push({
                priority: 'critical',
                category: 'security',
                issue: 'Not using HTTPS',
                solution: 'Install SSL certificate and redirect all traffic to HTTPS'
            });
        }
        
        return recommendations;
    }

    /**
     * LOVABLE INTEGRATION HELPERS
     * Easy-to-use functions for Lovable projects
     */
    generateLovableIntegrationCode(apiKey, endpoints) {
        return {
            keywordTracking: `
// Keyword Rank Tracking in Lovable
const trackKeywords = async () => {
  const response = await fetch('https://fireapi.dev/seo/rankings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${apiKey}\`
    },
    body: JSON.stringify({
      domain: 'yoursite.com',
      keywords: ['flooring toronto', 'hardwood installation', 'tile contractor'],
      location: 'canada'
    })
  });
  
  const data = await response.json();
  
  // Update your dashboard
  setKeywordData(data.results);
  setRankingSummary(data.summary);
  
  return data;
};`,

            competitorMonitoring: `
// Competitor Analysis in Lovable  
const analyzeCompetitors = async () => {
  const response = await fetch('https://fireapi.dev/seo/competitors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${apiKey}\`
    },
    body: JSON.stringify({
      targetDomain: 'yoursite.com',
      competitorDomains: ['competitor1.com', 'competitor2.com', 'competitor3.com']
    })
  });
  
  const data = await response.json();
  
  // Show competitive insights
  setCompetitorScores(data.results.map(r => ({
    domain: r.domain,
    score: r.competitive.strengthScore,
    weaknesses: r.competitive.weaknesses
  })));
  
  return data;
};`,

            backlinkMonitoring: `
// Backlink Monitoring in Lovable
const monitorBacklinks = async () => {
  const response = await fetch('https://fireapi.dev/seo/backlinks', {
    method: 'POST',  
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${apiKey}\`
    },
    body: JSON.stringify({
      domain: 'yoursite.com'
    })
  });
  
  const data = await response.json();
  
  // Update backlink dashboard
  setBacklinkStats({
    total: data.totalBacklinks,
    quality: data.qualityScore,
    newLinks: data.newBacklinks.length,
    referring: data.referringDomains
  });
  
  return data;
};`,

            technicalAudit: `
// Technical SEO Audit in Lovable
const runSEOAudit = async () => {
  const response = await fetch('https://fireapi.dev/seo/audit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', 
      'Authorization': \`Bearer \${apiKey}\`
    },
    body: JSON.stringify({
      domain: 'yoursite.com'
    })
  });
  
  const data = await response.json();
  
  // Display audit results
  setSEOScore(data.overallScore);
  setAuditRecommendations(data.recommendations);
  setTechnicalIssues(data.recommendations.filter(r => r.priority === 'critical'));
  
  return data;
};`
        };
    }

    /**
     * DASHBOARD DATA FORMATTERS
     * Format API responses for easy dashboard integration
     */
    formatForDashboard(apiResponse, type) {
        switch (type) {
            case 'rankings':
                return {
                    summary: {
                        totalKeywords: apiResponse.totalKeywords,
                        ranked: apiResponse.summary.ranked,
                        topTen: apiResponse.summary.topTen,
                        avgPosition: apiResponse.summary.averagePosition
                    },
                    chart: apiResponse.results.map(r => ({
                        keyword: r.keyword,
                        position: r.position,
                        trend: apiResponse.historical[r.keyword]?.trend || 'stable'
                    })),
                    alerts: apiResponse.results
                        .filter(r => !r.position || r.position > 20)
                        .map(r => `${r.keyword} not ranking or beyond page 2`)
                };

            case 'competitors':
                return {
                    overview: {
                        avgScore: apiResponse.comparative.averageCompetitorScore,
                        topCompetitor: apiResponse.comparative.topCompetitor.domain,
                        marketGaps: apiResponse.comparative.marketGaps.length
                    },
                    scoreChart: apiResponse.results.map(r => ({
                        name: r.domain,
                        score: r.competitive.strengthScore,
                        weaknesses: r.competitive.weaknesses.length
                    })),
                    recommendations: apiResponse.comparative.recommendations
                };

            case 'backlinks':
                return {
                    metrics: {
                        total: apiResponse.totalBacklinks,
                        quality: apiResponse.qualityScore,
                        domains: apiResponse.referringDomains,
                        newLinks: apiResponse.newBacklinks.length
                    },
                    qualityChart: [
                        { name: 'High DA', value: apiResponse.qualityDistribution.high },
                        { name: 'Medium DA', value: apiResponse.qualityDistribution.medium },
                        { name: 'Low DA', value: apiResponse.qualityDistribution.low }
                    ],
                    opportunities: apiResponse.opportunities
                };

            case 'audit':
                return {
                    overallScore: apiResponse.overallScore,
                    categoryScores: {
                        performance: Math.round(apiResponse.performance.loadTime < 3000 ? 100 : 50),
                        mobile: apiResponse.mobileOptimization.score,
                        security: apiResponse.security.securityScore,
                        accessibility: apiResponse.accessibility.score
                    },
                    criticalIssues: apiResponse.recommendations
                        .filter(r => r.priority === 'critical')
                        .length,
                    recommendations: apiResponse.recommendations.slice(0, 5)
                };

            default:
                return apiResponse;
        }
    }

    /**
     * UTILITY METHODS
     */
    async cleanup() {
        await this.closeBrowser();
        this.cache.clear();
    }
}

module.exports = SEOAPIService;