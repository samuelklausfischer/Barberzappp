-- Migration: Shop Themes
-- Description: Custom theme support for barber shops
-- Version: 1.0.0
-- Date: 2026-03-04

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for custom shop themes
CREATE TABLE IF NOT EXISTS shop_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    theme_name VARCHAR(100) DEFAULT 'Custom Theme',
    
    -- Theme colors (10+ shades)
    colors JSONB NOT NULL DEFAULT '{
        "primary": "#3b82f6",
        "primaryLight": "#60a5fa",
        "primaryDark": "#2563eb",
        "secondary": "#6366f1",
        "secondaryLight": "#818cf8",
        "secondaryDark": "#4f46e5",
        "background": "#ffffff",
        "backgroundAlt": "#f3f4f6",
        "surface": "#ffffff",
        "surfaceAlt": "#f9fafb",
        "text": "#111827",
        "textSecondary": "#6b7280",
        "textMuted": "#9ca3af",
        "border": "#e5e7eb",
        "borderLight": "#f3f4f6",
        "success": "#10b981",
        "successLight": "#34d399",
        "warning": "#f59e0b",
        "warningLight": "#fbbf24",
        "error": "#ef4444",
        "errorLight": "#f87171",
        "info": "#3b82f6",
        "infoLight": "#60a5fa"
    }'::jsonb,
    
    -- Font configuration
    fonts JSONB DEFAULT '{
        "heading": "Inter, system-ui, sans-serif",
        "body": "Inter, system-ui, sans-serif",
        "mono": "JetBrains Mono, monospace"
    }'::jsonb,
    
    -- UI customizations
    border_radius VARCHAR(20) DEFAULT '0.5rem',
    spacing VARCHAR(20) DEFAULT '1rem',
    
    -- Custom CSS injection
    custom_css TEXT,
    
    -- Branding assets
    logo_url TEXT,
    favicon_url TEXT,
    accent_emoji VARCHAR(100) DEFAULT '💈',
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE (shop_id)
);

-- Index for faster lookups
CREATE INDEX idx_shop_themes_shop_id ON shop_themes(shop_id);
CREATE INDEX idx_shop_themes_theme_name ON shop_themes(theme_name);
CREATE INDEX idx_shop_themes_is_active ON shop_themes(is_active, is_default);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shop_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shop_themes_updated_at
    BEFORE UPDATE ON shop_themes
    FOR EACH ROW
    EXECUTE FUNCTION update_shop_themes_updated_at();

-- Insert default preset themes as reference rows (not tied to shops)
CREATE TABLE IF NOT EXISTS theme_presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    preset_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    colors JSONB NOT NULL,
    fonts JSONB NOT NULL,
    border_radius VARCHAR(20),
    spacing VARCHAR(20),
    accent_emoji VARCHAR(100),
    category VARCHAR(50), -- 'light', 'dark', 'custom'
    is_visible BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert theme presets
