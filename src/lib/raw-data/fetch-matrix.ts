import { fetchArrayExpressMatrix } from "./arrayexpress-fetch";
import { fetchGeoSeriesMatrix } from "./geo-fetch";
import { fetchPrideQuantMatrix } from "./pride-quant";
import { accessionKind, normalizeRawAccession } from "./accession";
import type { ParsedSeriesMatrix } from "./parse-series-matrix";

export type MatrixSource = "geo" | "arrayexpress" | "pride" | "auto";

const cache = new Map<string, { at: number; data: ParsedSeriesMatrix }>();
const CACHE_MS = 30 * 60 * 1000;

export function supportsInlineAnalysis(accession: string): boolean {
  return accessionKind(accession) !== "unknown";
}

export function sourceLabel(accession: string): string {
  switch (accessionKind(accession)) {
    case "geo":
      return "NCBI GEO Series Matrix";
    case "arrayexpress":
      return "ArrayExpress processed matrix";
    case "pride":
      return "PRIDE quantification table";
    default:
      return "Unknown source";
  }
}

export async function fetchExpressionMatrix(
  accession: string,
  opts?: { fileUrl?: string; source?: MatrixSource }
): Promise<ParsedSeriesMatrix> {
  const acc = normalizeRawAccession(accession) ?? accession.toUpperCase();
  const cacheKey = `${acc}:${opts?.fileUrl ?? "default"}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;

  const kind = opts?.source === "auto" || !opts?.source ? accessionKind(acc) : opts.source;
  let data: ParsedSeriesMatrix;

  switch (kind) {
    case "geo":
      data = await fetchGeoSeriesMatrix(acc, opts?.fileUrl);
      break;
    case "arrayexpress":
      data = await fetchArrayExpressMatrix(acc, opts?.fileUrl);
      break;
    case "pride":
      data = await fetchPrideQuantMatrix(acc, opts?.fileUrl);
      break;
    default:
      throw new Error("Unsupported accession — use GSE, PXD, or E-MTAB IDs");
  }

  cache.set(cacheKey, { at: Date.now(), data });
  return data;
}

export function matrixPreview(matrix: ParsedSeriesMatrix) {
  return {
    accession: matrix.accession,
    source: sourceLabel(matrix.accession),
    sampleCount: matrix.sampleCount,
    geneCount: matrix.geneCount,
    parsedGenes: matrix.genes.length,
    samples: matrix.samples.map((s) => ({
      id: s.id,
      title: s.title,
      characteristics: s.characteristics,
    })),
    geneSample: matrix.genes.slice(0, 50),
  };
}

export { accessionKind };
