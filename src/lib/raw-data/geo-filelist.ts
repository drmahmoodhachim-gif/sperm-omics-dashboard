import { geoGsmSupplFileUrl, geoSupplFileUrl } from "./geo-path";
import type { SampleSupplement } from "./geo-sample-counts";
import { scoreQuantFilename } from "./geo-supplementary";

const QUANT_FILE =
  /^File\s+(GSM\d+_[^\s]+\.(?:txt|tsv|csv)(?:\.gz)?)\s+/i;

/** Parse GEO suppl/filelist.txt entries (files inside RAW.tar or on FTP). */
export function parseGeoFilelistText(text: string): { name: string; gsmId: string }[] {
  const out: { name: string; gsmId: string }[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(QUANT_FILE);
    if (!m) continue;
    const name = m[1];
    const gsmMatch = name.match(/^(GSM\d+)_/i);
    if (!gsmMatch) continue;
    const lower = name.toLowerCase();
    if (/\.(fastq|fq|bam|sam|cram|idat)(\.gz)?$/i.test(lower)) continue;
    if (!/\.(txt|tsv|csv)(\.gz)?$/i.test(lower)) continue;
    if (scoreQuantFilename(name) < 8) continue;
    out.push({ name, gsmId: gsmMatch[1].toUpperCase() });
  }
  return out;
}

export function filelistEntriesToSupplements(
  entries: { name: string; gsmId: string }[]
): SampleSupplement[] {
  return entries
    .map(({ name, gsmId }) => {
      const url = geoGsmSupplFileUrl(gsmId, name);
      if (!url) return null;
      return { sampleId: gsmId, url, name };
    })
    .filter((s): s is SampleSupplement => s !== null);
}

export async function fetchGeoFilelistSamples(
  accession: string
): Promise<SampleSupplement[]> {
  const acc = accession.toUpperCase();
  const filelistUrl = geoSupplFileUrl(acc, "filelist.txt");
  if (!filelistUrl) return [];

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(filelistUrl, { signal: AbortSignal.timeout(25_000) });
      if (!res.ok) {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
          continue;
        }
        return [];
      }
      const text = await res.text();
      const entries = parseGeoFilelistText(text);
      return filelistEntriesToSupplements(entries);
    } catch {
      if (attempt === 2) return [];
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  return [];
}

/** Marker URL — matrix fetch merges all filelist.txt per-sample quant files. */
export function geoFilelistMergeUrl(accession: string): string {
  return `geo-filelist-merge://${accession.toUpperCase()}`;
}

export function isGeoFilelistMergeUrl(url: string): boolean {
  return url.startsWith("geo-filelist-merge://");
}

export function accessionFromFilelistMergeUrl(url: string): string | null {
  const m = url.match(/^geo-filelist-merge:\/\/(GSE\d+)$/i);
  return m ? m[1].toUpperCase() : null;
}
