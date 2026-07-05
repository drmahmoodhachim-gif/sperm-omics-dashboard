import { geoSupplDirUrl, geoSupplFileUrl } from "./geo-path";
import { extractSampleSupplements } from "./geo-sample-counts";
import {
  fetchGeoFilelistSamples,
  geoFilelistMergeUrl,
} from "./geo-filelist";
import { toHttps, unquoteGeoCell as unquote } from "./geo-utils";

export interface GeoSupplementaryFile {
  name: string;
  url: string;
  score: number;
  description: string;
  source?: "series" | "ftp" | "sample";
}

const SUPP_LINE = /^!Series_supplementary_file\t/i;
const MIN_SCORE = 8;

export function scoreQuantFilename(name: string): number {
  const lower = name.toLowerCase();
  let score = 0;

  if (/\.(tar|tar\.gz)$/.test(lower) && !/\.(txt|tsv|csv)\.gz$/.test(lower)) score -= 50;
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) score += 4;
  if (/\.(csv|tsv|txt)(\.gz)?$/.test(lower)) score += 18;
  if (lower.includes("log2") && lower.includes("norm")) score += 30;
  if (lower.includes("fpkm_tracking")) score += 22;
  if (lower.includes("fpkm") || lower.includes("tpm") || lower.includes("rpkm")) score += 14;
  if (lower.includes("exprs") || lower.includes("expression")) score += 12;
  if (lower.includes("count") && !lower.includes("account")) score += 10;
  if (lower.includes("normalized") || lower.includes("norm_")) score += 20;
  if (lower.includes("matrix") || lower.includes("signal")) score += 12;
  if (lower.includes("rma") || lower.includes("gcrma")) score += 14;
  if (/counts\.txt(\.gz)?$/.test(lower) || lower.endsWith(".counts.txt.gz")) score += 16;
  if (/\.(fastq|bam|sam|bed\.gz|bw|bigwig)/.test(lower)) score -= 40;
  if (/exprs|fpkm|counts|signal|rma|tpm|normalized/.test(lower) && lower.endsWith(".gz")) score += 6;

  return score;
}

function urlsFromSeriesLines(text: string): string[] {
  const urls: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!SUPP_LINE.test(line)) continue;
    for (const cell of line.split("\t").slice(1)) {
      const url = unquote(cell);
      if (url.startsWith("ftp://") || url.startsWith("http")) urls.push(toHttps(url));
    }
  }
  return urls;
}

export function rankSupplementaryFiles(text: string, accession: string): GeoSupplementaryFile[] {
  return urlsFromSeriesLines(text)
    .map((url) => fileEntry(url, "series"))
    .filter((f) => f.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);
}

function fileEntry(url: string, source: GeoSupplementaryFile["source"]): GeoSupplementaryFile {
  const name = url.split("/").pop() ?? url;
  const score = scoreQuantFilename(name);
  return {
    name,
    url,
    score,
    source,
    description:
      score >= 20
        ? "GEO quantification table — ready for DE analysis"
        : score >= MIN_SCORE
          ? "GEO supplementary table — may work for DE analysis"
          : "GEO supplementary archive",
  };
}

export async function listGeoSupplDirectory(accession: string): Promise<GeoSupplementaryFile[]> {
  const dirUrl = geoSupplDirUrl(accession);
  if (!dirUrl) return [];

  try {
    const res = await fetch(dirUrl, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return [];
    const html = await res.text();
    const acc = accession.toUpperCase();
    const names = new Set<string>();
    const hasFilelist = /filelist\.txt/i.test(html);

    for (const m of html.matchAll(/href="([^"?]+\.(?:txt|tsv|csv|gz))"/gi)) {
      const name = m[1].split("/").pop() ?? m[1];
      if (!name.startsWith(acc) && !name.includes("fpkm") && !name.includes("count")) continue;
      names.add(name);
    }

    const out = [...names]
      .map((name) => {
        const url = geoSupplFileUrl(acc, name);
        return url ? fileEntry(url, "ftp") : null;
      })
      .filter((f): f is GeoSupplementaryFile => f !== null && f.score >= MIN_SCORE)
      .sort((a, b) => b.score - a.score);

    if (hasFilelist && !out.some((f) => f.url.includes("filelist"))) {
      out.push({
        name: "filelist.txt",
        url: geoSupplFileUrl(acc, "filelist.txt") ?? "",
        score: 5,
        source: "ftp",
        description: "GEO filelist — catalog of per-sample files (often inside RAW.tar)",
      });
      out.unshift({
        name: `${acc}_merged_per_sample_quant`,
        url: geoFilelistMergeUrl(acc),
        score: 27,
        source: "ftp",
        description:
          "Merge per-sample quant files listed in GEO filelist.txt (inside RAW.tar)",
      });
    }

    return out;
  } catch {
    return [];
  }
}