INSERT INTO theme_presets (preset_key, name, description, colors, fonts, border_radius, spacing, accent_emoji, category, sort_order) VALUES
    (
        'defaultLight',
        'Default Light',
        'Clean and minimalist light theme',
        '{
            "primary": "#3b82f6",
            "primaryLight": "#60a5fa",
            "primaryDark": "#2563eb",
            "secondary": "#6366f1",
            "secondaryLight": "#818cf8",
            "secondaryDark": "#4f46e5",
            "background": "#ffffff",
            "backgroundAlt": "#f3f4f6",
            "surface": "#ffffff",
            "surfaceAlt": "#f9fafb",
            "text": "#111827",
            "textSecondary": "#6b7280",
            "textMuted": "#9ca3af",
            "border": "#e5e7eb",
            "borderLight": "#f3f4f6",
            "success": "#10b981",
            "successLight": "#34d399",
            "warning": "#f59e0b",
            "warningLight": "#fbbf24",
            "error": "#ef4444",
            "errorLight": "#f87171",
            "info": "#3b82f6",
            "infoLight": "#60a5fa"
        }'::jsonb,
        '{
            "heading": "Inter, system-ui, sans-serif",
            "body": "Inter, system-ui, sans-serif",
            "mono": "JetBrains Mono, monospace"
        }'::jsonb,
        '0.5rem',
        '1rem',
        '🌟',
        'light',
        1
    ),
    (
        'defaultDark',
        'Default Dark',
        'Elegant dark mode for night use',
        '{
            "primary": "#60a5fa",
            "primaryLight": "#93c5fd",
            "primaryDark": "#3b82f6",
            "secondary": "#818cf8",
            "secondaryLight": "#a5b4fc",
            "secondaryDark": "#6366f1",
            "background": "#111827",
            "backgroundAlt": "#1f2937",
            "surface": "#1f2937",
            "surfaceAlt": "#374151",
            "text": "#f9fafb",
            "textSecondary": "#d1d5db",
            "textMuted": "#9ca3af",
            "border": "#374151",
            "borderLight": "#4b5563",
            "success": "#34d399",
            "successLight": "#6ee7b7",
            "warning": "#fbbf24",
            "warningLight": "#fcd34d",
            "error": "#f87171",
            "errorLight": "#fca5a5",
            "info": "#60a5fa",
            "infoLight": "#93c5fd"
        }'::jsonb,
        '{
            "heading": "Inter, system-ui, sans-serif",
            "body": "Inter, system-ui, sans-serif",
            "mono": "JetBrains Mono, monospace"
        }'::jsonb,
        '0.5rem',
        '1rem',
        '🌙',
        'dark',
        2
    ),
    (
        'amberBlue',
        'Amber & Blue',
        'Professional and trustworthy color scheme',
        '{
            "primary": "#f59e0b",
            "primaryLight": "#fbbf24",
            "primaryDark": "#d97706",
            "secondary": "#3b82f6",
            "secondaryLight": "#60a5fa",
            "secondaryDark": "#2563eb",
            "background": "#fef3c7",
            "backgroundAlt": "#fdf6e3",
            "surface": "#ffffff",
            "surfaceAlt": "#fef3c7",
            "text": "#1e1b4b",
            "textSecondary": "#4338ca",
            "textMuted": "#6366f1",
            "border": "#fcd34d",
            "borderLight": "#fde68a",
            "success": "#059669",
            "successLight": "#10b981",
            "warning": "#d97706",
            "warningLight": "#f59e0b",
            "error": "#dc2626",
            "errorLight": "#ef4444",
            "info": "#3b82f6",
            "infoLight": "#60a5fa"
        }'::jsonb,
        '{
            "heading": "Playfair Display, serif",
            "body": "Inter, system-ui, sans-serif",
            "mono": "Fira Code, monospace"
        }'::jsonb,
        '0.375rem',
        '1rem',
        '✂️',
        'light',
        3
    ),
    (
        'midnightTeal',
        'Midnight Teal',
        'Classic barbershop feel with modern touches',
        '{
            "primary": "#14b8a6",
            "primaryLight": "#2dd4bf",
            "primaryDark": "#0d9488",
            "secondary": "#1e293b",
            "secondaryLight": "#334155",
            "secondaryDark": "#0f172a",
            "background": "#0f172a",
            "backgroundAlt": "#1e293b",
            "surface": "#1e293b",
            "surfaceAlt": "#334155",
            "text": "#f1f5f9",
            "textSecondary": "#94a3b8",
            "textMuted": "#64748b",
            "border": "#334155",
            "borderLight": "#475569",
            "success": "#14b8a6",
            "successLight": "#2dd4bf",
            "warning": "#f59e0b",
            "warningLight": "#fbbf24",
            "error": "#ef4444",
            "errorLight": "#f87171",
            "info": "#0ea5e9",
            "infoLight": "#38bdf8"
        }'::jsonb,
        '{
            "heading": "Oswald, sans-serif",
            "body": "Open Sans, sans-serif",
            "mono": "Space Mono, monospace"
        }'::jsonb,
        '0.25rem',
        '1.25rem',
        '🎩',
        'dark',
        4
    ),
    (
        'roseGold',
        'Rose Gold',
        'Modern and luxurious feel',
        '{
            "primary": "#e11d48",
            "primaryLight": "#f43f5e",
            "primaryDark": "#be123c",
            "secondary": "#764af1",
            "secondaryLight": "#8b5cf6",
            "secondaryDark": "#6d28d9",
            "background": "#fff1f2",
            "backgroundAlt": "#ffe4e6",
            "surface": "#ffffff",
            "surfaceAlt": "#fff1f2",
            "text": "#1c1917",
            "textSecondary": "#57534e",
            "textMuted": "#a8a29e",
            "border": "#fecdd3",
            "borderLight": "#fda4af",
            "success": "#059669",
            "successLight": "#10b981",
            "warning": "#d97706",
            "warningLight": "#f59e0b",
            "error": "#dc2626",
            "errorLight": "#ef4444",
            "info": "#0891b2",
            "infoLight": "#06b6d4"
        }'::jsonb,
        '{
            "heading": "DM Sans, sans-serif",
            "body": "DM Sans, sans-serif",
            "mono": "IBM Plex Mono, monospace"
        }'::jsonb,
        '1rem',
        '1.25rem',
        '🌸',
        'light',
        5
    ),
    (
        'oceanBlue',
        'Ocean Blue',
        'Fresh and calming coastal vibes',
        '{
            "primary": "#0284c7",
            "primaryLight": "#0ea5e9",
            "primaryDark": "#0369a1",
            "secondary": "#06b6d4",
            "secondaryLight": "#22d3ee",
            "secondaryDark": "#0891b2",
            "background": "#f0f9ff",
            "backgroundAlt": "#e0f2fe",
            "surface": "#ffffff",
            "surfaceAlt": "#f0f9ff",
            "text": "#0c4a6e",
            "textSecondary": "#0369a1",
            "textMuted": "#7dd3fc",
            "border": "#bae6fd",
            "borderLight": "#e0f2fe",
            "success": "#059669",
            "successLight": "#10b981",
            "warning": "#d97706",
            "warningLight": "#f59e0b",
            "error": "#dc2626",
            "errorLight": "#ef4444",
            "info": "#0284c7",
            "infoLight": "#0ea5e9"
        }'::jsonb,
        '{
            "heading": "Poppins, sans-serif",
            "body": "Poppins, sans-serif",
            "mono": "PT Mono, monospace"
        }'::jsonb,
        '0.75rem',
        '1rem',
        '🌊',
        'light',
        6
    ),
    (
        'highContrast',
        'High Contrast',
        'Maximum accessibility and readability',
        '{
            "primary": "#000000",
            "primaryLight": "#1a1a1a",
            "primaryDark": "#000000",
            "secondary": "#0000ff",
            "secondaryLight": "#0000ff",
            "secondaryDark": "#00008b",
            "background": "#ffffff",
            "backgroundAlt": "#ffffff",
            "surface": "#ffffff",
            "surfaceAlt": "#ffffff",
            "text": "#000000",
            "textSecondary": "#000000",
            "textMuted": "#333333",
            "border": "#000000",
            "borderLight": "#cccccc",
            "success": "#000000",
            "successLight": "#00cc00",
            "warning": "#000000",
            "warningLight": "#ffcc00",
            "error": "#000000",
            "errorLight": "#ff0000",
            "info": "#000000",
            "infoLight": "#0066ff"
        }'::jsonb,
        '{
            "heading": "Arial, Helvetica, sans-serif",
            "body": "Arial, Helvetica, sans-serif",
            "mono": "Courier New, monospace"
        }'::jsonb,
        '0rem',
        '1rem',
        '♿',
        'custom',
        7
    );

