import { NextResponse } from "next/server";
import { deToVolcano, runDifferentialExpression } from "@/lib/analysis/de-analysis";
import { fetchGeoSeriesMatrix } from "@/lib/raw-data/geo-fetch";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ accession: string }> }
) {
  const { accession } = await params;
  const acc = decodeURIComponent(accession).toUpperCase();

  let body: {
    groupA?: string[];
    groupB?: string[];
    genes?: string[];
    groupALabel?: string;
    groupBLabel?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const groupA = body.groupA ?? [];
  const groupB = body.groupB ?? [];

  if (groupA.length < 2 || groupB.length < 2) {
    return NextResponse.json(
      { error: "Select at least 2 samples per group" },
      { status: 400 }
    );
  }

  const overlap = groupA.filter((s) => groupB.includes(s));
  if (overlap.length > 0) {
    return NextResponse.json(
      { error: "Sample groups must not overlap" },
      { status: 400 }
    );
  }

  try {
    const matrix = await fetchGeoSeriesMatrix(acc);
    const results = runDifferentialExpression({
      matrix,
      groupA,
      groupB,
      genes: body.genes,
    });

    const volcano = deToVolcano(results);
    const sig = results.filter((r) => r.significant);

    return NextResponse.json({
      accession: acc,
      comparison: {
        groupA: body.groupALabel ?? "Group A",
        groupB: body.groupBLabel ?? "Group B",
        sampleCountA: groupA.length,
        sampleCountB: groupB.length,
      },
      totalGenes: results.length,
      significantGenes: sig.length,
      results: results.slice(0, 500),
      volcano,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 502 }
    );
  }
}
