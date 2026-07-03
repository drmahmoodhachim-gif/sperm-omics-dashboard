import { NextResponse } from "next/server";
import {
  supportsInlineAnalysis,
  sourceLabel,
  accessionKind,
} from "@/lib/raw-data/fetch-matrix";
import { listArrayExpressFiles } from "@/lib/raw-data/arrayexpress-fetch";
import { listPrideQuantFiles } from "@/lib/raw-data/pride-quant";
import { listRawFiles } from "@/lib/raw-data/geo-fetch";
import { isGeoAccession } from "@/lib/raw-data/geo-path";

interface RawFileEntry {
  name: string;
  url: string;
  type: string;
  description: string;
  analyzable?: boolean;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accession: string }> }
) {
  const { accession } = await params;
  const acc = decodeURIComponent(accession).toUpperCase();
  const kind = accessionKind(acc);

  let files: RawFileEntry[] = [];
  if (kind === "geo" && isGeoAccession(acc)) {
    files = (await listRawFiles(acc)).map((f) => ({
      ...f,
      analyzable: f.analyzable ?? (f.type === "expression_matrix" || f.type === "processed"),
    }));
  } else if (kind === "arrayexpress") {
    files = (await listArrayExpressFiles(acc)).map((f) => ({
      ...f,
      analyzable: f.type === "expression_matrix",
    }));
  } else if (kind === "pride") {
    files = (await listPrideQuantFiles(acc)).map((f) => ({
      ...f,
      analyzable: f.type === "processed",
    }));
  }

  return NextResponse.json({
    accession: acc,
    source: sourceLabel(acc),
    kind,
    supportsInlineAnalysis: supportsInlineAnalysis(acc),
    files,
  });
}
