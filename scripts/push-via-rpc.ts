/**
 * Push library-merged.json to Supabase via chunked RPC calls.
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 * OR uses direct SQL via DATABASE_URL (postgres connection string).
 */
import { readFileSync } from "fs";
import path from "path";
import { loadEnvFiles } from "../src/lib/ingest/load-env";

loadEnvFiles();

const CHUNK = 50;

interface Pub {
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

interface Ds {
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

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function pubsPayload(batch: Pub[]) {
  return batch.map((p) => ({
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
}

function dsPayload(batch: Ds[]) {
  return batch.map((d) => ({
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
}

async function rpc(name: string, payload: unknown) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Accept-Profile": "sperm_omics",
      "Content-Profile": "sperm_omics",
    },
    body: JSON.stringify(
      name === "bulk_upsert_publications" || name === "bulk_upsert_datasets"
        ? { data: payload }
        : payload
    ),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${name}: ${res.status} ${text}`);
  }
}

async function main() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL and API key in .env.local");
    process.exit(1);
  }

  const merged = JSON.parse(
    readFileSync(path.join(process.cwd(), "data/library-merged.json"), "utf-8")
  ) as { publications: Pub[]; datasets: Ds[] };

  console.log(`Syncing ${merged.publications.length} pubs, ${merged.datasets.length} datasets...`);

  let i = 0;
  for (const batch of chunk(merged.publications, CHUNK)) {
    i++;
    process.stdout.write(`  publications ${i}/${Math.ceil(merged.publications.length / CHUNK)}... `);
    await rpc("bulk_upsert_publications", pubsPayload(batch));
    console.log("OK");
  }

  i = 0;
  for (const batch of chunk(merged.datasets, CHUNK)) {
    i++;
    process.stdout.write(`  datasets ${i}/${Math.ceil(merged.datasets.length / CHUNK)}... `);
    await rpc("bulk_upsert_datasets", dsPayload(batch));
    console.log("OK");
  }

  const manifest = JSON.parse(
    readFileSync(path.join(process.cwd(), "data/ingest-manifest.json"), "utf-8")
  );
  await rpc("upsert_ingest_manifest", {
    last_run: manifest.lastRun,
    duration_ms: manifest.duration_ms,
    counts: manifest.counts,
    errors: manifest.errors,
    schedule: manifest.schedule ?? "0 3 * * 0",
  });

  const stats = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/dashboard_stats`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Accept-Profile": "sperm_omics",
      },
    }
  );
  console.log("\nDashboard stats:", await stats.json());
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
