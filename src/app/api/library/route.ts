import { NextResponse } from "next/server";
import {
  getDashboardStatsAsync,
  getIngestManifest,
  getLibrary,
} from "@/lib/data/library";
import { figures, methods } from "@/lib/data/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  const [lib, stats, manifest] = await Promise.all([
    getLibrary(),
    getDashboardStatsAsync(),
    getIngestManifest(),
  ]);

  return NextResponse.json({
    stats,
    publications: lib.publications,
    datasets: lib.datasets,
    methods,
    figures,
    manifest,
    meta: {
      version: "0.2.0",
      lastUpdated: manifest?.lastRun ?? new Date().toISOString(),
      sources: ["GEO", "PRIDE", "SperMD", "PubMed", "WHO"],
    },
  });
}
