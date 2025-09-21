/**
 * 🔨 Carpentry API Server
 * Specialized microservice for carpentry estimates
 * 
 * Capabilities:
 * - Kitchen cabinets (upper, lower, islands)
 * - Trim and molding installation  
 * - Door and window installation
 * - Framing and structural carpentry
 * - Built-in furniture and shelving
 */

require('dotenv').config();
const TradeAPITemplate = require('../shared/templates/trade-api-template');
const CarpentryEstimator = require('./src/carpentry-estimator');
const carpentryTemplates = require('./templates');

class CarpentryAPI extends TradeAPITemplate {
    constructor() {
        super({
            trade: 'carpentry',
            port: process.env.PORT || 3001,
            templates: carpentryTemplates
        });
        
        this.estimator = new CarpentryEstimator(carpentryTemplates);
        this.setupCarpentryRoutes();
    }

    setupCarpentryRoutes() {
        // Cabinet-specific estimate endpoint
        this.app.post('/estimate/cabinets', async (req, res) => {
            try {
                const estimate = await this.estimator.estimateCabinets(req.body);
                res.json(estimate);
            } catch (error) {
                console.error('[CARPENTRY] Cabinet estimate error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Trim installation estimate
        this.app.post('/estimate/trim', async (req, res) => {
            try {
                const estimate = await this.estimator.estimateTrim(req.body);
                res.json(estimate);
            } catch (error) {
                console.error('[CARPENTRY] Trim estimate error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Framing estimate
        this.app.post('/estimate/framing', async (req, res) => {
            try {
                const estimate = await this.estimator.estimateFraming(req.body);
                res.json(estimate);
            } catch (error) {
                console.error('[CARPENTRY] Framing estimate error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Door installation estimate
        this.app.post('/estimate/doors', async (req, res) => {
            try {
                const estimate = await this.estimator.estimateDoors(req.body);
                res.json(estimate);
            } catch (error) {
                console.error('[CARPENTRY] Door estimate error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Material calculator
        this.app.post('/calculate/materials', (req, res) => {
            try {
                const materials = this.estimator.calculateMaterials(req.body);
                res.json(materials);
            } catch (error) {
                console.error('[CARPENTRY] Material calculation error:', error);
                res.status(500).json({ error: error.message });
            }
        });
    }

    async generateEstimate(request) {
        this.validateRequest(request);
        
        const { project, trade_scope } = request;
        
        // Determine carpentry work type
        const workType = this.identifyWorkType(trade_scope);
        
        // Generate estimate based on work type
        let estimate;
        switch (workType) {
            case 'cabinets':
                estimate = await this.estimator.estimateCabinets(request);
                break;
            case 'trim':
                estimate = await this.estimator.estimateTrim(request);
                break;
            case 'framing':
                estimate = await this.estimator.estimateFraming(request);
                break;
            case 'doors':
                estimate = await this.estimator.estimateDoors(request);
                break;
            case 'mixed':
                estimate = await this.estimator.estimateMixedCarpentry(request);
                break;
            default:
                throw new Error(`Unknown carpentry work type: ${workType}`);
        }

        return this.formatResponse(request.request_id, estimate, {
            prerequisites: this.getPrerequisites(workType),
            provides_for: this.getProvidesFor(workType),
            schedule_flexibility: this.getScheduleFlexibility(workType)
        });
    }

    identifyWorkType(tradeScope) {
        const requirements = tradeScope.specific_requirements || [];
        
        if (requirements.some(req => req.includes('cabinet'))) return 'cabinets';
        if (requirements.some(req => req.includes('trim') || req.includes('molding'))) return 'trim';
        if (requirements.some(req => req.includes('framing') || req.includes('structural'))) return 'framing';
        if (requirements.some(req => req.includes('door') || req.includes('window'))) return 'doors';
        
        return 'mixed';
    }

    getPrerequisites(workType) {
        const prerequisites = {
            cabinets: ['electrical_rough_in', 'plumbing_rough_in', 'drywall_complete', 'flooring_complete'],
            trim: ['painting_prime_coat', 'flooring_complete'],
            framing: ['permits_approved', 'materials_delivered'],
            doors: ['framing_complete', 'electrical_rough_in'],
            mixed: ['electrical_rough_in', 'drywall_complete']
        };
        
        return prerequisites[workType] || [];
    }

    getProvidesFor(workType) {
        const provides = {
            cabinets: ['countertop_measurement', 'appliance_installation'],
            trim: ['painting_final_coat'],
            framing: ['electrical_rough_in', 'plumbing_rough_in', 'insulation'],
            doors: ['painting', 'hardware_installation'],
            mixed: ['various_finish_work']
        };
        
        return provides[workType] || [];
    }

    getScheduleFlexibility(workType) {
        const flexibility = {
            cabinets: '1_day',      // Precise measurement and installation timing
            trim: '3_days',         // Can work around other trades
            framing: '2_days',      // Weather dependent but flexible
            doors: '2_days',        // Moderate flexibility
            mixed: '2_days'         // Average flexibility
        };
        
        return flexibility[workType] || '2_days';
    }

    getCapabilities() {
        return [
            'kitchen_cabinets',
            'bathroom_vanities', 
            'trim_installation',
            'crown_molding',
            'door_installation',
            'window_installation',
            'framing_carpentry',
            'built_in_furniture',
            'shelving_systems',
            'material_calculations',
            'waste_factor_optimization'
        ];
    }

    getEndpoints() {
        return [
            ...super.getEndpoints(),
            'POST /estimate/cabinets',
            'POST /estimate/trim',
            'POST /estimate/framing', 
            'POST /estimate/doors',
            'POST /calculate/materials'
        ];
    }
}

// Start the Carpentry API server
const carpentryAPI = new CarpentryAPI();
carpentryAPI.start();

console.log('🔨 Carpentry API Features:');
console.log('  ├── Kitchen cabinet installation');
console.log('  ├── Trim and molding work');
console.log('  ├── Door and window installation');
console.log('  ├── Framing and structural work');
console.log('  └── Built-in furniture systems');

module.exports = carpentryAPI;