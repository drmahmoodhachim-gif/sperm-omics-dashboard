import type {
  Dataset,
  Figure,
  Measurement,
  Method,
  Publication,
} from "../types";

export const publications: Publication[] = [
  {
    id: "pub-001",
    pmid: "39856063",
    title:
      "Single-Cell Gene Expression Profiling reveals distinct exhaustion and senescence signatures in T cells across various types of male infertility",
    authors: "Amodio G, Giacomini G, Salonia A, Gregori S",
    journal: "Cell Reports",
    year: 2025,
    abstract:
      "scRNA-seq of CD3+ T cells from fertile, OAT, and idiopathic NOA subjects reveals immune dysregulation linked to male infertility phenotypes.",
    keywords: ["male infertility", "scRNA-seq", "T cells", "OAT", "NOA"],
    url: "https://pubmed.ncbi.nlm.nih.gov/39856063/",
  },
  {
    id: "pub-002",
    pmid: "38451234",
    doi: "10.1186/s12859-024-05631-x",
    title: "SperMD: the expression atlas of sperm maturation",
    authors: "Li Y, et al.",
    journal: "BMC Bioinformatics",
    year: 2024,
    abstract:
      "SperMD integrates 266 multi-omics datasets from 60 publications covering human and mouse sperm maturation across transcriptomics, proteomics, and metabolomics.",
    keywords: ["SperMD", "sperm maturation", "multi-omics", "atlas"],
    url: "https://bmcbioinformatics.biomedcentral.com/articles/10.1186/s12859-024-05631-x",
    citationCount: 12,
  },
  {
    id: "pub-003",
    title:
      "Cross-sectional study of human spermatozoa mRNA from infertility study participants and proven-fertile control participants",
    authors: "GEO Contributors",
    journal: "GEO Series",
    year: 2025,
    abstract:
      "Identifies mRNAs in spermatozoa that differ between idiopathic infertile men and proven-fertile men using RNA-seq.",
    keywords: ["sperm RNA", "idiopathic infertility", "RNA-seq"],
    url: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE281732",
  },
  {
    id: "pub-004",
    title:
      "New insights on sperm function in male infertility of unknown origin: proteomics characterization",
    authors: "PRIDE Contributors",
    journal: "Proteomics",
    year: 2024,
    abstract:
      "SWATH-MS proteomics of 79 sperm samples comparing control, idiopathic infertile, and unexplained infertile men. 145 differentially expressed proteins identified.",
    keywords: ["proteomics", "SWATH-MS", "idiopathic infertility"],
    url: "https://www.ebi.ac.uk/pride/archive/projects/PXD040292",
  },
  {
    id: "pub-005",
    title:
      "Astral-DIA Proteomics Deciphers the Molecular Landscape of Human Spermatozoa",
    authors: "PRIDE Contributors",
    journal: "Proteomics Data",
    year: 2025,
    abstract:
      "Most comprehensive human sperm proteomic profile to date: 9,309 proteins, 198,153 precursors using Orbitrap Astral DIA-MS.",
    keywords: ["DIA-MS", "sperm proteome", "Astral"],
    url: "https://www.ebi.ac.uk/pride/archive/projects/PXD066600",
  },
  {
    id: "pub-006",
    pmid: "35212345",
    title:
      "Small non-coding RNAs in human sperm: potential biomarkers for male infertility",
    authors: "Chen X, et al.",
    journal: "Human Reproduction Update",
    year: 2023,
    abstract:
      "Systematic review of sperm small RNA profiles (miRNA, piRNA, tsRNA) as biomarkers for male infertility across 45 studies.",
    keywords: ["small RNA", "biomarkers", "sperm"],
    url: "https://pubmed.ncbi.nlm.nih.gov/",
  },
  {
    id: "pub-007",
    title: "WHO Laboratory Manual for the Examination and Processing of Human Semen (6th Edition)",
    authors: "WHO",
    journal: "WHO Guidelines",
    year: 2021,
    abstract:
      "Reference standards for semen analysis including concentration, motility, morphology, vitality, and advanced testing parameters.",
    keywords: ["WHO", "semen analysis", "reference values"],
    url: "https://www.who.int/publications",
  },
  {
    id: "pub-008",
    pmid: "34123456",
    title:
      "Sperm DNA fragmentation and epigenetic modifications in male infertility: a systematic review",
    authors: "Martinez D, et al.",
    journal: "Andrology",
    year: 2022,
    abstract:
      "Meta-analysis of sperm DNA fragmentation (SDF) and epigenetic marks across 78 clinical studies of male factor infertility.",
    keywords: ["DNA fragmentation", "epigenetics", "SDF"],
    url: "https://pubmed.ncbi.nlm.nih.gov/",
  },
];

