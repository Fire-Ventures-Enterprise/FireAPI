/**
 * 🏠 Flooring Products Bulk Import API
 * Secure REST API for bulk importing flooring products via CSV
 * Designed for flooringhause.com admin dashboard integration
 */

const multer = require('multer');
const csv = require('csv-parser');
const { createReadStream } = require('fs');
const { pipeline } = require('stream/promises');
const crypto = require('crypto');
const sharp = require('sharp');

class FlooringBulkImportAPI {
    constructor(supabaseClient = null) {
        this.supabase = supabaseClient;
        this.importSessions = new Map(); // Track import progress
        this.rateLimitTracker = new Map(); // Track rate limiting
        
        // Configuration
        this.config = {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            batchSize: 100,
            maxImportsPerHour: 10,
            allowedFileTypes: ['text/csv', 'application/vnd.ms-excel'],
            tempDir: '/tmp/flooring-imports'
        };

        this.setupValidationRules();
        this.initializeMulter();
    }

    /**
     * 📋 Setup data validation rules
     */
    setupValidationRules() {
        this.validationRules = {
            required: ['product_name', 'sku', 'price'],
            fields: {
                product_name: {
                    type: 'string',
                    maxLength: 255,
                    minLength: 1
                },
                sku: {
                    type: 'string',
                    maxLength: 100,
                    pattern: /^[A-Za-z0-9\-_]+$/
                },
                category: {
                    type: 'string',
                    maxLength: 100,
                    allowedValues: [
                        'hardwood',
                        'laminate', 
                        'vinyl',
                        'tile',
                        'carpet',
                        'bamboo',
                        'cork',
                        'stone',
                        'engineered'
                    ]
                },
                price: {
                    type: 'number',
                    min: 0.01,
                    max: 10000
                },
                stock_quantity: {
                    type: 'integer',
                    min: 0,
                    max: 999999
                },
                description: {
                    type: 'string',
                    maxLength: 2000
                },
                manufacturer: {
                    type: 'string',
                    maxLength: 100
                },
                dimensions: {
                    type: 'string',
                    maxLength: 50,
                    pattern: /^\d+(\.\d+)?\s*x\s*\d+(\.\d+)?(\s*x\s*\d+(\.\d+)?)?\s*(in|inches|ft|feet|cm|mm)?$/i
                },
                material: {
                    type: 'string',
                    maxLength: 100,
                    allowedValues: [
                        'oak',
                        'maple',
                        'cherry',
                        'walnut',
                        'pine',
                        'bamboo',
                        'cork',
                        'ceramic',
                        'porcelain',
                        'vinyl',
                        'laminate',
                        'stone',
                        'marble',
                        'granite'
                    ]
                },
                color: {
                    type: 'string',
                    maxLength: 50
                },
                installation_type: {
                    type: 'string',
                    allowedValues: [
                        'nail-down',
                        'glue-down',
                        'floating',
                        'click-lock',
                        'adhesive',
                        'grout',
                        'staple'
                    ]
                },
                warranty_years: {
                    type: 'integer',
                    min: 0,
                    max: 50
                },
                square_feet_per_box: {
                    type: 'number',
                    min: 0.1,
                    max: 100
                },
                weight_per_box: {
                    type: 'number',
                    min: 0.1,
                    max: 200
                },
                thickness: {
                    type: 'string',
                    pattern: /^\d+(\.\d+)?\s*(mm|in|inch)?$/i
                },
                finish: {
                    type: 'string',
                    allowedValues: [
                        'matte',
                        'satin',
                        'semi-gloss',
                        'gloss',
                        'textured',
                        'brushed',
                        'hand-scraped',
                        'distressed'
                    ]
                }
            }
        };
    }

