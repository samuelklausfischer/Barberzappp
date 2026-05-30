-- ============================================================
-- BARBERZAP CRM - EXTENSÃO PARA PROSPECÇÃO OUTBOUND
-- ============================================================
-- Date: 2026-02-23
-- Purpose: Extend crm_leads table for tracking outbound prospection
--
-- Migration Steps:
-- 1. ADD columns for tracking prospection leads
-- 2. CREATE indexes for performance
-- 3. CREATE views for analytics dashboard
-- 4. CREATE functions for auto-calculations
-- 5. UPDATE comments/documentation
-- ============================================================

-- ============================================================
-- STEP 1: ADD COLUMNS TO crm_leads TABLE
-- ============================================================

-- Columns for lead source tracking
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS lead_source VARCHAR(50) DEFAULT 'whatsapp';

-- Columns for funnel stage tracking
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS funnel_stage VARCHAR(50) DEFAULT 'new';

-- Columns for contact timings
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS first_contact_at TIMESTAMPTZ;

ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;

ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS last_status_change TIMESTAMPTZ;

-- Columns for message counters
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS messages_sent INTEGER DEFAULT 0;

ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS messages_received INTEGER DEFAULT 0;

-- Column for response rate (auto-calculated)
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS response_rate DECIMAL(5,2) DEFAULT 0;

-- Columns for engagement scoring
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS interest_score INTEGER DEFAULT 0;

-- Columns for follow-up tracking
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100);

ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS loss_reason VARCHAR(255);

ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMPTZ;

ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS followup_count INTEGER DEFAULT 0;

-- ============================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- ============================================================

-- Index for funnel stage (used in dashboard filters)
CREATE INDEX IF NOT EXISTS idx_crm_leads_funnel_stage ON crm_leads(tenant_id, funnel_stage);

-- Index for lead source tracking
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON crm_leads(tenant_id, lead_source);

-- Index for first contact timing (analytics)
CREATE INDEX IF NOT EXISTS idx_crm_leads_first_contact ON crm_leads(first_contact_at DESC);

-- Index for next follow-up (used for "needs action" queries)
CREATE INDEX IF NOT EXISTS idx_crm_leads_next_followup ON crm_leads(next_followup_at)
    WHERE next_followup_at IS NOT NULL;

-- Index for response rate (prioritizing high-response leads)
CREATE INDEX IF NOT EXISTS idx_crm_leads_response_rate ON crm_leads(response_rate DESC);

-- Index for last status change (for recent activity)
CREATE INDEX IF NOT EXISTS idx_crm_leads_status_change ON crm_leads(last_status_change DESC);

-- Composite index for performance of dashboard queries
CREATE INDEX IF NOT EXISTS idx_crm_leads_dashboard_query ON crm_leads(tenant_id, funnel_stage, lead_source);

-- ============================================================
-- STEP 3: CREATE VIEWS FOR ANALYTICS DASHBOARD
-- ============================================================

-- View: Prospection Summary Dashboard
CREATE OR REPLACE VIEW crm_prospection_summary AS
WITH
-- Total leads in period
total_leads AS (
    SELECT
        COUNT(*) AS total_count,
        COUNT(*) FILTER (WHERE lead_source = 'prospection_csv') AS csv_count,
        COUNT(*) FILTER (WHERE lead_source = 'whatsapp') AS whatsapp_count,
        COUNT(*) FILTER (WHERE lead_source = 'landing_page') AS lp_count
    FROM crm_leads
    WHERE tenant_id = current_setting('app.current_tenant_id')::BIGINT
),
-- By funnel stage
by_stage AS (
    SELECT
        funnel_stage,
        COUNT(*) AS lead_count,
        AVG(messages_sent) AS avg_messages_sent,
        AVG(messages_received) AS avg_messages_received,
        AVG(response_rate) AS avg_response_rate
    FROM crm_leads
    WHERE tenant_id = current_setting('app.current_tenant_id')::BIGINT
    GROUP BY funnel_stage
),
-- Leads needing action
needs_action AS (
    SELECT
        COUNT(*) FILTER (WHERE funnel_stage = 'new') AS needs_first_contact,
        COUNT(*) FILTER (
            WHERE funnel_stage = 'considering'
            AND next_followup_at IS NOT NULL
            AND next_followup_at <= NOW()
        ) AS needs_followup,
        COUNT(*) FILTER (
            WHERE funnel_stage = 'demo_requested'
            AND next_followup_at IS NOT NULL
        ) AS needs_demo_scheduling,
        COUNT(*) FILTER (WHERE funnel_stage = 'unresponsive') AS unresponsive
    FROM crm_leads
    WHERE tenant_id = current_setting('app.current_tenant_id')::BIGINT
)
SELECT
    t.total_count,
    t.csv_count,
    t.whatsapp_count,
    t.lp_count,
    s.funnel_stage,
    s.lead_count,
    s.avg_messages_sent,
    s.avg_messages_received,
    s.avg_response_rate,
    n.needs_first_contact,
    n.needs_followup,
    n.needs_demo_scheduling,
    n.unresponsive
