import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { Publication } from "@/lib/types";

export function PublicationsList({ publications }: { publications: Publication[] }) {
  if (publications.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-muted-foreground">
        No publications match your search.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {publications.map((pub) => (
        <article
          key={pub.id}
          className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
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
      ))}
    </div>
  );
}

export function PublicationsPageNav({
  page,
  pages,
  q,
}: {
  page: number;
  pages: number;
  q: string;
}) {
  function href(p: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/publications?${qs}` : "/publications";
  }

  return (
    <div className="flex items-center justify-between pt-2">
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
