import { NextRequest, NextResponse } from "next/server";
import { searchLibraryAsync } from "@/lib/data/library";

export const revalidate = 120;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return NextResponse.json({ publications: [], datasets: [], methods: [] });
  }
  const results = await searchLibraryAsync(q);
  return NextResponse.json(results);
}