FROM total_leads t
CROSS JOIN LATERAL (SELECT * FROM by_stage) s
CROSS JOIN LATERAL (SELECT * FROM needs_action) n;

COMMENT ON VIEW crm_prospection_summary IS
    'Summary dashboard view for prospection analytics';

-- View: Funnel stages breakdown
CREATE OR REPLACE VIEW crm_prospection_funnel AS
SELECT
    funnel_stage,
    COUNT(*) AS lead_count,
    -- Percentage of total leads reached this stage
    ROUND(COUNT(*) * 100.0 / NULLIF(
        (SELECT COUNT(*) FROM crm_leads WHERE tenant_id = current_setting('app.current_tenant_id')::BIGINT),
        0
    ), 1) AS percentage_of_total,
    -- Average messages sent at this stage
    AVG(messages_sent) AS avg_messages_sent,
    -- Average messages received at this stage
    AVG(messages_received) AS avg_messages_received,
    -- Average response rate
    AVG(response_rate) AS avg_response_rate,
    -- Average days in this stage (if status changed)
    ROUND(AVG(
        EXTRACT(EPOCH FROM (last_status_change - created_at)) / 86400
    ), 1) AS avg_days_in_stage,
    -- Earliest created at this stage
    MIN(created_at) AS earliest_created,
    -- Latest created at this stage
    MAX(created_at) AS latest_created
FROM crm_leads
WHERE tenant_id = current_setting('app.current_tenant_id')::BIGINT
GROUP BY funnel_stage
ORDER BY
    CASE funnel_stage
        WHEN 'new' THEN 1
        WHEN 'contacted' THEN 2
        WHEN 'responded' THEN 3
        WHEN 'interested' THEN 4
        WHEN 'demo_requested' THEN 5
        WHEN 'demo_scheduled' THEN 6
        WHEN 'considering' THEN 7
        WHEN 'customer' THEN 8
        WHEN 'active' THEN 8
        WHEN 'not_interested' THEN 9
        WHEN 'unresponsive' THEN 10
        WHEN 'failed' THEN 11
        WHEN 'lost' THEN 12
        ELSE 99
    END;

COMMENT ON VIEW crm_prospection_funnel IS
    'Funnel stages breakdown with analytics metrics';

