"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/Badge";
import { searchLibrary } from "@/lib/data/seed";
import { OMICS_LABELS } from "@/lib/utils";
import type { Dataset, Publication } from "@/lib/types";
import type { Method } from "@/lib/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);

  useEffect(() => {
    fetch("/api/library")
      .then((r) => r.json())
      .then((data) => {
        setPublications(data.publications ?? []);
        setDatasets(data.datasets ?? []);
        setRemoteLoaded(true);
      })
      .catch(() => setRemoteLoaded(true));
  }, []);

  const localResults = query.trim().length >= 2 ? searchLibrary(query) : null;

  const results = query.trim().length >= 2 && remoteLoaded
    ? {
        publications: publications.filter(
          (p) =>
            p.title.toLowerCase().includes(query.toLowerCase()) ||
            p.authors.toLowerCase().includes(query.toLowerCase())
        ),
        datasets: datasets.filter(
          (d) =>
            d.title.toLowerCase().includes(query.toLowerCase()) ||
            d.accession.toLowerCase().includes(query.toLowerCase())
        ),
        methods: localResults?.methods ?? [],
      }
    : localResults;

  return (
    <DashboardLayout activePath="/search">
      <div className="space-y-6">
        <header>
          <h1 className="font-serif text-3xl font-bold">Search Library</h1>
          <p className="mt-2 text-muted-foreground">
            Search across {publications.length || "…"} publications and{" "}
            {datasets.length || "…"} ingested datasets.
          </p>
        </header>

        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by keyword, accession, phenotype, method…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-3.5 pl-12 pr-4 text-sm shadow-sm outline-none ring-ring focus:ring-2"
          />
        </div>

        {!results && (
          <p className="text-sm text-muted-foreground">
            Enter at least 2 characters. Try &quot;proteomics&quot;, &quot;GSE253279&quot;,
            or &quot;asthenozoospermia&quot;.
          </p>
        )}

        {results && (
          <div className="space-y-8">
            <ResultSection title="Publications" count={results.publications.length}>
              {results.publications.map((p) => (
                <div key={p.id} className="rounded-lg border border-border bg-card p-4">
                  <h3 className="font-medium">{p.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{p.authors} · {p.year}</p>
                </div>
              ))}
            </ResultSection>
            <ResultSection title="Datasets" count={results.datasets.length}>
              {results.datasets.map((d) => (
                <Link key={d.id} href={`/datasets#${d.id}`} className="block rounded-lg border border-border bg-card p-4 hover:border-primary/40">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-primary">{d.accession}</span>
                    <Badge>{OMICS_LABELS[d.omicsType]}</Badge>
                  </div>
                  <p className="mt-1 text-sm">{d.title}</p>
                </Link>
              ))}
            </ResultSection>
            <ResultSection title="Methods" count={results.methods.length}>
              {(results.methods as Method[]).map((m) => (
                <Link key={m.id} href={`/methods#${m.id}`} className="block rounded-lg border border-border bg-card p-4 hover:border-primary/40">
                  <h3 className="font-medium">{m.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                </Link>
              ))}
            </ResultSection>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function ResultSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title} ({count})</h2>
      {count === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No matches.</p>
      ) : (
        <div className="mt-3 space-y-3">{children}</div>
      )}
    </section>
  );
}
