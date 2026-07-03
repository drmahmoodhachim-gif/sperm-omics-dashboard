import { NextResponse } from "next/server";
import { getIngestManifest, getLibrary } from "@/lib/data/library";
import { figures, methods } from "@/lib/data/seed";

export async function GET() {
  const [lib, manifest] = await Promise.all([
    getLibrary(),
    getIngestManifest(),
  ]);

  const stats = {
    totalPublications: lib.publications.length,
    totalDatasets: lib.datasets.length,
    totalMethods: methods.length,
    totalFigures: figures.length,
  };

  return NextResponse.json({
    stats,
    manifest,
    sources: ["GEO", "PRIDE", "SperMD", "PubMed", "seed"],
    hasMergedLibrary: lib.publications.length > 8 || lib.datasets.length > 10,
  });
}