-- View: Leads needing follow-up
CREATE OR REPLACE VIEW crm_leads_needs_followup AS
SELECT
    l.id AS lead_id,
    l.name,
    l.phone,
    l.city,
    l.funnel_stage,
    l.messages_sent,
    l.messages_received,
    l.response_rate,
    l.next_followup_at,
    l.last_contact_at,
    l.followup_count,
    -- Suggested action
    CASE
        WHEN l.funnel_stage = 'new' THEN 'Enviar 1º contato'
        WHEN l.funnel_stage = 'contacted'
             AND l.messages_sent >= 3
             AND l.messages_received = 0 THEN 'Marcar como unresponsive ou tentar outro canal'
        WHEN l.funnel_stage = 'considering'
             AND l.next_followup_at IS NOT NULL
             AND l.next_followup_at <= NOW() THEN 'Enviar follow-up de acompanhamento'
        WHEN l.funnel_stage = 'demo_requested' THEN 'Agendar demonstração'
        WHEN l.funnel_stage = 'interested'
             AND (NOW() - l.last_contact_at) > INTERVAL '3 days' THEN 'Re-engajar lead'
        ELSE NULL
    END AS suggested_action,
    -- Priority level
    CASE
        WHEN l.next_followup_at IS NOT NULL
             AND l.next_followup_at <= NOW() THEN 'urgent'
        WHEN l.next_followup_at IS NOT NULL
             AND l.next_followup_at <= NOW() + INTERVAL '1 day' THEN 'today'
        WHEN l.funnel_stage = 'new' AND l.messages_sent = 0 THEN 'high'
        WHEN l.funnel_stage IN ('interested', 'demo_requested') THEN 'high'
        WHEN l.funnel_stage = 'considering' THEN 'medium'
        WHEN l.funnel_stage = 'unresponsive' THEN 'low'
        ELSE 'normal'
    END AS priority,
    -- Days since last contact
    EXTRACT(DAY FROM (NOW() - l.last_contact_at)) AS days_since_contact
FROM crm_leads l
WHERE l.tenant_id = current_setting('app.current_tenant_id')::BIGINT
AND (
    -- Needs first contact
    l.funnel_stage = 'new'
    OR
    -- Follow-up overdue
    (l.funnel_stage = 'considering'
     AND l.next_followup_at IS NOT NULL
     AND l.next_followup_at <= NOW() + INTERVAL '2 days')
    OR
    -- Demo requested but not scheduled
    l.funnel_stage = 'demo_requested'
    OR
    -- Interested but inactive > 3 days
    (l.funnel_stage = 'interested'
     AND l.last_contact_at IS NOT NULL
     AND (NOW() - l.last_contact_at) > INTERVAL '3 days')
    OR
    -- Unresponsive but might need review
    l.funnel_stage = 'unresponsive'
)
ORDER BY
    CASE priority
        WHEN 'urgent' THEN 1
        WHEN 'today' THEN 2
        WHEN 'high' THEN 3
        WHEN 'medium' THEN 4
        WHEN 'low' THEN 5
        ELSE 6
    END,
    l.next_followup_at ASC;

COMMENT ON VIEW crm_leads_needs_followup IS
    'View of leads that need immediate follow-up actions';

-- View: Geographic distribution analytics
CREATE OR REPLACE VIEW crm_geographic_analytics AS
SELECT
    l.city,
    l.metadata->>'neighborhood' AS neighborhood,
    COUNT(*) AS total_leads,
    COUNT(*) FILTER (WHERE l.messages_received > 0) AS responded_leads,
    ROUND(
        COUNT(*) FILTER (WHERE l.messages_received > 0) * 100.0 / NULLIF(COUNT(*), 0),
        1
    ) AS response_rate,
    AVG(l.response_rate) AS avg_response_rate,
    COUNT(*) FILTER (WHERE l.funnel_stage = 'interested') AS interested_leads,
    COUNT(*) FILTER (WHERE l.funnel_stage IN ('customer', 'active')) AS converted_leads,
    AVG(
        EXTRACT(EPOCH FROM (l.last_contact_at - l.first_contact_at)) / 86400
    ) AS avg_days_to_response,
    MIN(l.first_contact_at) AS first_contact_earliest,
    MAX(l.last_contact_at) AS last_contact_latest
FROM crm_leads l
WHERE l.tenant_id = current_setting('app.current_tenant_id')::BIGINT
AND l.lead_source = 'prospection_csv'
AND l.city IS NOT NULL
AND l.city != ''
GROUP BY l.city, l.metadata->>'neighborhood'
ORDER BY total_leads DESC;

COMMENT ON VIEW crm_geographic_analytics IS
    'Geographic distribution with response and conversion metrics';

