"use client";

import Link from "next/link";
import { ChevronRight, Lightbulb, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { ResearchPlan } from "@/lib/research/types";

export function ResearchPlanBanner({
  plan,
  question,
  studyQueue,
  activeAccession,
  activeIndex,
  autoRunning,
  onSelectStudy,
}: {
  plan?: ResearchPlan | null;
  question?: string;
  studyQueue: string[];
  activeAccession: string;
  activeIndex: number;
  autoRunning?: boolean;
  onSelectStudy?: (accession: string, index: number) => void;
}) {
  if (studyQueue.length === 0 && !plan && !question) return null;

  return (
    <section className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-primary/5 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Lightbulb className="h-5 w-5 shrink-0" />
            <h2 className="text-sm font-semibold uppercase tracking-wide">Research plan execution</h2>
            {autoRunning && (
              <Badge className="gap-1 bg-primary/90">
                <Loader2 className="h-3 w-3 animate-spin" />
                Auto-analyzing…
              </Badge>
            )}
          </div>
          {(question || plan?.question) && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {question ?? plan?.question}
            </p>
          )}
          {plan?.hypothesis && (
            <p className="mt-2 text-sm font-medium leading-snug">{plan.hypothesis}</p>
          )}
        </div>
        <Link
          href="/research"
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          Back to planner
        </Link>
      </div>

      {studyQueue.length > 1 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Suggested studies ({activeIndex + 1} of {studyQueue.length})
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {studyQueue.map((acc, i) => (
              <button
                key={acc}
                type="button"
                onClick={() => onSelectStudy?.(acc, i)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-xs font-medium transition-colors ${
                  acc === activeAccession
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                {acc}
                {i === activeIndex && autoRunning && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function ResearchPlanNextStudy({
  studyQueue,
  activeIndex,
  onNext,
}: {
  studyQueue: string[];
  activeIndex: number;
  onNext: (accession: string) => void;
}) {
  const next = studyQueue[activeIndex + 1];
  if (!next) return null;

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
      <p className="text-sm text-muted-foreground">
        Analysis complete for {studyQueue[activeIndex]}.
      </p>
      <button
        type="button"
        onClick={() => onNext(next)}
        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Continue to {next}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
