import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { Dataset } from "@/lib/types";
import { OMICS_LABELS, TISSUE_LABELS } from "@/lib/utils";
import { ANALYZABLE_ACCESSIONS } from "@/lib/analysis/catalog";
import { resolveRawAccession } from "@/lib/raw-data/accession";

export function DatasetsTable({ datasets }: { datasets: Dataset[] }) {
  if (datasets.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-muted-foreground">
        No datasets match your filters.
      </p>
    );
  }

  return (
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {datasets.map((d) => {
            const rawAcc = resolveRawAccession(d);
            return (
            <tr key={d.id} id={d.id} className="hover:bg-muted/40">
              <td>
                {d.accession !== "—" && d.url ? (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm font-semibold text-primary hover:underline"
                  >
                    {d.accession}
                  </a>
                ) : (
                  <span className="font-mono text-sm text-muted-foreground">
                    {d.accession}
                  </span>
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
              <td>
                <div className="flex flex-col gap-1">
                  {ANALYZABLE_ACCESSIONS.includes(d.accession) && (
                    <Link
                      href={`/analysis?study=${encodeURIComponent(d.accession)}`}
                      className="whitespace-nowrap rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      Analyze →
                    </Link>
                  )}
                  {rawAcc && (
                    <Link
                      href={`/analysis?study=${encodeURIComponent(rawAcc)}&mode=raw`}
                      className="whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      Raw data →
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PageNav({
  page,
  pages,
  basePath,
  params,
}: {
  page: number;
  pages: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  function href(p: number) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    if (p > 1) sp.set("page", String(p));
    const q = sp.toString();
    return q ? `${basePath}?${q}` : basePath;
  }

  return (
    <div className="flex items-center justify-between">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted"
        >
          Previous
        </Link>
      ) : (
        <span className="rounded-lg border border-border px-4 py-2 text-sm opacity-40">
          Previous
        </span>
      )}
      <span className="text-sm text-muted-foreground">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link
          href={href(page + 1)}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-lg border border-border px-4 py-2 text-sm opacity-40">
          Next
        </span>
      )}
    </div>
  );
}