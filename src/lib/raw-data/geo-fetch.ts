import {
  geoMinimlUrl,
  geoSeriesMatrixUrl,
  isGeoAccession,
} from "@/lib/raw-data/geo-path";
import {
  fetchGeoSupplementaryMatrix,
  rankSupplementaryFiles,
  seriesMatrixHasExpressionTable,
  toHttps,
} from "@/lib/raw-data/geo-supplementary";
import {
  parseSeriesMatrixGz,
  parseSeriesMatrixMetadata,
  type ParsedSeriesMatrix,
} from "@/lib/raw-data/parse-series-matrix";
import { gunzipSync } from "zlib";

const matrixCache = new Map<string, { at: number; data: ParsedSeriesMatrix }>();
const CACHE_MS = 30 * 60 * 1000;

export interface RawFileLink {
  name: string;
  url: string;
  type: "expression_matrix" | "metadata" | "processed" | "raw_ms" | "other";
  description: string;
  analyzable?: boolean;
}

export async function listRawFiles(accession: string): Promise<RawFileLink[]> {
  const acc = accession.toUpperCase();
  const files: RawFileLink[] = [];

  if (isGeoAccession(acc)) {
    const matrixUrl = geoSeriesMatrixUrl(acc);
    const minimlUrl = geoMinimlUrl(acc);
    let suppFiles: ReturnType<typeof rankSupplementaryFiles> = [];

    if (matrixUrl) {
      try {
        const res = await fetch(matrixUrl, { signal: AbortSignal.timeout(30_000) });
        if (res.ok) {
          const text = gunzipSync(Buffer.from(await res.arrayBuffer())).toString("utf-8");
          suppFiles = rankSupplementaryFiles(text, acc);
          const hasTable = seriesMatrixHasExpressionTable(text);
          files.push({
            name: `${acc}_series_matrix.txt.gz`,
            url: matrixUrl,
            type: "expression_matrix",
            description: hasTable
              ? "GEO Series Matrix — sample × gene expression (ready for DE analysis)"
              : "GEO Series Matrix — metadata only; use supplementary quant file below",
            analyzable: hasTable,
          });
        }
      } catch {
        files.push({
          name: `${acc}_series_matrix.txt.gz`,
          url: matrixUrl,
          type: "expression_matrix",
          description: "GEO Series Matrix — sample × gene expression",
        });
      }
    }

    for (const s of suppFiles.slice(0, 8)) {
      files.push({
        name: s.name,
        url: s.url,
        type: "processed",
        description: s.description,
        analyzable: true,
      });
    }

    if (minimlUrl) {
      files.push({
        name: `${acc}_family.xml.tgz`,
        url: minimlUrl,
        type: "metadata",
        description: "GEO MINiML — sample metadata and experimental design",
      });
    }
    files.push({
      name: `${acc} on NCBI GEO`,
      url: `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${acc}`,
      type: "other",
      description: "Browse supplementary files and full study record",
    });
    return files;
  }

  if (/^PXD\d+$/i.test(acc)) {
    const prideFiles = await listPrideFiles(acc);
    return prideFiles;
  }

  if (/^E-MTAB-\d+$/i.test(acc)) {
    files.push({
      name: `${acc} on ArrayExpress`,
      url: `https://www.ebi.ac.uk/biostudies/arrayexpress/studies/${acc}`,
      type: "other",
      description: "Download processed expression files from ArrayExpress",
    });
    return files;
  }

  return files;
}

async function listPrideFiles(accession: string): Promise<RawFileLink[]> {
  const acc = accession.toUpperCase();
  const files: RawFileLink[] = [
    {
      name: `${acc} on PRIDE`,
      url: `https://www.ebi.ac.uk/pride/archive/projects/${acc}`,
      type: "other",
      description: "PRIDE project page — download raw MS and search results",
    },
  ];

  try {
    const res = await fetch(
      `https://www.ebi.ac.uk/pride/ws/archive/v2/projects/${acc}/files?pageSize=100&page=0`,
      { signal: AbortSignal.timeout(30_000) }
    );
    if (res.ok) {
      const json = (await res.json()) as {
        fileName?: string;
        downloadLink?: string;
        fileCategory?: { value?: string };
      }[];
      for (const f of json.slice(0, 20)) {
        if (!f.fileName || !f.downloadLink) continue;
        const cat = f.fileCategory?.value ?? "";
        files.push({
          name: f.fileName,
          url: f.downloadLink,
          type: cat.toLowerCase().includes("search")
            ? "processed"
            : cat.toLowerCase().includes("raw")
              ? "raw_ms"
              : "other",
          description: `PRIDE file (${cat || "archive"})`,
        });
      }
    }
  } catch {
    // PRIDE API optional
  }

  return files;
}

export async function fetchGeoSeriesMatrix(
  accession: string,
  fileUrl?: string
): Promise<ParsedSeriesMatrix> {
  const acc = accession.toUpperCase();
  if (!isGeoAccession(acc)) {
    throw new Error("Not a GEO Series accession (GSE…)");
  }

  const cacheKey = `${acc}:${fileUrl ?? "auto"}`;
  const cached = matrixCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.data;
  }

  if (fileUrl) {
    const url = toHttps(fileUrl);
    const matrixUrl = geoSeriesMatrixUrl(acc);
    let metaSamples: ReturnType<typeof parseSeriesMatrixMetadata>["samples"] | undefined;

    if (matrixUrl) {
      try {
        const metaRes = await fetch(matrixUrl, { signal: AbortSignal.timeout(30_000) });
        if (metaRes.ok) {
          const text = gunzipSync(Buffer.from(await metaRes.arrayBuffer())).toString("utf-8");
          metaSamples = parseSeriesMatrixMetadata(text, acc).samples;
        }
      } catch {
        // optional metadata
      }
    }

    const parsed = await fetchGeoSupplementaryMatrix(url, acc, metaSamples);
    matrixCache.set(cacheKey, { at: Date.now(), data: parsed });
    return parsed;
  }

  const url = geoSeriesMatrixUrl(acc);
  if (!url) throw new Error("Cannot resolve GEO FTP path");

  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) {
    throw new Error(
      `GEO matrix download failed (${res.status}). Try the NCBI GEO page for supplementary files.`
    );
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const text = gunzipSync(buf).toString("utf-8");
  const meta = parseSeriesMatrixMetadata(text, acc);

  if (meta.hasExpression) {
    const parsed = parseSeriesMatrixGz(buf, acc);
    matrixCache.set(cacheKey, { at: Date.now(), data: parsed });
    return parsed;
  }

  const suppFiles = rankSupplementaryFiles(text, acc);
  if (suppFiles.length === 0) {
    throw new Error(
      "This GEO study has no expression table in the series matrix and no parseable supplementary quant file. Download raw files from NCBI GEO."
    );
  }

  const best = suppFiles[0];
  const parsed = await fetchGeoSupplementaryMatrix(best.url, acc, meta.samples);
  matrixCache.set(cacheKey, { at: Date.now(), data: parsed });
  return parsed;
}

export function matrixPreview(matrix: ParsedSeriesMatrix) {
  return {
    accession: matrix.accession,
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
