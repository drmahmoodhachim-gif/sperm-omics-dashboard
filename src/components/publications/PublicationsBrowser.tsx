"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import type { Publication } from "@/lib/types";

export function PublicationsBrowser() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (search) params.set("q", search);
    const res = await fetch(`/api/publications?${params}`);
    const json = await res.json();
    setPublications(json.publications ?? []);
    setTotal(json.total ?? 0);
    setPages(json.pages ?? 1);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Search publications…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm"
      />

      <p className="text-sm text-muted-foreground">
        {loading ? "Loading…" : `${total.toLocaleString()} publications indexed`}
      </p>

      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading…</p>
        ) : (
          publications.map((pub) => (
            <article
              key={pub.id}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start gap-2">
                <h2 className="flex-1 text-lg font-semibold leading-snug">
                  {pub.url ? (
                    <a
                      href={pub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary hover:underline"
                    >
                      {pub.title}
                    </a>
                  ) : (
                    pub.title
                  )}
                </h2>
                <Badge>{pub.year}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {pub.authors} · <em>{pub.journal}</em>
              </p>
              {pub.pmid && (
                <p className="mt-1 text-xs text-muted-foreground">PMID: {pub.pmid}</p>
              )}
              {pub.abstract && (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/80">
                  {pub.abstract}
                </p>
              )}
            </article>
          ))
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
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
