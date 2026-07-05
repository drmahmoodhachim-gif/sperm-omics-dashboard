import { getDatasetsPage, getPublicationsPage, getMethods } from "@/lib/data/library";
import { resolveRawAccession, supportsRawAnalysis } from "@/lib/raw-data/accession";
import { hasAnalysisData } from "@/lib/analysis/catalog";
import { OMICS_LABELS, TISSUE_LABELS } from "@/lib/utils";
import type { Dataset, Method, Publication } from "@/lib/types";
import { getTemplate, RESEARCH_TEMPLATES } from "./templates";
import type {
  FigurePlan,
  ResearchPlan,
  ResearchTemplateId,
  ScoredDataset,
  ScoredPublication,
  ValidationSuggestion,
} from "./types";

const STOP = new Set(
  "a an the and or of in on for to with from by is are was were be been being this that these those it its at as vs versus between".split(
    " "
  )
);

const DOMAIN_TERMS: Record<string, string[]> = {
  proteomics: ["protein", "proteome", "proteomics", "swath", "mass", "spectrometry", "pxd"],
  transcriptomics: ["rna", "mrna", "transcript", "transcriptome", "rnaseq", "expression", "gse"],
  epigenomics: ["methylation", "epigenetic", "epigenomics", "450k", "epic", "dna"],
  single_cell: ["single", "cell", "scrna", "scrnaseq", "cluster", "immune", "t"],
  semen: ["semen", "motility", "concentration", "morphology", "who", "casa", "astheno", "oligo", "azoosperm"],
  infertility: ["infertile", "infertility", "subfertile", "fertile", "control", "oat", "noa", "idiopathic"],
  sperm: ["sperm", "spermatozoa", "spermatogenesis", "epididymis", "testis", "testicular"],
};

function tokenize(text: string): string[] {
  return [...new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
  )];
}

function scoreText(text: string, tokens: string[]): { score: number; reasons: string[] } {
  const lower = text.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  for (const t of tokens) {
    if (lower.includes(t)) {
      score += 3;
      if (reasons.length < 3) reasons.push(`matches “${t}”`);
    }
  }

  for (const [domain, terms] of Object.entries(DOMAIN_TERMS)) {
    const hit = terms.some((term) => tokens.includes(term) && lower.includes(term));
    if (hit) {
      score += 4;
      reasons.push(domain.replace("_", " "));
    }
  }

  return { score, reasons: [...new Set(reasons)] };
}

function scorePublication(pub: Publication, tokens: string[]): ScoredPublication {
  const blob = [pub.title, pub.abstract, pub.keywords?.join(" "), pub.authors].filter(Boolean).join(" ");
  const { score, reasons } = scoreText(blob, tokens);
  return { ...pub, score, matchReasons: reasons };
}

function scoreDataset(ds: Dataset, tokens: string[]): ScoredDataset {
  const blob = [ds.title, ds.summary, ds.phenotype, ds.accession, ds.platform, ds.omicsType, ds.tissue].filter(
    Boolean
  ).join(" ");
  const { score, reasons } = scoreText(blob, tokens);

  let analysisUrl = `/analysis?study=${encodeURIComponent(ds.accession)}`;
  if (!hasAnalysisData(ds)) {
    const raw = resolveRawAccession(ds);
    if (raw) analysisUrl = `/analysis?study=${encodeURIComponent(raw)}&mode=raw`;
  }

  const rawAcc = resolveRawAccession(ds);
  return {
    ...ds,
    score: score + (hasAnalysisData(ds) ? 5 : supportsRawAnalysis(ds) ? 3 : 0),
    matchReasons: reasons,
    analysisUrl,
    rawAnalysisUrl: rawAcc ? `/analysis?study=${encodeURIComponent(rawAcc)}&mode=raw` : undefined,
  };
}

function inferFocus(tokens: string[], question: string): string {
  const joined = tokens.join(" ");
  if (/protein|proteom|pxd/i.test(joined + question)) return "sperm proteome";
  if (/methyl|epigen/i.test(joined + question)) return "sperm DNA methylation";
  if (/single.?cell|scrna|immune|t cell/i.test(joined + question)) return "immune–germline crosstalk";
  if (/motility|morphology|concentration|who|semen/i.test(joined + question)) return "semen quality";
  if (/rna|transcript|gse/i.test(joined + question)) return "sperm transcriptome";
  return "spermatozoa molecular profiles";
}

