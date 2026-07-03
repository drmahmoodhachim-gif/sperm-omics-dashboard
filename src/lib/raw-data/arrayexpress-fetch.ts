import { parseQuantBuffer } from "./parse-quant-table";
import type { ParsedSeriesMatrix } from "./parse-series-matrix";
import type { RawFileLink } from "./geo-fetch";

export async function listArrayExpressFiles(accession: string): Promise<RawFileLink[]> {
  const acc = accession.toUpperCase();
  const files: RawFileLink[] = [
    {
      name: `${acc} on ArrayExpress`,
      url: `https://www.ebi.ac.uk/biostudies/arrayexpress/studies/${acc}`,
      type: "other",
      description: "BioStudies record — browse all processed files",
    },
  ];

  try {
    const res = await fetch(
      `https://www.ebi.ac.uk/biostudies/fire/studies/${acc}`,
      { signal: AbortSignal.timeout(30_000) }
    );
    if (res.ok) {
      const study = (await res.json()) as {
        section?: { subsections?: { accno?: string; type?: string; files?: { path?: string; size?: number }[] }[] }[];
      };
      const allFiles = (study.section ?? []).flatMap((s) =>
        (s.subsections ?? []).flatMap((sub) => sub.files ?? [])
      );
      for (const f of allFiles) {
        if (!f.path) continue;
        const name = f.path.split("/").pop() ?? f.path;
        const lower = name.toLowerCase();
        const isMatrix =
          lower.includes("expression") ||
          lower.includes("matrix") ||
          lower.includes("normalized") ||
          lower.includes("counts") ||
          (lower.endsWith(".tsv") && !lower.includes("sample"));
        if (!isMatrix && !lower.endsWith(".txt") && !lower.endsWith(".csv")) continue;
        if ((f.size ?? 0) > 25_000_000) continue;

        files.push({
          name,
          url: `https://www.ebi.ac.uk/biostudies/fire/studies/${acc}/files/${encodeURIComponent(f.path)}`,
          type: "expression_matrix",
          description: `ArrayExpress processed file (${((f.size ?? 0) / 1024).toFixed(0)} KB) — ready for DE`,
        });
      }
    }
  } catch {
    // fallback atlas FTP pattern
    files.push({
      name: `${acc} processed data (FTP)`,
      url: `https://ftp.ebi.ac.uk/pub/databases/microarray/data/atlas/experiments/${acc}/`,
      type: "expression_matrix",
      description: "ArrayExpress Atlas FTP — expression matrices",
    });
  }

  return files;
}

export async function fetchArrayExpressMatrix(
  accession: string,
  fileUrl?: string
): Promise<ParsedSeriesMatrix> {
  const acc = accession.toUpperCase();
  const files = await listArrayExpressFiles(acc);
  const matrixFile =
    fileUrl ??
    files.find((f) => f.type === "expression_matrix")?.url;

  if (!matrixFile) {
    throw new Error("No expression matrix found for this ArrayExpress study");
  }

  const res = await fetch(matrixFile, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`ArrayExpress download failed (${res.status})`);

  const buf = Buffer.from(await res.arrayBuffer());
  const name = matrixFile.split("/").pop()?.split("?")[0] ?? "data.tsv";
  return parseQuantBuffer(buf, acc, name);
}
