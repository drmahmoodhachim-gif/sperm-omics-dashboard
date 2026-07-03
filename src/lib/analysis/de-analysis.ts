import { benjaminiHochberg } from "@/lib/analysis/fdr";
import type { ParsedSeriesMatrix } from "@/lib/raw-data/parse-series-matrix";

export interface DEResult {
  gene: string;
  log2FC: number;
  pValue: number;
  adjPValue: number;
  meanA: number;
  meanB: number;
  significant: boolean;
  direction: "up" | "down" | "ns";
}

function welchP(a: number[], b: number[]): number {
  const na = a.length;
  const nb = b.length;
  if (na < 2 || nb < 2) return 1;

  const meanA = a.reduce((s, v) => s + v, 0) / na;
  const meanB = b.reduce((s, v) => s + v, 0) / nb;
  const varA = a.reduce((s, v) => s + (v - meanA) ** 2, 0) / (na - 1);
  const varB = b.reduce((s, v) => s + (v - meanB) ** 2, 0) / (nb - 1);
  const se = Math.sqrt(varA / na + varB / nb);
  if (se === 0) return 1;

  const t = Math.abs(meanA - meanB) / se;
  const df =
    (varA / na + varB / nb) ** 2 /
    ((varA / na) ** 2 / (na - 1) + (varB / nb) ** 2 / (nb - 1));

  return 2 * (1 - tDistCdf(t, df));
}

function tDistCdf(t: number, df: number): number {
  const x = df / (df + t * t);
  return 1 - 0.5 * incompleteBeta(df / 2, 0.5, x);
}

function incompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lnBeta = lgamma(a) + lgamma(b) - lgamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta) / a;
  let f = 1;
  let c = 1;
  let d = 0;
  for (let i = 0; i <= 200; i++) {
    const m = Math.floor(i / 2);
    let num: number;
    if (i === 0) num = 1;
    else if (i % 2 === 0) {
      num = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    } else {
      num = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    }
    d = 1 + num * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    c = 1 + num / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    f *= c * d;
    if (Math.abs(c * d - 1) < 1e-8) break;
  }
  return front * (f - 1);
}

function lgamma(z: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

export function runDifferentialExpression(opts: {
  matrix: ParsedSeriesMatrix;
  groupA: string[];
  groupB: string[];
  genes?: string[];
  logOffset?: number;
  fdrThreshold?: number;
}): DEResult[] {
  const { matrix, groupA, groupB, genes, logOffset = 1, fdrThreshold = 0.05 } = opts;
  if (groupA.length < 2 || groupB.length < 2) {
    throw new Error("Each group needs at least 2 samples");
  }

  const targetGenes = genes?.length
    ? genes.filter((g) => matrix.values[g])
    : matrix.genes;

  const raw: Omit<DEResult, "adjPValue" | "significant" | "direction">[] = [];

  for (const gene of targetGenes) {
    const row = matrix.values[gene];
    if (!row) continue;

    const valsA = groupA.map((s) => row[s]).filter((v) => v != null);
    const valsB = groupB.map((s) => row[s]).filter((v) => v != null);
    if (valsA.length < 2 || valsB.length < 2) continue;

    const logA = valsA.map((v) => Math.log2(v + logOffset));
    const logB = valsB.map((v) => Math.log2(v + logOffset));
    const meanA = logA.reduce((s, v) => s + v, 0) / logA.length;
    const meanB = logB.reduce((s, v) => s + v, 0) / logB.length;
    const log2FC = meanB - meanA;
    const pValue = welchP(logA, logB);

    raw.push({
      gene,
      log2FC: Number(log2FC.toFixed(4)),
      pValue: Math.max(pValue, 1e-300),
      meanA: Number(meanA.toFixed(4)),
      meanB: Number(meanB.toFixed(4)),
    });
  }

  const adj = benjaminiHochberg(raw.map((r) => r.pValue));

  return raw
    .map((r, i) => {
      const adjPValue = adj[i];
      const significant = adjPValue < fdrThreshold && Math.abs(r.log2FC) >= 0.58;
      return {
        ...r,
        adjPValue: Number(adjPValue.toExponential(3)),
        significant,
        direction: significant ? (r.log2FC > 0 ? "up" : "down") : "ns",
      } as DEResult;
    })
    .sort((a, b) => a.pValue - b.pValue);
}

export function deToVolcano(results: DEResult[]) {
  return results.map((r) => ({
    name: r.gene,
    log2FC: r.log2FC,
    negLog10P: Number((-Math.log10(r.adjPValue || r.pValue)).toFixed(4)),
    significant: r.significant,
    direction: r.direction,
  }));
}
