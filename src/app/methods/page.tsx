import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/Badge";
import { methods } from "@/lib/data/seed";

export default function MethodsPage() {
  const categories = [...new Set(methods.map((m) => m.category))];

  return (
    <DashboardLayout activePath="/methods">
      <div className="space-y-6">
        <header>
          <h1 className="font-serif text-3xl font-bold">Methods &amp; Materials</h1>
          <p className="mt-2 text-muted-foreground">
            Standardized analysis protocols and materials used to process public
            infertility omics data and generate publication-ready outputs.
          </p>
        </header>

        {categories.map((category) => (
          <section key={category} className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">{category}</h2>
            {methods
              .filter((m) => m.category === category)
              .map((method) => (
                <article
                  key={method.id}
                  id={method.id}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold">{method.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {method.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {method.software.map((sw: string) => (
                      <Badge key={sw} variant="secondary">
                        {sw}
                      </Badge>
                    ))}
                  </div>

                  {method.parameters && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Key Parameters
                      </p>
                      <dl className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {Object.entries(method.parameters).map(([key, val]) => (
                          <div
                            key={key}
                            className="rounded-lg bg-muted/50 px-3 py-2 text-sm"
                          >
                            <dt className="text-xs text-muted-foreground">{key}</dt>
                            <dd className="font-mono font-medium">{String(val)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Protocol
                    </p>
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
                      {method.protocol}
                    </pre>
                  </div>

                  {method.references && method.references.length > 0 && (
                    <div className="mt-4 border-t border-border pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        References
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {method.references.map((ref) => (
                          <li key={ref}>• {ref}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              ))}
          </section>
        ))}
      </div>
    </DashboardLayout>
  );
}