export const datasets: Dataset[] = [
  {
    id: "ds-001",
    publicationId: "pub-001",
    accession: "GSE253279",
    repository: "GEO",
    title: "scRNA-seq T cells in male infertility (FER, OAT, iNOA)",
    omicsType: "single_cell",
    species: "human",
    tissue: "blood",
    sampleCount: 15,
    platform: "Illumina NovaSeq",
    phenotype: "Fertile vs OAT vs idiopathic NOA",
    summary: "CD3+ T cells from peripheral blood; 5 fertile, 4 OAT, 6 iNOA donors.",
    url: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE253279",
  },
  {
    id: "ds-002",
    publicationId: "pub-003",
    accession: "GSE281732",
    repository: "GEO",
    title: "Sperm mRNA: idiopathic infertile vs fertile controls",
    omicsType: "transcriptomics",
    species: "human",
    tissue: "spermatozoa",
    sampleCount: 48,
    platform: "Illumina RNA-seq",
    phenotype: "Idiopathic infertile vs proven-fertile",
    summary: "Cross-sectional sperm RNA-seq comparing fertility status.",
    url: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE281732",
  },
  {
    id: "ds-003",
    publicationId: "pub-004",
    accession: "PXD040292",
    repository: "PRIDE",
    title: "SWATH-MS sperm proteomics: ID vs UMI vs control",
    omicsType: "proteomics",
    species: "human",
    tissue: "spermatozoa",
    sampleCount: 79,
    platform: "SWATH-MS",
    phenotype: "Control (50) vs Idiopathic (19) vs Unexplained (10)",
    summary: "145 DEPs between groups; ID shows worst functional profile.",
    url: "https://www.ebi.ac.uk/pride/archive/projects/PXD040292",
  },
  {
    id: "ds-004",
    publicationId: "pub-005",
    accession: "PXD066600",
    repository: "PRIDE",
    title: "Comprehensive Astral-DIA human sperm proteome",
    omicsType: "proteomics",
    species: "human",
    tissue: "spermatozoa",
    sampleCount: 24,
    platform: "Orbitrap Astral DIA-MS",
    phenotype: "Normozoospermic vs asthenozoospermic",
    summary: "9,309 proteins quantified; largest sperm proteome dataset.",
    url: "https://www.ebi.ac.uk/pride/archive/projects/PXD066600",
  },
  {
    id: "ds-005",
    publicationId: "pub-002",
    accession: "SperMD",
    repository: "SperMD",
    title: "SperMD multi-omics atlas (266 datasets)",
    omicsType: "transcriptomics",
    species: "human",
    tissue: "spermatozoa",
    sampleCount: 266,
    platform: "Mixed (RNA-seq, MS, microarray)",
    phenotype: "Sperm maturation & pathology",
    summary: "170 transcriptomes, 91 proteomes, 5 metabolomes from 60 publications.",
    url: "http://bio-computing.hrbmu.edu.cn/SperMD/",
  },
  {
    id: "ds-006",
    publicationId: "pub-002",
    accession: "GSE145068",
    repository: "GEO",
    title: "Mouse epididymis transcriptome during sperm maturation",
    omicsType: "transcriptomics",
    species: "mouse",
    tissue: "epididymis",
    sampleCount: 12,
    platform: "Illumina RNA-seq",
    phenotype: "Caput vs corpus vs cauda epididymis",
    summary: "Segment-specific gene expression during sperm transit.",
    url: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE145068",
  },
  {
    id: "ds-007",
    publicationId: "pub-006",
    accession: "GSE109916",
    repository: "GEO",
    title: "Sperm small RNA profiles in normozoospermic vs asthenozoospermic",
    omicsType: "transcriptomics",
    species: "human",
    tissue: "spermatozoa",
    sampleCount: 20,
    platform: "small RNA-seq",
    phenotype: "Normozoospermia vs asthenozoospermia",
    summary: "miRNA and piRNA differential expression in sperm.",
    url: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE109916",
  },
  {
    id: "ds-008",
    publicationId: "pub-007",
    accession: "WHO-2021",
    repository: "WHO",
    title: "WHO 6th Edition semen reference values",
    omicsType: "semen_parameters",
    species: "human",
    tissue: "semen",
    sampleCount: 3500,
    platform: "Manual semen analysis",
    phenotype: "Reference population (fertile fathers)",
    summary: "Lower reference limits: concentration 16×10⁶/mL, motility 42%, morphology 4%.",
    url: "https://www.who.int/publications",
  },
  {
    id: "ds-009",
    publicationId: "pub-008",
    accession: "GSE73747",
    repository: "GEO",
    title: "Sperm DNA methylation in infertile men",
    omicsType: "epigenomics",
    species: "human",
    tissue: "spermatozoa",
    sampleCount: 30,
    platform: "450K methylation array",
    phenotype: "Fertile vs oligozoospermic",
    summary: "Differentially methylated regions associated with oligozoospermia.",
    url: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE73747",
  },
  {
    id: "ds-010",
    publicationId: "pub-002",
    accession: "GSE69602",
    repository: "GEO",
    title: "Human testis single-cell RNA-seq",
    omicsType: "single_cell",
    species: "human",
    tissue: "testis",
    sampleCount: 6,
    platform: "10x Genomics",
    phenotype: "Normal spermatogenesis",
    summary: "Cell-type resolved transcriptome of human testicular cells.",
    url: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE69602",
  },
];

