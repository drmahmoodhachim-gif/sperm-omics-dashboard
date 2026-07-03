"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, CheckSquare, Database, FlaskConical, Search, Square } from "lucide-react";
import { RawDataAnalysis } from "@/components/analysis/RawDataAnalysis";
import { FigureRenderer } from "@/components/figures/FigureRenderer";
import { FigureExport } from "@/components/figures/FigureExport";
import { Badge } from "@/components/ui/Badge";
import { buildFigureFromSelection } from "@/lib/analysis/build-figure";
import { suggestFigureTypes } from "@/lib/analysis/catalog";
import type { Dataset, FigureType, Measurement } from "@/lib/types";
import { FIGURE_LABELS, OMICS_LABELS, TISSUE_LABELS, cn } from "@/lib/utils";

const RAW_ACCESSION = /^(GSE\d+|E-MTAB-\d+|PXD\d+)$/i;

interface StudyWithCount extends Dataset {
  variableCount: number;
}

export function AnalysisWorkspace({
  initialStudies,
  initialStudyId,
}: {
  initialStudies: StudyWithCount[];
  initialStudyId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [studies] = useState(initialStudies);
  const [studyQuery, setStudyQuery] = useState("");
  const [selectedStudy, setSelectedStudy] = useState<StudyWithCount | null>(() =>
    initialStudies.find(
      (s) => s.id === initialStudyId || s.accession === initialStudyId
    ) ?? null
  );
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [selectedVars, setSelectedVars] = useState<Set<string>>(new Set());
  const [figureType, setFigureType] = useState<FigureType>("volcano");
  const [loadingStudy, setLoadingStudy] = useState(false);
  const mode = searchParams.get("mode") === "raw" ? "raw" : "published";
  const [accessionInput, setAccessionInput] = useState(() => {
    const id = initialStudyId?.toUpperCase() ?? "";
    if (RAW_ACCESSION.test(id)) return id;
    return "GSE281732";
  });
  const [rawStudy, setRawStudy] = useState<Dataset | null>(null);
  const [loadingRaw, setLoadingRaw] = useState(false);

  const filteredStudies = useMemo(() => {
    const q = studyQuery.trim().toLowerCase();
    if (!q) return studies;
    return studies.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.accession.toLowerCase().includes(q) ||
        s.phenotype?.toLowerCase().includes(q)
    );
  }, [studies, studyQuery]);

  const loadStudy = useCallback(async (study: StudyWithCount) => {
    setLoadingStudy(true);
    try {
      const res = await fetch(`/api/datasets/${encodeURIComponent(study.accession)}`);
      const data = await res.json();
      const vars: Measurement[] = data.measurements ?? [];
      setSelectedStudy(study);
      setMeasurements(vars);
      const types = suggestFigureTypes(study.omicsType, vars);
      const defaultType = types[0] as FigureType;
      setFigureType(defaultType);
      setSelectedVars(new Set(vars.map((m) => m.featureName)));

      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("study", study.accession);
        params.delete("vars");
        router.replace(`/analysis?${params.toString()}`);
      });
    } finally {
      setLoadingStudy(false);
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (initialStudyId && !selectedStudy) {
      const match = studies.find(
        (s) => s.id === initialStudyId || s.accession === initialStudyId
      );
      if (match) loadStudy(match);
    }
  }, [initialStudyId, selectedStudy, studies, loadStudy]);

  useEffect(() => {
    const fromUrl = searchParams.get("vars");
    if (fromUrl && measurements.length > 0) {
      setSelectedVars(new Set(fromUrl.split(",").filter(Boolean)));
    }
  }, [searchParams, measurements.length]);

  const groupedVars = useMemo(() => {
    const groups = new Map<string, Measurement[]>();
    measurements.forEach((m) => {
      const key = m.featureType ?? "feature";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    });
    return groups;
  }, [measurements]);

  const selectedMeasurements = useMemo(
    () => measurements.filter((m) => selectedVars.has(m.featureName)),
    [measurements, selectedVars]
  );

  const figure = useMemo(() => {
    if (!selectedStudy || selectedMeasurements.length === 0) return null;
    return buildFigureFromSelection({
      dataset: selectedStudy,
      measurements: selectedMeasurements,
      figureType,
    });
  }, [selectedStudy, selectedMeasurements, figureType]);

  const availableFigureTypes = selectedStudy
    ? suggestFigureTypes(selectedStudy.omicsType, measurements)
    : [];

  function toggleVar(name: string) {
    setSelectedVars((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (selectedStudy) params.set("study", selectedStudy.accession);
        params.set("vars", Array.from(next).join(","));
        router.replace(`/analysis?${params.toString()}`);
      });
      return next;
    });
  }

  function selectAll() {
    const all = new Set(measurements.map((m) => m.featureName));
    setSelectedVars(all);
  }

  function setMode(next: "published" | "raw") {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "raw") params.set("mode", "raw");
      else params.delete("mode");
      router.replace(`/analysis?${params.toString()}`);
    });
  }

  function rawRepository(acc: string): Dataset["repository"] {
    if (/^GSE/i.test(acc)) return "GEO";
    if (/^E-MTAB/i.test(acc)) return "ArrayExpress";
    if (/^PXD/i.test(acc)) return "PRIDE";
    return "GEO";
  }

  function rawOmics(acc: string): Dataset["omicsType"] {
    if (/^PXD/i.test(acc)) return "proteomics";
    return "transcriptomics";
  }

  const loadRawStudy = useCallback(async (accession: string) => {
    const acc = accession.trim().toUpperCase();
    if (!RAW_ACCESSION.test(acc)) return;
    setLoadingRaw(true);
    try {
      const res = await fetch(`/api/datasets/${encodeURIComponent(acc)}`);
      if (res.ok) {
        const data = await res.json();
        setRawStudy(data.dataset);
      } else {
        setRawStudy({
          id: acc,
          accession: acc,
          title: `${acc} — ${rawRepository(acc)} study`,
          repository: rawRepository(acc),
          omicsType: rawOmics(acc),
          species: "human",
          tissue: "spermatozoa",
          url:
            /^GSE/i.test(acc)
              ? `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${acc}`
              : /^PXD/i.test(acc)
                ? `https://www.ebi.ac.uk/pride/archive/projects/${acc}`
                : `https://www.ebi.ac.uk/biostudies/studies/${acc}`,
        });
      }
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("study", acc);
        params.set("mode", "raw");
        router.replace(`/analysis?${params.toString()}`);
      });
    } finally {
      setLoadingRaw(false);
    }
  }, [router, searchParams]);

  const studyParam = searchParams.get("study");

  useEffect(() => {
    if (mode === "raw" && studyParam && RAW_ACCESSION.test(studyParam)) {
      loadRawStudy(studyParam);
    }
  }, [mode, studyParam, loadRawStudy]);

  function selectSignificant() {
    const sig = measurements.filter((m) => {
      if (m.pValue == null || m.foldChange == null) return false;
      const log2FC = Math.log2(Math.max(m.foldChange, 0.01));
      return (m.adjPValue ?? m.pValue) < 0.05 && Math.abs(log2FC) >= 0.58;
    });
    setSelectedVars(new Set(sig.map((m) => m.featureName)));
  }

  const rawTarget =
    rawStudy ??
    (selectedStudy?.accession && RAW_ACCESSION.test(selectedStudy.accession)
      ? selectedStudy
      : null);

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      {/* Study picker */}
      <section className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <FlaskConical className="h-4 w-4 text-primary" />
            Select study
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose a curated dataset with pre-computed variables for analysis.
          </p>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={studyQuery}
              onChange={(e) => setStudyQuery(e.target.value)}
              placeholder="Search accession or title…"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none ring-ring focus:ring-2"
            />
          </div>
          <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto">
            {filteredStudies.map((study) => {
              const active =
                selectedStudy?.accession === study.accession ||
                selectedStudy?.id === study.id;
              return (
                <li key={study.accession}>
                  <button
                    type="button"
                    onClick={() => loadStudy(study)}
                    disabled={loadingStudy}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      active
                        ? "border-primary/40 bg-primary/10"
                        : "border-transparent hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">
                        {study.accession}
                      </span>
                      <Badge variant="secondary">{study.variableCount} vars</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-snug">{study.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {OMICS_LABELS[study.omicsType]} · {TISSUE_LABELS[study.tissue]}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Variables + preview */}
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("published")}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              mode === "published"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Published findings
          </button>
          <button
            type="button"
            onClick={() => setMode("raw")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              mode === "raw"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Database className="h-4 w-4" />
            From raw data
          </button>
        </div>

        {mode === "raw" ? (
          <div className="space-y-6">
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold">Repository accession</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Connect to raw source files from GEO (GSE), ArrayExpress (E-MTAB), or PRIDE (PXD).
                Download matrices and run your own differential expression in-browser.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["GSE281732", "E-MTAB-6419", "PXD040292"].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => {
                      setAccessionInput(example);
                      loadRawStudy(example);
                    }}
                    className="rounded-full bg-muted px-2.5 py-1 font-mono text-[10px] text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  >
                    {example}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  type="text"
                  value={accessionInput}
                  onChange={(e) => setAccessionInput(e.target.value.toUpperCase())}
                  placeholder="GSE281732 · E-MTAB-6419 · PXD040292"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none ring-ring focus:ring-2"
                />
                <button
                  type="button"
                  onClick={() => loadRawStudy(accessionInput)}
                  disabled={loadingRaw || !RAW_ACCESSION.test(accessionInput.trim())}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {loadingRaw ? "Loading…" : "Load study"}
                </button>
              </div>
            </section>
            {rawTarget ? (
              <RawDataAnalysis study={rawTarget} />
            ) : (
              <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Enter a GSE, E-MTAB, or PXD accession to connect to repository files and run
                analysis on raw quantification data.
              </div>
            )}
          </div>
        ) : !selectedStudy ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-semibold">Select a study to begin</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Pick a study from the left panel, then choose variables to feed into volcano plots,
              bar charts, or summary tables.
            </p>
          </div>
        ) : (
          <>
            <header className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1">
                  <p className="font-mono text-sm font-semibold text-primary">
                    {selectedStudy.accession}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold leading-snug">
                    {selectedStudy.title}
                  </h2>
                  {selectedStudy.phenotype && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedStudy.phenotype}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{OMICS_LABELS[selectedStudy.omicsType]}</Badge>
                  <Badge variant="secondary">{selectedStudy.repository}</Badge>
                  {selectedStudy.sampleCount && (
                    <Badge variant="secondary">n={selectedStudy.sampleCount}</Badge>
                  )}
                </div>
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Variable selection */}
              <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">
                    Variables ({selectedVars.size}/{measurements.length})
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Select all
                    </button>
                    <span className="text-muted-foreground">·</span>
                    <button
                      type="button"
                      onClick={selectSignificant}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Significant only
                    </button>
                  </div>
                </div>

                <div className="mt-4 max-h-96 space-y-4 overflow-y-auto">
                  {Array.from(groupedVars.entries()).map(([type, vars]) => (
                    <div key={type}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {type.replace(/_/g, " ")}
                      </p>
                      <ul className="space-y-1">
                        {vars.map((m) => {
                          const checked = selectedVars.has(m.featureName);
                          const sig =
                            m.pValue != null &&
                            (m.adjPValue ?? m.pValue) < 0.05 &&
                            m.foldChange != null &&
                            Math.abs(Math.log2(Math.max(m.foldChange, 0.01))) >= 0.58;
                          return (
                            <li key={m.id}>
                              <button
                                type="button"
                                onClick={() => toggleVar(m.featureName)}
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted",
                                  checked && "bg-primary/5"
                                )}
                              >
                                {checked ? (
                                  <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
                                ) : (
                                  <Square className="h-4 w-4 shrink-0 text-muted-foreground" />
                                )}
                                <span className="flex-1 font-medium">{m.featureName}</span>
                                {sig && (
                                  <Badge className="text-[10px]">sig</Badge>
                                )}
                                {m.foldChange != null && (
                                  <span className="text-xs text-muted-foreground">
                                    FC {m.foldChange.toFixed(2)}
                                  </span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Figure preview */}
              <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">Figure preview</h3>
                  <div className="flex flex-wrap gap-1">
                    {availableFigureTypes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFigureType(t)}
                        className={cn(
                          "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                          figureType === t
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {FIGURE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>

                {figure && selectedMeasurements.length > 0 ? (
                  <>
                    <p className="mt-2 text-xs text-muted-foreground">{figure.caption}</p>
                    <div
                      id="figure-content-analysis-preview"
                      className="mt-4 rounded-lg border border-border/60 bg-white p-4"
                    >
                      <FigureRenderer figure={figure} />
                    </div>
                    <FigureExport
                      figureId="analysis-preview"
                      figureTitle={figure.title}
                      className="mt-4"
                    />
                    {pending && (
                      <p className="mt-2 text-xs text-muted-foreground">Updating…</p>
                    )}
                  </>
                ) : (
                  <p className="mt-8 text-center text-sm text-muted-foreground">
                    Select at least one variable to generate a figure.
                  </p>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
