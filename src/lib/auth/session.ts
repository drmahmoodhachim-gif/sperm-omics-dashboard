import { SESSION_MAX_AGE_SEC } from "./constants";

export interface SessionPayload {
  username: string;
  exp: number;
}

function encodeBase64Url(data: Uint8Array): string {
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return encodeBase64Url(new Uint8Array(sig));
}

export async function createSessionToken(username: string, secret: string): Promise<string> {
  const payload: SessionPayload = {
    username,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
  };
  const body = encodeBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmacSign(body, secret);
  return `${body}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
  secret: string
): Promise<SessionPayload | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacSign(body, secret);
  if (sig.length !== expected.length) return null;

  let valid = true;
  for (let i = 0; i < sig.length; i++) {
    if (sig.charCodeAt(i) !== expected.charCodeAt(i)) valid = false;
  }
  if (!valid) return null;

  try {
    const json = new TextDecoder().decode(decodeBase64Url(body));
    const payload = JSON.parse(json) as SessionPayload;
    if (!payload.username || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
