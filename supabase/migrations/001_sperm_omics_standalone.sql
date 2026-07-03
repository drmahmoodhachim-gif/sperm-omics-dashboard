-- Standalone SpermOmics database schema
-- Completely isolated from public.idcc_*, public.radix_*, etc.
-- Run on a NEW Supabase project OR on existing project (creates separate schema).

CREATE SCHEMA IF NOT EXISTS sperm_omics;

-- Enums (schema-scoped)
DO $$ BEGIN
  CREATE TYPE sperm_omics.omics_type AS ENUM (
    'transcriptomics', 'proteomics', 'metabolomics', 'epigenomics',
    'genomics', 'single_cell', 'microarray', 'semen_parameters', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sperm_omics.species AS ENUM ('human', 'mouse', 'rat', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sperm_omics.tissue AS ENUM (
    'spermatozoa', 'semen', 'testis', 'epididymis', 'blood', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sperm_omics.figure_type AS ENUM (
    'volcano', 'heatmap', 'pca', 'bar', 'scatter', 'venn', 'pathway', 'table', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS sperm_omics.publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  pmid TEXT,
  doi TEXT,
  title TEXT NOT NULL,
  authors TEXT,
  journal TEXT,
  year INTEGER,
  abstract TEXT,
  keywords TEXT[],
  url TEXT,
  citation_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sperm_omics.datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  publication_id UUID REFERENCES sperm_omics.publications(id) ON DELETE SET NULL,
  accession TEXT NOT NULL UNIQUE,
  repository TEXT NOT NULL,
  title TEXT NOT NULL,
  omics_type sperm_omics.omics_type NOT NULL,
  species sperm_omics.species DEFAULT 'human',
  tissue sperm_omics.tissue DEFAULT 'spermatozoa',
  sample_count INTEGER,
  platform TEXT,
  phenotype TEXT,
  summary TEXT,
  url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sperm_omics.methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  protocol TEXT,
  software TEXT[],
  parameters JSONB,
  reference_citations TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sperm_omics.figures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  publication_id UUID REFERENCES sperm_omics.publications(id) ON DELETE SET NULL,
  dataset_id UUID REFERENCES sperm_omics.datasets(id) ON DELETE SET NULL,
  method_id UUID REFERENCES sperm_omics.methods(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  figure_type sperm_omics.figure_type NOT NULL,
  caption TEXT,
  config JSONB,
  data JSONB,
  is_publication_ready BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sperm_omics.measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES sperm_omics.datasets(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  feature_type TEXT,
  group_a TEXT,
  group_b TEXT,
  value_a NUMERIC,
  value_b NUMERIC,
  fold_change NUMERIC,
  p_value NUMERIC,
  adj_p_value NUMERIC,
  unit TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sperm_omics.ingest_manifest (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_run TIMESTAMPTZ,
  duration_ms INTEGER,
  counts JSONB,
  errors JSONB,
  schedule TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pub_external ON sperm_omics.publications(external_id);
CREATE INDEX IF NOT EXISTS idx_pub_year ON sperm_omics.publications(year DESC);
CREATE INDEX IF NOT EXISTS idx_pub_pmid ON sperm_omics.publications(pmid);
CREATE INDEX IF NOT EXISTS idx_ds_external ON sperm_omics.datasets(external_id);
CREATE INDEX IF NOT EXISTS idx_ds_accession ON sperm_omics.datasets(accession);
CREATE INDEX IF NOT EXISTS idx_ds_omics ON sperm_omics.datasets(omics_type);
CREATE INDEX IF NOT EXISTS idx_ds_tissue ON sperm_omics.datasets(tissue);

-- Fast dashboard stats
CREATE OR REPLACE FUNCTION sperm_omics.dashboard_stats()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = sperm_omics
AS $$
  SELECT json_build_object(
    'totalPublications', (SELECT count(*)::int FROM publications),
    'totalDatasets', (SELECT count(*)::int FROM datasets),
    'omicsBreakdown', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT omics_type::text AS type, count(*)::int AS count
        FROM datasets GROUP BY omics_type ORDER BY count DESC
      ) t
    ),
    'tissueBreakdown', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT tissue::text, count(*)::int AS count
        FROM datasets GROUP BY tissue ORDER BY count DESC
      ) t
    ),
    'yearBreakdown', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT year, count(*)::int AS count
        FROM publications WHERE year IS NOT NULL
        GROUP BY year ORDER BY year
      ) t
    )
  );
$$;

-- RLS
ALTER TABLE sperm_omics.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sperm_omics.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sperm_omics.methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE sperm_omics.figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE sperm_omics.measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sperm_omics.ingest_manifest ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read publications" ON sperm_omics.publications;
DROP POLICY IF EXISTS "Public read datasets" ON sperm_omics.datasets;
DROP POLICY IF EXISTS "Public read methods" ON sperm_omics.methods;
DROP POLICY IF EXISTS "Public read figures" ON sperm_omics.figures;
DROP POLICY IF EXISTS "Public read measurements" ON sperm_omics.measurements;
DROP POLICY IF EXISTS "Public read manifest" ON sperm_omics.ingest_manifest;

CREATE POLICY "Public read publications" ON sperm_omics.publications FOR SELECT USING (true);
CREATE POLICY "Public read datasets" ON sperm_omics.datasets FOR SELECT USING (true);
CREATE POLICY "Public read methods" ON sperm_omics.methods FOR SELECT USING (true);
CREATE POLICY "Public read figures" ON sperm_omics.figures FOR SELECT USING (true);
CREATE POLICY "Public read measurements" ON sperm_omics.measurements FOR SELECT USING (true);
CREATE POLICY "Public read manifest" ON sperm_omics.ingest_manifest FOR SELECT USING (true);

-- API access (required for Supabase JS client)
GRANT USAGE ON SCHEMA sperm_omics TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA sperm_omics TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA sperm_omics TO service_role;
GRANT EXECUTE ON FUNCTION sperm_omics.dashboard_stats() TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA sperm_omics
  GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA sperm_omics
  GRANT ALL ON TABLES TO service_role;

COMMENT ON SCHEMA sperm_omics IS 'Standalone SpermOmics resource library — not shared with other apps.';

-- Expose schema to Supabase Data API (PostgREST)
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, sperm_omics';
NOTIFY pgrst, 'reload config';
