import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FiguresGallery } from "./FiguresGallery";

export default function FiguresPage() {
  return (
    <DashboardLayout activePath="/figures">
      <div className="space-y-6">
        <header>
          <h1 className="font-serif text-3xl font-bold">Figures &amp; Tables</h1>
          <p className="mt-2 text-muted-foreground">
            Publication-ready visualizations with SVG, PNG, and PDF export for
            manuscripts.
          </p>
        </header>
        <FiguresGallery />
      </div>
    </DashboardLayout>
  );
}
