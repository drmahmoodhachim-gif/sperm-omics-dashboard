import { runFullIngest } from "../src/lib/ingest/pipeline";

runFullIngest().catch((err) => {
  console.error(err);
  process.exit(1);
});
