import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Database,
  FlaskConical,
  Home,
  Image,
  RefreshCw,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/publications", label: "Publications", icon: BookOpen },
  { href: "/datasets", label: "Datasets", icon: Database },
  { href: "/figures", label: "Figures & Tables", icon: Image },
  { href: "/methods", label: "Methods & Materials", icon: FlaskConical },
  { href: "/ingest", label: "Data Ingestion", icon: RefreshCw },
  { href: "/search", label: "Search Library", icon: Search },
];

export function Sidebar({ activePath }: { activePath: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">SpermOmics</h1>
            <p className="text-xs text-muted-foreground">Resource Library</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = activePath === href || (href !== "/" && activePath.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Curated public omics &amp; semen data from GEO, PRIDE, SperMD, and WHO references.
        </p>
      </div>
    </aside>
  );
}
