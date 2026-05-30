-- Migration: 21_api_versions.sql
-- Description: Create API versioning table for tracking OpenAPI specification changes
-- Author: BarberZap
-- Date: 2025-03-05

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- API versions table for tracking OpenAPI specification history
CREATE TABLE IF NOT EXISTS api_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(20) NOT NULL,
    spec_hash VARCHAR(64) NOT NULL,
    spec JSONB NOT NULL,
    is_latest BOOLEAN DEFAULT FALSE,
    changes TEXT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    endpoints_count INTEGER DEFAULT 0,
    tags_count INTEGER DEFAULT 0,
    schemas_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure version uniqueness
    CONSTRAINT api_versions_version_unique UNIQUE (version),
    
    -- Ensure only one latest version exists
    CONSTRAINT api_versions_single_latest CHECK (
        (is_latest = FALSE) OR
        (is_latest = TRUE AND version = (
            SELECT MIN(version) FROM api_versions WHERE is_latest = TRUE
        ))
    )
);

-- Index for fast version lookup
CREATE INDEX IF NOT EXISTS idx_api_versions_version ON api_versions(version);
CREATE INDEX IF NOT EXISTS idx_api_versions_is_latest ON api_versions(is_latest) WHERE is_latest = TRUE;
CREATE INDEX IF NOT EXISTS idx_api_versions_published_at ON api_versions(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_versions_spec_hash ON api_versions(spec_hash);

-- Index for spec JSONB queries (if needed)
CREATE INDEX IF NOT EXISTS idx_api_versions_spec_gin ON api_versions USING GIN (spec);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_api_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_api_versions_updated_at ON api_versions;
CREATE TRIGGER trigger_api_versions_updated_at
    BEFORE UPDATE ON api_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_api_versions_updated_at();

-- Function to maintain single latest version
CREATE OR REPLACE FUNCTION maintain_single_latest_version()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new version is marked as latest, unmark all others
    IF NEW.is_latest = TRUE AND (OLD IS NULL OR OLD.is_latest = FALSE) THEN
        UPDATE api_versions
        SET is_latest = FALSE
        WHERE is_latest = TRUE AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for maintaining single latest version
DROP TRIGGER IF EXISTS trigger_maintain_latest_version ON api_versions;
CREATE TRIGGER trigger_maintain_latest_version
    BEFORE INSERT OR UPDATE OF is_latest ON api_versions
    FOR EACH ROW
    EXECUTE FUNCTION maintain_single_latest_version();

-- Function to extract endpoint count from spec
CREATE OR REPLACE FUNCTION extract_endpoint_count(spec JSONB)
RETURNS INTEGER AS $$
BEGIN
    RETURN jsonb_array_length(
        SELECT jsonb_agg(jsonb_object_keys(spec->'paths'))
        -- Count total methods across all paths
        SELECT (
            SELECT SUM(
                CASE 
                    WHEN jsonb_typeof(value) = 'object' THEN 
                        jsonb_array_length(
                            jsonb_agg(key) FILTER (WHERE key IN ('get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'))
                        )
                    ELSE 0
                END
            ) FROM jsonb_each(spec->'paths')
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to extract tag count from spec
CREATE OR REPLACE FUNCTION extract_tag_count(spec JSONB)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(DISTINCT jsonb_array_elements_text(value->'tags'))
        FROM jsonb_each(spec->'paths')
        CROSS JOIN jsonb_array_elements(value)
        WHERE value ? 'tags'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to extract schema count from spec
CREATE OR REPLACE FUNCTION extract_schema_count(spec JSONB)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(jsonb_array_length(
        SELECT jsonb_agg(jsonb_object_keys(spec->'components'->'schemas'))
    ), 0);
    
    -- Alternative approach
    -- RETURN COALESCE((spec->'components'->'schemas')::jsonb->>'#count')::int, 0);
END;
$$ LANGUAGE plpgsql;

-- Simplified counts (avoiding complex JSON extraction)
CREATE OR REPLACE FUNCTION populate_api_version_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple extraction approach
    IF NEW.spec IS NOT NULL THEN
        -- Extract endpoint count
        BEGIN
            SELECT COUNT(*) INTO NEW.endpoints_count
            FROM jsonb_each(NEW.spec->'paths') AS path
            CROSS JOIN jsonb_each(path.value) AS operation;
        EXCEPTION WHEN OTHERS THEN
            NEW.endpoints_count := 0;
        END;
        
        -- Extract tag count
        BEGIN
            SELECT COUNT(DISTINCT tag) INTO NEW.tags_count
            FROM jsonb_each(NEW.spec->'paths') AS path,
                 jsonb_array_elements_text(path.value->'tags') AS tag
            WHERE path.value ? 'tags';
        EXCEPTION WHEN OTHERS THEN
            NEW.tags_count := 0;
        END;
        
        -- Extract schema count
        BEGIN
            SELECT COUNT(*) INTO NEW.schemas_count
            FROM jsonb_object_keys(NEW.spec->'components'->'schemas') AS schema;
        EXCEPTION WHEN OTHERS THEN
            NEW.schemas_count := 0;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-populating counts
DROP TRIGGER IF EXISTS trigger_populate_version_counts ON api_versions;
CREATE TRIGGER trigger_populate_version_counts
    BEFORE INSERT OR UPDATE OF spec ON api_versions
    FOR EACH ROW
    EXECUTE FUNCTION populate_api_version_counts();

-- Function to get version history
CREATE OR REPLACE FUNCTION get_api_version_history(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    version VARCHAR,
    spec_hash VARCHAR,
    changes TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    endpoints_count INTEGER,
    tags_count INTEGER,
    schemas_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        av.version,
        av.spec_hash,
        av.changes,
        av.published_at,
        av.endpoints_count,
        av.tags_count,
        av.schemas_count
    FROM api_versions av
    ORDER BY av.published_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to compare two versions and get diff
CREATE OR REPLACE FUNCTION compare_api_versions(v1 VARCHAR, v2 VARCHAR)
RETURNS TABLE (
    version1 VARCHAR,
    version2 VARCHAR,
    endpoints_added JSONB,
    endpoints_removed JSONB,
    schemas_added JSONB,
    schemas_removed JSONB,
    tags_added JSONB,
    tags_removed JSONB
) AS $$
DECLARE
    spec1 JSONB;
    spec2 JSONB;
BEGIN
    -- Get the specs
    SELECT spec INTO spec1 FROM api_versions WHERE version = v1;
    SELECT spec INTO spec2 FROM api_versions WHERE version = v2;
    
    IF spec1 IS NULL OR spec2 IS NULL THEN
        RETURN;
    END IF;
    
    -- Compare
    RETURN QUERY SELECT
        v1,
        v2,
        (SELECT jsonb_agg(path) FROM jsonb_object_keys(spec1->'paths') AS path WHERE NOT (spec2->'paths' ? path))::jsonb AS endpoints_added,
        (SELECT jsonb_agg(path) FROM jsonb_object_keys(spec2->'paths') AS path WHERE NOT (spec1->'paths' ? path))::jsonb AS endpoints_removed,
        (SELECT jsonb_agg(schema) FROM jsonb_object_keys(spec1->'components'->'schemas') AS schema WHERE NOT (spec2->'components'->'schemas' ? schema))::jsonb AS schemas_added,
        (SELECT jsonb_agg(schema) FROM jsonb_object_keys(spec2->'components'->'schemas') AS schema WHERE NOT (spec1->'components'->'schemas' ? schema))::jsonb AS schemas_removed,
        -- Tags comparison (simplified)
        '[]'::jsonb AS tags_added,
        '[]'::jsonb AS tags_removed;
END;
$$ LANGUAGE plpgsql;

-- Function to get changelog between versions
CREATE OR REPLACE FUNCTION get_api_changelog(v1 VARCHAR DEFAULT NULL, v2 VARCHAR DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    comparison RECORD;
BEGIN
    -- Get versions to compare
    IF v1 IS NULL THEN
        SELECT version INTO v1 FROM api_versions WHERE is_latest = TRUE;
    END IF;
    
    IF v2 IS NULL THEN
        SELECT version INTO v2 FROM api_versions 
        WHERE version != v1 
        ORDER BY published_at DESC 
        LIMIT 1;
    END IF;
    
    -- Get comparison
    FOR comparison IN 
        SELECT * FROM compare_api_versions(v1, v2)
    LOOP
        result := result || 
            '# Changelog: ' || v2 || ' → ' || v1 || E'\n\n' ||
            '## Endpoints\n' ||
            'Added: ' || jsonb_pretty(comparison.endpoints_added) || E'\n' ||
            'Removed: ' || jsonb_pretty(comparison.endpoints_removed) || E'\n\n' ||
            '## Schemas\n' ||
            'Added: ' || jsonb_pretty(comparison.schemas_added) || E'\n' ||
            'Removed: ' || jsonb_pretty(comparison.schemas_removed);
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to archive old versions
CREATE OR REPLACE FUNCTION archive_old_versions(keep_count INTEGER DEFAULT 10)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER := 0;
BEGIN
    WITH old_versions AS (
        DELETE FROM api_versions
        WHERE id NOT IN (
            SELECT id FROM (
                SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC) as row_num
                FROM api_versions
                WHERE is_latest = FALSE
            ) ranked
            WHERE row_num <= keep_count
        )
        AND is_latest = FALSE
        RETURNING *
    )
    SELECT COUNT(*) INTO archived_count FROM old_versions;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON api_versions TO api_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES TO api_user;

-- Insert initial version record (placeholder)
INSERT INTO api_versions (
    version, spec_hash, spec, is_latest, changes, 
    endpoints_count, tags_count, schemas_count
) VALUES (
    '1.0.0',
    '0000000000000000000000000000000000000000000000000000000000000000',
    '{}'::jsonb,
    TRUE,
    'Initial version',
    0, 0, 0
) ON CONFLICT (version) DO NOTHING;

-- Add comments
COMMENT ON TABLE api_versions IS 'Track API version history and OpenAPI specification changes';
COMMENT ON COLUMN api_versions.version IS 'Semantic version (e.g., 1.0.0)';
COMMENT ON COLUMN api_versions.spec_hash IS 'SHA256 hash of the OpenAPI specification';
COMMENT ON COLUMN api_versions.spec IS 'Full OpenAPI specification as JSONB';
COMMENT ON COLUMN api_versions.is_latest IS 'Flag marking the latest version';
COMMENT ON COLUMN api_versions.changes IS 'Description of changes in this version';
COMMENT ON COLUMN api_versions.endpoints_count IS 'Number of API endpoints in this version';
COMMENT ON COLUMN api_versions.tags_count IS 'Number of unique tags in this version';
COMMENT ON COLUMN api_versions.schemas_count IS 'Number of schemas in this version';

-- Row Level Security (optional, based on RLS policy from previous migrations)
ALTER TABLE api_versions ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Everyone can read API versions"
    ON api_versions FOR SELECT
    USING (true);

-- Only authenticated service users can modify
CREATE POLICY "Service users can modify API versions"
    ON api_versions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM roles 
            WHERE name IN ('admin', 'system')
            AND roles.id = ANY(current_applicable_roles())
        )
    );
