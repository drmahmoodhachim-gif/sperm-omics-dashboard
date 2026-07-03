-- Bulk upsert RPCs for npm run sync:supabase (service_role only)

CREATE OR REPLACE FUNCTION sperm_omics.bulk_upsert_publications(data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sperm_omics
AS $$
BEGIN
  INSERT INTO publications (
    external_id, pmid, doi, title, authors, journal, year,
    abstract, keywords, url, citation_count, updated_at
  )
  SELECT
    r.external_id,
    NULLIF(r.pmid, 'null'),
    NULLIF(r.doi, 'null'),
    r.title,
    r.authors,
    r.journal,
    (r.year)::int,
    NULLIF(r.abstract, 'null'),
    CASE WHEN r.keywords IS NULL OR r.keywords = 'null'::jsonb THEN NULL
         ELSE ARRAY(SELECT jsonb_array_elements_text(r.keywords)) END,
    NULLIF(r.url, 'null'),
    COALESCE((r.citation_count)::int, 0),
    now()
  FROM jsonb_to_recordset(data) AS r(
    external_id text, pmid text, doi text, title text, authors text,
    journal text, year int, abstract text, keywords jsonb, url text,
    citation_count int
  )
  ON CONFLICT (external_id) DO UPDATE SET
    title = EXCLUDED.title, authors = EXCLUDED.authors, journal = EXCLUDED.journal,
    year = EXCLUDED.year, abstract = EXCLUDED.abstract, keywords = EXCLUDED.keywords,
    pmid = EXCLUDED.pmid, doi = EXCLUDED.doi, url = EXCLUDED.url,
    citation_count = EXCLUDED.citation_count, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION sperm_omics.bulk_upsert_datasets(data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sperm_omics
AS $$
BEGIN
  INSERT INTO datasets (
    external_id, publication_id, accession, repository, title,
    omics_type, species, tissue, sample_count, platform,
    phenotype, summary, url
  )
  SELECT
    r.external_id,
    (SELECT id FROM publications p WHERE p.external_id = r.publication_external_id LIMIT 1),
    r.accession, r.repository, r.title,
    r.omics_type::omics_type,
    COALESCE(r.species, 'human')::species,
    COALESCE(r.tissue, 'spermatozoa')::tissue,
    r.sample_count, r.platform, r.phenotype, r.summary, r.url
  FROM jsonb_to_recordset(data) AS r(
    external_id text, publication_external_id text, accession text,
    repository text, title text, omics_type text, species text, tissue text,
    sample_count int, platform text, phenotype text, summary text, url text
  )
  ON CONFLICT (external_id) DO UPDATE SET
    publication_id = EXCLUDED.publication_id, accession = EXCLUDED.accession,
    repository = EXCLUDED.repository, title = EXCLUDED.title,
    omics_type = EXCLUDED.omics_type, species = EXCLUDED.species,
    tissue = EXCLUDED.tissue, sample_count = EXCLUDED.sample_count,
    platform = EXCLUDED.platform, phenotype = EXCLUDED.phenotype,
    summary = EXCLUDED.summary, url = EXCLUDED.url;
END;
$$;

CREATE OR REPLACE FUNCTION sperm_omics.upsert_ingest_manifest(
  last_run timestamptz, duration_ms int, counts jsonb, errors jsonb, schedule text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sperm_omics
AS $$
BEGIN
  INSERT INTO ingest_manifest (id, last_run, duration_ms, counts, errors, schedule, updated_at)
  VALUES (1, last_run, duration_ms, counts, errors, schedule, now())
  ON CONFLICT (id) DO UPDATE SET
    last_run = EXCLUDED.last_run, duration_ms = EXCLUDED.duration_ms,
    counts = EXCLUDED.counts, errors = EXCLUDED.errors,
    schedule = EXCLUDED.schedule, updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION sperm_omics.bulk_upsert_publications(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION sperm_omics.bulk_upsert_datasets(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION sperm_omics.upsert_ingest_manifest(timestamptz, int, jsonb, jsonb, text) TO service_role;
