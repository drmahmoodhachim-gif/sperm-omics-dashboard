"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function PublicationSearch({ q }: { q: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <input
        type="search"
        defaultValue={q}
        placeholder="Search publications…"
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("page");
          const val = e.target.value.trim();
          if (val) params.set("q", val);
          else params.delete("q");
          startTransition(() => {
            router.push(`/publications?${params.toString()}`);
          });
        }}
        className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm shadow-sm outline-none ring-ring focus:ring-2"
      />
      {pending && <span className="shrink-0 text-xs text-muted-foreground">Searching…</span>}
    </div>
  );
}