function inferCaseControl(question: string): { case: string; control: string; tissue: string } {
  const q = question.toLowerCase();
  let caseLabel = "infertile men";
  if (/oat|oligo|astheno|azoosperm|noa/.test(q)) caseLabel = "infertility subtypes (OAT/NOA/idiopathic)";
  if (/subfertile/.test(q)) caseLabel = "subfertile men";

  let tissue = "ejaculated spermatozoa";
  if (/testis|testicular/.test(q)) tissue = "testis";
  if (/epididym/.test(q)) tissue = "epididymis";
  if (/blood|immune|t cell/.test(q)) tissue = "peripheral immune cells";

  return { case: caseLabel, control: "proven-fertile controls", tissue };
}

function buildHypothesis(
  templateId: ResearchTemplateId,
  question: string,
  tokens: string[]
): { hypothesis: string; aims: string[]; predictions: string[] } {
  const template = getTemplate(templateId);
  const { case: caseLabel, control, tissue } = inferCaseControl(question);
  const focus = inferFocus(tokens, question);

  const hypothesis = template.hypothesisStem
    .replace("{focus}", focus)
    .replace("{case}", caseLabel)
    .replace("{control}", control)
    .replace("{tissue}", tissue);

  const aims = [
    `Curate and harmonize public datasets addressing: “${question.trim()}”.`,
    `Quantify differential features (${focus}) between ${caseLabel} and ${control}.`,
    `Interpret results with pathway and spermatogenesis-focused functional analysis.`,
    `Draft publication-ready figures and propose experimental validation.`,
  ];

  const predictions = [
    `At least one public dataset in the library will show significant separation on PCA/volcano plots.`,
    `Top features will map to known spermatogenesis genes (e.g., PRM1, TNP1, AKAP4, CATSPER family) or immune markers when relevant.`,
    `Pathway enrichment will highlight cilium assembly, oxidative phosphorylation, or chromatin packaging when ${focus} is involved.`,
  ];

  return { hypothesis, aims, predictions };
}

function pickMethods(templateId: ResearchTemplateId, topDatasets: ScoredDataset[]): Method[] {
  const template = getTemplate(templateId);
  const all = getMethods();
  const omics = new Set(topDatasets.map((d) => d.omicsType));

  return all
    .filter((m) => {
      if (template.methodCategories.includes(m.category)) return true;
      if (omics.has("proteomics") && m.category === "Proteomics") return true;
      if (omics.has("transcriptomics") && m.category === "Transcriptomics") return true;
      if (omics.has("epigenomics") && m.category === "Epigenomics") return true;
      if (omics.has("single_cell") && m.category === "Single-cell Analysis") return true;
      return false;
    })
    .slice(0, 4);
}

function buildMaterialsAndMethods(
  question: string,
  methods: Method[],
  datasets: ScoredDataset[]
): string {
  const accList = datasets.slice(0, 4).map((d) => d.accession).join(", ");
  const methodNames = methods.map((m) => m.name).join("; ");

  return [
    "Data sources. Public datasets were retrieved from the SpermOmics Resource Library, integrating GEO, ArrayExpress, PRIDE, and curated SperMD records.",
    `Study selection. Resources were ranked by relevance to the research question: “${question.trim()}”. Primary accessions: ${accList || "top-scoring library matches"}.`,
    `Computational analysis. ${methodNames || "Standard omics QC, normalization, and differential testing"} were applied following repository-specific best practices. Differential expression used Welch t-tests with Benjamini–Hochberg FDR correction (or DESeq2 for raw RNA-seq counts when analyzed locally).`,
    "Functional interpretation. Enriched pathways were assessed with curated spermatogenesis gene sets and GO/KEGG databases. Figures were generated in the Analysis Workspace (volcano, PCA, heatmap, pathway plots).",
    "Reproducibility. Analysis parameters, accession IDs, and figure exports are documented for manuscript Methods sections.",
  ].join("\n\n");
}

