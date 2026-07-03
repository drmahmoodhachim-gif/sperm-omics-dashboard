import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPValue(p: number): string {
  if (p < 0.001) return "< 0.001";
  if (p < 0.01) return p.toFixed(3);
  return p.toFixed(2);
}

export function formatFoldChange(fc: number): string {
  const sign = fc >= 1 ? "+" : "";
  const log2 = Math.log2(fc);
  return `${sign}${log2.toFixed(2)} (log2)`;
}

export const OMICS_LABELS: Record<string, string> = {
  transcriptomics: "Transcriptomics",
  proteomics: "Proteomics",
  metabolomics: "Metabolomics",
  epigenomics: "Epigenomics",
  genomics: "Genomics",
  single_cell: "Single-cell",
  microarray: "Microarray",
  semen_parameters: "Semen Parameters",
  other: "Other",
};

export const TISSUE_LABELS: Record<string, string> = {
  spermatozoa: "Spermatozoa",
  semen: "Semen",
  testis: "Testis",
  epididymis: "Epididymis",
  blood: "Blood",
  other: "Other",
};

export const FIGURE_LABELS: Record<string, string> = {
  volcano: "Volcano Plot",
  heatmap: "Heatmap",
  pca: "PCA",
  bar: "Bar Chart",
  scatter: "Scatter Plot",
  venn: "Venn Diagram",
  pathway: "Pathway Enrichment",
  table: "Summary Table",
  other: "Other",
};
