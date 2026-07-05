import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ResearchExplorer } from "@/components/research/ResearchExplorer";

export const dynamic = "force-dynamic";

export default function ResearchPage() {
  return (
    <DashboardLayout activePath="/research">
      <div className="space-y-6">
        <header>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Research Planner</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Turn a research question or preliminary finding into a structured hypothesis, matched
            datasets and papers from the library, draft materials &amp; methods, figure descriptions,
            and in vivo / in vitro validation suggestions — then jump straight into the Analysis
            Workspace.
          </p>
        </header>

        <ResearchExplorer />
      </div>
    </DashboardLayout>
  );
}
