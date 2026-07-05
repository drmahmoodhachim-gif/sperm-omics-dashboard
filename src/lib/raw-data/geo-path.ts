/** GEO FTP folder layout: GSE281732 → .../series/GSE281nnn/GSE281732/ */
export function geoFtpSeriesDir(accession: string): string | null {
  const m = accession.toUpperCase().match(/^GSE(\d+)$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const bucket = Math.floor(n / 1000) || 1;
  return `GSE${bucket}nnn/GSE${n}`;
}

export function geoSeriesMatrixUrl(accession: string): string | null {
  const dir = geoFtpSeriesDir(accession);
  if (!dir) return null;
  const gse = accession.toUpperCase();
  return `https://ftp.ncbi.nlm.nih.gov/geo/series/${dir}/matrix/${gse}_series_matrix.txt.gz`;
}

export function geoMinimlUrl(accession: string): string | null {
  const dir = geoFtpSeriesDir(accession);
  if (!dir) return null;
  const gse = accession.toUpperCase();
  return `https://ftp.ncbi.nlm.nih.gov/geo/series/${dir}/miniml/${gse}_family.xml.tgz`;
}

export function geoSupplDirUrl(accession: string): string | null {
  const dir = geoFtpSeriesDir(accession);
  if (!dir) return null;
  const gse = accession.toUpperCase();
  return `https://ftp.ncbi.nlm.nih.gov/geo/series/${dir}/${gse}/suppl/`;
}

export function geoSupplFileUrl(accession: string, filename: string): string | null {
  const dir = geoFtpSeriesDir(accession);
  if (!dir) return null;
  return `https://ftp.ncbi.nlm.nih.gov/geo/series/${dir}/${accession.toUpperCase()}/suppl/${filename}`;
}

export function isGeoAccession(accession: string): boolean {
  return /^GSE\d+$/i.test(accession.trim());
}

/** GSM FTP: GSM3587876 → .../samples/GSM3587nnn/GSM3587876/ */
export function geoGsmFtpDir(gsmAccession: string): string | null {
  const m = gsmAccession.toUpperCase().match(/^GSM(\d+)$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const bucket = Math.floor(n / 1000) || 1;
  return `GSM${bucket}nnn/GSM${n}`;
}

export function geoGsmSupplFileUrl(gsm: string, filename: string): string | null {
  const dir = geoGsmFtpDir(gsm);
  if (!dir) return null;
  return `https://ftp.ncbi.nlm.nih.gov/geo/samples/${dir}/suppl/${filename}`;
}
