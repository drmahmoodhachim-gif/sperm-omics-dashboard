import { NextResponse } from "next/server";
import {
  supportsInlineAnalysis,
  sourceLabel,
  accessionKind,
} from "@/lib/raw-data/fetch-matrix";
import { listArrayExpressFiles } from "@/lib/raw-data/arrayexpress-fetch";
import { listPrideQuantFiles } from "@/lib/raw-data/pride-quant";
import {
  geoMinimlUrl,
  geoSeriesMatrixUrl,
  isGeoAccession,
} from "@/lib/raw-data/geo-path";

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
    const matrixUrl = geoSeriesMatrixUrl(acc);
    const minimlUrl = geoMinimlUrl(acc);
    files = [];
    if (matrixUrl) {
      files.push({
        name: `${acc}_series_matrix.txt.gz`,
        url: matrixUrl,
        type: "expression_matrix",
        description: "GEO Series Matrix — sample × gene expression",
        analyzable: true,
      });
    }
    if (minimlUrl) {
      files.push({
        name: `${acc}_family.xml.tgz`,
        url: minimlUrl,
        type: "metadata",
        description: "GEO MINiML metadata",
        analyzable: false,
      });
    }
    files.push({
      name: `${acc} on GEO`,
      url: `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${acc}`,
      type: "other",
      description: "Supplementary raw FASTQ/count files",
      analyzable: false,
    });
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
