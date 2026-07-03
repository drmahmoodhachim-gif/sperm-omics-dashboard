import { createGunzip } from "zlib";
import { Readable } from "stream";
import readline from "readline";
import { parseSeriesMatrixText, type ParsedSeriesMatrix } from "./parse-series-matrix";

const MAX_GENES = 3000;
const LARGE_MATRIX_BYTES = 12 * 1024 * 1024;

export interface StreamMatrixResult {
  matrix: ParsedSeriesMatrix | null;
  metaText: string;
  hasTable: boolean;
}

export async function streamGeoSeriesMatrix(
  url: string,
  accession: string
): Promise<StreamMatrixResult> {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok || !res.body) {
    return { matrix: null, metaText: "", hasTable: false };
  }

  const metaLines: string[] = [];
  const tableLines: string[] = [];
  let inTable = false;
  let tableDataRows = 0;

  const rl = readline.createInterface({
    input: Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]).pipe(
      createGunzip()
    ),
    crlfDelay: Infinity,
  });

  try {
    for await (const line of rl) {
      if (/series_matrix_table_begin/i.test(line)) {
        inTable = true;
        tableLines.push(line);
        continue;
      }
      if (/series_matrix_table_end/i.test(line)) {
        tableLines.push(line);
        break;
      }
      if (inTable) {
        tableLines.push(line);
        if (line.trim()) {
          tableDataRows++;
          if (tableDataRows > MAX_GENES + 1) {
            tableLines.push("!series_matrix_table_end");
            break;
          }
        }
      } else {
        metaLines.push(line);
      }
    }
  } finally {
    rl.close();
  }

  const metaText = metaLines.join("\n");
  if (tableDataRows < 2) {
    return { matrix: null, metaText, hasTable: false };
  }

  try {
    const matrix = parseSeriesMatrixText([...metaLines, ...tableLines].join("\n"), accession);
    return { matrix, metaText, hasTable: true };
  } catch {
    return { matrix: null, metaText, hasTable: true };
  }
}

export function isLargeMatrix(contentLength: number): boolean {
  return contentLength > LARGE_MATRIX_BYTES;
}

export async function headContentLength(url: string): Promise<number> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(15_000) });
    return Number(res.headers.get("content-length") ?? 0);
  } catch {
    return 0;
  }
}
