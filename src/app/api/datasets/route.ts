import { NextRequest, NextResponse } from "next/server";
import { getDatasetsPage } from "@/lib/data/library";

export const revalidate = 300;

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(100, Math.max(10, Number(sp.get("limit") ?? 50)));
  const search = sp.get("q") ?? undefined;
  const omicsType = sp.get("omics") ?? undefined;
  const tissue = sp.get("tissue") ?? undefined;

  const result = await getDatasetsPage({
    limit,
    offset: (page - 1) * limit,
    search,
    omicsType,
    tissue,
  });

  return NextResponse.json({
    datasets: result.rows,
    total: result.total,
    page,
    limit,
    pages: Math.ceil(result.total / limit),
  });
}
