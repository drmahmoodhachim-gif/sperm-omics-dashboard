/** Benjamini–Hochberg FDR correction. Returns adjusted p-values in original order. */
export function benjaminiHochberg(pValues: number[]): number[] {
  const n = pValues.length;
  if (n === 0) return [];

  const indexed = pValues.map((p, i) => ({ p: Math.min(Math.max(p, 0), 1), i }));
  indexed.sort((a, b) => a.p - b.p);

  const adj = new Array<number>(n);
  let minSoFar = 1;
  for (let k = n - 1; k >= 0; k--) {
    const rank = k + 1;
    const raw = (indexed[k].p * n) / rank;
    minSoFar = Math.min(minSoFar, raw);
    adj[indexed[k].i] = Math.min(minSoFar, 1);
  }
  return adj;
}
