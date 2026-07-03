import type { IngestRecord } from "./ingest-types";
import { esearch, esummary } from "./ncbi-client";

const QUERIES = [
  "male infertility sperm RNA-seq",
  "spermatozoa proteomics infertility",
  "azoospermia transcriptome",
  "asthenozoospermia omics",
  "sperm DNA methylation infertility",
  "oligozoospermia microarray",
  "epididymis sperm maturation RNA",
  "testis spermatogenesis single cell",
];

function inferOmics(title: string, summary: string): string {
  const t = `${title} ${summary}`.toLowerCase();
  if (t.includes("single cell") || t.includes("single-cell") || t.includes("scrna"))
    return "single_cell";
  if (t.includes("proteom") || t.includes("mass spectrom")) return "proteomics";
  if (t.includes("methyl") || t.includes("epigen")) return "epigenomics";
  if (t.includes("metabolom")) return "metabolomics";
  if (t.includes("microarray") || t.includes("array")) return "microarray";
  if (t.includes("genome") || t.includes("exome") || t.includes("wgs"))
    return "genomics";
  return "transcriptomics";
}

function inferTissue(title: string, summary: string): string {
  const t = `${title} ${summary}`.toLowerCase();
  if (t.includes("spermatozo") || t.includes("sperm cell")) return "spermatozoa";
  if (t.includes("semen")) return "semen";
  if (t.includes("testis") || t.includes("testicular")) return "testis";
  if (t.includes("epididym")) return "epididymis";
  if (t.includes("blood") || t.includes("peripheral")) return "blood";
  return "other";
}

function inferSpecies(title: string, summary: string): string {
  const t = `${title} ${summary}`.toLowerCase();
  if (t.includes("mouse") || t.includes("mus musculus")) return "mouse";
  if (t.includes("rat") || t.includes("rattus")) return "rat";
  if (t.includes("human") || t.includes("homosapien") || t.includes("patient"))
    return "human";
  return "human";
}

export async function ingestGeo(retmax = 25): Promise<IngestRecord[]> {
  const seen = new Set<string>();
  const records: IngestRecord[] = [];
  const now = new Date().toISOString();

  for (const query of QUERIES) {
    try {
      const ids = await esearch("gds", query, retmax);
      const summaries = await esummary("gds", ids);

      for (const id of ids) {
        const item = summaries[id];
        if (!item) continue;
        const accession = String(item.accession ?? item.gse ?? id);
        if (seen.has(accession)) continue;
        seen.add(accession);

        const title = String(item.title ?? "Untitled");
        const summary = String(item.summary ?? "");
        records.push({
          accession,
          repository: "GEO",
          title,
          summary,
          omicsType: inferOmics(title, summary),
          species: inferSpecies(title, summary),
          tissue: inferTissue(title, summary),
          sampleCount: Number(item.n_samples ?? item.samples ?? 0) || undefined,
          platform: String(item.platform ?? item.gpl ?? "") || undefined,
          pubdate: String(item.pdat ?? item.pubdate ?? "") || undefined,
          url: `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${accession}`,
          source: "geo",
          ingestedAt: now,
        });
      }
    } catch (err) {
      console.error(`  GEO query failed "${query}":`, err);
    }
  }

  return records;
}
