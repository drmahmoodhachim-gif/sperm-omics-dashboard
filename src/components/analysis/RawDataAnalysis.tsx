"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Database,
  Download,
  Flame,
  Loader2,
  Play,
  RefreshCw,
  Table2,
  TrendingUp,
} from "lucide-react";
import { FigureRenderer } from "@/components/figures/FigureRenderer";
import { FigureExport } from "@/components/figures/FigureExport";
import { LocalOnlyGuidance } from "@/components/analysis/LocalOnlyGuidance";
import { ResearchPlanNextStudy } from "@/components/analysis/ResearchPlanBanner";
import { Badge } from "@/components/ui/Badge";
import { isLocalOnlyError } from "@/lib/raw-data/local-only";
import {
  buildAutoGroups,
  groupsFromAssignments,
} from "@/lib/research/auto-groups";
import type { Dataset, Figure } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RawFile {
  name: string;
  url: string;
  type: string;
  description: string;
  analyzable?: boolean;
}

interface MatrixSample {
  id: string;
  title: string;
  characteristics: string[];
}

interface MatrixPreview {
  accession: string;
  source?: string;
  sampleCount: number;
  geneCount: number;
  parsedGenes: number;
  samples: MatrixSample[];
}

interface DERow {
  gene: string;
  log2FC: number;
  pValue: number;
  adjPValue: number;
  significant: boolean;
  direction: string;
}

interface AnalysisResult {
  source: string;
  method: string;
  totalGenes: number;
  significantGenes: number;
  upregulated: number;
  downregulated: number;
  comparison: { groupA: string; groupB: string };
  volcano: unknown[];
  pca: { points: unknown[]; variance: { pc1: number; pc2: number } };
  heatmap: {
    genes: string[];
    samples: string[];
    cells: unknown[];
    min: number;
    max: number;
    sampleLabels?: Record<string, string>;
  };
  results: DERow[];
}

type SampleGroup = "A" | "B" | null;
type Step = 1 | 2 | 3 | 4;
type ResultTab = "volcano" | "pca" | "heatmap" | "table";
type AutoStage = "idle" | "running" | "done" | "failed";

const STEPS = [
  { n: 1, label: "Connect", icon: Database },
  { n: 2, label: "Load matrix", icon: Download },
  { n: 3, label: "Group samples", icon: Activity },
  { n: 4, label: "Results", icon: BarChart3 },
] as const;