-- View: Timing analytics (hour of day, day of week)
CREATE OR REPLACE VIEW crm_timing_analytics AS
WITH
-- Extract hour from contact times
hourly_distribution AS (
    SELECT
        EXTRACT(HOUR FROM first_contact_at) AS hour_of_day,
        COUNT(*) AS leads_contacted,
        COUNT(*) FILTER (WHERE messages_received > 0) AS leads_responded,
        ROUND(
            COUNT(*) FILTER (WHERE messages_received > 0) * 100.0 / NULLIF(COUNT(*), 0),
            1
        ) AS response_rate
    FROM crm_leads
    WHERE tenant_id = current_setting('app.current_tenant_id')::BIGINT
    AND lead_source = 'prospection_csv'
    AND first_contact_at IS NOT NULL
    GROUP BY EXTRACT(HOUR FROM first_contact_at)
),
-- Extract day of week from contact times
daily_distribution AS (
    SELECT
        EXTRACT(DOW FROM first_contact_at) AS day_of_week,
        COUNT(*) AS leads_contacted,
        COUNT(*) FILTER (WHERE messages_received > 0) AS leads_responded,
        ROUND(
            COUNT(*) FILTER (WHERE messages_received > 0) * 100.0 / NULLIF(COUNT(*), 0),
            1
        ) AS response_rate,
        TO_DOW(first_contact_at)::text AS day_name
    FROM crm_leads
    WHERE tenant_id = current_setting('app.current_tenant_id')::BIGINT
    AND lead_source = 'prospection_csv'
    AND first_contact_at IS NOT NULL
    GROUP BY EXTRACT(DOW FROM first_contact_at), TO_DOW(first_contact_at)
)
SELECT
    'hourly' AS time_granularity,
    hour_of_day::integer AS time_value,
    NULL::text AS time_label,
    leads_contacted,
    leads_responded,
    response_rate
FROM hourly_distribution
UNION ALL
SELECT
    'daily' AS time_granularity,
    day_of_week::integer AS time_value,
    day_name AS time_label,
    leads_contacted,
    leads_responded,
    response_rate
FROM daily_distribution
ORDER BY time_granularity, time_value;

COMMENT ON VIEW crm_timing_analytics IS
    'Timing analytics: best hour of day and day of week for contacts';

-- View: Conversion rates across funnel stages
CREATE OR REPLACE VIEW crm_conversion_rates AS
WITH stage_counts AS (
    SELECT
        funnel_stage,
        COUNT(*) AS count
    FROM crm_leads
    WHERE tenant_id = current_setting('app.current_tenant_id')::BIGINT
    GROUP BY funnel_stage
),
lead_total AS (
    SELECT COUNT(*) AS total
    FROM crm_leads
    WHERE tenant_id = current_setting('app.current_tenant_id')::BIGINT
)
SELECT
    sc.funnel_stage,
    sc.count AS stage_count,
    lt.total AS total_leads,
    ROUND(sc.count * 100.0 / NULLIF(lt.total, 0), 1) AS percentage_of_total,
    -- Conversion rate from previous stage
    CASE
        WHEN sc.funnel_stage = 'new' THEN NULL
        WHEN sc.funnel_stage = 'contacted' THEN
            ROUND(sc.count * 100.0 / NULLIF(
                (SELECT count FROM stage_counts WHERE funnel_stage = 'new'), 0
            ), 1)
        WHEN sc.funnel_stage = 'responded' THEN
            ROUND(sc.count * 100.0 / NULLIF(
                (SELECT count FROM stage_counts WHERE funnel_stage = 'contacted'), 0
            ), 1)
        WHEN sc.funnel_stage = 'interested' THEN
            ROUND(sc.count * 100.0 / NULLIF(
                (SELECT count FROM stage_counts WHERE funnel_stage = 'responded'), 0
            ), 1)
        WHEN sc.funnel_stage = 'demo_requested' THEN
            ROUND(sc.count * 100.0 / NULLIF(
                (SELECT count FROM stage_counts WHERE funnel_stage = 'interested'), 0
            ), 1)
        WHEN sc.funnel_stage = 'demo_scheduled' THEN
            ROUND(sc.count * 100.0 / NULLIF(
                (SELECT count FROM stage_counts WHERE funnel_stage = 'demo_requested'), 0
            ), 1)
        WHEN sc.funnel_stage IN ('customer', 'active') THEN
            ROUND(sc.count * 100.0 / NULLIF(
                (SELECT count FROM stage_counts WHERE funnel_stage = 'demo_scheduled'), 0
            ), 1)
        ELSE NULL
    END AS conversion_rate
