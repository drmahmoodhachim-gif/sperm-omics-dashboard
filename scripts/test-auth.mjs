const base = process.env.BASE_URL ?? "http://localhost:3002";
const username = process.env.AUTH_USERNAME ?? "";
const password = process.env.AUTH_PASSWORD ?? "";

async function main() {
  if (!username || !password) {
    console.error("Set AUTH_USERNAME and AUTH_PASSWORD (e.g. from .env.local)");
    process.exit(1);
  }
  console.log("Base:", base);
  console.log("User:", username);

  const noAuth = await fetch(`${base}/`, { redirect: "manual" });
  console.log("1. GET / unauthenticated:", noAuth.status, noAuth.headers.get("location"));

  const bad = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: "wrong-password" }),
  });
  console.log("2. Wrong password:", bad.status, await bad.json());

  const jar = new Map();
  const good = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const setCookie = good.headers.getSetCookie?.() ?? [];
  for (const c of setCookie) {
    const [pair] = c.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
  console.log("3. Good login:", good.status, await good.json());

  const cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  const me = await fetch(`${base}/api/auth/me`, { headers: { cookie } });
  console.log("4. /api/auth/me:", me.status, await me.json());

  const home = await fetch(`${base}/`, { redirect: "manual", headers: { cookie } });
  console.log("5. GET / with session:", home.status);

  const logout = await fetch(`${base}/api/auth/logout`, { method: "POST", headers: { cookie } });
  console.log("6. Logout:", logout.status, await logout.json());

  const blocked = await fetch(`${base}/api/auth/me`, { headers: { cookie } });
  console.log("7. /me after logout (stale cookie):", blocked.status);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
