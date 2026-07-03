import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/Badge";
import { getIngestManifest, getLibrary } from "@/lib/data/library";

export const dynamic = "force-dynamic";

export default async function IngestPage() {
  const [manifest, library] = await Promise.all([
    getIngestManifest(),
    getLibrary(),
  ]);

  return (
    <DashboardLayout activePath="/ingest">
      <div className="space-y-6">
        <header>
          <h1 className="font-serif text-3xl font-bold">Data Ingestion</h1>
          <p className="mt-2 text-muted-foreground">
            Automated pipeline pulling datasets from GEO, PRIDE, SperMD, and PubMed.
            Runs weekly via scheduled cron.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Publications" value={library.publications.length} />
          <StatCard label="Datasets" value={library.datasets.length} />
          <StatCard
            label="Last Ingest"
            value={
              manifest?.lastRun
                ? new Date(manifest.lastRun).toLocaleDateString()
                : "Not yet run"
            }
          />
          <StatCard
            label="Duration"
            value={
              manifest?.duration_ms
                ? `${(manifest.duration_ms / 1000).toFixed(0)}s`
                : "—"
            }
          />
        </div>

        {manifest ? (
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Last Run Summary</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="GEO datasets" value={manifest.counts.geo} />
              <Metric label="PRIDE projects" value={manifest.counts.pride} />
              <Metric label="PubMed articles" value={manifest.counts.pubmed} />
              <Metric label="SperMD entries" value={manifest.counts.spermd} />
              <Metric
                label="Total merged datasets"
                value={manifest.counts.total_datasets}
              />
              <Metric
                label="Total merged publications"
                value={manifest.counts.total_publications}
              />
            </dl>
            {manifest.errors.length > 0 && (
              <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                <p className="font-semibold">Errors ({manifest.errors.length})</p>
                <ul className="mt-2 list-inside list-disc">
                  {manifest.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ) : (
          <section className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <p className="text-muted-foreground">
              No ingestion has run yet. Execute{" "}
              <code className="rounded bg-muted px-2 py-0.5 text-sm">npm run ingest</code>{" "}
              or trigger the cron endpoint.
            </p>
          </section>
        )}

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Pipeline Sources</h2>
          <div className="mt-4 space-y-4">
            <SourceRow
              name="NCBI GEO"
              description="RNA-seq, microarray, methylation, scRNA-seq via E-utilities"
              schedule="Weekly"
              endpoint="scripts/lib/geo-ingest.ts"
            />
            <SourceRow
              name="PRIDE Archive"
              description="Mass spectrometry proteomics via REST API v3"
              schedule="Weekly"
              endpoint="scripts/lib/pride-ingest.ts"
            />
            <SourceRow
              name="PubMed"
              description="Systematic literature indexing via E-utilities"
              schedule="Weekly"
              endpoint="scripts/lib/pubmed-ingest.ts"
            />
            <SourceRow
              name="SperMD"
              description="266 datasets from Supplementary Table 1 (Figshare docx + catalog)"
              schedule="Weekly"
              endpoint="scripts/lib/spermd-ingest.ts"
            />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Manual Trigger</h2>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
{`# Local full ingest
npm run ingest

# Cron API (set CRON_SECRET in .env.local)
curl -X POST http://localhost:3000/api/cron/ingest \\
  -H "Authorization: Bearer YOUR_CRON_SECRET"`}
          </pre>
        </section>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-xl font-semibold">{value}</dd>
    </div>
  );
}

function SourceRow({
  name,
  description,
  schedule,
  endpoint,
}: {
  name: string;
  description: string;
  schedule: string;
  endpoint: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-4 last:border-0 last:pb-0">
      <div>
        <h3 className="font-semibold">{name}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{endpoint}</p>
      </div>
      <Badge variant="secondary">{schedule}</Badge>
    </div>
  );
}
