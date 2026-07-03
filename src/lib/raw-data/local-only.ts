export interface RawFileLike {
  name: string;
  url: string;
  type: string;
  analyzable?: boolean;
}

export interface LocalOnlyAssessment {
  localOnly: boolean;
  reasons: string[];
  repositoryUrl?: string;
}

const LOCAL_ONLY_ERROR =
  /RAW\.tar|No parseable quantification|Excel|scRNA|only provide raw|local analysis|local DESeq2/i;

export function isLocalOnlyError(message: string | null | undefined): boolean {
  if (!message) return false;
  return LOCAL_ONLY_ERROR.test(message);
}

function isRawArchive(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    /_raw\.tar(\.gz)?$/.test(lower) ||
    (lower.endsWith(".tar") && lower.includes("raw")) ||
    (lower.endsWith(".tar.gz") && lower.includes("raw"))
  );
}

function isSpreadsheet(name: string): boolean {
  return /\.(xlsx|xls|ods)$/i.test(name);
}

function isSequencingRaw(name: string): boolean {
  return /\.(fastq|fq|bam|sam|cram)(\.gz|\.bz2)?$/i.test(name);
}

function isSingleCellObject(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes("seurat") ||
    lower.endsWith(".h5ad") ||
    lower.endsWith(".rds") ||
    lower.includes("singlecell") ||
    lower.includes("single_cell")
  );
}

export function classifyRawFileAvailability(
  files: RawFileLike[],
  accession?: string
): LocalOnlyAssessment {
  const analyzable = files.filter((f) => f.analyzable);
  const repositoryUrl =
    files.find((f) => f.type === "other" && /geo|pride|arrayexpress|biostudies/i.test(f.url))
      ?.url ??
    files.find((f) => f.type === "other")?.url ??
    (accession?.startsWith("GSE")
      ? `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${accession}`
      : undefined);

  if (analyzable.length > 0) {
    return { localOnly: false, reasons: [], repositoryUrl };
  }

  const reasons: string[] = [];
  for (const f of files) {
    if (isRawArchive(f.name) && !reasons.some((r) => r.includes("RAW.tar"))) {
      reasons.push("RAW.tar only (raw FASTQ inside the archive)");
    }
    if (isSpreadsheet(f.name) && !reasons.some((r) => r.includes("Excel"))) {
      reasons.push("Excel / Seurat objects (.xlsx, single-cell)");
    }
    if (isSequencingRaw(f.name) && !reasons.some((r) => r.includes("BAM/FASTQ"))) {
      reasons.push("BAM/FASTQ without processed counts");
    }
    if (isSingleCellObject(f.name) && !reasons.some((r) => r.includes("Single-cell"))) {
      reasons.push("Single-cell object files (Seurat / h5ad / RDS)");
    }
  }

  const localOnly =
    reasons.length > 0 ||
    (files.length > 0 &&
      files.every(
        (f) =>
          !f.analyzable &&
          f.type !== "expression_matrix" &&
          f.type !== "processed"
      ));

  return { localOnly, reasons, repositoryUrl };
}
