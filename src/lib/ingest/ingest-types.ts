export interface IngestRecord {
  accession: string;
  repository: string;
  title: string;
  summary?: string;
  omicsType: string;
  species?: string;
  tissue?: string;
  sampleCount?: number;
  platform?: string;
  phenotype?: string;
  url?: string;
  pmid?: string;
  doi?: string;
  pubdate?: string;
  source: "geo" | "pride" | "pubmed" | "spermd";
  ingestedAt: string;
}

export interface PubMedRecord {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  abstract?: string;
  doi?: string;
  keywords?: string[];
  url: string;
  source: "pubmed";
  ingestedAt: string;
}

export interface IngestManifest {
  lastRun: string;
  duration_ms: number;
  counts: {
    geo: number;
    pride: number;
    pubmed: number;
    spermd: number;
    total_datasets: number;
    total_publications: number;
  };
  errors: string[];
  schedule?: string;
}

export interface IngestResult {
  datasets: IngestRecord[];
  publications: PubMedRecord[];
  manifest: IngestManifest;
}
