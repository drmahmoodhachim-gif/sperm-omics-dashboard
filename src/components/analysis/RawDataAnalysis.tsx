"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Database,
  Download,
  Loader2,
  Play,
  RefreshCw,
} from "lucide-react";
import { FigureRenderer } from "@/components/figures/FigureRenderer";
import { FigureExport } from "@/components/figures/FigureExport";
import { Badge } from "@/components/ui/Badge";
import type { Dataset, Figure } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RawFile {
  name: string;
  url: string;
  type: string;
  description: string;
}

interface MatrixSample {
  id: string;
  title: string;
  characteristics: string[];
}

interface MatrixPreview {
  accession: string;
  sampleCount: number;
  geneCount: number;
  parsedGenes: number;
  samples: MatrixSample[];
  geneSample: string[];
}

type SampleGroup = "A" | "B" | null;

function suggestGroup(char: string): SampleGroup {
  const c = char.toLowerCase();
  if (
    c.includes("control") ||
    c.includes("fertile") ||
    c.includes("normal") ||
    c.includes("healthy") ||
    c.includes("wild")
  ) {
    return "A";
  }
  if (
    c.includes("infertile") ||
    c.includes("case") ||
    c.includes("disease") ||
    c.includes("patient") ||
    c.includes("azoosperm") ||
    c.includes("astheno") ||
    c.includes("oligo")
  ) {
    return "B";
  }
  return null;
}

