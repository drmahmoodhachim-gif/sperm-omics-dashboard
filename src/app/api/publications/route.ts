import { NextRequest, NextResponse } from "next/server";
import { getPublicationsPage } from "@/lib/data/library";

export const revalidate = 300;

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(100, Math.max(10, Number(sp.get("limit") ?? 30)));
  const search = sp.get("q") ?? undefined;

  const result = await getPublicationsPage({
    limit,
    offset: (page - 1) * limit,
    search,
  });

  return NextResponse.json({
    publications: result.rows,
    total: result.total,
    page,
    limit,
    pages: Math.ceil(result.total / limit),
  });
}
