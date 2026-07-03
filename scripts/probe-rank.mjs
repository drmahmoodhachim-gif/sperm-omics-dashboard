import { gunzipSync } from "zlib";
import { rankSupplementaryFiles } from "../src/lib/raw-data/geo-supplementary.ts";

const gse = process.argv[2] ?? "GSE145068";
const n = parseInt(gse.slice(3), 10);
const bucket = Math.floor(n / 1000) || 1;
const url = `https://ftp.ncbi.nlm.nih.gov/geo/series/GSE${bucket}nnn/${gse}/matrix/${gse}_series_matrix.txt.gz`;
const r = await fetch(url);
const t = gunzipSync(Buffer.from(await r.arrayBuffer())).toString();
const ranked = rankSupplementaryFiles(t, gse);
console.log("ranked", ranked);
