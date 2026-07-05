/**
 * Audit all raw-capable studies in the library for in-browser analysis support.
 * Usage: npx tsx scripts/audit-raw-studies.ts [--full] [--limit N] [--acc GSE123]
 *
 * Default: quick audit (file discovery only, no matrix download).
 * --full: also attempt matrix preview for inline-ready studies (slow).
 */
import { readFileSync, writeFileSync } from "fs";
import { resolveRawAccession, accessionKind } from "../src/lib/raw-data/accession";
import { classifyRawFileAvailability } from "../src/lib/raw-data/local-only";
import { listRawFiles } from "../src/lib/raw-data/geo-fetch";
import { listArrayExpressFiles } from "../src/lib/raw-data/arrayexpress-fetch";
import { listPrideQuantFiles } from "../src/lib/raw-data/pride-quant";
import { fetchGeoFilelistSamples } from "../src/lib/raw-data/geo-filelist";
import { fetchExpressionMatrix, matrixPreview } from "../src/lib/raw-data/fetch-matrix";
import type { Dataset } from "../src/lib/types";

type Status = "inline" | "local_only" | "error";

interface AuditRow {
  accession: string;
  kind: string;
  status: Status;
  analyzableCount: number;
  localOnlyReasons: string[];
  topFile?: string;
  strategy?: string;
  filelistSamples?: number;
  matrixSamples?: number;
  matrixGenes?: number;
  error?: string;
  ms: number;
}

async function listFilesForAccession(acc: string) {
  const kind = accessionKind(acc);
  if (kind === "geo") {
    return (await listRawFiles(acc)).map((f) => ({
      name: f.name,
      url: f.url,
      type: f.type,
      description: f.description,
      analyzable: f.analyzable ?? (f.type === "expression_matrix" || f.type === "processed"),
    }));
  }
  if (kind === "arrayexpress") {
    return (await listArrayExpressFiles(acc)).map((f) => ({
      ...f,
      analyzable: f.type === "expression_matrix",
    }));
  }
  if (kind === "pride") {
    return (await listPrideQuantFiles(acc)).map((f) => ({
      ...f,
      analyzable: f.type === "processed",
    }));
  }
  return [];
}

function inferStrategy(files: { name: string; analyzable?: boolean }[]): string | undefined {
  const a = files.filter((f) => f.analyzable);
  if (a.length === 0) return undefined;
  const names = a.map((f) => f.name.toLowerCase()).join(" ");
  if (/merged_per_sample|filelist/.test(names)) return "filelist_merge";
  if (/series_matrix/.test(names)) return "series_matrix";
  if (/count|fpkm|tpm|expr|salmon|quant/.test(names)) return "supplementary";
  return "other";
}

async function auditOne(acc: string, full: boolean): Promise<AuditRow> {
  const t0 = Date.now();
  const kind = accessionKind(acc);
  try {
    const files = await listFilesForAccession(acc);
    const analyzable = files.filter((f) => f.analyzable);
    const filelistSamples =
      kind === "geo" ? (await fetchGeoFilelistSamples(acc)).length : undefined;

    let status: Status = analyzable.length > 0 ? "inline" : "local_only";
    let matrixSamples: number | undefined;
    let matrixGenes: number | undefined;
    let error: string | undefined;

    if (status === "inline" && full) {
      try {
        const top = analyzable.find((f) => /merged_per_sample|filelist/i.test(f.name)) ?? analyzable[0];
        const matrix = await fetchExpressionMatrix(acc, { fileUrl: top?.url });
        const preview = matrixPreview(matrix);
        matrixSamples = preview.sampleCount;
        matrixGenes = preview.parsedGenes;
        if (preview.sampleCount < 2 || preview.parsedGenes < 10) {
          status = "error";
          error = "Matrix too small after load";
        }
      } catch (e) {
        status = "error";
        error = e instanceof Error ? e.message : "Matrix load failed";
      }
    }

    return {
      accession: acc,
      kind,
      status,
      analyzableCount: analyzable.length,
      localOnlyReasons: classifyRawFileAvailability(files, acc).reasons,
      topFile: analyzable[0]?.name,
      strategy: inferStrategy(files),
      filelistSamples,
      matrixSamples,
      matrixGenes,
      error,
      ms: Date.now() - t0,
    };
  } catch (e) {
    return {
      accession: acc,
      kind,
      status: "error",
      analyzableCount: 0,
      localOnlyReasons: [],
      error: e instanceof Error ? e.message : "Audit failed",
      ms: Date.now() - t0,
    };
  }
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
      if ((idx + 1) % 25 === 0) {
        process.stderr.write(`  … ${idx + 1}/${items.length}\n`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

function loadAccessions(limit?: number, onlyAcc?: string): string[] {
  if (onlyAcc) return [onlyAcc.toUpperCase()];

  const lib = JSON.parse(readFileSync("data/library-merged.json", "utf8")) as {
    datasets: Dataset[];
  };
  const seen = new Set<string>();
  const accs: string[] = [];
  for (const d of lib.datasets) {
    const raw = resolveRawAccession(d);
    if (!raw || seen.has(raw)) continue;
    seen.add(raw);
    accs.push(raw);
  }
  accs.sort();
  return limit ? accs.slice(0, limit) : accs;
}

async function main() {
  const args = process.argv.slice(2);
  const full = args.includes("--full");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : undefined;
  const accIdx = args.indexOf("--acc");
  const onlyAcc = accIdx >= 0 ? args[accIdx + 1] : undefined;

  const accessions = loadAccessions(limit, onlyAcc);
  console.log(`Auditing ${accessions.length} studies (${full ? "full" : "quick"} mode, concurrency 3)…`);

  const rows = await mapPool(accessions, 3, (acc) => auditOne(acc, full));

  const summary = {
    total: rows.length,
    inline: rows.filter((r) => r.status === "inline").length,
    local_only: rows.filter((r) => r.status === "local_only").length,
    error: rows.filter((r) => r.status === "error").length,
    byKind: {} as Record<string, { inline: number; local_only: number; error: number }>,
    byStrategy: {} as Record<string, number>,
  };

  for (const r of rows) {
    if (!summary.byKind[r.kind]) {
      summary.byKind[r.kind] = { inline: 0, local_only: 0, error: 0 };
    }
    summary.byKind[r.kind][r.status]++;
    if (r.strategy && r.status === "inline") {
      summary.byStrategy[r.strategy] = (summary.byStrategy[r.strategy] ?? 0) + 1;
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: full ? "full" : "quick",
    summary,
    rows,
  };

  writeFileSync("data/audit-raw-studies.json", JSON.stringify(report, null, 2));

  console.log("\n=== Raw study audit summary ===");
  console.log(JSON.stringify(summary, null, 2));

  const localOnly = rows.filter((r) => r.status === "local_only");
  if (localOnly.length) {
    console.log(`\nLocal-only (${localOnly.length}):`);
    for (const r of localOnly.slice(0, 15)) {
      console.log(`  ${r.accession} — ${r.localOnlyReasons.join("; ") || "no analyzable files"}`);
    }
    if (localOnly.length > 15) console.log(`  … and ${localOnly.length - 15} more`);
  }

  const errors = rows.filter((r) => r.status === "error");
  if (errors.length) {
    console.log(`\nErrors (${errors.length}):`);
    for (const r of errors.slice(0, 10)) {
      console.log(`  ${r.accession} — ${r.error}`);
    }
  }

  console.log("\nFull report: data/audit-raw-studies.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
