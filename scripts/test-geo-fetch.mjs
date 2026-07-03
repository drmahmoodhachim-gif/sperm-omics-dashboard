import { fetchGeoSeriesMatrix } from "../src/lib/raw-data/geo-fetch.ts";

const gses = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["GSE145068", "GSE100001", "GSE281732", "GSE73747"];

for (const g of gses) {
  const t0 = Date.now();
  try {
    const m = await fetchGeoSeriesMatrix(g);
    console.log(g, "OK", m.sampleCount, "samples", m.genes.length, "genes", `${Date.now() - t0}ms`);
  } catch (e) {
    console.log(g, "FAIL", e instanceof Error ? e.message : e, `${Date.now() - t0}ms`);
  }
}
