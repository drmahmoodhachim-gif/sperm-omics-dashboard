import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AnalysisWorkspace } from "@/components/analysis/AnalysisWorkspace";
import { getAnalyzableStudies } from "@/lib/analysis/resolve-dataset";

export const dynamic = "force-dynamic";

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ study?: string }>;
}) {
  const sp = await searchParams;
  const studies = await getAnalyzableStudies();

  return (
    <DashboardLayout activePath="/analysis">
      <div className="space-y-6">
        <header>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Analysis Workspace</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Select a study, choose variables (genes, proteins, or semen parameters), and
            generate publication-ready figures from the curated comparison statistics.
          </p>
        </header>

        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
          <AnalysisWorkspace
            initialStudies={studies}
            initialStudyId={sp.study}
          />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
