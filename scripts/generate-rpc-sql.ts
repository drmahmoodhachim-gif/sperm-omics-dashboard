/** Generate RPC SQL chunks for MCP execute_sql */
import { readFileSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

const CHUNK = 30;
const merged = JSON.parse(
  readFileSync(path.join(process.cwd(), "data/library-merged.json"), "utf-8")
);

const outDir = path.join(process.cwd(), "data", "rpc-batches");
mkdirSync(outDir, { recursive: true });

function chunk<T>(arr: T[], n: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function escJson(obj: unknown) {
  return JSON.stringify(obj).replace(/'/g, "''");
}

const pubRows = merged.publications.map((p: Record<string, unknown>) => ({
  external_id: p.id,
  pmid: p.pmid ?? null,
  doi: p.doi ?? null,
  title: p.title,
  authors: p.authors,
  journal: p.journal,
  year: p.year,
  abstract: p.abstract ?? null,
  keywords: p.keywords ?? null,
  url: p.url ?? null,
  citation_count: p.citationCount ?? 0,
}));

chunk(pubRows, CHUNK).forEach((batch, i) => {
  const sql = `SELECT sperm_omics.bulk_upsert_publications('${escJson(batch)}'::jsonb);`;
  writeFileSync(path.join(outDir, `pubs-${String(i).padStart(2, "0")}.sql`), sql);
});

const dsRows = merged.datasets.map((d: Record<string, unknown>) => ({
  external_id: d.id,
  publication_external_id: d.publicationId ?? null,
  accession: d.accession,
  repository: d.repository,
  title: d.title,
  omics_type: d.omicsType,
  species: d.species,
  tissue: d.tissue,
  sample_count: d.sampleCount ?? null,
  platform: d.platform ?? null,
  phenotype: d.phenotype ?? null,
  summary: d.summary ?? null,
  url: d.url ?? null,
}));

chunk(dsRows, CHUNK).forEach((batch, i) => {
  const sql = `SELECT sperm_omics.bulk_upsert_datasets('${escJson(batch)}'::jsonb);`;
  writeFileSync(path.join(outDir, `datasets-${String(i).padStart(2, "0")}.sql`), sql);
});

const m = JSON.parse(readFileSync(path.join(process.cwd(), "data/ingest-manifest.json"), "utf-8"));
const manifestSql = `SELECT sperm_omics.upsert_ingest_manifest(
  '${m.lastRun}'::timestamptz,
  ${m.duration_ms},
  '${escJson(m.counts)}'::jsonb,
  '${escJson(m.errors)}'::jsonb,
  '${m.schedule ?? "0 3 * * 0"}'
);`;
writeFileSync(path.join(outDir, "manifest.sql"), manifestSql);

console.log(
  `Generated ${Math.ceil(pubRows.length / CHUNK)} pub + ${Math.ceil(dsRows.length / CHUNK)} dataset RPC batches`
);
