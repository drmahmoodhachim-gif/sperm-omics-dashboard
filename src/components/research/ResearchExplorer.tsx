"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Beaker,
  BookOpen,
  ChevronRight,
  ClipboardCopy,
  Database,
  FlaskConical,
  ImageIcon,
  Lightbulb,
  LineChart,
  Loader2,
  Microscope,
  Play,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  buildResearchAnalysisUrl,
  resolveExecutionTargets,
  storeResearchPlan,
} from "@/lib/research/analysis-url";
import { RESEARCH_TEMPLATES } from "@/lib/research/templates";
import type { ResearchPlan, ResearchTemplateId } from "@/lib/research/types";
import { OMICS_LABELS, TISSUE_LABELS } from "@/lib/utils";

const EXAMPLE_QUESTIONS = [
  "Do idiopathic infertile men show distinct sperm transcriptome signatures compared to fertile controls?",
  "Can sperm proteomics identify biomarkers for asthenozoospermia?",
  "What pathways are enriched in NOA testicular biopsies vs OAT sperm RNA?",
  "Is there immune cell dysregulation in blood associated with male infertility?",
  "How does sperm DNA methylation relate to WHO semen morphology thresholds?",
];

export function ResearchExplorer() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [templateId, setTemplateId] = useState<ResearchTemplateId>("differential_expression");
  const [plan, setPlan] = useState<ResearchPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/research/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, templateId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setPlan(data as ResearchPlan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [question, templateId]);

  const copyMethods = async () => {
    if (!plan) return;
    await navigator.clipboard.writeText(plan.materialsAndMethods);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executePlan = useCallback(
    (auto = true) => {
      if (!plan) return;
      storeResearchPlan(plan);
      router.push(buildResearchAnalysisUrl(plan, auto));
    },
    [plan, router]
  );

  const executionTargets = plan ? resolveExecutionTargets(plan) : [];

  return (
    <div className="space-y-8">
      {/* Input panel */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Define your research question</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Describe the finding or hypothesis you want to explore. The planner will match
                library datasets and publications, draft methods, figures, and validation experiments.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="template" className="text-sm font-medium">
                  Manuscript / hypothesis template
                </label>
                <select
                  id="template"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value as ResearchTemplateId)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {RESEARCH_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {RESEARCH_TEMPLATES.find((t) => t.id === templateId)?.description}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quick examples</label>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLE_QUESTIONS.slice(0, 3).map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setQuestion(ex)}
                      className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                    >
                      {ex.slice(0, 42)}…
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="question" className="text-sm font-medium">
                Your question or finding
              </label>
              <textarea
                id="question"
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. We observed reduced CATSPER1 expression in asthenozoospermic sperm — which public datasets can test this and what validation is needed?"
                className="w-full resize-y rounded-lg border border-border bg-background px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-xs text-muted-foreground">{question.length} characters (min. 10)</p>
            </div>

            <button
              type="button"
              onClick={generate}
              disabled={loading || question.trim().length < 10}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition",
                loading || question.trim().length < 10
                  ? "cursor-not-allowed bg-primary/50"
                  : "bg-primary hover:bg-primary/90"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating plan…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate hypothesis &amp; research plan
                </>
              )}
            </button>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        </div>
      </section>

      {plan && (
        <>
          {/* Hypothesis */}
          <section className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-card p-6 shadow-sm">
            <div className="flex items-center gap-2 text-primary">
              <Target className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Generated hypothesis</h2>
              <Badge variant="secondary">{plan.templateLabel}</Badge>
            </div>
            <p className="mt-4 text-base leading-relaxed">{plan.hypothesis}</p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Specific aims
                </h3>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                  {plan.specificAims.map((aim, i) => (
                    <li key={i}>{aim}</li>
                  ))}
                </ol>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Testable predictions
                </h3>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed">
                  {plan.predictions.map((p, i) => (
                    <li key={i} className="flex gap-2">
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-primary/10 pt-6">
              <button
                type="button"
                onClick={() => executePlan(true)}
                disabled={executionTargets.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                Run analysis on {executionTargets.length || "suggested"} stud
                {executionTargets.length === 1 ? "y" : "ies"}
              </button>
              <button
                type="button"
                onClick={() => executePlan(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
              >
                <LineChart className="h-4 w-4" />
                Open in workspace (manual)
              </button>
              {executionTargets.length > 0 && (
                <p className="w-full text-xs text-muted-foreground">
                  Auto-run connects to source files, loads matrices, assigns groups, and runs
                  differential expression for:{" "}
                  {executionTargets.map((t) => t.accession).join(", ")}.
                </p>
              )}
            </div>
          </section>

          {/* Datasets & publications */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Suggested datasets</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Ranked by relevance to your question. Open in Analysis Workspace to run figures.
              </p>
              <ul className="mt-4 space-y-3">
                {plan.datasets.map((ds) => (
                  <li
                    key={ds.id}
                    className="rounded-lg border border-border bg-muted/20 p-4 transition hover:border-primary/30"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link
                          href={ds.analysisUrl}
                          className="font-mono text-sm font-semibold text-primary hover:underline"
                        >
                          {ds.accession}
                        </Link>
                        <p className="mt-1 text-sm leading-snug">{ds.title}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary">{OMICS_LABELS[ds.omicsType] ?? ds.omicsType}</Badge>
                        <Badge variant="secondary">{TISSUE_LABELS[ds.tissue] ?? ds.tissue}</Badge>
                      </div>
                    </div>
                    {ds.matchReasons.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Match: {ds.matchReasons.join(", ")}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={ds.analysisUrl}
                        className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                      >
                        Analyze <ChevronRight className="h-3 w-3" />
                      </Link>
                      {ds.rawAnalysisUrl && ds.rawAnalysisUrl !== ds.analysisUrl && (
                        <Link
                          href={ds.rawAnalysisUrl}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                        >
                          Raw data pipeline
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Related publications</h2>
              </div>
              <ul className="mt-4 space-y-3">
                {plan.publications.map((pub) => (
                  <li key={pub.id} className="rounded-lg border border-border bg-muted/20 p-4">
                    <p className="text-sm font-medium leading-snug">{pub.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {pub.authors} · {pub.journal} ({pub.year})
                    </p>
                    {pub.matchReasons.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Match: {pub.matchReasons.join(", ")}
                      </p>
                    )}
                    {pub.url && (
                      <a
                        href={pub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                      >
                        View source
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Analysis shortcuts */}
          {plan.analysisLinks.length > 0 && (
            <section className="flex flex-wrap gap-2">
              {plan.analysisLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                >
                  <LineChartIcon />
                  {link.label}
                </Link>
              ))}
            </section>
          )}

          {/* Materials & methods */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Materials &amp; methods (draft)</h2>
              </div>
              <button
                type="button"
                onClick={copyMethods}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <ClipboardCopy className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Copy to clipboard"}
              </button>
            </div>
            {plan.methodsUsed.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {plan.methodsUsed.map((m) => (
                  <Link key={m.id} href={`/methods#${m.id}`}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-muted">
                      {m.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm leading-relaxed">
              {plan.materialsAndMethods}
            </div>
          </section>

          {/* Figure plan */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Figure plan &amp; descriptions</h2>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {plan.figurePlan.map((fig) => (
                <article
                  key={fig.panel}
                  className="rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                      {fig.panel}
                    </span>
                    <Badge variant="secondary">{fig.figureType}</Badge>
                  </div>
                  <h3 className="mt-2 font-medium">{fig.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {fig.description}
                  </p>
                  {fig.suggestedDataset && (
                    <Link
                      href={`/analysis?study=${encodeURIComponent(fig.suggestedDataset)}&mode=raw`}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Build in workspace: {fig.suggestedDataset}
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </section>

          {/* Validations */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Suggested validations</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Follow-up experiments to strengthen causal claims beyond public data re-analysis.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {plan.validations.map((v, i) => (
                <article
                  key={i}
                  className={cn(
                    "rounded-lg border p-4",
                    v.type === "in_vivo"
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-blue-500/30 bg-blue-500/5"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {v.type === "in_vivo" ? (
                      <Beaker className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <FlaskConical className="h-4 w-4 text-blue-600" />
                    )}
                    <Badge variant={v.type === "in_vivo" ? "default" : "secondary"}>
                      {v.type === "in_vivo" ? "In vivo" : "In vitro"}
                    </Badge>
                    <h3 className="font-medium">{v.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{v.rationale}</p>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {v.readouts.map((r) => (
                      <li key={r} className="flex gap-2">
                        <span className="text-muted-foreground">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function LineChartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}