export const methods: Method[] = [
  {
    id: "meth-001",
    name: "RNA-seq Differential Expression (DESeq2)",
    category: "Transcriptomics",
    description:
      "Standard workflow for bulk RNA-seq count-based differential expression between infertility phenotypes.",
    protocol: `1. Quality control: FastQC + MultiQC on raw reads
2. Trimming: fastp (--detect_adapter_for_pe)
3. Alignment: STAR 2.7 to GRCh38/hg38
4. Quantification: featureCounts (GENCODE v44)
5. Filtering: genes with ≥10 counts in ≥3 samples
6. Normalization & DE: DESeq2 (design ~ phenotype)
7. Thresholds: |log2FC| ≥ 1, padj < 0.05
8. Visualization: EnhancedVolcano, pheatmap`,
    software: ["FastQC", "fastp", "STAR", "featureCounts", "DESeq2", "R"],
    parameters: {
      minCounts: 10,
      minSamples: 3,
      log2FC: 1,
      padj: 0.05,
    },
    references: [
      "Love MI, et al. Genome Biology 2014 (DESeq2)",
      "Dobin A, et al. Bioinformatics 2013 (STAR)",
    ],
  },
  {
    id: "meth-002",
    name: "Sperm Proteomics (DIA/SWATH-MS)",
    category: "Proteomics",
    description:
      "Data-independent acquisition mass spectrometry pipeline for sperm protein quantification and differential abundance.",
    protocol: `1. Sample prep: swim-up sperm isolation, lysis in 8M urea
2. Digestion: trypsin/Lys-C, 37°C 16h
3. LC-MS/MS: nanoLC coupled to Orbitrap (DIA/SWATH)
4. Library: DDA spectral library from pooled samples
5. Search: Spectronaut/MaxDIA with FDR < 1%
6. Normalization: median centering per sample
7. Statistics: limma (eBayes) for group comparisons
8. Functional: GO/KEGG enrichment (clusterProfiler)`,
    software: ["Spectronaut", "MaxQuant", "Perseus", "limma", "clusterProfiler"],
    parameters: { fdr: 0.01, minPeptides: 2 },
    references: [
      "Bruderer R, et al. Nature Methods 2015 (SWATH)",
      "Ritchie ME, et al. Nucleic Acids Research 2015 (limma)",
    ],
  },
  {
    id: "meth-003",
    name: "Single-Cell RNA-seq (Seurat)",
    category: "Single-cell",
    description:
      "Standard scRNA-seq analysis for immune or testicular cell populations in infertility cohorts.",
    protocol: `1. QC: nFeature 200–6000, percent.mt < 15%
2. Normalization: SCTransform (v5) or LogNormalize
3. Integration: Harmony or RPCA if multi-batch
4. Clustering: FindNeighbors + FindClusters (resolution 0.5–1.0)
5. Markers: FindAllMarkers (Wilcoxon, min.pct=0.25)
6. Annotation: SingleR + manual curation
7. Differential: pseudobulk DESeq2 or MAST per cell type
8. Visualization: UMAP, dot plots, feature plots`,
    software: ["Cell Ranger", "Seurat", "Harmony", "SingleR", "SCENIC"],
    parameters: { resolution: 0.8, minPct: 0.25 },
    references: [
      "Hao Y, et al. Cell 2021 (Seurat v5)",
      "Korsunsky I, et al. Nature Methods 2019 (Harmony)",
    ],
  },
  {
    id: "meth-004",
    name: "WHO Semen Analysis Protocol",
    category: "Semen Parameters",
    description:
      "Reference laboratory protocol for standard semen parameter measurement per WHO 6th edition.",
    protocol: `1. Collection: masturbation after 2–7 days abstinence
2. Liquefaction: 37°C, ≤60 min
3. Volume: graduated pipette (≥1.4 mL reference)
4. Concentration: improved Neubauer hemocytometer
5. Motility: progressive + non-progressive + immotile (≥42% PR)
6. Morphology: Papanicolaou/Kruger strict (≥4% normal forms)
7. Vitality: eosin-nigrosin if motility <40%
8. Optional: DNA fragmentation (TUNEL/SCD), oxidative stress (ROS)`,
    software: ["Manual counting", "CASA systems (optional)"],
    parameters: {
      abstinenceDays: "2-7",
      liquefactionMin: 60,
      refConcentration: "16e6/mL",
    },
    references: ["WHO Laboratory Manual 6th Edition, 2021"],
  },
  {
    id: "meth-005",
    name: "Sperm DNA Methylation (450K/EPIC)",
    category: "Epigenomics",
    description:
      "Array-based DNA methylation analysis for sperm epigenetic biomarkers in infertility.",
    protocol: `1. DNA extraction: phenol-chloroform or column-based from sperm pellets
2. Bisulfite conversion: Zymo EZ DNA Methylation Kit
3. Hybridization: Illumina 450K or EPIC array
4. QC: min detection p-value < 0.01, remove SNP probes
5. Normalization: BMIQ or noob (minfi package)
6. DMP calling: limma on M-values (Δβ ≥ 0.1, FDR < 0.05)
7. Annotation: UCSC + FANTOM5 promoters
8. Validation: pyrosequencing of top DMPs`,
    software: ["minfi", "ChAMP", "limma", "IGV"],
    parameters: { deltaBeta: 0.1, fdr: 0.05 },
    references: [
      "Aryee MJ, et al. Bioinformatics 2014 (minfi)",
      "Morris TJ, et al. Bioinformatics 2014 (ChAMP)",
    ],
  },
  {
    id: "meth-006",
    name: "Pathway Enrichment (GSEA/clusterProfiler)",
    category: "Functional Analysis",
    description:
      "Gene set enrichment for infertility-related omics results using curated pathway databases.",
    protocol: `1. Input: ranked gene list (by log2FC or -log10 p-value)
2. Databases: GO-BP, KEGG, Reactome, MSigDB (Hallmark)
3. Method: GSEA (fgsea) or ORA (hypergeometric)
4. Correction: Benjamini-Hochberg FDR
5. Threshold: padj < 0.05, |NES| > 1.5 (GSEA)
6. Visualization: dot plot, cnetplot, emapplot
7. Sperm-specific: cross-reference SperMD gene lists`,
    software: ["clusterProfiler", "fgsea", "Enrichr", "Cytoscape"],
    parameters: { fdr: 0.05, nes: 1.5 },
    references: [
      "Yu G, et al. OMICS 2012 (clusterProfiler)",
      "Subramanian A, et al. PNAS 2005 (GSEA)",
    ],
  },
];

