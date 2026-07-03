import { AlertCircle, Download, Terminal } from "lucide-react";

export function LocalOnlyGuidance({
  accession,
  reasons,
  repositoryUrl,
  compact = false,
}: {
  accession: string;
  reasons?: string[];
  repositoryUrl?: string;
  compact?: boolean;
}) {
  const geoUrl =
    repositoryUrl ??
    (accession.startsWith("GSE")
      ? `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${accession}`
      : undefined);

  const bullets = reasons?.length
    ? reasons
    : [
        "RAW.tar only (raw FASTQ)",
        "Excel / Seurat objects (.xlsx, single-cell)",
        "BAM/FASTQ without processed counts",
      ];

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-amber-200 bg-amber-50/80 p-4"
          : "rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 shadow-sm"
      }
    >
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h4 className="font-semibold text-amber-950">
              This study cannot be analyzed in the browser
            </h4>
            <p className="mt-1 text-sm text-amber-900/90">
              <span className="font-mono font-medium">{accession}</span> only provides file
              formats that Netlify cannot parse for inline differential expression.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
              What won&apos;t work in-browser
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-950/90">
              {bullets.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
              For those, use
            </p>
            <ul className="mt-2 space-y-2 text-sm text-amber-950/90">
              <li className="flex items-start gap-2">
                <Download className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {geoUrl ? (
                    <>
                      <a
                        href={geoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Download from NCBI GEO
                      </a>{" "}
                      (or use the download links in the file list below)
                    </>
                  ) : (
                    "Download from the repository links in the file list below"
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Terminal className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Local DESeq2: run{" "}
                  <code className="rounded bg-amber-100/80 px-1.5 py-0.5 font-mono text-xs">
                    npm run analyze:deseq2
                  </code>{" "}
                  with a count matrix and sample sheet after extracting files locally
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
