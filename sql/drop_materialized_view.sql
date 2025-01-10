-- Drop the materialized view
DROP MATERIALIZED VIEW IF EXISTS view_divergencias_fichas CASCADE;

-- Drop the refresh function if it exists
DROP FUNCTION IF EXISTS refresh_view_divergencias_fichas() CASCADE;

-- Drop the refresh trigger if it exists
DROP TRIGGER IF EXISTS refresh_divergencias_fichas_trigger ON divergencias;
