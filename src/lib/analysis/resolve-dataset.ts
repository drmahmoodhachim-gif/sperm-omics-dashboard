import type { Dataset, Measurement } from "@/lib/types";
import { datasets as seedDatasets, getDatasetById, getMeasurementsForDataset } from "@/lib/data/seed";
import { getDatasetsPage } from "@/lib/data/library";
import {
  ANALYZABLE_ACCESSIONS,
  hasAnalysisData,
  resolveMeasurements,
} from "./catalog";

export async function getDatasetByIdAsync(idOrAccession: string): Promise<Dataset | null> {
  const seed =
    getDatasetById(idOrAccession) ??
    seedDatasets.find((d) => d.accession === idOrAccession) ??
    null;
  if (seed) return seed;

  const page = await getDatasetsPage({ search: idOrAccession, limit: 20 });
  return (
    page.rows.find((d) => d.id === idOrAccession || d.accession === idOrAccession) ?? null
  );
}

export async function getMeasurementsForDatasetAsync(
  dataset: Dataset
): Promise<Measurement[]> {
  const fromCatalog = resolveMeasurements(dataset);
  if (fromCatalog.length > 0) return fromCatalog;

  const seed = getMeasurementsForDataset(dataset.id);
  if (seed.length > 0) return seed;

  return [];
}

export async function getAnalyzableStudies(): Promise<(Dataset & { variableCount: number })[]> {
  const studies: (Dataset & { variableCount: number })[] = [];

  for (const accession of ANALYZABLE_ACCESSIONS) {
    const dataset = await getDatasetByIdAsync(accession);
    if (!dataset) continue;
    const measurements = resolveMeasurements(dataset);
    studies.push({ ...dataset, variableCount: measurements.length });
  }

  return studies;
}

export { hasAnalysisData };
