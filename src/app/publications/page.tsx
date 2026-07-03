import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PublicationSearch } from "@/components/publications/PublicationSearch";
import { PublicationsList, PublicationsPageNav } from "@/components/publications/PublicationsList";
import { getPublicationsPage } from "@/lib/data/library";

export const dynamic = "force-dynamic";

const LIMIT = 25;

export default async function PublicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const q = sp.q?.trim() ?? "";

  const result = await getPublicationsPage({
    limit: LIMIT,
    offset: (page - 1) * LIMIT,
    search: q || undefined,
  });

  const pages = Math.max(1, Math.ceil(result.total / LIMIT));

  return (
    <DashboardLayout activePath="/publications">
      <div className="space-y-6">
        <header>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Publications</h1>
          <p className="mt-2 text-muted-foreground">
            {result.total.toLocaleString()} PubMed-indexed infertility and sperm research papers.
          </p>
        </header>

        <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-muted" />}>
          <PublicationSearch q={q} />
        </Suspense>

        <PublicationsList publications={result.rows} />

        <PublicationsPageNav page={page} pages={pages} q={q} />
      </div>
    </DashboardLayout>
  );
}
