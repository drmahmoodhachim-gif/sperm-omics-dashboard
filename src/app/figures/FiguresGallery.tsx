"use client";

import { FigureRenderer } from "@/components/figures/FigureRenderer";
import { FigureExport } from "@/components/figures/FigureExport";
import { Badge } from "@/components/ui/Badge";
import {
  figures,
  getDatasetById,
  getMethodById,
  getPublicationById,
} from "@/lib/data/seed";
import { FIGURE_LABELS } from "@/lib/utils";

export function FiguresGallery() {
  return (
    <div className="space-y-8">
      {figures.map((fig) => {
        const pub = fig.publicationId
          ? getPublicationById(fig.publicationId)
          : undefined;
        const dataset = fig.datasetId ? getDatasetById(fig.datasetId) : undefined;
        const method = fig.methodId ? getMethodById(fig.methodId) : undefined;

        return (
          <article
            key={fig.id}
            id={fig.id}
            className="rounded-xl border border-border bg-card shadow-sm"
          >
            <div className="border-b border-border px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{FIGURE_LABELS[fig.figureType] ?? fig.figureType}</Badge>
                  {fig.isPublicationReady && (
                    <Badge variant="secondary">Publication-ready</Badge>
                  )}
                </div>
                <FigureExport figureId={fig.id} figureTitle={fig.title} />
              </div>
              <h2 className="mt-2 text-lg font-semibold">{fig.title}</h2>
              {fig.caption && (
                <p className="mt-1 text-sm italic text-muted-foreground">
                  {fig.caption}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                {dataset && (
                  <span>
                    Dataset:{" "}
                    <span className="font-mono font-medium text-foreground">
                      {dataset.accession}
                    </span>
                  </span>
                )}
                {method && (
                  <span>
                    Method:{" "}
                    <span className="font-medium text-foreground">{method.name}</span>
                  </span>
                )}
                {pub && (
                  <span>
                    Source:{" "}
                    <span className="font-medium text-foreground">
                      {pub.authors.split(",")[0]} et al., {pub.year}
                    </span>
                  </span>
                )}
              </div>
            </div>
            <div id={`figure-content-${fig.id}`} className="p-6">
              <FigureRenderer figure={fig} />
            </div>
            {method && (
              <div className="border-t border-border bg-muted/30 px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Methods Summary
                </p>
                <p className="mt-1 text-sm">{method.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {method.software.map((sw: string) => (
                    <Badge key={sw} variant="outline">
                      {sw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
