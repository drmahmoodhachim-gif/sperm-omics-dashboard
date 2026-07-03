"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const OMICS_FILTERS = [
  { value: "", label: "All omics types" },
  { value: "transcriptomics", label: "Transcriptomics" },
  { value: "proteomics", label: "Proteomics" },
  { value: "single_cell", label: "Single-cell" },
  { value: "epigenomics", label: "Epigenomics" },
  { value: "metabolomics", label: "Metabolomics" },
  { value: "microarray", label: "Microarray" },
];

export function DatasetFilters({
  q,
  omics,
}: {
  q: string;
  omics: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function pushUpdates(next: { q?: string; omics?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (next.q !== undefined) {
      if (next.q) params.set("q", next.q);
      else params.delete("q");
    }
    if (next.omics !== undefined) {
      if (next.omics) params.set("omics", next.omics);
      else params.delete("omics");
    }
    startTransition(() => {
      router.push(`/datasets?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Search accession, title, phenotype…"
        onChange={(e) => pushUpdates({ q: e.target.value })}
        className="min-w-[240px] flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm shadow-sm outline-none ring-ring focus:ring-2"
      />
      <select
        name="omics"
        defaultValue={omics}
        onChange={(e) => pushUpdates({ omics: e.target.value })}
        className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm shadow-sm outline-none ring-ring focus:ring-2"
      >
        {OMICS_FILTERS.map((o) => (
          <option key={o.value || "all"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {pending && (
        <span className="self-center text-xs text-muted-foreground">Updating…</span>
      )}
    </div>
  );
}
