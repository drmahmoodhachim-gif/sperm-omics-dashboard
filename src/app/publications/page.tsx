import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PublicationsBrowser } from "@/components/publications/PublicationsBrowser";

export const dynamic = "force-dynamic";

export default function PublicationsPage() {
  return (
    <DashboardLayout activePath="/publications">
      <div className="space-y-6">
        <header>
          <h1 className="font-serif text-3xl font-bold">Publications</h1>
          <p className="mt-2 text-muted-foreground">
            PubMed-indexed infertility and sperm research — fast paginated loading.
          </p>
        </header>
        <PublicationsBrowser />
      </div>
    </DashboardLayout>
  );
}
