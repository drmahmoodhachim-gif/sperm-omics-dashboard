import { Sidebar } from "@/components/layout/Sidebar";

export function DashboardLayout({
  children,
  activePath,
}: {
  children: React.ReactNode;
  activePath: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar activePath={activePath} />
      <main className="ml-64 min-h-screen">
        <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