export function RawDataAnalysis({
  study,
  autoRun = false,
  geneHints,
  studyQueue = [],
  activeStudyIndex = 0,
  onAutoComplete,
  onAdvanceStudy,
}: {
  study: Dataset;
  autoRun?: boolean;
  geneHints?: string[];
  studyQueue?: string[];
  activeStudyIndex?: number;
  onAutoComplete?: (accession: string, success: boolean) => void;
  onAdvanceStudy?: (accession: string) => void;
}) {
  const accession = study.accession.toUpperCase();
  const [step, setStep] = useState<Step>(1);
  const [files, setFiles] = useState<RawFile[]>([]);
  const [meta, setMeta] = useState<{ source?: string; kind?: string }>({});
  const [selectedFileUrl, setSelectedFileUrl] = useState<string>("");
  const [matrix, setMatrix] = useState<MatrixPreview | null>(null);
  const [assignments, setAssignments] = useState<Record<string, SampleGroup>>({});
  const [groupALabel, setGroupALabel] = useState("Control / Fertile");
  const [groupBLabel, setGroupBLabel] = useState("Case / Infertile");
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [resultTab, setResultTab] = useState<ResultTab>("volcano");
  const [geneFilter, setGeneFilter] = useState(() => geneHints?.join(", ") ?? "");
  const [localOnly, setLocalOnly] = useState(false);
  const [autoStage, setAutoStage] = useState<AutoStage>("idle");
  const [autoMessage, setAutoMessage] = useState<string | null>(null);
  const [localOnlyReasons, setLocalOnlyReasons] = useState<string[]>([]);
  const [repositoryUrl, setRepositoryUrl] = useState<string | undefined>(
    study.url
  );

  const analyzableFiles = files.filter((f) => f.analyzable);
  const showLocalOnly =
    localOnly || (analyzableFiles.length === 0 && !loadingFiles && files.length > 0);
  const showLocalOnlyFromError = isLocalOnlyError(error);

  const loadFiles = useCallback(async () => {
    setLoadingFiles(true);
    setError(null);
    setLocalOnly(false);
    setLocalOnlyReasons([]);
    try {
      const res = await fetch(`/api/raw/${encodeURIComponent(accession)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to list files");
      setFiles(data.files ?? []);
      setMeta({ source: data.source, kind: data.kind });
      setLocalOnly(Boolean(data.localOnly));
      setLocalOnlyReasons(data.localOnlyReasons ?? []);
      if (data.repositoryUrl) setRepositoryUrl(data.repositoryUrl);
      const list = (data.files as RawFile[]) ?? [];
      const first =
        list.find((f) => f.analyzable && /merged_per_sample|filelist/i.test(f.name)) ??
        list.find((f) => f.analyzable);
      if (first) setSelectedFileUrl(first.url);
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load files");
    } finally {
      setLoadingFiles(false);
    }
  }, [accession]);

  const loadMatrix = useCallback(async () => {
    setLoadingMatrix(true);
    setError(null);
    try {
      const qs = selectedFileUrl
        ? `?fileUrl=${encodeURIComponent(selectedFileUrl)}`
        : "";
      const res = await fetch(`/api/raw/${encodeURIComponent(accession)}/matrix${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load matrix");
      setMatrix(data);
      const auto = buildAutoGroups(data.samples as MatrixSample[]);
      setAssignments(auto);
      setStep(3);
      return data as MatrixPreview;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load matrix");
    } finally {
      setLoadingMatrix(false);
    }
  }, [accession, selectedFileUrl]);

  const runAutoPipeline = useCallback(async () => {
    if (autoStage === "running" || autoStage === "done") return;
    setAutoStage("running");
    setAutoMessage("Connecting to repository and listing source files…");
    setError(null);

    try {
      const filesRes = await fetch(`/api/raw/${encodeURIComponent(accession)}`);
      const filesData = await filesRes.json();
      if (!filesRes.ok) throw new Error(filesData.error ?? "Failed to list files");

      setFiles(filesData.files ?? []);
      setMeta({ source: filesData.source, kind: filesData.kind });
      setLocalOnly(Boolean(filesData.localOnly));
      setLocalOnlyReasons(filesData.localOnlyReasons ?? []);
      if (filesData.repositoryUrl) setRepositoryUrl(filesData.repositoryUrl);

      const analyzable = ((filesData.files as RawFile[]) ?? []).filter((f) => f.analyzable);
      if (filesData.localOnly || analyzable.length === 0) {
        setAutoStage("failed");
        setAutoMessage("This study needs local download — see guidance below.");
        onAutoComplete?.(accession, false);
        return;
      }

      const picked =
        analyzable.find((f) => /merged_per_sample|filelist/i.test(f.name)) ?? analyzable[0];
      const fileUrl = picked.url;
      setSelectedFileUrl(fileUrl);
      setStep(2);
      setAutoMessage("Loading expression matrix from source…");

      const qs = `?fileUrl=${encodeURIComponent(fileUrl)}`;
      const matrixRes = await fetch(`/api/raw/${encodeURIComponent(accession)}/matrix${qs}`);
      const matrixData = await matrixRes.json();
      if (!matrixRes.ok) throw new Error(matrixData.error ?? "Failed to load matrix");

      setMatrix(matrixData);
      const auto = buildAutoGroups(matrixData.samples as MatrixSample[]);
      setAssignments(auto);
      setStep(3);

      const { groupA: gA, groupB: gB } = groupsFromAssignments(auto);
      if (gA.length < 2 || gB.length < 2) {
        setAutoStage("failed");
        setAutoMessage("Could not auto-assign comparison groups (need ≥2 samples per group).");
        onAutoComplete?.(accession, false);
        return;
      }

      setAutoMessage("Running differential expression (Welch + BH-FDR)…");
      const genes = geneFilter.split(/[,\s]+/).map((g) => g.trim()).filter(Boolean);
      const analyzeRes = await fetch(`/api/raw/${encodeURIComponent(accession)}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupA: gA,
          groupB: gB,
          groupALabel,
          groupBLabel,
          genes: genes.length ? genes : undefined,
          fileUrl,
        }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error ?? "Analysis failed");

      setResult(analyzeData);
      setStep(4);
      setResultTab("volcano");
      setAutoStage("done");
      setAutoMessage(
        `Complete — ${analyzeData.significantGenes} significant features (FDR) from ${accession}.`
      );
      onAutoComplete?.(accession, true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Auto-analysis failed";
      setError(msg);
      setAutoStage("failed");
      setAutoMessage(msg);
      onAutoComplete?.(accession, false);
    }
  }, [accession, autoStage, geneFilter, groupALabel, groupBLabel, onAutoComplete]);

  useEffect(() => {
    setMatrix(null);
    setResult(null);
    setAssignments({});
    setAutoStage("idle");
    setAutoMessage(null);
    setError(null);
    if (!autoRun) {
      loadFiles();
    }
  }, [accession, autoRun, loadFiles]);

  useEffect(() => {
    if (!autoRun || autoStage !== "idle") return;
    const t = window.setTimeout(() => {
      void runAutoPipeline();
    }, 300);
    return () => window.clearTimeout(t);
  }, [autoRun, autoStage, runAutoPipeline]);

  const groupA = useMemo(
    () => Object.entries(assignments).filter(([, g]) => g === "A").map(([id]) => id),
    [assignments]
  );
  const groupB = useMemo(
    () => Object.entries(assignments).filter(([, g]) => g === "B").map(([id]) => id),
    [assignments]
  );

  async function runAnalysis(override?: {
    groupA?: string[];
    groupB?: string[];
    fileUrl?: string;
  }) {
    setAnalyzing(true);
    setError(null);
    try {
      const genes = geneFilter.split(/[,\s]+/).map((g) => g.trim()).filter(Boolean);
      const useA = override?.groupA ?? groupA;
      const useB = override?.groupB ?? groupB;
      const res = await fetch(`/api/raw/${encodeURIComponent(accession)}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupA: useA,
          groupB: useB,
          groupALabel,
          groupBLabel,
          genes: genes.length ? genes : undefined,
          fileUrl: override?.fileUrl ?? (selectedFileUrl || undefined),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setResult(data);
      setStep(4);
      setResultTab("volcano");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      return false;
    } finally {
      setAnalyzing(false);
    }
  }

  function setGroup(sampleId: string, g: SampleGroup) {
    setAssignments((prev) => ({ ...prev, [sampleId]: g }));
  }

  const volcanoFigure: Figure | null = result
    ? {
        id: "raw-volcano",
        datasetId: study.id,
        title: `Volcano: ${accession}`,
        figureType: "volcano",
        isPublicationReady: true,
        data: { points: result.volcano },
      }
    : null;

  const pcaFigure: Figure | null = result
    ? {
        id: "raw-pca",
        datasetId: study.id,
        title: `PCA: ${accession}`,
        figureType: "pca",
        isPublicationReady: true,
        data: { points: result.pca.points, variance: result.pca.variance },
      }
    : null;

  const heatmapFigure: Figure | null = result
    ? {
        id: "raw-heatmap",
        datasetId: study.id,
        title: `Top DE heatmap: ${accession}`,
        figureType: "heatmap",
        isPublicationReady: true,
        data: result.heatmap,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 via-card to-teal-500/5 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Raw data pipeline
            </p>
            <h3 className="mt-1 text-lg font-bold">{accession}</h3>
            <p className="text-sm text-muted-foreground">{meta.source ?? study.title}</p>
          </div>
          <Badge className="text-xs">{meta.kind?.toUpperCase() ?? study.repository}</Badge>
        </div>
        <ol className="mt-5 flex flex-wrap gap-2">
          {STEPS.map(({ n, label, icon: Icon }) => (
            <li
              key={n}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                step >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {step > n ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              {label}
            </li>
          ))}
        </ol>
        {autoRun && autoMessage && (
          <p
            className={cn(
              "mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
              autoStage === "running" && "bg-primary/10 text-primary",
              autoStage === "done" && "bg-emerald-500/10 text-emerald-700",
              autoStage === "failed" && "bg-amber-500/10 text-amber-800"
            )}
          >
            {autoStage === "running" && <Loader2 className="h-4 w-4 animate-spin" />}
            {autoMessage}
          </p>
        )}
      </div>

      {/* Step 1: Files */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h4 className="font-semibold">1 · Source files from repository</h4>
        {loadingFiles ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Connecting to source…
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {files.map((f) => (
              <li
                key={f.url}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  selectedFileUrl === f.url && f.analyzable !== false &&
                    (f.type === "expression_matrix" || f.type === "processed")
                    ? "border-primary bg-primary/5"
                    : "border-border/60"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {f.analyzable ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFileUrl(f.url);
                        setStep(2);
                      }}
                      className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      Use for analysis
                    </button>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      Local download
                    </Badge>
                  )}
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Download className="h-3 w-3" /> Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(showLocalOnly || showLocalOnlyFromError) && (
        <LocalOnlyGuidance
          accession={accession}
          reasons={localOnlyReasons.length ? localOnlyReasons : undefined}
          repositoryUrl={repositoryUrl}
        />
      )}

      {/* Step 2: Load matrix */}
      {analyzableFiles.length > 0 && !showLocalOnly && (
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h4 className="font-semibold">2 · Load expression / quantification matrix</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Parses sample × feature table directly from the source file (not published summary stats).
            GEO RNA-seq studies auto-load supplementary CSV/FPKM files; large microarray matrices are
            streamed. Studies with only RAW.tar or Excel need local download.
          </p>
          {selectedFileUrl && (
            <p className="mt-2 truncate font-mono text-xs text-primary">
              {selectedFileUrl.split("/").pop()}
            </p>
          )}
          <button
            type="button"
            onClick={loadMatrix}
            disabled={loadingMatrix}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
          >
            {loadingMatrix ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {matrix ? "Reload matrix" : "Load matrix from source"}
          </button>
          {matrix && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Samples", value: matrix.sampleCount },
                { label: "Features in file", value: matrix.geneCount.toLocaleString() },
                { label: "Loaded for DE", value: matrix.parsedGenes.toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-muted/50 px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-primary">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Step 3: Group samples */}
      {matrix && (
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h4 className="font-semibold">3 · Define comparison groups</h4>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-xs font-medium text-blue-600">Group A label</span>
              <input
                value={groupALabel}
                onChange={(e) => setGroupALabel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="text-xs font-medium text-red-600">Group B label</span>
              <input
                value={groupBLabel}
                onChange={(e) => setGroupBLabel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-red-200 bg-red-50/50 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold text-blue-600">
                Group A ({groupA.length})
              </p>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-blue-200 bg-blue-50/30 p-2">
                {matrix.samples.map((s) => (
                  <button
                    key={`a-${s.id}`}
                    type="button"
                    onClick={() => setGroup(s.id, assignments[s.id] === "A" ? null : "A")}
                    className={cn(
                      "w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                      assignments[s.id] === "A"
                        ? "bg-blue-600 text-white"
                        : "hover:bg-blue-100"
                    )}
                  >
                    <span className="font-mono opacity-80">{s.id}</span> · {s.title.slice(0, 40)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-red-600">
                Group B ({groupB.length})
              </p>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-red-200 bg-red-50/30 p-2">
                {matrix.samples.map((s) => (
                  <button
                    key={`b-${s.id}`}
                    type="button"
                    onClick={() => setGroup(s.id, assignments[s.id] === "B" ? null : "B")}
                    className={cn(
                      "w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                      assignments[s.id] === "B"
                        ? "bg-red-600 text-white"
                        : "hover:bg-red-100"
                    )}
                  >
                    <span className="font-mono opacity-80">{s.id}</span> · {s.title.slice(0, 40)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <input
            type="text"
            value={geneFilter}
            onChange={(e) => setGeneFilter(e.target.value)}
            placeholder="Optional: PRM1, AKAP4, DDX4 (blank = all features)"
            className="mt-4 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />

          <button
            type="button"
            onClick={() => void runAnalysis()}
            disabled={analyzing || groupA.length < 2 || groupB.length < 2}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-95 disabled:opacity-50"
          >
            {analyzing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Play className="h-5 w-5" />
            )}
            Run differential expression (Welch + BH-FDR)
          </button>
          <p className="mt-2 text-xs text-muted-foreground">
            For RNA-seq raw counts, run{" "}
            <code className="rounded bg-muted px-1">npm run analyze:deseq2</code> locally with
            DESeq2.
          </p>
        </section>
      )}

      {/* Step 4: Results */}
      {result && (
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h4 className="font-semibold">4 · Your analysis results</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            {result.method} · {result.source} · computed from source files
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              { label: "Features tested", value: result.totalGenes, icon: Table2 },
              { label: "Significant (FDR)", value: result.significantGenes, icon: Flame },
              { label: "Up in B", value: result.upregulated, icon: TrendingUp },
              { label: "Down in B", value: result.downregulated, icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-card to-muted/30 p-4"
              >
                <Icon className="h-8 w-8 text-primary/60" />
                <div>
                  <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-b border-border pb-3">
            {(
              [
                ["volcano", "Volcano"],
                ["pca", "PCA"],
                ["heatmap", "Heatmap"],
                ["table", "DE table"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setResultTab(id)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  resultTab === id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div id="figure-content-raw-analysis" className="mt-4 rounded-lg border bg-white p-4">
            {resultTab === "volcano" && volcanoFigure && <FigureRenderer figure={volcanoFigure} />}
            {resultTab === "pca" && pcaFigure && <FigureRenderer figure={pcaFigure} />}
            {resultTab === "heatmap" && heatmapFigure && <FigureRenderer figure={heatmapFigure} />}
            {resultTab === "table" && (
              <div className="max-h-96 overflow-auto">
                <table className="publication-table w-full text-xs">
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>log2FC</th>
                      <th>p-value</th>
                      <th>FDR</th>
                      <th>Sig</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.slice(0, 100).map((r) => (
                      <tr key={r.gene} className={r.significant ? "bg-primary/5" : ""}>
                        <td className="font-medium">{r.gene}</td>
                        <td>{r.log2FC.toFixed(3)}</td>
                        <td>{r.pValue.toExponential(1)}</td>
                        <td>{r.adjPValue}</td>
                        <td>{r.significant ? r.direction : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {volcanoFigure && (
            <FigureExport
              figureId="raw-analysis"
              figureTitle={volcanoFigure.title}
              className="mt-4"
            />
          )}

          {autoStage === "done" && studyQueue.length > 0 && onAdvanceStudy && (
            <ResearchPlanNextStudy
              studyQueue={studyQueue}
              activeIndex={activeStudyIndex}
              onNext={onAdvanceStudy}
            />
          )}
        </section>
      )}

      {error && !showLocalOnly && !showLocalOnlyFromError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
