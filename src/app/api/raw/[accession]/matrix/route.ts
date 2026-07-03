import { NextResponse } from "next/server";
import { fetchGeoSeriesMatrix, matrixPreview } from "@/lib/raw-data/geo-fetch";

export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accession: string }> }
) {
  const { accession } = await params;
  const acc = decodeURIComponent(accession).toUpperCase();

  try {
    const matrix = await fetchGeoSeriesMatrix(acc);
    return NextResponse.json(matrixPreview(matrix));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load matrix" },
      { status: 502 }
    );
  }
}
