import type { Dataset, Measurement } from "@/lib/types";
import { datasets as seedDatasets, getDatasetById, getMeasurementsForDataset } from "@/lib/data/seed";
import { getDatasetsPage } from "@/lib/data/library";
import {
  ANALYZABLE_ACCESSIONS,
  hasAnalysisData,
  resolveMeasurements,
} from "./catalog";
import {
  resolveRawAccession,
  repositoryForAccession,
  sourceLabel,
} from "@/lib/raw-data/accession";

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

export type RawCapableStudy = Dataset & {
  variableCount: number;
  rawAccession: string;
};

/** All library datasets with GEO / ArrayExpress / PRIDE accessions (~230+). */
export async function getRawCapableStudies(): Promise<RawCapableStudy[]> {
  const page = await getDatasetsPage({ limit: 2000 });
  const seen = new Set<string>();
  const studies: RawCapableStudy[] = [];

  for (const dataset of page.rows) {
    const rawAccession = resolveRawAccession(dataset);
    if (!rawAccession || seen.has(rawAccession)) continue;
    seen.add(rawAccession);

    studies.push({
      ...dataset,
      accession: rawAccession,
      repository: repositoryForAccession(rawAccession),
      rawAccession,
      variableCount: 0,
      url: dataset.url ?? undefined,
    });
  }

  return studies.sort((a, b) => a.rawAccession.localeCompare(b.rawAccession));
}

export { hasAnalysisData, sourceLabel as rawSourceLabel };
