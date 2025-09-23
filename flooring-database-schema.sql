-- 🏠 Flooring Products Database Schema for Supabase/PostgreSQL
-- Designed for flooringhause.com bulk import system

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create flooring products table
CREATE TABLE IF NOT EXISTS flooring_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic product information
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100) CHECK (category IN (
        'hardwood', 'laminate', 'vinyl', 'tile', 'carpet', 
        'bamboo', 'cork', 'stone', 'engineered'
    )),
    
    -- Pricing and inventory
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    
    -- Product details
    description TEXT,
    manufacturer VARCHAR(100),
    dimensions VARCHAR(50),
    material VARCHAR(100),
    color VARCHAR(50),
    
    -- Installation information
    installation_type VARCHAR(50) CHECK (installation_type IN (
        'nail-down', 'glue-down', 'floating', 'click-lock', 
        'adhesive', 'grout', 'staple'
    )),
    
    -- Additional specifications
    warranty_years INTEGER CHECK (warranty_years >= 0 AND warranty_years <= 50),
    square_feet_per_box DECIMAL(8,2) CHECK (square_feet_per_box > 0),
    weight_per_box DECIMAL(8,2) CHECK (weight_per_box > 0),
    thickness VARCHAR(20),
    finish VARCHAR(50) CHECK (finish IN (
        'matte', 'satin', 'semi-gloss', 'gloss', 'textured',
        'brushed', 'hand-scraped', 'distressed'
    )),
    
    -- Import tracking
    import_batch_id UUID,
    imported_by UUID, -- References auth.users(id)
    import_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status and visibility
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- SEO and marketing
    meta_title VARCHAR(255),
    meta_description TEXT,
    slug VARCHAR(255) UNIQUE,
    tags TEXT[], -- Array of tags for filtering
    
    -- Images and media
    primary_image_url TEXT,
    gallery_images TEXT[], -- Array of additional image URLs
    
    -- Pricing history
    cost_price DECIMAL(10,2), -- Wholesale cost
    msrp DECIMAL(10,2), -- Manufacturer suggested retail price
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create import sessions table for tracking bulk imports
CREATE TABLE IF NOT EXISTS import_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL, -- References auth.users(id)
    
    -- File information
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER,
    
    -- Import status and progress
    status VARCHAR(50) NOT NULL DEFAULT 'started' CHECK (status IN (
        'started', 'parsing', 'validating', 'checking_duplicates', 
        'inserting', 'completed', 'failed', 'cancelled'
    )),
    
    -- Results and statistics
    total_rows INTEGER DEFAULT 0,
    valid_rows INTEGER DEFAULT 0,
    invalid_rows INTEGER DEFAULT 0,
    inserted_rows INTEGER DEFAULT 0,
    skipped_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    
    -- Progress tracking
    current_batch INTEGER DEFAULT 0,
    total_batches INTEGER DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0,
    
    -- Error tracking
    error_message TEXT,
    validation_errors JSONB,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product categories table for better category management
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    parent_category_id UUID REFERENCES product_categories(id),
    
    -- SEO
    slug VARCHAR(100) UNIQUE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create manufacturers table
