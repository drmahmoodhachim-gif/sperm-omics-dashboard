"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import type { Dataset } from "@/lib/types";
import { OMICS_LABELS, TISSUE_LABELS } from "@/lib/utils";

const OMICS_FILTERS = [
  "",
  "transcriptomics",
  "proteomics",
  "single_cell",
  "epigenomics",
  "metabolomics",
  "microarray",
];

export function DatasetsBrowser() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [omics, setOmics] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "50",
    });
    if (search) params.set("q", search);
    if (omics) params.set("omics", omics);

    const res = await fetch(`/api/datasets?${params}`);
    const json = await res.json();
    setDatasets(json.datasets ?? []);
    setTotal(json.total ?? 0);
    setPages(json.pages ?? 1);
    setLoading(false);
  }, [page, search, omics]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search accession, title, phenotype…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[240px] flex-1 rounded-lg border border-border bg-card px-4 py-2 text-sm"
        />
        <select
          value={omics}
          onChange={(e) => {
            setOmics(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          {OMICS_FILTERS.map((o) => (
            <option key={o || "all"} value={o}>
              {o ? OMICS_LABELS[o] ?? o : "All omics types"}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-muted-foreground">
        {loading ? "Loading…" : `${total.toLocaleString()} datasets`}
      </p>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="publication-table">
          <thead>
            <tr>
              <th>Accession</th>
              <th>Title</th>
              <th>Omics</th>
              <th>Tissue</th>
              <th>Species</th>
              <th>Repository</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  Loading datasets…
                </td>
              </tr>
            ) : (
              datasets.map((d) => (
                <tr key={d.id} id={d.id}>
                  <td>
                    {d.url ? (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm font-semibold text-primary hover:underline"
                      >
                        {d.accession}
                      </a>
                    ) : (
                      <span className="font-mono text-sm font-semibold">{d.accession}</span>
                    )}
                  </td>
                  <td className="max-w-md">
                    <p className="font-medium">{d.title}</p>
                    {d.summary && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {d.summary}
                      </p>
                    )}
                  </td>
                  <td>
                    <Badge>{OMICS_LABELS[d.omicsType] ?? d.omicsType}</Badge>
                  </td>
                  <td>{TISSUE_LABELS[d.tissue] ?? d.tissue}</td>
                  <td className="capitalize">{d.species}</td>
                  <td>{d.repository}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => p - 1)}
          className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          disabled={page >= pages || loading}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