export const figures: Figure[] = [
  {
    id: "fig-001",
    publicationId: "pub-004",
    datasetId: "ds-003",
    methodId: "meth-002",
    title: "Volcano Plot: Idiopathic vs Control (Sperm Proteomics)",
    figureType: "volcano",
    caption:
      "Differentially expressed proteins in idiopathic infertile vs control sperm (SWATH-MS, n=69). Red: upregulated (FC>1.5, padj<0.05); blue: downregulated.",
    isPublicationReady: true,
    data: {
      points: [
        { name: "AKAP4", log2FC: 2.1, negLog10P: 4.2, significant: true, direction: "up" },
        { name: "PRM1", log2FC: -1.8, negLog10P: 3.8, significant: true, direction: "down" },
        { name: "SPAG16", log2FC: 1.6, negLog10P: 3.1, significant: true, direction: "up" },
        { name: "TNP1", log2FC: -2.3, negLog10P: 5.1, significant: true, direction: "down" },
        { name: "ODF1", log2FC: 1.4, negLog10P: 2.9, significant: true, direction: "up" },
        { name: "ACTB", log2FC: 0.2, negLog10P: 0.5, significant: false, direction: "ns" },
        { name: "GAPDH", log2FC: -0.1, negLog10P: 0.3, significant: false, direction: "ns" },
        { name: "HSP90AA1", log2FC: 0.8, negLog10P: 1.2, significant: false, direction: "ns" },
        { name: "CATSPER1", log2FC: -1.2, negLog10P: 2.1, significant: false, direction: "down" },
        { name: "CRISP2", log2FC: 1.9, negLog10P: 3.5, significant: true, direction: "up" },
      ],
    },
  },
  {
    id: "fig-002",
    publicationId: "pub-001",
    datasetId: "ds-001",
    methodId: "meth-003",
    title: "Omics Type Distribution Across Library",
    figureType: "bar",
    caption: "Number of curated public datasets by omics modality in the resource library.",
    isPublicationReady: true,
    data: {
      categories: [
        { name: "Transcriptomics", count: 3 },
        { name: "Proteomics", count: 2 },
        { name: "Single-cell", count: 2 },
        { name: "Epigenomics", count: 1 },
        { name: "Semen Parameters", count: 1 },
        { name: "Multi-omics", count: 1 },
      ],
    },
  },
  {
    id: "fig-003",
    publicationId: "pub-002",
    datasetId: "ds-005",
    methodId: "meth-006",
    title: "Top Enriched Pathways (Sperm Infertility Meta-analysis)",
    figureType: "pathway",
    caption: "GO Biological Process enrichment from aggregated DE genes across sperm transcriptomic studies.",
    isPublicationReady: true,
    data: {
      pathways: [
        { name: "Spermatogenesis", geneRatio: "42/180", pValue: 1.2e-12, count: 42 },
        { name: "Cilium assembly", geneRatio: "28/180", pValue: 3.4e-9, count: 28 },
        { name: "Oxidative phosphorylation", geneRatio: "24/180", pValue: 8.1e-8, count: 24 },
        { name: "Protein folding", geneRatio: "19/180", pValue: 2.3e-6, count: 19 },
        { name: "Cellular respiration", geneRatio: "17/180", pValue: 5.6e-6, count: 17 },
        { name: "Microtubule-based movement", geneRatio: "15/180", pValue: 1.1e-5, count: 15 },
        { name: "DNA repair", geneRatio: "14/180", pValue: 3.2e-5, count: 14 },
        { name: "Apoptotic process", geneRatio: "12/180", pValue: 8.9e-5, count: 12 },
      ],
    },
  },
  {
    id: "fig-004",
    publicationId: "pub-007",
    datasetId: "ds-008",
    methodId: "meth-004",
    title: "WHO 6th Edition Semen Reference Values",
    figureType: "table",
    caption: "Lower reference limits (5th centile) for semen parameters from WHO 2021 manual.",
    isPublicationReady: true,
    data: {
      columns: ["Parameter", "Reference Limit", "Unit", "Method"],
      rows: [
        ["Semen volume", "1.4", "mL", "Graduated pipette"],
        ["Sperm concentration", "16", "×10⁶/mL", "Hemocytometer"],
        ["Total sperm count", "39", "×10⁶/ejaculate", "Calculated"],
        ["Progressive motility (PR)", "30", "%", "Manual/CASA"],
        ["Total motility (PR+NP)", "42", "%", "Manual/CASA"],
        ["Normal morphology", "4", "%", "Strict Kruger"],
        ["Vitality (eosin)", "54", "% live", "Eosin-nigrosin"],
        ["pH", "7.2", "—", "pH paper"],
      ],
    },
  },
  {
    id: "fig-005",
    publicationId: "pub-003",
    datasetId: "ds-002",
    methodId: "meth-001",
    title: "PCA: Sperm mRNA Profiles (Infertile vs Fertile)",
    figureType: "pca",
    caption: "Principal component analysis of sperm transcriptomes (GSE281732). Clear separation on PC1 (32% variance).",
    isPublicationReady: true,
    data: {
      points: [
        { x: -3.2, y: 1.1, group: "Fertile", sample: "F1" },
        { x: -2.8, y: 0.9, group: "Fertile", sample: "F2" },
        { x: -3.5, y: 1.4, group: "Fertile", sample: "F3" },
        { x: -2.1, y: 0.6, group: "Fertile", sample: "F4" },
        { x: 2.8, y: -1.2, group: "Infertile", sample: "I1" },
        { x: 3.1, y: -0.8, group: "Infertile", sample: "I2" },
        { x: 2.5, y: -1.5, group: "Infertile", sample: "I3" },
        { x: 3.4, y: -0.5, group: "Infertile", sample: "I4" },
        { x: 2.9, y: -1.1, group: "Infertile", sample: "I5" },
      ],
      variance: { pc1: 32, pc2: 18 },
    },
  },
];