FROM stage_counts sc, lead_total lt
ORDER BY
    CASE sc.funnel_stage
        WHEN 'new' THEN 1
        WHEN 'contacted' THEN 2
        WHEN 'responded' THEN 3
        WHEN 'interested' THEN 4
        WHEN 'demo_requested' THEN 5
        WHEN 'demo_scheduled' THEN 6
        WHEN 'considering' THEN 7
        WHEN 'customer' THEN 8
        WHEN 'active' THEN 8
        When 'not_interested' THEN 9
        WHEN 'unresponsive' THEN 10
        WHEN 'failed' THEN 11
        WHEN 'lost' THEN 12
        ELSE 99
    END;

COMMENT ON VIEW crm_conversion_rates IS
    'Conversion rates across funnel stages';

-- ============================================================
-- STEP 4: UPDATE COMMENTS AND DOCUMENTATION
-- ============================================================

COMMENT ON COLUMN crm_leads.lead_source IS
    'Source where the lead originated: ''whatsapp'' (webhook), ''prospection_csv'', ''landing_page'', ''referral'', ''meta_ads'', ''email_outreach''';

COMMENT ON COLUMN crm_leads.funnel_stage IS
    'Current stage in the prospection funnel: new, contacted, responded, interested, demo_requested, demo_scheduled, considering, customer, active, not_interested, unresponsive, failed, lost';

COMMENT ON COLUMN crm_leads.first_contact_at IS
    'Timestamp of FIRST outbound contact attempt';

COMMENT ON COLUMN crm_leads.last_contact_at IS
    'Timestamp of LAST contact (inbound or outbound)';

COMMENT ON COLUMN crm_leads.last_status_change IS
    'Timestamp when funnel_stage was last updated';

COMMENT ON COLUMN crm_leads.messages_sent IS
    'Counter of OUTBOUND messages sent to this lead';

COMMENT ON COLUMN crm_leads.messages_received IS
    'Counter of INBOUND messages received from this lead';

COMMENT ON COLUMN crm_leads.response_rate IS
    'Response rate percentage (messages_received / messages_sent * 100), auto-calculated';

COMMENT ON COLUMN crm_leads.interest_score IS
    'Interest score (0-100) based on engagement levels,可用于prioritization';

COMMENT ON COLUMN crm_leads.assigned_to IS
    'User responsible for this lead (name or ID)';

COMMENT ON COLUMN crm_leads.loss_reason IS
    'Reason for losing the lead (if funnel_stage = ''lost'')';

COMMENT ON COLUMN crm_leads.next_followup_at IS
    'Timestamp of next scheduled follow-up action';

COMMENT ON COLUMN crm_leads.followup_count IS
    'Counter of follow-up attempts made';

-- ============================================================
-- STEP 5: CREATE SAMPLE TEST DATA (OPTIONAL)
-- ============================================================
-- Uncomment to create test data for development/testing:

/*
-- Sample lead for testing
INSERT INTO crm_leads (tenant_id, phone, name, email, status, lead_source, funnel_stage, first_contact_at, last_contact_at, messages_sent, messages_received, response_rate)
VALUES
    (1, '5547933114288', 'Barbearia VIP Itajaí', NULL, 'new', 'prospection_csv', 'new', NOW(), NOW(), 0, 0, 0);

-- Another sample
INSERT INTO crm_leads (tenant_id, phone, name, email, status, lead_source, funnel_stage, first_contact_at, last_contact_at, messages_sent, messages_received, response_rate)
VALUES
    (1, '554792244332', 'Gajo Barber Shop Centro', NULL, 'contacted', 'prospection_csv', 'responded', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 2, 1, 50.0);
*/

-- ============================================================
-- END OF MIGRATION
-- ============================================================

-- Verification Query (run after migration to verify):
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'crm_leads'
-- AND column_name IN ('lead_source', 'funnel_stage', 'first_contact_at', 'last_contact_at',
--                      'last_status_change', 'messages_sent', 'messages_received', 'response_rate',
--                      'interest_score', 'assigned_to', 'loss_reason', 'next_followup_at', 'followup_count')
-- ORDER BY ordinal_position;
