import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DatasetFilters } from "@/components/datasets/DatasetFilters";
import { DatasetsTable, PageNav } from "@/components/datasets/DatasetsTable";
import { getDatasetsPage } from "@/lib/data/library";

export const dynamic = "force-dynamic";

const LIMIT = 50;

export default async function DatasetsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; omics?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const q = sp.q?.trim() ?? "";
  const omics = sp.omics ?? "";

  const result = await getDatasetsPage({
    limit: LIMIT,
    offset: (page - 1) * LIMIT,
    search: q || undefined,
    omicsType: omics || undefined,
  });

  const pages = Math.max(1, Math.ceil(result.total / LIMIT));

  return (
    <DashboardLayout activePath="/datasets">
      <div className="space-y-6">
        <header>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Public Datasets</h1>
          <p className="mt-2 text-muted-foreground">
            {result.total.toLocaleString()} curated datasets from GEO, PRIDE, SperMD, and PubMed.
          </p>
        </header>

        <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-muted" />}>
          <DatasetFilters q={q} omics={omics} />
        </Suspense>

        <DatasetsTable datasets={result.rows} />

        <PageNav
          page={page}
          pages={pages}
          basePath="/datasets"
          params={{ q: q || undefined, omics: omics || undefined }}
        />
      </div>
    </DashboardLayout>
  );
}
