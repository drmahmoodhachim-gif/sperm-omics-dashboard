import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Database,
  FlaskConical,
  Home,
  Image,
  LineChart,
  RefreshCw,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/publications", label: "Publications", icon: BookOpen },
  { href: "/datasets", label: "Datasets", icon: Database },
  { href: "/analysis", label: "Analysis Workspace", icon: LineChart },
  { href: "/figures", label: "Figures & Tables", icon: Image },
  { href: "/methods", label: "Methods & Materials", icon: FlaskConical },
  { href: "/ingest", label: "Data Ingestion", icon: RefreshCw },
  { href: "/search", label: "Search Library", icon: Search },
];

export function Sidebar({ activePath }: { activePath: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-gradient-to-b from-card to-muted/30 shadow-sm">
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight tracking-tight">SpermOmics</h1>
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