-- Create function to get theme for a shop
CREATE OR REPLACE FUNCTION get_shop_theme(p_shop_id UUID)
RETURNS TABLE (
    id UUID,
    shop_id UUID,
    theme_name VARCHAR,
    colors JSONB,
    fonts JSONB,
    border_radius VARCHAR,
    spacing VARCHAR,
    custom_css TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    accent_emoji VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        st.id,
        st.shop_id,
        st.theme_name,
        st.colors,
        st.fonts,
        st.border_radius,
        st.spacing,
        st.custom_css,
        st.logo_url,
        st.favicon_url,
        st.accent_emoji
    FROM shop_themes st
    WHERE st.shop_id = p_shop_id AND st.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to get all visible presets
CREATE OR REPLACE FUNCTION get_theme_presets()
RETURNS TABLE (
    id UUID,
    preset_key VARCHAR,
    name VARCHAR,
    description TEXT,
    colors JSONB,
    fonts JSONB,
    border_radius VARCHAR,
    spacing VARCHAR,
    accent_emoji VARCHAR,
    category VARCHAR,
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tp.id,
        tp.preset_key,
        tp.name,
        tp.description,
        tp.colors,
        tp.fonts,
        tp.border_radius,
        tp.spacing,
        tp.accent_emoji,
        tp.category,
        tp.sort_order
    FROM theme_presets tp
    WHERE tp.is_visible = true
    ORDER BY tp.sort_order ASC, tp.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Add comment documenting the tables
COMMENT ON TABLE shop_themes IS 'Custom themes for each barber shop';
COMMENT ON TABLE theme_presets IS 'Pre-defined theme presets available to all shops';
COMMENT ON COLUMN shop_themes.colors IS 'JSON object with 20+ color properties including light/dark variants';
COMMENT ON COLUMN shop_themes.custom_css IS 'Custom CSS injected directly into the shop''s stylesheet';

-- Grant permissions (adjust roles as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON shop_themes TO barber_app;
-- GRANT SELECT ON theme_presets TO barber_app;
-- GRANT EXECUTE ON FUNCTION get_shop_theme(UUID) TO barber_app;
-- GRANT EXECUTE ON FUNCTION get_theme_presets() TO barber_app;

-- Completed successfully
SELECT 'Shop Themes migration completed successfully' as status;
