"use client";

import { Fragment } from "react";

interface HeatmapCell {
  gene: string;
  sample: string;
  value: number;
  group: string;
}

export function HeatmapChart({
  genes,
  samples,
  cells,
  min,
  max,
  sampleLabels,
}: {
  genes: string[];
  samples: string[];
  cells: HeatmapCell[];
  min: number;
  max: number;
  sampleLabels?: Record<string, string>;
}) {
  const lookup = new Map(cells.map((c) => [`${c.gene}|${c.sample}`, c.value]));
  const range = max - min || 1;

  function color(v: number): string {
    const t = (v - min) / range;
    if (t < 0.5) {
      const u = t * 2;
      return `rgb(${Math.round(59 + u * (14 - 59))}, ${Math.round(130 + u * (165 - 130))}, ${Math.round(246 + u * (233 - 246))})`;
    }
    const u = (t - 0.5) * 2;
    return `rgb(${Math.round(14 + u * (239 - 14))}, ${Math.round(165 + u * (68 - 165))}, ${Math.round(233 + u * (68 - 233))})`;
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="inline-grid gap-px bg-border"
        style={{
          gridTemplateColumns: `120px repeat(${samples.length}, minmax(28px, 1fr))`,
        }}
      >
        <div className="bg-muted p-1 text-[10px] font-semibold">Gene</div>
        {samples.map((s) => (
          <div
            key={s}
            className="truncate bg-muted p-1 text-center text-[9px] font-medium"
            title={sampleLabels?.[s] ?? s}
          >
            {(sampleLabels?.[s] ?? s).slice(0, 8)}
          </div>
        ))}
        {genes.map((gene) => (
          <Fragment key={gene}>
            <div
              className="truncate bg-card px-1 py-2 text-[10px] font-medium"
              title={gene}
            >
              {gene.length > 14 ? `${gene.slice(0, 12)}…` : gene}
            </div>
            {samples.map((sample) => {
              const v = lookup.get(`${gene}|${sample}`) ?? 0;
              return (
                <div
                  key={`${gene}-${sample}`}
                  className="h-7 min-w-[28px]"
                  style={{ backgroundColor: color(v) }}
                  title={`${gene} · ${sample}: z=${v.toFixed(2)}`}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Low</span>
        <div className="h-2 flex-1 rounded-full bg-gradient-to-r from-blue-400 via-white to-red-500" />
        <span>High (z-score)</span>
      </div>
    </div>
  );
}
