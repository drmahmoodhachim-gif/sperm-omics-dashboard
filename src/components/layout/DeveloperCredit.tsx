import { ExternalLink, User } from "lucide-react";
import { DEVELOPER } from "@/lib/site";

export function DeveloperCredit({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Curated public omics &amp; semen data from GEO, PRIDE, SperMD, and WHO references.
        </p>
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Developed by
          </p>
          <a
            href={DEVELOPER.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-start gap-2 text-xs font-medium text-foreground hover:text-primary"
          >
            <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              {DEVELOPER.shortName}
              <ExternalLink className="ml-1 inline h-3 w-3 text-muted-foreground" />
            </span>
          </a>
          <p className="mt-1 pl-5 text-[10px] leading-snug text-muted-foreground">
            {DEVELOPER.title}
            <br />
            MBRU, {DEVELOPER.location}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Developer
      </p>
      <div className="mt-3 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <User className="h-6 w-6" />
        </div>
        <div>
          <a
            href={DEVELOPER.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 text-lg font-semibold hover:text-primary"
          >
            {DEVELOPER.name}
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </a>
          <p className="mt-1 text-sm text-muted-foreground">{DEVELOPER.title}</p>
          <p className="text-sm text-muted-foreground">
            {DEVELOPER.institution}
            <br />
            {DEVELOPER.location}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            Integrative omics and systems biology for complex chronic diseases — applied here
            to male infertility and sperm research resource curation, analysis, and
            publication-ready visualization.
          </p>
          <a
            href={DEVELOPER.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
          >
            View faculty profile at MBRU →
          </a>
        </div>
      </div>
    </section>
  );
}
