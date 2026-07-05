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
import { classifyRawFileAvailability } from "@/lib/raw-data/local-only";

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

  const availability = classifyRawFileAvailability(files, acc);

  return NextResponse.json({
    accession: acc,
    source: sourceLabel(acc),
    kind,
    supportsInlineAnalysis: supportsInlineAnalysis(acc),
    localOnly: availability.localOnly,
    localOnlyReasons: availability.reasons,
    repositoryUrl: availability.repositoryUrl ?? studyRepositoryUrl(acc),
    files,
  });
}

function studyRepositoryUrl(acc: string): string | undefined {
  if (/^GSE/i.test(acc)) {
    return `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${acc}`;
  }
  if (/^PXD/i.test(acc)) {
    return `https://www.ebi.ac.uk/pride/archive/projects/${acc}`;
  }
  if (/^E-MTAB/i.test(acc)) {
    return `https://www.ebi.ac.uk/biostudies/arrayexpress/studies/${acc}`;
  }
  if (/^E-MEXP/i.test(acc)) {
    return `https://www.ebi.ac.uk/biostudies/studies/${acc}`;
  }
  return undefined;
}
