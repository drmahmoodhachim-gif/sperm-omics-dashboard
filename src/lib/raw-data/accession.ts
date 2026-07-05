import type { Dataset } from "@/lib/types";
import { extractAccession } from "@/lib/utils/sanitize-text";

/** Accessions that can connect to GEO / ArrayExpress / PRIDE raw files. */
export const RAW_ACCESSION_RE = /^(GSE\d+|E-MTAB-\d+|E-MEXP-\d+|PXD\d+)$/i;

export type RawRepositoryKind = "geo" | "arrayexpress" | "pride";

export function normalizeRawAccession(value: string): string | null {
  const u = value.trim().toUpperCase();
  if (RAW_ACCESSION_RE.test(u)) return u;

  const geod = u.match(/^E-GEOD-(\d+)$/);
  if (geod) return `GSE${geod[1]}`;

  return null;
}

export function isRawAnalyzableAccession(value: string): boolean {
  return normalizeRawAccession(value) !== null;
}

export function accessionKind(acc: string): RawRepositoryKind | "unknown" {
  const n = normalizeRawAccession(acc) ?? acc.toUpperCase();
  if (/^GSE\d+$/.test(n)) return "geo";
  if (/^PXD\d+$/.test(n)) return "pride";
  if (/^E-MTAB-\d+$/.test(n)) return "arrayexpress";
  if (/^E-MEXP-\d+$/.test(n)) return "arrayexpress";
  return "unknown";
}

export function sourceLabel(accession: string): string {
  switch (accessionKind(accession)) {
    case "geo":
      return "NCBI GEO";
    case "arrayexpress":
      return "ArrayExpress";
    case "pride":
      return "PRIDE";
    default:
      return "Repository";
  }
}

export function repositoryForAccession(acc: string): Dataset["repository"] {
  switch (accessionKind(acc)) {
    case "geo":
      return "GEO";
    case "arrayexpress":
      return "ArrayExpress";
    case "pride":
      return "PRIDE";
    default:
      return "GEO";
  }
}

export function resolveRawAccession(
  dataset: Pick<Dataset, "accession" | "url" | "title" | "summary">
): string | null {
  const direct = normalizeRawAccession(dataset.accession);
  if (direct) return direct;

  const blob = [dataset.url, dataset.title, dataset.summary].filter(Boolean).join(" ");
  const extracted = extractAccession(blob);
  if (extracted) return normalizeRawAccession(extracted) ?? extracted;

  return null;
}

export function supportsRawAnalysis(
  dataset: Pick<Dataset, "accession" | "url" | "title" | "summary">
): boolean {
  return resolveRawAccession(dataset) !== null;
}

export function defaultStudyUrl(acc: string): string {
  const n = normalizeRawAccession(acc) ?? acc;
  if (/^GSE/i.test(n)) {
    return `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${n}`;
  }
  if (/^PXD/i.test(n)) {
    return `https://www.ebi.ac.uk/pride/archive/projects/${n}`;
  }
  return `https://www.ebi.ac.uk/biostudies/studies/${n}`;
}
