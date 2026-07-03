-- Run via Supabase SQL editor or: supabase db push
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE sperm_lib_publications ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE sperm_lib_datasets ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_sperm_lib_pub_external ON sperm_lib_publications(external_id);
CREATE INDEX IF NOT EXISTS idx_sperm_lib_ds_external ON sperm_lib_datasets(external_id);
CREATE INDEX IF NOT EXISTS idx_sperm_lib_ds_omics ON sperm_lib_datasets(omics_type);
CREATE INDEX IF NOT EXISTS idx_sperm_lib_ds_tissue ON sperm_lib_datasets(tissue);
CREATE INDEX IF NOT EXISTS idx_sperm_lib_pub_year ON sperm_lib_publications(year DESC);

CREATE TABLE IF NOT EXISTS sperm_lib_ingest_manifest (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_run TIMESTAMPTZ,
  duration_ms INTEGER,
  counts JSONB,
  errors JSONB,
  schedule TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sperm_lib_ingest_manifest ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read manifest" ON sperm_lib_ingest_manifest;
CREATE POLICY "Public read manifest" ON sperm_lib_ingest_manifest FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION sperm_lib_dashboard_stats()
RETURNS JSON
LANGUAGE sql
STABLE
AS $$
  SELECT json_build_object(
    'totalPublications', (SELECT count(*)::int FROM sperm_lib_publications),
    'totalDatasets', (SELECT count(*)::int FROM sperm_lib_datasets),
    'omicsBreakdown', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT omics_type::text AS type, count(*)::int AS count
        FROM sperm_lib_datasets GROUP BY omics_type ORDER BY count DESC
      ) t
    ),
    'tissueBreakdown', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT tissue::text, count(*)::int AS count
        FROM sperm_lib_datasets GROUP BY tissue ORDER BY count DESC
      ) t
    ),
    'yearBreakdown', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT year, count(*)::int AS count
        FROM sperm_lib_publications WHERE year IS NOT NULL
        GROUP BY year ORDER BY year
      ) t
    )
  );
$$;
