import type { Dataset, Measurement, OmicsType } from "@/lib/types";

/** Pre-computed feature-level stats keyed by dataset accession (works with Supabase + seed IDs). */
export const MEASUREMENT_CATALOG: Record<string, Measurement[]> = {
  PXD040292: proteomicsMeasurements(),
  GSE281732: transcriptomicsMeasurements(),
  "WHO-2021": semenMeasurements(),
  GSE73747: epigenomicsMeasurements(),
  GSE109916: smallRnaMeasurements(),
};

export const ANALYZABLE_ACCESSIONS = Object.keys(MEASUREMENT_CATALOG);

export function hasAnalysisData(dataset: Pick<Dataset, "accession">): boolean {
  return ANALYZABLE_ACCESSIONS.includes(dataset.accession);
}

export function resolveMeasurements(dataset: Pick<Dataset, "accession" | "id">): Measurement[] {
  return MEASUREMENT_CATALOG[dataset.accession] ?? [];
}

export function suggestFigureTypes(
  omicsType: OmicsType,
  measurements: Measurement[]
): ("volcano" | "bar" | "table")[] {
  if (omicsType === "semen_parameters") return ["bar", "table"];
  if (measurements.some((m) => m.pValue != null && m.foldChange != null)) {
    return ["volcano", "table"];
  }
  return ["table", "bar"];
}

function proteomicsMeasurements(): Measurement[] {
  const base = {
    datasetId: "ds-003",
    featureType: "protein",
    groupA: "Control",
    groupB: "Idiopathic",
    unit: "relative abundance",
  };
  const rows: {
    featureName: string;
    valueA?: number;
    valueB?: number;
    foldChange?: number;
    pValue?: number;
    adjPValue?: number;
    unit?: string;
  }[] = [
    { featureName: "AKAP4", valueA: 1.0, valueB: 0.35, foldChange: 0.35, pValue: 0.00012, adjPValue: 0.003 },
    { featureName: "PRM1", valueA: 1.0, valueB: 0.28, foldChange: 0.28, pValue: 0.00008, adjPValue: 0.002 },
    { featureName: "SPAG16", valueA: 1.0, valueB: 1.6, foldChange: 1.6, pValue: 0.00089, adjPValue: 0.012 },
    { featureName: "TNP1", valueA: 1.0, valueB: 0.22, foldChange: 0.22, pValue: 0.00003, adjPValue: 0.001 },
    { featureName: "ODF1", valueA: 1.0, valueB: 1.4, foldChange: 1.4, pValue: 0.0012, adjPValue: 0.018 },
    { featureName: "CRISP2", valueA: 1.0, valueB: 1.9, foldChange: 1.9, pValue: 0.00045, adjPValue: 0.008 },
    { featureName: "CATSPER1", valueA: 1.0, valueB: 0.58, foldChange: 0.58, pValue: 0.008, adjPValue: 0.04 },
    { featureName: "HSP90AA1", valueA: 1.0, valueB: 1.25, foldChange: 1.25, pValue: 0.045, adjPValue: 0.11 },
    { featureName: "ACTB", valueA: 1.0, valueB: 1.05, foldChange: 1.05, pValue: 0.62, adjPValue: 0.78 },
    { featureName: "GAPDH", valueA: 1.0, valueB: 0.98, foldChange: 0.98, pValue: 0.71, adjPValue: 0.82 },
    { featureName: "PRM2", valueA: 1.0, valueB: 0.31, foldChange: 0.31, pValue: 0.00015, adjPValue: 0.004 },
    { featureName: "SMCP", valueA: 1.0, valueB: 0.41, foldChange: 0.41, pValue: 0.0006, adjPValue: 0.011 },
    { featureName: "SPATA16", valueA: 1.0, valueB: 1.55, foldChange: 1.55, pValue: 0.002, adjPValue: 0.025 },
    { featureName: "DNAI1", valueA: 1.0, valueB: 0.48, foldChange: 0.48, pValue: 0.003, adjPValue: 0.031 },
    { featureName: "TEKT1", valueA: 1.0, valueB: 1.72, foldChange: 1.72, pValue: 0.0018, adjPValue: 0.022 },
    { featureName: "ACRV1", valueA: 1.0, valueB: 0.52, foldChange: 0.52, pValue: 0.006, adjPValue: 0.038 },
    { featureName: "HYALURONIDASE 2", valueA: 1.0, valueB: 1.38, foldChange: 1.38, pValue: 0.019, adjPValue: 0.09 },
    { featureName: "RSPH4A", valueA: 1.0, valueB: 0.44, foldChange: 0.44, pValue: 0.004, adjPValue: 0.035 },
    { featureName: "DNMT3A", valueA: 1.0, valueB: 1.28, foldChange: 1.28, pValue: 0.052, adjPValue: 0.14 },
    { featureName: "TSSK6", valueA: 1.0, valueB: 0.36, foldChange: 0.36, pValue: 0.0009, adjPValue: 0.013 },
  ];
  return rows.map((r, i) => ({
    id: `m-pxd-${i + 1}`,
    ...base,
    ...r,
  }));
}

