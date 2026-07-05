import type { Dataset, Method, Publication } from "@/lib/types";

export type ResearchTemplateId =
  | "differential_expression"
  | "biomarker_discovery"
  | "mechanism_pathway"
  | "cross_omics"
  | "clinical_association"
  | "sperm_quality";

export interface ResearchTemplate {
  id: ResearchTemplateId;
  label: string;
  description: string;
  hypothesisStem: string;
  defaultFigures: string[];
  methodCategories: string[];
}

export interface ScoredPublication extends Publication {
  score: number;
  matchReasons: string[];
}

export interface ScoredDataset extends Dataset {
  score: number;
  matchReasons: string[];
  analysisUrl: string;
  rawAnalysisUrl?: string;
}

export interface FigurePlan {
  panel: string;
  figureType: string;
  title: string;
  description: string;
  suggestedDataset?: string;
}

export interface ValidationSuggestion {
  type: "in_vitro" | "in_vivo";
  title: string;
  rationale: string;
  readouts: string[];
}

export interface ResearchPlan {
  question: string;
  templateId: ResearchTemplateId;
  templateLabel: string;
  hypothesis: string;
  specificAims: string[];
  predictions: string[];
  publications: ScoredPublication[];
  datasets: ScoredDataset[];
  materialsAndMethods: string;
  methodsUsed: Pick<Method, "id" | "name" | "category">[];
  figurePlan: FigurePlan[];
  validations: ValidationSuggestion[];
  analysisLinks: { label: string; href: string }[];
}
