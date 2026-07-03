/** Dedicated schema — isolated from all other Supabase projects/tables. */
export const SUPABASE_SCHEMA =
  process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "sperm_omics";

export const TABLES = {
  publications: "publications",
  datasets: "datasets",
  methods: "methods",
  figures: "figures",
  measurements: "measurements",
  ingestManifest: "ingest_manifest",
} as const;

export const RPC = {
  dashboardStats: "dashboard_stats",
} as const;
