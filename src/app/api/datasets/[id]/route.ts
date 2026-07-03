import { NextResponse } from "next/server";
import { getDatasetByIdAsync, getMeasurementsForDatasetAsync } from "@/lib/analysis/resolve-dataset";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dataset = await getDatasetByIdAsync(decodeURIComponent(id));
  if (!dataset) {
    return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
  }

  const measurements = await getMeasurementsForDatasetAsync(dataset);

  return NextResponse.json({
    dataset,
    measurements,
    variableCount: measurements.length,
    hasAnalysisData: measurements.length > 0,
  });
}
