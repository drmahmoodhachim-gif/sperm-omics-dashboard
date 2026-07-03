import type { IngestRecord } from "./ingest-types";

const PRIDE_BASE = "https://www.ebi.ac.uk/pride/ws/archive/v3";

const KEYWORDS = [
  "spermatozoa",
  "sperm infertility",
  "male infertility proteomics",
  "testis proteome",
  "seminal plasma",
];

interface PrideProject {
  accession?: string;
  projectAccession?: string;
  title?: string;
  projectDescription?: string;
  sampleProcessingProtocol?: string;
  organism?: string;
  organisms?: string[];
  instrument?: string;
  instruments?: string[];
  publicationDate?: string;
  doi?: string;
  pubmedAccessions?: string[];
}

function inferOmics(desc: string): string {
  return "proteomics";
}

function inferSpecies(org: string): string {
  const o = org.toLowerCase();
  if (o.includes("mouse") || o.includes("10090")) return "mouse";
  if (o.includes("rat") || o.includes("10116")) return "rat";
  return "human";
}

function inferTissue(title: string, desc: string): string {
  const t = `${title} ${desc}`.toLowerCase();
  if (t.includes("spermatozo") || t.includes("sperm")) return "spermatozoa";
  if (t.includes("semen") || t.includes("seminal")) return "semen";
  if (t.includes("testis")) return "testis";
  if (t.includes("epididym")) return "epididymis";
  return "spermatozoa";
}

async function searchPride(
  keyword: string,
  pageSize = 25,
  page = 0
): Promise<PrideProject[]> {
  const params = new URLSearchParams({
    keyword,
    pageSize: String(pageSize),
    page: String(page),
    sortFields: "submission_date",
    sortDirection: "DESC",
  });

  const res = await fetch(`${PRIDE_BASE}/search/projects?${params}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok) throw new Error(`PRIDE search failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.content ?? data.projects ?? []);
}

export async function ingestPride(pagesPerKeyword = 2): Promise<IngestRecord[]> {
  const seen = new Set<string>();
  const records: IngestRecord[] = [];
  const now = new Date().toISOString();

  for (const keyword of KEYWORDS) {
    for (let page = 0; page < pagesPerKeyword; page++) {
      try {
        const projects = await searchPride(keyword, 25, page);
        if (projects.length === 0) break;

        for (const p of projects) {
          const accession = p.accession ?? p.projectAccession ?? "";
          if (!accession || seen.has(accession)) continue;
          seen.add(accession);

          const title = p.title ?? "Untitled PRIDE project";
          const summary = p.projectDescription ?? p.sampleProcessingProtocol ?? "";
          const organism = p.organism ?? p.organisms?.[0] ?? "Homo sapiens";

          records.push({
            accession,
            repository: "PRIDE",
            title,
            summary: summary.slice(0, 500),
            omicsType: inferOmics(summary),
            species: inferSpecies(String(organism)),
            tissue: inferTissue(title, summary),
            platform: p.instrument ?? p.instruments?.[0],
            pmid: p.pubmedAccessions?.[0],
            doi: p.doi,
            pubdate: p.publicationDate,
            url: `https://www.ebi.ac.uk/pride/archive/projects/${accession}`,
            source: "pride",
            ingestedAt: now,
          });
        }
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error(`  PRIDE query failed "${keyword}" page ${page}:`, err);
      }
    }
  }

  return records;
}