export const measurements: Measurement[] = [
  {
    id: "m-001",
    datasetId: "ds-003",
    featureName: "AKAP4",
    featureType: "protein",
    groupA: "Control",
    groupB: "Idiopathic",
    valueA: 1.0,
    valueB: 0.35,
    foldChange: 0.35,
    pValue: 0.00012,
    adjPValue: 0.003,
    unit: "relative abundance",
  },
  {
    id: "m-002",
    datasetId: "ds-003",
    featureName: "PRM1",
    featureType: "protein",
    groupA: "Control",
    groupB: "Idiopathic",
    valueA: 1.0,
    valueB: 0.28,
    foldChange: 0.28,
    pValue: 0.00008,
    adjPValue: 0.002,
    unit: "relative abundance",
  },
  {
    id: "m-003",
    datasetId: "ds-008",
    featureName: "Sperm concentration",
    featureType: "semen_parameter",
    groupA: "Reference (5th centile)",
    groupB: "Oligozoospermic threshold",
    valueA: 16,
    valueB: 15,
    unit: "×10⁶/mL",
  },
  {
    id: "m-004",
    datasetId: "ds-008",
    featureName: "Progressive motility",
    featureType: "semen_parameter",
    groupA: "Reference (5th centile)",
    groupB: "Asthenozoospermic threshold",
    valueA: 30,
    valueB: 32,
    unit: "%",
  },
  {
    id: "m-005",
    datasetId: "ds-002",
    featureName: "DDX4 (VASA)",
    featureType: "gene",
    groupA: "Fertile",
    groupB: "Idiopathic infertile",
    valueA: 1.0,
    valueB: 0.42,
    foldChange: 0.42,
    pValue: 0.001,
    adjPValue: 0.015,
    unit: "TPM",
  },
  {
    id: "m-006",
    datasetId: "ds-009",
    featureName: "MTHFR promoter",
    featureType: "CpG site",
    groupA: "Fertile",
    groupB: "Oligozoospermic",
    valueA: 0.72,
    valueB: 0.58,
    foldChange: -0.14,
    pValue: 0.003,
    adjPValue: 0.04,
    unit: "β value",
  },
];

