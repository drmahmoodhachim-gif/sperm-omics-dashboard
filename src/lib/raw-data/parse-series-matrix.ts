import { gunzipSync } from "zlib";

export interface MatrixSample {
  id: string;
  title: string;
  characteristics: string[];
}

export interface ParsedSeriesMatrix {
  accession: string;
  samples: MatrixSample[];
  genes: string[];
  /** gene → sampleId → expression value */
  values: Record<string, Record<string, number>>;
  geneCount: number;
  sampleCount: number;
}

const MAX_GENES = 3000;
const MAX_SAMPLES = 120;

export function parseSeriesMatrixGz(buffer: Buffer, accession: string): ParsedSeriesMatrix {
  const text = gunzipSync(buffer).toString("utf-8");
  return parseSeriesMatrixText(text, accession);
}

export function parseSeriesMatrixText(text: string, accession: string): ParsedSeriesMatrix {
  const lines = text.split(/\r?\n/);
  const sampleTitles: string[] = [];
  const sampleChars: string[][] = [];
  let inTable = false;
  const tableRows: string[][] = [];

  for (const line of lines) {
    if (line.startsWith("!Sample_title")) {
      sampleTitles.push(unquote(line.split("\t").slice(1).join("\t")));
    } else if (line.startsWith("!Sample_characteristics_ch1")) {
      sampleChars.push(
        line
          .split("\t")
          .slice(1)
          .map((c) => unquote(c))
          .filter(Boolean)
      );
    } else if (line.includes("series_matrix_table_begin")) {
      inTable = true;
      continue;
    } else if (line.includes("series_matrix_table_end")) {
      inTable = false;
      continue;
    } else if (inTable && line.trim()) {
      tableRows.push(splitTsvLine(line));
    }
  }

  if (tableRows.length < 2) {
    throw new Error("No expression table found in series matrix");
  }

  const header = tableRows[0];
  const sampleIds = header.slice(1).map(unquote);
  const samples: MatrixSample[] = sampleIds.map((id, i) => ({
    id,
    title: sampleTitles[i] ?? id,
    characteristics: sampleChars[i] ?? [],
  }));

  const cappedSamples = samples.slice(0, MAX_SAMPLES);
  const sampleIdSet = new Set(cappedSamples.map((s) => s.id));

  const genes: string[] = [];
  const values: Record<string, Record<string, number>> = {};

  for (let r = 1; r < tableRows.length && genes.length < MAX_GENES; r++) {
    const row = tableRows[r];
    const gene = unquote(row[0] ?? "");
    if (!gene) continue;
    genes.push(gene);
    const rowVals: Record<string, number> = {};
    for (let c = 1; c < header.length; c++) {
      const sid = unquote(header[c] ?? "");
      if (!sampleIdSet.has(sid)) continue;
      const v = parseFloat(row[c] ?? "");
      if (!Number.isNaN(v)) rowVals[sid] = v;
    }
    values[gene] = rowVals;
  }

  return {
    accession: accession.toUpperCase(),
    samples: cappedSamples,
    genes,
    values,
    geneCount: tableRows.length - 1,
    sampleCount: samples.length,
  };
}

function unquote(s: string): string {
  return s.replace(/^"|"$/g, "").trim();
}

function splitTsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQ = !inQ;
      cur += ch;
    } else if (ch === "\t" && !inQ) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}
