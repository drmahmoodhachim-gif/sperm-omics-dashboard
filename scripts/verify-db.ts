import { loadEnvFiles } from "../src/lib/ingest/load-env";
import { getSupabaseAnon, getSupabaseSchema } from "../src/lib/supabase/client";
import { TABLES } from "../src/lib/supabase/config";

loadEnvFiles();

async function main() {
  const schema = getSupabaseSchema();
  const sb = getSupabaseAnon();

  if (!sb) {
    console.error("Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and ANON_KEY in .env.local");
    process.exit(1);
  }

  console.log(`SpermOmics DB verification`);
  console.log(`Schema: ${schema} (isolated from other projects)\n`);

  const [pubs, datasets, manifest] = await Promise.all([
    sb.from(TABLES.publications).select("*", { count: "exact", head: true }),
    sb.from(TABLES.datasets).select("*", { count: "exact", head: true }),
    sb.from(TABLES.ingestManifest).select("last_run, counts").eq("id", 1).maybeSingle(),
  ]);

  if (pubs.error) {
    console.error("Publications table error:", pubs.error.message);
    console.error("\nDid you run supabase/migrations/001_sperm_omics_standalone.sql ?");
    process.exit(1);
  }

  console.log(`✓ publications: ${pubs.count ?? 0} rows`);
  console.log(`✓ datasets:    ${datasets.count ?? 0} rows`);

  if (manifest.data) {
    console.log(`✓ last ingest: ${manifest.data.last_run}`);
  } else {
    console.log(`  last ingest: not synced yet — run npm run sync:supabase`);
  }

  console.log("\nStandalone DB is ready.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