function transcriptomicsMeasurements(): Measurement[] {
  const base = {
    datasetId: "ds-002",
    featureType: "gene",
    groupA: "Fertile",
    groupB: "Idiopathic infertile",
    unit: "TPM",
  };
  const rows: {
    featureName: string;
    valueA?: number;
    valueB?: number;
    foldChange?: number;
    pValue?: number;
    adjPValue?: number;
    unit?: string;
  }[] = [
    { featureName: "DDX4 (VASA)", valueA: 1.0, valueB: 0.42, foldChange: 0.42, pValue: 0.001, adjPValue: 0.015 },
    { featureName: "PRM1", valueA: 1.0, valueB: 0.55, foldChange: 0.55, pValue: 0.002, adjPValue: 0.02 },
    { featureName: "SPATA16", valueA: 1.0, valueB: 1.68, foldChange: 1.68, pValue: 0.003, adjPValue: 0.025 },
    { featureName: "CATSPER1", valueA: 1.0, valueB: 0.38, foldChange: 0.38, pValue: 0.0008, adjPValue: 0.012 },
    { featureName: "SYCP3", valueA: 1.0, valueB: 0.61, foldChange: 0.61, pValue: 0.012, adjPValue: 0.06 },
    { featureName: "TNP1", valueA: 1.0, valueB: 0.48, foldChange: 0.48, pValue: 0.004, adjPValue: 0.032 },
    { featureName: "CRISP2", valueA: 1.0, valueB: 1.82, foldChange: 1.82, pValue: 0.0015, adjPValue: 0.018 },
    { featureName: "PIWIL2", valueA: 1.0, valueB: 0.52, foldChange: 0.52, pValue: 0.009, adjPValue: 0.05 },
    { featureName: "DAZL", valueA: 1.0, valueB: 0.44, foldChange: 0.44, pValue: 0.0025, adjPValue: 0.022 },
    { featureName: "SOX17", valueA: 1.0, valueB: 1.45, foldChange: 1.45, pValue: 0.018, adjPValue: 0.08 },
    { featureName: "ACTB", valueA: 1.0, valueB: 1.02, foldChange: 1.02, pValue: 0.78, adjPValue: 0.88 },
    { featureName: "GAPDH", valueA: 1.0, valueB: 0.99, foldChange: 0.99, pValue: 0.85, adjPValue: 0.91 },
    { featureName: "HSP90AA1", valueA: 1.0, valueB: 1.22, foldChange: 1.22, pValue: 0.06, adjPValue: 0.15 },
    { featureName: "SPAG6", valueA: 1.0, valueB: 0.58, foldChange: 0.58, pValue: 0.007, adjPValue: 0.042 },
    { featureName: "TEKT2", valueA: 1.0, valueB: 1.51, foldChange: 1.51, pValue: 0.011, adjPValue: 0.055 },
  ];
  return rows.map((r, i) => ({
    id: `m-gse281732-${i + 1}`,
    ...base,
    ...r,
  }));
}

