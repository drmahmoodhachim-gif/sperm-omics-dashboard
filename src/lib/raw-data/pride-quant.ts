import { parseQuantBuffer } from "./parse-quant-table";
import type { ParsedSeriesMatrix } from "./parse-series-matrix";
import type { RawFileLink } from "./geo-fetch";

interface PrideLocation {
  name?: string;
  value?: string;
}

interface PrideFile {
  fileName?: string;
  downloadLink?: string;
  publicFileLocations?: PrideLocation[];
  fileCategory?: { value?: string; name?: string };
  fileSizeBytes?: number;
}

function prideDownloadUrl(file: PrideFile): string | null {
  if (file.downloadLink) return file.downloadLink;
  for (const loc of file.publicFileLocations ?? []) {
    const v = loc.value ?? "";
    if (/^ftp:\/\//i.test(v)) return v.replace(/^ftp:\/\//i, "https://");
    if (/^https?:\/\//i.test(v)) return v;
  }
  return null;
}

function scorePrideFile(name: string, cat: string, sizeBytes: number): number {
  const lower = name.toLowerCase();
  let score = 0;
  const category = cat.toLowerCase();

  if (category.includes("search") || category.includes("result")) score += 12;
  if (category.includes("other")) score += 4;
  if (lower.endsWith(".tsv") || lower.endsWith(".csv") || lower.endsWith(".txt")) score += 14;
  if (lower.includes("mztab")) score += 16;
  if (lower.includes("protein_groups") || lower.includes("pg.txt")) score += 18;
  if (lower.includes("gene") && lower.includes("quant")) score += 12;
  if (lower.includes("quant") || lower.includes("abundance")) score += 8;
  if (/\.(xlsx|xls)$/.test(lower) && /protein|gene|quant/.test(lower)) score += 10;
  if (/\.(wiff|raw|mzml|mgf|dta|peak)(\.gz)?$/.test(lower)) score -= 30;
  if (/\.scan$/.test(lower)) score -= 25;
  if (sizeBytes > 30_000_000) score -= 20;
  if (sizeBytes > 0 && sizeBytes < 25_000_000 && score > 0) score += 2;
  return score;
}

function isPrideAnalyzable(name: string, sizeBytes: number): boolean {
  const lower = name.toLowerCase();
  if (/\.(wiff|raw|mzml|mgf|scan)(\.gz)?$/.test(lower)) return false;
  if (sizeBytes > 25_000_000) return false;
  return /\.(tsv|csv|txt|mztab|xlsx|xls)(\.gz)?$/i.test(lower);
}

async function fetchAllPrideFiles(acc: string): Promise<PrideFile[]> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const all: PrideFile[] = [];
      let quantFound = 0;
      for (let page = 0; page < 8; page++) {
        const res = await fetch(
          `https://www.ebi.ac.uk/pride/ws/archive/v2/projects/${acc}/files?pageSize=100&page=${page}`,
          { signal: AbortSignal.timeout(30_000) }
        );
        if (!res.ok) break;
        const batch = (await res.json()) as PrideFile[];
        if (!batch.length) break;
        all.push(...batch);
        for (const f of batch) {
          const name = f.fileName ?? "";
          const size = f.fileSizeBytes ?? 0;
          if (isPrideAnalyzable(name, size) && scorePrideFile(name, f.fileCategory?.value ?? "", size) >= 8) {
            quantFound++;
          }
        }
        if (quantFound >= 5) break;
        if (batch.length < 100) break;
      }
      return all;
    } catch (err) {
      lastErr = err;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  if (lastErr) throw lastErr;
  return [];
}

export async function listPrideQuantFiles(accession: string): Promise<RawFileLink[]> {
  const acc = accession.toUpperCase();
  const files: RawFileLink[] = [
    {
      name: `${acc} on PRIDE`,
      url: `https://www.ebi.ac.uk/pride/archive/projects/${acc}`,
      type: "other",
      description: "PRIDE project archive",
    },
  ];

  try {
    const json = await fetchAllPrideFiles(acc);
    const ranked = json
      .filter((f) => f.fileName && prideDownloadUrl(f))
      .map((f) => {
        const name = f.fileName!;
        const cat = f.fileCategory?.value ?? f.fileCategory?.name ?? "";
        const size = f.fileSizeBytes ?? 0;
        return {
          f,
          name,
          url: prideDownloadUrl(f)!,
          score: scorePrideFile(name, cat, size),
          size,
        };
      })
      .filter((x) => x.score >= 8 && isPrideAnalyzable(x.name, x.size))
      .sort((a, b) => b.score - a.score);

    for (const { f, name, url, size } of ranked.slice(0, 15)) {
      const cat = f.fileCategory?.value ?? f.fileCategory?.name ?? "archive";
      files.push({
        name,
        url,
        type: "processed",
        description: `PRIDE quantification table (${cat}, ${Math.round(size / 1024)} KB)`,
        analyzable: true,
      });
    }
  } catch {
    // optional
  }

  return files;
}

export async function fetchPrideQuantMatrix(
  accession: string,
  fileUrl?: string
): Promise<ParsedSeriesMatrix> {
  const acc = accession.toUpperCase();
  const files = await listPrideQuantFiles(acc);
  const quant =
    fileUrl ??
    files.find((f) => f.analyzable || f.type === "processed")?.url;

  if (!quant) {
    throw new Error(
      "No protein quantification table found. Download SEARCH results from PRIDE and use local DESeq2/counts pipeline for raw MS."
    );
  }

  const res = await fetch(quant, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`PRIDE file download failed (${res.status})`);

  const buf = Buffer.from(await res.arrayBuffer());
  const name = quant.split("/").pop()?.split("?")[0] ?? "quant.tsv";
  return parseQuantBuffer(buf, acc, name);
}
