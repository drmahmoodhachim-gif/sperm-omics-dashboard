import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE_SEC } from "@/lib/auth/constants";
import { getAuthSecret, isAuthConfigured, verifyCredentials } from "@/lib/auth/credentials";
import { createSessionToken } from "@/lib/auth/session";

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "Login is not configured. Set AUTH_SECRET and AUTH_USERNAME/AUTH_PASSWORD." },
      { status: 503 }
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  if (!verifyCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const secret = getAuthSecret()!;
  const token = await createSessionToken(username, secret);

  const res = NextResponse.json({ ok: true, username });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
  return res;
}
