import type { ResearchTemplate } from "./types";

export const RESEARCH_TEMPLATES: ResearchTemplate[] = [
  {
    id: "differential_expression",
    label: "Differential expression (case vs control)",
    description:
      "Compare molecular profiles between infertile/subfertile and fertile controls in sperm or reproductive tissues.",
    hypothesisStem:
      "We hypothesize that {focus} exhibits a reproducible molecular signature distinguishing {case} from {control}, detectable by bulk or single-cell omics.",
    defaultFigures: ["volcano", "heatmap", "pca", "table"],
    methodCategories: ["Transcriptomics", "Proteomics", "Functional Analysis"],
  },
  {
    id: "biomarker_discovery",
    label: "Biomarker discovery & validation",
    description:
      "Identify candidate RNA, protein, or epigenetic markers associated with fertility status or semen parameters.",
    hypothesisStem:
      "We hypothesize that a compact panel of {focus} biomarkers in {tissue} can stratify {case} with sufficient sensitivity for clinical screening.",
    defaultFigures: ["volcano", "bar", "table", "heatmap"],
    methodCategories: ["Transcriptomics", "Proteomics", "Epigenomics"],
  },
  {
    id: "mechanism_pathway",
    label: "Mechanism & pathway analysis",
    description:
      "Explain infertility phenotypes through enriched pathways, spermatogenesis programs, or maturation defects.",
    hypothesisStem:
      "We hypothesize that {focus} dysregulation converges on conserved spermatogenesis and sperm function pathways (e.g., cilium assembly, oxidative phosphorylation, chromatin remodeling).",
    defaultFigures: ["pathway", "heatmap", "volcano", "bar"],
    methodCategories: ["Functional Analysis", "Transcriptomics", "Proteomics"],
  },
  {
    id: "cross_omics",
    label: "Cross-omics integration",
    description:
      "Integrate transcriptomic, proteomic, and/or epigenomic layers to build a multi-level model of sperm dysfunction.",
    hypothesisStem:
      "We hypothesize that discordance between {focus} RNA and protein abundance reveals post-transcriptional or epididymal maturation defects in {case}.",
    defaultFigures: ["scatter", "venn", "heatmap", "table"],
    methodCategories: ["Transcriptomics", "Proteomics", "Epigenomics", "Functional Analysis"],
  },
  {
    id: "clinical_association",
    label: "Clinical phenotype association",
    description:
      "Link immune, systemic, or semen-parameter phenotypes to molecular readouts in infertility cohorts.",
    hypothesisStem:
      "We hypothesize that {focus} in {tissue} correlates with clinical infertility subtypes ({case}) independent of conventional semen parameters.",
    defaultFigures: ["pca", "bar", "table", "scatter"],
    methodCategories: ["Single-cell Analysis", "Transcriptomics", "Semen Analysis"],
  },
  {
    id: "sperm_quality",
    label: "Sperm quality & WHO parameters",
    description:
      "Relate WHO semen parameters (concentration, motility, morphology) to omics signatures or reference thresholds.",
    hypothesisStem:
      "We hypothesize that {focus} molecular profiles explain variance in WHO semen parameters beyond standard cut-offs in {case}.",
    defaultFigures: ["bar", "table", "scatter", "volcano"],
    methodCategories: ["Semen Analysis", "Transcriptomics", "Proteomics"],
  },
];

export function getTemplate(id: string) {
  return RESEARCH_TEMPLATES.find((t) => t.id === id) ?? RESEARCH_TEMPLATES[0];
}
