import { readFile } from "fs/promises";
import path from "path";
import type { IngestManifest } from "./ingest-types";
import { loadEnvFiles } from "./load-env";
import { getSupabaseSchema, getSupabaseService } from "@/lib/supabase/client";
import { TABLES } from "@/lib/supabase/config";
import type { Dataset, Publication } from "@/lib/types";

const BATCH = 100;

interface MergedFile {
  publications: Publication[];
  datasets: Dataset[];
}

function pubRow(p: Publication) {
  return {
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
    citation_count: p.citationCount ?? null,
  };
}

function dsRow(d: Dataset, pubUuidMap: Map<string, string>) {
  return {
    external_id: d.id,
    publication_id: d.publicationId ? pubUuidMap.get(d.publicationId) ?? null : null,
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
  };
}

async function upsertBatches<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
  onConflict: string
) {
  const sb = getSupabaseService();
  if (!sb) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await sb.from(table).upsert(chunk as never, { onConflict });
    if (error) throw new Error(`${table} upsert: ${error.message}`);
  }
}

export async function syncLibraryToSupabase(manifest?: IngestManifest) {
  loadEnvFiles();
  const sb = getSupabaseService();
  if (!sb) {
    console.warn("  Supabase sync skipped — set SUPABASE_SERVICE_ROLE_KEY in .env.local");
    return false;
  }

  const file = path.join(process.cwd(), "data", "library-merged.json");
  const raw = await readFile(file, "utf-8");
  const merged = JSON.parse(raw) as MergedFile;

  console.log(`\n[Supabase] Syncing to schema: ${getSupabaseSchema()}`);
  console.log(`  ${merged.publications.length} publications, ${merged.datasets.length} datasets`);

  await upsertBatches(
    TABLES.publications,
    merged.publications.map(pubRow),
    "external_id"
  );

  const { data: pubRows, error: pubErr } = await sb
    .from(TABLES.publications)
    .select("id, external_id");
  if (pubErr) throw new Error(pubErr.message);

  const pubUuidMap = new Map<string, string>();
  for (const row of pubRows ?? []) {
    if (row.external_id) pubUuidMap.set(row.external_id, row.id);
  }

  await upsertBatches(
    TABLES.datasets,
    merged.datasets.map((d) => dsRow(d, pubUuidMap)),
    "external_id"
  );

  if (manifest) {
    const { error } = await sb.from(TABLES.ingestManifest).upsert({
      id: 1,
      last_run: manifest.lastRun,
      duration_ms: manifest.duration_ms,
      counts: manifest.counts,
      errors: manifest.errors,
      schedule: manifest.schedule,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn("  Manifest sync warning:", error.message);
  }

  console.log("  ✓ Supabase sync complete");
  return true;
}
