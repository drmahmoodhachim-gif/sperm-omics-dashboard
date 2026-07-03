import Link from "next/link";
import {
  BookOpen,
  Database,
  FlaskConical,
  Image,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DeveloperCredit } from "@/components/layout/DeveloperCredit";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { OmicsBarChart } from "@/components/charts/PublicationCharts";
import { getDashboardStatsAsync, getIngestManifest, getPublicationsPage } from "@/lib/data/library";
import { figures } from "@/lib/data/seed";
import { OMICS_LABELS, TISSUE_LABELS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, manifest, recentPubs] = await Promise.all([
    getDashboardStatsAsync(),
    getIngestManifest(),
    getPublicationsPage({ limit: 5, offset: 0 }),
  ]);

  const omicsChartData = stats.omicsBreakdown.map(({ type, count }) => ({
    name: OMICS_LABELS[type] ?? type,
    count,
  }));

  return (
    <DashboardLayout activePath="/">
      <div className="space-y-8">
        <header>
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            Infertility &amp; Sperm Omics Resource Library
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Publication-ready figures, summary tables, analysis methods, and
            automatically ingested omics datasets from GEO, PRIDE, SperMD, and
            PubMed.
          </p>
          {manifest && (
            <p className="mt-2 text-xs text-muted-foreground">
              Library last synced{" "}
              {new Date(manifest.lastRun).toLocaleString()} —{" "}
              {manifest.counts.geo} GEO · {manifest.counts.pride} PRIDE ·{" "}
              {manifest.counts.spermd} SperMD · {manifest.counts.pubmed} PubMed
            </p>
          )}
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Publications"
            value={stats.totalPublications}
            subtitle="Indexed via PubMed + seed"
            icon={BookOpen}
          />
          <StatCard
            title="Omics Datasets"
            value={stats.totalDatasets}
            subtitle="GEO, PRIDE, SperMD"
            icon={Database}
          />
          <StatCard
            title="Analysis Methods"
            value={stats.totalMethods}
            subtitle="Protocols & pipelines"
            icon={FlaskConical}
          />
          <StatCard
            title="Figures & Tables"
            value={stats.totalFigures}
            subtitle="SVG/PDF export"
            icon={Image}
          />
          <StatCard
            title="Ingestion"
            value={manifest ? "Active" : "Pending"}
            subtitle={manifest ? "Weekly cron" : "Run npm run ingest"}
            icon={RefreshCw}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="h-5 w-5 text-primary" />
              Omics Modality Distribution
            </h2>
            <div className="mt-4">
              <OmicsBarChart data={omicsChartData} />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Tissue Coverage</h2>
            <div className="mt-4 space-y-3">
              {stats.tissueBreakdown.map(({ tissue, count }) => (
                <div key={tissue} className="flex items-center gap-3">
                  <span className="w-28 text-sm font-medium">
                    {TISSUE_LABELS[tissue] ?? tissue}
                  </span>
                  <div className="flex-1">
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(count / stats.totalDatasets) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-6 text-right text-sm text-muted-foreground">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Publications</h2>
            <Link href="/publications" className="text-sm font-medium text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-4 divide-y divide-border">
            {recentPubs.rows.map((pub) => (
                <div key={pub.id} className="py-4 first:pt-0 last:pb-0">
                  <h3 className="text-sm font-semibold leading-snug">
                    {pub.url ? (
                      <a href={pub.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">
                        {pub.title}
                      </a>
                    ) : pub.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pub.authors} · {pub.journal} · {pub.year}
                  </p>
                </div>
              ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Featured Figures</h2>
            <Link href="/figures" className="text-sm font-medium text-primary hover:underline">
              Browse gallery →
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {figures.slice(0, 3).map((fig) => (
              <Link key={fig.id} href={`/figures#${fig.id}`} className="rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/30">
                <Badge variant="secondary" className="mb-2">{fig.figureType}</Badge>
                <h3 className="text-sm font-semibold">{fig.title}</h3>
              </Link>
            ))}
          </div>
        </section>

        <DeveloperCredit />
      </div>
    </DashboardLayout>
  );
}