export function RawDataAnalysis({ study }: { study: Dataset }) {
  const [files, setFiles] = useState<RawFile[]>([]);
  const [supportsInline, setSupportsInline] = useState(false);
  const [matrix, setMatrix] = useState<MatrixPreview | null>(null);
  const [assignments, setAssignments] = useState<Record<string, SampleGroup>>({});
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [figure, setFigure] = useState<Figure | null>(null);
  const [stats, setStats] = useState<{ total: number; sig: number } | null>(null);
  const [geneFilter, setGeneFilter] = useState("");

  const accession = study.accession.toUpperCase();

  const loadFiles = useCallback(async () => {
    setLoadingFiles(true);
    setError(null);
    try {
      const res = await fetch(`/api/raw/${encodeURIComponent(accession)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to list files");
      setFiles(data.files ?? []);
      setSupportsInline(data.supportsInlineAnalysis ?? false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file list");
    } finally {
      setLoadingFiles(false);
    }
  }, [accession]);

  const loadMatrix = useCallback(async () => {
    setLoadingMatrix(true);
    setError(null);
    try {
      const res = await fetch(`/api/raw/${encodeURIComponent(accession)}/matrix`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load matrix");
      setMatrix(data);

      const auto: Record<string, SampleGroup> = {};
      for (const s of data.samples as MatrixSample[]) {
        const hint = s.characteristics.join(" ") + " " + s.title;
        auto[s.id] = suggestGroup(hint);
      }
      setAssignments(auto);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load expression matrix");
    } finally {
      setLoadingMatrix(false);
    }
  }, [accession]);

  useEffect(() => {
    setMatrix(null);
    setFigure(null);
    setStats(null);
    setAssignments({});
    loadFiles();
  }, [loadFiles]);

  const groupA = useMemo(
    () => Object.entries(assignments).filter(([, g]) => g === "A").map(([id]) => id),
    [assignments]
  );
  const groupB = useMemo(
    () => Object.entries(assignments).filter(([, g]) => g === "B").map(([id]) => id),
    [assignments]
  );

  async function runAnalysis() {
    setAnalyzing(true);
    setError(null);
    try {
      const genes = geneFilter
        .split(/[,\s]+/)
        .map((g) => g.trim())
        .filter(Boolean);

      const res = await fetch(`/api/raw/${encodeURIComponent(accession)}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupA,
          groupB,
          genes: genes.length > 0 ? genes : undefined,
          groupALabel: "Group A",
          groupBLabel: "Group B",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");

      setStats({ total: data.totalGenes, sig: data.significantGenes });
      setFigure({
        id: "raw-analysis",
        datasetId: study.id,
        title: `Raw DE: ${accession} (${data.comparison.groupA} vs ${data.comparison.groupB})`,
        figureType: "volcano",
        caption: `${data.totalGenes} genes tested · ${data.significantGenes} significant (p<0.05, |log2FC|≥0.58) · computed from GEO Series Matrix`,
        isPublicationReady: true,
        data: { points: data.volcano },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  function cycleGroup(sampleId: string) {
    setAssignments((prev) => {
      const cur = prev[sampleId] ?? null;
      const next: SampleGroup = cur === null ? "A" : cur === "A" ? "B" : null;
      return { ...prev, [sampleId]: next };
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Database className="h-4 w-4 text-primary" />
          Source raw files — {accession}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Download links from NCBI GEO / PRIDE. GEO Series Matrix files can be analyzed directly
          in this workspace.
        </p>

        {loadingFiles ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading file list…
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {files.map((f) => (
              <li
                key={f.url}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{f.type.replace(/_/g, " ")}</Badge>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {supportsInline && (
        <>
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Expression matrix</h3>
                <p className="text-xs text-muted-foreground">
                  Loads {accession} series matrix from NCBI FTP (up to 3,000 genes cached).
                </p>
              </div>
              <button
                type="button"
                onClick={loadMatrix}
                disabled={loadingMatrix}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loadingMatrix ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {matrix ? "Reload matrix" : "Load expression matrix"}
              </button>
            </div>

            {matrix && (
              <p className="mt-3 text-xs text-muted-foreground">
                {matrix.sampleCount} samples · {matrix.geneCount.toLocaleString()} genes in file
                · {matrix.parsedGenes.toLocaleString()} loaded for analysis
              </p>
            )}
          </section>

          {matrix && (
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold">Assign sample groups</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Click samples to cycle: unassigned → Group A → Group B. Groups auto-suggested from
                sample characteristics where possible.
              </p>
              <div className="mt-2 flex gap-4 text-xs">
                <span>
                  Group A: <strong>{groupA.length}</strong>
                </span>
                <span>
                  Group B: <strong>{groupB.length}</strong>
                </span>
              </div>
              <div className="mt-4 max-h-64 space-y-1 overflow-y-auto">
                {matrix.samples.map((s) => {
                  const g = assignments[s.id];
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => cycleGroup(s.id)}
                      className={cn(
                        "flex w-full flex-col rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                        g === "A" && "border-blue-400 bg-blue-50",
                        g === "B" && "border-red-400 bg-red-50",
                        !g && "border-border hover:bg-muted"
                      )}
                    >
                      <span className="font-mono text-xs text-muted-foreground">{s.id}</span>
                      <span className="font-medium">{s.title}</span>
                      {s.characteristics.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {s.characteristics.join(" · ")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4">
                <label className="text-xs font-medium text-muted-foreground">
                  Optional: specific genes (comma-separated). Leave blank for all loaded genes.
                </label>
                <input
                  type="text"
                  value={geneFilter}
                  onChange={(e) => setGeneFilter(e.target.value)}
                  placeholder="e.g. PRM1, AKAP4, DDX4"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                />
              </div>

              <button
                type="button"
                onClick={runAnalysis}
                disabled={analyzing || groupA.length < 2 || groupB.length < 2}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {analyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run differential expression
              </button>
            </section>
          )}

          {figure && (
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold">Your analysis results</h3>
              {stats && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats.total.toLocaleString()} genes · {stats.sig} significant — computed from
                  raw GEO matrix, not published findings
                </p>
              )}
              <div
                id="figure-content-raw-analysis"
                className="mt-4 rounded-lg border border-border/60 bg-white p-4"
              >
                <FigureRenderer figure={figure} />
              </div>
              <FigureExport
                figureId="raw-analysis"
                figureTitle={figure.title}
                className="mt-4"
              />
            </section>
          )}
        </>
      )}

      {!supportsInline && files.length > 0 && (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Inline analysis is available for GEO Series (GSE…) with a series matrix file. For PRIDE
          proteomics and other repositories, download processed quantification files above and use
          the Methods page pipelines — full MS raw file analysis requires external tools (MaxQuant,
          Spectronaut, etc.).
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
