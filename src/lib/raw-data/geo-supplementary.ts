import { parseQuantBuffer } from "./parse-quant-table";
import type { ParsedSeriesMatrix, MatrixSample } from "./parse-series-matrix";

export interface GeoSupplementaryFile {
  name: string;
  url: string;
  score: number;
  description: string;
}

const SUPP_LINE = /^!Series_supplementary_file\t/i;

/** Rank GEO series-level supplementary files for inline DE analysis. */
export function rankSupplementaryFiles(text: string, _accession: string): GeoSupplementaryFile[] {
  const urls: string[] = [];

  for (const line of text.split(/\r?\n/)) {
    if (!SUPP_LINE.test(line)) continue;
    const cells = line.split("\t").slice(1);
    for (const cell of cells) {
      const url = unquote(cell);
      if (url.startsWith("ftp://") || url.startsWith("http")) urls.push(toHttps(url));
    }
  }

  return urls
    .map((url) => {
      const name = url.split("/").pop() ?? url;
      const lower = name.toLowerCase();
      let score = 0;

      if (lower.endsWith(".tar") || lower.endsWith(".tar.gz") || lower.includes("_raw")) score -= 50;
      if (lower.endsWith(".csv.gz") || lower.endsWith(".csv")) score += 20;
      if (lower.endsWith(".tsv.gz") || lower.endsWith(".tsv") || lower.endsWith(".txt.gz"))
        score += 18;
      if (lower.includes("log2") && lower.includes("norm")) score += 30;
      if (lower.includes("count") && lower.includes("collapse")) score += 25;
      if (lower.includes("normalized") || lower.includes("norm_count")) score += 22;
      if (lower.includes("expression") || lower.includes("matrix")) score += 15;
      if (lower.includes("fpkm") || lower.includes("tpm") || lower.includes("rpkm")) score += 12;
      if (lower.includes("count")) score += 10;
      if (lower.includes(".fastq") || lower.includes(".bam") || lower.includes(".sam")) score -= 40;

      const description =
        score >= 25
          ? "GEO supplementary quantification table — ready for DE analysis"
          : "GEO supplementary archive (may require local extraction)";

      return { name, url, score, description };
    })
    .filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score);
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
  metaSamples?: MatrixSample[]
): Promise<ParsedSeriesMatrix> {
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

export function toHttps(url: string): string {
  return url.replace(/^ftp:\/\//i, "https://");
}

function unquote(s: string): string {
  return s.replace(/^"|"$/g, "").trim();
}
