import { runFullIngest } from "../src/lib/ingest/pipeline";
import { syncLibraryToSupabase } from "../src/lib/ingest/sync-supabase";
import { loadEnvFiles } from "../src/lib/ingest/load-env";

loadEnvFiles();

syncLibraryToSupabase()
  .then((ok) => process.exit(ok ? 0 : 1))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
