import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { ingestGeo } from "./geo-ingest";
import { ingestPride } from "./pride-ingest";
import { ingestPubMed } from "./pubmed-ingest";
import { ingestSperMD } from "./spermd-ingest";
import type { IngestManifest, IngestRecord, PubMedRecord } from "./ingest-types";
import { mergeIngestedLibrary } from "./merge-library";

const DATA_DIR = path.join(process.cwd(), "data");

export async function runFullIngest(): Promise<IngestManifest> {
  const start = Date.now();
  const errors: string[] = [];
  await mkdir(DATA_DIR, { recursive: true });

  console.log("SpermOmics Full Ingestion Pipeline");
  console.log("===================================\n");

  let geo: IngestRecord[] = [];
  let pride: IngestRecord[] = [];
  let spermd: IngestRecord[] = [];
  let pubmed: PubMedRecord[] = [];

  console.log("[1/4] GEO datasets...");
  try {
    geo = await ingestGeo();
    await writeFile(path.join(DATA_DIR, "geo-ingest.json"), JSON.stringify(geo, null, 2));
    console.log(`  ✓ ${geo.length} GEO datasets`);
  } catch (e) {
    errors.push(`GEO: ${e}`);
    console.error("  ✗ GEO failed:", e);
  }

  console.log("[2/4] PRIDE proteomics...");
  try {
    pride = await ingestPride();
    await writeFile(path.join(DATA_DIR, "pride-ingest.json"), JSON.stringify(pride, null, 2));
    console.log(`  ✓ ${pride.length} PRIDE projects`);
  } catch (e) {
    errors.push(`PRIDE: ${e}`);
    console.error("  ✗ PRIDE failed:", e);
  }

  console.log("[3/4] PubMed literature...");
  try {
    pubmed = await ingestPubMed();
    await writeFile(path.join(DATA_DIR, "pubmed-ingest.json"), JSON.stringify(pubmed, null, 2));
    console.log(`  ✓ ${pubmed.length} PubMed articles`);
  } catch (e) {
    errors.push(`PubMed: ${e}`);
    console.error("  ✗ PubMed failed:", e);
  }

  console.log("[4/4] SperMD catalog...");
  try {
    spermd = await ingestSperMD();
    await writeFile(path.join(DATA_DIR, "spermd-ingest.json"), JSON.stringify(spermd, null, 2));
    console.log(`  ✓ ${spermd.length} SperMD entries`);
  } catch (e) {
    errors.push(`SperMD: ${e}`);
    console.error("  ✗ SperMD failed:", e);
  }

  const allDatasets = [...geo, ...pride, ...spermd];
  const merged = mergeIngestedLibrary(allDatasets, pubmed);
  await writeFile(
    path.join(DATA_DIR, "library-merged.json"),
    JSON.stringify(merged, null, 2)
  );

  const manifest: IngestManifest = {
    lastRun: new Date().toISOString(),
    duration_ms: Date.now() - start,
    counts: {
      geo: geo.length,
      pride: pride.length,
      pubmed: pubmed.length,
      spermd: spermd.length,
      total_datasets: merged.datasets.length,
      total_publications: merged.publications.length,
    },
    errors,
    schedule: process.env.INGEST_SCHEDULE ?? "0 3 * * 0",
  };

  await writeFile(path.join(DATA_DIR, "ingest-manifest.json"), JSON.stringify(manifest, null, 2));

  console.log("\n===================================");
  console.log(`Done in ${(manifest.duration_ms / 1000).toFixed(1)}s`);
  console.log(`Merged library: ${manifest.counts.total_publications} pubs, ${manifest.counts.total_datasets} datasets`);
  if (errors.length) console.log(`Errors: ${errors.length}`);

  return manifest;
}
