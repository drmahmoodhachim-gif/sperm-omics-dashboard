"use client";

import {
  OmicsBarChart,
  PathwayChart,
  PCAPlot,
  PublicationTable,
  VolcanoPlot,
} from "@/components/charts/PublicationCharts";
import { HeatmapChart } from "@/components/charts/HeatmapChart";
import type { Figure } from "@/lib/types";

export function FigureRenderer({ figure }: { figure: Figure }) {
  const data = figure.data ?? {};

  switch (figure.figureType) {
    case "volcano":
      return <VolcanoPlot data={(data.points as Parameters<typeof VolcanoPlot>[0]["data"]) ?? []} />;
    case "heatmap":
      return (
        <HeatmapChart
          genes={(data.genes as string[]) ?? []}
          samples={(data.samples as string[]) ?? []}
          cells={(data.cells as Parameters<typeof HeatmapChart>[0]["cells"]) ?? []}
          min={(data.min as number) ?? -2}
          max={(data.max as number) ?? 2}
          sampleLabels={data.sampleLabels as Record<string, string> | undefined}
        />
      );
    case "bar":
      return <OmicsBarChart data={(data.categories as Parameters<typeof OmicsBarChart>[0]["data"]) ?? []} />;
    case "pathway":
      return <PathwayChart data={(data.pathways as Parameters<typeof PathwayChart>[0]["data"]) ?? []} />;
    case "pca":
      return (
        <PCAPlot
          data={(data.points as Parameters<typeof PCAPlot>[0]["data"]) ?? []}
          variance={data.variance as { pc1: number; pc2: number } | undefined}
        />
      );
    case "table":
      return (
        <PublicationTable
          data={{
            columns: (data.columns as string[]) ?? [],
            rows: (data.rows as string[][]) ?? [],
          }}
        />
      );
    default:
      return (
        <div className="flex h-48 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
          Figure type &quot;{figure.figureType}&quot; — preview not yet available
        </div>
      );
  }
}