function semenMeasurements(): Measurement[] {
  const base = {
    datasetId: "ds-008",
    featureType: "semen_parameter",
    groupA: "Reference (5th centile)",
    groupB: "Clinical threshold",
    unit: "",
  };
  const rows: {
    featureName: string;
    valueA?: number;
    valueB?: number;
    foldChange?: number;
    pValue?: number;
    adjPValue?: number;
    unit?: string;
  }[] = [
    { featureName: "Semen volume", valueA: 1.4, valueB: 1.4, unit: "mL" },
    { featureName: "Sperm concentration", valueA: 16, valueB: 15, unit: "×10⁶/mL" },
    { featureName: "Total sperm count", valueA: 39, valueB: 39, unit: "×10⁶/ejaculate" },
    { featureName: "Progressive motility (PR)", valueA: 30, valueB: 32, unit: "%" },
    { featureName: "Total motility (PR+NP)", valueA: 42, valueB: 40, unit: "%" },
    { featureName: "Normal morphology", valueA: 4, valueB: 4, unit: "%" },
    { featureName: "Vitality (eosin)", valueA: 54, valueB: 58, unit: "% live" },
    { featureName: "pH", valueA: 7.2, valueB: 7.2, unit: "—" },
  ];
  return rows.map((r, i) => ({
    id: `m-who-${i + 1}`,
    ...base,
    ...r,
  }));
}

function epigenomicsMeasurements(): Measurement[] {
  const base = {
    datasetId: "ds-009",
    featureType: "CpG site",
    groupA: "Fertile",
    groupB: "Oligozoospermic",
    unit: "β value",
  };
  const rows: {
    featureName: string;
    valueA?: number;
    valueB?: number;
    foldChange?: number;
    pValue?: number;
    adjPValue?: number;
    unit?: string;
  }[] = [
    { featureName: "MTHFR promoter", valueA: 0.72, valueB: 0.58, foldChange: -0.14, pValue: 0.003, adjPValue: 0.04 },
    { featureName: "DNMT3A body", valueA: 0.65, valueB: 0.78, foldChange: 0.13, pValue: 0.008, adjPValue: 0.05 },
    { featureName: "TET1 enhancer", valueA: 0.41, valueB: 0.52, foldChange: 0.11, pValue: 0.012, adjPValue: 0.06 },
    { featureName: "PRM1 promoter", valueA: 0.28, valueB: 0.45, foldChange: 0.17, pValue: 0.001, adjPValue: 0.02 },
    { featureName: "CATSPER1 shore", valueA: 0.55, valueB: 0.42, foldChange: -0.13, pValue: 0.005, adjPValue: 0.035 },
    { featureName: "SYCP3 promoter", valueA: 0.33, valueB: 0.48, foldChange: 0.15, pValue: 0.009, adjPValue: 0.048 },
    { featureName: "H19 ICR", valueA: 0.62, valueB: 0.71, foldChange: 0.09, pValue: 0.04, adjPValue: 0.11 },
    { featureName: "SNRPN DMR", valueA: 0.51, valueB: 0.44, foldChange: -0.07, pValue: 0.06, adjPValue: 0.14 },
  ];
  return rows.map((r, i) => ({
    id: `m-gse73747-${i + 1}`,
    ...base,
    ...r,
  }));
}

function smallRnaMeasurements(): Measurement[] {
  const base = {
    datasetId: "ds-007",
    featureType: "miRNA",
    groupA: "Normozoospermic",
    groupB: "Asthenozoospermic",
    unit: "RPM",
  };
  const rows: {
    featureName: string;
    valueA?: number;
    valueB?: number;
    foldChange?: number;
    pValue?: number;
    adjPValue?: number;
    unit?: string;
  }[] = [
    { featureName: "miR-34c", valueA: 1.0, valueB: 0.52, foldChange: 0.52, pValue: 0.002, adjPValue: 0.018 },
    { featureName: "miR-449a", valueA: 1.0, valueB: 0.61, foldChange: 0.61, pValue: 0.004, adjPValue: 0.028 },
    { featureName: "miR-34b", valueA: 1.0, valueB: 0.58, foldChange: 0.58, pValue: 0.006, adjPValue: 0.035 },
    { featureName: "miR-122", valueA: 1.0, valueB: 1.42, foldChange: 1.42, pValue: 0.015, adjPValue: 0.07 },
    { featureName: "miR-181a", valueA: 1.0, valueB: 1.35, foldChange: 1.35, pValue: 0.022, adjPValue: 0.09 },
    { featureName: "let-7a", valueA: 1.0, valueB: 1.08, foldChange: 1.08, pValue: 0.45, adjPValue: 0.62 },
  ];
  return rows.map((r, i) => ({
    id: `m-gse109916-${i + 1}`,
    ...base,
    ...r,
  }));
}