/** All candidate quant files: series supp, FTP listing, per-sample count files. */
export async function discoverGeoQuantFiles(
  text: string,
  accession: string
): Promise<GeoSupplementaryFile[]> {
  const seen = new Set<string>();
  const out: GeoSupplementaryFile[] = [];

  function add(f: GeoSupplementaryFile) {
    if (seen.has(f.url)) return;
    seen.add(f.url);
    out.push(f);
  }

  for (const f of rankSupplementaryFiles(text, accession)) add(f);
  for (const f of await listGeoSupplDirectory(accession)) add(f);

  for (const s of extractSampleSupplements(text)) {
    const score = scoreQuantFilename(s.name);
    if (score >= MIN_SCORE) {
      add({
        name: s.name,
        url: s.url,
        score: score - 2,
        source: "sample",
        description: `Per-sample quant file (${s.sampleId}) — merged with others when needed`,
      });
    }
  }

  const filelistSamples = await fetchGeoFilelistSamples(accession);
  if (filelistSamples.length >= 2) {
    add({
      name: `${accession.toUpperCase()}_merged_per_sample_quant`,
      url: geoFilelistMergeUrl(accession),
      score: 28,
      source: "ftp",
      description: `Merge ${filelistSamples.length} per-sample quant files from GEO filelist.txt (inside RAW.tar listing)`,
    });
    for (const s of filelistSamples.slice(0, 6)) {
      add({
        name: s.name,
        url: s.url,
        score: scoreQuantFilename(s.name) - 4,
        source: "sample",
        description: `Per-sample quant from filelist.txt (${s.sampleId})`,
      });
    }
  } else {
    const dirUrl = geoSupplDirUrl(accession);
    if (dirUrl) {
      try {
        const res = await fetch(dirUrl, { signal: AbortSignal.timeout(15_000) });
        if (res.ok && /filelist\.txt/i.test(await res.text())) {
          add({
            name: `${accession.toUpperCase()}_merged_per_sample_quant`,
            url: geoFilelistMergeUrl(accession),
            score: 26,
            source: "ftp",
            description:
              "Merge per-sample quant files from GEO filelist.txt (detected on FTP; loads on matrix fetch)",
          });
        }
      } catch {
        // optional
      }
    }
  }

  return out.sort((a, b) => b.score - a.score);
}

export function seriesMatrixHasExpressionTable(text: string): boolean {
  let inTable = false;
  let dataRows = 0;
  for (const line of text.split(/\r?\n/)) {
    if (/series_matrix_table_begin/i.test(line)) {
      inTable = true;
      continue;
    }
    if (/series_matrix_table_end/i.test(line)) {
      inTable = false;
      continue;
    }
    if (inTable && line.trim()) dataRows++;
  }
  return dataRows >= 2;
}

export async function fetchGeoSupplementaryMatrix(
  url: string,
  accession: string,
  metaSamples?: import("./parse-series-matrix").MatrixSample[]
): Promise<import("./parse-series-matrix").ParsedSeriesMatrix> {
  const { parseQuantBuffer } = await import("./parse-quant-table");
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) {
    throw new Error(`GEO supplementary download failed (${res.status}) for ${url.split("/").pop()}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const name = url.split("/").pop()?.split("?")[0] ?? "supp.csv.gz";
  const parsed = parseQuantBuffer(buf, accession, name);

  if (metaSamples?.length) {
    parsed.samples = parsed.samples.map((s, i) => {
      const meta = metaSamples[i];
      if (!meta) return s;
      return {
        id: s.id,
        title: meta.title || s.title,
        characteristics: meta.characteristics.length ? meta.characteristics : s.characteristics,
      };
    });
  }

  return parsed;
}

export { toHttps } from "./geo-utils";
