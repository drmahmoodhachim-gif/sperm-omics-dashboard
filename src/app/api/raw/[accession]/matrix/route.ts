import { NextResponse } from "next/server";
import { fetchExpressionMatrix, matrixPreview } from "@/lib/raw-data/fetch-matrix";

export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ accession: string }> }
) {
  const { accession } = await params;
  const acc = decodeURIComponent(accession).toUpperCase();
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get("fileUrl") ?? undefined;

  try {
    const matrix = await fetchExpressionMatrix(acc, { fileUrl });
    return NextResponse.json(matrixPreview(matrix));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load matrix" },
      { status: 502 }
    );
  }
}
