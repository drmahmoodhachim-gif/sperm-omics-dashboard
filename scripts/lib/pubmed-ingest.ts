import type { PubMedRecord } from "./ingest-types";
import { efetchPubMedAbstracts, esearch, esummary } from "./ncbi-client";

const QUERIES = [
  "male infertility omics",
  "spermatozoa transcriptome infertility",
  "sperm proteomics male infertility",
  "azoospermia RNA-seq",
  "asthenozoospermia biomarker",
  "sperm DNA methylation infertility",
  "epididymis sperm maturation",
  "semen parameters male factor infertility",
];

function parseAuthors(item: Record<string, unknown>): string {
  const authors = item.authors as { name?: string }[] | undefined;
  if (!Array.isArray(authors)) return "Unknown";
  return authors
    .slice(0, 6)
    .map((a) => a.name ?? "")
    .filter(Boolean)
    .join(", ");
}

function parseYear(item: Record<string, unknown>): number {
  const pubdate = String(item.pubdate ?? item.epubdate ?? "");
  const match = pubdate.match(/(\d{4})/);
  return match ? Number(match[1]) : new Date().getFullYear();
}

function parseDoi(item: Record<string, unknown>): string | undefined {
  const ids = item.articleids as { idtype?: string; value?: string }[] | undefined;
  if (!Array.isArray(ids)) return undefined;
  return ids.find((i) => i.idtype === "doi")?.value;
}

export async function ingestPubMed(retmax = 40): Promise<PubMedRecord[]> {
  const seen = new Set<string>();
  const records: PubMedRecord[] = [];
  const now = new Date().toISOString();
  const allPmids: string[] = [];

  for (const query of QUERIES) {
    try {
      const ids = await esearch("pubmed", query, retmax);
      for (const id of ids) {
        if (!seen.has(id)) {
          seen.add(id);
          allPmids.push(id);
        }
      }
    } catch (err) {
      console.error(`  PubMed search failed "${query}":`, err);
    }
  }

  const batchSize = 100;
  for (let i = 0; i < allPmids.length; i += batchSize) {
    const batch = allPmids.slice(i, i + batchSize);
    try {
      const summaries = await esummary("pubmed", batch);
      const abstracts = await efetchPubMedAbstracts(batch);

      for (const pmid of batch) {
        const item = summaries[pmid];
        if (!item) continue;

        records.push({
          pmid,
          title: String(item.title ?? "Untitled"),
          authors: parseAuthors(item),
          journal: String(item.fulljournalname ?? item.source ?? "Unknown"),
          year: parseYear(item),
          abstract: abstracts.get(pmid),
          doi: parseDoi(item),
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          source: "pubmed",
          ingestedAt: now,
        });
      }
    } catch (err) {
      console.error(`  PubMed summary batch failed:`, err);
    }
  }

  return records;
}
