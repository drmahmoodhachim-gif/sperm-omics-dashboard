import { NextResponse } from "next/server";
import { getAnalyzableStudies } from "@/lib/analysis/resolve-dataset";

export async function GET() {
  const studies = await getAnalyzableStudies();
  return NextResponse.json({ studies, total: studies.length });
}
