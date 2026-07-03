import type { Dataset, Publication } from "../types";
import {
  datasets as seedDatasets,
  figures,
  getDashboardStats as seedStats,
  getDatasetById,
  getFiguresForDataset,
  getMeasurementsForDataset,
  getMethodById,
  getPublicationById,
  getDatasetsForPublication,
  measurements,
  methods,
  publications as seedPublications,
} from "./seed";
import { isSupabaseConfigured } from "../supabase/client";
import {
  fetchDatasetsFromSupabase,
  fetchManifestFromSupabase,
  fetchPublicationsFromSupabase,
  fetchStatsFromSupabase,
  searchSupabase,
} from "../supabase/queries";

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

export interface MergedLibrary {
  publications: Publication[];
  datasets: Dataset[];
}

let cachedMerged: MergedLibrary | null = null;
let cachedManifest: IngestManifest | null = null;

async function loadMergedFromDisk(): Promise<MergedLibrary | null> {
  if (typeof window !== "undefined") return null;
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const file = path.join(process.cwd(), "data", "library-merged.json");
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as MergedLibrary;
  } catch {
    return null;
  }
}

async function loadManifestFromDisk(): Promise<IngestManifest | null> {
  if (typeof window !== "undefined") return null;
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const file = path.join(process.cwd(), "data", "ingest-manifest.json");
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as IngestManifest;
  } catch {
    return null;
  }
}

/** Full library — prefer disk/seed; use paginated APIs for large Supabase datasets. */
export async function getLibrary(): Promise<MergedLibrary> {
  if (cachedMerged) return cachedMerged;
  const merged = await loadMergedFromDisk();
  if (merged) {
    cachedMerged = merged;
    return merged;
  }
  return { publications: seedPublications, datasets: seedDatasets };
}

export async function getPublicationsPage(opts?: {
  limit?: number;
  offset?: number;
  search?: string;
}) {
  if (isSupabaseConfigured()) {
    const result = await fetchPublicationsFromSupabase(opts);
    if (result) return result;
  }
  const lib = await getLibrary();
  let rows = lib.publications;
  if (opts?.search) {
    const q = opts.search.toLowerCase();
    rows = rows.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.authors.toLowerCase().includes(q)
    );
  }
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? 50;
  return { rows: rows.slice(offset, offset + limit), total: rows.length };
}

export async function getDatasetsPage(opts?: {
  limit?: number;
  offset?: number;
  search?: string;
  omicsType?: string;
  tissue?: string;
}) {
  if (isSupabaseConfigured()) {
    const result = await fetchDatasetsFromSupabase(opts);
    if (result) return result;
  }
  const lib = await getLibrary();
  let rows = lib.datasets;
  if (opts?.search) {
    const q = opts.search.toLowerCase();
    rows = rows.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.accession.toLowerCase().includes(q)
    );
  }
  if (opts?.omicsType) rows = rows.filter((d) => d.omicsType === opts.omicsType);
  if (opts?.tissue) rows = rows.filter((d) => d.tissue === opts.tissue);
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? 50;
  return { rows: rows.slice(offset, offset + limit), total: rows.length };
}

export async function getIngestManifest(): Promise<IngestManifest | null> {
  if (cachedManifest) return cachedManifest;

  const fromDb = await fetchManifestFromSupabase();
  if (fromDb) {
    cachedManifest = fromDb as IngestManifest;
    return cachedManifest;
  }

  cachedManifest = await loadManifestFromDisk();
  return cachedManifest;
}

export function getMethods() {
  return methods;
}

export function getFigures() {
  return figures;
}

export function getMeasurements() {
  return measurements;
}

export async function getDashboardStatsAsync() {
  if (isSupabaseConfigured()) {
    const stats = await fetchStatsFromSupabase();
    if (stats) return stats as Awaited<ReturnType<typeof seedStats>> & {
      totalMethods: number;
      totalFigures: number;
    };
  }

  const lib = await getLibrary();
  const omicsCounts = lib.datasets.reduce(
    (acc, d) => {
      acc[d.omicsType] = (acc[d.omicsType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const yearCounts = lib.publications.reduce(
    (acc, p) => {
      acc[p.year] = (acc[p.year] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  const tissueCounts = lib.datasets.reduce(
    (acc, d) => {
      acc[d.tissue] = (acc[d.tissue] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalPublications: lib.publications.length,
    totalDatasets: lib.datasets.length,
    totalMethods: methods.length,
    totalFigures: figures.length,
    omicsBreakdown: Object.entries(omicsCounts).map(([type, count]) => ({
      type: type as Dataset["omicsType"],
      count,
    })),
    yearBreakdown: Object.entries(yearCounts)
      .map(([year, count]) => ({ year: Number(year), count }))
      .sort((a, b) => a.year - b.year),
    tissueBreakdown: Object.entries(tissueCounts).map(([tissue, count]) => ({
      tissue: tissue as Dataset["tissue"],
      count,
    })),
  };
}

export async function searchLibraryAsync(query: string) {
  if (isSupabaseConfigured()) {
    const result = await searchSupabase(query);
    if (result) {
      return {
        ...result,
        methods: methods.filter(
          (m) =>
            m.name.toLowerCase().includes(query.toLowerCase()) ||
            m.description.toLowerCase().includes(query.toLowerCase())
        ),
      };
    }
  }

  const lib = await getLibrary();
  const q = query.toLowerCase();
  return {
    publications: lib.publications.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.authors.toLowerCase().includes(q)
    ),
    datasets: lib.datasets.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.accession.toLowerCase().includes(q)
    ),
    methods: methods.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    ),
  };
}

export {
  getDatasetById,
  getFiguresForDataset,
  getMeasurementsForDataset,
  getMethodById,
  getPublicationById,
  getDatasetsForPublication,
  seedStats,
};