function buildFigurePlan(
  templateId: ResearchTemplateId,
  datasets: ScoredDataset[]
): FigurePlan[] {
  const template = getTemplate(templateId);
  const primary = datasets[0];

  const descriptions: Record<string, (ds?: ScoredDataset) => FigurePlan> = {
    volcano: (ds) => ({
      panel: "Fig. 1A",
      figureType: "volcano",
      title: "Differential feature volcano plot",
      description: `Volcano plot of features significantly altered in ${ds?.phenotype ?? "case vs control"} (${ds?.accession ?? "primary dataset"}). X-axis: log2 fold-change; Y-axis: −log10(p). Label top spermatogenesis candidates.`,
      suggestedDataset: ds?.accession,
    }),
    heatmap: (ds) => ({
      panel: "Fig. 1B",
      figureType: "heatmap",
      title: "Heatmap of top differential features",
      description: `Z-score heatmap of top 30 differential features across samples, grouped by fertility status. Use to show consistency of ${OMICS_LABELS[ds?.omicsType ?? "transcriptomics"]} signal.`,
      suggestedDataset: ds?.accession,
    }),
    pca: (ds) => ({
      panel: "Fig. 1C",
      figureType: "pca",
      title: "PCA sample clustering",
      description: `Principal component analysis of ${TISSUE_LABELS[ds?.tissue ?? "spermatozoa"]} profiles colored by group. Report variance explained by PC1/PC2.`,
      suggestedDataset: ds?.accession,
    }),
    pathway: () => ({
      panel: "Fig. 2A",
      figureType: "pathway",
      title: "Pathway enrichment analysis",
      description:
        "Dot plot or bar chart of enriched GO/KEGG terms among significant features. Highlight spermatogenesis, cilium movement, and oxidative stress pathways.",
    }),
    bar: (ds) => ({
      panel: "Fig. 2B",
      figureType: "bar",
      title: "Candidate biomarker abundance",
      description: `Bar chart comparing mean abundance of top candidate features between groups in ${ds?.accession ?? "selected cohort"}.`,
      suggestedDataset: ds?.accession,
    }),
    table: () => ({
      panel: "Table 1",
      figureType: "table",
      title: "Cohort and dataset summary",
      description:
        "Summary table: accession, omics type, tissue, species, sample size, platform, and comparison groups for all datasets used.",
    }),
    scatter: () => ({
      panel: "Fig. 3A",
      figureType: "scatter",
      title: "Cross-omics correlation",
      description:
        "Scatter plot correlating RNA and protein log2FC (or semen parameter vs molecular score) for matched features where multi-omics data exist.",
    }),
    venn: () => ({
      panel: "Fig. 3B",
      figureType: "venn",
      title: "Overlap of significant features",
      description:
        "Venn diagram of significant genes/proteins shared across independent cohorts to prioritize robust biomarkers.",
    }),
  };

  return template.defaultFigures.map((ft, i) => {
    const factory = descriptions[ft] ?? descriptions.table;
    const plan = factory(primary);
    if (i > 0 && plan.panel.startsWith("Fig. 1")) {
      plan.panel = plan.panel.replace("Fig. 1", "Fig. 2");
    }
    return plan;
  });
}

