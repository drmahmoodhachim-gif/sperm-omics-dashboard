import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DatasetsBrowser } from "@/components/datasets/DatasetsBrowser";

export const dynamic = "force-dynamic";

export default function DatasetsPage() {
  return (
    <DashboardLayout activePath="/datasets">
      <div className="space-y-6">
        <header>
          <h1 className="font-serif text-3xl font-bold">Public Datasets</h1>
          <p className="mt-2 text-muted-foreground">
            Paginated, Supabase-backed search across GEO, PRIDE, SperMD, and more.
          </p>
        </header>
        <DatasetsBrowser />
      </div>
    </DashboardLayout>
  );
}
