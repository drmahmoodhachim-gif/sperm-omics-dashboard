import type { Dataset, OmicsType, Publication, Species, Tissue } from "@/lib/types";
import { getSupabaseAnon } from "./client";
import { RPC, TABLES } from "./config";
import {
  sanitizeAccession,
  sanitizeDatasetText,
  isWordXmlGarbage,
  stripWordXml,
  extractAccession,
} from "@/lib/utils/sanitize-text";

const CACHE_MS = 60_000;
let statsCache: { data: unknown; at: number } | null = null;

interface DbPublication {
  id: string;
  external_id: string | null;
  pmid: string | null;
  doi: string | null;
  title: string;
  authors: string | null;
  journal: string | null;
  year: number | null;
  abstract: string | null;
  keywords: string[] | null;
  url: string | null;
  citation_count: number | null;
}

interface DbDataset {
  id: string;
  external_id: string | null;
  publication_id: string | null;
  accession: string;
  repository: string;
  title: string;
  omics_type: string;
  species: string | null;
  tissue: string | null;
  sample_count: number | null;
  platform: string | null;
  phenotype: string | null;
  summary: string | null;
  url: string | null;
}

function mapPublication(row: DbPublication): Publication {
  return {
    id: row.external_id ?? row.id,
    pmid: row.pmid ?? undefined,
    doi: row.doi ?? undefined,
    title: row.title,
    authors: row.authors ?? "Unknown",
    journal: row.journal ?? "Unknown",
    year: row.year ?? 0,
    abstract: row.abstract ?? undefined,
    keywords: row.keywords ?? undefined,
    url: row.url ?? undefined,
    citationCount: row.citation_count ?? undefined,
  };
}

function mapDataset(row: DbDataset): Dataset {
  const accessionRaw = row.accession ?? "";
  const titleRaw = row.title ?? "";
  const summary = sanitizeDatasetText(row.summary);

  let title = sanitizeDatasetText(titleRaw) ?? titleRaw;
  const accession = sanitizeAccession(accessionRaw, `${titleRaw} ${summary ?? ""}`);

  // Bad docx parse: accession column sometimes holds title prose inside Word XML
  if (accession === "—" && isWordXmlGarbage(accessionRaw)) {
    const prose = stripWordXml(accessionRaw);
    if (prose.length > 5 && !extractAccession(prose)) {
      if (!title || isWordXmlGarbage(titleRaw) || title.length < prose.length) {
        title = prose;
      }
    }
  }

  if (isWordXmlGarbage(title)) {
    title = stripWordXml(titleRaw) || title;
  }

  return {
    id: row.external_id ?? row.id,
    publicationId: row.publication_id ?? undefined,
    accession,
    repository: row.repository,
    title,
    omicsType: row.omics_type as OmicsType,
    species: (row.species ?? "human") as Species,
    tissue: (row.tissue ?? "other") as Tissue,
    sampleCount: row.sample_count ?? undefined,
    platform: sanitizeDatasetText(row.platform),
    phenotype: sanitizeDatasetText(row.phenotype),
    summary,
    url: row.url ?? undefined,
  };
}

export async function fetchStatsFromSupabase() {
  const sb = getSupabaseAnon();
  if (!sb) return null;

  if (statsCache && Date.now() - statsCache.at < CACHE_MS) {
    return statsCache.data;
  }

  const { data, error } = await sb.rpc(RPC.dashboardStats);
  if (error) {
    console.warn("Supabase stats RPC failed:", error.message);
    return null;
  }

  const enriched = {
    ...(data as Record<string, unknown>),
    totalMethods: 6,
    totalFigures: 5,
  };
  statsCache = { data: enriched, at: Date.now() };
  return enriched;
}

export async function fetchPublicationsFromSupabase(opts?: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<{ rows: Publication[]; total: number } | null> {
  const sb = getSupabaseAnon();
  if (!sb) return null;

  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  let query = sb
    .from(TABLES.publications)
    .select("*", { count: "exact" })
    .order("year", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts?.search) {
    query = query.or(
      `title.ilike.%${opts.search}%,authors.ilike.%${opts.search}%,pmid.ilike.%${opts.search}%`
    );
  }

  const { data, error, count } = await query;
  if (error) {
    console.warn("Supabase publications query failed:", error.message);
    return null;
  }

  return {
    rows: (data as DbPublication[]).map(mapPublication),
    total: count ?? 0,
  };
}

export async function fetchDatasetsFromSupabase(opts?: {
  limit?: number;
  offset?: number;
  search?: string;
  omicsType?: string;
  tissue?: string;
}): Promise<{ rows: Dataset[]; total: number } | null> {
  const sb = getSupabaseAnon();
  if (!sb) return null;

  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  let query = sb
    .from(TABLES.datasets)
    .select("*", { count: "exact" })
    .order("accession", { ascending: true })
    .range(offset, offset + limit - 1);

  if (opts?.search) {
    query = query.or(
      `title.ilike.%${opts.search}%,accession.ilike.%${opts.search}%,phenotype.ilike.%${opts.search}%`
    );
  }
  if (opts?.omicsType) query = query.eq("omics_type", opts.omicsType);
  if (opts?.tissue) query = query.eq("tissue", opts.tissue);

  const { data, error, count } = await query;
  if (error) {
    console.warn("Supabase datasets query failed:", error.message);
    return null;
  }

  return {
    rows: (data as DbDataset[]).map(mapDataset),
    total: count ?? 0,
  };
}

export async function fetchManifestFromSupabase() {
  const sb = getSupabaseAnon();
  if (!sb) return null;
  const { data, error } = await sb
    .from(TABLES.ingestManifest)
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    lastRun: data.last_run as string,
    duration_ms: data.duration_ms as number,
    counts: data.counts as Record<string, number>,
    errors: (data.errors as string[]) ?? [],
    schedule: data.schedule as string | undefined,
  };
}

export async function searchSupabase(query: string, limit = 20) {
  const sb = getSupabaseAnon();
  if (!sb) return null;
  const q = query.trim();
  if (q.length < 2) return { publications: [], datasets: [] };

  const [pubs, dss] = await Promise.all([
    sb
      .from(TABLES.publications)
      .select("*")
      .or(`title.ilike.%${q}%,authors.ilike.%${q}%`)
      .limit(limit),
    sb
      .from(TABLES.datasets)
      .select("*")
      .or(`title.ilike.%${q}%,accession.ilike.%${q}%`)
      .limit(limit),
  ]);

  return {
    publications: ((pubs.data ?? []) as DbPublication[]).map(mapPublication),
    datasets: ((dss.data ?? []) as DbDataset[]).map(mapDataset),
  };
}