function buildValidations(
  templateId: ResearchTemplateId,
  datasets: ScoredDataset[],
  question: string
): ValidationSuggestion[] {
  const omics = datasets[0]?.omicsType ?? "transcriptomics";
  const tissue = datasets[0]?.tissue ?? "spermatozoa";
  const validations: ValidationSuggestion[] = [];

  validations.push({
    type: "in_vitro",
    title: "Spermatozoa functional assays",
    rationale: `Validate top molecular hits from ${omics} analysis using direct sperm function readouts.`,
    readouts: [
      "Computer-aided sperm analysis (CASA): progressive motility, velocity, linearity",
      "Acrosome reaction assay (PI/FITC-PNA or lectin staining)",
      "Sperm chromatin structure assay (SCSA/DFI) if epigenetic/chromatin genes are implicated",
      "Zona-free hamster oocyte penetration or heterologous IVF model (where ethical approval permits)",
    ],
  });

  if (/immune|t cell|blood/i.test(question) || tissue === "blood") {
    validations.push({
      type: "in_vivo",
      title: "Immune profiling in infertility cohort",
      rationale: "Confirm systemic immune signatures in an independent patient cohort.",
      readouts: [
        "Flow cytometry of CD3+/CD4+/CD8+ T cell subsets with exhaustion markers (PD-1, TIM-3)",
        "Correlation with semen parameters and pregnancy outcomes",
        "Optional: testicular biopsy histology if NOA/OAT phenotype",
      ],
    });
  } else {
    validations.push({
      type: "in_vivo",
      title: "Independent clinical cohort replication",
      rationale: "Test generalizability of biomarkers in a new idiopathic infertility vs fertile cohort.",
      readouts: [
        "Prospective semen sample collection (WHO 2021 parameters)",
        "qRT-PCR or targeted proteomics for top 3–5 candidates in sperm RNA/protein",
        "ROC analysis for diagnostic performance (AUC, sensitivity/specificity)",
        "Optional: IUI/IVF outcome association if clinical data available",
      ],
    });
  }

  if (templateId === "biomarker_discovery" || /biomarker|panel|diagnostic/i.test(question)) {
    validations.push({
      type: "in_vitro",
      title: "Targeted knockdown / rescue (model systems)",
      rationale: "Establish causality for top ranked genes in spermatogenesis models.",
      readouts: [
        "siRNA/shRNA in germ cell lines or round spermatids where applicable",
        "Motility and viability readouts post-knockdown",
        "Rescue with overexpression of wild-type transcript",
      ],
    });
  }

  if (datasets.some((d) => d.species === "mouse")) {
    validations.push({
      type: "in_vivo",
      title: "Mouse model validation",
      rationale: "Use epididymal or testicular mouse models to validate conserved mechanisms.",
      readouts: [
        "Knockout or haploinsufficient mouse lines for candidate gene",
        "Epididymal segment profiling (caput/corpus/cauda)",
        "Fertility mating trials and sperm motility",
      ],
    });
  }

  return validations.slice(0, 4);
}

export async function generateResearchPlan(opts: {
  question: string;
  templateId: ResearchTemplateId;
}): Promise<ResearchPlan> {
  const { question, templateId } = opts;
  const tokens = tokenize(question);
  const template = getTemplate(templateId);

  const [pubPage, dsPage] = await Promise.all([
    getPublicationsPage({ limit: 500 }),
    getDatasetsPage({ limit: 2000 }),
  ]);

  const publications = pubPage.rows
    .map((p) => scorePublication(p, tokens))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const datasets = dsPage.rows
    .map((d) => scoreDataset(d, tokens))
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const fallbackPubs = publications.length
    ? publications
    : pubPage.rows.slice(0, 4).map((p) => ({ ...p, score: 1, matchReasons: ["library showcase"] }));
  const fallbackDs = datasets.length
    ? datasets
    : dsPage.rows
        .filter((d) => hasAnalysisData(d) || supportsRawAnalysis(d))
        .slice(0, 5)
        .map((d) => scoreDataset(d, tokens.length ? tokens : ["sperm", "infertility"]));

  const { hypothesis, aims, predictions } = buildHypothesis(templateId, question, tokens);
  const methodsUsed = pickMethods(templateId, fallbackDs);
  const figurePlan = buildFigurePlan(templateId, fallbackDs);
  const validations = buildValidations(templateId, fallbackDs, question);

  const analysisLinks = [
    ...fallbackDs.slice(0, 3).map((d) => ({
      label: `Analyze ${d.accession}`,
      href: d.analysisUrl,
    })),
    ...fallbackDs
      .filter((d) => d.rawAnalysisUrl && d.rawAnalysisUrl !== d.analysisUrl)
      .slice(0, 2)
      .map((d) => ({
        label: `Raw data: ${d.accession}`,
        href: d.rawAnalysisUrl!,
      })),
  ];

  return {
    question,
    templateId,
    templateLabel: template.label,
    hypothesis,
    specificAims: aims,
    predictions,
    publications: fallbackPubs,
    datasets: fallbackDs,
    materialsAndMethods: buildMaterialsAndMethods(question, methodsUsed, fallbackDs),
    methodsUsed: methodsUsed.map((m) => ({ id: m.id, name: m.name, category: m.category })),
    figurePlan,
    validations,
    analysisLinks,
  };
}

export { RESEARCH_TEMPLATES };
