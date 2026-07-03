import {
  geoMinimlUrl,
  geoSeriesMatrixUrl,
  isGeoAccession,
} from "@/lib/raw-data/geo-path";
import {
  parseSeriesMatrixGz,
  type ParsedSeriesMatrix,
} from "@/lib/raw-data/parse-series-matrix";

const matrixCache = new Map<string, { at: number; data: ParsedSeriesMatrix }>();
const CACHE_MS = 30 * 60 * 1000;

export interface RawFileLink {
  name: string;
  url: string;
  type: "expression_matrix" | "metadata" | "processed" | "raw_ms" | "other";
  description: string;
}

export async function listRawFiles(accession: string): Promise<RawFileLink[]> {
  const acc = accession.toUpperCase();
  const files: RawFileLink[] = [];

  if (isGeoAccession(acc)) {
    const matrixUrl = geoSeriesMatrixUrl(acc);
    const minimlUrl = geoMinimlUrl(acc);
    if (matrixUrl) {
      const ok = await headOk(matrixUrl);
      files.push({
        name: `${acc}_series_matrix.txt.gz`,
        url: matrixUrl,
        type: "expression_matrix",
        description: ok
          ? "GEO Series Matrix — sample × probe/gene expression (ready for DE analysis)"
          : "Series matrix (availability unconfirmed)",
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

async function headOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(15_000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchGeoSeriesMatrix(accession: string): Promise<ParsedSeriesMatrix> {
  const acc = accession.toUpperCase();
  if (!isGeoAccession(acc)) {
    throw new Error("Not a GEO Series accession (GSE…)");
  }

  const cached = matrixCache.get(acc);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.data;
  }

  const url = geoSeriesMatrixUrl(acc);
  if (!url) throw new Error("Cannot resolve GEO FTP path");

  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) {
    throw new Error(`GEO matrix download failed (${res.status}). Try the NCBI GEO page for supplementary files.`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const parsed = parseSeriesMatrixGz(buf, acc);
  matrixCache.set(acc, { at: Date.now(), data: parsed });
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
