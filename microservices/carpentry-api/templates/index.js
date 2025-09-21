/**
 * 🔨 Carpentry Templates Index
 * Loads all carpentry-specific job templates
 */

const kitchenCabinets = require('./kitchen-cabinets.json');
const trimInstallation = require('./trim-installation.json');

module.exports = {
    kitchen_cabinets: kitchenCabinets,
    trim_installation: trimInstallation,
    
    // Template metadata
    getTemplateList() {
        return Object.keys(this).filter(key => typeof this[key] !== 'function');
    },
    
    getTemplate(templateName) {
        return this[templateName] || null;
    },
    
    validateTemplate(template) {
        const requiredFields = ['job_id', 'phases', 'materials', 'labor_rates'];
        return requiredFields.every(field => template.hasOwnProperty(field));
    }
};