import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/session";

function authConfigured(): boolean {
  const secret = process.env.AUTH_SECRET?.trim();
  const hasUsers =
    Boolean(process.env.AUTH_USERS?.trim()) ||
    (Boolean(process.env.AUTH_USERNAME?.trim()) && Boolean(process.env.AUTH_PASSWORD));
  return Boolean(secret && hasUsers);
}

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout", "/api/auth/me"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/api/cron")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!authConfigured()) {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET!.trim();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token, secret);

  if (session) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  if (pathname !== "/") {
    loginUrl.searchParams.set("from", pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
