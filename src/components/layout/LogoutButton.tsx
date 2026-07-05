"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authRequired && data.authenticated) {
          setAuthRequired(true);
          setUsername(data.username ?? null);
        }
      })
      .catch(() => {});
  }, []);

  if (!authRequired) return null;

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="border-t border-border px-3 py-3">
      {username && (
        <p className="mb-2 truncate px-3 text-xs text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{username}</span>
        </p>
      )}
      <button
        type="button"
        onClick={logout}
        disabled={loading}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );
}