    /**
     * 📁 Initialize multer for file uploads
     */
    initializeMulter() {
        // Configure multer for CSV file uploads
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, this.config.tempDir);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, `flooring-import-${uniqueSuffix}.csv`);
            }
        });

        this.upload = multer({
            storage: storage,
            limits: {
                fileSize: this.config.maxFileSize,
                files: 1
            },
            fileFilter: (req, file, cb) => {
                // Validate file type
                if (!this.config.allowedFileTypes.includes(file.mimetype) && 
                    !file.originalname.toLowerCase().endsWith('.csv')) {
                    return cb(new Error('Invalid file type. Only CSV files are allowed.'));
                }
                cb(null, true);
            }
        });
    }

    /**
     * 🔒 Check rate limiting for user
     */
    checkRateLimit(userId) {
        const now = Date.now();
        const hourMs = 60 * 60 * 1000;
        
        if (!this.rateLimitTracker.has(userId)) {
            this.rateLimitTracker.set(userId, []);
        }

        const userRequests = this.rateLimitTracker.get(userId);
        
        // Remove old requests (older than 1 hour)
        const recentRequests = userRequests.filter(timestamp => 
            now - timestamp < hourMs
        );
        
        this.rateLimitTracker.set(userId, recentRequests);

        if (recentRequests.length >= this.config.maxImportsPerHour) {
            throw new Error(`Rate limit exceeded. Maximum ${this.config.maxImportsPerHour} imports per hour allowed.`);
        }

        // Record this request
        recentRequests.push(now);
        
        return {
            allowed: true,
            remaining: this.config.maxImportsPerHour - recentRequests.length
        };
    }

    /**
     * 🔍 Validate single product record
     */
    validateProduct(product, rowNumber) {
        const errors = [];

        // Check required fields
        for (const field of this.validationRules.required) {
            if (!product[field] || product[field].toString().trim() === '') {
                errors.push(`Row ${rowNumber}: Missing required field '${field}'`);
            }
        }

        // Validate each field
        for (const [fieldName, value] of Object.entries(product)) {
            if (!value || value.toString().trim() === '') continue;

            const rule = this.validationRules.fields[fieldName];
            if (!rule) continue;

            const trimmedValue = value.toString().trim();

            // Type validation
            if (rule.type === 'number') {
                const numValue = parseFloat(trimmedValue);
                if (isNaN(numValue)) {
                    errors.push(`Row ${rowNumber}: '${fieldName}' must be a number`);
                    continue;
                }
                
                if (rule.min !== undefined && numValue < rule.min) {
                    errors.push(`Row ${rowNumber}: '${fieldName}' must be at least ${rule.min}`);
                }
                
                if (rule.max !== undefined && numValue > rule.max) {
                    errors.push(`Row ${rowNumber}: '${fieldName}' must be at most ${rule.max}`);
                }
            }

            if (rule.type === 'integer') {
                const intValue = parseInt(trimmedValue);
                if (isNaN(intValue) || !Number.isInteger(parseFloat(trimmedValue))) {
                    errors.push(`Row ${rowNumber}: '${fieldName}' must be an integer`);
                    continue;
                }
                
                if (rule.min !== undefined && intValue < rule.min) {
                    errors.push(`Row ${rowNumber}: '${fieldName}' must be at least ${rule.min}`);
                }
                
                if (rule.max !== undefined && intValue > rule.max) {
                    errors.push(`Row ${rowNumber}: '${fieldName}' must be at most ${rule.max}`);
                }
            }

            // Length validation
            if (rule.maxLength && trimmedValue.length > rule.maxLength) {
                errors.push(`Row ${rowNumber}: '${fieldName}' exceeds maximum length of ${rule.maxLength}`);
            }
            
            if (rule.minLength && trimmedValue.length < rule.minLength) {
                errors.push(`Row ${rowNumber}: '${fieldName}' is below minimum length of ${rule.minLength}`);
            }

            // Pattern validation
            if (rule.pattern && !rule.pattern.test(trimmedValue)) {
                errors.push(`Row ${rowNumber}: '${fieldName}' format is invalid`);
            }

            // Allowed values validation
            if (rule.allowedValues && !rule.allowedValues.includes(trimmedValue.toLowerCase())) {
                errors.push(`Row ${rowNumber}: '${fieldName}' must be one of: ${rule.allowedValues.join(', ')}`);
            }
        }

        return errors;
    }

    /**
     * 📊 Parse CSV file and validate data
     */
    async parseAndValidateCSV(filePath, sessionId) {
        return new Promise((resolve, reject) => {
            const products = [];
            const errors = [];
            const skus = new Set();
            let rowNumber = 0;

            const parser = csv({
                skipEmptyLines: true,
                headers: [
                    'product_name',
                    'sku', 
                    'category',
                    'price',
                    'stock_quantity',
                    'description',
                    'manufacturer',
                    'dimensions',
                    'material',
                    'color',
                    'installation_type',
                    'warranty_years',
                    'square_feet_per_box',
                    'weight_per_box',
                    'thickness',
                    'finish'
                ]
            });

            createReadStream(filePath)
                .pipe(parser)
                .on('data', (data) => {
                    rowNumber++;
                    
                    // Update session progress
                    this.updateSessionProgress(sessionId, 'parsing', {
                        rowsProcessed: rowNumber,
                        stage: 'validation'
                    });

                    // Validate product
                    const productErrors = this.validateProduct(data, rowNumber);
                    
                    // Check for duplicate SKU
                    if (data.sku && skus.has(data.sku.trim())) {
                        productErrors.push(`Row ${rowNumber}: Duplicate SKU '${data.sku.trim()}' found in file`);
                    } else if (data.sku) {
                        skus.add(data.sku.trim());
                    }

                    if (productErrors.length > 0) {
                        errors.push(...productErrors);
                    } else {
                        // Clean and format the product data
                        const cleanProduct = this.cleanProductData(data);
                        products.push(cleanProduct);
                    }
                })
                .on('end', () => {
                    resolve({
                        products,
                        errors,
                        totalRows: rowNumber,
                        validRows: products.length,
                        invalidRows: errors.length
                    });
                })
                .on('error', (error) => {
                    reject(new Error(`CSV parsing failed: ${error.message}`));
                });
        });
    }

    /**
     * 🧹 Clean and format product data
     */
    cleanProductData(product) {
        const cleaned = {};
        
        for (const [key, value] of Object.entries(product)) {
            if (!value || value.toString().trim() === '') {
                continue;
            }

            let cleanValue = value.toString().trim();

            // Type conversions
            if (['price', 'square_feet_per_box', 'weight_per_box'].includes(key)) {
                cleanValue = parseFloat(cleanValue);
            } else if (['stock_quantity', 'warranty_years'].includes(key)) {
                cleanValue = parseInt(cleanValue);
            }

            cleaned[key] = cleanValue;
        }

        // Add metadata
        cleaned.created_at = new Date().toISOString();
        cleaned.updated_at = new Date().toISOString();
        cleaned.import_batch_id = crypto.randomUUID();

        return cleaned;
    }

    /**
     * 📈 Update import session progress
     */
    updateSessionProgress(sessionId, status, data) {
        if (this.importSessions.has(sessionId)) {
            const session = this.importSessions.get(sessionId);
            session.status = status;
            session.progress = { ...session.progress, ...data };
            session.updated_at = new Date().toISOString();
        }
    }

    /**
     * 💾 Check for existing SKUs in database
     */
    async checkExistingSKUs(products) {
        if (!this.supabase) {
            return { existingSKUs: [], newProducts: products };
        }

        const skus = products.map(p => p.sku).filter(Boolean);
        
        const { data: existingProducts, error } = await this.supabase
            .from('flooring_products')
            .select('sku')
            .in('sku', skus);

        if (error) {
            throw new Error(`Database check failed: ${error.message}`);
        }

        const existingSKUs = existingProducts.map(p => p.sku);
        const newProducts = products.filter(p => !existingSKUs.includes(p.sku));

        return { existingSKUs, newProducts };
    }

    /**
     * ⚡ Batch insert products into database
     */
    async batchInsertProducts(products, sessionId) {
        const results = {
            inserted: 0,
            failed: 0,
            errors: []
        };

        // Process in batches
        for (let i = 0; i < products.length; i += this.config.batchSize) {
            const batch = products.slice(i, i + this.config.batchSize);
            
            this.updateSessionProgress(sessionId, 'inserting', {
                currentBatch: Math.floor(i / this.config.batchSize) + 1,
                totalBatches: Math.ceil(products.length / this.config.batchSize),
                processed: i,
                total: products.length
            });

            try {
                if (this.supabase) {
                    const { data, error } = await this.supabase
                        .from('flooring_products')
                        .insert(batch)
                        .select('id, sku');

                    if (error) {
                        results.errors.push(`Batch ${Math.floor(i / this.config.batchSize) + 1}: ${error.message}`);
                        results.failed += batch.length;
                    } else {
                        results.inserted += data.length;
                    }
                } else {
                    // Simulate database insert for testing
                    await new Promise(resolve => setTimeout(resolve, 100));
                    results.inserted += batch.length;
                }
            } catch (error) {
                results.errors.push(`Batch ${Math.floor(i / this.config.batchSize) + 1}: ${error.message}`);
                results.failed += batch.length;
            }
        }

        return results;
    }

    /**
     * 📋 Get import session status
     */
    getSessionStatus(sessionId) {
        return this.importSessions.get(sessionId) || null;
    }

    /**
     * 🗂️ List all import sessions for user
     */
    getUserImportHistory(userId, limit = 10) {
        const userSessions = Array.from(this.importSessions.values())
            .filter(session => session.userId === userId)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit);

        return userSessions.map(session => ({
            sessionId: session.sessionId,
            filename: session.filename,
            status: session.status,
            progress: session.progress,
            results: session.results,
            created_at: session.created_at,
            updated_at: session.updated_at
        }));
    }

    /**
     * 🚀 Main import function
     */
    async importProducts(filePath, filename, userId) {
        const sessionId = crypto.randomUUID();
        
        // Initialize session
        this.importSessions.set(sessionId, {
            sessionId,
            userId,
            filename,
            status: 'started',
            progress: {
                stage: 'parsing',
                rowsProcessed: 0
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        try {
            // Check rate limiting
            const rateLimit = this.checkRateLimit(userId);
            
            // Parse and validate CSV
            this.updateSessionProgress(sessionId, 'parsing', { stage: 'reading_file' });
            const parseResult = await this.parseAndValidateCSV(filePath, sessionId);

            if (parseResult.errors.length > 0) {
                this.updateSessionProgress(sessionId, 'validation_failed', {
                    totalRows: parseResult.totalRows,
                    validRows: parseResult.validRows,
                    invalidRows: parseResult.errors.length
                });

                const session = this.importSessions.get(sessionId);
                session.results = {
                    success: false,
                    errors: parseResult.errors,
                    summary: {
                        totalRows: parseResult.totalRows,
                        validRows: parseResult.validRows,
                        invalidRows: parseResult.errors.length,
                        inserted: 0,
                        skipped: parseResult.totalRows
                    }
                };

                return session.results;
            }

            // Check for existing SKUs
            this.updateSessionProgress(sessionId, 'checking_duplicates', {});
            const { existingSKUs, newProducts } = await this.checkExistingSKUs(parseResult.products);

            // Insert new products
            this.updateSessionProgress(sessionId, 'inserting', {});
            const insertResults = await this.batchInsertProducts(newProducts, sessionId);

            // Finalize session
            this.updateSessionProgress(sessionId, 'completed', {});
            const session = this.importSessions.get(sessionId);
            session.results = {
                success: true,
                sessionId,
                summary: {
                    totalRows: parseResult.totalRows,
                    validRows: parseResult.validRows,
                    invalidRows: parseResult.errors.length,
                    inserted: insertResults.inserted,
                    skipped: existingSKUs.length,
                    failed: insertResults.failed
                },
                details: {
                    existingSKUs,
                    insertErrors: insertResults.errors
                },
                rateLimit: {
                    remaining: rateLimit.remaining
                }
            };

            return session.results;

        } catch (error) {
            this.updateSessionProgress(sessionId, 'failed', { error: error.message });
            
            const session = this.importSessions.get(sessionId);
            session.results = {
                success: false,
                error: error.message,
                sessionId
            };

            throw error;
        }
    }
}

module.exports = FlooringBulkImportAPI;