import { NextResponse } from "next/server";
import { deToVolcano, runDifferentialExpression } from "@/lib/analysis/de-analysis";
import { buildHeatmapData, computePCA } from "@/lib/analysis/pca-heatmap";
import { fetchExpressionMatrix, sourceLabel } from "@/lib/raw-data/fetch-matrix";

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
    fileUrl?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const groupA = body.groupA ?? [];
  const groupB = body.groupB ?? [];
  const labelA = body.groupALabel ?? "Group A";
  const labelB = body.groupBLabel ?? "Group B";

  if (groupA.length < 2 || groupB.length < 2) {
    return NextResponse.json(
      { error: "Select at least 2 samples per group" },
      { status: 400 }
    );
  }

  const overlap = groupA.filter((s) => groupB.includes(s));
  if (overlap.length > 0) {
    return NextResponse.json({ error: "Sample groups must not overlap" }, { status: 400 });
  }

  try {
    const matrix = await fetchExpressionMatrix(acc, { fileUrl: body.fileUrl });
    const results = runDifferentialExpression({
      matrix,
      groupA,
      groupB,
      genes: body.genes,
    });

    const sig = results.filter((r) => r.significant);
    const volcano = deToVolcano(results);

    const allSamples = [...groupA, ...groupB];
    const groupLabels: Record<string, string> = {};
    groupA.forEach((s) => (groupLabels[s] = labelA));
    groupB.forEach((s) => (groupLabels[s] = labelB));

    const pca = computePCA(matrix, allSamples, groupLabels);
    const topGenes = sig.slice(0, 30).map((r) => r.gene);
    const heatmap = buildHeatmapData({
      matrix,
      topGenes: topGenes.length >= 5 ? topGenes : results.slice(0, 20).map((r) => r.gene),
      sampleIds: allSamples,
      groupLabels,
    });

    const sampleTitles: Record<string, string> = {};
    matrix.samples.forEach((s) => {
      sampleTitles[s.id] = s.title;
    });

    return NextResponse.json({
      accession: acc,
      source: sourceLabel(acc),
      method: "Welch t-test + Benjamini–Hochberg FDR",
      comparison: {
        groupA: labelA,
        groupB: labelB,
        sampleCountA: groupA.length,
        sampleCountB: groupB.length,
      },
      totalGenes: results.length,
      significantGenes: sig.length,
      upregulated: sig.filter((r) => r.direction === "up").length,
      downregulated: sig.filter((r) => r.direction === "down").length,
      results: results.slice(0, 500),
      volcano,
      pca,
      heatmap: { ...heatmap, sampleLabels: sampleTitles },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 502 }
    );
  }
}
