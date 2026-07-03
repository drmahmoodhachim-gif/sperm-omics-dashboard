import { gunzipSync } from "zlib";
import type { MatrixSample, ParsedSeriesMatrix } from "./parse-series-matrix";
import { toHttps, unquoteGeoCell } from "./geo-utils";

const MAX_SAMPLE_FILES = 48;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const SAMPLE_LINE = /^!Sample_supplementary_file\t/i;
const GSM_LINE = /^!Sample_geo_accession\t/i;

export interface SampleSupplement {
  sampleId: string;
  url: string;
  name: string;
}

export function extractSampleSupplements(text: string): SampleSupplement[] {
  let gsmIds: string[] = [];
  const fileRows: string[][] = [];

  for (const line of text.split(/\r?\n/)) {
    if (GSM_LINE.test(line)) {
      gsmIds = line
        .split("\t")
        .slice(1)
        .map((c) => unquoteGeoCell(c))
        .filter(Boolean);
    } else if (SAMPLE_LINE.test(line)) {
      fileRows.push(
        line
          .split("\t")
          .slice(1)
          .map((c) => unquoteGeoCell(c))
          .filter((u) => u.startsWith("ftp://") || u.startsWith("http"))
      );
    }
  }

  const out: SampleSupplement[] = [];
  for (const row of fileRows) {
    row.forEach((url, i) => {
      const name = url.split("/").pop() ?? url;
      const lower = name.toLowerCase();
      if (
        !/count|fpkm|tpm|rpkm|expr|signal|tab|\.txt|\.tsv|\.csv/.test(lower) ||
        /\.(bam|sam|fastq|bw|bigwig|bed\.gz)$/.test(lower)
      ) {
        return;
      }
      out.push({
        sampleId: gsmIds[i] ?? `Sample_${i + 1}`,
        url: toHttps(url),
        name,
      });
    });
  }

  return out.slice(0, MAX_SAMPLE_FILES);
}

function parseSingleSampleCounts(text: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith("#")) continue;
    const parts = line.includes("\t") ? line.split("\t") : line.split(",");
    if (parts.length < 2) continue;
    const gene = parts[0].replace(/^"|"$/g, "").trim();
    const val = parseFloat(parts[parts.length - 1].replace(/^"|"$/g, "").replace(/,/g, ""));
    if (gene && !Number.isNaN(val)) map.set(gene, val);
  }
  return map;
}

async function downloadSampleCounts(url: string, name: string): Promise<Map<string, number> | null> {
  const res = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_FILE_BYTES) return null;

  const text = name.endsWith(".gz")
    ? gunzipSync(buf).toString("utf-8")
    : buf.toString("utf-8");

  const map = parseSingleSampleCounts(text);
  return map.size >= 10 ? map : null;
}

export async function aggregateSampleCountFiles(
  samples: SampleSupplement[],
  accession: string,
  metaSamples?: MatrixSample[]
): Promise<ParsedSeriesMatrix> {
  const loaded: MatrixSample[] = [];
  const geneSets = new Map<string, Map<string, number>>();

  for (const s of samples) {
    const counts = await downloadSampleCounts(s.url, s.name);
    if (!counts) continue;
    const meta = metaSamples?.find((m) => m.id === s.sampleId);
    loaded.push({
      id: s.sampleId,
      title: meta?.title ?? s.sampleId,
      characteristics: meta?.characteristics ?? [],
    });
    geneSets.set(s.sampleId, counts);
  }

  if (loaded.length < 2) {
    throw new Error("Could not parse enough per-sample count files");
  }

  const geneFreq = new Map<string, number>();
  for (const gs of geneSets.values()) {
    for (const g of gs.keys()) geneFreq.set(g, (geneFreq.get(g) ?? 0) + 1);
  }

  const minSamples = Math.ceil(loaded.length * 0.5);
  const genes = [...geneFreq.entries()]
    .filter(([, n]) => n >= minSamples)
    .map(([g]) => g)
    .slice(0, 4000);

  const values: Record<string, Record<string, number>> = {};
  for (const gene of genes) {
    const row: Record<string, number> = {};
    for (const sample of loaded) {
      const v = geneSets.get(sample.id)?.get(gene);
      if (v != null) row[sample.id] = v;
    }
    if (Object.keys(row).length >= 2) values[gene] = row;
  }

  const finalGenes = Object.keys(values);
  if (finalGenes.length < 10) {
    throw new Error("Merged per-sample matrix too sparse");
  }

  return {
    accession: accession.toUpperCase(),
    samples: loaded,
    genes: finalGenes,
    values,
    geneCount: finalGenes.length,
    sampleCount: loaded.length,
  };
}
