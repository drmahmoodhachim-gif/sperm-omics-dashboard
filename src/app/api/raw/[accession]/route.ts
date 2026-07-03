import { NextResponse } from "next/server";
import { listRawFiles } from "@/lib/raw-data/geo-fetch";
import { isGeoAccession } from "@/lib/raw-data/geo-path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accession: string }> }
) {
  const { accession } = await params;
  const acc = decodeURIComponent(accession).toUpperCase();

  const files = await listRawFiles(acc);

  return NextResponse.json({
    accession: acc,
    supportsInlineAnalysis: isGeoAccession(acc),
    files,
  });
}
