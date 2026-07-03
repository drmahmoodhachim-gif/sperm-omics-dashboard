/**
 * Run local DESeq2 pipeline (requires R + DESeq2).
 * npm run analyze:deseq2 -- counts.csv groups.csv output/
 */
import { spawnSync } from "child_process";
import { existsSync } from "fs";
import path from "path";

const [counts, groups, outDir = "data/deseq2-output"] = process.argv.slice(2);

if (!counts || !groups) {
  console.error("Usage: npm run analyze:deseq2 -- <counts.csv> <sample_groups.csv> [output_dir]");
  process.exit(1);
}

const rScript = path.join(process.cwd(), "scripts/deseq2/analyze.R");
if (!existsSync(rScript)) {
  console.error("Missing", rScript);
  process.exit(1);
}

const r = spawnSync("Rscript", [rScript, counts, groups, outDir], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(r.status ?? 1);
