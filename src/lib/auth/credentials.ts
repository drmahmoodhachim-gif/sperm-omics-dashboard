import { timingSafeEqual } from "crypto";

export interface ApprovedUser {
  username: string;
  password: string;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Parse AUTH_USERS=user:pass;user2:pass2 or fall back to AUTH_USERNAME + AUTH_PASSWORD. */
export function getApprovedUsers(): ApprovedUser[] {
  const users: ApprovedUser[] = [];
  const list = process.env.AUTH_USERS?.trim();

  if (list) {
    for (const entry of list.split(";")) {
      const trimmed = entry.trim();
      if (!trimmed) continue;
      const colon = trimmed.indexOf(":");
      if (colon <= 0) continue;
      const username = trimmed.slice(0, colon).trim();
      const password = trimmed.slice(colon + 1);
      if (username && password) users.push({ username, password });
    }
  }

  const singleUser = process.env.AUTH_USERNAME?.trim();
  const singlePass = process.env.AUTH_PASSWORD ?? "";
  if (singleUser && singlePass) {
    const exists = users.some((u) => u.username === singleUser);
    if (!exists) users.push({ username: singleUser, password: singlePass });
  }

  return users;
}

export function isAuthConfigured(): boolean {
  const secret = process.env.AUTH_SECRET?.trim();
  return Boolean(secret && getApprovedUsers().length > 0);
}

export function verifyCredentials(username: string, password: string): boolean {
  const normalized = username.trim().toLowerCase();
  const approved = getApprovedUsers();
  const match = approved.find((u) => u.username.toLowerCase() === normalized);
  if (!match) return false;
  return safeEqual(password, match.password);
}

export function getAuthSecret(): string | null {
  const secret = process.env.AUTH_SECRET?.trim();
  return secret || null;
}
