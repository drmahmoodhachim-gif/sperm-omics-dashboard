import type { Dataset, OmicsType, Publication, Species, Tissue } from "@/lib/types";
import type { IngestRecord, PubMedRecord } from "./ingest-types";
import {
  datasets as seedDatasets,
  publications as seedPublications,
} from "@/lib/data/seed";
import { sanitizeAccession, sanitizeDatasetText } from "@/lib/utils/sanitize-text";

function slugId(prefix: string, accession: string): string {
  return `${prefix}-${accession.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
}

function toOmicsType(v: string): OmicsType {
  const allowed: OmicsType[] = [
    "transcriptomics", "proteomics", "metabolomics", "epigenomics",
    "genomics", "single_cell", "microarray", "semen_parameters", "other",
  ];
  return allowed.includes(v as OmicsType) ? (v as OmicsType) : "other";
}

function toSpecies(v?: string): Species {
  if (v === "mouse" || v === "rat") return v;
  if (v === "human") return "human";
  return "other";
}

function toTissue(v?: string): Tissue {
  const allowed: Tissue[] = ["spermatozoa", "semen", "testis", "epididymis", "blood", "other"];
  return allowed.includes(v as Tissue) ? (v as Tissue) : "other";
}

function ingestToDataset(r: IngestRecord): Dataset {
  const title = sanitizeDatasetText(r.title) ?? r.title;
  const summary = sanitizeDatasetText(r.summary);
  const accession = sanitizeAccession(r.accession, `${title} ${summary ?? ""}`);

  return {
    id: slugId("ing", accession),
    publicationId: r.pmid ? slugId("ing-pub", r.pmid) : undefined,
    accession,
    repository: r.repository,
    title,
    omicsType: toOmicsType(r.omicsType),
    species: toSpecies(r.species),
    tissue: toTissue(r.tissue),
    sampleCount: r.sampleCount,
    platform: sanitizeDatasetText(r.platform),
    phenotype: sanitizeDatasetText(r.phenotype),
    summary,
    url: r.url,
  };
}

function pubmedToPublication(r: PubMedRecord): Publication {
  return {
    id: slugId("ing-pub", r.pmid),
    pmid: r.pmid,
    doi: r.doi,
    title: r.title,
    authors: r.authors,
    journal: r.journal,
    year: r.year,
    abstract: r.abstract,
    keywords: r.doi ? undefined : ["male infertility", "omics"],
    url: r.url,
  };
}

export function mergeIngestedLibrary(
  ingestedDatasets: IngestRecord[],
  ingestedPubs: PubMedRecord[]
) {
  const pubMap = new Map<string, Publication>();
  const dsMap = new Map<string, Dataset>();

  for (const p of seedPublications) pubMap.set(p.id, p);
  for (const d of seedDatasets) dsMap.set(d.accession, d);

  for (const p of ingestedPubs) {
    const pub = pubmedToPublication(p);
    if (!pubMap.has(pub.id)) pubMap.set(pub.id, pub);
  }

  for (const d of ingestedDatasets) {
    if (!dsMap.has(d.accession)) dsMap.set(d.accession, ingestToDataset(d));
  }

  return {
    publications: Array.from(pubMap.values()).sort((a, b) => b.year - a.year),
    datasets: Array.from(dsMap.values()).sort((a, b) =>
      a.accession.localeCompare(b.accession)
    ),
  };
}
