import type { ResearchPlan } from "./types";
import { hasAnalysisData } from "@/lib/analysis/catalog";
import { resolveRawAccession } from "@/lib/raw-data/accession";

export interface PlanExecutionTarget {
  accession: string;
  mode: "raw" | "published";
  title: string;
}

export function resolveExecutionTargets(plan: ResearchPlan): PlanExecutionTarget[] {
  const targets: PlanExecutionTarget[] = [];
  const seen = new Set<string>();

  for (const ds of plan.datasets) {
    const rawAcc = resolveRawAccession(ds);
    if (rawAcc && !seen.has(rawAcc)) {
      seen.add(rawAcc);
      targets.push({ accession: rawAcc, mode: "raw", title: ds.title });
      continue;
    }
    if (hasAnalysisData(ds) && !seen.has(ds.accession)) {
      seen.add(ds.accession);
      targets.push({ accession: ds.accession, mode: "published", title: ds.title });
    }
  }

  return targets.slice(0, 5);
}

export function buildResearchAnalysisUrl(plan: ResearchPlan, auto = true): string {
  const targets = resolveExecutionTargets(plan);
  if (targets.length === 0) {
    const first = plan.datasets[0];
    if (!first) return "/analysis";
    return `/analysis?study=${encodeURIComponent(first.accession)}&from=research`;
  }

  const primary = targets[0];
  const studies = targets.map((t) => t.accession).join(",");
  const params = new URLSearchParams({
    from: "research",
    study: primary.accession,
    studies,
    q: plan.question.slice(0, 500),
  });
  if (auto) params.set("auto", "1");
  if (primary.mode === "raw") params.set("mode", "raw");
  return `/analysis?${params.toString()}`;
}

export const RESEARCH_PLAN_STORAGE_KEY = "spermomics-research-plan";

export function storeResearchPlan(plan: ResearchPlan) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(RESEARCH_PLAN_STORAGE_KEY, JSON.stringify(plan));
}

export function loadStoredResearchPlan(): ResearchPlan | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RESEARCH_PLAN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ResearchPlan) : null;
  } catch {
    return null;
  }
}

/** Pull likely gene symbols from a research question for focused DE. */
export function extractGeneHints(text: string): string[] {
  const known = [
    "CATSPER1", "CATSPER2", "AKAP4", "PRM1", "PRM2", "TNP1", "TNP2", "SPAG16",
    "DDX4", "CRISP2", "HSP90AA1", "ODF1", "TEKT1", "SYCP3", "DAZL", "SOX2",
  ];
  const upper = text.toUpperCase();
  const fromKnown = known.filter((g) => upper.includes(g));
  const tokenMatches = text.match(/\b[A-Z][A-Z0-9]{1,9}\d?\b/g) ?? [];
  const extra = tokenMatches.filter(
    (t) => t.length >= 3 && !["RNA", "DNA", "WHO", "NOA", "OAT", "IVF", "IUI"].includes(t)
  );
  return [...new Set([...fromKnown, ...extra])].slice(0, 12);
}
