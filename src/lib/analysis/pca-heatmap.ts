import type { ParsedSeriesMatrix } from "@/lib/raw-data/parse-series-matrix";

export interface PCAPoint {
  x: number;
  y: number;
  group: string;
  sample: string;
}

export interface PCAResult {
  points: PCAPoint[];
  variance: { pc1: number; pc2: number };
}

/** PCA on log2(expression + 1) for selected samples. */
export function computePCA(
  matrix: ParsedSeriesMatrix,
  sampleIds: string[],
  groupLabels: Record<string, string>
): PCAResult {
  const genes = matrix.genes.slice(0, Math.min(2000, matrix.genes.length));
  const n = sampleIds.length;
  if (n < 3 || genes.length < 10) {
    return { points: [], variance: { pc1: 0, pc2: 0 } };
  }

  const data: number[][] = genes.map((g) => {
    const row = matrix.values[g] ?? {};
    return sampleIds.map((s) => Math.log2((row[s] ?? 0) + 1));
  });

  const m = genes.length;
  const means = sampleIds.map((_, j) => {
    let s = 0;
    for (let i = 0; i < m; i++) s += data[i][j];
    return s / m;
  });

  const centered = data.map((row) => row.map((v, j) => v - means[j]));

  // Covariance matrix (samples x samples) — use top variance genes only for speed
  const cov: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let s = 0;
      for (let g = 0; g < m; g++) s += centered[g][i] * centered[g][j];
      const v = s / (m - 1);
      cov[i][j] = v;
      cov[j][i] = v;
    }
  }

  const { eigenvalues, eigenvectors } = powerIteration2x2(cov, n);
  const totalVar = eigenvalues.reduce((a, b) => a + Math.abs(b), 0) || 1;

  const points: PCAPoint[] = sampleIds.map((sid, idx) => ({
    x: Number(eigenvectors[0][idx].toFixed(4)),
    y: Number(eigenvectors[1][idx].toFixed(4)),
    group: groupLabels[sid] ?? "Sample",
    sample: matrix.samples.find((s) => s.id === sid)?.title ?? sid,
  }));

  return {
    points,
    variance: {
      pc1: Number(((Math.abs(eigenvalues[0]) / totalVar) * 100).toFixed(1)),
      pc2: Number(((Math.abs(eigenvalues[1]) / totalVar) * 100).toFixed(1)),
    },
  };
}

function powerIteration2x2(cov: number[][], n: number) {
  const v1 = Array(n).fill(1 / Math.sqrt(n));
  const v2 = Array(n).fill(0);
  v2[0] = 1;

  for (let iter = 0; iter < 40; iter++) {
    const w1 = matVec(cov, v1);
    normalize(w1);
    for (let i = 0; i < n; i++) v1[i] = w1[i];

    const deflated = deflate(cov, v1);
    const w2 = matVec(deflated, v2);
    orthogonalize(w2, v1);
    normalize(w2);
    for (let i = 0; i < n; i++) v2[i] = w2[i];
  }

  const ev1 = dot(v1, matVec(cov, v1));
  const ev2 = dot(v2, matVec(deflate(cov, v1), v2));
  return { eigenvalues: [ev1, ev2], eigenvectors: [v1, v2] };
}

function matVec(m: number[][], v: number[]): number[] {
  return m.map((row) => row.reduce((s, x, i) => s + x * v[i], 0));
}

function dot(a: number[], b: number[]): number {
  return a.reduce((s, x, i) => s + x * b[i], 0);
}

function normalize(v: number[]) {
  const n = Math.sqrt(dot(v, v)) || 1;
  for (let i = 0; i < v.length; i++) v[i] /= n;
}

function orthogonalize(v: number[], ref: number[]) {
  const proj = dot(v, ref);
  for (let i = 0; i < v.length; i++) v[i] -= proj * ref[i];
}

function deflate(m: number[][], v: number[]): number[][] {
  const lambda = dot(v, matVec(m, v));
  return m.map((row, i) =>
    row.map((x, j) => x - lambda * v[i] * v[j])
  );
}

export interface HeatmapCell {
  gene: string;
  sample: string;
  value: number;
  group: string;
}

export function buildHeatmapData(opts: {
  matrix: ParsedSeriesMatrix;
  topGenes: string[];
  sampleIds: string[];
  groupLabels: Record<string, string>;
}): { genes: string[]; samples: string[]; cells: HeatmapCell[]; min: number; max: number } {
  const { matrix, topGenes, sampleIds, groupLabels } = opts;
  const genes = topGenes.slice(0, 30);
  const cells: HeatmapCell[] = [];
  let min = Infinity;
  let max = -Infinity;

  for (const gene of genes) {
    const row = matrix.values[gene] ?? {};
    const vals = sampleIds.map((s) => Math.log2((row[s] ?? 0) + 1));
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length) || 1;

    for (let i = 0; i < sampleIds.length; i++) {
      const z = (vals[i] - mean) / sd;
      min = Math.min(min, z);
      max = Math.max(max, z);
      cells.push({
        gene,
        sample: sampleIds[i],
        value: Number(z.toFixed(3)),
        group: groupLabels[sampleIds[i]] ?? "",
      });
    }
  }

  return { genes, samples: sampleIds, cells, min, max: max === -Infinity ? 1 : max };
}
