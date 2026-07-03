import { gunzipSync } from "zlib";

const gses = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["GSE73747", "GSE109916", "GSE145068", "GSE69602", "GSE253279", "GSE281732"];

function seriesUrl(gse) {
  const n = parseInt(gse.slice(3), 10);
  const bucket = Math.floor(n / 1000) || 1;
  return `https://ftp.ncbi.nlm.nih.gov/geo/series/GSE${bucket}nnn/${gse}/matrix/${gse}_series_matrix.txt.gz`;
}

for (const gse of gses) {
  try {
    const r = await fetch(seriesUrl(gse));
    if (!r.ok) {
      console.log(gse, "NO_MATRIX", r.status);
      continue;
    }
    const t = gunzipSync(Buffer.from(await r.arrayBuffer())).toString();
    let inTable = false;
    let rows = 0;
    for (const line of t.split(/\r?\n/)) {
      if (/table_begin/i.test(line)) inTable = true;
      else if (/table_end/i.test(line)) inTable = false;
      else if (inTable && line.trim()) rows++;
    }
    const supp = [];
    for (const line of t.split(/\r?\n/)) {
      if (!line.startsWith("!Series_supplementary_file")) continue;
      for (const cell of line.split("\t").slice(1)) {
        const u = cell.replace(/^"|"$/g, "").trim();
        if (u.startsWith("ftp") || u.startsWith("http")) supp.push(u.split("/").pop());
      }
    }
    const sampleSupp = (t.match(/!Sample_supplementary_file/g) || []).length;
    console.log(gse, "rows", rows, "seriesSupp", supp.length, supp.slice(0, 5), "sampleSuppLines", sampleSupp);
  } catch (e) {
    console.log(gse, "ERR", e.message);
  }
}
