import type { Dataset, Figure, FigureType, Measurement } from "@/lib/types";

export interface VolcanoPoint {
  name: string;
  log2FC: number;
  negLog10P: number;
  significant: boolean;
  direction: "up" | "down" | "ns";
}

export function measurementsToVolcano(measurements: Measurement[]): VolcanoPoint[] {
  return measurements
    .filter((m) => m.pValue != null && m.foldChange != null)
    .map((m) => {
      const fc = m.foldChange!;
      const log2FC = fc > 0 ? Math.log2(Math.max(fc, 0.01)) : 0;
      const negLog10P = -Math.log10(Math.max(m.pValue!, 1e-300));
      const sig = (m.adjPValue ?? m.pValue)! < 0.05 && Math.abs(log2FC) >= 0.58;
      return {
        name: m.featureName,
        log2FC: Number(log2FC.toFixed(3)),
        negLog10P: Number(negLog10P.toFixed(3)),
        significant: sig,
        direction: sig ? (log2FC > 0 ? "up" : "down") : "ns",
      };
    });
}

export function measurementsToBar(measurements: Measurement[]) {
  return measurements.map((m) => ({
    name: m.featureName,
    count: m.valueA ?? 0,
  }));
}

export function measurementsToTable(measurements: Measurement[]) {
  const hasStats = measurements.some((m) => m.pValue != null);
  const columns = hasStats
    ? ["Feature", "Group A", "Group B", "Fold change", "p-value", "Unit"]
    : ["Parameter", "Reference", "Threshold", "Unit"];

  const rows = measurements.map((m) => {
    if (hasStats) {
      return [
        m.featureName,
        m.valueA?.toString() ?? "—",
        m.valueB?.toString() ?? "—",
        m.foldChange?.toFixed(2) ?? "—",
        m.pValue != null ? m.pValue.toExponential(1) : "—",
        m.unit ?? "—",
      ];
    }
    return [
      m.featureName,
      m.valueA?.toString() ?? "—",
      m.valueB?.toString() ?? "—",
      m.unit ?? "—",
    ];
  });

  return { columns, rows };
}

export function buildFigureFromSelection(opts: {
  dataset: Dataset;
  measurements: Measurement[];
  figureType: FigureType;
}): Figure {
  const { dataset, measurements, figureType } = opts;
  const comparison = measurements[0]
    ? `${measurements[0].groupA} vs ${measurements[0].groupB}`
    : "";

  const title = `${FIGURE_TYPE_LABELS[figureType] ?? figureType}: ${dataset.accession}`;

  switch (figureType) {
    case "volcano":
      return {
        id: "analysis-preview",
        datasetId: dataset.id,
        title,
        figureType: "volcano",
        caption: `${measurements.length} selected features · ${comparison} · ${dataset.title}`,
        isPublicationReady: true,
        data: { points: measurementsToVolcano(measurements) },
      };
    case "bar":
      return {
        id: "analysis-preview",
        datasetId: dataset.id,
        title,
        figureType: "bar",
        caption: `${measurements.length} selected parameters · ${dataset.title}`,
        isPublicationReady: true,
        data: { categories: measurementsToBar(measurements) },
      };
    case "table":
    default:
      return {
        id: "analysis-preview",
        datasetId: dataset.id,
        title,
        figureType: "table",
        caption: `${measurements.length} selected variables · ${comparison || dataset.phenotype || ""}`,
        isPublicationReady: true,
        data: measurementsToTable(measurements),
      };
  }
}

const FIGURE_TYPE_LABELS: Partial<Record<FigureType, string>> = {
  volcano: "Volcano Plot",
  bar: "Bar Chart",
  table: "Summary Table",
};
