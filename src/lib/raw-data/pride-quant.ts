import { parseQuantBuffer } from "./parse-quant-table";
import type { ParsedSeriesMatrix } from "./parse-series-matrix";
import type { RawFileLink } from "./geo-fetch";

interface PrideFile {
  fileName?: string;
  downloadLink?: string;
  fileCategory?: { value?: string };
  fileSizeBytes?: number;
}

export async function listPrideQuantFiles(accession: string): Promise<RawFileLink[]> {
  const acc = accession.toUpperCase();
  const files: RawFileLink[] = [
    {
      name: `${acc} on PRIDE`,
      url: `https://www.ebi.ac.uk/pride/archive/projects/${acc}`,
      type: "other",
      description: "PRIDE project archive",
    },
  ];

  try {
    const res = await fetch(
      `https://www.ebi.ac.uk/pride/ws/archive/v2/projects/${acc}/files?pageSize=200&page=0`,
      { signal: AbortSignal.timeout(45_000) }
    );
    if (!res.ok) return files;

    const json = (await res.json()) as PrideFile[];
    const ranked = json
      .filter((f) => f.fileName && f.downloadLink)
      .map((f) => {
        const name = f.fileName!.toLowerCase();
        const cat = (f.fileCategory?.value ?? "").toLowerCase();
        let score = 0;
        if (cat.includes("search")) score += 10;
        if (name.includes("protein") || name.includes("gene")) score += 5;
        if (name.endsWith(".tsv") || name.endsWith(".csv") || name.endsWith(".txt")) score += 8;
        if (name.includes("quant")) score += 6;
        if (name.includes(".mzml") || name.includes(".raw")) score -= 20;
        if ((f.fileSizeBytes ?? 0) > 30_000_000) score -= 15;
        return { f, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    for (const { f } of ranked.slice(0, 15)) {
      const cat = f.fileCategory?.value ?? "archive";
      const analyzable =
        f.fileName!.match(/\.(tsv|csv|txt|gz)$/i) &&
        !(f.fileSizeBytes && f.fileSizeBytes > 25_000_000);
      files.push({
        name: f.fileName!,
        url: f.downloadLink!,
        type: analyzable ? "processed" : "raw_ms",
        description: analyzable
          ? `PRIDE quantification table (${cat}) — import for DE analysis`
          : `PRIDE ${cat} file`,
      });
    }
  } catch {
    // optional
  }

  return files;
}

export async function fetchPrideQuantMatrix(
  accession: string,
  fileUrl?: string
): Promise<ParsedSeriesMatrix> {
  const acc = accession.toUpperCase();
  const files = await listPrideQuantFiles(acc);
  const quant =
    fileUrl ??
    files.find((f) => f.type === "processed")?.url;

  if (!quant) {
    throw new Error(
      "No protein quantification table found. Download SEARCH results from PRIDE and use local DESeq2/counts pipeline for raw MS."
    );
  }

  const res = await fetch(quant, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`PRIDE file download failed (${res.status})`);

  const buf = Buffer.from(await res.arrayBuffer());
  const name = quant.split("/").pop()?.split("?")[0] ?? "quant.tsv";
  return parseQuantBuffer(buf, acc, name);
}
