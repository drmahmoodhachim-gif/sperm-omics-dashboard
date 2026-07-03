export type OmicsType =
  | "transcriptomics"
  | "proteomics"
  | "metabolomics"
  | "epigenomics"
  | "genomics"
  | "single_cell"
  | "microarray"
  | "semen_parameters"
  | "other";

export type Species = "human" | "mouse" | "rat" | "other";
export type Tissue =
  | "spermatozoa"
  | "semen"
  | "testis"
  | "epididymis"
  | "blood"
  | "other";

export type FigureType =
  | "volcano"
  | "heatmap"
  | "pca"
  | "bar"
  | "scatter"
  | "venn"
  | "pathway"
  | "table"
  | "other";

export interface Publication {
  id: string;
  pmid?: string;
  doi?: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  abstract?: string;
  keywords?: string[];
  url?: string;
  citationCount?: number;
}

export interface Dataset {
  id: string;
  publicationId?: string;
  accession: string;
  repository: string;
  title: string;
  omicsType: OmicsType;
  species: Species;
  tissue: Tissue;
  sampleCount?: number;
  platform?: string;
  phenotype?: string;
  summary?: string;
  url?: string;
}

export interface Method {
  id: string;
  name: string;
  category: string;
  description: string;
  protocol: string;
  software: string[];
  parameters?: Record<string, string | number>;
  references?: string[];
}

export interface Figure {
  id: string;
  publicationId?: string;
  datasetId?: string;
  methodId?: string;
  title: string;
  figureType: FigureType;
  caption?: string;
  config?: Record<string, unknown>;
  data?: Record<string, unknown>;
  isPublicationReady: boolean;
}

export interface Measurement {
  id: string;
  datasetId: string;
  featureName: string;
  featureType?: string;
  groupA: string;
  groupB: string;
  valueA?: number;
  valueB?: number;
  foldChange?: number;
  pValue?: number;
  adjPValue?: number;
  unit?: string;
}

export interface DashboardStats {
  totalPublications: number;
  totalDatasets: number;
  totalMethods: number;
  omicsBreakdown: { type: OmicsType; count: number }[];
  yearBreakdown: { year: number; count: number }[];
  tissueBreakdown: { tissue: Tissue; count: number }[];
}