CREATE TABLE IF NOT EXISTS manufacturers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    website_url TEXT,
    contact_email VARCHAR(255),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product variants table (for different sizes, colors, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES flooring_products(id) ON DELETE CASCADE,
    
    -- Variant identification
    variant_name VARCHAR(255),
    variant_sku VARCHAR(100) UNIQUE,
    
    -- Variant-specific attributes
    size VARCHAR(50),
    color_variant VARCHAR(50),
    finish_variant VARCHAR(50),
    
    -- Variant pricing and inventory
    price_adjustment DECIMAL(10,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    
    -- Images
    variant_image_url TEXT,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_flooring_products_sku ON flooring_products(sku);
CREATE INDEX IF NOT EXISTS idx_flooring_products_category ON flooring_products(category);
CREATE INDEX IF NOT EXISTS idx_flooring_products_manufacturer ON flooring_products(manufacturer);
CREATE INDEX IF NOT EXISTS idx_flooring_products_price ON flooring_products(price);
CREATE INDEX IF NOT EXISTS idx_flooring_products_active ON flooring_products(is_active);
CREATE INDEX IF NOT EXISTS idx_flooring_products_created_at ON flooring_products(created_at);
CREATE INDEX IF NOT EXISTS idx_flooring_products_import_batch ON flooring_products(import_batch_id);

CREATE INDEX IF NOT EXISTS idx_import_sessions_user ON import_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_import_sessions_status ON import_sessions(status);
CREATE INDEX IF NOT EXISTS idx_import_sessions_created ON import_sessions(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_flooring_products_updated_at 
    BEFORE UPDATE ON flooring_products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_sessions_updated_at 
    BEFORE UPDATE ON import_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at 
    BEFORE UPDATE ON product_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manufacturers_updated_at 
    BEFORE UPDATE ON manufacturers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO product_categories (name, display_name, description, slug) VALUES
('hardwood', 'Hardwood Flooring', 'Solid and engineered hardwood floors', 'hardwood'),
('laminate', 'Laminate Flooring', 'High-quality laminate flooring options', 'laminate'),
('vinyl', 'Vinyl Flooring', 'LVT, LVP and vinyl sheet flooring', 'vinyl'),
('tile', 'Tile Flooring', 'Ceramic, porcelain and natural stone tiles', 'tile'),
('carpet', 'Carpet', 'Carpet and area rugs', 'carpet'),
('bamboo', 'Bamboo Flooring', 'Sustainable bamboo flooring options', 'bamboo'),
('cork', 'Cork Flooring', 'Eco-friendly cork flooring', 'cork'),
('stone', 'Stone Flooring', 'Natural stone and marble flooring', 'stone'),
('engineered', 'Engineered Flooring', 'Engineered wood and composite floors', 'engineered')
ON CONFLICT (name) DO NOTHING;

-- Create RLS (Row Level Security) policies for Supabase
ALTER TABLE flooring_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all active products
CREATE POLICY "Anyone can read active products" ON flooring_products
    FOR SELECT USING (is_active = true);

-- Policy: Authenticated users can manage products
CREATE POLICY "Authenticated users can insert products" ON flooring_products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their imported products" ON flooring_products
    FOR UPDATE USING (imported_by = auth.uid());

-- Policy: Users can only see their own import sessions  
CREATE POLICY "Users can read own import sessions" ON import_sessions
    FOR ALL USING (user_id = auth.uid());

-- Policy: Anyone can read categories and manufacturers
CREATE POLICY "Anyone can read categories" ON product_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can read manufacturers" ON manufacturers  
    FOR SELECT USING (is_active = true);

-- Create custom functions for business logic
CREATE OR REPLACE FUNCTION get_low_stock_products(threshold INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    product_name VARCHAR,
    sku VARCHAR,
    stock_quantity INTEGER,
    category VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fp.id,
        fp.product_name,
        fp.sku,
        fp.stock_quantity,
        fp.category
    FROM flooring_products fp
    WHERE fp.stock_quantity <= threshold
    AND fp.is_active = true
    ORDER BY fp.stock_quantity ASC, fp.product_name;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate inventory value
CREATE OR REPLACE FUNCTION calculate_inventory_value()
RETURNS DECIMAL AS $$
DECLARE
    total_value DECIMAL;
BEGIN
    SELECT SUM(price * stock_quantity) INTO total_value
    FROM flooring_products
    WHERE is_active = true;
    
    RETURN COALESCE(total_value, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get import statistics
CREATE OR REPLACE FUNCTION get_import_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_imports', COUNT(*),
        'successful_imports', COUNT(*) FILTER (WHERE status = 'completed'),
        'failed_imports', COUNT(*) FILTER (WHERE status = 'failed'),
        'total_products_imported', SUM(inserted_rows),
        'last_import_date', MAX(created_at)
    ) INTO result
    FROM import_sessions
    WHERE user_id = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for product search (for better performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS product_search_view AS
SELECT 
    id,
    product_name,
    sku,
    category,
    manufacturer,
    price,
    description,
    to_tsvector('english', product_name || ' ' || COALESCE(description, '') || ' ' || sku) as search_vector
FROM flooring_products
WHERE is_active = true;

-- Create index on search vector
CREATE INDEX IF NOT EXISTS idx_product_search_vector ON product_search_view USING GIN(search_vector);

-- Function to refresh search view
CREATE OR REPLACE FUNCTION refresh_product_search()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_search_view;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE flooring_products IS 'Main table storing all flooring product information';
COMMENT ON TABLE import_sessions IS 'Tracks bulk import operations and their progress';
COMMENT ON TABLE product_categories IS 'Product category definitions and hierarchy';
COMMENT ON TABLE manufacturers IS 'Manufacturer information and details';
COMMENT ON COLUMN flooring_products.import_batch_id IS 'Links products to their import batch for tracking';
COMMENT ON COLUMN flooring_products.tags IS 'Array of tags for flexible product categorization';
COMMENT ON FUNCTION get_low_stock_products IS 'Returns products with stock below specified threshold';
COMMENT ON FUNCTION calculate_inventory_value IS 'Calculates total inventory value at current prices';