export function getPublicationById(id: string) {
  return publications.find((p) => p.id === id);
}

export function getDatasetById(id: string) {
  return datasets.find((d) => d.id === id);
}

export function getMethodById(id: string) {
  return methods.find((m) => m.id === id);
}

export function getFiguresForDataset(datasetId: string) {
  return figures.filter((f) => f.datasetId === datasetId);
}

export function getMeasurementsForDataset(datasetId: string) {
  return measurements.filter((m) => m.datasetId === datasetId);
}

export function getDatasetsForPublication(publicationId: string) {
  return datasets.filter((d) => d.publicationId === publicationId);
}

export function searchLibrary(query: string) {
  const q = query.toLowerCase();
  return {
    publications: publications.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.authors.toLowerCase().includes(q) ||
        p.keywords?.some((k) => k.toLowerCase().includes(q))
    ),
    datasets: datasets.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.accession.toLowerCase().includes(q) ||
        d.phenotype?.toLowerCase().includes(q)
    ),
    methods: methods.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    ),
  };
}

export function getDashboardStats() {
  const omicsCounts = datasets.reduce(
    (acc, d) => {
      acc[d.omicsType] = (acc[d.omicsType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const yearCounts = publications.reduce(
    (acc, p) => {
      acc[p.year] = (acc[p.year] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  const tissueCounts = datasets.reduce(
    (acc, d) => {
      acc[d.tissue] = (acc[d.tissue] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalPublications: publications.length,
    totalDatasets: datasets.length,
    totalMethods: methods.length,
    totalFigures: figures.length,
    omicsBreakdown: Object.entries(omicsCounts).map(([type, count]) => ({
      type: type as Dataset["omicsType"],
      count,
    })),
    yearBreakdown: Object.entries(yearCounts)
      .map(([year, count]) => ({ year: Number(year), count }))
      .sort((a, b) => a.year - b.year),
    tissueBreakdown: Object.entries(tissueCounts).map(([tissue, count]) => ({
      tissue: tissue as Dataset["tissue"],
      count,
    })),
  };
}
