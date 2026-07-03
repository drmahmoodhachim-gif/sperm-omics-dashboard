/**
 * Generates batched SQL files for sperm_omics sync.
 * Run: npx tsx scripts/generate-bulk-sql.ts
 * Then execute via Supabase SQL or MCP execute_sql.
 */
import { mkdirSync, writeFileSync } from "fs";
import { readFileSync } from "fs";
import path from "path";

interface Publication {
  id: string;
  pmid?: string;
  doi?: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  abstract?: string;
  keywords?: string[];
  url?: string;
  citationCount?: number;
}

interface Dataset {
  id: string;
  publicationId?: string;
  accession: string;
  repository: string;
  title: string;
  omicsType: string;
  species: string;
  tissue: string;
  sampleCount?: number;
  platform?: string;
  phenotype?: string;
  summary?: string;
  url?: string;
}

function esc(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

function arr(val: string[] | undefined): string {
  if (!val || val.length === 0) return "NULL";
  const inner = val.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(",");
  return `'{${inner}}'`;
}

const merged = JSON.parse(
  readFileSync(path.join(process.cwd(), "data/library-merged.json"), "utf-8")
) as { publications: Publication[]; datasets: Dataset[] };

const outDir = path.join(process.cwd(), "data", "sql-batches");
mkdirSync(outDir, { recursive: true });

const BATCH = 40;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Publications
chunk(merged.publications, BATCH).forEach((batch, i) => {
  const values = batch
    .map(
      (p) =>
        `(${esc(p.id)}, ${esc(p.pmid ?? null)}, ${esc(p.doi ?? null)}, ${esc(p.title)}, ${esc(p.authors)}, ${esc(p.journal)}, ${p.year ?? "NULL"}, ${esc(p.abstract ?? null)}, ${arr(p.keywords)}, ${esc(p.url ?? null)}, ${p.citationCount ?? 0})`
    )
    .join(",\n");

  const sql = `INSERT INTO sperm_omics.publications (external_id, pmid, doi, title, authors, journal, year, abstract, keywords, url, citation_count)
VALUES
${values}
ON CONFLICT (external_id) DO UPDATE SET
  title = EXCLUDED.title,
  authors = EXCLUDED.authors,
  journal = EXCLUDED.journal,
  year = EXCLUDED.year,
  abstract = EXCLUDED.abstract,
  pmid = EXCLUDED.pmid,
  doi = EXCLUDED.doi,
  url = EXCLUDED.url,
  updated_at = now();`;

  writeFileSync(path.join(outDir, `pubs-${String(i).padStart(2, "0")}.sql`), sql);
});

// Datasets
chunk(merged.datasets, BATCH).forEach((batch, i) => {
  const values = batch
    .map((d) => {
      const pubId = d.publicationId
        ? `(SELECT id FROM sperm_omics.publications WHERE external_id = ${esc(d.publicationId)} LIMIT 1)`
        : "NULL";
      return `(${esc(d.id)}, ${pubId}, ${esc(d.accession)}, ${esc(d.repository)}, ${esc(d.title)}, ${esc(d.omicsType)}::sperm_omics.omics_type, ${esc(d.species)}::sperm_omics.species, ${esc(d.tissue)}::sperm_omics.tissue, ${d.sampleCount ?? "NULL"}, ${esc(d.platform ?? null)}, ${esc(d.phenotype ?? null)}, ${esc(d.summary ?? null)}, ${esc(d.url ?? null)})`;
    })
    .join(",\n");

  const sql = `INSERT INTO sperm_omics.datasets (external_id, publication_id, accession, repository, title, omics_type, species, tissue, sample_count, platform, phenotype, summary, url)
VALUES
${values}
ON CONFLICT (external_id) DO UPDATE SET
  title = EXCLUDED.title,
  accession = EXCLUDED.accession,
  repository = EXCLUDED.repository,
  omics_type = EXCLUDED.omics_type,
  species = EXCLUDED.species,
  tissue = EXCLUDED.tissue,
  sample_count = EXCLUDED.sample_count,
  platform = EXCLUDED.platform,
  phenotype = EXCLUDED.phenotype,
  summary = EXCLUDED.summary,
  url = EXCLUDED.url;`;

  writeFileSync(path.join(outDir, `datasets-${String(i).padStart(2, "0")}.sql`), sql);
});

// Manifest
const manifest = JSON.parse(
  readFileSync(path.join(process.cwd(), "data/ingest-manifest.json"), "utf-8")
);
const manifestSql = `INSERT INTO sperm_omics.ingest_manifest (id, last_run, duration_ms, counts, errors, schedule, updated_at)
VALUES (1, ${esc(manifest.lastRun)}, ${manifest.duration_ms}, ${esc(JSON.stringify(manifest.counts))}::jsonb, ${esc(JSON.stringify(manifest.errors))}::jsonb, ${esc(manifest.schedule ?? "0 3 * * 0")}, now())
ON CONFLICT (id) DO UPDATE SET
  last_run = EXCLUDED.last_run,
  duration_ms = EXCLUDED.duration_ms,
  counts = EXCLUDED.counts,
  errors = EXCLUDED.errors,
  schedule = EXCLUDED.schedule,
  updated_at = now();`;
writeFileSync(path.join(outDir, "manifest.sql"), manifestSql);

// Seed methods from seed.ts - minimal 6 methods as JSON insert via separate file
console.log(`Generated ${Math.ceil(merged.publications.length / BATCH)} pub batches, ${Math.ceil(merged.datasets.length / BATCH)} dataset batches`);
