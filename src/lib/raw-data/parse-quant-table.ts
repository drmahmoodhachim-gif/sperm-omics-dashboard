import { gunzipSync } from "zlib";
import type { MatrixSample, ParsedSeriesMatrix } from "./parse-series-matrix";

import { accessionKind } from "./accession";

const MAX_GENES = 4000;
const MAX_SAMPLES = 120;

export function parseQuantTableText(
  text: string,
  accession: string,
  opts?: { sampleIds?: string[]; hasHeader?: boolean }
): ParsedSeriesMatrix {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
  if (lines.length < 2) throw new Error("Quant table too small");

  const delimiter = lines[0].includes("\t") ? "\t" : lines[0].includes(",") ? "," : "\t";
  const rows = lines.map((l) => splitDelimited(l, delimiter));

  let header = rows[0];
  let dataStart = 1;

  const firstCell = header[0]?.toLowerCase().replace(/^"|"$/g, "") ?? "";
  const secondCell = cleanCell(header[1] ?? "");
  const looksLikeHeader =
    opts?.hasHeader !== false &&
    (firstCell.includes("gene") ||
      firstCell.includes("protein") ||
      firstCell.includes("id") ||
      firstCell.includes("feature") ||
      firstCell === "" ||
      (secondCell !== "" && isNaN(Number(secondCell))));

  if (!looksLikeHeader) {
    header = rows[0].map((_, i) => (i === 0 ? "feature" : `Sample_${i}`));
    dataStart = 0;
  }

  const sampleIds = header.slice(1).map((h, i) => cleanCell(h) || `Sample_${i + 1}`);
  const cappedIds = sampleIds.slice(0, MAX_SAMPLES);
  const idSet = new Set(cappedIds);

  const samples: MatrixSample[] = cappedIds.map((id) => ({
    id,
    title: id,
    characteristics: [],
  }));

  const genes: string[] = [];
  const values: Record<string, Record<string, number>> = {};

  for (let r = dataStart; r < rows.length && genes.length < MAX_GENES; r++) {
    const row = rows[r];
    const feature = cleanCell(row[0] ?? "");
    if (!feature) continue;

    const rowVals: Record<string, number> = {};
    for (let c = 1; c < row.length && c <= cappedIds.length; c++) {
      const sid = cappedIds[c - 1];
      if (!idSet.has(sid)) continue;
      const v = parseFloat(cleanCell(row[c] ?? "").replace(/,/g, ""));
      if (!Number.isNaN(v)) rowVals[sid] = v;
    }
    if (Object.keys(rowVals).length >= 2) {
      genes.push(feature);
      values[feature] = rowVals;
    }
  }

  if (genes.length === 0) throw new Error("No numeric quantification rows parsed");

  return {
    accession: accession.toUpperCase(),
    samples,
    genes,
    values,
    geneCount: rows.length - dataStart,
    sampleCount: cappedIds.length,
  };
}

export function parseQuantBuffer(
  buffer: Buffer,
  accession: string,
  filename: string
): ParsedSeriesMatrix {
  let text: string;
  if (filename.endsWith(".gz")) {
    text = gunzipSync(buffer).toString("utf-8");
  } else {
    text = buffer.toString("utf-8");
  }
  return parseQuantTableText(text, accession);
}

function cleanCell(s: string): string {
  return s.replace(/^"|"$/g, "").trim();
}

function splitDelimited(line: string, delim: string): string[] {
  if (delim !== ",") return line.split(delim);

  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export { accessionKind };
