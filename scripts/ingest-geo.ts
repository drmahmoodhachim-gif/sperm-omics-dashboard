import { runFullIngest } from "../src/lib/ingest/pipeline";

runFullIngest()
  .then((m) => process.exit(m.errors.length ? 1 : 0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
