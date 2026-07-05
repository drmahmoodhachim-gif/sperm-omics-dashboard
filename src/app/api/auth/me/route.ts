import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { getAuthSecret, isAuthConfigured } from "@/lib/auth/credentials";
import { verifySessionToken } from "@/lib/auth/session";

export async function GET() {
  if (!isAuthConfigured()) {
    return NextResponse.json({ authenticated: false, authRequired: false });
  }

  const secret = getAuthSecret()!;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token, secret);

  if (!session) {
    return NextResponse.json({ authenticated: false, authRequired: true }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    authRequired: true,
    username: session.username,
  });
}
