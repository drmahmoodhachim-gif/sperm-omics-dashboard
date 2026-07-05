"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Loader2, Lock } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      const from = searchParams.get("from") || "/";
      router.replace(from);
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/5 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <BarChart3 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold">SpermOmics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with an approved account to access the resource library.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
