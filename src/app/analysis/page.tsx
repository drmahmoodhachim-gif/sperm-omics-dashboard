import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AnalysisWorkspace } from "@/components/analysis/AnalysisWorkspace";
import { getAnalyzableStudies, getRawCapableStudies } from "@/lib/analysis/resolve-dataset";

export const dynamic = "force-dynamic";

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ study?: string; mode?: string; auto?: string; from?: string; studies?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const [publishedStudies, rawStudies] = await Promise.all([
    getAnalyzableStudies(),
    getRawCapableStudies(),
  ]);

  return (
    <DashboardLayout activePath="/analysis">
      <div className="space-y-6">
        <header>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Analysis Workspace</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Explore published findings from curated statistics, or pick any of{" "}
            {rawStudies.length} GEO / ArrayExpress / PRIDE studies in the library to connect
            raw quantification files and run your own differential expression.
          </p>
        </header>

        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
          <AnalysisWorkspace
            initialStudies={publishedStudies}
            rawStudies={rawStudies}
            initialStudyId={sp.study}
          />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
