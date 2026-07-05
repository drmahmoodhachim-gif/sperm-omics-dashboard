import { parseQuantBuffer } from "./parse-quant-table";
import type { ParsedSeriesMatrix } from "./parse-series-matrix";
import type { RawFileLink } from "./geo-fetch";
import { scoreQuantFilename } from "./geo-supplementary";

const BIOSTUDIES_API = "https://www.ebi.ac.uk/biostudies/api/v1";
const MIN_SCORE = 8;

interface BioStudyFileRow {
  Name: string;
  path: string;
  size?: number;
  Size?: string;
  Section?: string;
  Description?: string;
  Type?: string;
}

interface BioStudyInfo {
  httpLink?: string;
  ftpLink?: string;
  files?: number;
}

function fileSize(row: BioStudyFileRow): number {
  if (row.size != null) return row.size;
  const parsed = Number(row.Size ?? 0);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function scoreAeFile(name: string, section?: string): number {
  const lower = name.toLowerCase();
  if (/\.(idf|sdrf)\.txt$/.test(lower)) return -20;
  if (/\.idat$/.test(lower)) return -20;
  if (/\.(fastq|fq|bam|sam|cram|mzml|raw)(\.gz)?$/.test(lower)) return -30;
  if (section?.toLowerCase() === "processed-data") return scoreQuantFilename(name) + 8;
  return scoreQuantFilename(name);
}

async function getStudyInfo(accession: string): Promise<BioStudyInfo | null> {
  try {
    const res = await fetch(`${BIOSTUDIES_API}/studies/${accession}/info`, {
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as BioStudyInfo;
  } catch {
    return null;
  }
}

async function listBioStudyFiles(accession: string): Promise<BioStudyFileRow[]> {
  const rows: BioStudyFileRow[] = [];
  const pageSize = 100;
  let start = 0;
  let total = Infinity;

  while (start < total) {
    const res = await fetch(
      `${BIOSTUDIES_API}/files/${accession}?start=${start}&length=${pageSize}`,
      { signal: AbortSignal.timeout(25_000) }
    );
    if (!res.ok) break;

    const json = (await res.json()) as {
      recordsTotal?: number;
      data?: BioStudyFileRow[];
    };
    total = json.recordsTotal ?? 0;
    rows.push(...(json.data ?? []));
    start += pageSize;
    if ((json.data ?? []).length === 0) break;
  }

  return rows;
}

function buildDownloadUrl(httpLink: string, filePath: string): string {
  const base = httpLink.replace(/\/$/, "");
  const parts = filePath.split("/").map((p) => encodeURIComponent(p));
  return `${base}/Files/${parts.join("/")}`;
}

function studyPageUrl(accession: string): string {
  return `https://www.ebi.ac.uk/biostudies/arrayexpress/studies/${accession}`;
}

export async function listArrayExpressFiles(accession: string): Promise<RawFileLink[]> {
  const acc = accession.toUpperCase();
  const files: RawFileLink[] = [
    {
      name: `${acc} on ArrayExpress`,
      url: studyPageUrl(acc),
      type: "other",
      description: "BioStudies record — browse all processed files",
    },
  ];

  const info = await getStudyInfo(acc);
  const httpLink = info?.httpLink;

  if (httpLink) {
    const rows = await listBioStudyFiles(acc);
    const ranked = rows
      .map((row) => {
        const name = row.Name || row.path.split("/").pop() || row.path;
        const score = scoreAeFile(name, row.Section);
        return {
          row,
          name,
          score,
          url: buildDownloadUrl(httpLink, row.path),
        };
      })
      .filter((f) => f.score >= MIN_SCORE && fileSize(f.row) <= 25_000_000)
      .sort((a, b) => b.score - a.score);

    for (const f of ranked) {
      files.push({
        name: f.name,
        url: f.url,
        type: "expression_matrix",
        description: `${f.row.Section ?? "processed"} — ${f.row.Description ?? "quantification table"}`,
        analyzable: true,
      });
    }

    for (const row of rows) {
      const name = row.Name || row.path;
      const lower = name.toLowerCase();
      if (/\.idat$/.test(lower)) {
        files.push({
          name,
          url: buildDownloadUrl(httpLink, row.path),
          type: "raw_ms",
          description: "Illumina IDAT — raw intensity, needs local preprocessing",
          analyzable: false,
        });
        break;
      }
    }
  }

  if (files.filter((f) => f.analyzable).length === 0) {
    files.push({
      name: `${acc} FTP (Atlas fallback)`,
      url: `https://ftp.ebi.ac.uk/pub/databases/microarray/data/atlas/experiments/${acc}/`,
      type: "other",
      description: "ArrayExpress Atlas FTP — may contain .genes.tsv matrices",
    });
  }

  return files;
}

export async function fetchArrayExpressMatrix(
  accession: string,
  fileUrl?: string
): Promise<ParsedSeriesMatrix> {
  const acc = accession.toUpperCase();
  const files = await listArrayExpressFiles(acc);
  const candidates = fileUrl
    ? [fileUrl, ...files.filter((f) => f.analyzable).map((f) => f.url)]
    : files.filter((f) => f.analyzable).map((f) => f.url);

  const unique = [...new Set(candidates)];
  if (unique.length === 0) {
    throw new Error(
      "No expression matrix found for this ArrayExpress study — only raw IDAT or metadata may be available"
    );
  }

  const errors: string[] = [];
  for (const url of unique.slice(0, 8)) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
      if (!res.ok) {
        errors.push(`${url.split("/").pop()}: HTTP ${res.status}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const name = url.split("/").pop()?.split("?")[0] ?? "data.tsv";
      return parseQuantBuffer(buf, acc, name);
    } catch (err) {
      errors.push(`${url.split("/").pop()}: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  throw new Error(
    `ArrayExpress download failed (${errors[0] ?? "404"}). ` +
      `Tried ${unique.length} file(s) via BioStudies FTP.`
  );
}
